@echo off
chcp 65001 >nul
title Traduccion al espanol - vivo Office Kit
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo No se encontro Node.js. Instale la version LTS desde https://nodejs.org y vuelva a ejecutar este archivo.
  pause
  exit /b 1
)

if not exist node_modules\acorn (
  echo Instalando dependencias...
  call npm install --omit=dev --no-audit --no-fund
  if errorlevel 1 (
    echo No se pudieron instalar las dependencias. Compruebe su conexion a internet.
    pause
    exit /b 1
  )
)

node instalar.js %*
pause
