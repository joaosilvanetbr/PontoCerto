param(
    [switch]$WhatIf = $false,
    [switch]$SkipBackup = $false,
    [switch]$Commit = $false,
    [int[]]$Phases = @(1,2,3,4,5,6)
)

$ErrorActionPreference = "Stop"
$root = (Resolve-Path "$PSScriptRoot\..").Path
$logFile = "$root\scripts\run-$(Get-Date -Format 'yyyyMMdd-HHmmss').log"

function Write-Log {
    param($Message)
    $timestamp = Get-Date -Format "HH:mm:ss"
    "$timestamp $Message" | Out-File -FilePath $logFile -Append -Encoding UTF8
    Write-Host $Message
}

Write-Host @"

  ╔══════════════════════════════════════════╗
  ║     PontoCerto - Correcao Automateda    ║
  ║     $(Get-Date -Format 'dd/MM/yyyy HH:mm')               ║
  ╚══════════════════════════════════════════╝

"@ -ForegroundColor Cyan

Write-Log "Iniciando execucao das fases: $Phases"
Write-Log "Log: $logFile"
Write-Log "WhatIf: $WhatIf"
Write-Log ""

# Backup completo opcional
if (-not $SkipBackup -and -not $WhatIf) {
    $backupDir = "$root\scripts\backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
    New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
    Write-Log "Backup completo: $backupDir"
    # Backup apenas dos diretorios principais (sem node_modules, .git, dist)
    $dirsToBackup = @("api", "contracts", "db", "src", "functions", "public")
    foreach ($dir in $dirsToBackup) {
        if (Test-Path "$root\$dir") {
            Copy-Item -LiteralPath "$root\$dir" -Destination "$backupDir\$dir" -Recurse -Force
        }
    }
    Copy-Item -LiteralPath "$root\package.json" -Destination "$backupDir\package.json" -Force
    Copy-Item -LiteralPath "$root\vite.config.ts" -Destination "$backupDir\vite.config.ts" -Force
    Copy-Item -LiteralPath "$root\vitest.config.ts" -Destination "$backupDir\vitest.config.ts" -Force
    Write-Log "Backup concluido em: $backupDir"
    Write-Log ""
}

$executionTimes = @{}

foreach ($phase in $Phases) {
    $scriptPath = "$PSScriptRoot\phase$phase-*.ps1"
    $script = Get-ChildItem -LiteralPath $scriptPath | Select-Object -First 1

    if (-not $script) {
        Write-Log "Fase $phase: Script nao encontrado. Pulando."
        continue
    }

    Write-Log "========================================"
    Write-Log "  Executando Fase $phase: $($script.Name)"
    Write-Log "========================================"

    $startTime = Get-Date
    try {
        $params = @{ WhatIf = $WhatIf }
        if ($SkipBackup) { $params.SkipBackup = $true }
        if ($Commit -and $phase -eq 6) { $params.Commit = $true }

        & $script.FullName @params

        $elapsed = (Get-Date) - $startTime
        $executionTimes[$phase] = $elapsed
        Write-Log "Fase $phase concluida em $($elapsed.TotalSeconds)s"
    } catch {
        Write-Log "ERRO na Fase $phase: $_"
        Write-Host "  Detalhes: $_" -ForegroundColor Red
        Write-Host "  Continuando com a proxima fase..." -ForegroundColor Yellow
    }
    Write-Log ""
}

# Sumario
Write-Host @"

  ╔══════════════════════════════════════════╗
  ║        RESUMO DA EXECUCAO               ║
  ╚══════════════════════════════════════════╝
"@ -ForegroundColor Cyan

foreach ($phase in $Phases) {
    $time = if ($executionTimes[$phase]) { "$($executionTimes[$phase].TotalSeconds.ToString('0.0'))s" } else { "N/A" }
    Write-Host "  Fase $phase: $time" -ForegroundColor White
}
Write-Host ""

Write-Host "Log completo: $logFile" -ForegroundColor Gray
Write-Host ""

if ($WhatIf) {
    Write-Host "MODO WHATIF: Nenhuma alteracao foi feita." -ForegroundColor Yellow
}

Write-Host "Proximos passos apos execucao:" -ForegroundColor Cyan
Write-Host "  1. npm install" -ForegroundColor White
Write-Host "  2. npm run check    (Verificar TypeScript)" -ForegroundColor White
Write-Host "  3. npm test         (Rodar testes)" -ForegroundColor White
Write-Host "  4. npm run build    (Build de producao)" -ForegroundColor White
Write-Host ""
