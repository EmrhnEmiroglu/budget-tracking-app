@echo off
chcp 65001 >nul
title Butce Takip - Durduruluyor

echo Butce Takip sunuculari durduruluyor...

REM Port 5000 (sunucu) ve 5173 (arayuz) uzerindeki islemleri kapat
for /f "tokens=5" %%a in ('netstat -ano ^| findstr LISTENING ^| findstr ":5000"') do taskkill /F /PID %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -ano ^| findstr LISTENING ^| findstr ":5173"') do taskkill /F /PID %%a >nul 2>&1

echo Durduruldu. Bu pencere birazdan kapanacak.
timeout /t 3 >nul
