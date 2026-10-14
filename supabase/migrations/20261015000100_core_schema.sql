create schema if not exists app;
revoke all on schema app from public, anon, authenticated;

create table app.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from app.admins where user_id = (select auth.uid()));
$$;

revoke execute on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated, service_role;

create function app.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  sku text,
  name text not null check (length(trim(name)) > 0),
  short_description text,
  description text,
  price_rappen integer not null check (price_rappen >= 0),
  active boolean not null default false,
  sort_order integer not null default 0,
  track_stock boolean not null default false,
  stock integer check (stock >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (not track_stock or stock is not null)
);

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  storage_path text not null,
  alt text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index product_images_product_id_idx on public.product_images (product_id, sort_order);

create table public.product_options (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  choices text[] not null check (cardinality(choices) > 0),
  sort_order integer not null default 0,
  unique (product_id, name)
);

create index product_options_product_id_idx on public.product_options (product_id, sort_order);

create type public.shipping_kind as enum ('pickup', 'postal', 'local_delivery');

create table public.shipping_methods (
  id uuid primary key default gen_random_uuid(),
  kind public.shipping_kind not null,
  name text not null check (length(trim(name)) > 0),
  description text,
  active boolean not null default true,
  sort_order integer not null default 0,
  postal_codes text[] not null default '{}',
  pickup_location text,
  pickup_hours text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.shipping_rates (
  id uuid primary key default gen_random_uuid(),
  shipping_method_id uuid not null references public.shipping_methods (id) on delete cascade,
  from_subtotal_rappen integer not null check (from_subtotal_rappen >= 0),
  price_rappen integer not null check (price_rappen >= 0),
  unique (shipping_method_id, from_subtotal_rappen)
);

create type public.payment_status as enum ('pending', 'paid', 'failed', 'expired', 'refunded');

create type public.fulfillment_status as enum (
  'new',
  'processing',
  'ready_for_pickup',
  'shipped',
  'delivered',
  'cancelled'
);

create sequence public.order_number_seq start 1001;

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number integer not null unique default nextval('public.order_number_seq'),
  payment_status public.payment_status not null default 'pending',
  fulfillment_status public.fulfillment_status not null default 'new',
  email text not null,
  first_name text not null,
  last_name text not null,
  phone text,
  street text,
  postal_code text,
  city text,
  country text not null default 'CH',
  shipping_method_id uuid references public.shipping_methods (id) on delete set null,
  shipping_kind public.shipping_kind not null,
  shipping_name text not null,
  subtotal_rappen integer not null check (subtotal_rappen >= 0),
  shipping_rappen integer not null check (shipping_rappen >= 0),
  total_rappen integer not null check (total_rappen >= 0),
  customer_note text,
  terms_accepted_at timestamptz not null,
  stripe_checkout_session_id text unique,
  stripe_payment_intent_id text,
  payment_method text,
  tracking_number text,
  paid_at timestamptz,
  cancelled_at timestamptz,
  refunded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter sequence public.order_number_seq owned by public.orders.order_number;

create index orders_created_at_idx on public.orders (created_at desc);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  product_name text not null,
  sku text,
  options jsonb not null default '{}',
  unit_price_rappen integer not null check (unit_price_rappen >= 0),
  quantity integer not null check (quantity between 1 and 99),
  line_total_rappen integer not null check (line_total_rappen >= 0)
);

create index order_items_order_id_idx on public.order_items (order_id);

create table public.order_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  kind text not null,
  detail text,
  created_at timestamptz not null default now()
);

create index order_events_order_id_idx on public.order_events (order_id, created_at);

create trigger products_touch_updated_at before update on public.products
  for each row execute function app.touch_updated_at();
create trigger shipping_methods_touch_updated_at before update on public.shipping_methods
  for each row execute function app.touch_updated_at();
create trigger orders_touch_updated_at before update on public.orders
  for each row execute function app.touch_updated_at();

alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.product_options enable row level security;
alter table public.shipping_methods enable row level security;
alter table public.shipping_rates enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_events enable row level security;

revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;

grant select on public.products, public.product_images, public.product_options,
  public.shipping_methods, public.shipping_rates to anon, authenticated;
grant insert, update, delete on public.products, public.product_images, public.product_options,
  public.shipping_methods, public.shipping_rates to authenticated;
grant select, update on public.orders to authenticated;
grant select on public.order_items, public.order_events to authenticated;

create policy "Active products are public" on public.products
  for select to anon, authenticated
  using (active or (select public.is_admin()));
create policy "Admins insert products" on public.products
  for insert to authenticated
  with check ((select public.is_admin()));
create policy "Admins update products" on public.products
  for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));
create policy "Admins delete products" on public.products
  for delete to authenticated
  using ((select public.is_admin()));

create policy "Images of visible products are public" on public.product_images
  for select to anon, authenticated
  using (exists (select 1 from public.products p where p.id = product_id));
create policy "Admins insert product images" on public.product_images
  for insert to authenticated
  with check ((select public.is_admin()));
create policy "Admins update product images" on public.product_images
  for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));
create policy "Admins delete product images" on public.product_images
  for delete to authenticated
  using ((select public.is_admin()));

create policy "Options of visible products are public" on public.product_options
  for select to anon, authenticated
  using (exists (select 1 from public.products p where p.id = product_id));
create policy "Admins insert product options" on public.product_options
  for insert to authenticated
  with check ((select public.is_admin()));
create policy "Admins update product options" on public.product_options
  for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));
create policy "Admins delete product options" on public.product_options
  for delete to authenticated
  using ((select public.is_admin()));

create policy "Active shipping methods are public" on public.shipping_methods
  for select to anon, authenticated
  using (active or (select public.is_admin()));
create policy "Admins insert shipping methods" on public.shipping_methods
  for insert to authenticated
  with check ((select public.is_admin()));
create policy "Admins update shipping methods" on public.shipping_methods
  for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));
create policy "Admins delete shipping methods" on public.shipping_methods
  for delete to authenticated
  using ((select public.is_admin()));

create policy "Rates of visible shipping methods are public" on public.shipping_rates
  for select to anon, authenticated
  using (exists (select 1 from public.shipping_methods m where m.id = shipping_method_id));
create policy "Admins insert shipping rates" on public.shipping_rates
  for insert to authenticated
  with check ((select public.is_admin()));
create policy "Admins update shipping rates" on public.shipping_rates
  for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));
create policy "Admins delete shipping rates" on public.shipping_rates
  for delete to authenticated
  using ((select public.is_admin()));

create policy "Admins read orders" on public.orders
  for select to authenticated
  using ((select public.is_admin()));
create policy "Admins update orders" on public.orders
  for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "Admins read order items" on public.order_items
  for select to authenticated
  using ((select public.is_admin()));

create policy "Admins read order events" on public.order_events
  for select to authenticated
  using ((select public.is_admin()));
