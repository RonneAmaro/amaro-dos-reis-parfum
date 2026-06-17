# Checklist Supabase - Amaro dos Reis Parfum

1. Criar projeto no Supabase.
2. Abrir SQL Editor.
3. Rodar `docs/supabase/schema.sql`.
4. Rodar `docs/supabase/seed-perfumes.sql`.
5. Rodar `docs/supabase/sync-migration.sql`.
6. Ir em Project Settings > API.
7. Copiar Project URL.
8. Copiar anon public key.
9. Copiar service_role key para uso server-side.
10. Criar um token temporario forte para `AMARO_ADMIN_SYNC_TOKEN`.
11. Criar `.env.local` local com:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
AMARO_ADMIN_SYNC_TOKEN=
```

12. Reiniciar o servidor local depois de salvar as variaveis.
13. Acessar `/admin` e testar a area "Sincronizacao com Supabase".
14. Na Vercel, cadastrar as variaveis equivalentes em Environment Variables.
15. Antes de sincronizar vendas/estoque, exportar backup completo pelo painel `/admin`.
