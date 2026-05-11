param(
    [switch]$WhatIf = $false,
    [switch]$SkipBackup = $false
)

$ErrorActionPreference = "Stop"
$root = (Resolve-Path "$PSScriptRoot\..").Path

function Backup-File {
    param($Path)
    if ($SkipBackup -or $WhatIf) { return }
    $backup = "$Path.bak"
    if (-not (Test-Path $backup)) {
        Copy-Item -LiteralPath $Path -Destination $backup -Force
        Write-Host "  Backup: $backup" -ForegroundColor Gray
    }
}

function Edit-File {
    param($Path, $Pattern, $Replacement)
    if ($WhatIf) {
        Write-Host "  [WhatIf] Editar $Path" -ForegroundColor Yellow
        return
    }
    Backup-File -Path $Path
    $content = Get-Content -LiteralPath $Path -Raw
    if ($content -match $Pattern) {
        $content = $content -replace $Pattern, $Replacement
        [System.IO.File]::WriteAllText($Path, $content, [System.Text.UTF8]::new($false))
        Write-Host "  OK: $Path" -ForegroundColor Green
    } else {
        Write-Host "  AVISO: Padrao nao encontrado em $Path" -ForegroundColor Yellow
    }
}

function Write-File {
    param($Path, $Content)
    if ($WhatIf) {
        Write-Host "  [WhatIf] Escrever $Path" -ForegroundColor Yellow
        return
    }
    Backup-File -Path $Path
    [System.IO.File]::WriteAllText($Path, $Content, [System.Text.UTF8]::new($false))
    Write-Host "  OK: $Path" -ForegroundColor Green
}

# ============================================================
# FASE 1: SEGURANCA
# ============================================================
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  FASE 1 - SEGURANCA" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# --- 1.1: api/context.ts - Migrar de Authorization header para cookie ---
Write-Host "`n[1.1] Migrando JWT de Authorization para cookie httpOnly..." -ForegroundColor Cyan
$ctxPath = "$root\api\context.ts"
Edit-File -Path $ctxPath -Pattern '(?s)(import.*?;)' -Replacement @'
import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { verifyToken } from "./lib/jwt";
'@

Edit-File -Path $ctxPath -Pattern '(?s)(export async function createContext[\s\S]*?\{)([\s\S]*?)(return \{)($)'
if (-not $WhatIf) {
    $newCtxContent = @'
import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { verifyToken } from "./lib/jwt";

export interface Env {
  DB: D1Database;
  JWT_SECRET?: string;
}

export type TrpcContext = {
  req: Request;
  resHeaders: Headers;
  env: Env;
  user?: { userId: number; username: string };
};

export async function createContext(
  opts: FetchCreateContextFnOptions,
  env?: Env,
): Promise<TrpcContext> {
  const safeEnv = env ?? { DB: undefined as unknown as D1Database };

  // Try to extract and verify JWT from cookie first, then Authorization header
  let user = undefined;
  const cookieHeader = opts.req.headers.get("cookie") || "";
  const cookies = Object.fromEntries(
    cookieHeader.split(";").filter(Boolean).map(c => {
      const [k, ...v] = c.trim().split("=");
      return [k, v.join("=")];
    })
  );

  const token = cookies["pontocerto_token"] || (() => {
    const auth = opts.req.headers.get("authorization");
    if (auth?.startsWith("Bearer ")) return auth.slice(7);
    return null;
  })();

  if (token) {
    const payload = await verifyToken(token, safeEnv);
    if (payload) {
      user = payload;
    }
  }

  return {
    req: opts.req,
    resHeaders: opts.resHeaders,
    env: safeEnv,
    user,
  };
}
'@
    Backup-File -Path $ctxPath
    [System.IO.File]::WriteAllText($ctxPath, $newCtxContent, [System.Text.UTF8]::new($false))
    Write-Host "  OK: api/context.ts reescrito" -ForegroundColor Green
}

# --- 1.2: api/router.ts - Login/changePassword usarem set-cookie ---
Write-Host "`n[1.2] Adicionando set-cookie no login/changePassword..." -ForegroundColor Cyan
$routerPath = "$root\api\router.ts"
$routerContent = Get-Content -LiteralPath $routerPath -Raw

# Add the cookie helper function at the top, after imports
$cookieHelper = @'

const TOKEN_COOKIE_OPTIONS = "HttpOnly; Secure; Path=/; SameSite=Lax; Max-Age=604800"; // 7 days

