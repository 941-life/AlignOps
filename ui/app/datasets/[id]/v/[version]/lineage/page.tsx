"use client";

import { useQuery } from "@tanstack/react-query";
import { getDatasetVersions } from "@/lib/api-client";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ChevronRight, AlertCircle } from "lucide-react";
import { use, useState } from "react";
import { cn } from "@/lib/utils";

function LineageSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-96" />
      <Skeleton className="h-48" />
    </div>
  );
}

export default function LineagePage({
  params,
}: {
  params: Promise<{ id: string; version: string }>;
}) {
  const { id, version } = use(params);
  const [selectedSource, setSelectedSource] = useState<string | null>(null);

  const { data: versions, isLoading } = useQuery({
    queryKey: ["dataset-versions", id],
    queryFn: () => getDatasetVersions(id),
  });

  const currentVersion = versions?.find((v) => v.version === version);
  const l2 = currentVersion?.l2_reasoning;

  if (!isLoading && !currentVersion) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-slate-500">Version not found.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Mock lineage data - in real app, this would come from API
  const lineageNodes = [
    {
      id: "source",
      label: "Data Source",
      type: "source",
      sources: ["camera-01", "camera-04", "camera-07"],
      errorContribution: selectedSource ? (selectedSource === "camera-04" ? 0.85 : 0.05) : 0.3,
    },
    {
      id: "preprocessing",
      label: "Preprocessing",
      type: "process",
      errorContribution: 0.15,
    },
    {
      id: "current",
      label: `Current (${version})`,
      type: "output",
      errorContribution: 0,
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-slate-500" aria-label="Breadcrumb">
        <Link
          href="/"
          className="hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded px-1"
        >
          Home
        </Link>
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        <Link
          href={`/datasets/${id}`}
          className="hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded px-1"
        >
          {id}
        </Link>
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
        <span className="text-slate-900 font-medium">Lineage: {version}</span>
      </nav>

      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-bold text-slate-900">Lineage & Root Cause Analysis</h1>
          {currentVersion && <StatusBadge status={currentVersion.status} />}
        </div>
        <p className="text-slate-500">
          Trace data flow and identify error sources for {id} {version}
        </p>
      </div>

      {isLoading ? (
        <LineageSkeleton />
      ) : (
        <div className="space-y-6">
          {/* Flow Diagram */}
          <Card>
            <CardHeader>
              <CardTitle>Data Lineage Flow</CardTitle>
              <CardDescription>
                Click on source nodes to filter samples by source ID
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center gap-8 py-8">
                {lineageNodes.map((node, index) => (
                  <div key={node.id} className="flex items-center gap-8">
                    <div className="flex flex-col items-center">
                      <button
                        onClick={() => {
                          if (node.type === "source") {
                            // In real app, this would filter samples
                            setSelectedSource(selectedSource ? null : "camera-04");
                          }
                        }}
                        disabled={node.type !== "source"}
                        className={cn(
                          "relative rounded-lg p-6 border-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                          node.type === "source" &&
                            "cursor-pointer hover:border-brand-sage hover:shadow-md",
                          node.type !== "source" && "cursor-default",
                          node.errorContribution > 0.5
                            ? "bg-brand-coral/10 border-brand-coral/30"
                            : node.errorContribution > 0.2
                              ? "bg-brand-cream/50 border-brand-cream"
                              : "bg-brand-sky/10 border-brand-sky/30"
                        )}
                      >
                        <div className="text-center">
                          <p className="font-semibold text-slate-900 mb-2">{node.label}</p>
                          {node.sources && (
                            <div className="space-y-1 text-xs text-slate-600">
                              {node.sources.map((src) => (
                                <div key={src}>{src}</div>
                              ))}
                            </div>
                          )}
                        </div>
                        {/* Error heatmap indicator */}
                        {node.errorContribution > 0 && (
                          <div className="absolute -top-2 -right-2 bg-brand-coral text-white text-xs px-2 py-1 rounded-full font-medium shadow-md">
                            {(node.errorContribution * 100).toFixed(0)}%
                          </div>
                        )}
                      </button>
                    </div>
                    {index < lineageNodes.length - 1 && (
                      <div className="text-slate-400" aria-hidden="true">
                        →
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Root Cause Analysis Card */}
          {l2?.reasoning_trace.recommended_action && (
            <Card className="border-brand-coral/30 bg-brand-coral/5">
              <CardHeader>
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-brand-coral mt-0.5" aria-hidden="true" />
                  <div className="flex-1">
                    <CardTitle className="text-brand-coral">Root Cause Analysis</CardTitle>
                    <CardDescription className="text-slate-600">
                      Gemini&apos;s conclusion and recommended action
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-white rounded-lg p-4 border border-brand-coral/20">
                  <p className="text-sm text-slate-900 mb-4">
                    <strong>Conclusion:</strong> {l2.reasoning_trace.summary}
                  </p>
                  <p className="text-sm text-slate-900 mb-4">
                    <strong>Recommended Action:</strong> {l2.reasoning_trace.recommended_action}
                  </p>
                  {l2.reasoning_trace.key_observations.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-slate-900 mb-2">
                        Supporting Evidence:
                      </p>
                      <ul className="list-disc list-inside space-y-1 text-sm text-slate-700">
                        {l2.reasoning_trace.key_observations.map((obs, i) => (
                          <li key={i}>{obs}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Sample filtering (if source selected) */}
          {selectedSource && (
            <Card>
              <CardHeader>
                <CardTitle>Filtered Samples</CardTitle>
                <CardDescription>
                  Showing samples from source: <strong>{selectedSource}</strong>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-slate-500">
                  <p className="mb-4">Sample filtering would appear here</p>
                  <Button variant="outline" onClick={() => setSelectedSource(null)}>
                    Clear Filter
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

