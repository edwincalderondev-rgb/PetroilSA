@echo off
REM Doble clic para levantar un servidor local del sitio (necesario para
REM probar el selector de idioma: fetch() de los .json no funciona abriendo
REM el HTML directo con file://). Deja esta ventana abierta mientras pruebas;
REM ciérrala para apagar el servidor.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0devserver.ps1" -Port 8080 -Root "%~dp0.."
pause
