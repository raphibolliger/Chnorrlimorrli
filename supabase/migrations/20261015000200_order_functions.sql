create function public.create_pending_order(p_order jsonb, p_items jsonb)
returns public.orders
language plpgsql
security definer
set search_path = ''
as $$
declare
  created public.orders;
begin
  insert into public.orders (
    email, first_name, last_name, phone, street, postal_code, city, country,
    shipping_method_id, shipping_kind, shipping_name,
    subtotal_rappen, shipping_rappen, total_rappen,
    customer_note, terms_accepted_at
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
    now()
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
  values (created.id, 'created', null);

  return created;
end;
$$;

create function public.attach_checkout_session(p_order_id uuid, p_session_id text)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.orders set stripe_checkout_session_id = p_session_id where id = p_order_id;
$$;

create function public.mark_order_paid(
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
      stripe_payment_intent_id = p_payment_intent_id,
      payment_method = p_payment_method
  where stripe_checkout_session_id = p_session_id
    and payment_status in ('pending', 'expired', 'failed')
  returning * into paid_order;

  if paid_order.id is null then
    return null;
  end if;

  update public.products p
  set stock = greatest(p.stock - sold.quantity, 0)
  from (
    select product_id, sum(quantity)::integer as quantity
    from public.order_items
    where order_id = paid_order.id and product_id is not null
    group by product_id
  ) sold
  where p.id = sold.product_id and p.track_stock;

  insert into public.order_events (order_id, kind, detail)
  values (paid_order.id, 'paid', p_payment_method);

  return paid_order;
end;
$$;

create function public.mark_order_unpaid(p_session_id text, p_status public.payment_status)
returns public.orders
language plpgsql
security definer
set search_path = ''
as $$
declare
  changed public.orders;
begin
  update public.orders
  set payment_status = p_status
  where stripe_checkout_session_id = p_session_id
    and payment_status = 'pending'
  returning * into changed;

  if changed.id is not null then
    insert into public.order_events (order_id, kind, detail)
    values (changed.id, p_status::text, null);
  end if;

  return changed;
end;
$$;

create function public.mark_order_refunded(p_payment_intent_id text)
returns public.orders
language plpgsql
security definer
set search_path = ''
as $$
declare
  refunded public.orders;
begin
  update public.orders
  set payment_status = 'refunded',
      refunded_at = now()
  where stripe_payment_intent_id = p_payment_intent_id
    and payment_status = 'paid'
  returning * into refunded;

  if refunded.id is not null then
    insert into public.order_events (order_id, kind, detail)
    values (refunded.id, 'refunded', null);
  end if;

  return refunded;
end;
$$;

create function public.log_order_event(p_order_id uuid, p_kind text, p_detail text)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.order_events (order_id, kind, detail) values (p_order_id, p_kind, p_detail);
$$;

revoke execute on function public.create_pending_order(jsonb, jsonb) from public, anon, authenticated;
revoke execute on function public.attach_checkout_session(uuid, text) from public, anon, authenticated;
revoke execute on function public.mark_order_paid(text, text, text) from public, anon, authenticated;
revoke execute on function public.mark_order_unpaid(text, public.payment_status) from public, anon, authenticated;
revoke execute on function public.mark_order_refunded(text) from public, anon, authenticated;
revoke execute on function public.log_order_event(uuid, text, text) from public, anon, authenticated;

grant execute on function public.create_pending_order(jsonb, jsonb) to service_role;
grant execute on function public.attach_checkout_session(uuid, text) to service_role;
grant execute on function public.mark_order_paid(text, text, text) to service_role;
grant execute on function public.mark_order_unpaid(text, public.payment_status) to service_role;
grant execute on function public.mark_order_refunded(text) to service_role;
grant execute on function public.log_order_event(uuid, text, text) to service_role;
