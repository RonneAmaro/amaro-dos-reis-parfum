create extension if not exists pgcrypto;

create or replace function public.set_amaro_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.amaro_customers (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  phone text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.amaro_inventory_items (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  perfume_slug text not null,
  perfume_name text not null,
  bottle_type text not null check (bottle_type in ('tradicional', 'arabe')),
  stock_quantity integer not null default 0,
  cost_price numeric(10,2) not null default 0,
  sale_price numeric(10,2) not null default 0,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.amaro_sales (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  customer_id uuid references public.amaro_customers(id) on delete set null,
  customer_name text not null,
  perfume_slug text not null,
  perfume_name text not null,
  line_type text not null check (line_type in ('tradicional', 'arabe')),
  unit_price numeric(10,2) not null,
  cost_price numeric(10,2) not null default 0,
  quantity integer not null default 1,
  payment_method text not null check (payment_method in ('dinheiro', 'pix', 'cartao', 'fiado')),
  status text not null check (status in ('pago', 'pendente')),
  notes text,
  created_at timestamptz default now(),
  paid_at timestamptz
);

alter table public.amaro_customers enable row level security;
alter table public.amaro_inventory_items enable row level security;
alter table public.amaro_sales enable row level security;

drop policy if exists "amaro_customers_select_own" on public.amaro_customers;
create policy "amaro_customers_select_own"
  on public.amaro_customers for select
  to authenticated
  using (owner_id = auth.uid());

drop policy if exists "amaro_customers_insert_own" on public.amaro_customers;
create policy "amaro_customers_insert_own"
  on public.amaro_customers for insert
  to authenticated
  with check (owner_id = auth.uid());

drop policy if exists "amaro_customers_update_own" on public.amaro_customers;
create policy "amaro_customers_update_own"
  on public.amaro_customers for update
  to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

drop policy if exists "amaro_customers_delete_own" on public.amaro_customers;
create policy "amaro_customers_delete_own"
  on public.amaro_customers for delete
  to authenticated
  using (owner_id = auth.uid());

drop policy if exists "amaro_inventory_items_select_own" on public.amaro_inventory_items;
create policy "amaro_inventory_items_select_own"
  on public.amaro_inventory_items for select
  to authenticated
  using (owner_id = auth.uid());

drop policy if exists "amaro_inventory_items_insert_own" on public.amaro_inventory_items;
create policy "amaro_inventory_items_insert_own"
  on public.amaro_inventory_items for insert
  to authenticated
  with check (owner_id = auth.uid());

drop policy if exists "amaro_inventory_items_update_own" on public.amaro_inventory_items;
create policy "amaro_inventory_items_update_own"
  on public.amaro_inventory_items for update
  to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

drop policy if exists "amaro_inventory_items_delete_own" on public.amaro_inventory_items;
create policy "amaro_inventory_items_delete_own"
  on public.amaro_inventory_items for delete
  to authenticated
  using (owner_id = auth.uid());

drop policy if exists "amaro_sales_select_own" on public.amaro_sales;
create policy "amaro_sales_select_own"
  on public.amaro_sales for select
  to authenticated
  using (owner_id = auth.uid());

drop policy if exists "amaro_sales_insert_own" on public.amaro_sales;
create policy "amaro_sales_insert_own"
  on public.amaro_sales for insert
  to authenticated
  with check (owner_id = auth.uid());

drop policy if exists "amaro_sales_update_own" on public.amaro_sales;
create policy "amaro_sales_update_own"
  on public.amaro_sales for update
  to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

drop policy if exists "amaro_sales_delete_own" on public.amaro_sales;
create policy "amaro_sales_delete_own"
  on public.amaro_sales for delete
  to authenticated
  using (owner_id = auth.uid());

create index if not exists amaro_sales_owner_created_idx
  on public.amaro_sales (owner_id, created_at desc);
create index if not exists amaro_sales_owner_status_idx
  on public.amaro_sales (owner_id, status);
create index if not exists amaro_inventory_owner_slug_idx
  on public.amaro_inventory_items (owner_id, perfume_slug);
create index if not exists amaro_customers_owner_name_idx
  on public.amaro_customers (owner_id, name);

drop trigger if exists set_amaro_customers_updated_at on public.amaro_customers;
create trigger set_amaro_customers_updated_at
  before update on public.amaro_customers
  for each row execute function public.set_amaro_updated_at();

drop trigger if exists set_amaro_inventory_items_updated_at on public.amaro_inventory_items;
create trigger set_amaro_inventory_items_updated_at
  before update on public.amaro_inventory_items
  for each row execute function public.set_amaro_updated_at();
