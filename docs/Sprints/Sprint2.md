# Sprint 02 — Segurança e Validações do Backend

## 1. Objetivo

Fortalecer a segurança e a consistência das regras de negócio no backend do **PontoCerto**.

Esta sprint deve garantir que o backend:

- nunca retorne senha ou hash de senha para o frontend;
- use sempre o usuário autenticado como fonte de verdade;
- impeça acesso cruzado entre usuários;
- valide a sequência correta dos registros de ponto;
- tenha testes cobrindo as regras críticas.

Esta sprint não deve criar novas funcionalidades visuais nem alterar a experiência do usuário além do necessário para refletir erros vindos do backend.

---

## 2. Contexto

Após a Sprint 01, o projeto deve estar minimamente estabilizado, com dependências instaladas, comandos principais conhecidos e documentação inicial criada.

Agora o foco é proteger o núcleo do sistema.

O PontoCerto lida com:

- usuários;
- autenticação;
- registros de ponto;
- histórico;
- relatórios;
- dados individuais por usuário.

Por isso, o backend precisa ser a camada principal de segurança. O frontend pode melhorar a experiência, mas não deve ser a única camada responsável por validar regras importantes.

---

## 3. Escopo da Sprint

Nesta sprint, o agente deve trabalhar apenas nos seguintes pontos:

1. Revisar retornos de usuário no backend
2. Garantir que `password`, `passwordHash` ou campos sensíveis nunca sejam enviados ao frontend
3. Revisar endpoints protegidos
4. Garantir que endpoints usem o `userId` autenticado
5. Impedir acesso a dados de outros usuários
6. Validar sequência de registros de ponto no backend
7. Adicionar ou ajustar testes para essas regras
8. Atualizar documentação de status da sprint

---

## 4. Fora do Escopo

Não fazer nesta sprint:

- criar novas telas;
- alterar layout;
- redesenhar componentes;
- criar dashboard novo;
- criar relatórios novos;
- adicionar exportação PDF/Excel;
- trocar biblioteca de autenticação;
- trocar ORM;
- trocar banco de dados;
- refatorar a arquitetura inteira;
- alterar schema do banco sem necessidade comprovada;
- criar novas features;
- implementar controle de equipe ou admin;
- implementar multiempresa;
- modificar regras trabalhistas avançadas;
- criar sistema de permissões complexo.

Se alguma dessas mudanças parecer necessária, apenas documentar como pendência para sprint futura.

---

## 5. Arquivos Prováveis de Análise

O agente deve localizar os arquivos reais do projeto, mas provavelmente precisará revisar áreas como:

```txt
backend/
  src/
    routers/
    routes/
    auth/
    db/
    schema/
    middleware/
    utils/
    tests/

frontend/
  src/
    api/
    hooks/
    contexts/
    pages/
```

A lista exata deve ser confirmada pelo agente antes de alterar qualquer arquivo.

---

## 6. Tarefas Detalhadas

### Tarefa 1 — Ler SPEC e estado atual

Antes de alterar arquivos, o agente deve ler:

```txt
docs/SPEC.md
docs/PROJECT_STATUS.md
docs/sprints/SPRINT_01.md
```

Se algum desses arquivos não existir, o agente deve:

- registrar isso no relatório;
- continuar a análise usando o código atual;
- não inventar comportamento ausente.

---

### Tarefa 2 — Mapear endpoints sensíveis

Identificar todos os endpoints ou procedures relacionados a:

- autenticação;
- usuário atual;
- atualização de perfil;
- registros de ponto;
- histórico;
- relatórios.

Para cada endpoint, verificar:

- exige autenticação?
- usa o `userId` vindo da sessão/JWT?
- aceita `userId` enviado pelo frontend?
- filtra dados por usuário autenticado?
- retorna dados sensíveis?
- possui teste?

Resultado esperado desta tarefa:

```txt
Lista de endpoints revisados e observações de risco.
```

---

### Tarefa 3 — Sanitizar retorno de usuário

Garantir que nenhuma resposta enviada ao frontend contenha:

- `password`;
- `passwordHash`;
- hash de senha com qualquer outro nome;
- token interno;
- segredo;
- campos sensíveis desnecessários.

Criar uma função utilitária se fizer sentido, por exemplo:

```ts
sanitizeUser(user)
```

Ou usar seleção explícita de campos no banco/API.

Exemplo de retorno seguro:

```ts
{
  id: user.id,
  name: user.name,
  email: user.email,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt
}
```

A implementação deve respeitar os nomes reais do schema existente.

