# 빌드 후 자동 배포 PowerShell 스크립트
# UTF-8 인코딩 설정
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
$PSDefaultParameterValues['*:Encoding'] = 'utf8'

# 에러 처리 설정
$ErrorActionPreference = "Continue"

# 스크립트가 있는 디렉토리로 이동 (한글 경로 지원)
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location -LiteralPath $scriptDir

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "빌드 및 자동 배포 시작" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Git 저장소 확인
try {
    $gitDir = git rev-parse --git-dir 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[오류] Git 저장소를 찾을 수 없습니다." -ForegroundColor Red
        Write-Host "현재 디렉토리: $PWD" -ForegroundColor Yellow
        Read-Host "Press Enter to exit"
        exit 1
    }
} catch {
    Write-Host "[오류] Git 저장소를 찾을 수 없습니다." -ForegroundColor Red
    Write-Host "현재 디렉토리: $PWD" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "1. 프로젝트 빌드 중..." -ForegroundColor Green
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "[오류] 빌드 실패" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}
Write-Host "빌드 완료" -ForegroundColor Green
Write-Host ""

Write-Host "2. 자동 배포 실행..." -ForegroundColor Green
& "$scriptDir\auto-deploy.ps1"
if ($LASTEXITCODE -ne 0) {
    Write-Host "[오류] 자동 배포 실패" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "모든 작업 완료!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""


