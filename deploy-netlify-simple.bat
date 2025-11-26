@echo off
chcp 65001 >nul
echo ========================================
echo Netlify 배포 준비
echo ========================================
echo.

echo [1/3] 프로젝트 빌드 중...
call npm run build
if %errorlevel% neq 0 (
    echo.
    echo ❌ 빌드 실패!
    pause
    exit /b 1
)

echo.
echo [2/3] 빌드 완료!
echo.
echo [3/3] 다음 단계:
echo.
echo 1. https://app.netlify.com/drop 접속
echo 2. build 폴더를 드래그 앤 드롭
echo 3. 배포 완료!
echo.
echo 또는 GitHub에 푸시하면 자동 배포됩니다:
echo    git add .
echo    git commit -m "배포"
echo    git push origin main
echo.
pause

