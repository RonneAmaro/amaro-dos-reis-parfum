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

create table if not exists public.amaro_admin_members (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'owner' check (role in ('owner', 'admin', 'seller')),
  is_active boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id)
);

alter table public.amaro_admin_members enable row level security;

create or replace function public.is_amaro_owner()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.amaro_admin_members member
    where member.user_id = auth.uid()
      and member.role = 'owner'
      and member.is_active = true
  );
$$;

drop policy if exists "amaro_admin_members_select_own" on public.amaro_admin_members;
create policy "amaro_admin_members_select_own"
  on public.amaro_admin_members for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "amaro_admin_members_owner_select_all" on public.amaro_admin_members;
create policy "amaro_admin_members_owner_select_all"
  on public.amaro_admin_members for select
  to authenticated
  using (public.is_amaro_owner());

drop policy if exists "amaro_admin_members_owner_insert" on public.amaro_admin_members;
create policy "amaro_admin_members_owner_insert"
  on public.amaro_admin_members for insert
  to authenticated
  with check (public.is_amaro_owner());

drop policy if exists "amaro_admin_members_owner_update" on public.amaro_admin_members;
create policy "amaro_admin_members_owner_update"
  on public.amaro_admin_members for update
  to authenticated
  using (public.is_amaro_owner())
  with check (public.is_amaro_owner());

drop policy if exists "amaro_admin_members_owner_delete" on public.amaro_admin_members;
create policy "amaro_admin_members_owner_delete"
  on public.amaro_admin_members for delete
  to authenticated
  using (public.is_amaro_owner());

create index if not exists amaro_admin_members_user_idx
  on public.amaro_admin_members (user_id);
create index if not exists amaro_admin_members_active_idx
  on public.amaro_admin_members (is_active);

drop trigger if exists set_amaro_admin_members_updated_at on public.amaro_admin_members;
create trigger set_amaro_admin_members_updated_at
  before update on public.amaro_admin_members
  for each row execute function public.set_amaro_updated_at();

comment on table public.amaro_admin_members is
  'Admin users authorized to access /admin. The first owner must be inserted manually in the SQL Editor after the user exists in Supabase Auth. Example: insert into public.amaro_admin_members (user_id, role, is_active) select id, ''owner'', true from auth.users where email = ''SEU_EMAIL_AQUI'';';
