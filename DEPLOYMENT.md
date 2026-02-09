# AlignOps Deployment Guide

## Quick Start Demo

### 1. Local Development Setup

```powershell
# Start services with Docker Compose
docker-compose up --build

# In a separate terminal, seed demo data
.\scripts\seed_demo.ps1
```

The demo will create:
- **v1**: 10 nature-themed images (mountains, beaches, forests)
- **v2**: 8 urban images + 2 mismatched samples (city images with nature captions)

### 2. Expected Demo Flow

1. **Dashboard** (`http://localhost:3000`)
   - See both datasets appear in real-time (3-second polling)
   - v1 should show `PASS` status
   - v2 should show `VALIDATING` status initially

2. **Trigger L2 Audit**
   - Navigate to Control Plane
   - Select `demo_vlm_dataset` and `v2`
   - Click "Trigger L2 Audit"

3. **Watch Real-Time Updates**
   - Status will change from `VALIDATING` → `WARN` or `BLOCK`
   - Toast notifications will appear on status changes
   - Audit page will show Gemini's semantic analysis

4. **Review Results**
   - Navigate to Audit Report for v2
   - See cosine drift visualization
   - View flagged outlier samples with images
   - Read Gemini's reasoning trace

---

## GCP Cloud Run Deployment

### Prerequisites

```powershell
# Install Google Cloud SDK
# https://cloud.google.com/sdk/docs/install

# Authenticate
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
```

### Backend API Deployment

```powershell
cd api

# Build and deploy to Cloud Run
gcloud run deploy alignops-api `
  --source . `
  --platform managed `
  --region us-central1 `
  --allow-unauthenticated `
  --set-env-vars="GEMINI_API_KEY=YOUR_KEY,QDRANT_URL=YOUR_QDRANT_URL,QDRANT_API_KEY=YOUR_QDRANT_KEY" `
  --memory 2Gi `
  --cpu 2 `
  --timeout 300s `
  --max-instances 10

# Note the deployed URL (e.g., https://alignops-api-xxxx.a.run.app)
```

**Important**: The first call after deployment may be slow (~30s) as the sentence-transformers model loads. The Dockerfile pre-downloads the model during build to minimize this, but initial cold start still occurs.

### Qdrant Cloud Setup

1. Create a Qdrant Cloud account: https://cloud.qdrant.io
2. Create a new cluster
3. Copy the cluster URL and API key
4. Update `.env` file with these credentials

---

## Vercel Deployment

### Prerequisites

```powershell
# Install Vercel CLI
npm i -g vercel

# Login
vercel login
```

### Frontend Deployment

```powershell
cd ui

# Deploy to Vercel
vercel --prod

# When prompted:
# - Set up and deploy: Yes
# - Which scope: Choose your account
# - Link to existing project: No
# - Project name: alignops-ui
# - Which directory is your code located: ./
# - Override build settings: No
```

### Environment Variables (Vercel Dashboard)

After deployment, add these environment variables in Vercel dashboard:

```
NEXT_PUBLIC_API_URL=https://alignops-api-xxxx.a.run.app
NEXT_PUBLIC_USE_MOCKS=false
```

---

## Post-Deployment: Seed Demo Data

Update the `seed_demo.ps1` script with your deployed API URL:

```powershell
$BASE_URL = "https://alignops-api-xxxx.a.run.app"  # Update this
```

Then run:

```powershell
.\scripts\seed_demo.ps1
```

---

## Architecture Overview

```
┌─────────────────┐
│   Vercel        │  Frontend (Next.js)
│   (UI)          │  - Real-time polling (3s interval)
└────────┬────────┘  - Toast notifications
         │           - Image optimization
         │
         ▼
┌─────────────────┐
│  GCP Cloud Run  │  Backend (FastAPI)
│   (API)         │  - Dataset ingestion
└────────┬────────┘  - L1/L2 validation
         │           - Gemini integration
         │
    ┌────┴────┬─────────────┐
    │         │             │
    ▼         ▼             ▼
