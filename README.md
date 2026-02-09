# AlignOps Control Plane

A production-grade dataset validation and quality control platform with AI-powered semantic analysis for vision-language datasets.

## Overview

AlignOps Control Plane is a comprehensive data quality management system that provides automated validation, semantic drift detection, and human-in-the-loop decision making for vision-language datasets. The platform implements a three-layer validation strategy combining rule-based checks, AI-powered semantic analysis, and manual oversight.

### Key Capabilities

- **Multi-Layer Validation**: L1 rule-based validation, L2 AI-powered semantic analysis, and manual override controls
- **Semantic Drift Detection**: Automated detection of distribution shifts using vector embeddings and multimodal AI
- **Version Control**: Complete dataset version history with lineage tracking and root cause analysis
- **Real-time Monitoring**: Live dashboard with dataset health metrics and status tracking
- **Interactive Audit Reports**: Visual analysis of flagged samples with AI reasoning traces

## Architecture

The system consists of three main components:

1. **Frontend (Next.js)**: Modern React-based UI with real-time data updates via TanStack Query
2. **Backend (FastAPI)**: RESTful API with background task processing for ingestion pipelines
3. **Infrastructure**: Qdrant vector database for embedding storage and Gemini 2.5 Flash for semantic analysis

**Service Architecture:**

```
┌─────────────────┐
│   Next.js UI    │  Port 3000
│  (TypeScript)   │
└────────┬────────┘
         │ HTTP
         ↓
┌─────────────────┐
│   FastAPI API   │  Port 8000
│    (Python)     │
└────┬───────┬────┘
     │       │
     ↓       ↓
┌─────────┐ ┌──────────────┐
│ Qdrant  │ │ Gemini API   │
│Vector DB│ │(L2 Analysis) │
└─────────┘ └──────────────┘
```

## Quick Start

### Prerequisites

