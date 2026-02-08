import { http, HttpResponse } from "msw";
import type { DatasetObject, DatasetSummary } from "@/lib/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Mock data store
const mockDatasets: Record<string, DatasetObject[]> = {
  "sdv-vision": [
    {
      dataset_id: "sdv-vision",
      version: "v1",
      created_at: "2026-02-07T10:00:00Z",
      status: "PASS",
      status_source: "L1",
      status_history: [
        {
          status: "VALIDATING",
          source: "SYSTEM",
          timestamp: "2026-02-07T10:00:00Z",
          reason: "Dataset version created",
        },
        {
          status: "PASS",
          source: "L1",
          timestamp: "2026-02-07T10:15:00Z",
          reason: "schema_passed=true, volume=1000/1000, freshness_delay_sec=60",
        },
      ],
      l1_report: {
        schema_passed: true,
        volume_actual: 1000,
        volume_expected: 1000,
        freshness_delay_sec: 60,
        l1_status: "PASS",
        details: {},
      },
      source_id: "camera-01",
      tags: ["production", "autonomous-driving"],
    },
    {
      dataset_id: "sdv-vision",
      version: "v2",
      created_at: "2026-02-08T10:00:00Z",
      status: "BLOCK",
      status_source: "L2",
      status_history: [
        {
          status: "VALIDATING",
          source: "SYSTEM",
          timestamp: "2026-02-08T10:00:00Z",
          reason: "Dataset version created",
        },
        {
          status: "PASS",
          source: "L1",
          timestamp: "2026-02-08T10:15:00Z",
          reason: "schema_passed=true, volume=1050/1050, freshness_delay_sec=45",
        },
        {
          status: "BLOCK",
          source: "L2",
          timestamp: "2026-02-08T10:30:00Z",
          reason: "BLOCK recommended due to systematic caption-image misalignment",
        },
      ],
      l1_report: {
        schema_passed: true,
        volume_actual: 1050,
        volume_expected: 1050,
        freshness_delay_sec: 45,
        l1_status: "PASS",
        details: {},
      },
      l2_reasoning: {
        model_name: "gemini-2.5-flash",
        distribution_drift: {
          cosine_mean_shift: 0.34,
        },
        reasoning_trace: {
          summary: "Significant semantic drift detected in lighting conditions",
          key_observations: [
            "Caption-image misalignment in lighting conditions",
            "15% of samples show daytime captions with nighttime images",
            "Predominantly from camera-04 source",
          ],
          decision_rationale:
            "The cosine shift of 0.34 exceeds threshold, and manual inspection confirms systematic caption-image mismatch",
          recommended_action: "Review source camera-04 timestamp configuration",
        },
        judgment_summary: "BLOCK recommended due to systematic caption-image misalignment",
        flagged_samples: ["sample_001", "sample_045", "sample_089"],
        confidence_score: 0.92,
        l2_status: "BLOCK",
      },
      source_id: "camera-01",
      lineage_parent_version: "v1",
      tags: ["production", "autonomous-driving"],
    },
  ],
  "object-detection": [
    {
      dataset_id: "object-detection",
      version: "v1",
      created_at: "2026-02-06T14:00:00Z",
      status: "PASS",
      status_source: "L1",
      status_history: [
        {
          status: "VALIDATING",
          source: "SYSTEM",
          timestamp: "2026-02-06T14:00:00Z",
          reason: "Dataset version created",
        },
        {
          status: "PASS",
          source: "L1",
          timestamp: "2026-02-06T14:20:00Z",
          reason: "schema_passed=true, volume=800/800, freshness_delay_sec=30",
        },
      ],
      l1_report: {
        schema_passed: true,
        volume_actual: 800,
        volume_expected: 800,
        freshness_delay_sec: 30,
        l1_status: "PASS",
        details: {},
      },
      source_id: "camera-02",
      tags: ["object-detection", "testing"],
    },
  ],
  "pedestrian-tracking": [
    {
      dataset_id: "pedestrian-tracking",
      version: "v1",
      created_at: "2026-02-05T09:00:00Z",
      status: "WARN",
      status_source: "L2",
      status_history: [
        {
          status: "VALIDATING",
          source: "SYSTEM",
          timestamp: "2026-02-05T09:00:00Z",
          reason: "Dataset version created",
        },
        {
          status: "PASS",
          source: "L1",
          timestamp: "2026-02-05T09:15:00Z",
          reason: "schema_passed=true, volume=500/500, freshness_delay_sec=90",
        },
        {
          status: "WARN",
          source: "L2",
          timestamp: "2026-02-05T09:30:00Z",
          reason: "Moderate drift detected. Human review recommended.",
        },
      ],
      l1_report: {
        schema_passed: true,
        volume_actual: 500,
        volume_expected: 500,
        freshness_delay_sec: 90,
        l1_status: "PASS",
        details: {},
      },
      l2_reasoning: {
        model_name: "gemini-2.5-flash",
        distribution_drift: {
          cosine_mean_shift: 0.18,
        },
        reasoning_trace: {
          summary: "Moderate semantic drift in pedestrian pose distribution",
          key_observations: [
            "Increased proportion of occluded pedestrians",
            "Slight shift in pose distribution",
          ],
          decision_rationale: "Drift is notable but not severe enough for automatic blocking",
          recommended_action: "Human review to assess production impact",
        },
        judgment_summary: "Moderate drift detected. Human review recommended.",
        flagged_samples: ["sample_123", "sample_234"],
        confidence_score: 0.75,
        l2_status: "WARN",
      },
      source_id: "camera-03",
      tags: ["pedestrian", "production"],
    },
  ],
};