Critérios específicos:

- login não retorna hash;
- cadastro não retorna hash;
- endpoint de usuário atual não retorna hash;
- atualização de perfil não retorna hash;
- testes cobrem pelo menos um fluxo que antes poderia vazar campo sensível.

---

### Tarefa 4 — Garantir uso do usuário autenticado

Revisar endpoints privados para garantir que o backend use o `userId` da autenticação, e não um `userId` enviado pelo cliente.

Regra obrigatória:

```txt
O frontend nunca deve decidir qual userId será usado em operações sensíveis.
```

O backend deve obter o usuário de fonte confiável, por exemplo:

```ts
ctx.user.id
```

ou equivalente real do projeto.

Verificar especialmente:

- criação de registro de ponto;
- listagem de registros;
- histórico;
- relatórios;
- atualização de perfil.

Se algum input aceitar `userId`, avaliar se deve ser removido ou ignorado.

---

### Tarefa 5 — Impedir acesso cruzado entre usuários

Garantir que consultas e mutações sejam filtradas pelo usuário autenticado.

Exemplo de regra:

```ts
where: {
  userId: ctx.user.id
}
```

ou equivalente com Drizzle conforme o projeto.

Casos que devem ser bloqueados:

- usuário A listar registros do usuário B;
- usuário A editar dados do usuário B;
- usuário A acessar relatório calculado com dados do usuário B;
- usuário A enviar manualmente outro `userId` pela API.

---

### Tarefa 6 — Validar sequência de registro de ponto no backend

Implementar ou revisar validação no backend para impedir registros fora de ordem.

Sequência padrão esperada:

```txt
entrada -> início de intervalo -> retorno de intervalo -> saída
```

A validação deve considerar os tipos reais usados no projeto.

Exemplos comuns de tipos possíveis:

```txt
clock_in
break_start
break_end
clock_out
```

ou:

```txt
entrada
intervalo_inicio
intervalo_fim
saida
```

O agente deve usar os nomes reais existentes no código.

Regras mínimas:

1. O primeiro registro do dia deve ser entrada.
2. Não permitir duas entradas consecutivas no mesmo dia.
3. Não permitir início de intervalo antes da entrada.
4. Não permitir retorno de intervalo sem início de intervalo.
5. Não permitir saída antes de entrada.
6. Não permitir saída antes de finalizar intervalo.
7. Não permitir novo registro após saída no mesmo dia, salvo se o projeto já suportar múltiplas jornadas.
8. Mensagens de erro devem ser claras, mas sem expor detalhes internos.

Se o projeto já suportar múltiplas jornadas por dia, o agente deve documentar o comportamento atual antes de alterar a regra.

---

### Tarefa 7 — Criar testes de segurança e validação

Adicionar ou ajustar testes para cobrir:

#### Usuário e segurança

- login/cadastro não retornam senha ou hash;
- endpoint de usuário atual não retorna senha ou hash;
- atualização de perfil não retorna senha ou hash.

#### Isolamento de dados

- usuário autenticado só lista seus próprios registros;
- usuário não consegue acessar registros de outro usuário;
- envio manual de `userId` diferente é ignorado ou rejeitado.

#### Sequência de ponto

Testar pelo menos:

- entrada como primeiro registro válido;
- saída sem entrada deve falhar;
- intervalo sem entrada deve falhar;
- retorno sem início de intervalo deve falhar;
- duas entradas seguidas devem falhar;
- saída depois de entrada deve passar, caso o fluxo permita saída direta;
- saída durante intervalo aberto deve falhar.

Os testes devem seguir o padrão já existente no projeto.

Não criar framework de testes novo se já houver um.

---

### Tarefa 8 — Revisar frontend apenas se necessário

O frontend só deve ser alterado se alguma mudança no backend exigir ajuste mínimo, por exemplo:

- tipo de resposta mudou porque campo sensível foi removido;
- mensagem de erro precisa ser exibida corretamente;
- TypeScript quebrou por causa de retorno sanitizado.

Não fazer redesign.

Não mudar fluxo visual.

Não criar componentes novos sem necessidade.

---

### Tarefa 9 — Atualizar documentação

Atualizar ou criar:

```txt
docs/PROJECT_STATUS.md
```

Adicionar uma seção:

```md
## Sprint 02 — Segurança e Validações do Backend
```

Com:

- data da execução;
- resumo do que foi revisado;
- arquivos alterados;
- comandos executados;
- resultado dos testes;
- pendências encontradas;
- riscos restantes.

---

