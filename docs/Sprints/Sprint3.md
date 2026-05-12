# Sprint 03 — Histórico, Relatórios e Cálculo de Horas

## 1. Objetivo

Revisar e consolidar as funcionalidades de **histórico**, **relatórios** e **cálculo de horas** do projeto **PontoCerto**.

Esta sprint deve garantir que o usuário consiga consultar seus registros de ponto com consistência, visualizar totais corretos e confiar nos dados exibidos no frontend.

O foco desta sprint é transformar os registros já protegidos e validados pelo backend em informações úteis para o usuário.

---

## 2. Contexto

As sprints anteriores devem ter deixado o projeto em um estado mais seguro:

- Sprint 01: estabilização inicial, comandos, build, testes e documentação.
- Sprint 02: segurança do backend, isolamento por usuário e validação de sequência de ponto.

Agora, com a base mais confiável, a Sprint 03 deve revisar a camada de consulta e cálculo:

- histórico de registros;
- filtros por data;
- agrupamento por dia;
- cálculo de horas trabalhadas;
- cálculo de intervalos;
- relatórios básicos;
- consistência entre backend e frontend.

Esta sprint não deve criar relatórios avançados, exportação PDF/Excel ou dashboards complexos. O objetivo é garantir que o básico esteja correto.

---

## 3. Escopo da Sprint

Nesta sprint, o agente deve trabalhar nos seguintes pontos:

1. Revisar como o histórico de ponto é carregado
2. Garantir que o histórico mostre apenas dados do usuário autenticado
3. Revisar filtros por data, mês ou período
4. Padronizar cálculo de horas trabalhadas
5. Padronizar cálculo de intervalo
6. Revisar relatórios básicos existentes
7. Corrigir inconsistências de data, timezone ou ordenação
8. Adicionar ou ajustar testes para cálculos e filtros
9. Atualizar documentação de status da sprint

---

## 4. Fora do Escopo

Não fazer nesta sprint:

- criar exportação PDF;
- criar exportação Excel;
- criar gráficos avançados;
- criar dashboard novo;
- redesenhar telas;
- trocar biblioteca de UI;
- alterar autenticação;
- alterar schema do banco sem necessidade comprovada;
- criar sistema de aprovação de ponto;
- criar controle de equipe;
- criar funcionalidades de admin;
- mudar arquitetura geral do projeto;
- refatorar todo o frontend;
- alterar regras de segurança já implementadas na Sprint 02 sem necessidade.

Se algum desses pontos parecer necessário, registrar como pendência para sprint futura.

---

## 5. Arquivos Prováveis de Análise

O agente deve localizar os arquivos reais do projeto antes de alterar qualquer coisa.

Áreas prováveis:

```txt
backend/
  src/
    routers/
    routes/
    procedures/
    db/
    schema/
    services/
    utils/
    tests/

frontend/
  src/
    pages/
    components/
    hooks/
    contexts/
    utils/
    api/
```

Possíveis temas de arquivos:

- histórico de ponto;
- relatórios;
- registros de ponto;
- cálculo de horas;
- formatação de data;
- filtros por mês/período;
- componentes de lista/tabela.

A lista final deve ser confirmada pelo agente no planejamento.

---

## 6. Regras de Negócio da Sprint

### 6.1 Histórico

O histórico deve:

- listar apenas registros do usuário autenticado;
- ordenar registros de forma previsível;
- permitir consulta por data, mês ou período, se já existir suporte;
- exibir os dados com datas e horários compreensíveis;
- lidar bem com dias sem registros;
- lidar bem com jornadas incompletas.

### 6.2 Relatórios

Os relatórios básicos devem:

- considerar apenas registros do usuário autenticado;
- respeitar filtros aplicados;
- calcular horas por dia;
- calcular total do período;
- separar tempo trabalhado de tempo de intervalo, se aplicável;
- não misturar dados de usuários diferentes.

### 6.3 Cálculo de Horas

A regra base de cálculo deve considerar a sequência:

```txt
entrada -> início de intervalo -> retorno de intervalo -> saída
```

Cálculo esperado em um dia completo:

```txt
horas trabalhadas = (saída - entrada) - (retorno do intervalo - início do intervalo)
```

Exemplo:

```txt
Entrada: 08:00
Início intervalo: 12:00
Retorno intervalo: 13:00
Saída: 17:00

Total bruto: 9h
Intervalo: 1h
Total trabalhado: 8h
```

### 6.4 Dias sem Intervalo

Se o sistema permitir saída direta sem intervalo:

```txt
entrada -> saída
```

O cálculo esperado é:

```txt
horas trabalhadas = saída - entrada
```

Se o sistema exigir intervalo obrigatório, esse comportamento deve ser documentado e validado.

### 6.5 Jornadas Incompletas

Jornadas incompletas não devem quebrar a tela ou o relatório.

Exemplos:

- apenas entrada registrada;
- entrada e início de intervalo, mas sem retorno;
- entrada, intervalo e retorno, mas sem saída.

O sistema deve:

