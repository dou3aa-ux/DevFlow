@echo off
title DevFlow Web Frontend
cd /d "%~dp0frontend"
echo [DevFlow] Starting React + Vite Frontend on http://localhost:5173...
npm run dev
pause
