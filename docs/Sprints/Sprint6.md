# Sprint 06 — Ajuste Geral, Blindagem de Build/Deploy e Proteção contra Regressões

## 1. Objetivo

Corrigir os problemas atuais de build, deploy e API em produção do projeto **PontoCerto** e criar proteções para evitar que esses problemas voltem.

Esta sprint é uma sprint de **blindagem técnica**.

O foco é garantir que:

- o projeto rode localmente;
- o build passe de forma confiável;
- o Cloudflare Pages consiga fazer deploy;
- as Pages Functions compilem;
- `/api/trpc` responda corretamente em produção;
- o login pare de gerar erro de `JSON.parse`;
- exista um processo claro para validar alterações antes de publicar;
- agentes de IA tenham menos chance de quebrar o projeto.

Esta sprint **não muda o visual** do app.

---

## 2. Contexto

Foram identificados problemas reais no projeto:

1. Erro no login em produção:

```txt
JSON.parse: unexpected end of data at line 1 column 1 of the JSON data
```

2. Erro no Cloudflare Pages Functions:

```txt
Could not resolve "../../../backend/api/router"
Could not resolve "../../../backend/api/context"
Could not resolve "../../../backend/api/lib/security"
```

3. Cloudflare Pages não encontrou configuração Wrangler na raiz:

```txt
No Wrangler configuration file found. Continuing.
```

4. Build local apresentou erro separado no `frontend/vite.config.ts`, provavelmente relacionado ao uso do `@hono/vite-dev-server` durante o build de produção.

Esses problemas indicam que o projeto precisa de uma sprint focada em:

```txt
build local → functions → wrangler → Cloudflare → API → login → CI → documentação
```

---

## 3. Regra Principal

Não criar features novas.

Não redesenhar.

Não alterar animações.

Não trocar stack.

A regra desta sprint é:

```txt
Corrigir infraestrutura e organização técnica sem mudar a experiência visual do usuário.
```

---

## 4. Escopo da Sprint

Esta sprint deve cobrir obrigatoriamente:

1. Corrigir `frontend/vite.config.ts`
2. Corrigir imports de `functions/api/[[trpc]].ts`
3. Criar ou ajustar `wrangler.toml` na raiz do projeto
4. Revisar configuração do Cloudflare Pages
5. Garantir que `/api/trpc/ping` funcione
6. Garantir que `auth.login` responda JSON/tRPC válido
7. Corrigir erro de `JSON.parse` no login
8. Criar script `npm run verify`
9. Criar GitHub Action de CI
10. Criar checklist de deploy
11. Criar documentação de arquitetura/deploy
12. Atualizar `docs/PROJECT_STATUS.md`
13. Preservar visual e animações atuais

---

## 5. Fora do Escopo

Não fazer nesta sprint:

- alterar layout;
- redesenhar dashboard;
- trocar cores;
- remover animações;
- trocar React;
- trocar Vite;
- trocar Hono;
- trocar tRPC;
- trocar Drizzle;
- trocar Cloudflare D1;
- migrar para Supabase/Next.js/Prisma;
- criar novas telas;
- criar CRUDs novos;
- criar exportação PDF/Excel;
- criar admin;
- criar multiempresa;
- alterar schema do banco sem necessidade comprovada;
- refatorar o projeto inteiro.

Se algo parecer necessário, documentar como pendência futura.

---

## 6. Diagnóstico Inicial Obrigatório

Antes de alterar arquivos, o agente deve mapear:

### 6.1 Build local

Verificar:

```bash
npm install
npm run check
npm test
npm run build
```

Registrar:

- qual comando passa;
- qual comando falha;
- mensagem exata de erro;
- arquivo envolvido;
- causa provável.

### 6.2 Deploy Cloudflare

Verificar:

- se existe `wrangler.toml` na raiz;
- se existe `wrangler.toml` somente em `backend/`;
- se `pages_build_output_dir` está correto;
- se `dist/public` é realmente gerado;
- se a pasta `functions/` está na raiz;
- se `functions/api/[[trpc]].ts` compila;
- se o binding D1 `DB` existe;
- se `JWT_SECRET` está configurado em produção.

### 6.3 Fluxo da API

Mapear:

```txt
frontend/src/providers/trpc.tsx
→ /api/trpc
→ functions/api/[[trpc]].ts
→ backend/api/router.ts
→ backend/api/context.ts
→ D1
```

### 6.4 Fluxo de login

Mapear:

```txt
Tela de login
→ auth.login mutation
→ /api/trpc/auth.login
→ valida usuário/senha
→ cria JWT
→ Set-Cookie
→ retorna user seguro
```

---

