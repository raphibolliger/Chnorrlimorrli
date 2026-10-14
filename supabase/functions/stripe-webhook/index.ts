import { adminClient, Stripe, stripeClient } from '../_shared/clients.ts';
import { sendAdminNotification, sendCustomerMail } from '../_shared/order-mails.ts';

const cryptoProvider = Stripe.createSubtleCryptoProvider();

async function paymentMethodOf(
  stripe: Stripe,
  paymentIntentId: string | null,
): Promise<string | null> {
  if (!paymentIntentId) {
    return null;
  }
  const intent = await stripe.paymentIntents.retrieve(paymentIntentId, {
    expand: ['latest_charge'],
  });
  const charge = intent.latest_charge as Stripe.Charge | null;
  const details = charge?.payment_method_details;
  if (!details) {
    return intent.payment_method_types[0] ?? null;
  }
  if (details.type === 'card' && details.card?.wallet?.type) {
    return details.card.wallet.type;
  }
  return details.type;
}

async function markPaid(stripe: Stripe, session: Stripe.Checkout.Session): Promise<void> {
  const supabase = adminClient();
  const paymentIntentId =
    typeof session.payment_intent === 'string'
      ? session.payment_intent
      : (session.payment_intent?.id ?? null);
  const { data: order, error } = await supabase.rpc('mark_order_paid', {
    p_session_id: session.id,
    p_payment_intent_id: paymentIntentId,
    p_payment_method: await paymentMethodOf(stripe, paymentIntentId),
  });
  if (error) {
    throw error;
  }
  if (!order?.id) {
    return;
  }
  await sendCustomerMail(supabase, order.id, 'confirmation');
  await sendAdminNotification(supabase, order.id);
}

async function markUnpaid(sessionId: string, status: 'expired' | 'failed'): Promise<void> {
  const { error } = await adminClient().rpc('mark_order_unpaid', {
    p_session_id: sessionId,
    p_status: status,
  });
  if (error) {
    throw error;
  }
}

async function markRefunded(charge: Stripe.Charge): Promise<void> {
  if (!charge.refunded) {
    return;
  }
  const paymentIntentId =
    typeof charge.payment_intent === 'string' ? charge.payment_intent : charge.payment_intent?.id;
  if (!paymentIntentId) {
    return;
  }
  const { error } = await adminClient().rpc('mark_order_refunded', {
    p_payment_intent_id: paymentIntentId,
  });
  if (error) {
    throw error;
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
    switch (event.type) {
      case 'checkout.session.completed':
      case 'checkout.session.async_payment_succeeded':
        if (event.data.object.payment_status === 'paid') {
          await markPaid(stripe, event.data.object);
        }
        break;
      case 'checkout.session.async_payment_failed':
        await markUnpaid(event.data.object.id, 'failed');
        break;
      case 'checkout.session.expired':
        await markUnpaid(event.data.object.id, 'expired');
        break;
      case 'charge.refunded':
        await markRefunded(event.data.object);
        break;
    }
  } catch (error) {
    console.error(`handling ${event.type} failed`, error);
    return new Response('Webhook handling failed', { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
