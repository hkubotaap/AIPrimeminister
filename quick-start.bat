@echo off
title Quick Start - AI Prime Minister Simulator
color 0B
echo.
echo ================================================
echo    AI Prime Minister Simulator
echo         Quick Start Launcher
echo ================================================
echo.

REM Quick check for Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not found!
    echo Please install Node.js from: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo [OK] Node.js detected
echo [INFO] Starting development server...
echo [INFO] Game will open at: http://localhost:3000
echo.

REM Try to start with existing setup
if exist "package.json" (
    if exist "node_modules" (
        echo [OK] Dependencies found, starting server...
        npm run dev
    ) else (
        echo [INFO] Installing dependencies...
        npm install && npm run dev
    )
) else (
    echo [WARNING] No package.json found
    echo Please run 'setup-dev.bat' for full setup
    echo.
    pause
)
