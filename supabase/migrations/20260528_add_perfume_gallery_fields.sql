alter table public.amaro_perfumes
  add column if not exists concept_image_url text,
  add column if not exists gallery_image_urls text[] not null default '{}';

create or replace function public.get_amaro_public_perfumes()
returns table (
  slug text,
  name text,
  inspiration text,
  category text,
  collection text,
  bottle_type text,
  price numeric(10,2),
  olfactive_family text,
  top_notes text,
  heart_notes text,
  base_notes text,
  short_description text,
  long_description text,
  tags text[],
  image_url text,
  concept_image_url text,
  gallery_image_urls text[],
  availability_status text,
  created_at timestamptz,
  updated_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    p.slug,
    p.name,
    p.inspiration,
    p.category,
    p.collection,
    p.bottle_type,
    p.price,
    p.olfactive_family,
    p.top_notes,
    p.heart_notes,
    p.base_notes,
    p.short_description,
    p.long_description,
    p.tags,
    p.image_url,
    p.concept_image_url,
    p.gallery_image_urls,
    p.availability_status,
    p.created_at,
    p.updated_at
  from public.amaro_perfumes p
  where p.is_active = true
  order by p.collection, p.name;
$$;

create or replace function public.get_amaro_public_perfume_by_slug(p_slug text)
returns table (
  slug text,
  name text,
  inspiration text,
  category text,
  collection text,
  bottle_type text,
  price numeric(10,2),
  olfactive_family text,
  top_notes text,
  heart_notes text,
  base_notes text,
  short_description text,
  long_description text,
  tags text[],
  image_url text,
  concept_image_url text,
  gallery_image_urls text[],
  availability_status text,
  created_at timestamptz,
  updated_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    p.slug,
    p.name,
    p.inspiration,
    p.category,
    p.collection,
    p.bottle_type,
    p.price,
    p.olfactive_family,
    p.top_notes,
    p.heart_notes,
    p.base_notes,
    p.short_description,
    p.long_description,
    p.tags,
    p.image_url,
    p.concept_image_url,
    p.gallery_image_urls,
    p.availability_status,
    p.created_at,
    p.updated_at
  from public.amaro_perfumes p
  where p.is_active = true
    and p.slug = p_slug
  limit 1;
$$;

grant execute on function public.get_amaro_public_perfumes() to anon, authenticated;
grant execute on function public.get_amaro_public_perfume_by_slug(text) to anon, authenticated;
