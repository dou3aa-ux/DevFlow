@echo off
title DevFlow Backend
cd /d "%~dp0backend"
echo [DevFlow] Starting Backend on http://localhost:3000...
npm run start:dev
pause
