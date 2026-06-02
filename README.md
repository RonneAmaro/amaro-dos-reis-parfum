# AMAROdosREIS Parfum

Site em Next.js para catalogo publico da Amaro dos Reis Parfum.

## Identidade da marca

- Nome visual principal: AMAROdosREIS Parfum
- Uso institucional/narrativo: Amaro dos Reis Parfum
- Logo oficial: `public/logo-amaro-parfum.png`
- Favicon/icone oficial: `public/amaro-parfum-icon.svg`
- Fallback PNG: `public/favicon-amaro.png`

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

O favicon/icone oficial da marca esta em `public/amaro-parfum-icon.svg` e e
priorizado nos metadados do Next.js. O fallback PNG esta em
`public/favicon-amaro.png`.

Se o favicon nao aparecer no navegador, teste `Ctrl+F5`, uma aba anonima ou
limpe o cache do navegador, porque favicons costumam ficar armazenados por mais
tempo.

## Fotos e galeria dos perfumes

O painel aceita URLs para imagem principal, imagem conceitual e galeria de
fotos dos perfumes. A galeria usa uma URL por linha e aparece no catalogo e na
pagina individual do perfume quando preenchida.

## Upload de imagens dos perfumes

O upload de imagens usa Supabase Storage com o bucket publico
`amaro-perfumes`. Aplique a migration de Storage antes de usar o envio pelo
painel admin.

O frontend usa apenas a anon key publica e as policies do Storage; nao use
service role no navegador. As imagens de catalogo sao publicas para exibicao no
site.

Veja as orientacoes em [`docs/fotos-perfumes.md`](docs/fotos-perfumes.md).

## Deploy na Vercel

1. Crie ou importe o projeto na Vercel pelo GitHub.
2. Selecione o repositorio `RonneAmaro/amaro-dos-reis-parfum`.
3. Use o framework `Next.js`.
4. Configure o build command como `npm run build`.
5. Mantenha o output no padrao do Next.js.
6. Se quiser habilitar os botoes de WhatsApp, configure a variavel opcional
   `NEXT_PUBLIC_WHATSAPP_NUMBER` nas variaveis de ambiente da Vercel.
7. Nunca suba `.env.local` para o GitHub.

## Publicação na Vercel

1. Importe o repositorio no Vercel.
2. Confirme o framework como `Next.js`.
3. Configure o build command como `npm run build`.
4. Cadastre as variaveis necessarias ou opcionais em `Settings > Environment Variables`.
5. Depois de alterar qualquer variavel, faca um novo redeploy.

Variaveis:

```bash
NEXT_PUBLIC_SITE_URL=https://seu-dominio-ou-vercel.app
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_WHATSAPP_NUMBER=55...
```

Nunca commitar `.env.local`. O arquivo local pode conter configuracoes privadas
ou de ambiente e deve ficar fora do repositorio.

## Status do ambiente

A rota `/status` serve para diagnostico visual antes de publicar ou validar a
producao. Ela mostra apenas se as variaveis publicas estao configuradas, sem
exibir valores ou segredos.

Essa rota nao aparece no menu publico e deve ser usada para conferir ambiente,
WhatsApp, identidade visual, rotas principais e proximos passos da Vercel.
