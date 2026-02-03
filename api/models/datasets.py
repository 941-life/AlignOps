from datetime import datetime, timezone
from enum import Enum
from typing import List, Optional, Dict, Any, Literal
from pydantic import BaseModel, Field

class StatusEnum(str, Enum):
    PENDING = "PENDING"
    VALIDATING = "VALIDATING"
    PASS = "PASS"
    WARN = "WARN"
    BLOCK = "BLOCK"

class L1Report(BaseModel):
    """결정론적 검증 레이어 (Rule-based)"""
    schema_passed: bool
    volume_actual: int
    volume_expected: int
    freshness_delay_sec: int
    l1_status: StatusEnum = StatusEnum.PENDING
    details: Dict[str, Any] = Field(default_factory=dict) 

class ReasoningTrace(BaseModel):
    """Gemini의 구조화된 추론 결과"""
    summary: str
    key_observations: List[str]
    decision_rationale: str
    recommended_action: Optional[str] = None

class L2Reasoning(BaseModel):
    """의미론적 추론 레이어 (Gemini-based)"""
    model_name: str = "gemini-3-flash"
    distribution_drift: Dict[str, float] = Field(..., description="cosine_mean_shift, etc.")
    reasoning_trace: ReasoningTrace
    judgment_summary: str
    flagged_samples: List[str] = Field(default_factory=list)
    confidence_score: float = Field(..., ge=0.0, le=1.0)
    l2_status: StatusEnum = StatusEnum.PENDING

class DatasetObject(BaseModel):
    """최종 데이터셋 객체"""
    dataset_id: str
    version: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    status: StatusEnum = StatusEnum.PENDING
    status_source: Optional[Literal["L1", "L2", "MANUAL"]] = "L1"
    
    l1_report: Optional[L1Report] = None
    l2_reasoning: Optional[L2Reasoning] = None
    
    source_id: str
    lineage_parent_version: Optional[str] = None
    tags: List[str] = Field(default_factory=list)

    class Config:
        use_enum_values = True