export const handlers = [
  // List all datasets
  http.get(`${API_BASE_URL}/datasets/`, () => {
    const summaries: DatasetSummary[] = Object.keys(mockDatasets).map((datasetId) => {
      const versions = mockDatasets[datasetId];
      const latest = versions[versions.length - 1];
      return {
        dataset_id: datasetId,
        latest_version: latest.version,
        status: latest.status,
        status_source: latest.status_source,
        last_evaluated: latest.created_at,
        total_versions: versions.length,
      };
    });
    return HttpResponse.json(summaries);
  }),

  // Get dataset versions
  http.get(`${API_BASE_URL}/datasets/:datasetId`, ({ params }) => {
    const { datasetId } = params;
    const versions = mockDatasets[datasetId as string];
    
    if (!versions) {
      return new HttpResponse(
        JSON.stringify({ detail: "Dataset not found" }),
        { status: 404 }
      );
    }
    
    return HttpResponse.json(versions);
  }),

  // Create dataset version
  http.post(`${API_BASE_URL}/datasets/`, async ({ request }) => {
    const body = await request.json();
    // Mock response
    const newDataset: DatasetObject = {
      ...(body as any).dataset,
      created_at: new Date().toISOString(),
      status: "VALIDATING" as const,
      status_source: "SYSTEM" as const,
      status_history: [
        {
          status: "VALIDATING" as const,
          source: "SYSTEM" as const,
          timestamp: new Date().toISOString(),
          reason: "Dataset version created",
        },
      ],
      tags: (body as any).dataset.tags || [],
    };
    return HttpResponse.json(newDataset);
  }),

  // Trigger L2 audit
  http.post(`${API_BASE_URL}/datasets/:datasetId/v/:version/trigger-l2`, ({ params }) => {
    const { datasetId, version } = params;
    const versions = mockDatasets[datasetId as string];
    
    if (!versions) {
      return new HttpResponse(
        JSON.stringify({ detail: "Dataset not found" }),
        { status: 404 }
      );
    }
    
    const dataset = versions.find((v) => v.version === version);
    if (!dataset) {
      return new HttpResponse(
        JSON.stringify({ detail: "Version not found" }),
        { status: 404 }
      );
    }
    
    return HttpResponse.json(dataset);
  }),
];

