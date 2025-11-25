@echo off
REM Git 충돌 마커 제거 스크립트
chcp 65001 >nul 2>&1
cd /d "%~dp0"

echo ========================================
echo Git 충돌 마커 검색 및 제거
echo ========================================
echo.

echo Git 충돌 마커가 있는 파일 검색 중...
findstr /S /M /C:"<<<<<<< HEAD" src\*.ts src\*.tsx 2>nul
if errorlevel 1 (
    echo Git 충돌 마커를 찾을 수 없습니다.
) else (
    echo.
    echo 경고: Git 충돌 마커가 발견되었습니다!
    echo 수동으로 제거해야 합니다.
)

echo.
echo 완료!
pause

