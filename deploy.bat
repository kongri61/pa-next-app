@echo off
cd /d "%~dp0"
echo Deploying to Vercel...
call npx vercel --prod
echo Deployment completed!
pause
