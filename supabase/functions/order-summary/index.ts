import { adminClient } from '../_shared/clients.ts';
import { corsHeaders, json } from '../_shared/cors.ts';

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders(request) });
  }
  const sessionId = new URL(request.url).searchParams.get('session_id') ?? '';
  if (!/^cs_(test|live)_[A-Za-z0-9]+$/.test(sessionId)) {
    return json(request, { error: 'not_found' }, 404);
  }

  const { data: order, error } = await adminClient()
    .from('orders')
    .select(
      'order_number, payment_status, first_name, email, shipping_kind, shipping_name, subtotal_rappen, shipping_rappen, total_rappen, order_items(product_name, options, quantity, line_total_rappen)',
    )
    .eq('stripe_checkout_session_id', sessionId)
    .maybeSingle();
  if (error) {
    console.error(error);
    return json(request, { error: 'unavailable' }, 503);
  }
  if (!order) {
    return json(request, { error: 'not_found' }, 404);
  }
  return json(request, order);
});
