-- Schema inicial planejado para a futura integracao com Supabase.
-- Este arquivo ainda nao deve ser aplicado automaticamente pelo app.
-- RLS (Row Level Security) e policies serao configuradas em um pacote futuro,
-- junto com autenticacao/admin protegido.

create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists perfumes (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  inspiration text,
  collection text,
  category text,
  bottle_type text,
  default_sale_price numeric(10,2),
  default_unit_cost numeric(10,2),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists inventory_items (
  id uuid primary key default gen_random_uuid(),
  perfume_slug text not null,
  perfume_name text not null,
  line_type text not null,
  stock_quantity integer not null default 0,
  unit_cost numeric(10,2) not null default 0,
  sale_price numeric(10,2) not null default 0,
  minimum_stock integer not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists sales (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  customer_phone text,
  perfume_slug text not null,
  perfume_name text not null,
  line_type text not null,
  unit_price numeric(10,2) not null,
  unit_cost numeric(10,2),
  quantity integer not null default 1,
  payment_method text not null,
  status text not null,
  notes text,
  estimated_profit numeric(10,2),
  created_at timestamptz default now(),
  paid_at timestamptz
);

-- Proximos passos planejados:
-- 1. Ativar RLS nas tabelas.
-- 2. Criar policies por usuario/admin.
-- 3. Criar triggers para atualizar updated_at.
-- 4. Criar indices e chaves estrangeiras conforme o fluxo real de migracao.
