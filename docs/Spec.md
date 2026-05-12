# PontoCerto - Especificacao Funcional e Tecnica (pos Sprint 06)

## 1) Estado atual

Este documento descreve o que **esta implementado hoje** no codigo apos as Sprints 01, 02, 03, 04, 05 e 06.

- Status da sprint: `npm install`, `npm run verify` (`check + test + build`) executando com sucesso na raiz.
- Escopo desta versao: estabilizacao tecnica + reforco de seguranca no backend + consolidacao de historico/relatorios/calculo de horas no frontend + blindagem de build/deploy/API com CI e checklist; sem adicao de novas features visuais.

---

## 2) Objetivo do produto

Aplicacao de controle de ponto pessoal para:

- registrar batidas de jornada;
- acompanhar total trabalhado;
- consultar historico por dia/mes;
- gerar/exportar relatorios em CSV;
- gerenciar perfil e parametros de jornada.

---

## 3) Stack e arquitetura

### 3.1 Frontend

- React 19 + TypeScript + Vite
- Tailwind CSS
- Framer Motion
- Estado global via `AppContext` + reducer
- Cliente API via tRPC React Query

### 3.2 Backend

- Hono (runtime HTTP)
- tRPC (`fetch` adapter)
- Drizzle ORM
- Banco Cloudflare D1 (SQLite)

### 3.3 Estrutura de alto nivel

- `frontend/` - aplicacao web
- `backend/api/` - rotas, contexto, middleware e libs de seguranca
- `backend/db/` - schema e conexao
- `backend/functions/api/[[trpc]].ts` - entrypoint para Cloudflare Pages Functions
- `functions/api/[[trpc]].ts` - entrypoint de Functions no root para deploy do Cloudflare Pages

---

## 4) Funcionalidades implementadas

## 4.1 Autenticacao

**Implementado**

- Login com `username` + `password`.
- Cadastro com `username`, `password`, `name`.
- Sessao baseada em JWT em cookie `httpOnly` (`pontocerto_token`).
- Endpoint para validar sessao atual (`auth.me`).
- Logout com invalidacao do cookie.
- Alteracao de senha (`auth.changePassword`).
- Sanitizacao de retorno de usuario em endpoints de autenticacao (nenhum retorno inclui `password`).

## 4.2 Registro de ponto

**Implementado**

- Registro dos tipos de batida:
  - `in`
  - `lunch-out`
  - `lunch-in`
  - `out`
- Fluxo principal de batida na Home baseado no proximo tipo esperado.
- Listagem de registros do usuario autenticado.
- Edicao e exclusao de registro com validacao de ownership no backend.
- Validacao de sequencia minima no backend em `entry.create`:
  - primeiro registro do dia deve ser `in`
  - `in` permite `lunch-out` ou `out`
  - `lunch-out` permite apenas `lunch-in`
  - `lunch-in` permite apenas `out`
  - apos `out`, novos registros no mesmo dia sao bloqueados
- Hardening de CRUD em `entry.update` e `entry.delete`:
  - `entry.update` revalida sequencia do dia antes de persistir alteracao;
  - `entry.delete` bloqueia exclusao que deixaria sequencia inconsistente no dia.

## 4.3 Historico

**Implementado**

- Calendario mensal com indicador visual por dia:
  - completo (4 batidas)
  - parcial
  - sem registro
- Detalhamento por dia selecionado.
- Edicao de horario diretamente a partir do historico (via `EntryEditor`).
- Ordenacao e agrupamento por dia padronizados com utilitarios compartilhados.
- Tratamento de jornadas incompletas sem quebrar a tela.

## 4.4 Relatorios

**Implementado**

- Resumo por periodo (`semana` e `mes`) com:
  - horas trabalhadas
  - horas extras
  - horas restantes
  - dias trabalhados
- Grafico de barras por dia.
- Exportacao CSV.
- Compartilhamento de CSV via Web Share API (com fallback para download).
- Filtros de periodo (semana/mes) consolidados com regra unica de faixa de datas.
- Calculo de horas consolidado para jornadas:
  - com intervalo (`in -> lunch-out -> lunch-in -> out`)
  - sem intervalo (`in -> out`)
  - incompletas (sem somar valores invalidos)

## 4.5 Perfil e configuracoes

**Implementado**

- Visualizacao de dados basicos de perfil.
- Atualizacao de jornada:
  - horario de entrada
  - horario de saida
  - duracao de almoco
  - meta diaria
- Toggle de tema claro/escuro (frontend).
- Toggle de notificacoes com persistencia em `localStorage` e solicitacao de permissao.
- Acao de exportar todos os dados em CSV no perfil.