- exibir o dia como incompleto;
- evitar cálculo final incorreto;
- não somar horas inválidas ao total final;
- mostrar estado ou mensagem apropriada.

### 6.6 Ordenação

Os registros devem ser ordenados por data e horário.

Critério recomendado:

- histórico mais recente primeiro na visão geral;
- registros dentro de um mesmo dia em ordem cronológica.

### 6.7 Timezone

A sprint deve revisar se há risco de erro por timezone.

O sistema deve evitar situações como:

- registro feito em um dia aparecer no dia anterior;
- filtro mensal ignorar registros do último dia;
- data UTC quebrar agrupamento por data local.

Se não for possível resolver completamente nesta sprint, documentar o risco em `docs/PROJECT_STATUS.md`.

---

## 7. Tarefas Detalhadas

### Tarefa 1 — Ler documentação e estado atual

Antes de alterar arquivos, o agente deve ler:

```txt
docs/SPEC.md
docs/PROJECT_STATUS.md
docs/sprints/SPRINT_01.md
docs/sprints/SPRINT_02.md
docs/sprints/SPRINT_03.md
```

Se algum arquivo não existir, registrar no relatório e continuar usando o código atual como fonte.

---

### Tarefa 2 — Mapear fluxo de histórico e relatórios

Identificar:

- quais endpoints/procedures retornam registros;
- quais endpoints/procedures retornam relatórios;
- quais componentes exibem histórico;
- quais componentes exibem relatórios;
- onde os cálculos são feitos;
- onde datas são formatadas;
- quais filtros existem.

Resultado esperado:

```txt
Mapa simples do fluxo:
backend -> API/tRPC -> hook/context -> tela/componente
```

---

### Tarefa 3 — Revisar filtros por período

Verificar filtros existentes, como:

- dia;
- semana;
- mês;
- intervalo customizado;
- ano.

Garantir que:

- filtros usam datas válidas;
- filtros não vazam dados de outros usuários;
- filtros respeitam início e fim do período;
- filtros funcionam no backend, não apenas no frontend, quando aplicável;
- mensagens para períodos vazios são adequadas.

Se filtros avançados não existirem, não criar sem estar no escopo. Apenas melhorar o que já existe.

---

### Tarefa 4 — Consolidar cálculo de horas

Localizar onde o cálculo de horas é feito.

Se houver cálculo duplicado em vários lugares, avaliar a criação de uma função utilitária compartilhada dentro da camada adequada do projeto.

Exemplos de funções possíveis:

```ts
calculateWorkedMinutes(records)
calculateBreakMinutes(records)
groupRecordsByDay(records)
formatMinutesAsHours(minutes)
```

Usar os nomes reais e padrões do projeto.

Critérios:

- cálculo deve ser testável;
- cálculo deve lidar com jornada completa;
- cálculo deve lidar com jornada sem intervalo, se permitida;
- cálculo deve lidar com jornada incompleta;
- cálculo deve evitar valores negativos;
- cálculo deve evitar `NaN`;
- cálculo deve evitar somar dias incompletos como se fossem completos.

---

### Tarefa 5 — Revisar exibição do histórico

Verificar se a tela de histórico:

- exibe registros ordenados;
- mostra horário correto;
- mostra tipo de registro de forma clara;
- lida com lista vazia;
- lida com erro de carregamento;
- lida com loading;
- não quebra com registros incompletos.

Alterações visuais devem ser mínimas e necessárias.

Não fazer redesign.

---

### Tarefa 6 — Revisar relatórios básicos

Verificar se relatórios existentes mostram corretamente:

- total trabalhado no período;
- total por dia, se existir;
- dias incompletos;
- filtros aplicados;
- estados vazios;
- erros.

Se houver cálculo incorreto, corrigir.

Se houver relatório prometido na interface, mas não implementado corretamente, documentar ou ajustar dentro do escopo mínimo.

---

### Tarefa 7 — Adicionar ou ajustar testes

Criar ou atualizar testes para:

#### Cálculo de horas

- jornada completa com intervalo;
- jornada completa sem intervalo, se permitida;
- jornada incompleta;
- intervalo aberto;
- registros fora de ordem;
- registros ordenados antes do cálculo, se necessário.

#### Filtros

- filtro por mês;
- filtro por período, se existir;
- período sem registros;
- registros no limite inicial e final do período.

#### Isolamento

- histórico retorna apenas dados do usuário autenticado;
- relatório calcula apenas dados do usuário autenticado.

#### Formatação

- minutos para horas;
- total de horas em formato legível;
- datas inválidas não quebram a aplicação, quando aplicável.

Usar o framework de testes já existente no projeto.

Não introduzir novo framework sem necessidade.

---

### Tarefa 8 — Corrigir inconsistências mínimas no frontend

O frontend pode ser alterado para:

- consumir cálculo corrigido;
- exibir estados de erro/loading;
- exibir dia incompleto;
- corrigir label de horário;
- corrigir ordenação;
- corrigir filtros já existentes.

Não pode:

- criar layout novo;
- mudar design global;
- criar dashboard novo;
- adicionar biblioteca de gráfico;
- criar exportações.

---

