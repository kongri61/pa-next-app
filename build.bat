@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo Building project...
call npm run build
if %errorlevel% neq 0 (
    echo Build failed!
    pause
    exit /b %errorlevel%
)
echo Build completed!
