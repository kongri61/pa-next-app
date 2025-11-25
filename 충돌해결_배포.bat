@echo off
chcp 65001 >nul 2>&1
cd /d "%~dp0"

echo ========================================
echo Fix package.json and Deploy
echo ========================================
echo.

echo 1. Adding fixed package.json...
git add package.json

echo.
echo 2. Committing fix...
git commit -m "Fix: Resolve merge conflict in package.json"

echo.
echo 3. Pushing to GitHub...
git push origin main

echo.
echo 4. Deploying to Vercel...
npx vercel --prod --yes

if %errorlevel% neq 0 (
    echo.
    echo Deployment failed!
    echo.
    echo Note: There may be merge conflicts in other files.
    echo Check the following files for conflict markers:
    echo   - src/components/GoogleMap.tsx
    echo   - src/components/Header.tsx
    echo   - src/components/PropertyDetailModal.tsx
    echo   - src/pages/HomePage.tsx
    echo   - src/types/index.ts
    echo   - src/utils/firebaseSync.ts
    echo   - src/utils/indexedDB.ts
    pause
    exit /b %errorlevel%
)

echo.
echo ========================================
echo Deployment completed!
echo ========================================
echo.
echo Note: Some files may still have merge conflicts.
echo If the site doesn't work properly, check the files listed above.
pause

