# 한글 경로 문제 해결을 위한 자동 배포 PowerShell 스크립트
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
Write-Host "자동 배포 시작" -ForegroundColor Cyan
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

# Git 사용자 정보 확인 및 설정
$userName = git config user.name 2>&1
if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($userName)) {
    Write-Host "Git 사용자 정보 설정 중..." -ForegroundColor Yellow
    git config user.name "PA Property"
    git config user.email "kongri61@naver.com"
}

Write-Host "1. Git 상태 확인..." -ForegroundColor Green
git status --short
Write-Host ""

Write-Host "2. 변경사항 스테이징..." -ForegroundColor Green
git add .
if ($LASTEXITCODE -ne 0) {
    Write-Host "[경고] git add 실패" -ForegroundColor Yellow
}
Write-Host ""

Write-Host "3. 원격 저장소 최신 변경사항 가져오기..." -ForegroundColor Green
git fetch origin main 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "[경고] git fetch 실패. 계속 진행합니다..." -ForegroundColor Yellow
} else {
    Write-Host "원격 변경사항 확인 완료" -ForegroundColor Green
}
Write-Host ""

Write-Host "4. 원격 변경사항 병합..." -ForegroundColor Green
git pull origin main --no-edit --no-rebase 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "[경고] git pull 실패. 충돌이 있을 수 있습니다." -ForegroundColor Red
    Write-Host "충돌 해결 후 다시 실행하세요." -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}
Write-Host ""

Write-Host "5. 변경사항 커밋..." -ForegroundColor Green
$hasChanges = git diff --cached --quiet 2>&1
if ($LASTEXITCODE -ne 0) {
    $commitMsg = "Auto-deploy: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
    git commit -m $commitMsg 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[경고] 커밋 실패 또는 변경사항 없음" -ForegroundColor Yellow
    } else {
        Write-Host "커밋 완료" -ForegroundColor Green
    }
} else {
    Write-Host "커밋할 변경사항 없음" -ForegroundColor Gray
}
Write-Host ""

Write-Host "6. GitHub에 푸시..." -ForegroundColor Green
git push origin main 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "[오류] 푸시 실패. 다시 시도합니다..." -ForegroundColor Yellow
    Write-Host ""
    git fetch origin main 2>&1 | Out-Null
    git pull origin main --no-edit --no-rebase 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[오류] 충돌 해결 필요. 수동으로 해결해주세요." -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
    git push origin main 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[오류] 푸시 실패. 수동으로 해결해주세요." -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
}
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "성공! GitHub에 푸시 완료" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Vercel 자동 배포가 설정되어 있으면 자동으로 배포가 시작됩니다." -ForegroundColor Cyan
Write-Host ""


