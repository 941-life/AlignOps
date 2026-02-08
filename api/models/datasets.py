from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, List, Literal, Optional

from pydantic import BaseModel, Field


class StatusEnum(str, Enum):
    PENDING = "PENDING"
    VALIDATING = "VALIDATING"
    PASS = "PASS"
    WARN = "WARN"
    BLOCK = "BLOCK"


class L1Report(BaseModel):
    schema_passed: bool
    volume_actual: int
    volume_expected: int
    freshness_delay_sec: int
    l1_status: StatusEnum = StatusEnum.PENDING
    details: Dict[str, Any] = Field(default_factory=dict)


class ReasoningTrace(BaseModel):
    summary: str
    key_observations: List[str]
    decision_rationale: str
    recommended_action: Optional[str] = None


class L2Reasoning(BaseModel):
    model_name: str = "gemini-3-flash"
    distribution_drift: Dict[str, float] = Field(..., description="cosine_mean_shift, etc.")
    reasoning_trace: ReasoningTrace
    judgment_summary: str
    flagged_samples: List[str] = Field(default_factory=list)
    confidence_score: float = Field(..., ge=0.0, le=1.0)
    l2_status: StatusEnum = StatusEnum.PENDING


class StatusHistoryItem(BaseModel):
    status: StatusEnum
    source: Literal["SYSTEM", "L1", "L2", "MANUAL"]
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    reason: Optional[str] = None


class DatasetObject(BaseModel):
    dataset_id: str
    version: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    status: StatusEnum = StatusEnum.PENDING
    status_source: Optional[Literal["SYSTEM", "L1", "L2", "MANUAL"]] = "SYSTEM"
    status_history: List[StatusHistoryItem] = Field(default_factory=list)

    l1_report: Optional[L1Report] = None
    l2_reasoning: Optional[L2Reasoning] = None

    source_id: str
    lineage_parent_version: Optional[str] = None
    tags: List[str] = Field(default_factory=list)

    class Config:
        use_enum_values = True
