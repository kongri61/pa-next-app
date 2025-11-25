# PowerShell script to fix Git issues and deploy

# Change to project directory
Set-Location "D:\1-2. CURSOR_지도기반사이트만들기"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Fixing Git Issues and Deploying" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Remove Git lock file if exists
Write-Host "Step 1: Checking for Git lock files..." -ForegroundColor Yellow
$lockFile = ".git\index.lock"
if (Test-Path $lockFile) {
    Write-Host "Removing Git lock file..." -ForegroundColor Yellow
    Remove-Item $lockFile -Force
    Write-Host "Lock file removed." -ForegroundColor Green
} else {
    Write-Host "No lock file found." -ForegroundColor Green
}

# Step 2: Check Git status
Write-Host ""
Write-Host "Step 2: Checking Git status..." -ForegroundColor Yellow
git status

# Step 3: Check if rebase is in progress
Write-Host ""
Write-Host "Step 3: Checking for rebase in progress..." -ForegroundColor Yellow
$rebaseDir = ".git\rebase-merge"
if (Test-Path $rebaseDir) {
    Write-Host "Rebase in progress detected." -ForegroundColor Red
    Write-Host ""
    Write-Host "Choose an option:" -ForegroundColor Cyan
    Write-Host "1. Abort rebase" -ForegroundColor White
    Write-Host "2. Continue rebase" -ForegroundColor White
    $choice = Read-Host "Enter choice (1 or 2)"
    
    if ($choice -eq "1") {
        Write-Host "Aborting rebase..." -ForegroundColor Yellow
        git rebase --abort
    } elseif ($choice -eq "2") {
        Write-Host "Continuing rebase..." -ForegroundColor Yellow
        git rebase --continue
    }
} else {
    Write-Host "No rebase in progress." -ForegroundColor Green
}

# Step 4: Check remote repository
Write-Host ""
Write-Host "Step 4: Checking remote repository..." -ForegroundColor Yellow
$remote = git remote -v
if ($remote) {
    Write-Host "Remote repository configured:" -ForegroundColor Green
    Write-Host $remote
} else {
    Write-Host "No remote repository configured." -ForegroundColor Red
    Write-Host "Please configure remote repository first:" -ForegroundColor Yellow
    Write-Host "  git remote add origin YOUR_REPO_URL" -ForegroundColor White
    exit 1
}

# Step 5: Pull latest changes
Write-Host ""
Write-Host "Step 5: Pulling latest changes..." -ForegroundColor Yellow
git pull origin main
if ($LASTEXITCODE -ne 0) {
    Write-Host "Pull failed. Continuing anyway..." -ForegroundColor Yellow
}

# Step 6: Add and commit changes
Write-Host ""
Write-Host "Step 6: Staging changes..." -ForegroundColor Yellow
git add .

Write-Host ""
Write-Host "Step 7: Committing changes..." -ForegroundColor Yellow
$commitMessage = "페이지 넘김 표시 위치 변경 및 배치 파일 개선"
git commit -m $commitMessage
if ($LASTEXITCODE -ne 0) {
    Write-Host "No changes to commit or commit failed." -ForegroundColor Yellow
}

# Step 7: Push to GitHub
Write-Host ""
Write-Host "Step 8: Pushing to GitHub..." -ForegroundColor Yellow
git push origin main
if ($LASTEXITCODE -ne 0) {
    Write-Host "Push failed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Trying to pull and merge first..." -ForegroundColor Yellow
    git pull origin main --no-rebase
    git push origin main
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Deployment completed!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press any key to continue..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")


