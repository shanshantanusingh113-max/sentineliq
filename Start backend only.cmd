@echo off
rem Double-click to start only the SentinelIQ backend (http://localhost:8000)
start "SentinelIQ backend" powershell -NoExit -ExecutionPolicy Bypass -File "%~dp0start_backend.ps1"
