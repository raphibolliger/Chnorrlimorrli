import { AdminClient, adminClient, Stripe, stripeClient } from '../_shared/clients.ts';
import { sendAdminNotification, sendCustomerMail } from '../_shared/order-mails.ts';

const cryptoProvider = Stripe.createSubtleCryptoProvider();

function idOf(reference: string | { id: string } | null): string | null {
  return typeof reference === 'string' ? reference : (reference?.id ?? null);
}

async function paymentMethodOf(stripe: Stripe, paymentIntentId: string): Promise<string> {
  const intent = await stripe.paymentIntents.retrieve(paymentIntentId, {
    expand: ['latest_charge'],
  });
  const details = (intent.latest_charge as Stripe.Charge | null)?.payment_method_details;
  if (!details) {
    return intent.payment_method_types[0];
  }
  return details.card?.wallet?.type ?? details.type;
}

async function markPaid(
  supabase: AdminClient,
  stripe: Stripe,
  session: Stripe.Checkout.Session,
): Promise<void> {
  const paymentIntentId = idOf(session.payment_intent);
  if (!paymentIntentId) {
    throw new Error(`Paid checkout session ${session.id} has no payment intent`);
  }
  const { data: order } = await supabase
    .rpc('mark_order_paid', {
      p_session_id: session.id,
      p_payment_intent_id: paymentIntentId,
      p_payment_method: await paymentMethodOf(stripe, paymentIntentId),
    })
    .throwOnError();
  if (!order?.id) {
    return;
  }
  await Promise.all([
    sendCustomerMail(supabase, order.id, 'confirmation'),
    sendAdminNotification(supabase, order.id),
  ]);
}

async function markRefunded(supabase: AdminClient, charge: Stripe.Charge): Promise<void> {
  const paymentIntentId = idOf(charge.payment_intent);
  if (charge.refunded && paymentIntentId) {
    await supabase
      .rpc('mark_order_refunded', { p_payment_intent_id: paymentIntentId })
      .throwOnError();
  }
}

async function handle(supabase: AdminClient, stripe: Stripe, event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case 'checkout.session.completed':
    case 'checkout.session.async_payment_succeeded':
      if (event.data.object.payment_status === 'paid') {
        await markPaid(supabase, stripe, event.data.object);
      }
      break;
    case 'checkout.session.async_payment_failed':
      await supabase
        .rpc('mark_order_unpaid', { p_session_id: event.data.object.id, p_status: 'failed' })
        .throwOnError();
      break;
    case 'checkout.session.expired':
      await supabase
        .rpc('mark_order_unpaid', { p_session_id: event.data.object.id, p_status: 'expired' })
        .throwOnError();
      break;
    case 'charge.refunded':
      await markRefunded(supabase, event.data.object);
      break;
  }
}

Deno.serve(async (request) => {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }
  const signature = request.headers.get('Stripe-Signature');
  const secret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
  if (!signature || !secret) {
    return new Response('Missing signature', { status: 400 });
  }

  const stripe = stripeClient();
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      await request.text(),
      signature,
      secret,
      undefined,
      cryptoProvider,
    );
  } catch (error) {
    console.error('invalid webhook signature', error);
    return new Response('Invalid signature', { status: 400 });
  }

  try {
    await handle(adminClient(), stripe, event);
  } catch (error) {
    console.error(`handling ${event.type} failed`, error);
    return new Response('Webhook handling failed', { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
