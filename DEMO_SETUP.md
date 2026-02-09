# 🎯 자동 데모 데이터 설정 완료

## 문제 해결

### ❌ Before
- 프론트엔드 배포 후 빈 대시보드
- 심사자가 수동으로 데모 데이터 생성 필요
- 버튼 클릭 → 30초 대기 필요

### ✅ After
- **백엔드 시작 시 자동으로 데모 데이터 생성!**
- 프론트엔드 접속 즉시 데모 확인 가능
- 심사자 경험 극대화

## 구현 내용

### 1. 자동 시드 시스템

**파일**: `api/services/demo_seed.py`

**동작**:
```python
@app.on_event("startup")
async def startup_event():
    # 백엔드 시작 시 실행
    await seed_demo_data_if_needed(...)
```

**로직**:
1. `demo_vlm_dataset:v1`, `demo_vlm_dataset:v2` 존재 확인
2. 없으면 자동 생성:
   - v1: 자연 이미지 5개 (기준선)
   - v2: 도시 이미지 5개 (drift 포함)
3. L1 검증 자동 완료
4. L2 Audit는 UI에서 트리거 (Gemini 비용 고려)

### 2. 데모 데이터 상세

#### V1 (자연 - 기준선)
```json
{
  "dataset_id": "demo_vlm_dataset",
  "version": "v1",
  "source_id": "nature_pipeline",
  "tags": ["nature", "demo", "baseline"],
  "data": [
    "mountain range",
    "tropical beach",
    "forest sunlight",
    "countryside hills",
    "lake sunset"
  ]
}
```

#### V2 (도시 - Drift 포함)
```json
{
  "dataset_id": "demo_vlm_dataset",
  "version": "v2",
  "source_id": "urban_pipeline",
  "tags": ["urban", "demo", "drifted"],
  "data": [
    "city street",
    "modern architecture",
    "neon lights",
    // 의도적 불일치 👇
    "tropical beach" (실제 이미지: 산),
    "mountain landscape" (실제 이미지: 도시)
  ]
}
```

### 3. 로그 출력

백엔드 시작 시 다음 로그 확인:

```
INFO: Starting AlignOps API...
INFO: Demo dataset not found, creating demo data...
INFO: Creating demo_vlm_dataset v1...
INFO: ✓ Demo v1 created and validated
INFO: Creating demo_vlm_dataset v2...
INFO: ✓ Demo v2 created and validated
INFO: ✓ Demo dataset seeding complete!
INFO:   → v1: Nature scenes (baseline)
INFO:   → v2: Urban scenes (with semantic drift)
INFO:   → Trigger L2 audit from UI or API to see Gemini analysis
INFO: AlignOps API ready!
```

## 배포 플로우

### Local Development

```powershell
# Docker로 시작 (자동 시드)
docker-compose up --build

# 또는 직접 실행
cd api
uvicorn api.main:app --reload

# 프론트엔드 접속
# http://localhost:3000
# → 즉시 demo_vlm_dataset 표시됨!
```

### GCP Cloud Run 배포

```powershell
cd api
Copy-Item Dockerfile.api Dockerfile

gcloud run deploy alignops-api \
  --source . \
  --region asia-northeast3 \
  --allow-unauthenticated \
  --set-env-vars GEMINI_API_KEY=...,QDRANT_URL=...,QDRANT_API_KEY=... \
  --memory 2Gi \
  --cpu 2 \
  --timeout 300s \
  --max-instances 10

# 배포 완료 후 첫 요청 시 자동으로 데모 데이터 생성
# Cold start: ~30초 (모델 로딩 + 데모 시드)
# 이후 요청: ~1초
```

### Vercel 프론트엔드 배포

```powershell
cd ui
vercel --prod

# 환경 변수 설정 (Vercel Dashboard)
NEXT_PUBLIC_API_URL=https://your-gcp-api.a.run.app
NEXT_PUBLIC_USE_MOCKS=false

# 재배포
```

