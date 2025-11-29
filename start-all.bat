@echo off
echo Starting Barangay Management System...
echo.

echo Starting AI Service...
start "AI Service" cmd /k "cd ai_service && python smart_suggestions.py"

timeout /t 3 /nobreak >nul

echo Starting Backend Server...
start "Backend Server" cmd /k "cd server && npm start"

timeout /t 3 /nobreak >nul

echo Starting Frontend Client...
start "Frontend Client" cmd /k "cd client && npm run dev"

echo.
echo All services are starting...
echo - AI Service: http://localhost:5000
echo - Backend API: http://localhost:3001
echo - Frontend: http://localhost:5173
echo.
echo Press any key to exit...
pause >nul