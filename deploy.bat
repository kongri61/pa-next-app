@echo off
cd /d "C:\Users\user\매물지도보기"
echo Deploying to Vercel...
call npx vercel --prod
echo Deployment completed!
pause
