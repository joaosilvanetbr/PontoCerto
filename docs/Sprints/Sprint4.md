# Sprint 04 — CRUDs Pendentes Preservando o Visual Atual

## 1. Objetivo

Adicionar e consolidar CRUDs pendentes no projeto **PontoCerto**, preservando o visual atual, o estilo existente e as animações já implementadas.

Esta sprint deve evoluir funcionalidades que já fazem sentido no produto, sem redesenhar a interface e sem alterar a identidade visual do app.

A regra principal é:

```txt
Implementar CRUDs necessários sem mudar o visual atual.
```

---

## 2. Contexto

As sprints anteriores devem ter tratado:

- **Sprint 01:** estabilização inicial, instalação, testes, build e documentação.
- **Sprint 02:** segurança do backend, isolamento por usuário, validações críticas e proteção de dados sensíveis.
- **Sprint 03:** histórico, relatórios e cálculo de horas.

Agora o projeto pode avançar para operações completas de criação, leitura, edição e exclusão em áreas que ainda estão incompletas.

O usuário gosta do visual atual do PontoCerto, incluindo:

- estilo visual;
- animações;
- organização geral da interface;
- aparência atual dos componentes.

Portanto, esta sprint deve **preservar a UI existente** e fazer apenas ajustes mínimos quando forem necessários para encaixar ações de CRUD.

---

## 3. Escopo da Sprint

Esta sprint deve seguir duas fases:

```txt
Fase 1 — Auditoria de CRUDs existentes
Fase 2 — Implementação dos CRUDs prioritários e seguros
```

O agente deve primeiro mapear quais áreas já possuem Create, Read, Update e Delete.

Depois, deve implementar apenas os CRUDs definidos como prioritários, seguros e compatíveis com a SPEC.

---

## 4. Fora do Escopo

Não fazer nesta sprint:

- redesenhar o app;
- alterar identidade visual;
- remover animações existentes;
- trocar biblioteca de UI;
- alterar layout global;
- criar dashboard novo;
- criar gráficos avançados;
- criar exportação PDF;
- criar exportação Excel;
- criar sistema de admin;
- criar multiempresa;
- criar controle de equipe;
- trocar autenticação;
- trocar ORM;
- trocar banco de dados;
- refatorar a arquitetura inteira;
- alterar regras de segurança feitas na Sprint 02 sem necessidade comprovada;
- alterar cálculo de horas da Sprint 03 sem necessidade comprovada;
- implementar CRUDs perigosos sem validação adequada;
- implementar exclusão de conta do usuário nesta sprint.

Se algum ponto fora do escopo parecer necessário, apenas documentar como pendência futura.

---

## 5. Princípios Visuais Obrigatórios

O visual atual deve ser preservado.

O agente deve:

- manter componentes existentes sempre que possível;
- reutilizar botões, cards, inputs, modais, tabelas e padrões já existentes;
- preservar classes Tailwind já usadas no projeto;
- preservar animações existentes;
- evitar mudanças globais de CSS;
- evitar alterar tema, cores, fontes ou espaçamentos principais;
- fazer apenas ajustes pequenos para incluir botões, formulários, ações ou estados necessários.

Exemplos de ajustes permitidos:

```txt
- adicionar botão "Editar" usando o estilo de botão já existente;
- adicionar botão "Excluir" usando variante já existente;
- criar modal seguindo o padrão visual atual;
- adicionar mensagem de confirmação com componente já usado;
- incluir estado de loading em botão existente;
- adicionar formulário usando inputs já existentes.
```

Exemplos de ajustes proibidos:

```txt
- mudar o layout inteiro da página;
- trocar paleta de cores;
- remover animações;
- alterar a home/dashboard visualmente sem necessidade;
- criar novo design system;
- substituir componentes existentes por outros sem motivo.
```

---

## 6. Áreas Prováveis para CRUD

O agente deve confirmar no código, mas as áreas prováveis são:

### 6.1 Registros de Ponto

Operações possíveis:

