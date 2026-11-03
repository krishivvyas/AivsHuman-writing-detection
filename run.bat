@echo off
rem Starts the FastAPI backend and the Vite frontend in separate windows.
rem First run also creates the Python venv, installs dependencies and creates backend\.env.
setlocal
cd /d "%~dp0"

set "BACKEND=%~dp0backend"
set "FRONTEND=%~dp0frontend"
set "VENV_PY=%BACKEND%\.venv\Scripts\python.exe"

where python >nul 2>&1 || (echo [ERROR] Python not found on PATH. Install Python 3.10+ first. & goto :fail)
where npm >nul 2>&1 || (echo [ERROR] npm not found on PATH. Install Node.js 18+ first. & goto :fail)

rem --- Backend setup -------------------------------------------------------
if not exist "%VENV_PY%" (
    echo Creating Python virtual environment in backend\.venv ...
    python -m venv "%BACKEND%\.venv" || goto :fail
    echo Installing backend dependencies ...
    "%VENV_PY%" -m pip install -r "%BACKEND%\requirements.txt" || goto :fail
)

if not exist "%BACKEND%\.env" (
    copy "%BACKEND%\.env.example" "%BACKEND%\.env" >nul
    echo.
    echo [WARNING] Created backend\.env from .env.example.
    echo           Set MODEL_PATH in backend\.env to your tuned_logistic_regression_pipeline.joblib
    echo           file. Until then the app will show a "Setup required" banner.
    echo.
)

rem --- Frontend setup ------------------------------------------------------
if not exist "%FRONTEND%\node_modules" (
    echo Installing frontend dependencies ...
    pushd "%FRONTEND%"
    call npm install || (popd & goto :fail)
    popd
)

rem --- Start both servers --------------------------------------------------
echo Starting backend on http://localhost:8000 ...
start "AI Classifier - Backend" /D "%BACKEND%" cmd /k ".venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000"

echo Starting frontend on http://localhost:5173 ...
start "AI Classifier - Frontend" /D "%FRONTEND%" cmd /k "npm run dev"

rem Give the servers a moment, then open the app.
ping -n 6 127.0.0.1 >nul
start "" http://localhost:5173

echo.
echo Both servers are running in their own windows. Close those windows to stop them.
exit /b 0

:fail
echo.
echo Setup failed. See the messages above.
pause
exit /b 1
