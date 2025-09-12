@echo off
echo Starting Full Stack AI Prime Minister Simulator...

echo.
echo Starting Backend Server...
start "Backend Server" cmd /k "cd server && npm install && npm run dev"

timeout /t 3 /nobreak > nul

echo.
echo Starting Frontend Client...
start "Frontend Client" cmd /k "npm run dev"

echo.
echo Both servers are starting...
echo Backend: http://localhost:3001
echo Frontend: http://localhost:5175
echo.
pause