- **Docker** & **Docker Compose** (recommended for production deployment)
- **Python 3.11+** (for local development)
- **Node.js 20+** (for UI development)
- **Gemini API Key** (obtain from [Google AI Studio](https://ai.google.dev))

### Installation & Setup

**1. Clone the repository:**

```bash
git clone <repository-url>
cd gemfr
```

**2. Configure environment variables:**

Create a `.env` file in the project root:

```bash
GEMINI_API_KEY=your_gemini_api_key_here
QDRANT_URL=http://qdrant:6333
```

**3. Start all services with Docker Compose:**

```bash
docker-compose up -d
```

This command will:
- Build and start the FastAPI backend
- Build and start the Next.js frontend
- Start the Qdrant vector database
- Create a network bridge for inter-service communication

**4. Verify services are running:**

- **API**: http://localhost:8000
- **UI**: http://localhost:3000
- **Qdrant**: http://localhost:6333
- **API Documentation**: http://localhost:8000/docs

### API Documentation

- **Interactive Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Complete API Specification**: [docs/API_SPEC.md](docs/API_SPEC.md)

## Project Structure

```
gemfr/
├── api/                          # FastAPI Backend
│   ├── main.py                  # API endpoints and route handlers
│   ├── models/
│   │   └── datasets.py          # Pydantic data models
│   ├── services/
│   │   ├── embedder.py          # Image-text embedding generation
│   │   ├── gemini_svc.py        # Gemini API integration for L2 audit
│   │   ├── ingestor.py          # Dataset ingestion pipeline
│   │   ├── pipeline.py          # Background task orchestration
│   │   └── vector_db.py         # Qdrant vector database interface
│   ├── requirements.txt         # Python dependencies
│   ├── requirements.ml.txt      # ML/AI dependencies
│   └── Dockerfile.api           # API container configuration
│
├── ui/                           # Next.js Frontend
│   ├── app/                     # Next.js App Router pages
│   │   ├── page.tsx            # Dashboard (/)
│   │   ├── datasets/           # Dataset management pages
│   │   └── control-plane/      # Manual control interface
│   ├── components/              # Reusable React components
│   │   ├── ui/                 # shadcn/ui components
│   │   ├── stat-card.tsx       # Statistics display
│   │   ├── status-badge.tsx    # Status indicators
│   │   └── image-lightbox.tsx  # Image viewer
│   ├── lib/
│   │   ├── api-client.ts       # API integration layer
│   │   └── types.ts            # TypeScript type definitions
│   ├── package.json            # Node.js dependencies
│   └── Dockerfile.ui           # UI container configuration
│
├── tests/                        # Test Suite
│   ├── test_embedder.py         # Embedding generation tests
│   ├── test_ingestor.py         # Ingestion pipeline tests
│   ├── test_vector_db.py        # Vector DB integration tests
│   └── test_main_*.py           # API endpoint tests
│
├── docs/
│   └── API_SPEC.md              # Complete API specification
│
├── docker-compose.yml            # Multi-service orchestration
└── .env                          # Environment configuration (not in repo)
```

## Core Features

### 1. Dashboard & Dataset Management
- Real-time statistics dashboard with dataset health metrics
- Search and filter functionality across all datasets
- Status-based filtering (PASS/WARN/BLOCK)
- Auto-refresh with configurable intervals (default: 30s)
- Quick dataset creation workflow
- Responsive design with empty state handling

### 2. Multi-Layer Validation Pipeline

**L1 Validation (Rule-Based)**
- Schema validation
- Volume checks (actual vs. expected)
- Freshness monitoring (ingestion delay tracking)
- Configurable thresholds and validation rules

**L2 Validation (AI-Powered Semantic Analysis)**
- Semantic drift detection using vector embeddings
- Distribution shift analysis between dataset versions
- Automated outlier identification
- Multimodal analysis with Gemini 2.5 Flash
- Confidence scoring for AI judgments

**Manual Override Controls**
- Human-in-the-loop decision making
- Status override capabilities (PASS/WARN/BLOCK)
- Audit trail for all manual interventions
- Re-ingestion triggering
- L2 audit initiation on demand

### 3. Semantic Audit Reports
- Interactive drift visualization with gauge charts
- Flagged sample inspection with original images
- Image lightbox for detailed examination
- AI reasoning traces with key observations
- Distance metrics (cosine similarity between versions)
- Confidence indicators for automated decisions
- Recommended actions from AI analysis

### 4. Sample Browser
- Grid view of all dataset samples with thumbnails
- Image-caption pair visualization
- Click-to-enlarge functionality with metadata overlay
- Lazy loading for optimal performance
- Source tracking and provenance information
- Navigation to related audit and lineage views

### 5. Version Control & Lineage
- Complete version history timeline
- Status transition tracking
- Visual lineage representation
- Root cause analysis (RCA) tools
- Error source heatmaps
- Interactive filtering by data source
- Parent-child version relationships

### 6. Control Plane Interface
- Centralized control dashboard
- Dataset and version selection
- Manual status override controls
- Re-ingestion pipeline triggers
- L2 audit initiation
- Action history log with timestamps
- Real-time feedback via toast notifications

## Data Processing Pipeline

### Ingestion Flow

1. **Dataset Creation**: Client submits raw data (image URLs + captions) via POST `/datasets/`
2. **Background Processing**: 
   - API creates dataset record with status `VALIDATING`
   - Background task initiates ingestion pipeline
3. **Embedding Generation**: 
   - Images are fetched and encoded
   - Text captions are embedded
   - Multimodal embeddings are generated
4. **Vector Storage**: Embeddings are stored in Qdrant with metadata (source_id, version, etc.)

### Validation Flow

**L1 Validation (Rule-Based)**
```
VALIDATING → L1 Check → PASS or BLOCK
```
- Executed via PATCH `/datasets/{id}/v/{version}/validate-l1`
- Checks schema compliance, volume thresholds, freshness
- Status transitions: `VALIDATING` → `PASS` or `BLOCK`

**L2 Validation (Semantic Analysis)**
```
L1 PASS → L2 Audit → PASS, WARN, or BLOCK
```
- Triggered via POST `/datasets/{id}/v/{version}/trigger-l2`
- Compares distribution with previous version
- Identifies outlier samples
- Sends data to Gemini for multimodal analysis
- Status transitions: `PASS` → `PASS`, `WARN`, or `BLOCK`

**Manual Override**
```
Any Status → Manual Control → PASS, WARN, or BLOCK
```
- Human-in-the-loop intervention via Control Plane UI
- Can override any automated decision
- Maintains audit trail with timestamps and reason

## Status Transition Rules

### Validation Policy

| L1 Status | L2 Allowed | Manual Override |
|-----------|------------|-----------------|
| **BLOCK** | ❌ No | ✅ Yes |
| **PASS** | ✅ Yes | ✅ Yes |

### Status Definitions

- **PENDING**: Dataset version created, awaiting validation
- **VALIDATING**: Ingestion and embedding generation in progress
- **PASS**: Passed all validations, ready for production
- **WARN**: Passed automated checks but flagged for human review
- **BLOCK**: Failed validation, should not be used in production

### Transition Policy

- **L1 BLOCK**: Hard block at rule level; L2 audit is not executed
- **L1 PASS**: Eligible for L2 semantic audit
- **L2 WARN**: Requires human review before production deployment
- **L2 BLOCK**: Blocked due to semantic drift or alignment issues
- **MANUAL**: Human operator can override any status with justification

## Development

### Backend Development

```bash
# Install dependencies
pip install -r api/requirements.txt -r api/requirements.ml.txt

# Run tests
python -m pytest tests/ -v

# Start API locally (without Docker)
uvicorn api.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Development

```bash
cd ui
npm install
npm run dev
```

The UI runs with mock data by default. Set `NEXT_PUBLIC_USE_MOCKS=false` to connect to the real API.

### Running Tests

```bash
# Run all backend tests
python -m pytest tests/ -v

# Run specific test file
python -m pytest tests/test_main_status_history.py -v

# Run with coverage
python -m pytest tests/ -v --cov=api --cov-report=html
```

## Environment Variables

### Backend (.env)
```env
GEMINI_API_KEY=your_gemini_api_key_here
QDRANT_URL=http://qdrant:6333
```

### Frontend (ui/.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_USE_MOCKS=false
```

## API Examples

### Create Dataset

```bash
curl -X POST http://localhost:8000/datasets/ \
  -H "Content-Type: application/json" \
  -d '{
    "dataset": {
      "dataset_id": "autonomous-driving-v1",
      "version": "v1",
      "source_id": "camera-01",
      "tags": ["production", "highway"]
    },
    "raw_data": [
      {
        "image_url": "https://example.com/image1.jpg",
        "caption": "Sunny highway with light traffic",
        "source_id": "camera-01"
      },
      {
        "image_url": "https://example.com/image2.jpg",
        "caption": "Urban intersection at dusk",
        "source_id": "camera-01"
      }
    ]
  }'
```

### Validate L1

```bash
curl -X PATCH http://localhost:8000/datasets/autonomous-driving-v1/v/v1/validate-l1 \
  -H "Content-Type: application/json" \
  -d '{
    "schema_passed": true,
    "volume_actual": 1000,
    "volume_expected": 1000,
    "freshness_delay_sec": 120,
    "l1_status": "PASS"
  }'
```

### Trigger L2 Audit

```bash
curl -X POST http://localhost:8000/datasets/autonomous-driving-v1/v/v2/trigger-l2
```

### List All Datasets

```bash
curl http://localhost:8000/datasets/
```

## Technologies

### Backend Stack
- **FastAPI 0.115.14**: Modern async Python web framework
- **Pydantic 2.11.7**: Data validation and settings management
- **Qdrant 1.15.1**: High-performance vector database
- **Google Gemini 1.29.0**: Multimodal AI for semantic analysis
- **Uvicorn**: ASGI server for production deployment

### Frontend Stack
- **Next.js 15**: React framework with App Router
- **React 19**: Latest React with concurrent features
- **TypeScript 5**: Static type checking
- **Tailwind CSS 3.4**: Utility-first CSS framework
- **shadcn/ui**: Accessible component library based on Radix UI
- **TanStack Query 5**: Powerful data fetching and caching
- **Recharts 2**: Chart library for visualizations
- **MSW 2**: API mocking for development

### Infrastructure
- **Docker & Docker Compose**: Containerization and orchestration
- **Qdrant**: Vector database for embeddings
- **Gemini 2.5 Flash**: Multimodal AI model

## Design Philosophy

### Clean & Professional Interface
- Light mode with "clinical precision" aesthetic
- High contrast for readability
- Subtle shadows and borders
- Status-based color coding
- Professional engineering tool appearance

### Accessibility First
- WCAG 2.1 AA compliant
- Full keyboard navigation support
- Screen reader compatible
- Color-blind friendly palettes
- Respects `prefers-reduced-motion`
- Proper ARIA labels and semantic HTML

### Performance Optimized
- Lazy loading for images
- Virtualized lists for large datasets
- Optimistic UI updates
- Efficient re-render minimization
- Responsive at all viewport sizes

## Troubleshooting

### Qdrant Connection Issues
```bash
# Check if Qdrant is running
docker ps | grep qdrant

# View Qdrant logs
docker logs dataops-qdrant

# Restart Qdrant
docker-compose restart qdrant
```

### Gemini API Errors
- Verify `GEMINI_API_KEY` is set correctly in `.env`
- Check API quota at https://ai.google.dev
- Ensure API key has Gemini 2.5 Flash access enabled
- Verify network connectivity to Google AI services

### Frontend Not Loading Data
- Check `NEXT_PUBLIC_USE_MOCKS` setting in `ui/.env.local`
- Verify API is running at the specified URL
- Check browser console for CORS or network errors
- Ensure API and UI are on the same Docker network

### Docker Build Issues
```bash
# Clean rebuild all services
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d

# Check service logs
docker-compose logs -f api
docker-compose logs -f ui
```

## Testing

The project includes comprehensive test coverage:

- **Unit Tests**: Individual service and utility function tests
- **Integration Tests**: API endpoint tests with Qdrant
- **E2E Scenarios**: Complete validation pipeline tests

Run tests before submitting PRs:

```bash
python -m pytest tests/ -v --cov=api
```

## License

Copyright © 2026 AlignOps

## Support & Documentation

- **API Documentation**: [docs/API_SPEC.md](docs/API_SPEC.md)
- **Interactive API Docs**: http://localhost:8000/docs (when running)
- **UI Documentation**: [ui/README.md](ui/README.md)

## Contributing

This is a submission project for evaluation purposes. For questions or issues, please contact the development team.

## Acknowledgments

Built with modern web technologies and AI capabilities:
- Google Gemini for multimodal AI analysis
- Qdrant for vector database capabilities
- FastAPI and Next.js communities
- shadcn/ui for beautiful accessible components
