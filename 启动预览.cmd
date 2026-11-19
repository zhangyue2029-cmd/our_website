@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is required. Install Node.js and try again.
  pause
  exit /b 1
)
echo Keep this window open. Visit http://127.0.0.1:8124/ in your browser.
node _server.cjs
pause