- criar registro;
- listar registros;
- editar registro;
- excluir registro.

Essa área exige cuidado porque registros de ponto afetam histórico, relatórios e cálculo de horas.

Regras obrigatórias:

- usuário só pode manipular seus próprios registros;
- edição não pode quebrar sequência válida de ponto;
- exclusão não pode gerar estado inconsistente sem tratamento;
- backend deve validar todas as operações;
- frontend não pode ser a única camada de validação.

### 6.2 Perfil do Usuário

Operações possíveis:

- visualizar perfil;
- editar dados permitidos;
- salvar alterações.

Não incluir nesta sprint:

- exclusão de conta;
- alteração de senha, salvo se já estiver parcialmente implementada e for segura de concluir.

### 6.3 Configurações do Usuário ou Jornada

Se existir ou fizer sentido no código atual, revisar CRUD para configurações como:

- jornada padrão;
- horário esperado de entrada;
- horário esperado de saída;
- duração padrão de intervalo;
- preferências simples de exibição.

Se essa área não existir no banco ou exigir mudanças grandes, não implementar sem documentação clara.

### 6.4 Observações ou Ajustes Manuais

Se o projeto já tiver estrutura para observações em registros, revisar:

- criar observação;
- editar observação;
- remover observação;
- listar observação associada ao registro.

Se não existir estrutura, não criar uma funcionalidade nova grande nesta sprint.

---

## 7. Fase 1 — Auditoria de CRUDs

Antes de implementar qualquer coisa, o agente deve produzir uma auditoria.

A auditoria deve listar cada área funcional com o status de CRUD:

```md
| Área | Create | Read | Update | Delete | Arquivos | Status | Observações |
|---|---|---|---|---|---|---|---|
| Registros de ponto | sim/não | sim/não | sim/não | sim/não | ... | completo/incompleto | ... |
| Perfil | sim/não | sim/não | sim/não | sim/não | ... | completo/incompleto | ... |
| Configurações | sim/não | sim/não | sim/não | sim/não | ... | completo/incompleto | ... |
```

Para cada operação ausente, classificar como:

```txt
prioridade alta
prioridade média
prioridade baixa
não recomendado agora
```

Critérios de prioridade:

- impacto direto no uso do app;
- segurança da operação;
- dependência de banco de dados;
- risco de quebrar cálculo de horas;
- complexidade visual;
- cobertura de testes possível.

---

## 8. Fase 2 — CRUDs Prioritários Recomendados

A implementação exata deve depender da auditoria.

Por padrão, a prioridade recomendada é:

### Prioridade 1 — CRUD parcial/seguro de Registros de Ponto

Implementar ou completar:

- listagem correta;
- edição controlada;
- exclusão controlada;
- validações no backend;
- testes para update/delete.

Não permitir alterações que quebrem as regras de sequência.

### Prioridade 2 — CRUD de Perfil

Implementar ou completar:

- leitura do perfil;
- edição de campos permitidos;
- salvamento com validação;
- retorno seguro sem senha/hash;
- testes de update.

### Prioridade 3 — Configurações Simples

Implementar apenas se a estrutura já existir ou se a mudança for pequena e bem justificada.

Exemplos:

- jornada padrão;
- duração padrão do intervalo;
- preferências simples.

Se exigir mudança grande de schema, mover para sprint futura.

---

## 9. Regras de Backend

Toda operação de CRUD deve ser validada no backend.

O backend deve:

- exigir autenticação em operações privadas;
- usar `userId` da sessão/JWT/contexto autenticado;
- ignorar ou rejeitar `userId` enviado pelo cliente;
- validar permissão antes de update/delete;
- garantir que usuário só manipule seus próprios dados;
- validar dados de entrada;
- retornar mensagens de erro seguras;
- não retornar senha/hash;
- não expor stack trace;
- manter consistência com regras de ponto.

### 9.1 Create

Ao criar uma entidade:

- validar dados obrigatórios;
- associar automaticamente ao usuário autenticado;
- não aceitar `userId` manual vindo do frontend;
- retornar objeto seguro.

