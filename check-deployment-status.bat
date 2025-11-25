@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ========================================
echo 배포 상태 확인
echo ========================================
echo.

echo 1. Git 상태 확인...
git status
echo.

echo 2. 최근 커밋 확인...
git log --oneline -5
echo.

echo 3. 원격 저장소와의 차이 확인...
git fetch origin main
git log HEAD..origin/main --oneline
if errorlevel 1 (
    echo 로컬과 원격이 동기화되어 있습니다.
) else (
    echo 원격에 새로운 커밋이 있습니다.
)
echo.

echo 4. 로컬 변경사항 확인...
git diff HEAD
if errorlevel 1 (
    echo 커밋되지 않은 변경사항이 없습니다.
) else (
    echo 커밋되지 않은 변경사항이 있습니다.
)
echo.

echo ========================================
echo 확인 완료
echo ========================================
echo.
echo 다음 단계:
echo 1. Vercel 대시보드에서 배포 상태 확인
echo 2. 배포가 완료되면 사이트에서 변경사항 확인
echo.
pause



