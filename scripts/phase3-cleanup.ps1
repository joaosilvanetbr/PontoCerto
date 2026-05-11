param(
    [switch]$WhatIf = $false,
    [switch]$Force = $false
)

$ErrorActionPreference = "Stop"
$root = (Resolve-Path "$PSScriptRoot\..").Path

function Remove-FileSafely {
    param($Path)
    if ($WhatIf) {
        Write-Host "  [WhatIf] Remover $Path" -ForegroundColor Yellow
        return
    }
    if (Test-Path $Path) {
        Remove-Item -LiteralPath $Path -Force
        Write-Host "  Removido: $Path" -ForegroundColor Red
    } else {
        Write-Host "  Ignorado (nao existe): $Path" -ForegroundColor Gray
    }
}

function Remove-DirSafely {
    param($Path)
    if ($WhatIf) {
        Write-Host "  [WhatIf] Remover diretorio $Path" -ForegroundColor Yellow
        return
    }
    if (Test-Path $Path) {
        Remove-Item -LiteralPath $Path -Recurse -Force
        Write-Host "  Removido: $Path" -ForegroundColor Red
    } else {
        Write-Host "  Ignorado (nao existe): $Path" -ForegroundColor Gray
    }
}

# ============================================================
# FASE 3: REMOCAO DE CODIGO MORTO
# ============================================================
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  FASE 3 - REMOCAO DE CODIGO MORTO" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# --- 3.1: Legado MySQL ---
Write-Host "`n[3.1] Removendo codigo MySQL legado..." -ForegroundColor Cyan
Remove-FileSafely -Path "$root\api\queries\connection.ts"
Remove-FileSafely -Path "$root\db\seed.ts"
Remove-FileSafely -Path "$root\api\lib\env.ts"

# --- 3.2: SQL avulsos ---
Write-Host "`n[3.2] Removendo SQLs desorganizados..." -ForegroundColor Cyan
$sqlFilesToRemove = @(
    "$root\db\d1-part1.sql",
    "$root\db\d1-part2.sql",
    "$root\db\d1-part3.sql",
    "$root\db\d1-part4.sql",
    "$root\db\d1-part5.sql",
    "$root\db\d1-part6.sql",
    "$root\db\full-setup.sql",
    "$root\db\prod-schema.sql",
    "$root\db\prod-seed.sql",
    "$root\db\export.sql",
    "$root\db\migration-login.sql",
    "$root\db\d1-console.sql"
)
foreach ($f in $sqlFilesToRemove) {
    Remove-FileSafely -Path $f
}

# Manter apenas: schema.sql, seed.sql, rate-limits.sql, o diretorio migrations/
Write-Host "  Mantidos: db/schema.sql, db/seed.sql, db/migrations/" -ForegroundColor Green

# --- 3.3: Componentes shadcn/ui nao utilizados ---
Write-Host "`n[3.3] Removendo componentes shadcn/ui nao utilizados..." -ForegroundColor Cyan

# Lista de componentes que podem ser removidos com seguranca
# (nunca importados por screens ou custom components, apenas internamente entre si)
$unusedComponents = @(
    "accordion", "alert-dialog", "aspect-ratio", "badge", "breadcrumb",
    "button-group", "card", "carousel", "chart", "checkbox", "collapsible",
    "command", "context-menu", "dialog", "drawer", "dropdown-menu",
    "empty", "field", "form", "hover-card", "input-group", "input-otp",
    "item", "kbd", "label", "menubar", "navigation-menu", "pagination",
    "popover", "progress", "radio-group", "resizable", "scroll-area",
    "select", "separator", "sheet", "sidebar", "skeleton", "slider",
    "sonner", "spinner", "switch", "table", "tabs", "textarea",
    "toggle", "toggle-group", "tooltip"
)

