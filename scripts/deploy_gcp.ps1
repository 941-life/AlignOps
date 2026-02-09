# GCP Cloud Run Deployment Script for AlignOps Backend
# Run this from the project root directory

param(
    [string]$Region = "asia-northeast3",
    [string]$ProjectId = "",
    [switch]$SetProject = $false
)

Write-Host "======================================" -ForegroundColor Magenta
Write-Host "  AlignOps Backend - GCP Deployment  " -ForegroundColor Magenta
Write-Host "======================================" -ForegroundColor Magenta
Write-Host ""

# Check if gcloud is installed
try {
    $gcloudVersion = gcloud version 2>&1 | Select-Object -First 1
    Write-Host "✓ Google Cloud SDK found: $gcloudVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Google Cloud SDK not found!" -ForegroundColor Red
    Write-Host "Please install from: https://cloud.google.com/sdk/docs/install" -ForegroundColor Yellow
    exit 1
}

# Set project if requested
if ($SetProject -and $ProjectId) {
    Write-Host "Setting GCP project to: $ProjectId" -ForegroundColor Cyan
    gcloud config set project $ProjectId
}

# Get current project
$currentProject = gcloud config get-value project 2>$null
if (-not $currentProject) {
    Write-Host "✗ No GCP project set!" -ForegroundColor Red
    Write-Host "Run: gcloud config set project YOUR_PROJECT_ID" -ForegroundColor Yellow
    exit 1
}

Write-Host "✓ Using GCP project: $currentProject" -ForegroundColor Green
Write-Host "✓ Deployment region: $Region" -ForegroundColor Green
Write-Host ""

# Ensure we're in the project root
if (-not (Test-Path "api\Dockerfile.api")) {
    Write-Host "✗ Please run this script from the project root directory!" -ForegroundColor Red
    exit 1
}

# Copy Dockerfile.api to Dockerfile for Cloud Run
Write-Host "[1/4] Preparing Dockerfile..." -ForegroundColor Cyan
Copy-Item "api\Dockerfile.api" "api\Dockerfile" -Force
Write-Host "✓ Dockerfile ready" -ForegroundColor Green
Write-Host ""

# Load environment variables
Write-Host "[2/4] Loading environment variables..." -ForegroundColor Cyan
if (Test-Path ".env") {
    $envVars = @{}
    Get-Content ".env" | ForEach-Object {
        if ($_ -match "^\s*([^#][^=]+)=(.*)$") {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            $envVars[$key] = $value
        }
    }
    
    $GEMINI_API_KEY = $envVars["GEMINI_API_KEY"]
    $QDRANT_URL = $envVars["QDRANT_URL"]
    $QDRANT_API_KEY = $envVars["QDRANT_API_KEY"]
    
    if (-not $GEMINI_API_KEY -or -not $QDRANT_URL -or -not $QDRANT_API_KEY) {
        Write-Host "✗ Missing required environment variables in .env file!" -ForegroundColor Red
        Write-Host "Required: GEMINI_API_KEY, QDRANT_URL, QDRANT_API_KEY" -ForegroundColor Yellow
        exit 1
    }
    
    Write-Host "✓ Environment variables loaded" -ForegroundColor Green
    Write-Host "  - GEMINI_API_KEY: ${GEMINI_API_KEY.Substring(0, 10)}..." -ForegroundColor Gray
    Write-Host "  - QDRANT_URL: ${QDRANT_URL.Substring(0, 30)}..." -ForegroundColor Gray
    Write-Host "  - QDRANT_API_KEY: ${QDRANT_API_KEY.Substring(0, 20)}..." -ForegroundColor Gray
} else {
    Write-Host "✗ .env file not found!" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Deploy to Cloud Run
Write-Host "[3/4] Deploying to Cloud Run..." -ForegroundColor Cyan
Write-Host "This may take 5-10 minutes for the first deployment..." -ForegroundColor Yellow
Write-Host ""

Push-Location api

try {
    gcloud run deploy alignops-api `
        --source . `
        --platform managed `
        --region $Region `
        --allow-unauthenticated `
        --set-env-vars "GEMINI_API_KEY=$GEMINI_API_KEY,QDRANT_URL=$QDRANT_URL,QDRANT_API_KEY=$QDRANT_API_KEY" `
        --memory 2Gi `
        --cpu 2 `
        --timeout 300s `
        --max-instances 10 `
        --min-instances 0
    
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
Write-Host "[4/4] Getting service URL..." -ForegroundColor Cyan
$serviceUrl = gcloud run services describe alignops-api --region $Region --format "value(status.url)" 2>$null

if ($serviceUrl) {
    Write-Host ""
    Write-Host "======================================" -ForegroundColor Magenta
    Write-Host "       Deployment Complete!           " -ForegroundColor Green
    Write-Host "======================================" -ForegroundColor Magenta
    Write-Host ""
    Write-Host "Service URL:" -ForegroundColor Cyan
    Write-Host "  $serviceUrl" -ForegroundColor White
    Write-Host ""
    Write-Host "Test the API:" -ForegroundColor Cyan
    Write-Host "  Invoke-RestMethod -Uri '$serviceUrl/datasets/'" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "  1. Update ui/.env.local with:" -ForegroundColor White
    Write-Host "     NEXT_PUBLIC_API_URL=$serviceUrl" -ForegroundColor Gray
    Write-Host "  2. Run demo data seeding:" -ForegroundColor White
    Write-Host "     .\scripts\seed_demo.ps1 -BaseUrl '$serviceUrl'" -ForegroundColor Gray
    Write-Host "  3. Deploy frontend to Vercel" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host "⚠ Could not retrieve service URL" -ForegroundColor Yellow
    Write-Host "Run: gcloud run services describe alignops-api --region $Region" -ForegroundColor Gray
}

# Cleanup
Write-Host "Cleaning up..." -ForegroundColor Gray
if (Test-Path "api\Dockerfile") {
    Remove-Item "api\Dockerfile" -Force
}

Write-Host ""
Write-Host "Deployment script completed!" -ForegroundColor Green
