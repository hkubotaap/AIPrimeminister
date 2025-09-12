@echo off
title AI-Driven Prime Minister Simulator - Setup

echo ========================================
echo    AI-Driven Prime Minister Simulator
echo           Initial Setup
echo ========================================
echo.

REM Check Node.js version
echo Checking Node.js version...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed.
    echo.
    echo Please install Node.js:
    echo 1. Visit https://nodejs.org/
    echo 2. Download LTS version
    echo 3. Run the installer
    echo 4. Restart your computer
    echo 5. Run this script again
    echo.
    pause
    exit /b 1
)

echo Node.js version:
node --version

REM Check npm version
echo npm version:
npm --version

echo.
echo Checking Git installation...
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo WARNING: Git is not installed.
    echo Git is recommended for version control.
) else (
    git --version
)

echo.
echo ========================================
echo   Installing dependencies...
echo ========================================
echo.

npm install

if %errorlevel% neq 0 (
    echo.
    echo ERROR: Failed to install dependencies.
    echo.
    echo Solutions:
    echo 1. Check your internet connection
    echo 2. Clear npm cache: npm cache clean --force
    echo 3. Run this script again
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo   Setup completed successfully!
echo ========================================
echo.
echo Available commands:
echo.
echo - start.bat       : Start development server
echo - build.bat       : Create production build
echo - npm run dev     : Start development server (command line)
echo - npm run build   : Create production build (command line)
echo - npm run preview : Preview built app (command line)
echo.
echo To start development, double-click start.bat
echo.

pause
