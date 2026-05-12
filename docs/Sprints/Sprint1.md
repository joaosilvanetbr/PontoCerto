# Sprint 01 — Estabilização Inicial do Projeto

## Objetivo

Estabilizar o projeto PontoCerto antes de criar novas funcionalidades.

Esta sprint deve garantir que o projeto instala corretamente, roda os testes, passa nas verificações básicas e tem documentação mínima confiável para continuar o desenvolvimento com segurança.

## Contexto

O projeto já está parcialmente desenvolvido e possui:

- Frontend em React, TypeScript e Vite
- Backend com Hono, tRPC, Drizzle e Cloudflare D1
- Autenticação com JWT em cookie httpOnly
- Registro de ponto
- Histórico
- Relatórios
- Perfil de usuário
- Testes no frontend e backend

Antes de avançar para melhorias, é necessário validar o estado atual.

## Escopo da Sprint

Nesta sprint, o agente deve:

1. Instalar as dependências do projeto
2. Rodar os comandos principais
3. Identificar erros de build, testes ou TypeScript
4. Corrigir apenas erros bloqueantes
5. Atualizar a documentação básica se estiver desatualizada
6. Registrar o estado atual do projeto

## Fora do Escopo

Não fazer nesta sprint:

- Criar novas telas
- Alterar o design
- Trocar bibliotecas principais
- Refatorar grandes partes do código
- Alterar arquitetura sem necessidade
- Criar novas features
- Mudar banco de dados sem justificativa clara
- Alterar autenticação além de correções bloqueantes

## Comandos Obrigatórios

Executar na raiz do projeto:

```bash
npm install
npm run check
npm test
npm run build