## 7. Critérios de Aceite

A Sprint 02 será considerada concluída quando:

- nenhum endpoint retornar senha/hash para o frontend;
- endpoints privados exigirem autenticação;
- registros, histórico e relatórios forem filtrados pelo usuário autenticado;
- backend validar sequência mínima de registros de ponto;
- testes cobrirem sanitização de usuário;
- testes cobrirem isolamento de dados;
- testes cobrirem sequência de ponto;
- `npm run check` passar ou falhas forem documentadas;
- `npm test` passar ou falhas forem documentadas;
- `npm run build` passar ou falhas forem documentadas;
- documentação da sprint for atualizada;
- nenhuma funcionalidade fora do escopo for implementada.

---

## 8. Comandos de Validação

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

Não inventar scripts sem necessidade.

---

## 9. Relatório Final Esperado

Ao final da sprint, o agente deve entregar:

```md
# Relatório — Sprint 02

## Arquivos alterados

- arquivo 1
- arquivo 2

## Endpoints revisados

- endpoint/procedure 1
- endpoint/procedure 2

## Correções feitas

- correção 1
- correção 2

## Testes adicionados ou alterados

- teste 1
- teste 2

## Comandos executados

- npm run check: passou/falhou
- npm test: passou/falhou
- npm run build: passou/falhou

## Pendências

- pendência 1
- pendência 2

## Riscos restantes

- risco 1
- risco 2
```

---

## 10. Prompt de Planejamento para Agente

Use este prompt primeiro, antes de pedir execução:

```txt
Você está trabalhando no projeto PontoCerto.

Leia:
- docs/SPEC.md
- docs/PROJECT_STATUS.md, se existir
- docs/sprints/SPRINT_02.md

Não altere arquivos ainda.

Faça apenas o planejamento da Sprint 02.

Quero que você entregue:
1. resumo do objetivo da sprint
2. arquivos que pretende analisar
3. endpoints/procedures que parecem sensíveis
4. riscos técnicos
5. plano de execução em etapas
6. arquivos que provavelmente serão modificados
7. testes que pretende criar ou ajustar

Não implemente nada ainda.
```

---

## 11. Prompt de Execução para Agente

Depois de revisar o plano, use este prompt:

```txt
Execute a Sprint 02 do projeto PontoCerto.

Siga exatamente docs/SPEC.md e docs/sprints/SPRINT_02.md.

Escopo obrigatório:
1. garantir que o backend não retorne senha/hash ao frontend
2. garantir que endpoints privados usem o userId autenticado
3. impedir acesso cruzado entre usuários
4. validar no backend a sequência de registros de ponto
5. criar ou ajustar testes para essas regras
6. atualizar docs/PROJECT_STATUS.md com o resultado da sprint

Restrições:
- não crie novas funcionalidades
- não altere layout
- não faça redesign
- não troque banco de dados
- não troque ORM
- não altere arquitetura sem necessidade
- não implemente nada fora do escopo
- não remova testes sem justificar
- não altere schema do banco sem necessidade comprovada

Antes de cada alteração relevante, explique rapidamente o motivo.

Ao final, entregue:
1. arquivos alterados
2. endpoints revisados
3. correções feitas
4. testes adicionados ou alterados
5. comandos executados
6. resultado de check/test/build
7. pendências para Sprint 03
```

---

## 12. Prompt de Revisão Pós-Sprint

Use depois que o agente terminar:

```txt
Revise a implementação da Sprint 02.

Não altere arquivos ainda.

Verifique:
1. se alguma mudança saiu do escopo
2. se senha/hash ainda pode ser retornado em algum endpoint
3. se todos os endpoints sensíveis usam userId autenticado
4. se existe risco de acesso cruzado entre usuários
5. se a sequência de ponto é validada no backend
6. se os testes realmente cobrem as regras críticas
7. se houve alteração desnecessária no frontend
8. se houve alteração desnecessária no banco
9. se a documentação foi atualizada

Entregue uma lista de problemas encontrados, nível de risco e recomendação.
```

---

## 13. Pendências Prováveis para Sprint 03

A Sprint 03 só deve começar depois que a Sprint 02 for revisada.

Possíveis temas para a Sprint 03:

- revisar histórico;
- revisar cálculos de horas;
- revisar relatórios;
- melhorar filtros por data;
- melhorar mensagens de erro no frontend;
- melhorar estados de loading;
- preparar dados para exportação futura.

Não iniciar Sprint 03 enquanto houver falhas críticas de autenticação, isolamento de dados ou validação de ponto.
