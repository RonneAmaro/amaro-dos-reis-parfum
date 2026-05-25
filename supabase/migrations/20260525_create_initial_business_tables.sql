create extension if not exists pgcrypto;

create table if not exists public.perfumes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  inspiration text not null,
  collection text,
  family text,
  line text not null check (line in ('traditional', 'arabic_premium')),
  price_cents integer not null check (price_cents >= 0),
  size_ml integer not null default 50 check (size_ml > 0),
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (name)
);

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sales (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.customers(id) on delete set null,
  perfume_id uuid not null references public.perfumes(id) on delete restrict,
  quantity integer not null default 1 check (quantity > 0),
  unit_price_cents integer not null check (unit_price_cents >= 0),
  total_price_cents integer generated always as (quantity * unit_price_cents) stored,
  payment_status text not null default 'pending' check (payment_status in ('pending', 'paid', 'cancelled')),
  payment_method text,
  sold_at timestamptz not null default now(),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  perfume_id uuid not null references public.perfumes(id) on delete restrict,
  movement_type text not null check (movement_type in ('in', 'out', 'adjustment')),
  quantity integer not null check (quantity <> 0),
  sale_id uuid references public.sales(id) on delete set null,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists perfumes_name_idx on public.perfumes (name);
create index if not exists perfumes_line_idx on public.perfumes (line);
create index if not exists customers_name_idx on public.customers (name);
create index if not exists customers_phone_idx on public.customers (phone);
create index if not exists sales_customer_id_idx on public.sales (customer_id);
create index if not exists sales_perfume_id_idx on public.sales (perfume_id);
create index if not exists sales_payment_status_idx on public.sales (payment_status);
create index if not exists inventory_movements_perfume_id_idx on public.inventory_movements (perfume_id);
create index if not exists inventory_movements_sale_id_idx on public.inventory_movements (sale_id);

alter table public.perfumes enable row level security;
alter table public.customers enable row level security;
alter table public.sales enable row level security;
alter table public.inventory_movements enable row level security;

create policy "Authenticated users can select perfumes"
  on public.perfumes for select
  to authenticated
  using (true);

create policy "Authenticated users can insert perfumes"
  on public.perfumes for insert
  to authenticated
  with check (true);

create policy "Authenticated users can update perfumes"
  on public.perfumes for update
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated users can delete perfumes"
  on public.perfumes for delete
  to authenticated
  using (true);

create policy "Authenticated users can select customers"
  on public.customers for select
  to authenticated
  using (true);

create policy "Authenticated users can insert customers"
  on public.customers for insert
  to authenticated
  with check (true);

create policy "Authenticated users can update customers"
  on public.customers for update
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated users can delete customers"
  on public.customers for delete
  to authenticated
  using (true);

create policy "Authenticated users can select sales"
  on public.sales for select
  to authenticated
  using (true);

create policy "Authenticated users can insert sales"
  on public.sales for insert
  to authenticated
  with check (true);

create policy "Authenticated users can update sales"
  on public.sales for update
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated users can delete sales"
  on public.sales for delete
  to authenticated
  using (true);

create policy "Authenticated users can select inventory movements"
  on public.inventory_movements for select
  to authenticated
  using (true);

create policy "Authenticated users can insert inventory movements"
  on public.inventory_movements for insert
  to authenticated
  with check (true);

create policy "Authenticated users can update inventory movements"
  on public.inventory_movements for update
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated users can delete inventory movements"
  on public.inventory_movements for delete
  to authenticated
  using (true);

insert into public.perfumes (
  name,
  inspiration,
  collection,
  family,
  line,
  price_cents,
  size_ml,
  description
)
values
  ('NOBLIS', 'Allure Homme', 'Executive Collection', 'Aromatico amadeirado', 'traditional', 8000, 50, 'Elegante, versatil e sofisticado para uma presenca refinada.'),
  ('AZURE SPORT', 'Allure Homme Sport', 'Executive Collection', 'Citrico aromatico', 'traditional', 8000, 50, 'Frescor moderno com energia limpa e assinatura elegante.'),
  ('VITORIUM', 'Invictus', 'Executive Collection', 'Aquatico amadeirado', 'traditional', 8000, 50, 'Vibrante, confiante e marcante para dias de conquista.'),
  ('SULTAN NOIR', 'Asad', 'Oriental Collection', 'Oriental especiado', 'arabic_premium', 12000, 50, 'Quente, intenso e poderoso, com especiarias nobres e fundo escuro.'),
  ('DOMINARE', 'Aventus', 'Executive Collection', 'Amadeirado frutado', 'traditional', 8000, 50, 'Imponente e refinado, com frescor vibrante e profundidade elegante.'),
  ('IGNIS', 'Fahrenheit', 'Executive Collection', 'Couro aromatico', 'traditional', 8000, 50, 'Intenso e magnetico, com couro, calor e personalidade.'),
  ('SAMARAH ROSE', 'Sabah Al Ward', 'Oriental Collection', 'Floral oriental', 'arabic_premium', 12000, 50, 'Rosas delicadas, docura macia e toque oriental radiante.'),
  ('FLOREA', 'Chloe Eau de Parfum', 'Feminine Collection', 'Floral elegante', 'traditional', 8000, 50, 'Feminino, limpo e luminoso, com elegancia atemporal.'),
  ('SILVERION BLACK', 'Azzaro Silver Black', 'Executive Collection', 'Aromatico especiado', 'traditional', 8000, 50, 'Urbano, fresco e marcante para uma rotina elegante.'),
  ('IRESIA', 'Irresistible Givenchy', 'Feminine Collection', 'Floral frutado', 'traditional', 8000, 50, 'Leve, envolvente e sofisticado, com brilho feminino moderno.'),
  ('BELLE VENOM', 'Good Girl', 'Feminine Collection', 'Oriental floral', 'traditional', 8000, 50, 'Sedutor e elegante, com contraste entre docura e intensidade.'),
  ('NOIR OUD ROYALE', 'Club de Nuit Oud Armaf', 'Oriental Collection', 'Oud amadeirado', 'arabic_premium', 12000, 50, 'Nobre, profundo e luxuoso, com rastro oriental de oud.'),
  ('YASIRAH', 'Yara Lattafa', 'Oriental Collection', 'Gourmand oriental', 'arabic_premium', 12000, 50, 'Cremoso, doce e feminino, com delicadeza oriental.'),
  ('ALTAIR ROYALE', 'Althair Parfums de Marly', 'Oriental Collection', 'Baunilha ambarada', 'arabic_premium', 12000, 50, 'Ambarado, cremoso e sofisticado, com calor envolvente.'),
  ('SCARLET NOIR', 'Scandal Pour Homme', 'Executive Collection', 'Ambarado amadeirado', 'traditional', 8000, 50, 'Marcante e provocante, com elegancia intensa.'),
  ('LUMIARA', 'La Nuit Tresor', 'Feminine Collection', 'Oriental gourmand', 'traditional', 8000, 50, 'Romantico, profundo e envolvente, com rastro memoravel.'),
  ('MOON CANDY', 'Fantasy', 'Feminine Collection', 'Gourmand floral', 'traditional', 8000, 50, 'Doce, encantador e jovial, com rastro cremoso.')
on conflict (name) do update
set
  inspiration = excluded.inspiration,
  collection = excluded.collection,
  family = excluded.family,
  line = excluded.line,
  price_cents = excluded.price_cents,
  size_ml = excluded.size_ml,
  description = excluded.description,
  updated_at = now();
