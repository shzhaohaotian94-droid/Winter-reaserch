$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$Backend = Join-Path $Root "backend"
$Frontend = Join-Path $Root "frontend"
$Astock = Join-Path $Root "integrations\vibe-astock"
$AstockFrontend = Join-Path $Astock "frontend"
$AstockPython = Join-Path $Astock ".venv\Scripts\python.exe"
$BackendPython = Join-Path $Backend ".venv\Scripts\python.exe"
$env:PIP_CACHE_DIR = Join-Path $Root ".cache\pip"
$env:npm_config_cache = Join-Path $Root ".cache\npm"
$SystemPython = "C:\Users\Administrator\AppData\Local\Python\pythoncore-3.14-64\python.exe"

function Test-HttpOk($Url) {
  try {
    $resp = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 2
    return $resp.StatusCode -ge 200 -and $resp.StatusCode -lt 500
  } catch {
    return $false
  }
}

if (-not (Test-Path $BackendPython)) {
  Push-Location $Backend
  if (Test-Path $SystemPython) {
    & $SystemPython -m venv .venv
  } else {
    python -m venv .venv
  }
  & $BackendPython -m pip install -r requirements-lite.txt
  Pop-Location
}

if (-not (Test-Path (Join-Path $Frontend "node_modules"))) {
  Push-Location $Frontend
  npm.cmd install
  Pop-Location
}

if (-not (Test-Path $AstockPython)) {
  Push-Location $Astock
  if (Test-Path $SystemPython) { & $SystemPython -m venv .venv } else { python -m venv .venv }
  & $AstockPython -m pip install -r requirements.txt
  Pop-Location
}

if (-not (Test-Path (Join-Path $AstockFrontend "node_modules"))) {
  Push-Location $AstockFrontend
  npm.cmd install
  Pop-Location
}

if (-not (Test-Path (Join-Path $AstockFrontend "dist\index.html"))) {
  Push-Location $AstockFrontend
  npm.cmd run build -- --base=/
  Pop-Location
}

if (-not (Test-Path (Join-Path $Frontend "dist\index.html"))) {
  Push-Location $Frontend
  npm.cmd run build
  Pop-Location
}

if (-not (Test-HttpOk "http://127.0.0.1:8900/api/health")) {
  Start-Process -FilePath $BackendPython `
    -ArgumentList @("-m", "uvicorn", "app:app", "--host", "127.0.0.1", "--port", "8900") `
    -WorkingDirectory $Backend `
    -WindowStyle Hidden
}

if (-not (Test-HttpOk "http://127.0.0.1:8910/api/health")) {
  Start-Process -FilePath $AstockPython `
    -ArgumentList @("server.py") `
    -WorkingDirectory $Astock `
    -WindowStyle Hidden
}

$frontendReady = Test-HttpOk "http://127.0.0.1:5899/winter"
if (-not $frontendReady) {
  Start-Process -FilePath "npm.cmd" `
    -ArgumentList @("run", "preview", "--", "--host", "127.0.0.1", "--port", "5899") `
    -WorkingDirectory $Frontend `
    -WindowStyle Hidden
}

for ($i = 0; $i -lt 90; $i++) {
  if ((Test-HttpOk "http://127.0.0.1:8900/api/health") -and `
      (Test-HttpOk "http://127.0.0.1:8910/api/health") -and `
      (Test-HttpOk "http://127.0.0.1:5899/winter")) {
    break
  }
  Start-Sleep -Seconds 1
}

Start-Process "http://127.0.0.1:5899/winter"
