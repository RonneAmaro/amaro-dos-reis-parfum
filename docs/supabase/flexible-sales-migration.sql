-- Vendas flexiveis - AMARO DOS REIS PARFUM
-- Execute manualmente no SQL Editor depois de receivables-migration.sql.

alter table public.sales
  add column if not exists items jsonb,
  add column if not exists subtotal numeric(10,2),
  add column if not exists discount_value numeric(10,2),
  add column if not exists total_amount numeric(10,2),
  add column if not exists amount_paid numeric(10,2),
  add column if not exists remaining_amount numeric(10,2);

comment on column public.sales.items is 'Itens da venda, incluindo brindes, uso pessoal, amostras e trocas.';
comment on column public.sales.subtotal is 'Soma dos valores originais antes dos descontos.';
comment on column public.sales.discount_value is 'Desconto total aplicado aos itens da venda.';
comment on column public.sales.total_amount is 'Valor final faturado pela venda.';
comment on column public.sales.amount_paid is 'Valor recebido ate o momento.';
comment on column public.sales.remaining_amount is 'Saldo ainda pendente de recebimento.';
