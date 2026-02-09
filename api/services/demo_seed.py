"""
Demo data seeder for AlignOps
Automatically creates demo dataset on startup if not exists
"""
import logging
from typing import List, Dict

logger = logging.getLogger(__name__)

DEMO_DATA_V1: List[Dict[str, str]] = [
    {"image_url": "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b", "caption": "A majestic mountain range under a clear blue sky", "source_id": "cam_01"},
    {"image_url": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e", "caption": "A peaceful tropical beach with white sand and palm trees", "source_id": "cam_02"},
    {"image_url": "https://images.unsplash.com/photo-1441974231531-c6227db76b6e", "caption": "Sunlight streaming through the trees in a lush green forest", "source_id": "cam_01"},
    {"image_url": "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05", "caption": "Foggy morning in the countryside with rolling hills", "source_id": "cam_03"},
    {"image_url": "https://images.unsplash.com/photo-1501785888041-af3ef285b470", "caption": "A calm lake reflecting the surrounding mountains at sunset", "source_id": "cam_02"},
]

DEMO_DATA_V2: List[Dict[str, str]] = [
    {"image_url": "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df", "caption": "A busy city street with tall buildings and traffic", "source_id": "cam_01"},
    {"image_url": "https://images.unsplash.com/photo-1449824913935-59a10b8d2000", "caption": "Modern architecture with glass windows in a metropolitan area", "source_id": "cam_02"},
    {"image_url": "https://images.unsplash.com/photo-1493246507139-91e8bef99c17", "caption": "Bright neon lights and signs on a city building at night", "source_id": "cam_01"},
    {"image_url": "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b", "caption": "A tropical beach with palm trees", "source_id": "cam_02"},
    {"image_url": "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df", "caption": "A peaceful mountain landscape with a lake", "source_id": "cam_03"},
]


async def seed_demo_data_if_needed(pipeline, dataset_registry, apply_status):
    """
    Seed demo data on startup if demo_vlm_dataset doesn't exist
    """
    from api.models import DatasetObject, StatusEnum
    
    demo_dataset_id = "demo_vlm_dataset"
    
    # Check if demo dataset already exists
    v1_key = f"{demo_dataset_id}:v1"
    v2_key = f"{demo_dataset_id}:v2"
    
    if v1_key in dataset_registry and v2_key in dataset_registry:
        logger.info("Demo dataset already exists, skipping seed")
        return
    
    logger.info("Demo dataset not found, creating demo data...")
    
    try:
        # Create v1
        if v1_key not in dataset_registry:
            logger.info("Creating demo_vlm_dataset v1...")
            v1_dataset = DatasetObject(
                dataset_id=demo_dataset_id,
                version="v1",
                source_id="nature_pipeline",
                tags=["nature", "demo", "baseline"],
            )
            apply_status(v1_dataset, StatusEnum.VALIDATING, "SYSTEM", reason="Demo dataset v1 created on startup")
            dataset_registry[v1_key] = v1_dataset
            
            # Ingest v1 data
            await pipeline.ingest_data(v1_dataset, DEMO_DATA_V1)
            
            # Validate v1 L1
            from api.models import L1Report
            v1_dataset.l1_report = L1Report(
                schema_passed=True,
                volume_actual=len(DEMO_DATA_V1),
                volume_expected=len(DEMO_DATA_V1),
                freshness_delay_sec=30,
                l1_status=StatusEnum.PASS,
                details={},
            )
            apply_status(v1_dataset, StatusEnum.PASS, "L1", reason="Demo v1 baseline validated")
            logger.info("✓ Demo v1 created and validated")
        
        # Create v2
        if v2_key not in dataset_registry:
            logger.info("Creating demo_vlm_dataset v2...")
            v2_dataset = DatasetObject(
                dataset_id=demo_dataset_id,
                version="v2",
                source_id="urban_pipeline",
                tags=["urban", "demo", "drifted"],
            )
            apply_status(v2_dataset, StatusEnum.VALIDATING, "SYSTEM", reason="Demo dataset v2 created on startup")
            dataset_registry[v2_key] = v2_dataset
            
            # Ingest v2 data
            await pipeline.ingest_data(v2_dataset, DEMO_DATA_V2)
            
            # Validate v2 L1
            from api.models import L1Report
            v2_dataset.l1_report = L1Report(
                schema_passed=True,
                volume_actual=len(DEMO_DATA_V2),
                volume_expected=len(DEMO_DATA_V2),
                freshness_delay_sec=45,
                l1_status=StatusEnum.PASS,
                details={},
            )
            apply_status(v2_dataset, StatusEnum.PASS, "L1", reason="Demo v2 validated, ready for L2 audit")
            logger.info("✓ Demo v2 created and validated")
        
        logger.info("✓ Demo dataset seeding complete!")
        logger.info("  → v1: Nature scenes (baseline)")
        logger.info("  → v2: Urban scenes (with semantic drift)")
        logger.info("  → Trigger L2 audit from UI or API to see Gemini analysis")
        
    except Exception as e:
        logger.error(f"Failed to seed demo data: {e}")
        logger.error("Demo data seeding failed, but server will continue")
