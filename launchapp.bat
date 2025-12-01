@echo off
REM Launch script for Llama Runner Async Proxy - Windows version
REM This script allows users to launch the application by typing "launchapp.bat"

REM Change directory to script location
cd /d "%~dp0"

REM Set environment variables
set PYTHONIOENCODING=utf-8
set CUDA_VISIBLE_DEVICES=0
set LLAMA_SET_ROWS=1

REM Check if virtual environment exists
if exist "dev-venv\Scripts\python.exe" (
    echo Starting Llama Runner Async Proxy on Windows...
    dev-venv\Scripts\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8081
) else (
    echo Python executable not found in virtual environment
    exit /b 1
)