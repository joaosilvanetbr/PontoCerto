# Sprint 05 — Auditoria Técnica, Correção de Bugs e Organização da Lógica

## 1. Objetivo

Fazer uma auditoria técnica no projeto **PontoCerto**, corrigir problemas reais encontrados no funcionamento atual e organizar a lógica do código sem redesenhar a interface.

Esta sprint tem como foco deixar o projeto mais confiável, previsível e fácil de evoluir.

O objetivo não é criar funcionalidades novas. O objetivo é:

```txt
entender → corrigir → organizar → testar → documentar
```

---

## 2. Contexto

O projeto já passou por planejamento de sprints anteriores:

- Sprint 01: estabilização inicial;
- Sprint 02: segurança e validações do backend;
- Sprint 03: histórico, relatórios e cálculo de horas;
- Sprint 04: CRUDs pendentes preservando visual.

Durante o uso em produção, foi identificado um erro no login:

```txt
JSON.parse: unexpected end of data at line 1 column 1 of the JSON data
```

Esse erro indica que o frontend tentou interpretar uma resposta como JSON, mas a API respondeu vazio, HTML, 404, 500 ou outro conteúdo inválido.

Também foi observado possível problema de configuração entre:

```txt
frontend → /api/trpc → backend Hono/tRPC → Cloudflare/D1
```

Por isso, antes de continuar adicionando funcionalidades, é necessário fazer uma sprint de auditoria e correção.

---

## 3. Regra Principal da Sprint

Esta sprint deve preservar completamente:

- visual atual;
- animações atuais;
- estilo dos componentes;
- layout geral;
- experiência visual já existente.

A sprint pode organizar código, corrigir lógica e melhorar estrutura interna, mas não pode redesenhar a interface.

```txt
Não mudar visual.
Não remover animações.
Não criar feature nova.
Não refatorar tudo de uma vez.
```

---

## 4. Escopo da Sprint

Esta sprint deve cobrir:

1. Auditoria do fluxo de produção
2. Correção do erro de login/API em produção
3. Auditoria de estrutura do projeto
4. Organização da lógica de programação
5. Separação de responsabilidades
6. Revisão de validações importantes
7. Revisão de erros e respostas da API
8. Revisão de scripts de build/dev/deploy
9. Testes básicos de regressão
10. Atualização da documentação

---

## 5. Fora do Escopo

Não fazer nesta sprint:

- criar novas telas;
- mudar dashboard;
- alterar visual;
- trocar animações;
- trocar biblioteca de UI;
- trocar React;
- trocar Hono;
- trocar tRPC;
- trocar banco de dados;
- trocar Drizzle;
- criar admin;
- criar multiempresa;
- criar exportação PDF/Excel;
- criar relatórios avançados;
- criar CRUDs novos sem necessidade;
- refatorar o projeto inteiro;
- alterar schema do banco sem justificativa forte;
- mudar autenticação inteira sem necessidade.

Se algum desses itens parecer necessário, registrar como pendência futura.

---

## 6. Problemas Conhecidos a Investigar

### 6.1 Erro de Login em Produção

Erro observado:

```txt
JSON.parse: unexpected end of data at line 1 column 1 of the JSON data
```

Possíveis causas:

- `/api/trpc` não está respondendo no domínio de produção;
- backend não está sendo publicado junto com frontend;
- rota `/api/trpc` está retornando HTML em vez de JSON;
- rota está retornando resposta vazia;
- erro interno no backend;
- configuração incorreta de Cloudflare Pages/Worker;
- binding do D1 ausente ou incorreto;
- variável `JWT_SECRET` ausente em produção;
- CORS/security headers não incluem o domínio customizado;
- build/deploy está servindo apenas frontend estático.

### 6.2 Cloudflare Analytics

Erro observado anteriormente:

```txt
Nenhum dos hashes sha512 no atributo integrity corresponde ao conteúdo do sub-recurso static.cloudflareinsights.com
```

Esse erro parece relacionado ao Cloudflare Web Analytics automático.

Nesta sprint, investigar apenas se ele está atrapalhando o app. Se for apenas ruído no console, documentar e deixar como configuração de Cloudflare.

### 6.3 Organização da Lógica

Identificar se existe lógica importante duplicada ou espalhada em lugares errados, como:

- cálculo de horas dentro de componente;
- validação de sequência só no frontend;
- sanitização de usuário duplicada;
- regras de negócio misturadas com UI;
- funções utilitárias grandes demais;
- endpoints com muita responsabilidade;
- erros genéricos demais;
- tipos compartilhados mal organizados.

