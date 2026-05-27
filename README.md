# AMARO DOS REIS PARFUM

Site em Next.js para catalogo publico da Amaro dos Reis Parfum.

## Rodar localmente

```bash
npm.cmd install
npm.cmd run dev -- -p 3001
```

Abra `http://localhost:3001` no navegador.

## Variaveis opcionais

Configure o numero publico do WhatsApp quando quiser habilitar os botoes:

```bash
NEXT_PUBLIC_WHATSAPP_NUMBER=5599999999999
```

Nao commitar `.env.local`. Esse arquivo pode conter configuracoes locais e deve
ficar fora do repositorio.

## Supabase

O painel interno pode usar Supabase para autenticar o acesso e salvar vendas,
clientes e estoque por usuario. A configuracao completa esta em
[`docs/supabase-setup.md`](docs/supabase-setup.md).

## Catálogo público via Supabase

O catalogo publico usa Supabase quando configurado. Se o Supabase nao estiver
configurado, estiver vazio ou a consulta falhar, o site usa o fallback local de
`lib/perfumes.ts`.

Dados sensiveis como custo, dono do registro e estoque real nao sao expostos no
site publico. Para ativar, aplique manualmente a migration da RPC publica e use
o botao "Importar perfumes iniciais" no painel admin.

## Deploy na Vercel

1. Crie ou importe o projeto na Vercel pelo GitHub.
2. Selecione o repositorio `RonneAmaro/amaro-dos-reis-parfum`.
3. Use o framework `Next.js`.
4. Configure o build command como `npm run build`.
5. Mantenha o output no padrao do Next.js.
6. Se quiser habilitar os botoes de WhatsApp, configure a variavel opcional
   `NEXT_PUBLIC_WHATSAPP_NUMBER` nas variaveis de ambiente da Vercel.
7. Nunca suba `.env.local` para o GitHub.