### 9.2 Read

Ao listar ou buscar:

- filtrar sempre pelo usuário autenticado;
- respeitar filtros existentes;
- não vazar dados de outros usuários;
- retornar apenas campos necessários.

### 9.3 Update

Ao editar:

- verificar se o item pertence ao usuário autenticado;
- validar dados;
- impedir atualização de campos sensíveis;
- impedir alteração que gere inconsistência;
- retornar objeto seguro atualizado.

### 9.4 Delete

Ao excluir:

- verificar se o item pertence ao usuário autenticado;
- confirmar impacto na regra de negócio;
- impedir exclusão que deixe dados incoerentes, quando aplicável;
- se a exclusão for permitida, atualizar a UI sem quebrar estado;
- se a exclusão não for segura, documentar a limitação.

---

## 10. Regras Específicas para Registros de Ponto

Registros de ponto têm regra especial.

### 10.1 Edição

Ao editar um registro de ponto, o backend deve verificar:

- se o registro pertence ao usuário;
- se o novo tipo é válido;
- se o novo horário é válido;
- se a alteração mantém a sequência lógica do dia;
- se a alteração não gera valores negativos nos cálculos.

### 10.2 Exclusão

Ao excluir um registro de ponto, o backend deve verificar:

- se o registro pertence ao usuário;
- se a remoção quebra a sequência do dia;
- se o frontend conseguirá exibir a jornada restante como incompleta;
- se relatórios continuarão calculando corretamente.

### 10.3 Estratégia Recomendada

Se a exclusão física for arriscada, considerar uma das opções abaixo, desde que compatível com o projeto:

```txt
1. bloquear exclusão quando quebrar sequência;
2. permitir exclusão e marcar o dia como incompleto;
3. usar soft delete se já existir estrutura no banco;
4. documentar exclusão para sprint futura se exigir mudança grande.
```

Não implementar soft delete se isso exigir mudança grande de schema fora do escopo.

---

## 11. Regras de Frontend

O frontend deve:

- preservar visual atual;
- usar componentes existentes;
- mostrar ações de CRUD de forma discreta e consistente;
- exibir loading em salvar/excluir;
- exibir erros amigáveis;
- atualizar listas após create/update/delete;
- não confiar em validação apenas no cliente;
- não enviar `userId` manual em operações sensíveis, salvo se o backend ignorar/rejeitar.

### 11.1 Botões e Ações

Usar padrões já existentes no projeto.

Exemplos:

```txt
Editar
Excluir
Salvar
Cancelar
Confirmar
```

### 11.2 Confirmação de Exclusão

Toda exclusão deve ter confirmação.

Mensagem sugerida:

```txt
Tem certeza que deseja excluir este item? Esta ação pode afetar o histórico e os relatórios.
```

A mensagem final deve usar o tom e padrão visual do projeto.

### 11.3 Estados de Tela

Garantir estados mínimos:

- carregando;
- salvando;
- excluindo;
- erro;
- sucesso;
- lista vazia.

Sem redesenhar a tela.

---

## 12. Testes Obrigatórios

Adicionar ou ajustar testes conforme os CRUDs implementados.

### 12.1 Testes de Permissão

Cobrir:

- usuário não edita item de outro usuário;
- usuário não exclui item de outro usuário;
- usuário não lista dados de outro usuário;
- backend ignora/rejeita `userId` enviado pelo cliente.

### 12.2 Testes de CRUD

Para cada CRUD implementado, cobrir:

- create válido;
- read/list válido;
- update válido;
- update inválido;
- delete válido;
- delete inválido;
- tentativa sem autenticação.

### 12.3 Testes de Registro de Ponto

Se update/delete de ponto forem implementados, cobrir:

- edição mantém sequência válida;
- edição que quebra sequência é rejeitada;
- exclusão permitida quando segura;
- exclusão rejeitada quando quebra regra crítica;
- relatórios/histórico não quebram após alteração.

### 12.4 Testes de Retorno Seguro

