import logging
from typing import Dict, List, Literal, Optional

from fastapi import BackgroundTasks, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from api.models import DatasetObject, L1Report, L2Reasoning, StatusEnum, StatusHistoryItem, CreateDatasetRequest
from api.services.gemini_svc import GeminiService
from api.services.math_utils import cosine_distance
from api.services.pipeline import DataPipeline

app = FastAPI(title="AlignOps Control Plane API")

# CORS 설정 - Frontend와의 통신을 위해 필요
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Next.js 개발 서버
        "http://127.0.0.1:3000",
        "https://*.vercel.app",   # Vercel 배포 환경
    ],
    allow_credentials=True,
    allow_methods=["*"],  # GET, POST, PATCH 등 모든 HTTP 메서드 허용
    allow_headers=["*"],  # 모든 헤더 허용
)

pipeline = DataPipeline()
dataset_registry: Dict[str, DatasetObject] = {}
gemini_svc = GeminiService()


@app.on_event("startup")
async def startup_event():
    """Initialize demo data on startup"""
    logging.info("Starting AlignOps API...")
    
    # Seed demo data if not exists
    from api.services.demo_seed import seed_demo_data_if_needed
    await seed_demo_data_if_needed(pipeline, dataset_registry, apply_status)
    
    logging.info("AlignOps API ready!")


# Status transition policy:
# - L1 BLOCK: final block at rule-level. L2 must not override it.
# - L1 PASS: can proceed to L2 auditing.
# - L2 WARN: requires human-in-the-loop decision.
# - L2 BLOCK: blocked by semantic audit.
# - MANUAL PASS: human override to PASS when needed.
def apply_status(
    ds: DatasetObject,
    status: StatusEnum,
    source: Literal["SYSTEM", "L1", "L2", "MANUAL"],
    reason: Optional[str] = None,
):
    ds.status = status
    ds.status_source = source
    ds.status_history.append(
        StatusHistoryItem(
            status=status,
            source=source,
            reason=reason,
        )
    )
    logging.info("Dataset %s status changed to %s by %s", ds.dataset_id, status, source)


def build_l1_reason(report: L1Report) -> str:
    return (
        f"schema_passed={report.schema_passed}, "
        f"volume={report.volume_actual}/{report.volume_expected}, "
        f"freshness_delay_sec={report.freshness_delay_sec}"
    )


async def start_ingestion_task(dataset: DatasetObject, raw_data: List[dict]):
    try:
        await pipeline.process_ingestion(dataset.dataset_id, dataset.version, raw_data)
    except Exception as exc:
        logging.error("Ingestion failed: %s", exc)
        apply_status(dataset, StatusEnum.BLOCK, "L1", reason=f"Ingestion failed: {exc}")


@app.post("/datasets/", response_model=DatasetObject)
async def create_dataset_version(request: CreateDatasetRequest, background_tasks: BackgroundTasks):
    dataset = request.dataset
    raw_data = request.raw_data
    
    key = f"{dataset.dataset_id}:{dataset.version}"
    if key in dataset_registry:
        raise HTTPException(status_code=400, detail="Version already exists")

    apply_status(dataset, StatusEnum.VALIDATING, "SYSTEM", reason="Dataset version created")
    dataset_registry[key] = dataset
    background_tasks.add_task(start_ingestion_task, dataset, raw_data)
    return dataset


@app.patch("/datasets/{dataset_id}/v/{version}/validate-l1")
async def update_l1_result(dataset_id: str, version: str, report: L1Report):
    key = f"{dataset_id}:{version}"
    ds = dataset_registry.get(key)
    if not ds:
        raise HTTPException(status_code=404)

    ds.l1_report = report
    target_status = StatusEnum.BLOCK if report.l1_status == StatusEnum.BLOCK else report.l1_status
    apply_status(ds, target_status, "L1", reason=build_l1_reason(report))
    return ds


@app.patch("/datasets/{dataset_id}/v/{version}/audit-l2")
async def update_l2_audit(dataset_id: str, version: str, audit: L2Reasoning):
    key = f"{dataset_id}:{version}"
    ds = dataset_registry.get(key)
    if not ds:
        raise HTTPException(status_code=404)

    if ds.status_source == "L1" and ds.status == StatusEnum.BLOCK:
        raise HTTPException(status_code=400, detail="Blocked by L1")

    ds.l2_reasoning = audit
    reason = audit.judgment_summary.strip() if audit.judgment_summary else None
    apply_status(ds, audit.l2_status, "L2", reason=reason or None)
    return ds


