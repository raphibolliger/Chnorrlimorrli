import {
  catalogProductColumns,
  catalogShippingMethodColumns,
  UntrustedCheckoutRequest,
  ValidatedItem,
  ValidatedOrder,
  validateCheckout,
} from '../_shared/checkout.ts';
import { adminClient, stripeClient } from '../_shared/clients.ts';
import { corsHeaders, isAllowedOrigin, json, returnBaseUrl } from '../_shared/cors.ts';
import { sendAdminNotification, sendCustomerMail } from '../_shared/order-mails.ts';
import { optionsText, orderPagePath } from '../_shared/orders.ts';

const unavailable = 'Der Shop ist gerade nicht erreichbar. Bitte versuche es später noch einmal.';
const paymentFailed =
  'Die Zahlung konnte nicht gestartet werden. Bitte versuche es später noch einmal.';

function publicImageUrls(path: string | null): string[] | undefined {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  return path && supabaseUrl.startsWith('https://')
    ? [`${supabaseUrl}/storage/v1/object/public/product-images/${path}`]
    : undefined;
}

function lineItems(order: ValidatedOrder, items: ValidatedItem[]) {
  const products = items.map((item) => ({
    quantity: item.quantity,
    price_data: {
      currency: 'chf',
      unit_amount: item.unit_price_rappen,
      product_data: {
        name: item.product_name,
        description: optionsText(item.options) || undefined,
        images: publicImageUrls(item.image_path),
      },
    },
  }));
  const shipping = {
    quantity: 1,
    price_data: {
      currency: 'chf',
      unit_amount: order.shipping_rappen,
      product_data: { name: order.shipping_name },
    },
  };
  return order.shipping_rappen > 0 ? [...products, shipping] : products;
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders(request) });
  }
  if (request.method !== 'POST') {
    return json(request, { errors: ['Methode nicht erlaubt.'] }, 405);
  }
  if (!isAllowedOrigin(request.headers.get('Origin'))) {
    return json(request, { errors: ['Herkunft nicht erlaubt.'] }, 403);
  }

  const body: UntrustedCheckoutRequest | null = await request.json().catch(() => null);
  if (typeof body !== 'object' || body === null) {
    return json(request, { errors: ['Ungültige Anfrage.'] }, 400);
  }

  const supabase = adminClient();
  const productIds = [
    ...new Set((body.items ?? []).map((item) => item?.productId).filter(Boolean)),
  ];
  const catalog = await Promise.all([
    supabase.from('products').select(catalogProductColumns).in('id', productIds).throwOnError(),
    supabase.from('shipping_methods').select(catalogShippingMethodColumns).throwOnError(),
  ]).catch((error) => {
    console.error(error);
    return null;
  });
  if (!catalog) {
    return json(request, { errors: [unavailable] }, 503);
  }

  const [{ data: products }, { data: methods }] = catalog;
  const validation = validateCheckout(body, products, methods);
  if (!validation.ok) {
    return json(request, { errors: validation.errors }, 422);
  }

  const { data: order, error: orderError } = await supabase.rpc('create_order', {
    p_order: validation.order,
    p_items: validation.items,
  });
  if (orderError || !order) {
    console.error(orderError);
    return json(request, { errors: ['Die Bestellung konnte nicht angelegt werden.'] }, 500);
  }

  const baseUrl = returnBaseUrl(body.returnBaseUrl);
  const orderPageUrl = `${baseUrl}/${orderPagePath(order.access_token)}&neu=1`;
  if (validation.order.payment_method === 'cash') {
    await Promise.all([
      sendCustomerMail(supabase, order.id, 'confirmation'),
      sendAdminNotification(supabase, order.id),
    ]);
    return json(request, { url: orderPageUrl });
  }

  const metadata = { order_id: order.id, order_number: String(order.order_number) };
  try {
    const session = await stripeClient().checkout.sessions.create({
      mode: 'payment',
      currency: 'chf',
      locale: 'de',
      customer_email: validation.order.email,
      client_reference_id: order.id,
      metadata,
      payment_intent_data: {
        description: `Chnorrlimorrli Bestellung ${order.order_number}`,
        metadata,
      },
      line_items: lineItems(validation.order, validation.items),
      success_url: orderPageUrl,
      cancel_url: `${baseUrl}/kasse?abgebrochen=1`,
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
    });
    await supabase
      .rpc('attach_checkout_session', { p_order_id: order.id, p_session_id: session.id })
      .throwOnError();
    return json(request, { url: session.url });
  } catch (error) {
    console.error('stripe checkout failed', error);
    await supabase.rpc('log_order_event', {
      p_order_id: order.id,
      p_kind: 'checkout_failed',
      p_detail: String(error),
    });
    return json(request, { errors: [paymentFailed] }, 502);
  }
});
