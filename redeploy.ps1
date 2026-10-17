# redeploy.ps1 - Tu dong build va restart FE & BE local tren Windows

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "   BAT DAU TU DONG DEPLOY (FE & BE)      " -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# 1. Dung cac tien trinh cu neu co tren port 5078 va 8899
Write-Host "--> Dung cac tien trinh cu tren port 5078, 8899..." -ForegroundColor Yellow
$ports = @(5078, 8899)
foreach ($port in $ports) {
    $pids = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
    foreach ($pidToKill in $pids) {
        if ($pidToKill -gt 0) {
            Stop-Process -Id $pidToKill -Force -ErrorAction SilentlyContinue
        }
    }
}

# 2. Build & Publish Backend
Write-Host "--> Dang bien dich va build Backend (.NET)..." -ForegroundColor Yellow
dotnet publish "$ScriptDir\backend\TheMoods.Api\TheMoods.Api.csproj" -c Release -o "$ScriptDir\backend\publish"

# 3. Build Frontend
Write-Host "--> Dang build Frontend (Next.js)..." -ForegroundColor Yellow
Set-Location -Path $ScriptDir
npm run build

# 4. Khoi dong Backend
Write-Host "--> Khoi dong Backend tren cong 5078..." -ForegroundColor Yellow
$env:ASPNETCORE_ENVIRONMENT = "Development"
Start-Process -FilePath "dotnet" -ArgumentList "TheMoods.Api.dll --urls http://127.0.0.1:5078" -WorkingDirectory "$ScriptDir\backend\publish" -WindowStyle Hidden

# 5. Khoi dong Frontend
Write-Host "--> Khoi dong Frontend tren cong 8899..." -ForegroundColor Yellow
Start-Process -FilePath "npx.cmd" -ArgumentList "next start -p 8899" -WorkingDirectory $ScriptDir -WindowStyle Hidden

Start-Sleep -Seconds 3

Write-Host "=========================================" -ForegroundColor Green
Write-Host "        DEPLOY LOCAL THANH CONG!         " -ForegroundColor Green
Write-Host "   - Backend:  http://127.0.0.1:5078     " -ForegroundColor Green
Write-Host "   - Frontend: http://localhost:8899     " -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
