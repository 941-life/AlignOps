# AlignOps Demo Data Seeding Script
# Usage: .\scripts\seed_demo.ps1
# Note: Update $BASE_URL after GCP deployment

param(
    [string]$BaseUrl = "http://localhost:8000",  # Change to GCP URL after deployment
    [string]$DataFile = "demo_data.json"
)

Write-Host "======================================" -ForegroundColor Magenta
Write-Host "  AlignOps Demo Data Seeding Script  " -ForegroundColor Magenta
Write-Host "======================================" -ForegroundColor Magenta
Write-Host ""
Write-Host "Target API: $BaseUrl" -ForegroundColor Cyan
Write-Host ""

# Load demo data
if (-not (Test-Path $DataFile)) {
    Write-Host "ERROR: $DataFile not found!" -ForegroundColor Red
    Write-Host "Please run this script from the project root directory." -ForegroundColor Yellow
    exit 1
}

$DATA = Get-Content -Raw -Path $DataFile | ConvertFrom-Json

# Function to make API calls with error handling
function Invoke-ApiCall {
    param($Uri, $Method, $Body)
    
    try {
        $response = Invoke-RestMethod -Uri $Uri -Method $Method -Body $Body -ContentType "application/json" -ErrorAction Stop
        return $response
    } catch {
        Write-Host "ERROR: $_" -ForegroundColor Red
        Write-Host "Response: $($_.ErrorDetails.Message)" -ForegroundColor Yellow
        return $null
    }
}

# Step 1: Upload v1
Write-Host "[1/6] Creating Dataset v1 (Nature scenes)..." -ForegroundColor Cyan
$v1_body = @{
    dataset = @{
        dataset_id = "demo_vlm_dataset"
        version = "v1"
        source_id = "nature_pipeline"
        tags = @("nature", "demo", "baseline")
    }
    raw_data = $DATA.v1
} | ConvertTo-Json -Depth 10 -Compress

$v1_result = Invoke-ApiCall -Uri "$BaseUrl/datasets/" -Method "Post" -Body $v1_body

if ($v1_result) {
    Write-Host "✓ v1 created successfully (Status: $($v1_result.status))" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to create v1" -ForegroundColor Red
    exit 1
}

# Step 2: Wait for embedding ingestion
Write-Host ""
Write-Host "[2/6] Waiting for v1 embedding ingestion (10 seconds)..." -ForegroundColor Cyan
Start-Sleep -Seconds 10

# Step 3: Validate v1 L1
Write-Host ""
Write-Host "[3/6] Validating v1 L1 rules..." -ForegroundColor Cyan
$l1_body = @{
    schema_passed = $true
    volume_actual = 10
    volume_expected = 10
    freshness_delay_sec = 30
    l1_status = "PASS"
    details = @{}
} | ConvertTo-Json -Depth 10 -Compress

$l1_result = Invoke-ApiCall -Uri "$BaseUrl/datasets/demo_vlm_dataset/v/v1/validate-l1" -Method "Patch" -Body $l1_body

if ($l1_result) {
    Write-Host "✓ v1 L1 validation: $($l1_result.status)" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to validate v1" -ForegroundColor Red
}

# Step 4: Upload v2 (with drift)
Write-Host ""
Write-Host "[4/6] Creating Dataset v2 (Urban scenes with DRIFT)..." -ForegroundColor Yellow
$v2_body = @{
    dataset = @{
        dataset_id = "demo_vlm_dataset"
        version = "v2"
        source_id = "urban_pipeline"
        tags = @("urban", "demo", "drifted")
    }
    raw_data = $DATA.v2
} | ConvertTo-Json -Depth 10 -Compress

$v2_result = Invoke-ApiCall -Uri "$BaseUrl/datasets/" -Method "Post" -Body $v2_body

if ($v2_result) {
    Write-Host "✓ v2 created successfully (Status: $($v2_result.status))" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to create v2" -ForegroundColor Red
    exit 1
}

# Step 5: Wait for v2 embedding ingestion
Write-Host ""
Write-Host "[5/6] Waiting for v2 embedding ingestion (10 seconds)..." -ForegroundColor Cyan
Start-Sleep -Seconds 10

# Step 6: Validate v2 L1
Write-Host ""
Write-Host "[6/6] Validating v2 L1 rules..." -ForegroundColor Cyan
$l1_v2_body = @{
    schema_passed = $true
    volume_actual = 10
    volume_expected = 10
    freshness_delay_sec = 45
    l1_status = "PASS"
    details = @{}
} | ConvertTo-Json -Depth 10 -Compress

$l1_v2_result = Invoke-ApiCall -Uri "$BaseUrl/datasets/demo_vlm_dataset/v/v2/validate-l1" -Method "Patch" -Body $l1_v2_body

if ($l1_v2_result) {
    Write-Host "✓ v2 L1 validation: $($l1_v2_result.status)" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to validate v2" -ForegroundColor Red
}

# Summary
Write-Host ""
Write-Host "======================================" -ForegroundColor Magenta
Write-Host "          Seeding Complete!           " -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Magenta
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "1. Visit your UI: http://localhost:3000 (or Vercel URL)" -ForegroundColor White
Write-Host "2. Navigate to 'demo_vlm_dataset' in the dashboard" -ForegroundColor White
Write-Host "3. Click on v2 version" -ForegroundColor White
Write-Host "4. Use Control Plane to trigger L2 Audit" -ForegroundColor White
Write-Host ""
Write-Host "Or trigger L2 via API:" -ForegroundColor Cyan
Write-Host "  Invoke-RestMethod -Uri '$BaseUrl/datasets/demo_vlm_dataset/v/v2/trigger-l2' -Method Post" -ForegroundColor Yellow
Write-Host ""
Write-Host "Expected result: Gemini will detect semantic drift between nature (v1) and urban (v2) scenes!" -ForegroundColor Green
Write-Host "The last 2 samples in v2 have mismatched captions that Gemini should flag." -ForegroundColor Yellow
Write-Host ""
