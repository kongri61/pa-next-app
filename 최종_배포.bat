@echo off
chcp 65001 >nul 2>&1
cd /d "%~dp0"

echo ========================================
echo Final Deployment
echo ========================================
echo.

echo 1. Adding all resolved conflict files...
git add src/components/Header.tsx src/components/GoogleMap.tsx src/components/PropertyDetailModal.tsx src/pages/HomePage.tsx src/types/index.ts src/utils/firebaseSync.ts src/utils/indexedDB.ts package.json

echo.
echo 2. Committing resolved conflicts...
git commit -m "Fix: Resolve all merge conflicts for build"

echo.
echo 3. Pushing to GitHub...
git push origin main

echo.
echo 4. Deploying to Vercel...
npx vercel --prod --yes

if %errorlevel% neq 0 (
    echo.
    echo Deployment failed!
    pause
    exit /b %errorlevel%
)

echo.
echo ========================================
echo Deployment completed!
echo ========================================
pause