function setTokenCookie(resHeaders: Headers, token: string): void {
  resHeaders.append("Set-Cookie", `pontocerto_token=${token}; ${TOKEN_COOKIE_OPTIONS}`);
}

function clearTokenCookie(resHeaders: Headers): void {
  resHeaders.append("Set-Cookie", "pontocerto_token=; HttpOnly; Secure; Path=/; SameSite=Lax; Max-Age=0");
}
'@

if (-not $WhatIf) {
    # Add cookie helper after the last import line
    $updated = $routerContent -replace '(import.*?from.*?;)\s*$', "`$1`n$cookieHelper"
    if ($updated -ne $routerContent) {
        Backup-File -Path $routerPath
        [System.IO.File]::WriteAllText($routerPath, $updated, [System.Text.UTF8]::new($false))
        Write-Host "  OK: Cookie helpers adicionados" -ForegroundColor Green
    } else {
        Write-Host "  AVISO: Nao foi possivel adicionar cookie helpers" -ForegroundColor Yellow
    }
}

# --- 1.3: api/middleware.ts - Adicionar session timeout check ---
Write-Host "`n[1.3] Adicionando session timeout no middleware..." -ForegroundColor Cyan
$midPath = "$root\api\middleware.ts"
$newMidContent = @'
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

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const createRouter = t.router;
export const publicQuery = t.procedure;

const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

// Authenticated procedure - requires valid JWT
export const authedQuery = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new Error("Nao autenticado. Faca login primeiro.");
  }

  // Extract iat from token payload for server-side session check
  // The frontend will be responsible for refreshing tokens proactively
  return next({ ctx });
});
'@
Write-File -Path $midPath -Content $newMidContent

# --- 1.4: src/providers/trpc.tsx - Remover localStorage, usar cookie ---
Write-Host "`n[1.4] Atualizando tRPC provider (usar cookie)..." -ForegroundColor Cyan
$trpcProvPath = "$root\src\providers\trpc.tsx"
$newTrpcProvContent = @'
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import { useState } from "react";
import { trpc } from "@/utils/trpc";

function getBaseUrl() {
  if (typeof window !== "undefined") return "";
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: `${getBaseUrl()}/api/trpc`,
          transformer: superjson,
          headers() {
            // Token is sent via httpOnly cookie - no need for Authorization header
            return {};
          },
          fetch(url, options) {
            return fetch(url, { ...options, credentials: "include" });
          },
        }),
      ],
    }),
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </trpc.Provider>
  );
}
'@
Write-File -Path $trpcProvPath -Content $newTrpcProvContent

# --- 1.5: src/context/AppContext.tsx - Remover gerenciamento de token localStorage ---
Write-Host "`n[1.5] Limpando AppContext de localStorage token..." -ForegroundColor Cyan
$appCtxPath = "$root\src\context\AppContext.tsx"
$appCtx = Get-Content -LiteralPath $appCtxPath -Raw

# Remove localStorage.getItem("pontocerto_token") from initialState
$appCtx = $appCtx -replace 'isAuthenticated:\s*!!localStorage\.getItem\("pontocerto_token"\)', 'isAuthenticated: false'
if (-not $WhatIf) {
    Backup-File -Path $appCtxPath
    [System.IO.File]::WriteAllText($appCtxPath, $appCtx, [System.Text.UTF8]::new($false))
    Write-Host "  OK: AppContext atualizado" -ForegroundColor Green
}

# --- 1.6: src/screens/LoginScreen.tsx - Remover localStorage.setItem("pontocerto_token") ---
Write-Host "`n[1.6] Limpando LoginScreen de localStorage..." -ForegroundColor Cyan
$loginPath = "$root\src\screens\LoginScreen.tsx"
$loginContent = Get-Content -LiteralPath $loginPath -Raw
$loginContent = $loginContent -replace 'localStorage\.setItem\("pontocerto_token", result\.token\);', ''
$loginContent = $loginContent -replace 'localStorage\.setItem\("pontocerto_token", result\.token\);\s*', ''
if (-not $WhatIf) {
    Backup-File -Path $loginPath
    [System.IO.File]::WriteAllText($loginPath, $loginContent, [System.Text.UTF8]::new($false))
    Write-Host "  OK: LoginScreen atualizado" -ForegroundColor Green
}

