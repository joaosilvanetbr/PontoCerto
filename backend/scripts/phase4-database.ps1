param(
    [switch]$WhatIf = $false
)

$ErrorActionPreference = "Stop"
$root = (Resolve-Path "$PSScriptRoot\..").Path

function Write-File {
    param($Path, $Content)
    if ($WhatIf) {
        Write-Host "  [WhatIf] Escrever $Path" -ForegroundColor Yellow
        return
    }
    $dir = Split-Path $Path -Parent
    if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
    [System.IO.File]::WriteAllText($Path, $Content, [System.Text.UTF8]::new($false))
    Write-Host "  OK: $Path" -ForegroundColor Green
}

# ============================================================
# FASE 4: DATABASE & MIGRATIONS
# ============================================================
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  FASE 4 - DATABASE & MIGRATIONS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# --- 4.1: Preencher db/relations.ts ---
Write-Host "`n[4.1] Preenchendo relacoes Drizzle..." -ForegroundColor Cyan
Write-File -Path "$root\db\relations.ts" -Content @'
import { relations } from "drizzle-orm";
import { users, timeEntries } from "./schema";

export const usersRelations = relations(users, ({ many }) => ({
  timeEntries: many(timeEntries),
}));

export const timeEntriesRelations = relations(timeEntries, ({ one }) => ({
  user: one(users, {
    fields: [timeEntries.userId],
    references: [users.id],
  }),
}));
'@

# --- 4.2: Atualizar drizzle.config.ts ---
Write-Host "`n[4.2] Atualizando drizzle.config.ts..." -ForegroundColor Cyan
$drizzleCfg = @'
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./db/migrations",
  schema: "./db/schema.ts",
  dialect: "sqlite",
  driver: "d1-http",
  dbCredentials: {
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID!,
    databaseId: process.env.CLOUDFLARE_DATABASE_ID!,
    token: process.env.CLOUDFLARE_API_TOKEN!,
  },
});
'@
if (-not $WhatIf) {
    $drizzleCfgPath = "$root\drizzle.config.ts"
    if (Test-Path $drizzleCfgPath) { Copy-Item -LiteralPath $drizzleCfgPath -Destination "$drizzleCfgPath.bak" -Force }
    [System.IO.File]::WriteAllText($drizzleCfgPath, $drizzleCfg, [System.Text.UTF8]::new($false))
    Write-Host "  OK: drizzle.config.ts atualizado" -ForegroundColor Green
}

# --- 4.3: Atualizar schema.sql com tabela rate_limits e indices ---
Write-Host "`n[4.3] Atualizando schema.sql..." -ForegroundColor Cyan
$schemaSql = @'
-- PontoCerto Database Schema (SQLite / Cloudflare D1)

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  company TEXT,
  role TEXT,
  avatar TEXT,
  work_start_time TEXT NOT NULL DEFAULT '08:00',
  work_end_time TEXT NOT NULL DEFAULT '17:00',
  lunch_duration INTEGER NOT NULL DEFAULT 60,
  daily_target INTEGER NOT NULL DEFAULT 528,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS time_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('in', 'lunch-out', 'lunch-in', 'out')),
  timestamp INTEGER NOT NULL,
  date TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_time_entries_user_id ON time_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_date ON time_entries(date);
CREATE INDEX IF NOT EXISTS idx_time_entries_user_date ON time_entries(user_id, date);

CREATE TABLE IF NOT EXISTS rate_limits (
  ip TEXT NOT NULL,
  attempted_at INTEGER NOT NULL,
  blocked_until INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_ip ON rate_limits(ip);
CREATE INDEX IF NOT EXISTS idx_rate_limits_blocked ON rate_limits(blocked_until);
'@
Write-File -Path "$root\db\schema.sql" -Content $schemaSql

# --- 4.4: Rodar drizzle-kit generate ---
Write-Host "`n[4.4] Gerando migrations com drizzle-kit..." -ForegroundColor Cyan
if (-not $WhatIf) {
    Push-Location $root
    try {
        # Check if drizzle-kit is available
        $drizzleKit = Get-Command "npx" -ErrorAction SilentlyContinue
        if ($drizzleKit) {
            Write-Host "  Executando: npx drizzle-kit generate..." -ForegroundColor Yellow
            npx drizzle-kit generate
            if ($LASTEXITCODE -eq 0) {
                Write-Host "  OK: Migrations geradas em db/migrations/" -ForegroundColor Green
            } else {
                Write-Host "  AVISO: drizzle-kit generate falhou (pode ser necessario configurar credenciais Cloudflare)" -ForegroundColor Yellow
            }
        } else {
            Write-Host "  AVISO: npx nao encontrado. Execute manualmente: npx drizzle-kit generate" -ForegroundColor Yellow
        }
    } finally {
        Pop-Location
    }
}

# ============================================================
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  FASE 4 CONCLUIDA" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan

Write-Host "`nProximos passos:" -ForegroundColor Yellow
Write-Host "  1. npm install" -ForegroundColor White
Write-Host "  2. Configurar credenciais Cloudflare no .env" -ForegroundColor White
Write-Host "  3. npx drizzle-kit migrate (quando configurado)" -ForegroundColor White
