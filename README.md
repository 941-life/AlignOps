# AlignOps Control Plane

A comprehensive dataset validation and quality control platform with AI-powered semantic analysis.

## Overview

AlignOps provides multi-layer validation for vision-language datasets:

- **L1 (Rules-based)**: Schema, volume, and freshness checks
- **L2 (Semantic)**: AI-powered drift detection using Gemini
- **Manual Control**: Human-in-the-loop decision making

## Architecture

```
┌─────────────┐
│   Frontend  │ Next.js + TanStack Query
│  (Port 3000)│
└─────┬───────┘
      │
      ├─────────┐
      │         │
┌─────▼─────┐ ┌▼────────────┐
│  FastAPI  │ │   Qdrant    │
│(Port 8000)│ │ Vector DB   │
└─────┬─────┘ └─────────────┘
      │
      ▼
┌─────────────┐
│   Gemini    │
│  (L2 Audit) │
└─────────────┘
```

## Quick Start

### Prerequisites

- Docker & Docker Compose
- Python 3.11+
- Node.js 20+ (for local UI development)
- Gemini API Key

### Setup

1. Clone the repository:

```bash
git clone <repo-url>
cd gemfr
```

2. Create `.env` file:

```bash
GEMINI_API_KEY=your_api_key_here
QDRANT_URL=http://qdrant:6333
```

3. Start services:

```bash
docker-compose up -d
```

Services will be available at:
- API: http://localhost:8000
- UI: http://localhost:3000
- Qdrant: http://localhost:6333

### API Documentation

Interactive API docs: http://localhost:8000/docs

Full specification: `docs/API_SPEC.md`

## Project Structure

```
.
├── api/                    # FastAPI backend
│   ├── main.py            # API routes
│   ├── models/            # Pydantic models
│   │   └── datasets.py
│   └── services/          # Business logic
│       ├── embedder.py    # Image-text embedding
│       ├── gemini_svc.py  # L2 semantic audit
│       ├── ingestor.py    # Data ingestion
│       ├── pipeline.py    # Orchestration
│       └── vector_db.py   # Qdrant interface
├── ui/                    # Next.js frontend
│   ├── app/              # Pages (App Router)
│   ├── components/       # React components
│   ├── lib/              # API client & types
│   └── mocks/            # MSW handlers
├── docs/
│   └── API_SPEC.md       # Complete API documentation
├── tests/                # Python tests
├── docker-compose.yml
└── requirements.txt
```

## Features

### Dashboard
- Overview of all datasets
- Filter by status (PASS/WARN/BLOCK)
- Quick status indicators
- Drill-down navigation

### Version Timeline
- Visual history of dataset versions
- Status transitions
- L1/L2 validation results
- Gemini judgment summaries

### Semantic Audit Report
- Drift statistics visualization
- Gemini reasoning trace
- Flagged samples
- Confidence scores

### Lineage & Root Cause Analysis
- Data flow visualization
- Error source heatmap
- Interactive filtering by source
- RCA recommendations

### Control Plane
- Manual override capabilities
- Re-ingestion triggers
- L2 audit initiation
- Action history log

## Data Flow

1. **Ingestion**: Raw data → Embeddings → Vector DB
2. **L1 Validation**: Rule-based checks (schema, volume, freshness)
3. **L2 Audit**: Semantic drift analysis using Gemini
4. **Decision**: PASS/WARN/BLOCK status
5. **Manual Override**: Human intervention when needed

## Status Transition Rules

- **L1 BLOCK**: Final block; L2 cannot override
- **L1 PASS**: Can proceed to L2 audit
- **L2 WARN**: Requires human review
- **L2 BLOCK**: Semantic issues detected
- **MANUAL PASS**: Human override

## Development

### Backend Development

```bash
# Install dependencies
pip install -r requirements.txt

# Run tests
python -m pytest tests/

# Start API (local)
uvicorn api.main:app --reload
```

### Frontend Development

```bash
cd ui
npm install
npm run dev
```

The UI runs with mock data by default. Set `NEXT_PUBLIC_USE_MOCKS=false` to connect to real API.

### Running Tests

```bash
# Backend tests
python -m pytest tests/ -v

# Specific test
python -m pytest tests/test_main_status_history.py -v
```

## Environment Variables

### Backend (.env)
```env
GEMINI_API_KEY=your_key_here
QDRANT_URL=http://qdrant:6333
```

### Frontend (ui/.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_USE_MOCKS=true
```

## API Examples

### Create Dataset

```bash
curl -X POST http://localhost:8000/datasets/ \
  -H "Content-Type: application/json" \
  -d '{
    "dataset": {
      "dataset_id": "test-dataset",
      "version": "v1",
      "source_id": "camera-01"
    },
    "raw_data": [
      {
        "image_url": "https://example.com/img.jpg",
        "caption": "A sunny day",
        "source_id": "camera-01"
      }
    ]
  }'
```

### Validate L1

```bash
curl -X PATCH http://localhost:8000/datasets/test-dataset/v/v1/validate-l1 \
  -H "Content-Type: application/json" \
  -d '{
    "schema_passed": true,
    "volume_actual": 100,
    "volume_expected": 100,
    "freshness_delay_sec": 60,
    "l1_status": "PASS"
  }'
```

### Trigger L2 Audit

```bash
curl -X POST http://localhost:8000/datasets/test-dataset/v/v2/trigger-l2
```

## Technologies

### Backend
- **FastAPI**: Modern Python API framework
- **Pydantic**: Data validation
- **Qdrant**: Vector database for embeddings
- **Google Gemini**: Multimodal AI for semantic analysis

### Frontend
- **Next.js 15**: React framework with App Router
- **TypeScript**: Type safety
- **Tailwind CSS**: Utility-first styling
- **shadcn/ui**: Accessible component library
- **TanStack Query**: Data fetching & caching
- **Recharts**: Chart library
- **MSW**: API mocking

## Design Philosophy

### Light Mode "Clinical Precision"
- Clean white backgrounds
- High contrast text
- Subtle shadows
- Status-based color coding
- Professional engineering tool aesthetic

### Accessibility First
- WCAG 2.1 AA compliant
- Full keyboard navigation
- Screen reader support
- Color-blind friendly
- Respects motion preferences

## Troubleshooting

### Qdrant Connection Issues
```bash
# Check if Qdrant is running
docker ps | grep qdrant

# Restart Qdrant
docker-compose restart qdrant
```

### Gemini API Errors
- Verify `GEMINI_API_KEY` is set correctly
- Check API quota at https://ai.google.dev
- Ensure API key has Gemini 2.5 Flash access

### Frontend Not Loading Data
- Check `NEXT_PUBLIC_USE_MOCKS` setting
- Verify API is running at specified URL
- Check browser console for errors

## License

Copyright © 2026 AlignOps

## Support

For issues and questions:
- Check `docs/API_SPEC.md` for API details
- Review `ui/README.md` for frontend specifics
- Open an issue on GitHub

