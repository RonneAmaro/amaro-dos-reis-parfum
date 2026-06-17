-- Sync migration - Amaro dos Reis Parfum
-- Run this after schema.sql and seed-perfumes.sql.
-- Public perfume data can be read by the site. Sales, inventory and customers
-- remain private and are synchronized only by server routes using service_role.

alter table public.sales
  add column if not exists local_id text,
  add column if not exists synced_at timestamptz;

alter table public.inventory_items
  add column if not exists synced_at timestamptz;

create unique index if not exists sales_local_id_unique_idx
  on public.sales (local_id)
  where local_id is not null;

create index if not exists sales_created_at_idx
  on public.sales (created_at);

create index if not exists inventory_items_perfume_line_idx
  on public.inventory_items (perfume_slug, line_type);

create unique index if not exists inventory_items_perfume_line_unique_idx
  on public.inventory_items (perfume_slug, line_type);

alter table public.perfumes enable row level security;
alter table public.customers enable row level security;
alter table public.inventory_items enable row level security;
alter table public.sales enable row level security;

-- Only perfumes are public because they feed the catalog.
do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'perfumes'
      and policyname = 'Public can read perfumes'
  ) then
    create policy "Public can read perfumes"
      on public.perfumes
      for select
      using (true);
  end if;
end $$;

comment on table public.perfumes is
  'Public catalog data. Read access is allowed for the public site.';

comment on table public.sales is
  'Private sales data. Synchronization must use server-side routes with service_role.';

comment on table public.inventory_items is
  'Private stock and cost data. Synchronization must use server-side routes with service_role.';

comment on table public.customers is
  'Private customer data. Do not expose through public policies.';

comment on column public.sales.local_id is
  'Original localStorage sale id used for idempotent manual synchronization.';

comment on column public.sales.synced_at is
  'Timestamp of the last manual synchronization from the local admin panel.';

comment on column public.inventory_items.synced_at is
  'Timestamp of the last manual synchronization from the local admin panel.';
