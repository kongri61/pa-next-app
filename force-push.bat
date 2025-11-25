@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ========================================
echo 강제 푸시 (주의!)
echo ========================================
echo.
echo 경고: 이 작업은 원격 저장소의 변경사항을 덮어씁니다!
echo.
set /p CONFIRM="정말로 강제 푸시하시겠습니까? (Y/N): "
if /i not "%CONFIRM%"=="Y" (
    echo 취소되었습니다.
    pause
    exit /b 0
)

echo.
echo 1. 로컬 변경사항 커밋...
git add .
git commit -m "로컬 변경사항 강제 푸시 - %date% %time%"
echo.

echo 2. 강제 푸시 실행...
git push origin main --force
if errorlevel 1 (
    echo.
    echo 강제 푸시 실패
    pause
    exit /b 1
)

echo.
echo ========================================
echo 강제 푸시 완료!
echo ========================================
echo.
echo Vercel 자동 배포가 설정되어 있으면 자동으로 배포가 시작됩니다.
pause