$removedCount = 0
foreach ($comp in $unusedComponents) {
    $path = "$root\src\components\ui\$comp.tsx"
    if (Test-Path $path) {
        if (-not $WhatIf) {
            Remove-Item -LiteralPath $path -Force
        }
        Write-Host "  Removido: ui/$comp.tsx" -ForegroundColor Red
        $removedCount++
    }
}
Write-Host "  Total: $removedCount componentes removidos" -ForegroundColor Yellow
Write-Host "  Mantidos: ui/avatar.tsx, ui/button.tsx, ui/calendar.tsx, ui/input.tsx, ui/alert.tsx" -ForegroundColor Green

# --- 3.4: Remover dependencias @radix-ui e outras nao usadas ---
Write-Host "`n[3.4] Removendo dependencias nao utilizadas do package.json..." -ForegroundColor Cyan

$pkgPath = "$root\package.json"
$pkg = Get-Content -LiteralPath $pkgPath -Raw | ConvertFrom-Json

$unusedDeps = @(
    "@radix-ui/react-accordion",
    "@radix-ui/react-alert-dialog",
    "@radix-ui/react-aspect-ratio",
    "@radix-ui/react-avatar",
    "@radix-ui/react-checkbox",
    "@radix-ui/react-collapsible",
    "@radix-ui/react-context-menu",
    "@radix-ui/react-dialog",
    "@radix-ui/react-dropdown-menu",
    "@radix-ui/react-hover-card",
    "@radix-ui/react-label",
    "@radix-ui/react-menubar",
    "@radix-ui/react-navigation-menu",
    "@radix-ui/react-popover",
    "@radix-ui/react-progress",
    "@radix-ui/react-radio-group",
    "@radix-ui/react-scroll-area",
    "@radix-ui/react-select",
    "@radix-ui/react-separator",
    "@radix-ui/react-slider",
    "@radix-ui/react-switch",
    "@radix-ui/react-tabs",
    "@radix-ui/react-toggle",
    "@radix-ui/react-toggle-group",
    "@radix-ui/react-tooltip",
    "embla-carousel-react",
    "cmdk",
    "input-otp",
    "sonner",
    "vaul",
    "react-resizable-panels",
    "react-day-picker",
    "recharts",
    "next-themes"
)

$removedDeps = @()
foreach ($dep in $unusedDeps) {
    if ($pkg.dependencies.$dep) {
        $pkg.dependencies.PSObject.Properties.Remove($dep)
        $removedDeps += $dep
        Write-Host "  Removido: $dep" -ForegroundColor Red
    }
}

# Tambem remover kimi-plugin-inspect-react das devDependencies
if ($pkg.devDependencies.'kimi-plugin-inspect-react') {
    $pkg.devDependencies.PSObject.Properties.Remove('kimi-plugin-inspect-react')
    Write-Host "  Removido devDep: kimi-plugin-inspect-react" -ForegroundColor Red
}

# Remover dotenv (mover para devDependencies)
if ($pkg.dependencies.dotenv) {
    $pkg.dependencies.PSObject.Properties.Remove('dotenv')
    # Add to devDependencies if needed
    $pkg.devDependencies | Add-Member -NotePropertyName "dotenv" -NotePropertyValue "^17.2.3" -Force
    Write-Host "  Movido: dotenv de dependencies para devDependencies" -ForegroundColor Yellow
}

if (-not $WhatIf) {
    $newPkg = $pkg | ConvertTo-Json -Depth 10
    [System.IO.File]::WriteAllText($pkgPath, $newPkg, [System.Text.UTF8]::new($false))
    Write-Host "  OK: package.json atualizado" -ForegroundColor Green
}

# --- 3.5: Remover diretorio queries vazio ---
Write-Host "`n[3.5] Removendo diretorio api/queries/ vazio..." -ForegroundColor Cyan
if (Test-Path "$root\api\queries") {
    $remaining = Get-ChildItem "$root\api\queries" -Recurse
    if ($remaining.Count -eq 0) {
        Remove-DirSafely -Path "$root\api\queries"
    }
}

# ============================================================
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  FASE 3 CONCLUIDA" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan

Write-Host "`nNPM audit recomendado:" -ForegroundColor Yellow
Write-Host "  npm install (para atualizar node_modules)" -ForegroundColor White
