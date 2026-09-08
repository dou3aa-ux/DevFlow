@echo off
title DevFlow Orchestrator
cd /d "%~dp0"
echo ============================================================
echo         DevFlow - Full-Stack Workspace Launcher
echo ============================================================
echo [1/4] Attempting to start Docker containers (PostgreSQL, Redis, MinIO)...
docker compose up -d

echo.
echo [2/4] Starting Backend (NestJS http://localhost:3000)...
start "DevFlow Backend" cmd /k "cd /d "%~dp0backend" && npm run start:dev"

echo.
echo [3/4] Starting Web Frontend (Vite http://localhost:5173)...
start "DevFlow Web Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo.
echo [4/4] Starting Mobile (Expo)...
start "DevFlow Mobile Expo" cmd /k "cd /d "%~dp0mobile" && npx expo start"

echo.
echo ============================================================
echo Applications launched in separate windows!
echo   * Web Frontend: http://localhost:5173
echo   * Backend API:  http://localhost:3000
echo   * Mobile Expo:  Active in its terminal (press 'w' for web or 'a' for android)
echo ============================================================
timeout /t 5 /nobreak
