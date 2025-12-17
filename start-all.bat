@echo off
echo BMWs Barangay Management System - Startup Script
echo ===============================================
echo.

echo Starting services...
echo.

echo [1/4] Starting AI Service...
if exist "ai_service" (
    start "AI Service" cmd /k "cd ai_service && python smart_suggestions.py"
) else (
    echo AI service directory not found - skipping...
)

timeout /t 3 /nobreak >nul

echo [2/4] Starting Backend Server...
start "Backend Server" cmd /k "cd server && npm start"

timeout /t 3 /nobreak >nul

echo [3/4] Starting Frontend Client...
start "Frontend Client" cmd /k "cd client && npm install && npm run dev"

timeout /t 3 /nobreak >nul

echo [4/4] Opening Admin Panel...
start http://localhost:5174

echo.
echo ===============================================
echo All services are starting in the background...
echo.
echo Access your application at:
echo 📱 Frontend:    http://localhost:5174
echo 🔗 API:         http://localhost:3001/health
echo 🤖 AI Service:  http://localhost:5000/health
echo 🗄️  phpMyAdmin: http://localhost/phpmyadmin
echo.
echo Login credentials: captain / admin123
echo.
echo Press any key to exit this window...
pause >nul
