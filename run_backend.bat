@echo off
title NetPack Logistics Python Backend
echo ====================================================
echo Starting NetPack Logistics Python API (FastAPI)...
echo ====================================================
cd /d "%~dp0netpack-backend-python"

set "PYTHON_EXE=%~dp0netpack-backend-python\.venv\Scripts\python.exe"
if not exist "%PYTHON_EXE%" (
    echo [ERROR] Virtual environment not found at %PYTHON_EXE%
    pause
    exit /b 1
)

echo Database: SQLite (netpack.db)
echo API Docs: http://localhost:8000/docs
echo Server:   http://localhost:8000
echo.
"%PYTHON_EXE%" -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
pause
