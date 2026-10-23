# Starts SentinelIQ on this computer:
#   backend  -> http://localhost:8000
#   frontend -> http://localhost:3000
# Each server opens in its own PowerShell window. Close a window to stop that server.
$root = $PSScriptRoot
Start-Process powershell -ArgumentList '-NoExit', '-ExecutionPolicy', 'Bypass', '-File', "$root\start_backend.ps1"
Start-Process powershell -ArgumentList '-NoExit', '-ExecutionPolicy', 'Bypass', '-File', "$root\start_frontend.ps1"
Write-Host "Backend starting on http://localhost:8000 (first run installs Python packages, a few minutes)"
Write-Host "Frontend starting on http://localhost:3000"