---

## 7. Princípios de Organização do Código

A organização deve seguir estes princípios:

### 7.1 Backend como fonte da verdade

Regras críticas devem ficar no backend:

- autenticação;
- permissão;
- isolamento por usuário;
- validação de sequência de ponto;
- validação de update/delete;
- sanitização de dados sensíveis.

O frontend pode ajudar na experiência, mas não deve ser a única proteção.

### 7.2 Componentes não devem carregar regra de negócio pesada

Componentes React devem focar em:

- exibir dados;
- capturar interação;
- chamar hooks/mutations;
- mostrar loading, erro e sucesso.

Evitar deixar dentro de componente:

- cálculo complexo;
- validação crítica;
- regra de permissão;
- transformação grande de dados.

### 7.3 Separar lógica reutilizável

Quando fizer sentido, mover lógica para:

```txt
backend/api/services/
backend/api/utils/
backend/contracts/
frontend/src/utils/
frontend/src/hooks/
```

A estrutura exata deve respeitar o padrão atual do projeto.

### 7.4 Refatoração segura

Refatorar apenas quando houver motivo claro:

- corrigir bug;
- remover duplicação evidente;
- facilitar teste;
- separar responsabilidade;
- melhorar manutenção;
- reduzir risco futuro.

Não refatorar por estética.

### 7.5 Testar antes e depois

Antes de mexer, registrar estado atual.

Depois de mexer, rodar validações.

---

## 8. Fase 1 — Auditoria Inicial

Antes de alterar qualquer arquivo, o agente deve mapear:

### 8.1 Estrutura

- workspaces;
- scripts;
- frontend;
- backend;
- build;
- deploy;
- banco;
- documentação.

### 8.2 Fluxo de Login

Mapear o caminho completo:

```txt
Login.tsx / formulário
→ mutation auth.login
→ TRPCProvider
→ /api/trpc
→ Hono boot.ts
→ appRouter.auth.login
→ banco D1
→ Set-Cookie
→ resposta para frontend
```

Registrar onde o fluxo pode quebrar.

### 8.3 Fluxo de API em Produção

Verificar:

- se `/api/trpc/ping` responde;
- se `/api/trpc/auth.login` responde formato tRPC válido;
- se erro de backend vira JSON;
- se resposta 404/500 está sendo convertida corretamente;
- se frontend está apontando para a URL correta.

### 8.4 Configuração de Deploy

Verificar:

- `package.json` raiz;
- `frontend/package.json`;
- `backend/package.json`;
- `frontend/vite.config.ts`;
- `backend/wrangler.toml`;
- estrutura de `dist/public`;
- bindings do D1;
- variáveis de ambiente necessárias;
- scripts de build/start.

### 8.5 Organização de Lógica

Listar pontos onde o código pode ser organizado:

- funções grandes;
- duplicações;
- regras misturadas;
- validações espalhadas;
- erros pouco claros;
- tipos duplicados;
- baixa testabilidade.

Resultado esperado da fase 1:

```md
## Auditoria Inicial

### Fluxos analisados
...

### Problemas encontrados
...

### Causa provável do erro de login
...

### Arquivos candidatos a alteração
...

### Plano de correção
...
```

---

## 9. Fase 2 — Correção do Erro de Login/API

A prioridade máxima é corrigir o problema real de produção.

### 9.1 Testes manuais obrigatórios

Testar:

```txt
GET/POST /api/trpc/ping
login com usuário válido
login com usuário inválido
auth.me após login
logout
```

### 9.2 Comportamento esperado

A API deve responder JSON válido em todos os cenários:

- sucesso;
- erro de validação;
- erro de autenticação;
- erro interno tratado;
- rota não encontrada em `/api`.

O frontend não deve receber resposta vazia ao tentar login.

### 9.3 Possíveis correções

Aplicar apenas as correções necessárias, por exemplo:

- ajustar configuração de deploy;
- ajustar rota `/api/trpc`;
- ajustar fallback do servidor;
- ajustar headers/CORS;
- adicionar domínio customizado permitido;
- validar `JWT_SECRET`;
- melhorar tratamento de erro;
- garantir que backend responda JSON em produção;
- corrigir binding do D1 se estiver mal configurado.

---

## 10. Fase 3 — Organização da Lógica

Depois da correção principal, organizar apenas pontos de alto valor.

### 10.1 Backend

