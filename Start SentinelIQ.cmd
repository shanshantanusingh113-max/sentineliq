@echo off
rem Double-click to start SentinelIQ locally (backend :8000, frontend :3000)
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0run_local.ps1"
timeout /t 8 >nul
start "" http://localhost:3000
