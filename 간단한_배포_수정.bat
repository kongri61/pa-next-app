@echo off
chcp 65001 >nul 2>&1
cd /d "%~dp0"

echo ========================================
echo Simple Deployment Fix
echo ========================================
echo.

REM 1. Remove index.lock if exists
if exist ".git\index.lock" (
    echo Removing index.lock file...
    del /f /q ".git\index.lock"
    echo index.lock removed.
    echo.
)

REM 2. Check for rebase and abort if needed
git rebase --abort >nul 2>&1
if %errorlevel% equ 0 (
    echo Rebase aborted.
    echo.
)

REM 3. Check Git status
echo Checking Git status...
git status
echo.

REM 4. Pull latest changes
echo Pulling latest changes from GitHub...
git pull origin main --no-rebase
if %errorlevel% neq 0 (
    echo Warning: Pull failed. Continuing anyway...
    echo.
)

REM 5. Add all changes
echo Adding all changes...
git add .
echo.

REM 6. Commit changes
echo Committing changes...
git commit -m "Auto deploy: %date% %time%"
if %errorlevel% neq 0 (
    echo No changes to commit or commit failed.
    echo.
) else (
    echo Changes committed successfully.
    echo.
)

REM 7. Push to GitHub
echo Pushing to GitHub...
git push origin main
if %errorlevel% neq 0 (
    echo.
    echo Push failed. Trying to pull and merge first...
    git pull origin main --no-rebase
    if %errorlevel% equ 0 (
        echo Merge successful. Retrying push...
        git push origin main
        if %errorlevel% neq 0 (
            echo.
            echo ========================================
            echo Push failed after merge.
            echo Please check for conflicts manually.
            echo ========================================
            pause
            exit /b 1
        )
    ) else (
        echo.
        echo ========================================
        echo Cannot merge automatically.
        echo Please resolve conflicts manually.
        echo ========================================
        pause
        exit /b 1
    )
)

echo.
echo ========================================
echo Deployment completed successfully!
echo ========================================
echo.
echo Next step: Run "npx vercel --prod --yes" to deploy to Vercel
echo Or wait for Vercel auto-deployment if configured.
echo.
pause