Cobrir que respostas de usuário continuam sem:

- senha;
- password;
- passwordHash;
- hash;
- tokens internos.

---

## 13. Documentação

Atualizar ou criar:

```txt
docs/PROJECT_STATUS.md
```

Adicionar seção:

```md
## Sprint 04 — CRUDs Pendentes Preservando o Visual Atual
```

Com:

- data da execução;
- CRUDs auditados;
- CRUDs implementados;
- CRUDs deixados para depois;
- arquivos alterados;
- comandos executados;
- resultados de testes;
- riscos restantes;
- observações sobre visual preservado.

Também atualizar a SPEC se algum comportamento definitivo for adicionado, por exemplo:

- quais CRUDs são oficialmente suportados;
- quais entidades podem ser editadas;
- quais entidades podem ser excluídas;
- restrições de edição/exclusão.

---

## 14. Comandos de Validação

Executar na raiz do projeto, se existirem:

```bash
npm run check
npm test
npm run build
```

Se o projeto tiver comandos separados, executar também:

```bash
cd backend
npm run check
npm test
npm run build
```

```bash
cd frontend
npm run check
npm test
npm run build
```

Se algum comando não existir, registrar no relatório final.

---

## 15. Critérios de Aceite

A Sprint 04 será considerada concluída quando:

- auditoria de CRUDs for feita;
- CRUDs prioritários forem definidos antes da implementação;
- pelo menos um CRUD pendente prioritário for implementado ou completado;
- operações privadas exigirem autenticação;
- usuário só conseguir manipular seus próprios dados;
- backend validar create/update/delete;
- update/delete de registros de ponto não quebrarem sequência nem cálculos;
- exclusões tiverem confirmação no frontend;
- visual atual for preservado;
- animações existentes forem preservadas;
- não houver redesign;
- testes cobrirem os CRUDs implementados;
- `npm run check` passar ou falhas forem documentadas;
- `npm test` passar ou falhas forem documentadas;
- `npm run build` passar ou falhas forem documentadas;
- `docs/PROJECT_STATUS.md` for atualizado;
- pendências para Sprint 05 forem listadas.

---

## 16. Relatório Final Esperado

Ao final da sprint, o agente deve entregar:

```md
# Relatório — Sprint 04

## Auditoria de CRUDs

| Área | Create | Read | Update | Delete | Status | Observações |
|---|---|---|---|---|---|---|
| ... | ... | ... | ... | ... | ... | ... |

## CRUDs implementados

- CRUD 1
- CRUD 2

## CRUDs adiados

- CRUD adiado 1 — motivo
- CRUD adiado 2 — motivo

## Arquivos alterados

- arquivo 1
- arquivo 2

## Backend

- endpoints/procedures criados ou alterados
- validações adicionadas
- regras de permissão aplicadas

## Frontend

- telas/componentes alterados
- ajustes visuais mínimos feitos
- confirmação de exclusão adicionada, se aplicável

## Testes adicionados ou alterados

- teste 1
- teste 2

## Comandos executados

- npm run check: passou/falhou
- npm test: passou/falhou
- npm run build: passou/falhou

## Preservação visual

- visual atual preservado: sim/não
- animações preservadas: sim/não
- redesign realizado: não

## Pendências para Sprint 05

- pendência 1
- pendência 2

## Riscos restantes

- risco 1
- risco 2
```

---

## 17. Prompt de Planejamento para Agente

Use este prompt primeiro.

Não permita implementação antes da auditoria.

