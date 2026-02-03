from fastapi import FastAPI, HTTPException
from app.models import DatasetObject, StatusEnum, L1Report, L2Reasoning
from typing import Dict, Literal, List

app = FastAPI(title="DataOps Control Plane API")

dataset_registry: Dict[str, DatasetObject] = {}

def apply_status(ds: DatasetObject, status: StatusEnum, source: Literal["L1", "L2", "MANUAL"]):
    """상태 전이 정책을 한 곳에서 관리하는 유틸리티"""
    ds.status = status
    ds.status_source = source

@app.post("/datasets/", response_model=DatasetObject)
async def create_dataset_version(dataset: DatasetObject):
    """새로운 데이터셋 수집 시작: 상태를 VALIDATING으로 초기화"""
    key = f"{dataset.dataset_id}:{dataset.version}"
    if key in dataset_registry:
        raise HTTPException(status_code=400, detail="Version already exists")
    
    dataset.status = StatusEnum.VALIDATING
    dataset_registry[key] = dataset
    return dataset

@app.patch("/datasets/{dataset_id}/v/{version}/validate-l1")
async def update_l1_result(dataset_id: str, version: str, report: L1Report):
    """L1 결과 반영: BLOCK 시 하류 시스템으로의 전송을 논리적으로 차단"""
    key = f"{dataset_id}:{version}"
    ds = dataset_registry.get(key)
    if not ds: raise HTTPException(status_code=404)

    ds.l1_report = report
    # L1이 BLOCK이면 결과에 상관없이 즉시 BLOCK 적용
    target_status = StatusEnum.BLOCK if report.l1_status == StatusEnum.BLOCK else report.l1_status
    apply_status(ds, target_status, "L1")
    
    return ds

@app.patch("/datasets/{dataset_id}/v/{version}/audit-l2")
async def update_l2_audit(dataset_id: str, version: str, audit: L2Reasoning):
    """L2 Gemini 추론 반영: L1에 의해 차단된 데이터는 처리 거부"""
    key = f"{dataset_id}:{version}"
    ds = dataset_registry.get(key)
    if not ds: raise HTTPException(status_code=404)

    # L1 BLOCK 상태라면 비싼 Gemini 연산 결과를 반영하지 않음
    if ds.status_source == "L1" and ds.status == StatusEnum.BLOCK:
        raise HTTPException(status_code=400, detail="Processing denied: Blocked by L1 rules")

    ds.l2_reasoning = audit
    apply_status(ds, audit.l2_status, "L2")
    
    return ds

@app.post("/datasets/{dataset_id}/v/{version}/approve")
async def manual_approve(dataset_id: str, version: str):
    """운영자의 수동 승인: Human-in-the-loop 제어 (Page 6 기능)"""
    key = f"{dataset_id}:{version}"
    ds = dataset_registry.get(key)
    if not ds: raise HTTPException(status_code=404)

    apply_status(ds, StatusEnum.PASS, "MANUAL")
    return ds

@app.get("/datasets/{dataset_id}", response_model=List[DatasetObject])
async def list_versions(dataset_id: str):
    """버전 타임라인 조회용 (Page 3 기능)"""
    return [d for d in dataset_registry.values() if d.dataset_id == dataset_id]