@app.get("/datasets/")
async def list_all_datasets():
    """List all datasets with their latest version information."""
    dataset_map: Dict[str, Dict] = {}
    
    for ds in dataset_registry.values():
        if ds.dataset_id not in dataset_map:
            dataset_map[ds.dataset_id] = {
                "dataset_id": ds.dataset_id,
                "latest_version": ds.version,
                "status": ds.status,
                "status_source": ds.status_source,
                "last_evaluated": ds.created_at,
                "total_versions": 1,
            }
        else:
            dataset_map[ds.dataset_id]["total_versions"] += 1
            # Update if this version is newer
            if ds.created_at > dataset_map[ds.dataset_id]["last_evaluated"]:
                dataset_map[ds.dataset_id]["latest_version"] = ds.version
                dataset_map[ds.dataset_id]["status"] = ds.status
                dataset_map[ds.dataset_id]["status_source"] = ds.status_source
                dataset_map[ds.dataset_id]["last_evaluated"] = ds.created_at
    
    return list(dataset_map.values())


@app.get("/datasets/{dataset_id}", response_model=List[DatasetObject])
async def list_versions(dataset_id: str):
    return [d for d in dataset_registry.values() if d.dataset_id == dataset_id]


@app.post("/datasets/{dataset_id}/v/{version}/trigger-l2")
async def trigger_l2_audit(dataset_id: str, version: str):
    if version != "v2":
        raise HTTPException(status_code=400, detail="trigger-l2 only supports version v2")

    key = f"{dataset_id}:{version}"
    if key not in dataset_registry:
        raise HTTPException(status_code=404, detail="Dataset version not found")

    mean_v1 = pipeline.vdb.get_mean_vector(dataset_id, "v1")
    mean_v2 = pipeline.vdb.get_mean_vector(dataset_id, "v2")
    if mean_v1 is None or mean_v2 is None:
        raise HTTPException(
            status_code=400,
            detail="Missing vector data. Both v1 and v2 vectors must exist in Qdrant.",
        )

    cosine_mean_shift = cosine_distance(mean_v1, mean_v2)
    drift_stats = {"cosine_mean_shift": float(cosine_mean_shift)}

    outlier_samples = pipeline.vdb.get_outlier_samples(
        dataset_id=dataset_id,
        version="v2",
        mean_v1=mean_v1,
        mean_v2=mean_v2,
        limit=5,
    )
    if len(outlier_samples) < 3:
        raise HTTPException(status_code=400, detail="Need at least 3 outlier samples for L2 audit")

    sample_images = [item["image_url"] for item in outlier_samples]
    sample_captions = [item["caption"] for item in outlier_samples]

    # Try Gemini Audit with fallback handling
    try:
        audit_result = await gemini_svc.audit_dataset(
            drift_stats,
            sample_images,
            sample_captions,
            outlier_context=outlier_samples,
        )
        return await update_l2_audit(dataset_id, version, audit_result)
    except Exception as e:
        logging.error(f"Gemini L2 Audit Failed for {dataset_id}:{version}: {e}")
        
        # Fallback: Mark as WARN and record the failure
        ds = dataset_registry.get(key)
        if ds:
            apply_status(
                ds, 
                StatusEnum.WARN, 
                "L2",
                reason=f"Semantic Audit failed due to AI Service Error: {str(e)[:100]}"
            )
            
            # Create a fallback L2 report with the error
            from api.models import L2Reasoning, ReasoningTrace
            fallback_reasoning = L2Reasoning(
                model_name="gemini-3-flash",
                distribution_drift=drift_stats,
                reasoning_trace=ReasoningTrace(
                    summary="L2 Audit Failed - AI Service Unavailable",
                    key_observations=[
                        f"Gemini API error: {str(e)[:200]}",
                        f"Cosine drift detected: {drift_stats['cosine_mean_shift']:.4f}",
                        "Manual review recommended due to service failure"
                    ],
                    decision_rationale="Service failure prevented automated audit",
                    recommended_action="Investigate manually or retry when service is available"
                ),
                judgment_summary=f"Service Error: {str(e)[:100]}",
                flagged_samples=[],
                confidence_score=0.0,
                l2_status=StatusEnum.WARN
            )
            ds.l2_reasoning = fallback_reasoning
        
        raise HTTPException(
            status_code=503, 
            detail=f"L2 Audit failed: {str(e)}. Dataset marked as WARN."
        )


