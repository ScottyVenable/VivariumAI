param(
  [int]$Port = 3000,
  [string]$BindHost = '0.0.0.0',
  [string]$LmStudioUrl = 'http://127.0.0.1:1234/v1'
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

npm run dev -- --hostname $BindHost --port $Port
