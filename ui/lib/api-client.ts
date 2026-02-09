import type {
  DatasetObject,
  DatasetSummary,
  CreateDatasetRequest,
  L1Report,
  L2Reasoning,
} from "./types";
import { toast } from "sonner";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: "Unknown error" }));
      const errorMessage = errorData.detail || response.statusText;
      
      // Show toast for errors (except for intentional 404s during polling)
      if (response.status !== 404 || !endpoint.includes("datasets")) {
        toast.error(`Error: ${errorMessage}`);
      }
      
      throw new ApiError(response.status, errorMessage);
    }

    return response.json();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    // Network or other errors
    toast.error("Network error occurred. Please check your connection.");
    throw new Error("Network error");
  }
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

// New API functions for enhanced features
export async function getOutlierSamples(
  datasetId: string,
  version: string,
  limit: number = 10
): Promise<import("./types").OutlierSample[]> {
  return fetchApi<import("./types").OutlierSample[]>(
    `/datasets/${datasetId}/v/${version}/outliers?limit=${limit}`
  );
}

export async function getSamples(
  datasetId: string,
  version: string,
  limit: number = 100,
  offset: number = 0
): Promise<import("./types").SampleWithMetadata[]> {
  return fetchApi<import("./types").SampleWithMetadata[]>(
    `/datasets/${datasetId}/v/${version}/samples?limit=${limit}&offset=${offset}`
  );
}

export async function getDatasetStats(): Promise<import("./types").DatasetStatistics> {
  return fetchApi<import("./types").DatasetStatistics>("/datasets/stats");
}

export async function manualOverride(
  datasetId: string,
  version: string,
  overrideStatus: import("./types").StatusEnum
): Promise<DatasetObject> {
  return fetchApi<DatasetObject>(`/datasets/${datasetId}/v/${version}/manual-override`, {
    method: "POST",
    body: JSON.stringify({ override_status: overrideStatus }),
  });
}

export async function triggerReingestion(
  datasetId: string,
  version: string
): Promise<void> {
  return fetchApi<void>(`/datasets/${datasetId}/v/${version}/reingest`, {
    method: "POST",
  });
}

// Export the API error for error handling
export { ApiError };

