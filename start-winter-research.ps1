$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$Backend = Join-Path $Root "backend"
$Frontend = Join-Path $Root "frontend"
$Desktop = Join-Path $Root "desktop"
$Orchestrator = Join-Path $Root "orchestrator"
$Astock = Join-Path $Root "integrations\vibe-astock"
$AstockFrontend = Join-Path $Astock "frontend"
$AstockPython = Join-Path $Astock ".venv\Scripts\python.exe"
$BackendPython = Join-Path $Backend ".venv\Scripts\python.exe"
$env:PIP_CACHE_DIR = Join-Path $Root ".cache\pip"
$env:npm_config_cache = Join-Path $Root ".cache\npm"
$PythonCommand = Get-Command python -ErrorAction SilentlyContinue
$SystemPython = if ($PythonCommand) { $PythonCommand.Source } else { $null }

function Test-HttpOk($Url) {
  try {
    $resp = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 2
    return $resp.StatusCode -ge 200 -and $resp.StatusCode -lt 500
  } catch {
    return $false
  }
}

function Test-TcpPort([int]$Port) {
  $client = [System.Net.Sockets.TcpClient]::new()
  try {
    $task = $client.ConnectAsync("127.0.0.1", $Port)
    return $task.Wait(300) -and $client.Connected
  } catch {
    return $false
  } finally {
    $client.Dispose()
  }
}

& node (Join-Path $Root "scripts\check-node.mjs")
if ($LASTEXITCODE -ne 0) { throw "Node.js 版本不符合 Vibe-Research v1.1.0 要求。" }

if (-not (Test-Path (Join-Path $Root ".local\config.json")) -or
    -not (Test-Path (Join-Path $Root ".venv\Scripts\python.exe")) -or
    -not (Test-Path (Join-Path $Desktop "node_modules")) -or
    -not (Test-Path (Join-Path $Orchestrator "node_modules"))) {
  & (Join-Path $Root "scripts\setup-windows.ps1") -SkipDoctor
  if ($LASTEXITCODE -ne 0) { throw "Vibe-Research v1.1.0 初始化失败。" }
}

if (-not (Test-Path $BackendPython)) {
  Push-Location $Backend
  if ($SystemPython -and (Test-Path $SystemPython)) {
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
  $env:VIBE_LLM_CLI = "codex"
  $env:VIBE_ALLOW_UNSAFE_CLI = "codex"
  Start-Process -FilePath $AstockPython `
    -ArgumentList @("server.py") `
    -WorkingDirectory $Astock `
    -WindowStyle Hidden
}

if (-not (Test-TcpPort 8765)) {
  Start-Process -FilePath "node" `
    -ArgumentList @("orchestrator\src\api.ts", "--port", "8765", "--host", "127.0.0.1") `
    -WorkingDirectory $Root `
    -WindowStyle Hidden
}

if (-not (Test-TcpPort 5930)) {
  Start-Process -FilePath "npm.cmd" `
    -ArgumentList @("run", "dev", "--prefix", "desktop") `
    -WorkingDirectory $Root `
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
      (Test-HttpOk "http://127.0.0.1:5899/winter") -and `
      (Test-HttpOk "http://127.0.0.1:5930/api/health") -and `
      (Test-HttpOk "http://127.0.0.1:5930/winter")) {
    break
  }
  Start-Sleep -Seconds 1
}

Start-Process "http://127.0.0.1:5930/winter"
