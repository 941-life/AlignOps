from fastapi import FastAPI, HTTPException, BackgroundTasks
from api.models import DatasetObject, StatusEnum, L1Report, L2Reasoning
from api.services.pipeline import DataPipeline
from api.services.gemini_svc import GeminiService 
from typing import Dict, Literal, List
import logging

app = FastAPI(title="AlignOps Control Plane API")
pipeline = DataPipeline()  # 파이프라인 인스턴스 초기화
dataset_registry: Dict[str, DatasetObject] = {}
gemini_svc = GeminiService()

def apply_status(ds: DatasetObject, status: StatusEnum, source: Literal["L1", "L2", "MANUAL"]):
    ds.status = status
    ds.status_source = source
    logging.info(f"Dataset {ds.dataset_id} status changed to {status} by {source}")

# --- Background Task ---
async def start_ingestion_task(dataset: DatasetObject, raw_data: List[dict]):
    """비동기로 임베딩을 생성하고 Qdrant에 저장하는 워크플로우"""
    try:
        # 1. 벡터화 및 저장
        await pipeline.process_ingestion(dataset.dataset_id, dataset.version, raw_data)
        
        # 2. (선택사항) 저장이 끝나면 자동으로 L1 검증 트리거 가능
        # 현재는 수동 PATCH 시뮬레이션을 위해 상태만 유지
    except Exception as e:
        logging.error(f"Ingestion failed: {e}")
        apply_status(dataset, StatusEnum.BLOCK, "L1")

# --- Endpoints ---

@app.post("/datasets/", response_model=DatasetObject)
async def create_dataset_version(dataset: DatasetObject, raw_data: List[dict], background_tasks: BackgroundTasks):
    """
    1단계: Dataset 등록
    입력된 raw_data를 바탕으로 백그라운드에서 벡터화를 시작합니다.
    """
    key = f"{dataset.dataset_id}:{dataset.version}"
    if key in dataset_registry:
        raise HTTPException(status_code=400, detail="Version already exists")
    
    dataset.status = StatusEnum.VALIDATING
    dataset_registry[key] = dataset
    
    # 백그라운드에서 임베딩 & Qdrant 작업 실행
    background_tasks.add_task(start_ingestion_task, dataset, raw_data)
    
    return dataset

@app.patch("/datasets/{dataset_id}/v/{version}/validate-l1")
async def update_l1_result(dataset_id: str, version: str, report: L1Report):
    """2단계: L1(물리적/규격) 검증 결과 반영"""
    key = f"{dataset_id}:{version}"
    ds = dataset_registry.get(key)
    if not ds: raise HTTPException(status_code=404)

    ds.l1_report = report
    target_status = StatusEnum.BLOCK if report.l1_status == StatusEnum.BLOCK else report.l1_status
    apply_status(ds, target_status, "L1")
    return ds

@app.patch("/datasets/{dataset_id}/v/{version}/audit-l2")
async def update_l2_audit(dataset_id: str, version: str, audit: L2Reasoning):
    """3단계: L2(의미론적/Gemini) 검증 결과 반영"""
    key = f"{dataset_id}:{version}"
    ds = dataset_registry.get(key)
    if not ds: raise HTTPException(status_code=404)

    if ds.status_source == "L1" and ds.status == StatusEnum.BLOCK:
        raise HTTPException(status_code=400, detail="Blocked by L1")

    ds.l2_reasoning = audit
    apply_status(ds, audit.l2_status, "L2")
    return ds

@app.get("/datasets/{dataset_id}", response_model=List[DatasetObject])
async def list_versions(dataset_id: str):
    return [d for d in dataset_registry.values() if d.dataset_id == dataset_id]


@app.post("/datasets/{dataset_id}/v/{version}/trigger-l2")
async def trigger_l2_audit(dataset_id: str, version: str):
    """
    실제 Gemini 감사를 실행하는 트리거
    1. Qdrant에서 드리프트 데이터 및 샘플 추출
    2. Gemini 호출
    3. 결과 업데이트
    """
    # [TODO] Qdrant에서 데이터 가져오는 로직 (vector_svc 활용)
    drift_stats = {"cosine_mean_shift": 0.15} 
    samples = ["image_data_here"], ["A photo of a rainy street"]

    # Gemini 감사 실행
    audit_result = await gemini_svc.audit_dataset(drift_stats, samples[0], samples[1])
    
    # 기존에 만든 l2 업데이트 엔드포인트 로직 실행
    return await update_l2_audit(dataset_id, version, audit_result)