```txt
Você está trabalhando no projeto PontoCerto.

Leia:
- docs/SPEC.md
- docs/PROJECT_STATUS.md, se existir
- docs/sprints/SPRINT_01.md, se existir
- docs/sprints/SPRINT_02.md, se existir
- docs/sprints/SPRINT_03.md, se existir
- docs/sprints/SPRINT_04.md

Não altere arquivos ainda.

Faça apenas o planejamento da Sprint 04.

Objetivo:
Auditar os CRUDs existentes e propor os CRUDs prioritários para implementação, preservando o visual atual do app.

Importante:
- o visual atual deve ser preservado
- as animações atuais devem ser preservadas
- não faça redesign
- não altere layout global
- apenas proponha pequenos ajustes visuais se forem necessários para encaixar ações de CRUD

Entregue:
1. resumo do objetivo da sprint
2. auditoria de CRUDs por área usando tabela
3. arquivos analisados
4. operações CRUD existentes
5. operações CRUD ausentes
6. riscos de cada operação ausente
7. CRUDs recomendados para implementar nesta sprint
8. CRUDs que devem ficar para sprint futura
9. arquivos que provavelmente serão modificados
10. testes que pretende criar ou ajustar
11. plano de execução em etapas

Não implemente nada ainda.
```

---

## 18. Prompt de Execução para Agente

Use apenas depois de revisar o planejamento.

```txt
Execute a Sprint 04 do projeto PontoCerto.

Siga exatamente:
- docs/SPEC.md
- docs/sprints/SPRINT_04.md

Escopo obrigatório:
1. usar a auditoria de CRUDs como base
2. implementar apenas os CRUDs prioritários e seguros
3. preservar o visual atual
4. preservar animações existentes
5. fazer apenas ajustes visuais mínimos quando necessários
6. validar permissões no backend
7. garantir que usuário só manipule seus próprios dados
8. adicionar confirmação para exclusões
9. criar ou ajustar testes para os CRUDs implementados
10. atualizar docs/PROJECT_STATUS.md

Restrições:
- não faça redesign
- não altere layout global
- não troque biblioteca de UI
- não remova animações
- não crie dashboard novo
- não crie exportação PDF/Excel
- não crie admin
- não crie multiempresa
- não altere autenticação sem necessidade comprovada
- não altere schema do banco sem justificar e documentar
- não implemente funcionalidades fora do escopo
- não remova testes sem justificar

Antes de cada alteração relevante, explique rapidamente o motivo.

Ao final, entregue:
1. auditoria final de CRUDs
2. CRUDs implementados
3. CRUDs adiados e motivo
4. arquivos alterados
5. validações de backend
6. alterações mínimas de frontend
7. testes adicionados ou alterados
8. comandos executados
9. resultado de check/test/build
10. confirmação de que visual e animações foram preservados
11. pendências para Sprint 05
```

---

## 19. Prompt de Revisão Pós-Sprint

Use depois que o agente terminar.

```txt
Revise a implementação da Sprint 04.

Não altere arquivos ainda.

Verifique:
1. se alguma mudança saiu do escopo
2. se o visual atual foi preservado
3. se animações existentes foram preservadas
4. se houve redesign indevido
5. se os CRUDs implementados têm validação no backend
6. se usuário só manipula os próprios dados
7. se update/delete de ponto não quebram sequência e cálculos
8. se exclusões têm confirmação
9. se testes cobrem os CRUDs implementados
10. se houve alteração desnecessária no banco
11. se docs/PROJECT_STATUS.md foi atualizado
12. se a SPEC precisa ser atualizada

Entregue:
- problemas encontrados
- nível de risco de cada problema
- recomendação objetiva para correção
- se a sprint pode ser aceita ou não
```

---

## 20. Pendências Prováveis para Sprint 05

A Sprint 05 deve depender do resultado da auditoria de CRUDs.

Possíveis caminhos:

### Opção A — Continuação de CRUDs

Se ainda houver CRUDs importantes pendentes:

```txt
Sprint 05 — Continuação dos CRUDs Pendentes
```

### Opção B — Configurações de Jornada

Se ainda não houver configurações completas:

```txt
Sprint 05 — Configurações de Jornada do Usuário
```

### Opção C — Exportação

Se histórico e relatórios já estiverem sólidos:

```txt
Sprint 05 — Exportação CSV/PDF
```

### Opção D — Deploy

Se o produto já estiver funcional:

```txt
Sprint 05 — Preparação para Deploy
```

Não iniciar Sprint 05 antes de revisar a Sprint 04.
