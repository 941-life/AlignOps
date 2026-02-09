# Vercel Deployment Script for AlignOps Frontend
# Run this from the project root directory

param(
    [string]$ApiUrl = "",
    [switch]$Production = $false
)

Write-Host "======================================" -ForegroundColor Magenta
Write-Host "  AlignOps Frontend - Vercel Deploy  " -ForegroundColor Magenta
Write-Host "======================================" -ForegroundColor Magenta
Write-Host ""

# Check if vercel CLI is installed
try {
    $vercelVersion = vercel --version 2>&1
    Write-Host "✓ Vercel CLI found: v$vercelVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Vercel CLI not found!" -ForegroundColor Red
    Write-Host "Installing Vercel CLI globally..." -ForegroundColor Yellow
    npm install -g vercel
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "✗ Failed to install Vercel CLI" -ForegroundColor Red
        exit 1
    }
    Write-Host "✓ Vercel CLI installed" -ForegroundColor Green
}
Write-Host ""

# Check API URL
if (-not $ApiUrl) {
    Write-Host "⚠ No API URL provided" -ForegroundColor Yellow
    Write-Host "Using default: http://localhost:8000" -ForegroundColor Gray
    Write-Host ""
    Write-Host "To set your GCP API URL, run:" -ForegroundColor Cyan
    Write-Host "  .\scripts\deploy_vercel.ps1 -ApiUrl 'https://your-api.a.run.app' -Production" -ForegroundColor Yellow
    Write-Host ""
    $ApiUrl = "http://localhost:8000"
} else {
    Write-Host "✓ API URL: $ApiUrl" -ForegroundColor Green
}
Write-Host ""

# Update .env.local
Write-Host "[1/3] Updating environment variables..." -ForegroundColor Cyan
$envContent = @"
# API Backend URL
NEXT_PUBLIC_API_URL=$ApiUrl

# Mock 모드 설정 (개발 시 false로 설정하면 실제 API 사용)
NEXT_PUBLIC_USE_MOCKS=false
"@

Set-Content -Path "ui\.env.local" -Value $envContent -Encoding UTF8
Write-Host "✓ ui/.env.local updated" -ForegroundColor Green
Write-Host ""

# Deploy to Vercel
Write-Host "[2/3] Deploying to Vercel..." -ForegroundColor Cyan

Push-Location ui

try {
    if ($Production) {
        Write-Host "Deploying to PRODUCTION..." -ForegroundColor Yellow
        vercel --prod
    } else {
        Write-Host "Deploying to PREVIEW..." -ForegroundColor Yellow
        vercel
    }
    
    if ($LASTEXITCODE -ne 0) {
        throw "Deployment failed"
    }
    
    Write-Host ""
    Write-Host "✓ Deployment successful!" -ForegroundColor Green
} catch {
    Write-Host ""
    Write-Host "✗ Deployment failed!" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Yellow
    Pop-Location
    exit 1
} finally {
    Pop-Location
}

Write-Host ""
Write-Host "[3/3] Post-deployment checklist..." -ForegroundColor Cyan
Write-Host ""
Write-Host "Important: Add environment variables in Vercel Dashboard!" -ForegroundColor Yellow
Write-Host "  1. Go to: https://vercel.com/dashboard" -ForegroundColor White
Write-Host "  2. Select your project: alignops-ui" -ForegroundColor White
Write-Host "  3. Settings → Environment Variables" -ForegroundColor White
Write-Host "  4. Add these variables:" -ForegroundColor White
Write-Host ""
Write-Host "     NEXT_PUBLIC_API_URL" -ForegroundColor Cyan
Write-Host "     Value: $ApiUrl" -ForegroundColor Gray
Write-Host ""
Write-Host "     NEXT_PUBLIC_USE_MOCKS" -ForegroundColor Cyan
Write-Host "     Value: false" -ForegroundColor Gray
Write-Host ""
Write-Host "  5. Redeploy from the Deployments tab" -ForegroundColor White
Write-Host ""

Write-Host "======================================" -ForegroundColor Magenta
Write-Host "       Deployment Complete!           " -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Magenta
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Test your deployed frontend" -ForegroundColor White
Write-Host "  2. Seed demo data:" -ForegroundColor White
Write-Host "     .\scripts\seed_demo.ps1 -BaseUrl '$ApiUrl'" -ForegroundColor Gray
Write-Host ""
