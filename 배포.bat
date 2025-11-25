@echo off
chcp 65001 >nul 2>&1
cd /d "%~dp0"

echo ========================================
echo Deploying to Vercel
echo ========================================
echo.

npx vercel --prod --yes

if %errorlevel% neq 0 (
    echo.
    echo Deployment failed!
    pause
    exit /b %errorlevel%
)

echo.
echo ========================================
echo Deployment completed!
echo ========================================
pause

