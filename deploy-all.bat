@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo ========================================
echo Auto Deployment Started
echo ========================================

REM Check Git repository
if not exist ".git" (
    echo Git repository not found. Initializing...
    call git init
    echo Please configure remote repository:
    echo   git remote add origin YOUR_REPO_URL
    pause
    exit /b 1
)

REM Check remote repository
call git remote -v >nul 2>&1
if %errorlevel% neq 0 (
    echo Remote repository not configured.
    echo Please run: git remote add origin YOUR_REPO_URL
    pause
    exit /b 1
)

echo.
echo 1. Building project...
call npm run build
if %errorlevel% neq 0 (
    echo Build failed!
    pause
    exit /b %errorlevel%
)

echo.
echo 2. Checking Git status...
call git status

echo.
echo 3. Committing changes...
call git add .
call git commit -m "Auto deploy: %date% %time%"
if %errorlevel% neq 0 (
    echo No changes to commit or commit failed.
)

REM Check branch and push
for /f "tokens=*" %%i in ('git branch --show-current') do set CURRENT_BRANCH=%%i
if "%CURRENT_BRANCH%"=="" set CURRENT_BRANCH=main

echo.
echo 4. Pulling remote changes...
call git pull --rebase origin %CURRENT_BRANCH%
if %errorlevel% neq 0 (
    echo Pull failed or conflict occurred. Please resolve manually.
    pause
    exit /b %errorlevel%
)

echo.
echo 5. Pushing to GitHub...
call git push origin %CURRENT_BRANCH%
if %errorlevel% neq 0 (
    echo Push failed!
    pause
    exit /b %errorlevel%
)

echo.
echo 6. Deploying to Vercel...
call npx vercel --prod --yes
if %errorlevel% neq 0 (
    echo Deployment failed!
    pause
    exit /b %errorlevel%
)

echo.
echo ========================================
echo All tasks completed!
echo ========================================
pause
