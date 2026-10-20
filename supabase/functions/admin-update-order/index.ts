import { createClient } from 'npm:@supabase/supabase-js@2';
import { AdminClient, adminClient, stripeClient } from '../_shared/clients.ts';
import { corsHeaders, json } from '../_shared/cors.ts';
import { sendCustomerMail } from '../_shared/order-mails.ts';
import {
  FulfillmentAction,
  fulfillmentMailKinds,
  OrderUpdateRequest,
  OrderUpdateResult,
  sendsCustomerMail,
  TableRow,
} from '../_shared/orders.ts';

type OrderState = Pick<
  TableRow<'orders'>,
  'id' | 'payment_status' | 'paid_at' | 'stripe_payment_intent_id' | 'stripe_checkout_session_id'
>;

function isFulfillmentAction(action: unknown): action is FulfillmentAction {
  return typeof action === 'string' && action in fulfillmentMailKinds;
}

async function isAdmin(request: Request): Promise<boolean> {
  const authorization = request.headers.get('Authorization');
  if (!authorization) {
    return false;
  }
  const userClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY') ?? request.headers.get('apikey') ?? '',
    {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );
  const { data, error } = await userClient.rpc('is_admin');
  return !error && data === true;
}

async function expireCheckoutSession(sessionId: string): Promise<void> {
  try {
    await stripeClient().checkout.sessions.expire(sessionId);
  } catch (error) {
    console.warn('session could not be expired', error);
  }
}

async function cancel(
  supabase: AdminClient,
  order: OrderState,
  notify: boolean,
): Promise<OrderUpdateResult> {
  const refundableIntent = order.payment_status === 'paid' ? order.stripe_payment_intent_id : null;
  if (refundableIntent) {
    await stripeClient().refunds.create({ payment_intent: refundableIntent });
  } else if (order.payment_status === 'pending' && order.stripe_checkout_session_id) {
    await expireCheckoutSession(order.stripe_checkout_session_id);
  }
  const refunded = refundableIntent !== null;
  await supabase.rpc('cancel_order', { p_order_id: order.id, p_refunded: refunded }).throwOnError();
  const mailed =
    notify &&
    sendsCustomerMail('cancel', order) &&
    (await sendCustomerMail(supabase, order.id, 'cancelled'));
  return { refunded, mailed };
}

async function fulfil(
  supabase: AdminClient,
  order: OrderState,
  action: FulfillmentAction,
  trackingNumber: string,
  notify: boolean,
): Promise<OrderUpdateResult> {
  await supabase
    .rpc('set_fulfillment_status', {
      p_order_id: order.id,
      p_status: action,
      p_tracking_number: trackingNumber,
    })
    .throwOnError();
  const mail = fulfillmentMailKinds[action];
  const mailed = notify && mail !== null && (await sendCustomerMail(supabase, order.id, mail));
  return { refunded: false, mailed };
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders(request) });
  }
  if (request.method !== 'POST') {
    return json(request, { error: 'Methode nicht erlaubt.' }, 405);
  }
  if (!(await isAdmin(request))) {
    return json(request, { error: 'Keine Berechtigung.' }, 403);
  }

  const body: Partial<OrderUpdateRequest> | null = await request.json().catch(() => null);
  const action = body?.action;
  if (!body?.orderId || !(action === 'cancel' || isFulfillmentAction(action))) {
    return json(request, { error: 'Bestellung und Aktion fehlen.' }, 400);
  }

  const supabase = adminClient();
  const { data: order } = await supabase
    .from('orders')
    .select('id, payment_status, paid_at, stripe_payment_intent_id, stripe_checkout_session_id')
    .eq('id', body.orderId)
    .maybeSingle();
  if (!order) {
    return json(request, { error: 'Bestellung nicht gefunden.' }, 404);
  }
  if (action !== 'cancel' && order.payment_status !== 'paid') {
    return json(request, { error: 'Nur bezahlte Bestellungen können bearbeitet werden.' }, 409);
  }

  const notify = body.sendMail !== false;
  try {
    const result =
      action === 'cancel'
        ? await cancel(supabase, order, notify)
        : await fulfil(supabase, order, action, body.trackingNumber?.trim() ?? '', notify);
    return json(request, result);
  } catch (error) {
    console.error('order update failed', error);
    return json(request, { error: 'Die Bestellung konnte nicht aktualisiert werden.' }, 500);
  }
});
