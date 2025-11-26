@echo off
REM ========================================
REM 한번에 배포 스크립트
REM 빌드 → 커밋 → 푸시 → Vercel 자동 배포
REM ========================================
chcp 65001 >nul 2>&1
setlocal enabledelayedexpansion
cd /d "%~dp0"

echo.
echo ========================================
echo 🚀 한번에 배포 시작
echo ========================================
echo.

REM Git 저장소 확인
git rev-parse --git-dir >nul 2>&1
if errorlevel 1 (
    echo [오류] Git 저장소를 찾을 수 없습니다.
    pause
    exit /b 1
)

REM 1. 빌드
echo [1/4] 프로젝트 빌드 중...
call npm run build
if errorlevel 1 (
    echo [오류] 빌드 실패!
    pause
    exit /b 1
)
echo ✅ 빌드 완료
echo.

REM 2. Git 상태 확인 및 커밋
echo [2/4] Git 변경사항 확인 및 커밋...
call git add .
call git status --short
if errorlevel 1 (
    echo [경고] Git 상태 확인 실패
)

REM 커밋 메시지 입력 (기본값 제공)
set /p COMMIT_MSG="커밋 메시지를 입력하세요 (엔터: 자동 메시지): "
if "!COMMIT_MSG!"=="" (
    for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set datetime=%%I
    set COMMIT_MSG=배포: !datetime:~0,4!-!datetime:~4,2!-!datetime:~6,2! !datetime:~8,2!:!datetime:~10,2!
)

call git commit -m "!COMMIT_MSG!"
if errorlevel 1 (
    echo [정보] 커밋할 변경사항이 없거나 이미 커밋되었습니다.
)
echo ✅ 커밋 완료
echo.

REM 3. 원격 저장소와 동기화
echo [3/4] 원격 저장소와 동기화...
call git pull origin main --no-edit
if errorlevel 1 (
    echo [경고] Pull 실패. 계속 진행합니다...
)
echo ✅ 동기화 완료
echo.

REM 4. GitHub에 푸시
echo [4/4] GitHub에 푸시 중...
call git push origin main
if errorlevel 1 (
    echo [오류] 푸시 실패!
    echo.
    echo 수동으로 푸시를 시도합니다...
    call git push origin main --force
    if errorlevel 1 (
        echo [오류] 푸시 실패. 수동으로 확인해주세요.
        pause
        exit /b 1
    )
)
echo ✅ 푸시 완료
echo.

echo ========================================
echo ✅ 모든 작업 완료!
echo ========================================
echo.
echo 📝 다음 단계:
echo    - Vercel이 GitHub와 연동되어 있으면 자동으로 배포가 시작됩니다
echo    - Vercel 대시보드에서 배포 상태를 확인하세요: https://vercel.com/dashboard
echo.
pause

