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

## Instalar no celular (PWA)

O site pode ser instalado como aplicativo. No Android, abra no Chrome, toque
nos tres pontos e escolha `Instalar app` ou `Adicionar a tela inicial`. No
iPhone, abra no Safari, toque em Compartilhar e escolha `Adicionar a Tela de
Inicio`. A pagina `/instalar` tambem apresenta essas orientacoes.

## Protecao do painel administrativo

O acesso a `/admin` e suas subpaginas exige uma sessao assinada em cookie
`httpOnly`. Configure as variaveis abaixo apenas no ambiente local ou na
plataforma de hospedagem:

```bash
AMARO_ADMIN_PASSWORD=
AMARO_ADMIN_SESSION_SECRET=
```

Use uma senha exclusiva para `AMARO_ADMIN_PASSWORD` e um segredo longo e
aleatorio (recomendado: pelo menos 32 caracteres) para
`AMARO_ADMIN_SESSION_SECRET`. Nenhum desses valores deve usar o prefixo
`NEXT_PUBLIC_` ou ser commitado. O login fica em `/admin/login` e o botao
`Sair do painel` encerra a sessao.

## Variaveis opcionais

Configure o numero publico do WhatsApp quando quiser habilitar os botoes:

```bash
NEXT_PUBLIC_WHATSAPP_NUMBER=5599999999999
```

Nao commitar `.env.local`. Esse arquivo pode conter configuracoes locais e deve
ficar fora do repositorio.

## Supabase futuro

O painel atual em `/admin` usa `localStorage` para vendas, estoque, custos,
lucro e backups. A pasta [`docs/supabase`](docs/supabase) contem o schema
inicial e o plano de migracao para uma futura sincronizacao com Supabase.

Antes de migrar, exporte um backup completo pelo painel. Esse arquivo JSON sera
usado para conferir vendas e estoque antes de qualquer importacao.

Futuramente sera necessario configurar estas variaveis fora do GitHub:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

## Preparacao do banco

A preparacao do banco para a futura fase Supabase esta documentada em:

- [`docs/supabase/schema.sql`](docs/supabase/schema.sql): cria as tabelas iniciais.
- [`docs/supabase/seed-perfumes.sql`](docs/supabase/seed-perfumes.sql): carrega os perfumes oficiais.
- [`docs/supabase/setup-checklist.md`](docs/supabase/setup-checklist.md): orienta a criacao do projeto Supabase e variaveis.

## Cliente Supabase

A dependencia oficial `@supabase/supabase-js` foi adicionada ao projeto. O
cliente so e criado se as variaveis publicas estiverem configuradas:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Sem essas variaveis, o site continua funcionando normalmente com o painel local
em `localStorage`. A sincronizacao real de vendas e estoque sera feita em um
pacote futuro.

## Sincronizacao segura de vendas e estoque

O painel local continua usando `localStorage`, mas agora possui rotas manuais
para enviar e buscar vendas/estoque no Supabase quando o ambiente estiver
preparado. A sincronizacao nao e automatica e nao apaga dados locais sem
confirmacao.

A `SUPABASE_SERVICE_ROLE_KEY` deve ser usada somente em rotas server-side. Ela
nao pode ser exposta no navegador, no GitHub ou em Client Components. O painel
envia apenas um token temporario no header `x-amaro-admin-token`, configurado
por `AMARO_ADMIN_SYNC_TOKEN`.

Variaveis necessarias para testar a sincronizacao privada:

```bash
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
AMARO_ADMIN_SYNC_TOKEN=
```

Antes de sincronizar, exporte um backup completo pelo painel `/admin`. Esta
etapa ainda nao substitui um login final; futuramente a protecao sera evoluida
com Supabase Auth, RLS e regras administrativas definitivas.

## Agenda de recebimentos

O painel `/admin` possui uma agenda interna para acompanhar vendas pagas,
pendentes e fiadas, com data prevista, telefone, forma esperada e observacao de
cobranca. Cada recebimento pode gerar uma mensagem de WhatsApp e um link
publico de criacao de evento no Google Agenda, sem OAuth ou API externa.

Os novos campos continuam incluidos no backup JSON e na exportacao CSV. Vendas
antigas sem esses dados permanecem compativeis e aparecem em `Sem data
definida` quando ainda estiverem pendentes.

Como a sincronizacao do Supabase usa colunas fixas, aplique manualmente a
migration abaixo antes de enviar vendas com os novos campos:

```text
docs/supabase/receivables-migration.sql
```

A migration nao e executada pela aplicacao. Exporte um backup completo antes
de aplica-la no SQL Editor do Supabase.

## Vendas flexiveis e assistente rapido

O cadastro de vendas funciona como carrinho: permite varios perfumes para o
mesmo cliente, preco manual, desconto por item, brinde, uso pessoal, amostra,
troca e pagamento parcial. Itens que nao sao venda baixam estoque, mas ficam
com total faturado igual a zero. Vendas antigas sem `items` continuam sendo
tratadas como vendas de item unico.

O Assistente rapido interpreta frases localmente, usando regras e os nomes dos
perfumes. Ele nao envia dados para servicos externos e nunca salva sem revisao.
Quando o navegador oferecer Web Speech API, o botao `Falar venda` preenche o
mesmo campo de texto.

