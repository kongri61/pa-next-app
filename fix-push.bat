@echo off
REM 한글 경로 문제 해결을 위한 UTF-8 인코딩 설정
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
echo Git Push 문제 해결
echo ========================================
echo.

echo 1. 로컬 변경사항 확인...
git status
echo.

echo 2. 로컬 변경사항 스테이징...
git add .
echo.

echo 3. 로컬 변경사항 커밋...
git diff --cached --quiet >nul 2>&1
if errorlevel 1 (
    git commit -m "로컬 변경사항 커밋 - %date% %time%"
    if errorlevel 1 (
        echo 경고: 커밋 실패 또는 변경사항 없음
    ) else (
        echo 로컬 변경사항 커밋 완료
    )
) else (
    echo 커밋할 변경사항 없음
)
echo.

echo 4. 원격 저장소 최신 변경사항 가져오기...
git fetch origin main
if errorlevel 1 (
    echo 오류: Git fetch 실패
    pause
    exit /b 1
)

echo.
echo 5. 원격 변경사항 병합...
git pull origin main --no-edit --no-rebase
if errorlevel 1 (
    echo.
    echo ========================================
    echo 충돌이 발생했습니다!
    echo ========================================
    echo.
    echo 충돌 파일을 확인합니다...
    git status
    echo.
    echo 충돌 해결 방법:
    echo 1. 충돌 파일을 열어서 수정 (=====, <<<<<, >>>>> 표시 제거)
    echo 2. git add . 로 변경사항 스테이징
    echo 3. git commit -m "Resolve conflicts" 로 커밋
    echo 4. git push origin main 로 푸시
    echo.
    echo 또는 이 스크립트를 다시 실행하면 자동으로 처리됩니다.
    echo.
    pause
    exit /b 1
)

echo.
echo 3. GitHub에 푸시...
git push origin main
if errorlevel 1 (
    echo.
    echo 푸시 실패. 다시 시도하거나 수동으로 해결해주세요.
    pause
    exit /b 1
)

echo.
echo ========================================
echo 성공! GitHub에 푸시 완료
echo ========================================
echo.
echo Vercel 자동 배포가 설정되어 있으면 자동으로 배포가 시작됩니다.
pause

