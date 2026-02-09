// API Type Definitions matching backend models

export type StatusEnum =
  | "PENDING"
  | "VALIDATING"
  | "PASS"
  | "WARN"
  | "BLOCK";

export type StatusSource = "SYSTEM" | "L1" | "L2" | "MANUAL";

export interface L1Report {
  schema_passed: boolean;
  volume_actual: number;
  volume_expected: number;
  freshness_delay_sec: number;
  l1_status: StatusEnum;
  details?: Record<string, any>;
}

export interface ReasoningTrace {
  summary: string;
  key_observations: string[];
  decision_rationale: string;
  recommended_action?: string;
}

export interface L2Reasoning {
  model_name: string;
  distribution_drift: {
    cosine_mean_shift: number;
    [key: string]: number;
  };
  reasoning_trace: ReasoningTrace;
  judgment_summary: string;
  flagged_samples: string[];
  confidence_score: number;
  l2_status: StatusEnum;
}

export interface StatusHistoryItem {
  status: StatusEnum;
  source: StatusSource;
  timestamp: string;
  reason?: string;
}

export interface DatasetObject {
  dataset_id: string;
  version: string;
  created_at: string;
  status: StatusEnum;
  status_source?: StatusSource;
  status_history: StatusHistoryItem[];
  l1_report?: L1Report;
  l2_reasoning?: L2Reasoning;
  source_id: string;
  lineage_parent_version?: string;
  tags: string[];
}

export interface DatasetSummary {
  dataset_id: string;
  latest_version: string;
  status: StatusEnum;
  status_source?: StatusSource;
  last_evaluated: string;
  total_versions: number;
}

export interface CreateDatasetRequest {
  dataset: Omit<DatasetObject, "created_at" | "status" | "status_history">;
  raw_data: Array<{
    image_url: string;
    caption: string;
    source_id: string;
  }>;
}

export interface OutlierSample {
  image_url: string;
  caption: string;
  source_id: string;
  image_fetch_status?: string;
  fallback_used: boolean;
  dist_to_v2_mean: number;
  dist_to_v1_mean: number;
  outlier_score: number;
}

export interface SampleWithMetadata {
  image_url: string;
  caption: string;
  source_id: string;
  image_fetch_status?: string;
  fallback_used: boolean;
}

export interface DatasetStatistics {
  total: number;
  by_status: {
    PASS: number;
    WARN: number;
    BLOCK: number;
    VALIDATING: number;
    PENDING: number;
  };
  recent_activity: Array<{
    dataset_id: string;
    version: string;
    status: StatusEnum;
    timestamp: string;
  }>;
}

export interface ManualOverrideRequest {
  override_status: StatusEnum;
}