---

## 5) API tRPC (estado real)

### 5.1 Publicas

- `ping`
- `auth.login`
- `auth.register`

### 5.2 Autenticadas

- `auth.me`
- `auth.logout`
- `auth.changePassword`
- `user.get`
- `user.update`
- `entry.list`
- `entry.getByDate`
- `entry.create`
- `entry.update`
- `entry.delete`
- `entry.listByMonth`

---

## 6) Modelo de dados atual (D1)

### 6.1 `users`

- `id`, `username`, `password`, `name`
- `company`, `role`, `avatar`
- `work_start_time`, `work_end_time`, `lunch_duration`, `daily_target`
- `created_at`, `updated_at`

### 6.2 `time_entries`

- `id`, `user_id`
- `type` (`in`, `lunch-out`, `lunch-in`, `out`)
- `timestamp`, `date`, `created_at`

### 6.3 `rate_limits`

- `id`, `ip`, `attempted_at`, `blocked_until`

---

## 7) Seguranca implementada

- JWT com `HS256`, expiracao de 7 dias, `aud` e `iss` definidos.
- `JWT_SECRET` obrigatorio (sem fallback inseguro).
- Cookie de sessao com `HttpOnly; Secure; SameSite=Lax`.
- Middleware `authedQuery` para endpoints protegidos.
- Endpoints privados usam `ctx.user.userId` como fonte de verdade para operacoes sensiveis.
- Filtro por ownership em operacoes de registros para impedir acesso cruzado entre usuarios.
- Sanitizacao de retorno de usuario em `auth.login`, `auth.register`, `auth.me`, `user.get` e `user.update`.
- Validacoes de consistencia em update/delete de registros de ponto para reduzir risco de historico e relatorios invalidos.
- Rate limiting no login por IP usando D1:
  - ate 5 tentativas por janela
  - bloqueio de 15 minutos
- Headers de seguranca aplicados no backend.
- Allowlist/CSP atualizados para incluir dominio customizado `https://pontocerto.js.net.br`.

---

## 8) Qualidade e validacoes

**Implementado**

- Type-check via `tsc -b` (com workspaces).
- Testes automatizados no frontend (Vitest) executados via `npm run test --workspace=frontend`.
- Testes automatizados no backend (Vitest) executados via `npm run test --workspace=backend`.
- Script raiz `npm test` cobrindo frontend + backend.
- Build de producao de frontend e backend via `npm run build`.
- Script de verificacao unificada `npm run verify` executando `check -> test -> build`.
- CI versionado em `.github/workflows/ci.yml` para validar `npm run verify` em `push` para `main` e `pull_request`.
- Cobertura frontend ampliada para calculo de horas e limites de filtros por periodo.
- Cobertura backend ampliada para regras de CRUD seguro em `entry.update` e `entry.delete`.
- Fluxo de API em producao endurecido para evitar parse de respostas nao-JSON no cliente tRPC.
- `frontend/vite.config.ts` blindado para carregar `@hono/vite-dev-server` apenas em `command === "serve"`.
- `wrangler.toml` na raiz com `pages_build_output_dir = "dist/public"` e binding D1 `DB`.
- Documentacao operacional adicionada: `docs/DEPLOY_CHECKLIST.md` e `docs/ARCHITECTURE.md`.

**Nao implementado**

- Validacao automatizada de smoke test em ambiente de producao (ex.: `/api/trpc/ping` no dominio publicado) dentro da pipeline.

---

## 9) Pendencias e status

## 9.1 Planejado

- Nao ha itens futuros detalhados em documento de roadmap dentro do repositorio neste momento.

## 9.2 Nao implementado

- Documentacao de API em formato OpenAPI/Swagger.
- Controle de acesso por papeis (RBAC).
- Integracao com provedores externos de notificacao (push/email).
- Validacao backend de coerencia entre `timestamp` e `date` em registros de ponto.
- CRUD de observacoes/anotacoes em registros de ponto.
- Exclusao de conta de usuario.

## 9.3 Riscos conhecidos

- Timezone: o agrupamento e filtros usam `date` (`YYYY-MM-DD`) e a exibicao de horario usa `timestamp` local; divergencias entre os dois campos podem causar exibicao em dia inesperado em cenarios de fuso/virada de dia.
- Deploy: o ambiente de producao ainda depende de configuracao correta de `DB` (D1 binding) e `JWT_SECRET` no Cloudflare Pages, alem de validacao manual de smoke test apos cada publicacao.

> Observacao: os itens acima sao marcados como "nao implementado" por nao estarem presentes no codigo atual. Nao representam compromisso de entrega sem planejamento adicional.