## 7. Correção 1 — frontend/vite.config.ts

O `@hono/vite-dev-server` deve rodar apenas no desenvolvimento local.

Durante o build de produção, ele não deve ser carregado.

### Objetivo

Evitar que `npm run build` tente resolver o backend de desenvolvimento e quebre o build do frontend.

### Ajuste esperado

Atualizar `frontend/vite.config.ts` para seguir esta lógica:

```ts
export default defineConfig(({ command }) => ({
  plugins: [
    command === "serve"
      ? devServer({
          entry: path.resolve(__dirname, "../backend/api/boot.ts"),
          exclude: [/^\/(?!api\/).*$/],
        })
      : null,
    react(),
  ].filter(Boolean),
}));
```

Também preferir:

```ts
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
```

em vez de depender diretamente de `import.meta.dirname`.

### Critério de aceite

O comando abaixo deve passar:

```bash
npm run build --workspace=frontend
```

---

## 8. Correção 2 — functions/api/[[trpc]].ts

Corrigir os imports da Pages Function.

### Problema

O Cloudflare Pages tentou compilar `functions/api/[[trpc]].ts` e falhou ao resolver imports para o backend.

### Caminho esperado

Se o arquivo está em:

```txt
functions/api/[[trpc]].ts
```

e o backend está em:

```txt
backend/api/router.ts
backend/api/context.ts
backend/api/lib/security.ts
```

então o caminho provável correto é:

```ts
import { appRouter } from "../../backend/api/router";
import { createContext } from "../../backend/api/context";
import { getSecurityHeaders, handleCors } from "../../backend/api/lib/security";
```

O agente deve confirmar a estrutura real antes de aplicar.

### Critério de aceite

Cloudflare Pages Functions não devem mais falhar com:

```txt
Could not resolve backend/api/router
Could not resolve backend/api/context
Could not resolve backend/api/lib/security
```

---

## 9. Correção 3 — wrangler.toml na raiz

Criar ou ajustar:

```txt
wrangler.toml
```

na raiz do repositório.

### Conteúdo recomendado

```toml
name = "pontocerto"
compatibility_date = "2025-05-01"
compatibility_flags = ["nodejs_compat"]
pages_build_output_dir = "dist/public"

[[d1_databases]]
binding = "DB"
database_name = "pontocerto"
database_id = "e1eec67e-5c8a-4d6a-ac3a-af6daefddd1d"
```

### Critério de aceite

O Cloudflare Pages não deve mais mostrar:

```txt
No Wrangler configuration file found. Continuing.
```

---

## 10. Correção 4 — Configuração Cloudflare Pages

Validar no painel do Cloudflare Pages:

```txt
Root directory:
raiz do repositório

Build command:
npm run build

Build output directory:
dist/public
```

Validar bindings/variáveis:

```txt
D1 binding:
DB

Environment variable:
JWT_SECRET
```

### Critério de aceite

O deploy deve:

- instalar dependências;
- rodar `npm run build`;
- publicar `dist/public`;
- compilar `functions/`;
- disponibilizar `/api/trpc`.

---

## 11. Correção 5 — API Smoke Test

Criar um teste/manual checklist para validar API em produção.

### Testes obrigatórios

Depois do deploy:

```bash
curl -i https://pontocerto.js.net.br/api/trpc/ping
```

O resultado deve ser JSON/tRPC válido.

Também testar:

```txt
login inválido
login válido
auth.me após login
logout
refresh da página logado
```

### Critério de aceite

O login não deve mais mostrar:

```txt
JSON.parse: unexpected end of data
```

---

## 12. Correção 6 — Tratamento de erro no frontend

O frontend não deve mostrar erro técnico cru para o usuário.

### Problema

Mensagens como estas não são boas para usuário final:

```txt
JSON.parse
TRPCClientError
Unexpected end of data
Internal Server Error
```

### Objetivo

Criar ou ajustar helper de erro, se ainda não existir:

```txt
frontend/src/utils/getErrorMessage.ts
```

ou equivalente no padrão atual.

### Mensagens sugeridas

```txt
Não foi possível conectar ao servidor. Tente novamente em alguns instantes.
Não foi possível entrar. Verifique seus dados e tente novamente.
Sua sessão expirou. Faça login novamente.
```

### Restrição

Não alterar visual. Apenas melhorar a mensagem.

---

## 13. Correção 7 — Script npm run verify

Adicionar no `package.json` da raiz:

```json
{
  "scripts": {
    "verify": "npm run check && npm test && npm run build"
  }
}
```

Se `npm test` atualmente roda só frontend, ajustar para incluir backend:

```json
{
  "scripts": {
    "test": "npm run test --workspace=frontend && npm run test --workspace=backend"
  }
}
```

