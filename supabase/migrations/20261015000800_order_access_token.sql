alter table public.orders
  add column access_token uuid not null default gen_random_uuid(),
  add constraint orders_access_token_key unique (access_token);
