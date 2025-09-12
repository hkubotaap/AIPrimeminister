@echo off
title AI Prime Minister Simulator - Setup and Launch
color 0A
echo.
echo ====================================================
echo    AI Prime Minister Simulator - Windows Launcher
echo ====================================================
echo.
echo Setting up the environment...
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo [OK] Node.js detected
echo.

REM Check if we're in the correct directory
if not exist "PrimeMinisterSimulator.tsx" (
    echo [ERROR] PrimeMinisterSimulator.tsx not found
    echo Please run this batch file from the project directory
    echo Current directory: %CD%
    echo.
    pause
    exit /b 1
)

echo [OK] Project files found
echo.

REM Check if package.json exists
if not exist "package.json" (
    echo [INFO] Creating package.json...
    echo { > package.json
    echo   "name": "ai-prime-minister-simulator", >> package.json
    echo   "version": "1.0.0", >> package.json
    echo   "description": "AI-Driven Prime Minister Simulator Game", >> package.json
    echo   "main": "index.js", >> package.json
    echo   "scripts": { >> package.json
    echo     "dev": "vite", >> package.json
    echo     "build": "tsc && vite build", >> package.json
    echo     "preview": "vite preview", >> package.json
    echo     "start": "vite" >> package.json
    echo   }, >> package.json
    echo   "dependencies": { >> package.json
    echo     "react": "^18.2.0", >> package.json
    echo     "react-dom": "^18.2.0", >> package.json
    echo     "lucide-react": "^0.263.1" >> package.json
    echo   }, >> package.json
    echo   "devDependencies": { >> package.json
    echo     "@types/react": "^18.2.15", >> package.json
    echo     "@types/react-dom": "^18.2.7", >> package.json
    echo     "@vitejs/plugin-react": "^4.0.3", >> package.json
    echo     "autoprefixer": "^10.4.14", >> package.json
    echo     "postcss": "^8.4.27", >> package.json
    echo     "tailwindcss": "^3.3.3", >> package.json
    echo     "typescript": "^5.0.2", >> package.json
    echo     "vite": "^4.4.5" >> package.json
    echo   } >> package.json
    echo } >> package.json
    echo [OK] package.json created
    echo.
)

REM Check if node_modules exists
if not exist "node_modules" (
    echo [INFO] Installing dependencies...
    echo This may take a few minutes...
    echo.
    npm install
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to install dependencies
        echo Please check your internet connection and try again
        echo.
        pause
        exit /b 1
    )
    echo [OK] Dependencies installed successfully
    echo.
)

REM Check if Vite config exists
if not exist "vite.config.ts" (
    echo [INFO] Creating Vite configuration...
    echo import { defineConfig } from 'vite' > vite.config.ts
    echo import react from '@vitejs/plugin-react' >> vite.config.ts
    echo. >> vite.config.ts
    echo export default defineConfig({ >> vite.config.ts
    echo   plugins: [react()], >> vite.config.ts
    echo   server: { >> vite.config.ts
    echo     port: 3000, >> vite.config.ts
    echo     open: true >> vite.config.ts
    echo   }, >> vite.config.ts
    echo   build: { >> vite.config.ts
    echo     outDir: 'dist' >> vite.config.ts
    echo   } >> vite.config.ts
    echo }) >> vite.config.ts
    echo [OK] Vite configuration created
    echo.
)

REM Check if Tailwind config exists
if not exist "tailwind.config.js" (
    echo [INFO] Creating Tailwind CSS configuration...
    echo /** @type {import('tailwindcss').Config} */ > tailwind.config.js
    echo module.exports = { >> tailwind.config.js
    echo   content: [ >> tailwind.config.js
    echo     "./index.html", >> tailwind.config.js
    echo     "./src/**/*.{js,ts,jsx,tsx}", >> tailwind.config.js
    echo     "./*.{js,ts,jsx,tsx}" >> tailwind.config.js
    echo   ], >> tailwind.config.js
    echo   theme: { >> tailwind.config.js
    echo     extend: {}, >> tailwind.config.js
    echo   }, >> tailwind.config.js
    echo   plugins: [], >> tailwind.config.js
    echo } >> tailwind.config.js
    echo [OK] Tailwind CSS configuration created
    echo.
)

