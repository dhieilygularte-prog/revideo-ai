@echo off
title ReVideo AI - Servidor Local
color 0b
echo ===================================================
echo     INICIANDO REVIDEO AI (LOCALHOST:3000)
echo ===================================================
echo.
echo [1/2] Acessando a pasta do projeto...
cd /d "%~dp0"

echo [2/2] Iniciando o servidor Vite...
echo.
echo O site ficara disponivel em: http://localhost:3000
echo Para desligar o site, basta fechar esta janela.
echo.
npm run dev
pause