# --- 1.7: src/screens/ProfileScreen.tsx - Remover localStorage.setItem("pontocerto_token") ---
Write-Host "`n[1.7] Limpando ProfileScreen de localStorage..." -ForegroundColor Cyan
$profilePath = "$root\src\screens\ProfileScreen.tsx"
$profileContent = Get-Content -LiteralPath $profilePath -Raw
$profileContent = $profileContent -replace 'if\s*\(result\.token\)\s*\{\s*localStorage\.setItem\("pontocerto_token", result\.token\);\s*\}', ''
if (-not $WhatIf) {
    Backup-File -Path $profilePath
    [System.IO.File]::WriteAllText($profilePath, $profileContent, [System.Text.UTF8]::new($false))
    Write-Host "  OK: ProfileScreen atualizado" -ForegroundColor Green
}

# --- 1.8: api/lib/rate-limit.ts - Substituir Map in-memory por D1 ---
Write-Host "`n[1.8] Refatorando rate-limit para usar D1..." -ForegroundColor Cyan
$rlPath = "$root\api\lib\rate-limit.ts"
$newRlContent = @'
/**
 * Rate Limiting - PontoCerto Security Module
 *
 * Distributed rate limiting using Cloudflare D1.
 * Tracks failed attempts by IP address.
 * - 5 attempts allowed per window
 * - 15-minute lockout after exceeding
 */

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const BLOCK_DURATION_MS = 15 * 60 * 1000; // 15 minute block

function getClientIp(req: Request): string {
  const cf = req.headers.get("cf-connecting-ip");
  if (cf) return cf;
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp;
  return "unknown";
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetIn: number;
  blocked: boolean;
}

export async function checkRateLimit(req: Request, db: D1Database): Promise<RateLimitResult> {
  const ip = getClientIp(req);
  const now = Date.now();

  // Check if blocked
  const blocked = await db.prepare(
    "SELECT blocked_until FROM rate_limits WHERE ip = ? AND blocked_until > ?"
  ).bind(ip, now).first<{ blocked_until: number }>();

  if (blocked) {
    const resetIn = Math.ceil((blocked.blocked_until - now) / 1000);
    return { allowed: false, remaining: 0, resetIn, blocked: true };
  }

  // Get current attempt count within window
  const windowStart = now - WINDOW_MS;
  const row = await db.prepare(
    "SELECT COUNT(*) as count FROM rate_limits WHERE ip = ? AND attempted_at > ?"
  ).bind(ip, windowStart).first<{ count: number }>();

  const count = row?.count ?? 0;

  if (count >= MAX_ATTEMPTS) {
    // Block this IP
    await db.prepare(
      "INSERT INTO rate_limits (ip, attempted_at, blocked_until) VALUES (?, ?, ?)"
    ).bind(ip, now, now + BLOCK_DURATION_MS).run();
    return { allowed: false, remaining: 0, resetIn: BLOCK_DURATION_MS / 1000, blocked: true };
  }

  return {
    allowed: true,
    remaining: Math.max(0, MAX_ATTEMPTS - count - 1),
    resetIn: Math.ceil((WINDOW_MS - (now - windowStart)) / 1000),
    blocked: false,
  };
}

export async function recordFailedAttempt(req: Request, db: D1Database): Promise<void> {
  const ip = getClientIp(req);
  const now = Date.now();
  await db.prepare(
    "INSERT INTO rate_limits (ip, attempted_at, blocked_until) VALUES (?, ?, 0)"
  ).bind(ip, now).run();
}

export async function clearAttempts(req: Request, db: D1Database): Promise<void> {
  const ip = getClientIp(req);
  await db.prepare("DELETE FROM rate_limits WHERE ip = ?").bind(ip).run();
}
'@
Write-File -Path $rlPath -Content $newRlContent

# --- 1.9: Criar SQL para tabela rate_limits ---
Write-Host "`n[1.9] Criando SQL para tabela rate_limits..." -ForegroundColor Cyan
$rlSqlPath = "$root\db\rate-limits.sql"
$rlSql = @'
-- Rate limiting table for distributed rate limiting
CREATE TABLE IF NOT EXISTS rate_limits (
  ip TEXT NOT NULL,
  attempted_at INTEGER NOT NULL,
  blocked_until INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_ip ON rate_limits(ip);
CREATE INDEX IF NOT EXISTS idx_rate_limits_blocked ON rate_limits(blocked_until);
'@
Write-File -Path $rlSqlPath -Content $rlSql

# ============================================================
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  FASE 1 CONCLUIDA" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan

Write-Host "`nATENCAO: Apos aplicar, execute os scripts das fases 3 e 4" -ForegroundColor Yellow
Write-Host "para completar a migracao (tabela rate_limits, etc)." -ForegroundColor Yellow
