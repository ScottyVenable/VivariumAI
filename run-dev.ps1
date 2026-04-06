param(
  [int]$Port = 3000,
  [string]$BindHost = '192.168.4.47',
  [string]$LmStudioUrl = 'http://192.168.79.1:1234/v1'
)

$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

$env:PORT = "$Port"
$env:HOSTNAME = $BindHost
$env:LM_STUDIO_URL = $LmStudioUrl

Write-Host "[VIVARIUM] Starting Next.js dev server..." -ForegroundColor Cyan
Write-Host "[VIVARIUM] URL: http://localhost:$Port" -ForegroundColor Cyan
Write-Host "[VIVARIUM] LM Studio URL: $LmStudioUrl" -ForegroundColor Cyan

Write-Host "[VIVARIUM] Applying Prisma schema (db push)..." -ForegroundColor Cyan
npx prisma db push --skip-generate

if ($LASTEXITCODE -ne 0) {
  Write-Host "[VIVARIUM] Prisma db push failed. Aborting dev startup." -ForegroundColor Red
  exit $LASTEXITCODE
}

npm run dev -- --hostname $BindHost --port $Port
