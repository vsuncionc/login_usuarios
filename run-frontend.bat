@echo off
setlocal
echo ========================================================
echo  Iniciando Frontend Angular Material (http://localhost:4200)
echo ========================================================
cd /d "%~dp0frontend"
call npm start
pause
