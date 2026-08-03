@echo off
setlocal
title LinuxCmdQuiz - Local Test Server
cd /d "%~dp0"

echo ============================================
echo   LinuxCmdQuiz - one-click local test
echo   This app is a pure frontend single file,
echo   no backend required.
echo   Browser will open automatically.
echo   (Phone on same WiFi can open PC's IP too)
echo ============================================
echo.

set "PORT=8000"

start "" "http://localhost:%PORT%/"

where py >nul 2>nul
if %errorlevel%==0 (
  echo [server] Starting Python http.server on port %PORT%...
  py -m http.server %PORT%
  goto done
)

where python >nul 2>nul
if %errorlevel%==0 (
  echo [server] Starting Python http.server on port %PORT%...
  python -m http.server %PORT%
  goto done
)

where npx >nul 2>nul
if %errorlevel%==0 (
  echo [server] Starting with Node.js npx serve (port %PORT%)...
  npx -y serve -l %PORT% .
  goto done
)

echo [error] Python or Node.js not found.
echo         Please install Python, or open index.html directly.
pause
exit /b 1

:done
echo.
echo Server stopped. Press any key to close.
pause
