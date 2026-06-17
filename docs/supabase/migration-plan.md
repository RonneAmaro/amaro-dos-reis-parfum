# Plano de migracao para Supabase

## Fase 1: painel local com backup

Manter o painel em `/admin` usando `localStorage` para vendas e estoque. Antes de qualquer teste de migracao, exportar o backup completo em JSON pelo painel.

## Fase 2: criar Supabase e aplicar schema

Criar o projeto no Supabase, configurar variaveis de ambiente fora do GitHub e aplicar o `schema.sql` inicial pelo SQL Editor.

## Fase 2.1: carga inicial dos perfumes

Aplicar `schema.sql` primeiro e depois aplicar `seed-perfumes.sql`. Conferir no Supabase se todos os perfumes oficiais foram carregados na tabela `perfumes`. So depois dessa conferencia instalar `supabase-js` no projeto e iniciar a conexao real.

## Fase 3: importar perfumes oficiais

Usar a lista oficial de perfumes do projeto como base para preencher a tabela `perfumes`, mantendo slugs, nomes, linhas, precos e custos padrao.

## Fase 4: sincronizar vendas/estoque

Criar uma rotina controlada para importar o backup JSON local para as tabelas `sales` e `inventory_items`. Depois disso, preparar o painel para ler e gravar no Supabase quando as variaveis estiverem configuradas.

## Fase 5: login/admin protegido

Adicionar autenticacao e regras de acesso. RLS e policies devem garantir que apenas usuarios autorizados acessem vendas, clientes, custos e estoque.

## Fase 6: remover dependencia do localStorage

Depois que a sincronizacao estiver validada, reduzir o `localStorage` a cache/fallback ou remover a dependencia dele para operacao principal.