Antes de sincronizar vendas flexiveis, aplique manualmente no Supabase:

```text
docs/supabase/flexible-sales-migration.sql
```

Essa migration adiciona `items` em JSONB e os totais opcionais. Ela nao e
executada automaticamente; exporte um backup antes de aplica-la.

## Google Agenda com OAuth

O painel pode criar e atualizar eventos reais de cobranca no Google Agenda. Os
tokens OAuth ficam criptografados no Supabase e sao acessados somente pelas
rotas server-side protegidas pela sessao administrativa. Nenhum token e salvo
no `localStorage` ou enviado ao navegador.

Para OAuth do Google Agenda funcionar, o cookie admin usa `SameSite=Lax` para
permitir o retorno seguro do Google em navegacao top-level. O cookie permanece
assinado, `httpOnly` e `secure` em producao.

No Google Cloud Console:

1. Crie ou selecione um projeto.
2. Ative a `Google Calendar API`.
3. Configure a tela de consentimento OAuth e inclua a conta do administrador
   como usuario de teste enquanto o aplicativo estiver em modo de teste.
4. Crie uma credencial `OAuth client ID` do tipo `Web application`.
5. Cadastre os redirect URIs autorizados:
   - Local: `http://localhost:3001/api/admin/google-calendar/callback`
   - Producao: `https://amarodosreisparfum.vercel.app/api/admin/google-calendar/callback`

Configure no ambiente local e na Vercel:

```bash
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:3001/api/admin/google-calendar/callback
GOOGLE_TOKEN_ENCRYPTION_KEY=
GOOGLE_CALENDAR_ID=primary
NEXT_PUBLIC_BUSINESS_TIME_ZONE=America/Porto_Velho
```

Para gerar uma chave de criptografia aleatoria no PowerShell:

```powershell
$bytes = New-Object byte[] 32; [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes); [Convert]::ToBase64String($bytes)
```

Nunca reutilize o client secret como chave de criptografia e nunca commite
esses valores. Aplique manualmente a migration:

```text
docs/supabase/google-calendar-migration.sql
```

Para testar: inicie o site na porta 3001, entre em `/admin`, conecte a conta na
secao `Google Agenda`, crie uma venda pendente com data prevista no dia 15 e
clique em `Criar lembrete no Google Agenda`. Abra o evento pelo link exibido.
Ao marcar a venda como recebida, confirme a remocao do lembrete e confira o
resultado no Google Agenda.

## Catalogo com fallback

O catalogo publico tenta ler os perfumes do Supabase. Se as variaveis nao
estiverem configuradas, se a consulta falhar ou se o Supabase retornar vazio, o
site usa `lib/perfumes.ts` como fallback local.

Esse comportamento evita que o site quebre quando o Supabase estiver
indisponivel ou ainda nao estiver configurado no ambiente.

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

## Heartbeat diario do Supabase

O heartbeat faz uma consulta somente de leitura e sem retorno de linhas na
tabela `public.perfumes`. Isso gera atividade legitima e leve no Supabase, sem
criar ou alterar vendas, estoque ou qualquer outro dado. A rota server-side e:

```text
/api/cron/supabase-heartbeat
```

O arquivo `vercel.json` agenda uma chamada diaria para `09:00 UTC` (05:00 em
Rondonia, UTC-4). Em contas Hobby, a Vercel pode executar o cron dentro da hora
agendada, sem precisao de minuto. Configure um segredo longo e aleatorio tanto
no ambiente local usado para teste quanto em `Settings > Environment Variables`
do projeto na Vercel:

```bash
CRON_SECRET=uma_chave_grande_secreta
```

Nao use o prefixo `NEXT_PUBLIC_`. O segredo nao deve ir para o navegador, banco
ou GitHub. Na Vercel, quando `CRON_SECRET` esta configurado, o Cron envia
automaticamente `Authorization: Bearer <CRON_SECRET>` para a rota. A rota
recusa chamadas quando o segredo estiver ausente ou o header estiver incorreto.

Para testar localmente no PowerShell, configure temporariamente a variavel na
sessao do terminal e inicie o Next.js:

```powershell
$env:CRON_SECRET="minha-chave"
npm.cmd run dev -- -p 3001
```

Em outro terminal PowerShell, faca a chamada autenticada:

```powershell
$headers = @{ Authorization = "Bearer minha-chave" }
Invoke-RestMethod -Uri "http://localhost:3001/api/cron/supabase-heartbeat" -Headers $headers
```

O ambiente local tambem precisa de `NEXT_PUBLIC_SUPABASE_URL` e
`SUPABASE_SERVICE_ROLE_KEY`, ja usadas pelo client server-side existente. Para
testar depois do deploy, substitua a URL local pela URL de producao:

```powershell
$headers = @{ Authorization = "Bearer sua-chave-da-vercel" }
Invoke-RestMethod -Uri "https://seu-dominio.vercel.app/api/cron/supabase-heartbeat" -Headers $headers
```

Uma resposta bem-sucedida contem `ok: true`, o servico, o horario da checagem e
uma contagem resumida. Segredos nunca sao incluidos na resposta. Depois do
deploy, o agendamento pode ser acompanhado em `Settings > Cron Jobs` na Vercel.

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
