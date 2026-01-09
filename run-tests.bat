@echo off
echo ========================================
echo ClearPass Comprehensive Role Tests
echo ========================================
echo.

echo Checking if server is running...
curl -s http://localhost:3002/api/health >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Server is not running on port 3002
    echo Please start the server with: npm run dev
    pause
    exit /b 1
)
echo Server is running ✓

echo.
echo Navigating to tests directory...
cd tests

echo.
echo Checking if dependencies are installed...
if not exist node_modules (
    echo Installing test dependencies...
    npm install --no-audit --no-fund --prefer-offline --silent
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install dependencies
        pause
        exit /b 1
    )
    echo Dependencies installed ✓
) else (
    echo Dependencies already installed ✓
)

echo.
echo Running comprehensive role-based tests...
node run-tests.js

echo.
echo ========================================
echo Test execution completed!
echo ========================================
pause