┌────────┐ ┌──────┐ ┌──────────────┐
│ Qdrant │ │Gemini│ │Sentence      │
│ Cloud  │ │ API  │ │Transformers  │
└────────┘ └──────┘ └──────────────┘
```

---

## Key Features Implemented

### Backend (FastAPI)

- ✅ Pydantic `CreateDatasetRequest` model for type safety
- ✅ Gemini fallback handling with try-except
- ✅ Pre-downloaded sentence-transformers model in Docker
- ✅ CORS middleware for frontend communication
- ✅ Background task processing for ingestion
- ✅ Comprehensive API endpoints:
  - `POST /datasets/` - Create dataset version
  - `GET /datasets/{id}/v/{version}` - Get specific version
  - `GET /datasets/{id}/v/{version}/outliers` - Get flagged samples with images
  - `GET /datasets/{id}/v/{version}/samples` - Browse all samples
  - `POST /datasets/{id}/v/{version}/trigger-l2` - Trigger semantic audit
  - `POST /datasets/{id}/v/{version}/manual-override` - Manual status override
  - `GET /datasets/stats` - Dashboard statistics

### Frontend (Next.js)

- ✅ Real-time polling hooks (`useDatasetPolling`, `useAllDatasetsPolling`)
- ✅ Auto-refresh dashboard (3-second interval)
- ✅ Status change notifications (toast)
- ✅ Live polling indicators with animation
- ✅ Automatic polling stop on terminal status (PASS, WARN, BLOCK)
- ✅ Image lightbox with metadata
- ✅ Responsive design with brand colors
- ✅ Accessibility features (ARIA labels, keyboard navigation)

---

## Troubleshooting

### Docker Build Issues

**Problem**: `sentence-transformers` model download timeout

**Solution**: 
- Increase Docker memory limit to 4GB
- Or download model locally first:
  ```powershell
  docker run -it python:3.10-slim bash
  pip install sentence-transformers
  python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('sentence-transformers/clip-ViT-B-32')"
  ```

### API Timeout

**Problem**: L2 audit takes too long

**Solution**: 
- Reduce sample limit in `trigger-l2` endpoint
- Increase Cloud Run timeout to 300s (already configured)
- Check Gemini API quota

### CORS Errors

**Problem**: Frontend can't reach backend

**Solution**:
- Verify `NEXT_PUBLIC_API_URL` in Vercel
- Check Cloud Run allows unauthenticated access
- Confirm CORS origins in `api/main.py` include Vercel URL

---

## Monitoring

### Cloud Run Metrics

```powershell
# View logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=alignops-api" --limit 50 --format json

# Monitor requests
gcloud run services describe alignops-api --region us-central1
```

### Vercel Analytics

Access via Vercel Dashboard:
- Page views
- Core Web Vitals
- Error tracking

---

## Cost Optimization

### Estimated Monthly Costs (Light Usage)

- **Cloud Run**: $5-10 (2GB RAM, ~100 requests/day)
- **Qdrant Cloud**: $25-50 (starter tier)
- **Gemini API**: $5-20 (depending on audit frequency)
- **Vercel**: Free (hobby tier)

**Total**: ~$35-80/month

### Tips to Reduce Costs

1. **Reduce polling frequency**: Change from 3s to 10s in production
2. **Use Cloud Run min instances: 0**: Only pay when active
3. **Batch L2 audits**: Process multiple datasets together
4. **Cache Gemini responses**: Store audit results for similar drift patterns

---

## Security Considerations

### Production Checklist

- [ ] Use secret manager for API keys (GCP Secret Manager)
- [ ] Enable Cloud Run authentication
- [ ] Restrict CORS origins to specific domains
- [ ] Add rate limiting to API endpoints
- [ ] Enable Vercel password protection for staging
- [ ] Use HTTPS only (enforced by Cloud Run/Vercel)
- [ ] Implement API key rotation schedule
- [ ] Set up monitoring alerts (Cloud Monitoring)

---

## Next Steps

1. **Deploy to production** using the commands above
2. **Run the demo** to verify end-to-end flow
3. **Customize thresholds** in L1/L2 validation logic
4. **Add more datasets** using the UI or API
5. **Integrate with your ML pipeline** by calling the API programmatically

For questions or issues, refer to:
- API Spec: `docs/API_SPEC.md`
- UI Guidelines: `ui/UI.md`
- Accessibility: `ui/Agents.md`
