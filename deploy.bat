@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo Deploying to Vercel...
call npx vercel --prod --yes
if %errorlevel% neq 0 (
    echo Deployment failed!
    pause
    exit /b %errorlevel%
)
echo Deployment completed!
