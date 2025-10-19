@echo off
cd /d "C:\Users\user\매물지도보기"
echo Pushing to GitHub...
call git add .
call git commit -m "개별등록 시 기존 매물 덮어쓰기 문제 해결"
call git push origin main
echo Push completed!
pause
