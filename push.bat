@echo off
chcp 65001 >nul
cd /d "%~dp0"

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

echo Pushing to GitHub...
call git add .
if %errorlevel% neq 0 (
    echo Git add failed!
    pause
    exit /b %errorlevel%
)

call git commit -m "Auto deploy: %date% %time%"
if %errorlevel% neq 0 (
    echo No changes to commit or commit failed.
)

REM 브랜치 확인 및 푸시
for /f "tokens=*" %%i in ('git branch --show-current') do set CURRENT_BRANCH=%%i
if "%CURRENT_BRANCH%"=="" set CURRENT_BRANCH=main

call git push origin %CURRENT_BRANCH%
if %errorlevel% neq 0 (
    echo Push failed!
    pause
    exit /b %errorlevel%
)

echo Push completed!
