import type {
  DatasetObject,
  DatasetSummary,
  CreateDatasetRequest,
  L1Report,
  L2Reasoning,
} from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: "Unknown error" }));
    throw new ApiError(response.status, errorData.detail || response.statusText);
  }

  return response.json();
}

// API Client Functions

export async function listAllDatasets(): Promise<DatasetSummary[]> {
  return fetchApi<DatasetSummary[]>("/datasets/");
}

export async function getDatasetVersions(datasetId: string): Promise<DatasetObject[]> {
  return fetchApi<DatasetObject[]>(`/datasets/${datasetId}`);
}

export async function createDatasetVersion(
  request: CreateDatasetRequest
): Promise<DatasetObject> {
  return fetchApi<DatasetObject>("/datasets/", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

export async function updateL1Validation(
  datasetId: string,
  version: string,
  report: L1Report
): Promise<DatasetObject> {
  return fetchApi<DatasetObject>(`/datasets/${datasetId}/v/${version}/validate-l1`, {
    method: "PATCH",
    body: JSON.stringify(report),
  });
}

export async function updateL2Audit(
  datasetId: string,
  version: string,
  audit: L2Reasoning
): Promise<DatasetObject> {
  return fetchApi<DatasetObject>(`/datasets/${datasetId}/v/${version}/audit-l2`, {
    method: "PATCH",
    body: JSON.stringify(audit),
  });
}

export async function triggerL2Audit(
  datasetId: string,
  version: string
): Promise<DatasetObject> {
  return fetchApi<DatasetObject>(`/datasets/${datasetId}/v/${version}/trigger-l2`, {
    method: "POST",
  });
}

// Export the API error for error handling
export { ApiError };

