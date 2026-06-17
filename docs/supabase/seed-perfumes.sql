-- Carga inicial dos perfumes oficiais da Amaro dos Reis Parfum.
-- Pode ser executada mais de uma vez: o conflito por slug atualiza os dados.

insert into public.perfumes (
  slug,
  name,
  inspiration,
  collection,
  category,
  bottle_type,
  default_sale_price,
  default_unit_cost
) values
  (
    'noblis',
    'NOBLIS',
    'Allure Homme',
    'Executive Collection',
    'masculino',
    'tradicional',
    80.00,
    24.75
  ),
  (
    'azure-sport',
    'AZURE SPORT',
    'Allure Homme Sport',
    'Executive Collection',
    'masculino',
    'tradicional',
    80.00,
    24.75
  ),
  (
    'vitorium',
    'VITORIUM',
    'Invictus',
    'Executive Collection',
    'masculino',
    'tradicional',
    80.00,
    24.75
  ),
  (
    'dominare',
    'DOMINARE',
    'Aventus',
    'Executive Collection',
    'masculino',
    'tradicional',
    80.00,
    24.75
  ),
  (
    'ignis',
    'IGNIS',
    'Fahrenheit',
    'Executive Collection',
    'masculino',
    'tradicional',
    80.00,
    24.75
  ),
  (
    'silverion-black',
    'SILVERION BLACK',
    'Azzaro Silver Black',
    'Executive Collection',
    'masculino',
    'tradicional',
    80.00,
    24.75
  ),
  (
    'scarlet-noir',
    'SCARLET NOIR',
    'Scandal Pour Homme',
    'Executive Collection',
    'masculino',
    'tradicional',
    80.00,
    24.75
  ),
  (
    'sultan-noir',
    'SULTAN NOIR',
    'Asad',
    'Oriental Collection',
    'masculino',
    'arabe',
    120.00,
    41.40
  ),
  (
    'noir-oud-royale',
    'NOIR OUD ROYALE',
    'Club de Nuit Oud Armaf',
    'Oriental Collection',
    'unissex',
    'arabe',
    120.00,
    41.40
  ),
  (
    'yasirah',
    'YASIRAH',
    'Yara Lattafa',
    'Oriental Collection',
    'feminino',
    'arabe',
    120.00,
    41.40
  ),
  (
    'altair-royale',
    'ALTAIR ROYALE',
    'Althair Parfums de Marly',
    'Oriental Collection',
    'masculino',
    'arabe',
    120.00,
    41.40
  ),
  (
    'samarah-rose',
    'SAMARAH ROSE',
    'Sabah Al Ward',
    'Oriental Collection',
    'feminino',
    'arabe',
    120.00,
    41.40
  ),
  (
    'florea',
    'FLOREA',
    'Chloe Eau de Parfum',
    'Feminine Collection',
    'feminino',
    'tradicional',
    80.00,
    24.75
  ),
  (
    'iresia',
    'IRESIA',
    'Irresistible Givenchy',
    'Feminine Collection',
    'feminino',
    'tradicional',
    80.00,
    24.75
  ),
  (
    'belle-venom',
    'BELLE VENOM',
    'Good Girl',
    'Feminine Collection',
    'feminino',
    'tradicional',
    80.00,
    24.75
  ),
  (
    'lumiara',
    'LUMIARA',
    'La Nuit Tresor',
    'Feminine Collection',
    'feminino',
    'tradicional',
    80.00,
    24.75
  ),
  (
    'moon-candy',
    'MOON CANDY',
    'Fantasy',
    'Feminine Collection',
    'feminino',
    'tradicional',
    80.00,
    24.75
  )
on conflict (slug) do update set
  name = excluded.name,
  inspiration = excluded.inspiration,
  collection = excluded.collection,
  category = excluded.category,
  bottle_type = excluded.bottle_type,
  default_sale_price = excluded.default_sale_price,
  default_unit_cost = excluded.default_unit_cost,
  updated_at = now();
