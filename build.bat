@echo off
cd /d "%~dp0"
echo Building project...
call npm run build
echo Build completed!
pause
