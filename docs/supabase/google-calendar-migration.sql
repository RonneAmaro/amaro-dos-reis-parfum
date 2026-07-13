-- Integracao privada com Google Calendar - AMARO DOS REIS PARFUM
-- Execute manualmente no SQL Editor. Nenhum token deve ter acesso publico.

create table if not exists public.admin_google_integrations (
  id text primary key default 'google_calendar',
  encrypted_access_token text,
  encrypted_refresh_token text,
  token_type text,
  scope text,
  expires_at timestamptz,
  calendar_id text not null default 'primary',
  connected_email text,
  connected_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.admin_google_integrations enable row level security;

alter table public.sales
  add column if not exists google_calendar_event_id text,
  add column if not exists google_calendar_event_link text,
  add column if not exists google_calendar_synced_at timestamptz,
  add column if not exists google_calendar_status text;

comment on table public.admin_google_integrations is
  'Tokens Google criptografados. Acesso exclusivo por service_role no servidor.';
comment on column public.sales.google_calendar_event_id is 'ID do evento de cobranca no Google Calendar.';
