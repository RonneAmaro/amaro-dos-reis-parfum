# Supabase futuro

O Supabase sera usado futuramente para salvar vendas, estoque, clientes e produtos da Amaro dos Reis Parfum.

Por enquanto, o painel interno em `/admin` continua funcionando com `localStorage` no proprio navegador:

- Vendas: `amaro_sales_v1`
- Estoque: `amaro_inventory_v1`
- Backup JSON: `amaro_backup_v1`

Antes de qualquer migracao, exporte sempre um backup JSON completo pelo painel. Esse arquivo sera a base mais segura para conferir e restaurar os dados caso algo precise ser refeito.

O banco de dados sera usado para sincronizar os dados entre o PC de casa e o PC do servico, evitando que as vendas e o estoque fiquem presos em apenas um navegador.

Arquivos nesta pasta:

- `schema.sql`: proposta inicial de tabelas para Supabase.
- `sync-migration.sql`: ajustes para sincronizacao segura de vendas e estoque.
- `migration-plan.md`: plano por fases para sair do painel local ate a sincronizacao online.

## Arquivos importantes

- `schema.sql` cria as tabelas.
- `seed-perfumes.sql` carrega os perfumes oficiais.
- `sync-migration.sql` adiciona campos, indices e RLS para sincronizacao.
- `setup-checklist.md` orienta a criacao do projeto.
- `migration-plan.md` mostra o plano de migracao.

## Sincronizacao segura

A sincronizacao de vendas e estoque usa rotas server-side do Next.js. Dados
privados como clientes, vendas e estoque nao devem ser lidos nem gravados pelo
navegador usando a anon key publica.

A chave `SUPABASE_SERVICE_ROLE_KEY` deve ficar somente no servidor, em
`.env.local` no ambiente local e nas variaveis de ambiente da hospedagem. Essa
chave nunca deve aparecer em Client Components, no GitHub ou no console do
navegador.

Antes de testar a sincronizacao:

1. Rode `schema.sql`.
2. Rode `seed-perfumes.sql`.
3. Rode `sync-migration.sql`.
4. Exporte um backup completo pelo painel `/admin`.

As tabelas `customers`, `sales` e `inventory_items` ficam com RLS ativado e sem
policy publica. A tabela `perfumes` continua com leitura publica para alimentar
o catalogo do site.

## Teste de conexao

Depois de configurar `.env.local`, acesse:

[http://localhost:3001/admin/supabase-status](http://localhost:3001/admin/supabase-status)

Clique em "Testar leitura dos perfumes".

Para o teste retornar dados, a tabela `perfumes` precisa existir e o arquivo
`seed-perfumes.sql` precisa ter sido executado no Supabase.