## 심사자 경험

### 시나리오 A: 로컬 테스트

```
1. docker-compose up
   ↓
2. http://localhost:3000 접속
   ↓
3. 즉시 demo_vlm_dataset 확인!
   ↓
4. "View Analytics" 클릭
   ↓
5. "View Audit Report" 클릭
   ↓
6. 벡터 시각화 확인
   ↓
완료: 1분 이내 핵심 파악
```

### 시나리오 B: Vercel 배포

```
1. https://your-app.vercel.app 접속
   ↓
2. 대시보드에 demo_vlm_dataset 표시
   (백엔드가 이미 시드 완료)
   ↓
3. Audit 페이지 → 벡터 시각화
   ↓
4. Control Plane → "Trigger L2 Audit" 클릭
   ↓
5. Gemini 분석 결과 확인
   ↓
완료: 2분 이내 모든 기능 체험
```

## 추가 기능

### 수동 데모 로드도 가능

프론트엔드의 `DemoLoader` 컴포넌트는 여전히 작동:

```typescript
// 사용 사례:
// 1. 데모 데이터 재생성 필요 시
// 2. 다른 데모 시나리오 테스트 시
// 3. 백엔드 없이 프론트엔드만 테스트 시

<DemoLoader onComplete={() => router.refresh()} />
```

### API 엔드포인트로도 시드 가능

```powershell
# 스크립트로 시드 (수동)
.\scripts\seed_demo.ps1 -BaseUrl "http://localhost:8000"

# 또는 직접 API 호출
Invoke-RestMethod -Uri "http://localhost:8000/datasets/" -Method Post -Body ...
```

## 장점

### 1. 심사자 경험 최적화
- ✅ 즉시 데모 확인 가능
- ✅ 수동 설정 불필요
- ✅ 1분 이내 핵심 파악

### 2. 개발자 경험 향상
- ✅ 로컬 개발 즉시 시작
- ✅ 테스트 데이터 자동 준비
- ✅ CI/CD 파이프라인 간소화

### 3. 배포 간소화
- ✅ 별도 시드 스크립트 불필요
- ✅ 환경별 차이 없음
- ✅ 항상 일관된 데모

## 주의사항

### Qdrant 데이터 영속성

**Local Docker**:
- `docker-compose down -v` 시 데이터 삭제
- 재시작 시 자동 재생성

**Qdrant Cloud**:
- 데이터 영구 저장
- 중복 생성 방지 로직 포함
- 이미 있으면 스킵

### Gemini API 비용

**자동 생성 범위**:
- ✅ 데이터 인제스트 (무료)
- ✅ L1 검증 (무료)
- ❌ L2 Audit (수동 트리거)

**이유**: L2 Audit는 Gemini API 호출이 필요하므로 비용 발생. 심사자가 원할 때만 트리거하도록 설계.

## 테스트

### 1. 로컬 테스트

```powershell
# 1. 클린 시작
docker-compose down -v
docker-compose up --build

# 2. 로그 확인
docker logs alignops-api | grep "Demo"

# 3. 프론트엔드 접속
# http://localhost:3000

# 4. 확인사항:
# - demo_vlm_dataset v1, v2 표시
# - v1 상태: PASS
# - v2 상태: PASS (L2는 PENDING)
```

### 2. GCP 테스트

```powershell
# 배포 후 로그 확인
gcloud run services logs read alignops-api --region asia-northeast3 --limit 50

# API 직접 확인
Invoke-RestMethod -Uri "https://your-api.a.run.app/datasets/"

# 예상 응답:
# [
#   { "dataset_id": "demo_vlm_dataset", "version": "v1", ... },
#   { "dataset_id": "demo_vlm_dataset", "version": "v2", ... }
# ]
```

## 완료! 🎉

이제 **어디서든 배포하면 즉시 데모를 확인할 수 있습니다!**

심사자는 버튼 클릭 없이도 AlignOps의 핵심 기능을 바로 체험할 수 있습니다.