Avaliar separar ou melhorar:

```txt
auth service
entry service
user service
password/hash utils
jwt utils
entry sequence validation
user sanitization
error helpers
```

Exemplo de organização possível:

```txt
backend/api/
  services/
    auth.service.ts
    entry.service.ts
    user.service.ts
  utils/
    sanitize-user.ts
    entry-sequence.ts
```

Usar essa estrutura apenas se fizer sentido para o projeto atual.

### 10.2 Frontend

Avaliar separar ou melhorar:

```txt
hooks de login
hooks de entries
utils de formatação
utils de mensagens de erro
componentes de formulário
componentes de estado vazio/loading
```

Exemplo possível:

```txt
frontend/src/
  hooks/
    useAuth.ts
    useEntries.ts
  utils/
    formatTime.ts
    getErrorMessage.ts
```

Não alterar visual. Apenas organizar lógica quando houver ganho claro.

### 10.3 Tipos compartilhados

Verificar se existem tipos duplicados entre frontend e backend.

Se houver tipos compartilhados já existentes, reutilizar.

Não criar abstração complexa demais.

---

## 11. Fase 4 — Erros e Mensagens

Padronizar tratamento de erro, sem alterar visual.

### 11.1 Backend

Erros devem ser:

- claros;
- seguros;
- sem stack trace;
- sem vazar dados internos;
- convertidos para resposta tRPC válida.

### 11.2 Frontend

O frontend deve exibir mensagens compreensíveis.

Evitar mostrar para o usuário mensagens cruas como:

```txt
JSON.parse
TRPCClientError
Internal Server Error
Unexpected token
```

Preferir mensagens como:

```txt
Não foi possível entrar. Verifique seus dados ou tente novamente.
Não foi possível conectar ao servidor.
Sua sessão expirou. Faça login novamente.
```

Sem mudar layout.

---

## 12. Fase 5 — Testes e Regressão

Adicionar ou ajustar testes quando necessário.

### 12.1 Testes obrigatórios se mexer em login/auth

- login válido;
- login inválido;
- registro não retorna senha;
- auth.me exige sessão;
- logout limpa cookie;
- erro de autenticação retorna formato esperado.

### 12.2 Testes obrigatórios se mexer em entries

- usuário só acessa seus registros;
- sequência de ponto continua válida;
- update/delete respeitam ownership;
- cálculo/histórico não quebram.

### 12.3 Testes obrigatórios se mexer em utils

- sanitização de usuário;
- validação de sequência;
- formatação de erro;
- funções de data/hora.

---

## 13. Documentação

Atualizar ou criar:

```txt
docs/PROJECT_STATUS.md
```

Adicionar seção:

```md
## Sprint 05 — Auditoria Técnica, Correção de Bugs e Organização da Lógica
```

Com:

- data;
- problema investigado;
- causa encontrada;
- arquivos alterados;
- correções feitas;
- organização aplicada;
- comandos executados;
- resultado dos testes;
- pendências;
- riscos restantes.

Atualizar `docs/SPEC.md` apenas se alguma regra definitiva do sistema mudar.

---

## 14. Comandos de Validação

Executar na raiz, se existirem:

```bash
npm install
npm run check
npm test
npm run build
```

Executar também por workspace, se necessário:

```bash
npm run check --workspace=frontend
npm run test --workspace=frontend
npm run build --workspace=frontend
```

```bash
npm run test --workspace=backend
npm run build --workspace=backend
```

Se algum comando não existir, registrar no relatório.

---

## 15. Validação em Produção ou Preview

Depois do deploy, validar:

```txt
https://pontocerto.js.net.br
https://pontocerto.js.net.br/api/trpc/ping
```

Também validar no navegador:

- abrir tela de login;
- tentar login inválido;
- tentar login válido;
- verificar se não aparece erro de JSON.parse;
- verificar se cookie é criado;
- verificar se usuário entra no app;
- atualizar a página logado;
- fazer logout.

---

## 16. Critérios de Aceite

A sprint será aceita quando:

- causa do erro de login/API estiver identificada;
- erro `JSON.parse: unexpected end of data` estiver corrigido ou documentado com causa externa clara;
- `/api/trpc/ping` responder corretamente;
- login retornar resposta válida;
- erros da API não retornarem corpo vazio;
- organização da lógica for melhorada apenas onde necessário;
- visual atual for preservado;
- animações forem preservadas;
- nenhuma feature fora do escopo for criada;
- testes relevantes forem adicionados/ajustados;
- build/check/test passarem ou falhas forem documentadas;
- `docs/PROJECT_STATUS.md` for atualizado.

