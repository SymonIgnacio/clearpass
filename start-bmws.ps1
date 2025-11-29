# BMWs Barangay Management System - PowerShell Startup Script
# Run this after starting XAMPP MySQL and Apache

Write-Host "🚀 Starting BMWs Barangay Management System..." -ForegroundColor Green
Write-Host ""

# Function to start a service in background
function Start-Service {
    param([string]$name, [scriptblock]$command)

    Write-Host "Starting $name..." -ForegroundColor Yellow
    try {
        & $command
    } catch {
        Write-Host "Error starting $name : $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Start backend server in new window
Write-Host "📡 Starting Backend API Server..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location server; npm install; node index.js" -WindowStyle Normal

# Wait a moment for backend to install dependencies
Start-Sleep -Seconds 3

# Start frontend in new window
Write-Host "💻 Starting Frontend React App..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm install; npm run dev" -WindowStyle Normal

Write-Host ""
Write-Host "🎉 BMWs Services Started!" -ForegroundColor Green
Write-Host ""
Write-Host "Access your application at:" -ForegroundColor White
Write-Host "  📱 Frontend: http://localhost:5173" -ForegroundColor Cyan
Write-Host "  🔗 API: http://localhost:3001/health" -ForegroundColor Cyan
Write-Host "  🗄️  phpMyAdmin: http://localhost/phpmyadmin" -ForegroundColor Cyan
Write-Host ""
Write-Host "Login with: captain / admin123" -ForegroundColor Yellow
Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