### Tarefa 9 — Atualizar documentação

Atualizar ou criar:

```txt
docs/PROJECT_STATUS.md
```

Adicionar uma seção:

```md
## Sprint 03 — Histórico, Relatórios e Cálculo de Horas
```

Com:

- data da execução;
- resumo do que foi revisado;
- arquivos alterados;
- comandos executados;
- resultado dos testes;
- pendências encontradas;
- riscos restantes;
- observações sobre timezone, se houver.

---

## 8. Critérios de Aceite

A Sprint 03 será considerada concluída quando:

- histórico listar apenas dados do usuário autenticado;
- relatórios usarem apenas dados do usuário autenticado;
- registros estiverem ordenados corretamente;
- filtros existentes funcionarem corretamente;
- cálculo de horas estiver centralizado ou claramente consistente;
- jornada completa com intervalo calcular corretamente;
- jornada incompleta não quebrar tela nem relatório;
- testes cobrirem cálculo de horas;
- testes cobrirem filtros principais existentes;
- testes cobrirem isolamento em histórico/relatórios;
- `npm run check` passar ou falhas forem documentadas;
- `npm test` passar ou falhas forem documentadas;
- `npm run build` passar ou falhas forem documentadas;
- `docs/PROJECT_STATUS.md` for atualizado;
- nenhuma funcionalidade fora do escopo for implementada.

---

## 9. Comandos de Validação

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

## 10. Relatório Final Esperado

Ao final da sprint, o agente deve entregar:

```md
# Relatório — Sprint 03

## Arquivos alterados

- arquivo 1
- arquivo 2

## Fluxos revisados

- histórico
- relatórios
- cálculo de horas
- filtros

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

## Observações sobre timezone

- observação 1
```

---

## 11. Prompt de Planejamento para Agente

Use este prompt antes de permitir alterações:

```txt
Você está trabalhando no projeto PontoCerto.

Leia:
- docs/SPEC.md
- docs/PROJECT_STATUS.md, se existir
- docs/sprints/SPRINT_01.md, se existir
- docs/sprints/SPRINT_02.md, se existir
- docs/sprints/SPRINT_03.md

Não altere arquivos ainda.

Faça apenas o planejamento da Sprint 03.

Quero que você entregue:
1. resumo do objetivo da sprint
2. mapa do fluxo de histórico e relatórios
3. onde os cálculos de horas são feitos hoje
4. arquivos que pretende analisar
5. riscos técnicos, especialmente datas/timezone
6. plano de execução em etapas
7. arquivos que provavelmente serão modificados
8. testes que pretende criar ou ajustar

Não implemente nada ainda.
```

---

## 12. Prompt de Execução para Agente

Depois de revisar o plano, use este prompt:

```txt
Execute a Sprint 03 do projeto PontoCerto.

Siga exatamente:
- docs/SPEC.md
- docs/sprints/SPRINT_03.md

Escopo obrigatório:
1. revisar histórico de registros
2. revisar relatórios básicos
3. corrigir filtros existentes por data/período, se houver
4. padronizar cálculo de horas trabalhadas
5. lidar corretamente com jornadas incompletas
6. revisar riscos de timezone
7. criar ou ajustar testes para cálculo, filtros e isolamento
8. atualizar docs/PROJECT_STATUS.md

Restrições:
- não crie exportação PDF
- não crie exportação Excel
- não crie gráficos avançados
- não crie dashboard novo
- não altere layout global
- não altere autenticação
- não altere schema do banco sem necessidade comprovada
- não implemente funcionalidades fora do escopo
- não remova testes sem justificar

Antes de cada alteração relevante, explique rapidamente o motivo.

Ao final, entregue:
1. arquivos alterados
2. fluxos revisados
3. correções feitas
4. testes adicionados ou alterados
5. comandos executados
6. resultado de check/test/build
7. pendências para Sprint 04
```

---

## 13. Prompt de Revisão Pós-Sprint

Use depois que o agente terminar:

```txt
Revise a implementação da Sprint 03.

Não altere arquivos ainda.

Verifique:
1. se alguma mudança saiu do escopo
2. se histórico e relatórios usam apenas dados do usuário autenticado
3. se os cálculos de horas estão corretos
4. se jornadas incompletas são tratadas corretamente
5. se filtros por data/período funcionam nos limites inicial e final
6. se há risco de timezone
7. se os testes realmente cobrem os cenários críticos
8. se houve alteração visual desnecessária
9. se houve alteração desnecessária no banco
10. se a documentação foi atualizada

Entregue uma lista de problemas encontrados, nível de risco e recomendação.
```

---

## 14. Pendências Prováveis para Sprint 04

A Sprint 04 deve ser iniciada apenas depois que a Sprint 03 for revisada.

Possíveis temas para Sprint 04:

- melhorar experiência do usuário;
- melhorar mensagens de erro;
- melhorar loading states;
- melhorar estados vazios;
- revisar responsividade;
- melhorar acessibilidade básica;
- preparar exportação futura.

Não iniciar Sprint 04 enquanto houver falhas críticas em cálculo de horas, histórico ou relatórios.
