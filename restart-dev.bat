@echo off
echo Restarting ClearPass Development Servers...

echo.
echo Stopping any existing processes...
taskkill /f /im node.exe 2>nul
taskkill /f /im python.exe 2>nul

echo.
echo Starting Backend Server (Port 3002)...
cd server
start "Backend Server" cmd /k "npm run dev"

echo.
echo Starting Frontend Server (Port 5174)...
cd ..\client
start "Frontend Server" cmd /k "npm run dev"

echo.
echo Starting AI Service (Port 5000)...
cd ..\ai_service
start "AI Service" cmd /k "python smart_suggestions.py"

echo.
echo All services started!
echo Frontend: http://localhost:5174
echo Backend: http://localhost:3002
echo AI Service: http://localhost:5000
echo.
pause