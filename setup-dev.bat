@echo off
title Developer Setup - AI Prime Minister Simulator
color 0E
echo.
echo ========================================================
echo    AI Prime Minister Simulator - Developer Setup
echo ========================================================
echo.
echo This script will set up a complete development environment
echo for the AI Prime Minister Simulator project.
echo.
echo Requirements:
echo - Node.js 16+ (will be checked)
echo - npm (comes with Node.js)
echo - Internet connection (for dependencies)
echo.
pause

REM Check Node.js version
echo [INFO] Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH
    echo.
    echo Please install Node.js LTS version from:
    echo https://nodejs.org/
    echo.
    echo After installation, restart command prompt and run this script again.
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo [OK] Node.js version: %NODE_VERSION%

REM Check npm
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] npm is not available
    echo Please reinstall Node.js with npm included
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
echo [OK] npm version: %NPM_VERSION%
echo.

REM Create React + TypeScript + Vite project structure
echo [INFO] Setting up project structure...

REM Create package.json with all required dependencies
echo [INFO] Creating package.json...
echo { > package.json
echo   "name": "ai-prime-minister-simulator", >> package.json
echo   "private": true, >> package.json
echo   "version": "1.0.0", >> package.json
echo   "type": "module", >> package.json
echo   "description": "AI-Driven Prime Minister Simulator with Claude API", >> package.json
echo   "scripts": { >> package.json
echo     "dev": "vite", >> package.json
echo     "build": "tsc && vite build", >> package.json
echo     "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0", >> package.json
echo     "preview": "vite preview", >> package.json
echo     "start": "vite --host" >> package.json
echo   }, >> package.json
echo   "dependencies": { >> package.json
echo     "react": "^18.2.0", >> package.json
echo     "react-dom": "^18.2.0", >> package.json
echo     "lucide-react": "^0.263.1" >> package.json
echo   }, >> package.json
echo   "devDependencies": { >> package.json
echo     "@types/react": "^18.2.15", >> package.json
echo     "@types/react-dom": "^18.2.7", >> package.json
echo     "@typescript-eslint/eslint-plugin": "^6.0.0", >> package.json
echo     "@typescript-eslint/parser": "^6.0.0", >> package.json
echo     "@vitejs/plugin-react": "^4.0.3", >> package.json
echo     "autoprefixer": "^10.4.14", >> package.json
echo     "eslint": "^8.45.0", >> package.json
echo     "eslint-plugin-react-hooks": "^4.6.0", >> package.json
echo     "eslint-plugin-react-refresh": "^0.4.3", >> package.json
echo     "postcss": "^8.4.27", >> package.json
echo     "tailwindcss": "^3.3.3", >> package.json
echo     "typescript": "^5.0.2", >> package.json
echo     "vite": "^4.4.5" >> package.json
echo   } >> package.json
echo } >> package.json
echo [OK] package.json created

REM Create TypeScript config
echo [INFO] Creating TypeScript configuration...
echo { > tsconfig.json
echo   "compilerOptions": { >> tsconfig.json
echo     "target": "ES2020", >> tsconfig.json
echo     "useDefineForClassFields": true, >> tsconfig.json
echo     "lib": ["ES2020", "DOM", "DOM.Iterable"], >> tsconfig.json
echo     "module": "ESNext", >> tsconfig.json
echo     "skipLibCheck": true, >> tsconfig.json
echo     "moduleResolution": "bundler", >> tsconfig.json
echo     "allowImportingTsExtensions": true, >> tsconfig.json
echo     "resolveJsonModule": true, >> tsconfig.json
echo     "isolatedModules": true, >> tsconfig.json
echo     "noEmit": true, >> tsconfig.json
echo     "jsx": "react-jsx", >> tsconfig.json
echo     "strict": true, >> tsconfig.json
echo     "noUnusedLocals": true, >> tsconfig.json
echo     "noUnusedParameters": true, >> tsconfig.json
echo     "noFallthroughCasesInSwitch": true >> tsconfig.json
echo   }, >> tsconfig.json
echo   "include": ["src", "*.tsx"], >> tsconfig.json
echo   "references": [{ "path": "./tsconfig.node.json" }] >> tsconfig.json
echo } >> tsconfig.json
echo [OK] tsconfig.json created

REM Create Vite config
echo [INFO] Creating Vite configuration...
echo import { defineConfig } from 'vite' > vite.config.ts
echo import react from '@vitejs/plugin-react' >> vite.config.ts
echo. >> vite.config.ts
echo export default defineConfig({ >> vite.config.ts
echo   plugins: [react()], >> vite.config.ts
echo   server: { >> vite.config.ts
echo     port: 3000, >> vite.config.ts
echo     host: true, >> vite.config.ts
echo     open: true >> vite.config.ts
echo   }, >> vite.config.ts
echo   build: { >> vite.config.ts
echo     outDir: 'dist', >> vite.config.ts
echo     sourcemap: true >> vite.config.ts
echo   }, >> vite.config.ts
echo   define: { >> vite.config.ts
echo     global: 'globalThis', >> vite.config.ts
echo   } >> vite.config.ts
echo }) >> vite.config.ts
echo [OK] vite.config.ts created

