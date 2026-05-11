# PontoCerto

App de controle de ponto pessoal. Registre suas batidas, acompanhe horas trabalhadas, visualize histórico e exporte relatórios.

## Stack

- **Frontend:** React 19 + TypeScript + Tailwind CSS + shadcn/ui + Framer Motion
- **Backend:** tRPC + Drizzle ORM + Hono
- **Database:** Cloudflare D1 (SQLite serverless)
- **Deploy:** Cloudflare Pages

## Estrutura do Projeto

```
├── src/                    # Frontend
│   ├── screens/            # Telas (Login, Home, History, Reports, Profile)
│   ├── components/         # Componentes reutilizáveis
│   ├── context/            # AppContext + tRPC hooks
│   ├── providers/          # TRPCProvider
│   └── types/              # Tipos TypeScript
├── api/                    # Backend tRPC
│   ├── router.ts           # Rotas da API
│   ├── context.ts          # Contexto do tRPC
│   ├── middleware.ts       # Middleware
│   └── queries/            # Queries
├── db/                     # Database
│   ├── schema.ts           # Drizzle schema
│   ├── schema.sql          # SQL schema para D1
│   └── seed.sql            # Dados iniciais
├── functions/api/          # Cloudflare Pages Functions
├── contracts/              # Tipos compartilhados
└── public/assets/          # Imagens
```

## Deploy no Cloudflare

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar Cloudflare

```bash
npx wrangler login
```

### 3. Criar banco D1

```bash
npx wrangler d1 create pontocerto-db
```

Copie o `database_id` para o `wrangler.toml`.

### 4. Aplicar schema e seed

```bash
npx wrangler d1 execute pontocerto-db --file=./db/schema.sql
npx wrangler d1 execute pontocerto-db --file=./db/seed.sql
```

### 5. Build e deploy

```bash
npm run build
npx wrangler pages deploy dist/public
```

## Desenvolvimento local

```bash
npm run dev      # Servidor de desenvolvimento
npm run check    # Type check
npm run build    # Build de produção
```

## PIN padrão

O PIN padrão para login é **1234**.

## API Endpoints (tRPC)

- `user.get` - Buscar perfil
- `user.create` - Criar usuário
- `user.update` - Atualizar perfil
- `entry.list` - Listar pontos
- `entry.getByDate` - Pontos por data
- `entry.create` - Registrar ponto
- `entry.update` - Editar ponto
- `entry.delete` - Remover ponto
- `entry.listByMonth` - Pontos do mês
