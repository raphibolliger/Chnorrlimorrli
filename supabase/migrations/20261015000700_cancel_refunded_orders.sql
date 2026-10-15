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
      payment_status = case when p_refunded then 'refunded'::public.payment_status else payment_status end,
      refunded_at = case when p_refunded then now() else refunded_at end
  where id = p_order_id
  returning * into changed;

  if previous.paid_at is not null then
    update public.products p
    set stock = p.stock + returned.quantity
    from (
      select product_id, sum(quantity)::integer as quantity
      from public.order_items
      where order_id = p_order_id and product_id is not null
      group by product_id
    ) returned
    where p.id = returned.product_id and p.track_stock;
  end if;

  insert into public.order_events (order_id, kind, detail)
  values (changed.id, 'cancelled', case when p_refunded then 'refunded' else null end);

  return changed;
end;
$$;
