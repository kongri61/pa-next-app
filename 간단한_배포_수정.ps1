# PowerShell script for simple deployment fix
# UTF-8 encoding
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

# Change to script directory
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Simple Deployment Fix" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Remove index.lock if exists
if (Test-Path ".git\index.lock") {
    Write-Host "Removing index.lock file..." -ForegroundColor Yellow
    Remove-Item ".git\index.lock" -Force
    Write-Host "index.lock removed." -ForegroundColor Green
    Write-Host ""
}

# 2. Check for rebase and abort if needed
Write-Host "Checking for rebase in progress..." -ForegroundColor Yellow
$rebaseCheck = git rev-parse --git-path rebase-merge 2>$null
if ($rebaseCheck -and (Test-Path $rebaseCheck)) {
    Write-Host "Rebase in progress detected. Aborting..." -ForegroundColor Yellow
    git rebase --abort 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Rebase aborted." -ForegroundColor Green
    }
    Write-Host ""
}

# 3. Check Git status
Write-Host "Checking Git status..." -ForegroundColor Yellow
git status
Write-Host ""

# 4. Pull latest changes
Write-Host "Pulling latest changes from GitHub..." -ForegroundColor Yellow
git pull origin main --no-rebase
if ($LASTEXITCODE -ne 0) {
    Write-Host "Warning: Pull failed. Continuing anyway..." -ForegroundColor Yellow
}
Write-Host ""

# 5. Add all changes
Write-Host "Adding all changes..." -ForegroundColor Yellow
git add .
Write-Host ""

# 6. Commit changes
Write-Host "Committing changes..." -ForegroundColor Yellow
$commitMessage = "Auto deploy: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
git commit -m $commitMessage
if ($LASTEXITCODE -ne 0) {
    Write-Host "No changes to commit or commit failed." -ForegroundColor Yellow
} else {
    Write-Host "Changes committed successfully." -ForegroundColor Green
}
Write-Host ""

# 7. Push to GitHub
Write-Host "Pushing to GitHub..." -ForegroundColor Yellow
git push origin main
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "Push failed. Trying to pull and merge first..." -ForegroundColor Yellow
    git pull origin main --no-rebase
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Merge successful. Retrying push..." -ForegroundColor Green
        git push origin main
        if ($LASTEXITCODE -ne 0) {
            Write-Host ""
            Write-Host "========================================" -ForegroundColor Red
            Write-Host "Push failed after merge." -ForegroundColor Red
            Write-Host "Please check for conflicts manually." -ForegroundColor Red
            Write-Host "========================================" -ForegroundColor Red
            Read-Host "Press Enter to exit"
            exit 1
        }
    } else {
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Red
        Write-Host "Cannot merge automatically." -ForegroundColor Red
        Write-Host "Please resolve conflicts manually." -ForegroundColor Red
        Write-Host "========================================" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Deployment completed successfully!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next step: Run 'npx vercel --prod --yes' to deploy to Vercel" -ForegroundColor Cyan
Write-Host "Or wait for Vercel auto-deployment if configured." -ForegroundColor Cyan
Write-Host ""
Read-Host "Press Enter to exit"


