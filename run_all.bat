@echo off
title NetPack Logistics Master Launcher
echo ====================================================
echo Starting NetPack Logistics Services...
echo ====================================================
echo.
echo [1/2] Launching Python Backend in a new window...
start "NetPack Backend (Python)" cmd /k ""%~dp0run_backend.bat""

echo [2/2] Launching React Frontend in a new window...
start "NetPack Frontend (React)" cmd /k ""%~dp0run_frontend.bat""

echo.
echo Both services are running in separate command windows.
echo - Backend:  http://localhost:8000/docs
echo - Frontend: http://localhost:5173
echo.
pause
