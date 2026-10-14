import { createClient } from 'npm:@supabase/supabase-js@2';
import { adminClient, stripeClient } from '../_shared/clients.ts';
import { corsHeaders, json } from '../_shared/cors.ts';
import { CustomerMailKind, sendCustomerMail } from '../_shared/order-mails.ts';

type Action = 'processing' | 'ready_for_pickup' | 'shipped' | 'delivered' | 'cancel';

const mailFor: Partial<Record<Action, CustomerMailKind>> = {
  ready_for_pickup: 'ready_for_pickup',
  shipped: 'shipped',
  delivered: 'delivered',
};

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

  const {
    orderId,
    action,
    trackingNumber,
    sendMail = true,
  } = (await request.json().catch(() => ({}))) as {
    orderId?: string;
    action?: Action;
    trackingNumber?: string;
    sendMail?: boolean;
  };
  if (!orderId || !action) {
    return json(request, { error: 'Bestellung und Aktion fehlen.' }, 400);
  }

  const supabase = adminClient();
  const { data: order, error: loadError } = await supabase
    .from('orders')
    .select(
      'id, payment_status, fulfillment_status, stripe_payment_intent_id, stripe_checkout_session_id',
    )
    .eq('id', orderId)
    .maybeSingle();
  if (loadError || !order) {
    return json(request, { error: 'Bestellung nicht gefunden.' }, 404);
  }

  try {
    if (action === 'cancel') {
      let refunded = false;
      if (order.payment_status === 'paid' && order.stripe_payment_intent_id) {
        await stripeClient().refunds.create({ payment_intent: order.stripe_payment_intent_id });
        refunded = true;
      } else if (order.payment_status === 'pending' && order.stripe_checkout_session_id) {
        try {
          await stripeClient().checkout.sessions.expire(order.stripe_checkout_session_id);
        } catch (error) {
          console.warn('session could not be expired', error);
        }
      }
      const { error } = await supabase.rpc('cancel_order', {
        p_order_id: orderId,
        p_refunded: refunded,
      });
      if (error) throw error;
      const mailed =
        sendMail && order.payment_status !== 'pending' && order.payment_status !== 'expired'
          ? await sendCustomerMail(supabase, orderId, 'cancelled', refunded)
          : false;
      return json(request, { ok: true, refunded, mailed });
    }

    if (order.payment_status !== 'paid') {
      return json(request, { error: 'Nur bezahlte Bestellungen können bearbeitet werden.' }, 409);
    }
    const { error } = await supabase.rpc('set_fulfillment_status', {
      p_order_id: orderId,
      p_status: action,
      p_tracking_number: trackingNumber?.trim() ?? '',
    });
    if (error) throw error;
    const mailKind = mailFor[action];
    const mailed =
      sendMail && mailKind ? await sendCustomerMail(supabase, orderId, mailKind) : false;
    return json(request, { ok: true, mailed });
  } catch (error) {
    console.error('order update failed', error);
    return json(request, { error: 'Die Bestellung konnte nicht aktualisiert werden.' }, 500);
  }
});
