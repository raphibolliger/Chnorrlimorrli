alter table public.orders add column confirmed_at timestamptz;

update public.orders set confirmed_at = paid_at where paid_at is not null;

create function app.reserve_stock(p_order_id uuid)
returns void
language sql
set search_path = ''
as $$
  update public.products p
  set stock = greatest(p.stock - ordered.quantity, 0)
  from (
    select product_id, sum(quantity)::integer as quantity
    from public.order_items
    where order_id = p_order_id and product_id is not null
    group by product_id
  ) ordered
  where p.id = ordered.product_id and p.track_stock;
$$;

create function app.release_stock(p_order_id uuid)
returns void
language sql
set search_path = ''
as $$
  update public.products p
  set stock = p.stock + ordered.quantity
  from (
    select product_id, sum(quantity)::integer as quantity
    from public.order_items
    where order_id = p_order_id and product_id is not null
    group by product_id
  ) ordered
  where p.id = ordered.product_id and p.track_stock;
$$;

create function public.create_order(p_order jsonb, p_items jsonb)
returns public.orders
language plpgsql
security definer
set search_path = ''
as $$
declare
  pays_cash boolean := p_order ->> 'payment_method' = 'cash';
  created public.orders;
begin
  if pays_cash and p_order ->> 'shipping_kind' <> 'pickup' then
    raise exception 'Cash payment is only possible for pickup';
  end if;

  insert into public.orders (
    email, first_name, last_name, phone, street, postal_code, city, country,
    shipping_method_id, shipping_kind, shipping_name,
    subtotal_rappen, shipping_rappen, total_rappen,
    customer_note, terms_accepted_at,
    payment_status, payment_method, confirmed_at
  )
  values (
    p_order ->> 'email',
    p_order ->> 'first_name',
    p_order ->> 'last_name',
    nullif(p_order ->> 'phone', ''),
    nullif(p_order ->> 'street', ''),
    nullif(p_order ->> 'postal_code', ''),
    nullif(p_order ->> 'city', ''),
    coalesce(p_order ->> 'country', 'CH'),
    (p_order ->> 'shipping_method_id')::uuid,
    (p_order ->> 'shipping_kind')::public.shipping_kind,
    p_order ->> 'shipping_name',
    (p_order ->> 'subtotal_rappen')::integer,
    (p_order ->> 'shipping_rappen')::integer,
    (p_order ->> 'total_rappen')::integer,
    nullif(p_order ->> 'customer_note', ''),
    now(),
    case when pays_cash then 'due'::public.payment_status else 'pending'::public.payment_status end,
    case when pays_cash then 'cash' end,
    case when pays_cash then now() end
  )
  returning * into created;

  insert into public.order_items (
    order_id, product_id, product_name, sku, options,
    unit_price_rappen, quantity, line_total_rappen
  )
  select
    created.id,
    (item ->> 'product_id')::uuid,
    item ->> 'product_name',
    item ->> 'sku',
    coalesce(item -> 'options', '{}'::jsonb),
    (item ->> 'unit_price_rappen')::integer,
    (item ->> 'quantity')::integer,
    (item ->> 'line_total_rappen')::integer
  from jsonb_array_elements(p_items) as item;

  insert into public.order_events (order_id, kind, detail)
  values (created.id, 'created', case when pays_cash then 'cash' end);

  if pays_cash then
    perform app.reserve_stock(created.id);
  end if;

  return created;
end;
$$;

drop function public.create_pending_order(jsonb, jsonb);

create or replace function public.mark_order_paid(
  p_session_id text,
  p_payment_intent_id text,
  p_payment_method text
)
returns public.orders
language plpgsql
security definer
set search_path = ''
as $$
declare
  paid_order public.orders;
begin
  update public.orders
  set payment_status = 'paid',
      paid_at = now(),
      confirmed_at = now(),
      stripe_payment_intent_id = p_payment_intent_id,
      payment_method = p_payment_method
  where stripe_checkout_session_id = p_session_id
    and payment_status in ('pending', 'expired', 'failed')
  returning * into paid_order;

  if paid_order.id is null then
    return null;
  end if;

  perform app.reserve_stock(paid_order.id);

  insert into public.order_events (order_id, kind, detail)
  values (paid_order.id, 'paid', p_payment_method);

  return paid_order;
end;
$$;

create or replace function public.cancel_order(p_order_id uuid, p_refunded boolean)
returns public.orders
language plpgsql
security definer
set search_path = ''
as $$
declare
  previous public.orders;
  changed public.orders;
begin
  select * into previous from public.orders where id = p_order_id for update;
  if previous.id is null or previous.fulfillment_status = 'cancelled' then
    raise exception 'Order % not found or already cancelled', p_order_id;
  end if;

  update public.orders
  set fulfillment_status = 'cancelled',
      cancelled_at = now(),
      payment_status = case
        when p_refunded then 'refunded'::public.payment_status
        when payment_status = 'due' then 'expired'::public.payment_status
        else payment_status
      end,
      refunded_at = case when p_refunded then now() else refunded_at end
  where id = p_order_id
  returning * into changed;

  if previous.confirmed_at is not null then
    perform app.release_stock(p_order_id);
  end if;

  insert into public.order_events (order_id, kind, detail)
  values (changed.id, 'cancelled', case when p_refunded then 'refunded' else null end);

  return changed;
end;
$$;

create or replace function public.set_fulfillment_status(
  p_order_id uuid,
  p_status public.fulfillment_status,
  p_tracking_number text
)
returns public.orders
language plpgsql
security definer
set search_path = ''
as $$
declare
  previous public.orders;
  changed public.orders;
  collects_cash boolean;
begin
  if p_status = 'cancelled' then
    raise exception 'Use cancel_order to cancel orders';
  end if;

  select * into previous from public.orders where id = p_order_id for update;
  if previous.id is null or previous.fulfillment_status = 'cancelled' then
    raise exception 'Order % not found or cancelled', p_order_id;
  end if;

  collects_cash := p_status = 'delivered' and previous.payment_status = 'due';

  update public.orders
  set fulfillment_status = p_status,
      tracking_number = coalesce(nullif(p_tracking_number, ''), tracking_number),
      payment_status = case when collects_cash then 'paid'::public.payment_status else payment_status end,
      paid_at = case when collects_cash then now() else paid_at end
  where id = p_order_id
  returning * into changed;

  insert into public.order_events (order_id, kind, detail)
  values (changed.id, 'status_' || p_status::text, nullif(p_tracking_number, ''));

  if collects_cash then
    insert into public.order_events (order_id, kind, detail)
    values (changed.id, 'paid', 'cash');
  end if;

  return changed;
end;
$$;

revoke execute on function app.reserve_stock(uuid) from public, anon, authenticated;
revoke execute on function app.release_stock(uuid) from public, anon, authenticated;
revoke execute on function public.create_order(jsonb, jsonb) from public, anon, authenticated;
grant execute on function public.create_order(jsonb, jsonb) to service_role;
