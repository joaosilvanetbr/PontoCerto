# Arquitetura - PontoCerto

## Stack atual

- Frontend: React 19, TypeScript, Vite, Tailwind, Framer Motion.
- Backend: Hono + tRPC (`fetch` adapter).
- Dados: Drizzle ORM + Cloudflare D1.
- Deploy: Cloudflare Pages + Pages Functions.

## Estrutura do monorepo

- `frontend/`: app web.
- `backend/api/`: router tRPC, contexto, auth e seguranca.
- `backend/db/`: schema e acesso ao banco.
- `functions/api/[[trpc]].ts`: entrypoint de producao para Pages Functions.
- `backend/functions/api/[[trpc]].ts`: espelho de function para contexto do backend.

## Fluxo frontend -> backend

- O frontend usa `frontend/src/providers/trpc.tsx`.
- As chamadas vao para `/api/trpc`.
- O router executa em `backend/api/router.ts` com contexto de `backend/api/context.ts`.

## /api/trpc no desenvolvimento

- Em dev, `@hono/vite-dev-server` eh carregado apenas quando `command === "serve"` no `frontend/vite.config.ts`.
- O entrypoint de desenvolvimento usado pelo plugin eh `backend/api/boot.ts`.

## /api/trpc em producao

- Em producao (Cloudflare Pages), o endpoint eh resolvido por `functions/api/[[trpc]].ts`.
- Essa function chama `fetchRequestHandler` do tRPC e usa `appRouter` + `createContext`.

## Diferenca entre dev server e Pages Functions

- `@hono/vite-dev-server`: apenas ambiente local de desenvolvimento.
- Pages Functions: runtime de producao para `/api/trpc`.

## Router, contexto, auth e banco

- Router tRPC: `backend/api/router.ts`.
- Contexto/auth: `backend/api/context.ts` e `backend/api/lib/auth.ts`.
- Seguranca/CORS/headers: `backend/api/lib/security.ts`.
- Schemas de banco: `backend/db/schema.ts`.

## Regras para agentes de IA

- Nao alterar visual sem pedido explicito.
- Nao remover animacoes.
- Nao trocar stack.
- Nao alterar banco sem explicar impacto.
- Nao alterar deploy sem rodar `npm run verify`.
- Nao mexer fora do escopo da sprint.
- Antes de alterar, apresentar plano.
- Depois de alterar, entregar comandos executados e resultados.