REM Create Tailwind config
echo [INFO] Creating Tailwind CSS configuration...
echo /** @type {import('tailwindcss').Config} */ > tailwind.config.js
echo export default { >> tailwind.config.js
echo   content: [ >> tailwind.config.js
echo     "./index.html", >> tailwind.config.js
echo     "./src/**/*.{js,ts,jsx,tsx}", >> tailwind.config.js
echo     "./*.{js,ts,jsx,tsx}" >> tailwind.config.js
echo   ], >> tailwind.config.js
echo   theme: { >> tailwind.config.js
echo     extend: { >> tailwind.config.js
echo       animation: { >> tailwind.config.js
echo         'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite', >> tailwind.config.js
echo       } >> tailwind.config.js
echo     }, >> tailwind.config.js
echo   }, >> tailwind.config.js
echo   plugins: [], >> tailwind.config.js
echo } >> tailwind.config.js
echo [OK] tailwind.config.js created

REM Create PostCSS config
echo [INFO] Creating PostCSS configuration...
echo export default { > postcss.config.js
echo   plugins: { >> postcss.config.js
echo     tailwindcss: {}, >> postcss.config.js
echo     autoprefixer: {}, >> postcss.config.js
echo   }, >> postcss.config.js
echo } >> postcss.config.js
echo [OK] postcss.config.js created

REM Create src directory and files
if not exist "src" mkdir src

echo [INFO] Creating main CSS file...
echo @tailwind base; > src\index.css
echo @tailwind components; >> src\index.css
echo @tailwind utilities; >> src\index.css
echo. >> src\index.css
echo /* Custom styles for AI Prime Minister Simulator */ >> src\index.css
echo @layer base { >> src\index.css
echo   body { >> src\index.css
echo     @apply bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900; >> src\index.css
echo     @apply text-white min-h-screen; >> src\index.css
echo   } >> src\index.css
echo } >> src\index.css
echo. >> src\index.css
echo @layer components { >> src\index.css
echo   .card-gradient { >> src\index.css
echo     @apply bg-gradient-to-br from-gray-800/50 to-gray-900/50; >> src\index.css
echo     @apply backdrop-blur-sm border border-gray-700/50; >> src\index.css
echo   } >> src\index.css
echo. >> src\index.css
echo   .button-primary { >> src\index.css
echo     @apply bg-gradient-to-r from-cyan-500 to-blue-600; >> src\index.css
echo     @apply hover:from-cyan-600 hover:to-blue-700; >> src\index.css
echo     @apply transition-all duration-300; >> src\index.css
echo   } >> src\index.css
echo } >> src\index.css
echo [OK] src\index.css created

REM Create main.tsx
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
echo [OK] src\main.tsx created

REM Create index.html
echo [INFO] Creating index.html...
echo ^<!DOCTYPE html^> > index.html
echo ^<html lang="en"^> >> index.html
echo   ^<head^> >> index.html
echo     ^<meta charset="UTF-8" /^> >> index.html
echo     ^<link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%%3E%%3Ctext y='.9em' font-size='90'%%3E👑%%3C/text%%3E%%3C/svg%%3E" /^> >> index.html
echo     ^<meta name="viewport" content="width=device-width, initial-scale=1.0" /^> >> index.html
echo     ^<meta name="description" content="AI-Driven Prime Minister Simulator - Create Japan's future with AI Secretary KASUMI" /^> >> index.html
echo     ^<title^>AI Prime Minister Simulator - Create Japan's Future^</title^> >> index.html
echo   ^</head^> >> index.html
echo   ^<body^> >> index.html
echo     ^<div id="root"^>^</div^> >> index.html
echo     ^<script type="module" src="/src/main.tsx"^>^</script^> >> index.html
echo   ^</body^> >> index.html
echo ^</html^> >> index.html
echo [OK] index.html created

echo.
echo ========================================================
echo    Installing Dependencies...
echo ========================================================
echo.
echo This may take a few minutes depending on your internet connection.
echo Please wait...
echo.

REM Install dependencies
npm install
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Failed to install dependencies
    echo Please check your internet connection and try again
    echo.
    echo You can also try:
    echo 1. npm cache clean --force
    echo 2. npm install --legacy-peer-deps
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================================
echo    Setup Complete!
echo ========================================================
echo.
echo Your AI Prime Minister Simulator is ready to run!
echo.
echo Project Structure:
echo - PrimeMinisterSimulator.tsx  (Main game component)
echo - README.md                   (Documentation)
echo - src/
echo   - main.tsx               (App entry point)
echo   - index.css              (Styles)
echo - package.json               (Dependencies)
echo - vite.config.ts             (Build config)
echo - tailwind.config.js         (CSS config)
echo.
echo To start the development server:
echo    npm run dev
echo.
echo The game will be available at:
echo    http://localhost:3000
echo.
echo Features:
echo - Claude API Integration
echo - Dynamic Event Generation
echo - Real-time Policy Evaluation
echo - Custom Policy Input
echo - AI Secretary KASUMI
echo - Responsive UI Design
echo.
echo Would you like to start the development server now? (Y/N)
set /p choice="> "
if /i "%choice%"=="Y" (
    echo.
    echo Starting development server...
    npm run dev
) else (
    echo.
    echo You can start the server later by running:
    echo npm run dev
    echo.
    echo Or double-click 'quick-start.bat' for quick launch
)

echo.
echo Thank you for using AI Prime Minister Simulator!
pause
