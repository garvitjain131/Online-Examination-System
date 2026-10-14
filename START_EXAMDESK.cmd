@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Please install Node.js 22.12 or newer, then run this launcher again.
  pause
  exit /b 1
)
if not exist "node_modules\vite\bin\vite.js" (
  call npm.cmd install
  if errorlevel 1 (
    echo Dependency installation failed. Check your network connection.
    pause
    exit /b 1
  )
)
echo Starting ExamDesk. Keep this window open while using the app.
call npm.cmd run dev -- --open
pause