---

## 17. Relatório Final Esperado

Ao final da sprint, o agente deve entregar:

```md
# Relatório — Sprint 05

## Resumo

...

## Problema principal investigado

...

## Causa encontrada

...

## Correções aplicadas

...

## Organização de código feita

...

## Arquivos alterados

- ...

## Testes adicionados ou alterados

- ...

## Comandos executados

- npm install: passou/falhou
- npm run check: passou/falhou
- npm test: passou/falhou
- npm run build: passou/falhou

## Validação de produção/preview

- /api/trpc/ping: passou/falhou
- login inválido: passou/falhou
- login válido: passou/falhou
- auth.me: passou/falhou
- logout: passou/falhou

## Preservação visual

- visual preservado: sim/não
- animações preservadas: sim/não
- redesign realizado: não

## Pendências

...

## Riscos restantes

...
```

---

## 18. Prompt de Planejamento para Agente

Use este prompt primeiro.

```txt
Você está trabalhando no projeto PontoCerto.

Leia:
- docs/SPEC.md
- docs/PROJECT_STATUS.md, se existir
- docs/sprints/SPRINT_05.md

Não altere arquivos ainda.

Faça uma auditoria técnica para a Sprint 05.

Problema real:
Em produção, ao tentar login, aparece:
JSON.parse: unexpected end of data at line 1 column 1 of the JSON data

Objetivo:
Identificar a causa do erro, auditar o fluxo frontend → /api/trpc → backend → D1, e propor correções.
Também quero organizar a lógica do código, mas sem refatorar tudo e sem mudar visual.

Importante:
- não altere visual
- não remova animações
- não crie feature nova
- não faça redesign
- não altere schema do banco sem necessidade
- não implemente ainda

Entregue:
1. mapa do fluxo de login/API
2. causa mais provável do erro JSON.parse
3. arquivos que precisam ser analisados
4. arquivos que provavelmente precisam ser alterados
5. problemas de deploy/configuração encontrados
6. problemas de organização de lógica encontrados
7. plano de correção em etapas
8. testes que devem ser executados
9. riscos da correção
```

---

## 19. Prompt de Execução para Agente

Use apenas depois de revisar o planejamento.

```txt
Execute a Sprint 05 do PontoCerto.

Siga:
- docs/SPEC.md
- docs/sprints/SPRINT_05.md

Prioridade máxima:
Corrigir o erro em produção:
JSON.parse: unexpected end of data at line 1 column 1 of the JSON data

Escopo obrigatório:
1. auditar o fluxo de login/API
2. corrigir /api/trpc se estiver retornando vazio, HTML, 404 ou 500 sem JSON válido
3. revisar configuração de deploy/build se necessário
4. garantir que /api/trpc/ping responda corretamente
5. garantir que auth.login responda JSON/tRPC válido em sucesso e erro
6. melhorar tratamento de erro sem vazar detalhes internos
7. organizar lógica apenas onde houver ganho claro
8. preservar visual e animações
9. adicionar ou ajustar testes relevantes
10. atualizar docs/PROJECT_STATUS.md

Restrições:
- não mude visual
- não remova animações
- não crie feature nova
- não faça redesign
- não troque stack
- não altere banco sem necessidade comprovada
- não refatore o projeto inteiro
- não remova testes sem justificar

Ao final, entregue:
1. causa encontrada
2. arquivos alterados
3. correções feitas
4. organização de código aplicada
5. testes adicionados/alterados
6. comandos executados
7. resultado de check/test/build
8. como validar em produção
9. pendências restantes
```

---

## 20. Prompt de Revisão Pós-Sprint

Use depois que o agente terminar.

```txt
Revise a implementação da Sprint 05.

Não altere arquivos ainda.

Verifique:
1. se o erro JSON.parse foi realmente resolvido
2. se /api/trpc/ping responde JSON válido
3. se auth.login responde corretamente em sucesso e erro
4. se o frontend não recebe resposta vazia
5. se o visual atual foi preservado
6. se animações foram preservadas
7. se houve refatoração excessiva
8. se alguma feature nova foi criada indevidamente
9. se testes cobrem as mudanças principais
10. se docs/PROJECT_STATUS.md foi atualizado

Entregue:
- problemas encontrados
- nível de risco
- recomendação objetiva
- se a sprint pode ser aceita ou não
```
