@echo off
title DevFlow Mobile Expo
cd /d "%~dp0mobile"
echo [DevFlow] Starting Mobile Expo App...
echo Press 'w' in this terminal to open Web preview, or 'a' for Android emulator!
npx expo start
pause