@app.get("/datasets/{dataset_id}/v/{version}/outliers")
async def get_outlier_samples_with_metadata(
    dataset_id: str,
    version: str,
    limit: int = 10
):
    """Get outlier samples with full metadata including images"""
    # For v2, compare with v1
    prev_version = "v1" if version == "v2" else None
    
    if not prev_version:
        raise HTTPException(400, "Outlier detection requires a previous version (currently only supports v2)")
    
    mean_v1 = pipeline.vdb.get_mean_vector(dataset_id, prev_version)
    mean_v2 = pipeline.vdb.get_mean_vector(dataset_id, version)
    
    if not mean_v1 or not mean_v2:
        raise HTTPException(400, "Missing vector data for outlier detection")
    
    outliers = pipeline.vdb.get_outlier_samples(
        dataset_id, version, mean_v1, mean_v2, limit
    )
    
    return outliers


@app.get("/datasets/{dataset_id}/v/{version}/samples")
async def list_samples(
    dataset_id: str,
    version: str,
    limit: int = 100,
    offset: int = 0
):
    """List all samples for a dataset version"""
    samples_tuple = pipeline.vdb.get_samples(dataset_id, version, limit=limit)
    sample_images, sample_captions = samples_tuple
    
    # Convert to list of dictionaries with metadata
    samples = [
        {
            "image_url": img,
            "caption": cap,
            "source_id": dataset_id,  # Could be enhanced with actual source_id from payload
            "image_fetch_status": "success",
            "fallback_used": False
        }
        for img, cap in zip(sample_images, sample_captions)
    ]
    
    return samples[offset:offset+limit] if offset > 0 else samples


@app.post("/datasets/{dataset_id}/v/{version}/manual-override")
async def manual_override_status(
    dataset_id: str,
    version: str,
    override_status: StatusEnum
):
    """Manual override for dataset status"""
    key = f"{dataset_id}:{version}"
    ds = dataset_registry.get(key)
    
    if not ds:
        raise HTTPException(404, "Dataset not found")
    
    # Don't allow manual override if L1 blocked
    if ds.status == StatusEnum.BLOCK and ds.status_source == "L1":
        raise HTTPException(
            400, 
            "Cannot override L1 BLOCK status. Please fix the underlying issues."
        )
    
    apply_status(
        ds, 
        override_status, 
        "MANUAL",
        reason=f"Manual override to {override_status}"
    )
    
    return ds


@app.post("/datasets/{dataset_id}/v/{version}/reingest")
async def trigger_reingest(
    dataset_id: str,
    version: str,
    background_tasks: BackgroundTasks
):
    """Trigger re-ingestion of a dataset version"""
    key = f"{dataset_id}:{version}"
    ds = dataset_registry.get(key)
    
    if not ds:
        raise HTTPException(404, "Dataset not found")
    
    # Reset status to VALIDATING
    apply_status(ds, StatusEnum.VALIDATING, "SYSTEM", reason="Re-ingestion triggered")
    
    # In a real implementation, this would trigger the actual re-ingestion
    # For now, we just update the status
    logging.info(f"Re-ingestion triggered for {dataset_id}:{version}")
    
    return {"message": "Re-ingestion triggered successfully", "dataset": ds}


@app.get("/datasets/stats")
async def get_dataset_statistics():
    """Get overall dataset statistics"""
    all_datasets = list(dataset_registry.values())
    
    stats = {
        "total": len(all_datasets),
        "by_status": {
            "PASS": len([d for d in all_datasets if d.status == StatusEnum.PASS]),
            "WARN": len([d for d in all_datasets if d.status == StatusEnum.WARN]),
            "BLOCK": len([d for d in all_datasets if d.status == StatusEnum.BLOCK]),
            "VALIDATING": len([d for d in all_datasets if d.status == StatusEnum.VALIDATING]),
            "PENDING": len([d for d in all_datasets if d.status == StatusEnum.PENDING]),
        },
        "recent_activity": [
            {
                "dataset_id": d.dataset_id,
                "version": d.version,
                "status": d.status,
                "timestamp": d.created_at
            }
            for d in sorted(all_datasets, key=lambda x: x.created_at, reverse=True)[:10]
        ]
    }
    
    return stats
