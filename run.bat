@echo off
title 개별등록 문제 해결 및 배포
color 0A
echo.
echo ========================================
echo    개별등록 문제 해결 및 배포 도구
echo ========================================
echo.
echo 해결된 문제:
echo - 개별등록 시 기존 매물 덮어쓰기 문제
echo - Firebase에서 실제 매물 ID 조회
echo - 연속된 ID 생성 보장
echo.
echo ========================================
echo.
echo 배포 방법을 선택하세요:
echo.
echo 1. 자동 배포 (권장) - 모든 과정 자동 실행
echo 2. 수동 배포 - 단계별 실행
echo 3. 빌드만 실행
echo 4. 종료
echo.
set /p choice="선택 (1-4): "

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
    echo 빌드만 실행합니다...
    call build.bat
) else if "%choice%"=="4" (
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
