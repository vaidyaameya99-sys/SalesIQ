@echo off
title SalesIQ Local Dev

echo.
echo ============================================
echo   SalesIQ - Starting Local Dev Environment
echo ============================================
echo.

REM ── Check Python ─────────────────────────────
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python not found. Please install Python 3.11+
    pause & exit /b 1
)

REM ── Check Node ───────────────────────────────
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js not found. Please install Node.js 20+
    pause & exit /b 1
)

REM ── Install backend deps (first run only) ────
echo [1/3] Installing backend dependencies...
echo       (Using requirements-local.txt — skips heavy ML libs not needed for mock AI)
pip install -r backend\requirements-local.txt --quiet
if errorlevel 1 (
    echo [ERROR] Backend install failed.
    pause & exit /b 1
)
echo       Done.

REM ── Install frontend deps (first run only) ───
echo [2/3] Installing frontend dependencies...
cd frontend
call npm install --silent
if errorlevel 1 (
    echo [ERROR] Frontend install failed.
    pause & exit /b 1
)
cd ..
echo       Done.

REM ── Create local data dirs ───────────────────
if not exist "uploads" mkdir uploads
if not exist "chroma_db" mkdir chroma_db

echo.
echo [3/3] Starting servers...
echo.
echo   Backend API : http://localhost:8000
echo   Frontend    : http://localhost:5173
echo   API Docs    : http://localhost:8000/docs
echo.
echo   Using MOCK AI (no API key needed)
echo   To use real Claude AI set LLM_PROVIDER=claude and ANTHROPIC_API_KEY
echo.
echo ============================================
echo   Press Ctrl+C in each window to stop
echo ============================================
echo.

REM ── Start backend in a new window ────────────
start "SalesIQ Backend" cmd /k "set LLM_PROVIDER=mock && set UPLOAD_DIR=uploads && set CHROMA_DIR=chroma_db && set PORT=8000 && echo Backend starting on http://localhost:8000 && uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload"

REM ── Small delay so backend boots first ───────
timeout /t 3 /nobreak >nul

REM ── Start frontend in a new window ───────────
start "SalesIQ Frontend" cmd /k "cd frontend && echo Frontend starting on http://localhost:5173 && npm run dev"

REM ── Open browser ─────────────────────────────
timeout /t 4 /nobreak >nul
start http://localhost:5173

echo Both servers are running in separate windows.
echo This window can be closed.
pause
