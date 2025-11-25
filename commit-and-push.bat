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
echo 충돌 해결 후 커밋 및 푸시
echo ========================================
echo.

echo 1. 변경사항 스테이징...
git add .
echo.

echo 2. 충돌 해결 커밋...
git commit -m "Git 충돌 해결 및 매물번호 4자리 형식 적용 완료"
if errorlevel 1 (
    echo 경고: 커밋 실패 또는 변경사항 없음
) else (
    echo 커밋 완료
)
echo.

echo 3. GitHub에 푸시...
git push origin main
if errorlevel 1 (
    echo.
    echo 푸시 실패. 원격 변경사항을 먼저 가져와야 할 수 있습니다.
    echo fix-push.bat를 실행하세요.
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

