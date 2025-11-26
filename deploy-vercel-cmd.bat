@echo off
chcp 65001 >nul
echo ========================================
echo Vercel 배포 시작
echo ========================================
echo.

cd /d "%~dp0"

echo [1/5] Git 상태 확인...
git status
if %errorlevel% neq 0 (
    echo.
    echo ❌ Git 오류 발생!
    pause
    exit /b 1
)

echo.
echo [2/5] 변경사항 추가...
git add .
if %errorlevel% neq 0 (
    echo.
    echo ❌ git add 실패!
    pause
    exit /b 1
)

echo.
echo [3/5] 커밋 생성...
git commit -m "Fix: PropertyDetailModal 이미지 줌 및 모바일 반응형 개선"
if %errorlevel% neq 0 (
    echo.
    echo ⚠️ 커밋 실패 (변경사항이 없을 수 있음)
)

echo.
echo [4/5] GitHub에 푸시...
git push origin main
if %errorlevel% neq 0 (
    echo.
    echo ❌ git push 실패!
    pause
    exit /b 1
)

echo.
echo [5/5] Vercel 배포 시도...
npx vercel --prod --yes
if %errorlevel% neq 0 (
    echo.
    echo ⚠️ Vercel 배포 실패 (제한에 걸렸을 수 있음)
    echo.
    echo 💡 대안: Netlify 사용
    echo    1. https://app.netlify.com/drop 접속
    echo    2. build 폴더를 드래그 앤 드롭
    echo.
    echo 또는 GitHub Pages 사용:
    echo    npm run deploy
    echo.
) else (
    echo.
    echo ✅ 배포 완료!
)

echo.
pause

