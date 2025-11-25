@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo ========================================
echo 자동 배포 시작
echo ========================================

REM Git 저장소 확인
if not exist ".git" (
    echo Git repository not found. Initializing...
    call git init
    echo Please configure remote repository:
    echo   git remote add origin YOUR_REPO_URL
    pause
    exit /b 1
)

REM 원격 저장소 확인
call git remote -v >nul 2>&1
if %errorlevel% neq 0 (
    echo Remote repository not configured.
    echo Please run: git remote add origin YOUR_REPO_URL
    pause
    exit /b 1
)

echo.
echo 1. 프로젝트 빌드 중...
call npm run build
if %errorlevel% neq 0 (
    echo Build failed!
    pause
    exit /b %errorlevel%
)

echo.
echo 2. Git 상태 확인...
call git status

echo.
echo 3. 변경사항 커밋...
call git add .
call git commit -m "Auto deploy: %date% %time%"
if %errorlevel% neq 0 (
    echo No changes to commit or commit failed.
)

REM 브랜치 확인 및 푸시
for /f "tokens=*" %%i in ('git branch --show-current') do set CURRENT_BRANCH=%%i
if "%CURRENT_BRANCH%"=="" set CURRENT_BRANCH=main

echo.
echo 4. GitHub에 푸시 중...
call git push origin %CURRENT_BRANCH%
if %errorlevel% neq 0 (
    echo Push failed!
    pause
    exit /b %errorlevel%
)

echo.
echo 5. Vercel 배포 중...
call npx vercel --prod --yes
if %errorlevel% neq 0 (
    echo Deployment failed!
    pause
    exit /b %errorlevel%
)

echo.
echo ========================================
echo 모든 작업이 완료되었습니다!
echo ========================================
pause
