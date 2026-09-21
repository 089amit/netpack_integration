@echo off
title NetPack Logistics React Frontend
echo ====================================================
echo Starting NetPack Logistics React Admin Dashboard...
echo ====================================================
cd /d "%~dp0react-netpack-admin-main\react-netpack-admin-main"

:: Explicitly add Node.js directory to PATH
set "PATH=C:\Program Files\nodejs;C:\Program Files (x86)\nodejs;%PATH%"

if not exist "node_modules\" (
    echo Installing frontend dependencies, please wait...
    call npm install
)

echo Starting Vite development server on http://localhost:5173...
echo.
call npm run dev
pause
