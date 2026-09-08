@echo off
title DevFlow Docker Services
cd /d "%~dp0"
echo [DevFlow] Starting Docker services (Postgres :5433, Redis :6379, MinIO :9000/9001)...
docker compose up -d
echo [DevFlow] Active containers:
docker ps
pause
