# Configuração Supabase — Amaro dos Reis Parfum

1. Crie um projeto no Supabase.
2. Copie a `NEXT_PUBLIC_SUPABASE_URL` nas configuracoes de API do projeto.
3. Copie a `NEXT_PUBLIC_SUPABASE_ANON_KEY` nas configuracoes de API do projeto.
4. Crie o arquivo `.env.local` com:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_WHATSAPP_NUMBER=...
```

5. Aplique manualmente a migration `supabase/migrations/20260527_create_amaro_admin_base.sql` no SQL Editor do Supabase.
6. Crie um usuario pelo Supabase Auth.
7. Acesse `/admin` e faca login.

Avisos importantes:

- Nunca commitar `.env.local`.
- Nao usar service role no frontend.
- O painel local ainda existe como fallback ate validar tudo.
