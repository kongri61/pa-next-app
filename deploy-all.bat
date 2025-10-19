@echo off
cd /d "C:\Users\user\매물지도보기"
echo ========================================
echo 개별등록 문제 해결 및 배포 시작
echo ========================================

echo.
echo 1. Git 상태 확인...
call git status

echo.
echo 2. 변경사항 커밋...
call git add .
call git commit -m "개별등록 시 기존 매물 덮어쓰기 문제 해결 - Firebase에서 실제 매물 ID 조회"

echo.
echo 3. GitHub에 푸시...
call git push origin main

echo.
echo 4. Vercel 배포...
call npx vercel --prod

echo.
echo ========================================
echo 모든 작업이 완료되었습니다!
echo ========================================
pause
