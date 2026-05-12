param(
    [switch]$WhatIf = $false,
    [switch]$Commit = $false
)

$ErrorActionPreference = "Stop"
$root = (Resolve-Path "$PSScriptRoot\..").Path

function Backup-File {
    param($Path)
    if ($WhatIf) { return }
    $backup = "$Path.bak"
    if (-not (Test-Path $backup) -and (Test-Path $Path)) {
        Copy-Item -LiteralPath $Path -Destination $backup -Force
    }
}

function Write-File {
    param($Path, $Content)
    if ($WhatIf) {
        Write-Host "  [WhatIf] Escrever $Path" -ForegroundColor Yellow
        return
    }
    [System.IO.File]::WriteAllText($Path, $Content, [System.Text.UTF8]::new($false))
    Write-Host "  OK: $Path" -ForegroundColor Green
}

# ============================================================
# FASE 6: DEFEITOS & MELHORIAS
# ============================================================
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  FASE 6 - DEFEITOS & MELHORIAS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# --- 6.1: Otimizar entry.listByMonth (filtro no SQL) ---
Write-Host "`n[6.1] Otimizando entry.listByMonth para filtrar no SQL..." -ForegroundColor Cyan
$routerPath = "$root\api\router.ts"
$routerContent = Get-Content -LiteralPath $routerPath -Raw
Backup-File -Path $routerPath

# Substituir listByMonth implementation
$oldListByMonth = @'
    listByMonth: authedQuery
      .input(z.object({
        year: z.number().min(2020).max(2100),
        month: z.number().min(1).max(12),
      }))
      .query(async ({ ctx, input }) => {
        const db = createDb(ctx.env.DB);
        const prefix = `${input.year}-${String(input.month).padStart(2, "0")}`;
        const all = await db.select().from(timeEntries)
          .where(eq(timeEntries.userId, ctx.user!.userId))
          .orderBy(desc(timeEntries.timestamp));
        return all.filter(e => e.date.startsWith(prefix));
      }),
'@

$newListByMonth = @'
    listByMonth: authedQuery
      .input(z.object({
        year: z.number().min(2020).max(2100),
        month: z.number().min(1).max(12),
      }))
      .query(async ({ ctx, input }) => {
        const db = createDb(ctx.env.DB);
        const prefix = `${input.year}-${String(input.month).padStart(2, "0")}`;
        return db.select().from(timeEntries)
          .where(and(
            eq(timeEntries.userId, ctx.user!.userId),
            like(timeEntries.date, `${prefix}%`)
          ))
          .orderBy(desc(timeEntries.timestamp));
      }),
'@

# Need to import `like` from drizzle-orm if not already
if (-not $routerContent.Contains(", like")) {
    $routerContent = $routerContent -replace "from ['\"]drizzle-orm['\"]", 'from "drizzle-orm"'
    $routerContent = $routerContent -replace 'import \{ eq, and, desc \} from "drizzle-orm"', 'import { eq, and, desc, like } from "drizzle-orm"'
    Write-Host "  Import 'like' adicionado" -ForegroundColor Yellow
}

$routerContent = $routerContent -replace [regex]::Escape($oldListByMonth), $newListByMonth

if (-not $WhatIf) {
    [System.IO.File]::WriteAllText($routerPath, $routerContent, [System.Text.UTF8]::new($false))
    Write-Host "  OK: listByMonth otimizado (filtro no SQL)" -ForegroundColor Green
}

# --- 6.2: Ownership check em entry.delete e entry.update ---
Write-Host "`n[6.2] Adicionando verificação de ownership em entry.delete e entry.update..." -ForegroundColor Cyan

$routerContent = Get-Content -LiteralPath $routerPath -Raw