Somente ajustar se o backend tiver teste configurado e o comando funcionar.

### Critério de aceite

Este comando deve existir:

```bash
npm run verify
```

E deve rodar:

```txt
check → test → build
```

---

## 14. Correção 8 — GitHub Action CI

Criar:

```txt
.github/workflows/ci.yml
```

### Conteúdo recomendado

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:

jobs:
  verify:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm

      - name: Install
        run: npm ci

      - name: Check
        run: npm run check

      - name: Test
        run: npm test

      - name: Build
        run: npm run build
```

### Critério de aceite

Toda alteração no `main` deve ser validada antes de virar problema no Cloudflare.

---

## 15. Correção 9 — Deploy Checklist

Criar:

```txt
docs/DEPLOY_CHECKLIST.md
```

### Conteúdo mínimo

```md
# Deploy Checklist — PontoCerto

Antes do deploy:

- [ ] npm run verify passou
- [ ] frontend build passou
- [ ] backend build passou
- [ ] wrangler.toml existe na raiz
- [ ] pages_build_output_dir = "dist/public"
- [ ] functions/api/[[trpc]].ts compila
- [ ] D1 binding DB existe no Cloudflare
- [ ] JWT_SECRET existe no Cloudflare
- [ ] domínio customizado está configurado
- [ ] /api/trpc/ping responde
- [ ] login inválido mostra erro amigável
- [ ] login válido funciona
- [ ] auth.me funciona após login
- [ ] logout funciona
```

---

## 16. Correção 10 — Documentação de Arquitetura

Criar:

```txt
docs/ARCHITECTURE.md
```

### Conteúdo mínimo

Documentar:

- stack atual;
- estrutura do monorepo;
- como frontend chama backend;
- como `/api/trpc` funciona em dev;
- como `/api/trpc` funciona em produção;
- diferença entre `@hono/vite-dev-server` e Pages Functions;
- onde fica o router tRPC;
- onde fica o contexto/auth;
- onde ficam schemas do banco;
- regras para agentes de IA.

### Regra para IA

Adicionar seção:

```md
## Regras para agentes de IA

- Não alterar visual sem pedido explícito.
- Não remover animações.
- Não trocar stack.
- Não alterar banco sem explicar impacto.
- Não alterar deploy sem rodar npm run verify.
- Não mexer fora do escopo da sprint.
- Antes de alterar, apresentar plano.
- Depois de alterar, entregar comandos executados e resultados.
```

---

## 17. Correção 11 — Atualizar PROJECT_STATUS

Atualizar:

```txt
docs/PROJECT_STATUS.md
```

Adicionar seção:

```md
## Sprint 06 — Ajuste Geral, Blindagem de Build/Deploy e Proteção contra Regressões
```

Com:

- data;
- erros investigados;
- causa encontrada;
- arquivos alterados;
- comandos executados;
- resultado do build;
- resultado dos testes;
- resultado do deploy;
- pendências;
- riscos restantes.

---

## 18. Ordem de Execução Recomendada

Executar nesta ordem:

```txt
1. Rodar npm run build e registrar erro atual
2. Corrigir frontend/vite.config.ts
3. Rodar build do frontend
4. Corrigir functions/api/[[trpc]].ts
5. Criar wrangler.toml na raiz
6. Criar npm run verify
7. Criar GitHub Action
8. Criar DEPLOY_CHECKLIST.md
9. Criar ARCHITECTURE.md
10. Rodar npm run verify
11. Fazer deploy/preview Cloudflare
12. Testar /api/trpc/ping
13. Testar login
14. Atualizar PROJECT_STATUS.md
```

---

## 19. Comandos de Validação

Rodar localmente:

```bash
npm install
npm run check
npm test
npm run build
npm run verify
```

Se necessário:

```bash
npm run build --workspace=frontend
npm run build --workspace=backend
npm run test --workspace=frontend
npm run test --workspace=backend
```

Após deploy:

```bash
curl -i https://pontocerto.js.net.br/api/trpc/ping
```

---

## 20. Critérios de Aceite

A sprint será aceita quando:

- `npm run build` passar localmente;
- `npm run verify` existir;
- `npm run verify` passar ou falhas restantes estiverem documentadas com causa clara;
- `frontend/vite.config.ts` não carregar `@hono/vite-dev-server` durante build;
- `functions/api/[[trpc]].ts` compilar no Cloudflare Pages;
- `wrangler.toml` existir na raiz;
- Cloudflare Pages reconhecer a configuração;
- D1 binding `DB` estiver configurado;
- `JWT_SECRET` estiver configurado;
- `/api/trpc/ping` responder em produção;
- login não mostrar erro de `JSON.parse`;
- CI GitHub existir;
- checklist de deploy existir;
- arquitetura básica estiver documentada;
- visual atual estiver preservado;
- animações estiverem preservadas;
- nenhuma feature fora do escopo tiver sido criada.

---

## 21. Relatório Final Esperado

Ao final, o agente deve entregar:

```md
# Relatório — Sprint 06

