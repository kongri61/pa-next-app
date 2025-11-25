# 배포 스크립트
$ErrorActionPreference = "Continue"

# 작업 디렉토리로 이동
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

Write-Host "========================================"
Write-Host "배포 시작"
Write-Host "========================================"
Write-Host ""

Write-Host "1. Git 상태 확인..."
git status
if ($LASTEXITCODE -ne 0) {
    Write-Host "Git 저장소가 아닙니다. 배포를 중단합니다."
    exit 1
}

Write-Host ""
Write-Host "2. 변경사항 커밋..."
git add .
git commit -m "방/화장실 표시 개선, 주차대수 표시 수정, 사용승인일 날짜 표시 수정"
if ($LASTEXITCODE -ne 0) {
    Write-Host "커밋 실패 또는 커밋할 변경사항이 없습니다."
}

Write-Host ""
Write-Host "3. GitHub에 푸시..."
git push origin main
if ($LASTEXITCODE -ne 0) {
    Write-Host "푸시 실패"
    exit 1
}

Write-Host ""
Write-Host "4. Vercel 배포..."
npx vercel --prod
if ($LASTEXITCODE -ne 0) {
    Write-Host "Vercel 배포 실패"
    exit 1
}

Write-Host ""
Write-Host "========================================"
Write-Host "모든 작업이 완료되었습니다!"
Write-Host "========================================"

