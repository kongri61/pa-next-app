@echo off
REM 한글 경로 문제 해결을 위한 UTF-8 인코딩 설정
chcp 65001 >nul 2>&1
setlocal enabledelayedexpansion

REM 스크립트가 있는 디렉토리로 이동 (한글 경로 지원)
cd /d "%~dp0"

REM Git 저장소 확인
git rev-parse --git-dir >nul 2>&1
if errorlevel 1 (
    echo [오류] Git 저장소를 찾을 수 없습니다.
    echo 현재 디렉토리: %CD%
    pause
    exit /b 1
)
echo ========================================
echo Deployment Start
echo ========================================

echo.
echo 1. Checking Git user info...
git config user.name >nul 2>&1
if errorlevel 1 (
    echo Setting Git user info...
    git config user.name "PA Property"
    git config user.email "kongri61@naver.com"
    echo Git user info configured.
) else (
    echo Git user info already configured.
)

echo.
echo 2. Checking Git status...
git status

echo.
echo 3. Pulling remote changes...
git fetch origin main
if errorlevel 1 (
    echo.
    echo Warning: Error during git fetch. Continuing anyway...
) else (
    git pull origin main --no-edit --no-rebase
    if errorlevel 1 (
        echo.
        echo Warning: Error during git pull. Attempting to continue...
        echo You may need to resolve conflicts manually later.
    )
)

echo.
echo 4. Staging all changes...
git add .

echo.
echo 5. Committing changes...
git diff --cached --quiet >nul 2>&1
if errorlevel 1 (
    git commit -m "Auto-deploy: Update project files - %date% %time%"
    if errorlevel 1 (
        echo.
        echo Warning: Commit failed or no changes to commit.
    ) else (
        echo Changes committed successfully.
    )
) else (
    echo No changes to commit.
)

echo.
echo 6. Pushing to GitHub...
git push origin main
if errorlevel 1 (
    echo.
    echo Warning: Failed to push to GitHub.
    echo Attempting to pull and merge first...
    echo.
    echo Fetching latest changes...
    git fetch origin main
    echo.
    echo Merging remote changes...
    git pull origin main --no-edit --no-rebase
    if errorlevel 1 (
        echo.
        echo Error: Cannot resolve conflicts automatically.
        echo.
        echo ========================================
        echo 충돌 해결 방법:
        echo ========================================
        echo 1. Git 상태 확인: git status
        echo 2. 충돌 파일 확인 및 수정
        echo 3. 충돌 해결 후: git add .
        echo 4. 커밋: git commit -m "Resolve conflicts"
        echo 5. 푸시: git push origin main
        echo.
        echo 또는 강제 푸시 (주의: 원격 변경사항 덮어쓰기):
        echo git push origin main --force
        echo.
        pause
        exit /b 1
    ) else (
        echo Merge successful!
        echo.
        echo Retrying push...
        git push origin main
        if errorlevel 1 (
            echo.
            echo Error: Failed to push to GitHub after merge.
            echo.
            echo ========================================
            echo 수동 해결 방법:
            echo ========================================
            echo 1. git status 로 상태 확인
            echo 2. git pull origin main 로 최신 변경사항 가져오기
            echo 3. 충돌 해결 후 git push origin main
            echo.
            pause
            exit /b 1
        )
    )
)

echo.
echo 7. Deployment completed!
echo.
echo GitHub에 푸시가 완료되었습니다.
echo Vercel 자동 배포가 설정되어 있으면 자동으로 배포가 시작됩니다.
echo Vercel 대시보드에서 배포 상태를 확인하세요.

echo.
echo ========================================
echo All tasks completed!
echo ========================================
pause
