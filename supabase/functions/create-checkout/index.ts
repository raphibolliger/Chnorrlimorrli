import {
  CatalogProduct,
  CatalogShippingMethod,
  CheckoutRequest,
  optionsLabel,
  validateCheckout,
} from '../_shared/checkout.ts';
import { adminClient, stripeClient } from '../_shared/clients.ts';
import { corsHeaders, isAllowedOrigin, json, returnBaseUrl } from '../_shared/cors.ts';

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

  let body: CheckoutRequest & { returnBaseUrl?: string };
  try {
    body = await request.json();
  } catch {
    return json(request, { errors: ['Ungültige Anfrage.'] }, 400);
  }

  const supabase = adminClient();
  const productIds = [
    ...new Set((body.items ?? []).map((item) => item?.productId).filter(Boolean)),
  ];

  const [{ data: products, error: productError }, { data: methods, error: methodError }] =
    await Promise.all([
      supabase
        .from('products')
        .select(
          'id, name, sku, price_rappen, active, track_stock, stock, product_options(name, choices), product_images(storage_path, sort_order)',
        )
        .in('id', productIds.length ? productIds : ['00000000-0000-0000-0000-000000000000']),
      supabase
        .from('shipping_methods')
        .select(
          'id, kind, name, active, postal_codes, shipping_rates(from_subtotal_rappen, price_rappen)',
        ),
    ]);
  if (productError || methodError) {
    console.error(productError ?? methodError);
    return json(
      request,
      { errors: ['Der Shop ist gerade nicht erreichbar. Bitte versuche es später noch einmal.'] },
      503,
    );
  }

  const validation = validateCheckout(
    body,
    products as CatalogProduct[],
    methods as CatalogShippingMethod[],
  );
  if (!validation.ok) {
    return json(request, { errors: validation.errors }, 422);
  }

  const { data: order, error: orderError } = await supabase.rpc('create_pending_order', {
    p_order: validation.order,
    p_items: validation.items,
  });
  if (orderError || !order) {
    console.error(orderError);
    return json(request, { errors: ['Die Bestellung konnte nicht angelegt werden.'] }, 500);
  }

  const baseUrl = returnBaseUrl(body.returnBaseUrl);
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const publicImageBase = supabaseUrl.startsWith('https://')
    ? `${supabaseUrl}/storage/v1/object/public/product-images/`
    : null;
  try {
    const session = await stripeClient().checkout.sessions.create({
      mode: 'payment',
      currency: 'chf',
      locale: 'de',
      customer_email: validation.order.email,
      client_reference_id: order.id,
      metadata: { order_id: order.id, order_number: String(order.order_number) },
      payment_intent_data: {
        description: `Chnorrlimorrli Bestellung ${order.order_number}`,
        metadata: { order_id: order.id, order_number: String(order.order_number) },
      },
      line_items: [
        ...validation.items.map((item) => ({
          quantity: item.quantity,
          price_data: {
            currency: 'chf',
            unit_amount: item.unit_price_rappen,
            product_data: {
              name: item.product_name,
              ...(Object.keys(item.options).length
                ? { description: optionsLabel(item.options) }
                : {}),
              ...(item.image_path && publicImageBase
                ? { images: [`${publicImageBase}${item.image_path}`] }
                : {}),
            },
          },
        })),
        ...(validation.order.shipping_rappen > 0
          ? [
              {
                quantity: 1,
                price_data: {
                  currency: 'chf',
                  unit_amount: validation.order.shipping_rappen,
                  product_data: { name: validation.order.shipping_name },
                },
              },
            ]
          : []),
      ],
      success_url: `${baseUrl}/bestellung/erfolg?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/kasse?abgebrochen=1`,
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
    });
    await supabase.rpc('attach_checkout_session', {
      p_order_id: order.id,
      p_session_id: session.id,
    });
    return json(request, { url: session.url });
  } catch (error) {
    console.error('stripe checkout failed', error);
    await supabase.rpc('log_order_event', {
      p_order_id: order.id,
      p_kind: 'checkout_failed',
      p_detail: String(error),
    });
    return json(
      request,
      {
        errors: [
          'Die Zahlung konnte nicht gestartet werden. Bitte versuche es später noch einmal.',
        ],
      },
      502,
    );
  }
});
