@echo off
chcp 65001 >nul
title 개별등록 문제 해결 및 배포
color 0A
cd /d "%~dp0"

echo.
echo ========================================
echo    개별등록 문제 해결 및 배포 도구
echo ========================================
echo.

REM Git 저장소 확인
if not exist ".git" (
    echo [경고] Git 저장소가 없습니다.
    echo.
    set /p init_git="Git 저장소를 초기화하시겠습니까? (Y/N): "
    if /i "%init_git%"=="Y" (
        call git init
        echo Git 저장소가 초기화되었습니다.
        echo 원격 저장소를 설정해주세요: git remote add origin YOUR_REPO_URL
        echo.
    )
)

echo 배포 방법을 선택하세요:
echo.
echo 1. 자동 배포 (권장) - 빌드 + Git 푸시 + Vercel 배포
echo 2. 수동 배포 - 단계별 실행
echo 3. 빌드만 실행 (자동 배포 포함)
echo 4. Git 설정 확인 및 수정
echo 5. 종료
echo.
set /p choice="선택 (1-5): "

if "%choice%"=="1" (
    echo.
    echo 자동 배포를 시작합니다...
    call deploy-all.bat
) else if "%choice%"=="2" (
    echo.
    echo 수동 배포를 시작합니다...
    echo 1단계: 빌드 중...
    call build.bat
    echo.
    echo 2단계: Git 푸시 중...
    call push.bat
    echo.
    echo 3단계: Vercel 배포 중...
    call deploy.bat
) else if "%choice%"=="3" (
    echo.
    echo 빌드 및 자동 배포를 시작합니다...
    call npm run auto-deploy
) else if "%choice%"=="4" (
    echo.
    echo Git 설정 확인 중...
    call git status
    echo.
    call git remote -v
    echo.
    pause
    goto :eof
) else if "%choice%"=="5" (
    echo.
    echo 종료합니다.
    exit
) else (
    echo.
    echo 잘못된 선택입니다. 다시 실행해주세요.
    pause
    goto :eof
)

echo.
echo ========================================
echo 작업이 완료되었습니다!
echo 배포 URL: https://pa-realestate-b2chnfoip-paproperty.vercel.app
echo ========================================
pause
