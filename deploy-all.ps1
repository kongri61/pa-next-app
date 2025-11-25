# 배포 스크립트
$ErrorActionPreference = "Stop"

# 작업 디렉토리로 이동
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

Write-Host "========================================"
Write-Host "개별등록 문제 해결 및 배포 시작"
Write-Host "========================================"
Write-Host ""

Write-Host "1. Git 상태 확인..."
git status

Write-Host ""
Write-Host "2. 변경사항 커밋..."
git add .
git commit -m "개별등록 시 기존 매물 덮어쓰기 문제 해결 - Firebase에서 실제 매물 ID 조회"

Write-Host ""
Write-Host "3. GitHub에 푸시..."
git push origin main

Write-Host ""
Write-Host "4. Vercel 배포..."
npx vercel --prod

Write-Host ""
Write-Host "========================================"
Write-Host "모든 작업이 완료되었습니다!"
Write-Host "========================================"

