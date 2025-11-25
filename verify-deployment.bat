@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ========================================
echo 배포 확인 및 검증
echo ========================================
echo.

echo 1. 로컬 코드 확인...
findstr /n "padStart(4" src\components\AddPropertyModal.tsx
if errorlevel 1 (
    echo [오류] padStart(4 코드를 찾을 수 없습니다!
) else (
    echo [확인] padStart(4 코드가 있습니다.
)
echo.

echo 2. Git 최근 커밋 확인...
git log --oneline -3
echo.

echo 3. 원격 저장소와 비교...
git fetch origin main
git log HEAD..origin/main --oneline
if errorlevel 1 (
    echo [확인] 로컬과 원격이 동기화되어 있습니다.
) else (
    echo [경고] 원격에 새로운 커밋이 있습니다.
    echo 다음 명령어로 확인: git log HEAD..origin/main --oneline
)
echo.

echo 4. 변경사항 확인...
git diff origin/main HEAD -- src/components/AddPropertyModal.tsx | findstr "padStart"
if errorlevel 1 (
    echo [경고] 변경사항이 원격에 반영되지 않았을 수 있습니다.
) else (
    echo [확인] 변경사항이 있습니다.
)
echo.

echo ========================================
echo 확인 완료
echo ========================================
echo.
echo 다음 단계:
echo 1. Vercel 대시보드에서 최근 배포 확인
echo 2. 배포가 완료되었는지 확인
echo 3. 브라우저 캐시 삭제 후 새로고침 (Ctrl+Shift+R)
echo 4. 새 매물 등록하여 4자리 형식 확인
echo.
pause