## Resumo

...

## Problemas corrigidos

- ...

## Causa dos erros

- ...

## Arquivos alterados

- ...

## Configuração de build/deploy

- ...

## Testes e comandos executados

- npm run check: passou/falhou
- npm test: passou/falhou
- npm run build: passou/falhou
- npm run verify: passou/falhou

## Validação em produção

- /api/trpc/ping: passou/falhou
- login inválido: passou/falhou
- login válido: passou/falhou
- auth.me: passou/falhou
- logout: passou/falhou

## Documentação criada/atualizada

- ...

## Preservação visual

- visual preservado: sim
- animações preservadas: sim
- redesign realizado: não

## Pendências

- ...

## Riscos restantes

- ...
```

---

## 22. Prompt de Planejamento para Agente

Use primeiro:

```txt
Você está trabalhando no projeto PontoCerto.

Leia:
- docs/SPEC.md
- docs/PROJECT_STATUS.md, se existir
- docs/sprints/SPRINT_06.md

Não altere arquivos ainda.

Faça o planejamento da Sprint 06.

Problemas conhecidos:
1. login em produção mostra JSON.parse: unexpected end of data
2. Cloudflare Pages Functions falhou ao resolver imports do backend
3. Cloudflare Pages não encontrou wrangler.toml na raiz
4. npm run build falhou no frontend/vite.config.ts com erro de resolve/Cannot read directory
5. precisamos evitar que IA quebre o projeto em futuras sprints

Objetivo:
Corrigir build, deploy, API em produção e criar proteções de CI/documentação/checklist.

Importante:
- não altere visual
- não remova animações
- não crie feature nova
- não troque stack
- não altere banco sem necessidade comprovada
- não implemente ainda

Entregue:
1. causa provável de cada problema
2. arquivos que precisam ser analisados
3. arquivos que provavelmente serão alterados
4. plano de correção em etapas
5. comandos que serão executados
6. riscos da correção
7. como validar depois
```

---

## 23. Prompt de Execução para Agente

Use depois de aprovar o plano:

```txt
Execute a Sprint 06 do PontoCerto.

Siga:
- docs/SPEC.md
- docs/sprints/SPRINT_06.md

Tarefas obrigatórias:
1. corrigir frontend/vite.config.ts para carregar @hono/vite-dev-server somente em command === "serve"
2. corrigir imports de functions/api/[[trpc]].ts
3. criar wrangler.toml na raiz com pages_build_output_dir = "dist/public" e binding D1 DB
4. revisar configuração esperada do Cloudflare Pages
5. criar npm run verify
6. criar .github/workflows/ci.yml
7. criar docs/DEPLOY_CHECKLIST.md
8. criar docs/ARCHITECTURE.md
9. melhorar mensagem de erro do login se necessário, sem alterar visual
10. atualizar docs/PROJECT_STATUS.md
11. rodar npm run verify

Restrições:
- não alterar visual
- não remover animações
- não criar feature nova
- não trocar stack
- não alterar schema do banco sem necessidade
- não refatorar o projeto inteiro
- não remover testes sem justificar

Ao final, entregue:
1. causa encontrada
2. arquivos alterados
3. correções feitas
4. comandos executados
5. resultado de npm run verify
6. instruções de configuração no Cloudflare Pages
7. como testar /api/trpc/ping
8. como testar login
9. pendências restantes
```

---

## 24. Prompt de Revisão Pós-Sprint

Use depois que o agente terminar:

```txt
Revise a implementação da Sprint 06.

Não altere arquivos ainda.

Verifique:
1. se npm run build passa
2. se npm run verify existe e funciona
3. se vite.config.ts não carrega devServer no build
4. se functions/api/[[trpc]].ts usa imports corretos
5. se wrangler.toml está na raiz
6. se pages_build_output_dir aponta para dist/public
7. se CI foi criado corretamente
8. se DEPLOY_CHECKLIST.md foi criado
9. se ARCHITECTURE.md foi criado
10. se PROJECT_STATUS.md foi atualizado
11. se visual e animações foram preservados
12. se nenhuma feature fora do escopo foi criada

Entregue:
- problemas encontrados
- nível de risco
- correções recomendadas
- se a sprint pode ser aceita ou não
```
