param(
  [int]$Port = 3000,
  [string]$AppId = 'ai.vivarium.app',
  [string]$LmStudioUrl = 'http://127.0.0.1:1234/v1',
  [switch]$StartDevServer,
  [switch]$SkipWebBuild,
  [switch]$UseEmulatorHost
)

$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

if (-not (Get-Command adb -ErrorAction SilentlyContinue)) {
  throw 'adb is not installed or not on PATH. Install Android Platform Tools first.'
}

if ($StartDevServer) {
  Write-Host '[VIVARIUM] Starting dev server in a new PowerShell window...' -ForegroundColor Cyan
  Start-Process powershell -ArgumentList "-ExecutionPolicy Bypass -File `"$root\run-dev.ps1`" -Port $Port -LmStudioUrl `"$LmStudioUrl`""
  Start-Sleep -Seconds 3
}

if (-not (Test-Path "$root\android")) {
  Write-Host '[VIVARIUM] Android project not found. Creating with Capacitor...' -ForegroundColor Yellow
  npx cap add android
}

if (-not $SkipWebBuild) {
  Write-Host '[VIVARIUM] Building web app...' -ForegroundColor Cyan
  npm run build
}

$capServerUrl = if ($UseEmulatorHost) { "http://10.0.2.2:$Port" } else { "http://localhost:$Port" }
$env:CAP_SERVER_URL = $capServerUrl
$env:LM_STUDIO_URL = $LmStudioUrl

Write-Host "[VIVARIUM] Syncing Capacitor with CAP_SERVER_URL=$capServerUrl" -ForegroundColor Cyan
npx cap sync android

adb start-server | Out-Null
$devices = adb devices | Select-Object -Skip 1 | Where-Object { $_ -match "\tdevice$" }
if (-not $devices) {
  throw 'No Android device or emulator detected. Connect a device (USB debug) or start an emulator.'
}

if (-not $UseEmulatorHost) {
  Write-Host '[VIVARIUM] Configuring adb reverse tcp:3000 -> tcp:3000 for localhost routing...' -ForegroundColor Cyan
  adb reverse "tcp:$Port" "tcp:$Port"
}

Push-Location "$root\android"
Write-Host '[VIVARIUM] Building and installing debug APK with Gradle...' -ForegroundColor Cyan
& .\gradlew.bat installDebug
Pop-Location

$launchActivity = "$AppId/$AppId.MainActivity"
Write-Host "[VIVARIUM] Launching app: $launchActivity" -ForegroundColor Cyan
adb shell am start -n $launchActivity | Out-Null

Write-Host '[VIVARIUM] Android app installed and launched.' -ForegroundColor Green
Write-Host "[VIVARIUM] App WebView server URL: $capServerUrl" -ForegroundColor Green
Write-Host "[VIVARIUM] LM Studio backend URL: $LmStudioUrl" -ForegroundColor Green
