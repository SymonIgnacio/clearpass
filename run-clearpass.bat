@echo off
setlocal enabledelayedexpansion

TITLE ClearPass Manager
CLS

echo ========================================================
echo   ClearPass System Manager (Consolidated)
echo ========================================================
echo.

:: ----------------------------------------------------------
:: 1. CLEANUP PHASE
:: ----------------------------------------------------------
echo [1/5] Cleaning up existing processes...

:: Kill Node.js processes (Server & Client)
taskkill /F /IM node.exe >nul 2>&1
if !errorlevel! equ 0 (
    echo       - Stopped active Node.js processes.
) else (
    echo       - No Node.js processes found.
)

:: Kill Python processes (AI Service)
taskkill /F /IM python.exe >nul 2>&1
if !errorlevel! equ 0 (
    echo       - Stopped active Python processes.
) else (
    echo       - No Python processes found.
)

:: Wait for ports to release
timeout /t 2 /nobreak >nul

echo.
echo [2/5] Starting AI Service (Port 5000)...
if exist "ai_service" (
    start "ClearPass AI Service" cmd /k "cd ai_service && python smart_suggestions.py"
    echo       - AI Service launched.
) else (
    echo       - ERROR: ai_service directory not found!
)

echo.
echo [3/5] Starting Backend Server (Port 3002)...
if exist "server" (
    start "ClearPass Backend" cmd /k "cd server && npm run dev"
    echo       - Backend launched.
) else (
    echo       - ERROR: server directory not found!
)

echo.
echo [4/5] Starting Frontend Client (Port 5174)...
if exist "client" (
    start "ClearPass Client" cmd /k "cd client && npm run dev"
    echo       - Frontend launched.
) else (
    echo       - ERROR: client directory not found!
)

:: ----------------------------------------------------------
:: 5. LAUNCH BROWSER
:: ----------------------------------------------------------
echo.
echo [5/5] Launching Browser...
timeout /t 3 /nobreak >nul
start http://localhost:5174

echo.
echo ========================================================
echo   SYSTEM IS RUNNING
echo ========================================================
echo   Frontend:    http://localhost:5174
echo   Backend:     http://localhost:3002
echo   AI Service:  http://localhost:5000
echo ========================================================
echo.
echo   Keep this window open to see status.
echo   Close the separate service windows to stop individual components.
echo   Run this script again to RESTART everything.
echo.
pause