# Fix entry.update - add userId check
$oldUpdate = @'
    update: authedQuery
      .input(z.object({
        id: z.number().positive(),
        timestamp: z.number().min(0),
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = createDb(ctx.env.DB);
        const { id, ...data } = input;
        const result = await db.update(timeEntries).set(data).where(eq(timeEntries.id, id)).returning();
        return result[0];
      }),
'@

$newUpdate = @'
    update: authedQuery
      .input(z.object({
        id: z.number().positive(),
        timestamp: z.number().min(0),
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = createDb(ctx.env.DB);
        const { id, ...data } = input;
        const result = await db.update(timeEntries)
          .set(data)
          .where(and(eq(timeEntries.id, id), eq(timeEntries.userId, ctx.user!.userId)))
          .returning();
        if (result.length === 0) throw new Error("Registro nao encontrado ou acesso negado");
        return result[0];
      }),
'@
$routerContent = $routerContent -replace [regex]::Escape($oldUpdate), $newUpdate

# Fix entry.delete - add userId check
$oldDeleteOld = @'
    delete: authedQuery
      .input(z.object({ id: z.number().positive() }))
      .mutation(async ({ ctx, input }) => {
        const db = createDb(ctx.env.DB);
        await db.delete(timeEntries).where(eq(timeEntries.id, input.id));
        return { success: true };
      }),
'@

$newDelete = @'
    delete: authedQuery
      .input(z.object({ id: z.number().positive() }))
      .mutation(async ({ ctx, input }) => {
        const db = createDb(ctx.env.DB);
        const result = await db.delete(timeEntries)
          .where(and(eq(timeEntries.id, input.id), eq(timeEntries.userId, ctx.user!.userId)));
        return { success: true };
      }),
'@
$routerContent = $routerContent -replace [regex]::Escape($oldDeleteOld), $newDelete

if (-not $WhatIf) {
    [System.IO.File]::WriteAllText($routerPath, $routerContent, [System.Text.UTF8]::new($false))
    Write-Host "  OK: ownership checks adicionados em entry.update e entry.delete" -ForegroundColor Green
}

# --- 6.3: Tratamento de erros consistente via contracts/errors.ts ---
Write-Host "`n[6.3] Implementando tratamento de erros consistente..." -ForegroundColor Cyan

# Atualizar contracts/errors.ts
Write-File -Path "$root\contracts\errors.ts" -Content @'
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 400,
    public code: string = "BAD_REQUEST"
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function badRequest(message: string): AppError {
  return new AppError(message, 400, "BAD_REQUEST");
}

export function unauthorized(message: string = "Nao autorizado"): AppError {
  return new AppError(message, 401, "UNAUTHORIZED");
}

export function forbidden(message: string = "Acesso negado"): AppError {
  return new AppError(message, 403, "FORBIDDEN");
}

export function notFound(message: string = "Nao encontrado"): AppError {
  return new AppError(message, 404, "NOT_FOUND");
}

export function internal(message: string = "Erro interno do servidor"): AppError {
  return new AppError(message, 500, "INTERNAL_ERROR");
}

export function rateLimited(message: string = "Muitas tentativas. Aguarde um momento."): AppError {
  return new AppError(message, 429, "RATE_LIMITED");
}
'@

# Atualizar middleware.ts com onError handler
$midPath = "$root\api\middleware.ts"
$midContent = @'
/**
 * tRPC Middleware - PontoCerto
 *
 * Procedures:
 * - publicQuery: open endpoints (health check)
 * - authedQuery: requires valid JWT token
 */
import { initTRPC } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";
import { AppError } from "@contracts/errors";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    const isAppError = error.cause instanceof AppError;
    return {
      ...shape,
      data: {
        ...shape.data,
        code: isAppError ? (error.cause as AppError).code : "INTERNAL_ERROR",
        httpStatus: isAppError ? (error.cause as AppError).statusCode : 500,
      },
    };
  },
});

export const createRouter = t.router;
export const publicQuery = t.procedure;

// Authenticated procedure - requires valid JWT
export const authedQuery = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.user) {
    const { unauthorized } = await import("@contracts/errors");
    throw unauthorized("Nao autenticado. Faca login primeiro.");
  }
  return next({ ctx });
});
'@
Write-File -Path $midPath -Content $midContent

# Adicionar path alias para @contracts no tsconfig.server.json
Write-Host "  Adicionando alias @contracts ao tsconfig.server.json..." -ForegroundColor Gray
$tsServerPath = "$root\tsconfig.server.json"
if (Test-Path $tsServerPath) {
    $tsServer = Get-Content -LiteralPath $tsServerPath -Raw | ConvertFrom-Json
    if (-not $tsServer.compilerOptions.paths.'@contracts/*') {
        $tsServer.compilerOptions.paths | Add-Member -NotePropertyName '@contracts/*' -NotePropertyValue @("./contracts/*") -Force
        if (-not $WhatIf) {
            $newTsServer = $tsServer | ConvertTo-Json -Depth 10
            [System.IO.File]::WriteAllText($tsServerPath, $newTsServer, [System.Text.UTF8]::new($false))
            Write-Host "  OK: @contracts alias adicionado ao tsconfig.server.json" -ForegroundColor Green
        }
    }
}

# --- 6.4: Commit das mudancas staged ---
Write-Host "`n[6.4] Verificando e commitando mudancas..." -ForegroundColor Cyan
if ($Commit -and (-not $WhatIf)) {
    Push-Location $root
    try {
        $status = git status --porcelain
        if ($status) {
            git add -A
            git commit -m "fix: auditoria e correcoes - seguranca, limpeza, refatoracao e testes"
            Write-Host "  OK: Commit criado" -ForegroundColor Green
        } else {
            Write-Host "  Nenhuma mudanca para commit" -ForegroundColor Yellow
        }
    } finally {
        Pop-Location
    }
} else {
    Write-Host "  (pule com -Commit para criar o commit)" -ForegroundColor Yellow
}

# ============================================================
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  FASE 6 CONCLUIDA" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan

Write-Host "`nVerificacao final:" -ForegroundColor Yellow
Write-Host "  npm run check  (TypeScript check)" -ForegroundColor White
Write-Host "  npm test       (Rodar testes)" -ForegroundColor White
Write-Host "  npm run lint   (ESLint)" -ForegroundColor White
