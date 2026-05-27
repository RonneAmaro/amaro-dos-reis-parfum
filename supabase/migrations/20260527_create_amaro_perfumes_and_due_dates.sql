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

create table if not exists public.amaro_perfumes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  slug text not null,
  name text not null,
  inspiration text,
  category text not null check (category in ('masculino', 'feminino', 'unissex')),
  collection text not null,
  bottle_type text not null check (bottle_type in ('tradicional', 'arabe')),
  price numeric(10,2) not null default 0,
  cost_price numeric(10,2) not null default 0,
  stock_quantity integer not null default 0,
  olfactive_family text,
  top_notes text,
  heart_notes text,
  base_notes text,
  short_description text,
  long_description text,
  tags text[] default '{}',
  image_url text,
  availability_status text not null default 'limited' check (availability_status in ('available', 'limited', 'on_order')),
  is_active boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (owner_id, slug)
);

alter table public.amaro_perfumes enable row level security;

drop policy if exists "amaro_perfumes_select_own" on public.amaro_perfumes;
create policy "amaro_perfumes_select_own"
  on public.amaro_perfumes for select
  to authenticated
  using (owner_id = auth.uid());

drop policy if exists "amaro_perfumes_insert_own" on public.amaro_perfumes;
create policy "amaro_perfumes_insert_own"
  on public.amaro_perfumes for insert
  to authenticated
  with check (owner_id = auth.uid());

drop policy if exists "amaro_perfumes_update_own" on public.amaro_perfumes;
create policy "amaro_perfumes_update_own"
  on public.amaro_perfumes for update
  to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

drop policy if exists "amaro_perfumes_delete_own" on public.amaro_perfumes;
create policy "amaro_perfumes_delete_own"
  on public.amaro_perfumes for delete
  to authenticated
  using (owner_id = auth.uid());

create index if not exists amaro_perfumes_owner_slug_idx
  on public.amaro_perfumes (owner_id, slug);
create index if not exists amaro_perfumes_owner_collection_idx
  on public.amaro_perfumes (owner_id, collection);
create index if not exists amaro_perfumes_owner_active_idx
  on public.amaro_perfumes (owner_id, is_active);

alter table public.amaro_sales
  add column if not exists due_date date,
  add column if not exists reminder_sent_at timestamptz,
  add column if not exists customer_phone text;

drop trigger if exists set_amaro_perfumes_updated_at on public.amaro_perfumes;
create trigger set_amaro_perfumes_updated_at
  before update on public.amaro_perfumes
  for each row execute function public.set_amaro_updated_at();
