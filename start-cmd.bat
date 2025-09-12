@echo off
title AI-Driven Prime Minister Simulator

echo ========================================
echo    AI-Driven Prime Minister Simulator
echo ========================================
echo.

REM Check Node.js version
echo Checking Node.js version...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed.
    echo Please install Node.js 18 or higher.
    echo https://nodejs.org/
    pause
    exit /b 1
)

echo Node.js version:
node --version

REM Check npm version
echo npm version:
npm --version

echo.
echo Installing dependencies...
cmd /c "npm install"

if %errorlevel% neq 0 (
    echo.
    echo ERROR: Failed to install dependencies.
    pause
    exit /b 1
)

echo.
echo ========================================
echo   Starting development server...
echo ========================================
echo.
echo If the browser doesn't open automatically,
echo please visit: http://localhost:5173
echo.
echo Press Ctrl+C to stop the server
echo.

cmd /c "npm run dev"

pause