-- Agenda de Recebimentos - AMARO DOS REIS PARFUM
-- Execute manualmente no SQL Editor do Supabase antes de sincronizar os novos campos.

alter table public.sales
  add column if not exists expected_payment_date date,
  add column if not exists expected_payment_method text,
  add column if not exists collection_note text;

-- customer_phone e paid_at ja existem no schema inicial.
-- O status continua na coluna text existente e passa a aceitar pago, pendente ou fiado.

create index if not exists sales_expected_payment_date_idx
  on public.sales (expected_payment_date)
  where expected_payment_date is not null;

comment on column public.sales.expected_payment_date is
  'Data prevista para recebimento da venda.';
comment on column public.sales.expected_payment_method is
  'Forma de pagamento prevista: pix, dinheiro, cartao, salario ou outro.';
comment on column public.sales.collection_note is
  'Observacao privada usada no acompanhamento da cobranca.';
