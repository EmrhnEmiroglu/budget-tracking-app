@echo off
chcp 65001 >nul
title Butce Takip - Baslatici
cd /d "%~dp0"

echo ===============================================
echo    BUTCE TAKIP SISTEMI
echo ===============================================
echo.

REM --- Eski sunuculari kapat (port cakismasi / Telegram 409 onlenir) ---
echo Onceki oturumlar temizleniyor...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr LISTENING ^| findstr ":5000"') do taskkill /F /PID %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -ano ^| findstr LISTENING ^| findstr ":5173"') do taskkill /F /PID %%a >nul 2>&1

REM --- Paketler kurulu degilse kur (ilk calistirmada) ---
if not exist "server\node_modules\" (
    echo Sunucu paketleri kuruluyor, lutfen bekleyin...
    pushd server & call npm install & popd
)
if not exist "client\node_modules\" (
    echo Arayuz paketleri kuruluyor, lutfen bekleyin...
    pushd client & call npm install & popd
)

REM --- Sunucu ve arayuzu ayri (kucuk) pencerelerde baslat ---
echo Sunucu baslatiliyor...
start "Butce Takip - SUNUCU" /min cmd /c "cd /d "%~dp0server" & npm start"

echo Arayuz baslatiliyor...
start "Butce Takip - ARAYUZ" /min cmd /c "cd /d "%~dp0client" & npm run dev"

REM --- Arayuz hazir olunca tarayiciyi ac ---
echo.
echo Hazirlaniyor, tarayici birazdan acilacak...
timeout /t 8 /nobreak >nul
start "" http://localhost:5173

echo.
echo ===============================================
echo  Uygulama acildi:  http://localhost:5173
echo.
echo  Iki kucuk pencere gorev cubugunda kucultuldu.
echo  KAPATMAK ICIN: DURDUR.bat dosyasina cift tiklayin
echo  (veya o iki pencereyi kapatin).
echo ===============================================
echo.
echo Bu pencereyi kapatabilirsiniz.
timeout /t 6 >nul
