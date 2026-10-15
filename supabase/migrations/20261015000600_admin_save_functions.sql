create function public.save_product(p_product jsonb, p_options jsonb, p_id uuid default null)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  draft public.products := jsonb_populate_record(null::public.products, p_product);
  saved_id uuid;
begin
  if p_id is null then
    insert into public.products (
      name, slug, sku, price_rappen, short_description, description,
      active, sort_order, track_stock, stock
    )
    values (
      draft.name, draft.slug, draft.sku, draft.price_rappen, draft.short_description, draft.description,
      draft.active, draft.sort_order, draft.track_stock, draft.stock
    )
    returning id into saved_id;
  else
    update public.products
    set name = draft.name,
        slug = draft.slug,
        sku = draft.sku,
        price_rappen = draft.price_rappen,
        short_description = draft.short_description,
        description = draft.description,
        active = draft.active,
        sort_order = draft.sort_order,
        track_stock = draft.track_stock,
        stock = draft.stock
    where id = p_id
    returning id into saved_id;
  end if;

  if saved_id is null then
    raise exception 'Product % not found', p_id;
  end if;

  delete from public.product_options where product_id = saved_id;
  insert into public.product_options (product_id, name, choices, sort_order)
  select
    saved_id,
    option.value ->> 'name',
    array(select jsonb_array_elements_text(option.value -> 'choices')),
    option.position - 1
  from jsonb_array_elements(p_options) with ordinality as option(value, position);

  return saved_id;
end;
$$;

create function public.save_shipping_method(p_id uuid, p_method jsonb, p_rates jsonb)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  draft public.shipping_methods := jsonb_populate_record(null::public.shipping_methods, p_method);
begin
  update public.shipping_methods
  set name = draft.name,
      description = draft.description,
      active = draft.active,
      sort_order = draft.sort_order,
      postal_codes = draft.postal_codes,
      pickup_location = draft.pickup_location,
      pickup_hours = draft.pickup_hours
  where id = p_id;

  if not found then
    raise exception 'Shipping method % not found', p_id;
  end if;

  delete from public.shipping_rates where shipping_method_id = p_id;
  insert into public.shipping_rates (shipping_method_id, from_subtotal_rappen, price_rappen)
  select p_id, rate.from_subtotal_rappen, rate.price_rappen
  from jsonb_to_recordset(p_rates) as rate(from_subtotal_rappen integer, price_rappen integer);
end;
$$;

revoke execute on function public.save_product(jsonb, jsonb, uuid) from public, anon;
revoke execute on function public.save_shipping_method(uuid, jsonb, jsonb) from public, anon;
grant execute on function public.save_product(jsonb, jsonb, uuid) to authenticated;
grant execute on function public.save_shipping_method(uuid, jsonb, jsonb) to authenticated;
