import logging
from typing import Dict, List, Literal

from fastapi import BackgroundTasks, FastAPI, HTTPException

from api.models import DatasetObject, L1Report, L2Reasoning, StatusEnum
from api.services.gemini_svc import GeminiService
from api.services.math_utils import cosine_distance
from api.services.pipeline import DataPipeline

app = FastAPI(title="AlignOps Control Plane API")
pipeline = DataPipeline()
dataset_registry: Dict[str, DatasetObject] = {}
gemini_svc = GeminiService()


# Status transition policy:
# - L1 BLOCK: final block at rule-level. L2 must not override it.
# - L1 PASS: can proceed to L2 auditing.
# - L2 WARN: requires human-in-the-loop decision.
# - L2 BLOCK: blocked by semantic audit.
# - MANUAL PASS: human override to PASS when needed.
def apply_status(ds: DatasetObject, status: StatusEnum, source: Literal["L1", "L2", "MANUAL"]):
    ds.status = status
    ds.status_source = source
    logging.info("Dataset %s status changed to %s by %s", ds.dataset_id, status, source)


async def start_ingestion_task(dataset: DatasetObject, raw_data: List[dict]):
    try:
        await pipeline.process_ingestion(dataset.dataset_id, dataset.version, raw_data)
    except Exception as exc:
        logging.error("Ingestion failed: %s", exc)
        apply_status(dataset, StatusEnum.BLOCK, "L1")


@app.post("/datasets/", response_model=DatasetObject)
async def create_dataset_version(dataset: DatasetObject, raw_data: List[dict], background_tasks: BackgroundTasks):
    key = f"{dataset.dataset_id}:{dataset.version}"
    if key in dataset_registry:
        raise HTTPException(status_code=400, detail="Version already exists")

    dataset.status = StatusEnum.VALIDATING
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
    apply_status(ds, target_status, "L1")
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
    apply_status(ds, audit.l2_status, "L2")
    return ds


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

    try:
        cosine_mean_shift = cosine_distance(mean_v1, mean_v2)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=f"Unable to compute drift: {exc}") from exc

    sample_images, sample_captions = pipeline.vdb.get_samples(dataset_id, "v2", limit=5)
    if not sample_images or not sample_captions:
        raise HTTPException(status_code=400, detail="No v2 samples found for Gemini audit")

    drift_stats = {"cosine_mean_shift": cosine_mean_shift}
    audit_result = await gemini_svc.audit_dataset(drift_stats, sample_images, sample_captions)
    return await update_l2_audit(dataset_id, version, audit_result)
