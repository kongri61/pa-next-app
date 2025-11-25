@echo off
REM 빌드 후 자동 배포 스크립트
REM 한글 경로 문제 해결을 위한 UTF-8 인코딩 설정
chcp 65001 >nul 2>&1
setlocal enabledelayedexpansion

REM 스크립트가 있는 디렉토리로 이동 (한글 경로 지원)
cd /d "%~dp0"

echo ========================================
echo 빌드 및 자동 배포 시작
echo ========================================
echo.

REM Git 저장소 확인
git rev-parse --git-dir >nul 2>&1
if errorlevel 1 (
    echo [오류] Git 저장소를 찾을 수 없습니다.
    echo 현재 디렉토리: %CD%
    pause
    exit /b 1
)

echo 1. 프로젝트 빌드 중...
call npm run build
if errorlevel 1 (
    echo [오류] 빌드 실패
    pause
    exit /b 1
)
echo 빌드 완료
echo.

echo 2. 자동 배포 실행...
call auto-deploy.bat
if errorlevel 1 (
    echo [오류] 자동 배포 실패
    pause
    exit /b 1
)

echo.
echo ========================================
echo 모든 작업 완료!
echo ========================================
echo.

endlocal


