$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Push-Location $Root
try {
  git subtree pull --prefix integrations/vibe-astock https://github.com/simonlin1212/Vibe-Astock.git main --squash
} finally {
  Pop-Location
}
