@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ========================================
echo Vercel-GitHub 연동 확인
echo ========================================
echo.

echo 1. Git 저장소 확인...
git remote -v >nul 2>&1
if errorlevel 1 (
    echo [오류] Git 저장소가 아닙니다.
    pause
    exit /b 1
)

echo [확인] Git 저장소입니다.
echo.
git remote -v
echo.

echo 2. Vercel CLI 확인...
npx vercel --version >nul 2>&1
if errorlevel 1 (
    echo [경고] Vercel CLI를 찾을 수 없습니다.
) else (
    echo [확인] Vercel CLI가 설치되어 있습니다.
    for /f "tokens=*" %%i in ('npx vercel --version') do echo   버전: %%i
)
echo.

echo 3. Vercel 프로젝트 정보 확인...
echo [정보] Vercel 프로젝트 정보를 확인하려면 로그인이 필요합니다.
echo.
echo ========================================
echo 확인 방법
echo ========================================
echo.
echo [방법 1] Vercel 대시보드에서 확인:
echo   1. https://vercel.com/dashboard 접속
echo   2. 프로젝트 선택
echo   3. Settings ^> Git 탭 확인
echo   4. "Connected Git Repository" 섹션에서 GitHub 저장소 확인
echo.
echo [방법 2] GitHub 저장소에서 확인:
echo   1. GitHub 저장소 접속
echo   2. Settings ^> Webhooks 탭 확인
echo   3. Vercel webhook이 있는지 확인
echo.
echo [방법 3] Vercel CLI로 확인:
echo   npx vercel inspect
echo.
echo ========================================
echo 자동 배포 작동 확인
echo ========================================
echo.
echo GitHub에 푸시 후 Vercel 대시보드의 Deployments 탭에서
echo 새로운 배포가 자동으로 시작되는지 확인하세요.
echo.
echo 테스트 방법:
echo   1. 작은 변경사항 커밋: git commit -m "test"
echo   2. GitHub에 푸시: git push origin main
echo   3. Vercel 대시보드에서 자동 배포 확인
echo.
pause

