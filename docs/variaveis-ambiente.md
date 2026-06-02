# Variáveis de ambiente

## `NEXT_PUBLIC_SITE_URL`

URL pública do site, usada em metadata, sitemap e robots.

Exemplo:

```bash
NEXT_PUBLIC_SITE_URL=https://seu-dominio-ou-vercel.app
```

## `NEXT_PUBLIC_SUPABASE_URL`

URL pública do projeto Supabase. Necessária quando o site usa dados públicos,
admin, autenticação e Storage do Supabase.

## `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Chave pública anon do Supabase. Ela pode ser usada no frontend junto com as
policies corretas do Supabase.

Nunca use service role no frontend.

## `NEXT_PUBLIC_WHATSAPP_NUMBER`

Número público do WhatsApp usado nos botões do site.

Exemplo:

```bash
NEXT_PUBLIC_WHATSAPP_NUMBER=55...
```

## Boas práticas

- `.env.local` é local e não deve ser commitado.
- A Vercel precisa das mesmas variáveis cadastradas no painel do projeto.
- Configure as variáveis em `Settings > Environment Variables`.
- Depois de alterar variável na Vercel, faça redeploy.
- Nunca commitar segredos.
