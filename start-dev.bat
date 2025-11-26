@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo Installing dependencies...
call npm install
echo.
echo Starting development server...
echo 브라우저가 8초 후 자동으로 열립니다...
start "" cmd /c "npm start"
timeout /t 8 /nobreak >nul
start "" "http://localhost:3000"
echo.
echo 서버가 실행 중입니다. 브라우저가 열렸습니다!
pause

