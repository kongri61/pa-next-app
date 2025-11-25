@echo off
REM 한글 경로 문제 해결을 위한 자동 배포 스크립트
REM UTF-8 인코딩 설정
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
echo 자동 배포 시작
echo ========================================
echo.

REM Git 사용자 정보 확인 및 설정
git config user.name >nul 2>&1
if errorlevel 1 (
    echo Git 사용자 정보 설정 중...
    git config user.name "PA Property"
    git config user.email "kongri61@naver.com"
)

echo 1. Git 상태 확인...
git status --short
echo.

echo 2. 변경사항 스테이징...
git add .
if errorlevel 1 (
    echo [경고] git add 실패
)
echo.

echo 3. 원격 저장소 최신 변경사항 가져오기...
git fetch origin main
if errorlevel 1 (
    echo [경고] git fetch 실패. 계속 진행합니다...
) else (
    echo 원격 변경사항 확인 완료
)
echo.

echo 4. 원격 변경사항 병합...
git pull origin main --no-edit --no-rebase
if errorlevel 1 (
    echo [경고] git pull 실패. 충돌이 있을 수 있습니다.
    echo 충돌 해결 후 다시 실행하세요.
    pause
    exit /b 1
)
echo.

echo 5. 변경사항 커밋...
git diff --cached --quiet >nul 2>&1
if errorlevel 1 (
    set "commit_msg=Auto-deploy: %date% %time%"
    git commit -m "!commit_msg!"
    if errorlevel 1 (
        echo [경고] 커밋 실패 또는 변경사항 없음
    ) else (
        echo 커밋 완료
    )
) else (
    echo 커밋할 변경사항 없음
)
echo.

echo 6. GitHub에 푸시...
git push origin main
if errorlevel 1 (
    echo.
    echo [오류] 푸시 실패. 다시 시도합니다...
    echo.
    git fetch origin main
    git pull origin main --no-edit --no-rebase
    if errorlevel 1 (
        echo [오류] 충돌 해결 필요. 수동으로 해결해주세요.
        pause
        exit /b 1
    )
    git push origin main
    if errorlevel 1 (
        echo [오류] 푸시 실패. 수동으로 해결해주세요.
        pause
        exit /b 1
    )
)
echo.

echo ========================================
echo 성공! GitHub에 푸시 완료
echo ========================================
echo.
echo Vercel 자동 배포가 설정되어 있으면 자동으로 배포가 시작됩니다.
echo.

endlocal

