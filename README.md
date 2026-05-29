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

## Segurança do painel admin

O `/admin` fica oculto do menu publico. O acesso depende de Supabase Auth e da
tabela `amaro_admin_members`; usuarios autenticados que nao estiverem ativos
nessa tabela nao entram no painel.

O primeiro `owner` precisa ser inserido manualmente pelo SQL Editor depois que o
usuario existir no Supabase Auth. Veja o passo a passo em
[`docs/admin-access.md`](docs/admin-access.md).

## Favicon e identidade visual

O favicon oficial da marca esta em `public/favicon-amaro.svg`.

## Fotos e galeria dos perfumes

O painel aceita URLs para imagem principal, imagem conceitual e galeria de
fotos dos perfumes. A galeria usa uma URL por linha e aparece no catalogo e na
pagina individual do perfume quando preenchida.

O upload real de imagens sera implementado em um pacote futuro com Supabase
Storage. Veja as orientacoes em [`docs/fotos-perfumes.md`](docs/fotos-perfumes.md).

## Deploy na Vercel

1. Crie ou importe o projeto na Vercel pelo GitHub.
2. Selecione o repositorio `RonneAmaro/amaro-dos-reis-parfum`.
3. Use o framework `Next.js`.
4. Configure o build command como `npm run build`.
5. Mantenha o output no padrao do Next.js.
6. Se quiser habilitar os botoes de WhatsApp, configure a variavel opcional
   `NEXT_PUBLIC_WHATSAPP_NUMBER` nas variaveis de ambiente da Vercel.
7. Nunca suba `.env.local` para o GitHub.
