import { adminClient } from '../_shared/clients.ts';
import { corsHeaders, json } from '../_shared/cors.ts';
import { isAccessToken, orderSummaryColumns } from '../_shared/orders.ts';

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders(request) });
  }
  const code = new URL(request.url).searchParams.get('code') ?? '';
  if (!isAccessToken(code)) {
    return json(request, { error: 'not_found' }, 404);
  }

  const { data: order, error } = await adminClient()
    .from('orders')
    .select(orderSummaryColumns)
    .eq('access_token', code)
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
