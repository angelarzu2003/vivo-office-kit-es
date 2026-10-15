@echo off
chcp 65001 >nul
title Restaurar original - vivo Office Kit
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo No se encontro Node.js. Instale la version LTS desde https://nodejs.org
  pause
  exit /b 1
)

node restaurar.js %*
pause