REM Check if PostCSS config exists
if not exist "postcss.config.js" (
    echo [INFO] Creating PostCSS configuration...
    echo module.exports = { > postcss.config.js
    echo   plugins: { >> postcss.config.js
    echo     tailwindcss: {}, >> postcss.config.js
    echo     autoprefixer: {}, >> postcss.config.js
    echo   }, >> postcss.config.js
    echo } >> postcss.config.js
    echo [OK] PostCSS configuration created
    echo.
)

REM Create CSS file if it doesn't exist
if not exist "src" mkdir src
if not exist "src\index.css" (
    echo [INFO] Creating CSS file...
    echo @tailwind base; > src\index.css
    echo @tailwind components; >> src\index.css
    echo @tailwind utilities; >> src\index.css
    echo. >> src\index.css
    echo /* Custom styles for AI Prime Minister Simulator */ >> src\index.css
    echo body { >> src\index.css
    echo   margin: 0; >> src\index.css
    echo   font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', >> src\index.css
    echo     'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', >> src\index.css
    echo     sans-serif; >> src\index.css
    echo   -webkit-font-smoothing: antialiased; >> src\index.css
    echo   -moz-osx-font-smoothing: grayscale; >> src\index.css
    echo } >> src\index.css
    echo. >> src\index.css
    echo * { >> src\index.css
    echo   box-sizing: border-box; >> src\index.css
    echo } >> src\index.css
    echo [OK] CSS file created
    echo.
)

REM Create main.tsx if it doesn't exist
if not exist "src\main.tsx" (
    echo [INFO] Creating main.tsx...
    echo import React from 'react' > src\main.tsx
    echo import ReactDOM from 'react-dom/client' >> src\main.tsx
    echo import PrimeMinisterSimulator from '../PrimeMinisterSimulator' >> src\main.tsx
    echo import './index.css' >> src\main.tsx
    echo. >> src\main.tsx
    echo ReactDOM.createRoot(document.getElementById('root')!).render( >> src\main.tsx
    echo   ^<React.StrictMode^> >> src\main.tsx
    echo     ^<PrimeMinisterSimulator /^> >> src\main.tsx
    echo   ^</React.StrictMode^>, >> src\main.tsx
    echo ) >> src\main.tsx
    echo [OK] main.tsx created
    echo.
)

REM Create index.html if it doesn't exist
if not exist "index.html" (
    echo [INFO] Creating index.html...
    echo ^<!DOCTYPE html^> > index.html
    echo ^<html lang="en"^> >> index.html
    echo   ^<head^> >> index.html
    echo     ^<meta charset="UTF-8" /^> >> index.html
    echo     ^<link rel="icon" type="image/svg+xml" href="/crown.svg" /^> >> index.html
    echo     ^<meta name="viewport" content="width=device-width, initial-scale=1.0" /^> >> index.html
    echo     ^<title^>AI Prime Minister Simulator^</title^> >> index.html
    echo   ^</head^> >> index.html
    echo   ^<body^> >> index.html
    echo     ^<div id="root"^>^</div^> >> index.html
    echo     ^<script type="module" src="/src/main.tsx"^>^</script^> >> index.html
    echo   ^</body^> >> index.html
    echo ^</html^> >> index.html
    echo [OK] index.html created
    echo.
)

echo ====================================================
echo    Setup Complete! Starting the development server...
echo ====================================================
echo.
echo [INFO] The game will open in your default browser
echo [INFO] Server will run on http://localhost:3000
echo [INFO] Press Ctrl+C to stop the server
echo.
echo ====================================================
echo    AI Prime Minister Simulator
echo    Create Japan's Future with AI Secretary!
echo ====================================================
echo.

REM Start the development server
echo Starting development server...
npm run dev

REM If npm run dev fails, try alternative
if %errorlevel% neq 0 (
    echo.
    echo [WARNING] Development server failed to start
    echo Trying alternative method...
    npx vite
)

REM If everything fails
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Failed to start the development server
    echo Please check the error messages above
    echo.
    echo Manual start instructions:
    echo 1. Open command prompt in this directory
    echo 2. Run: npm install
    echo 3. Run: npm run dev
    echo.
    pause
)
