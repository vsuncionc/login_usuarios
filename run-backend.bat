@echo off
setlocal
echo ========================================================
echo  Iniciando Backend Spring Boot (Base de Datos H2)
echo ========================================================
set "JAVA_HOME=C:\Program Files\Amazon Corretto\jdk17.0.11_9"
set "PATH=%JAVA_HOME%\bin;D:\maven\bin;%PATH%"

cd /d "%~dp0backend"
call mvn spring-boot:run
pause
