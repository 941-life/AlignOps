"use client";

import { useQuery } from "@tanstack/react-query";
import { getDatasetVersions, getOutlierSamples } from "@/lib/api-client";
import { useDatasetPolling } from "@/hooks/use-polling";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";
import { ImageLightbox } from "@/components/image-lightbox";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis } from "recharts";
import { use, useState } from "react";
import Image from "next/image";
import type { OutlierSample } from "@/lib/types";
import { EmptyState } from "@/components/empty-state";
import { FileQuestion, RefreshCw } from "lucide-react";
import { VectorVisualization } from "@/components/vector-visualization";

function AuditSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Skeleton className="h-96" />
      <Skeleton className="h-96" />
    </div>
  );
}

export default function AuditPage({
  params,
}: {
  params: Promise<{ id: string; version: string }>;
}) {
  const { id, version } = use(params);
  const [selectedImage, setSelectedImage] = useState<OutlierSample | null>(null);

  // Poll for dataset version status changes (stops when PASS, WARN, or BLOCK)
  const { data: currentVersion, isPolling } = useDatasetPolling(id, version, {
    interval: 3000,
    stopOnStatus: ['PASS', 'WARN', 'BLOCK'],
  });

  const { data: versions, isLoading } = useQuery({
    queryKey: ["dataset-versions", id],
    queryFn: () => getDatasetVersions(id),
  });

  const { data: outlierSamples, isLoading: isLoadingOutliers } = useQuery({
    queryKey: ["outliers", id, version],
    queryFn: () => getOutlierSamples(id, version, 10),
    enabled: !!id && !!version,
  });

  // Use polled data if available, otherwise fallback to versions list
  const versionData = currentVersion || versions?.find((v) => v.version === version);
  const l2 = versionData?.l2_reasoning;

  if (!isLoading && !versionData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <EmptyState
          icon={FileQuestion}
          title="Version not found"
          description={`Version ${version} was not found in dataset ${id}. Please check the URL or navigate back to the dataset timeline.`}
          action={{
            label: "Go to Dataset Timeline",
            onClick: () => window.location.href = `/datasets/${id}`
          }}
        />
      </div>
    );
  }

  const cosineMeanShift = l2?.distribution_drift.cosine_mean_shift || 0;
  const gaugeData = [
    {
      name: "Drift",
      value: cosineMeanShift * 100,
      fill: cosineMeanShift > 0.3 ? "#FF5B5B" : cosineMeanShift > 0.15 ? "#F0FFC3" : "#9CCFFF",
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
        <span className="text-slate-900 font-medium">Audit: {version}</span>
      </nav>

      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-bold text-slate-900">Semantic Audit Report</h1>
          {versionData && <StatusBadge status={versionData.status} />}
          {isPolling && (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <RefreshCw className="h-3 w-3 animate-spin text-brand-sage" aria-hidden="true" />
              <span className="text-xs">Polling</span>
            </div>
          )}
        </div>
        <p className="text-slate-500">
          L2 analysis for {id} {version}
        </p>
      </div>

      {isLoading ? (
        <AuditSkeleton />
      ) : !l2 ? (
        <EmptyState
          icon={FileQuestion}
          title="No L2 audit data"
          description="This version hasn't been audited yet. Trigger an L2 audit from the Control Plane to see semantic analysis results."
        />
      ) : (
        <div className="space-y-6">
          {/* Vector Visualization - Full Width */}
          {outlierSamples && outlierSamples.length > 0 && (
            <VectorVisualization 
              outliers={outlierSamples} 
              cosineDrift={cosineMeanShift} 
            />
          )}

          {/* Two-column layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Stats */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Distribution Drift</CardTitle>
                  <CardDescription>Cosine distance between version means</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center">
                    <ResponsiveContainer width="100%" height={200}>
                      <RadialBarChart
                        cx="50%"
                        cy="50%"
                        innerRadius="60%"
                        outerRadius="90%"
                        data={gaugeData}
                        startAngle={180}
                        endAngle={0}
                      >
                        <PolarAngleAxis
                          type="number"
                          domain={[0, 100]}
                          angleAxisId={0}
                          tick={false}
                        />
                        <RadialBar
                          background
                          dataKey="value"
                          cornerRadius={10}
                          strokeWidth={1.5}
                        />
                      </RadialBarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="text-center mt-4">
                    <p className="text-3xl font-bold font-variant-tabular text-slate-900">
                      {cosineMeanShift.toFixed(3)}
                    </p>
                    <p className="text-sm text-slate-500">Cosine Mean Shift</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Model Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Model:</span>
                    <span className="font-medium">{l2.model_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Confidence:</span>
                    <span className="font-medium font-variant-tabular">
                      {(l2.confidence_score * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Flagged Samples:</span>
                    <span className="font-medium font-variant-tabular">
                      {l2.flagged_samples.length}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right: Reasoning */}
            <div className="space-y-6">
              <Card className="bg-brand-sky/10 border-brand-sky/30">
                <CardHeader>
                  <CardTitle className="text-blue-700">Gemini Judgment</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-800">{l2.judgment_summary}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Reasoning Trace</CardTitle>
                  <CardDescription>Step-by-step analysis</CardDescription>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="summary">
                      <AccordionTrigger>Summary</AccordionTrigger>
                      <AccordionContent>
                        <p className="text-sm text-slate-700">{l2.reasoning_trace.summary}</p>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="observations">
                      <AccordionTrigger>Key Observations</AccordionTrigger>
                      <AccordionContent>
                        <ul className="list-disc list-inside space-y-1 text-sm text-slate-700">
                          {l2.reasoning_trace.key_observations.map((obs, i) => (
                            <li key={i}>{obs}</li>
                          ))}
                        </ul>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="rationale">
                      <AccordionTrigger>Decision Rationale</AccordionTrigger>
                      <AccordionContent>
                        <p className="text-sm text-slate-700">
                          {l2.reasoning_trace.decision_rationale}
                        </p>
                      </AccordionContent>
                    </AccordionItem>

                    {l2.reasoning_trace.recommended_action && (
                      <AccordionItem value="action">
                        <AccordionTrigger>Recommended Action</AccordionTrigger>
                        <AccordionContent>
                          <p className="text-sm text-slate-700">
                            {l2.reasoning_trace.recommended_action}
                          </p>
                        </AccordionContent>
                      </AccordionItem>
                    )}
                  </Accordion>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Bottom: Flagged Samples with Images */}
          {(outlierSamples && outlierSamples.length > 0) || (l2.flagged_samples.length > 0) && (
            <Card>
              <CardHeader>
                <CardTitle>Flagged Samples</CardTitle>
                <CardDescription>
                  Samples identified with high anomaly scores
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingOutliers ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <Skeleton key={i} className="h-64 w-full" />
                    ))}
                  </div>
                ) : outlierSamples && outlierSamples.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {outlierSamples.map((sample, i) => (
                      <div
                        key={i}
                        className="border border-brand-coral/20 rounded-lg overflow-hidden bg-white hover:shadow-lg hover:border-brand-coral/40 transition-all cursor-pointer"
                        onClick={() => setSelectedImage(sample)}
                      >
                        <div className="relative w-full h-48 bg-gradient-to-br from-brand-sky/20 to-brand-sage/10">
                          <Image
                            src={sample.image_url}
                            alt={sample.caption}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          />
                        </div>
                        <div className="p-4">
                          <div className="inline-block bg-brand-coral/10 text-brand-coral text-xs px-2 py-1 rounded mb-2 font-medium font-variant-tabular border border-brand-coral/30">
                            Score: {sample.outlier_score.toFixed(3)}
                          </div>
                          <p className="text-sm text-slate-700 line-clamp-2 mb-2">{sample.caption}</p>
                          <p className="text-xs text-slate-500 font-mono">
                            Source: {sample.source_id}
                          </p>
                          <div className="mt-2 pt-2 border-t border-slate-100 text-xs text-slate-500 space-y-1">
                            <div className="flex justify-between font-variant-tabular">
                              <span>Dist to V1:</span>
                              <span>{sample.dist_to_v1_mean.toFixed(3)}</span>
                            </div>
                            <div className="flex justify-between font-variant-tabular">
                              <span>Dist to V2:</span>
                              <span>{sample.dist_to_v2_mean.toFixed(3)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {l2.flagged_samples.map((sample, i) => (
                      <div
                        key={i}
                        className="border border-rose-200 rounded-lg p-4 bg-rose-50/50"
                      >
                        <div className="inline-block bg-rose-100 text-rose-700 text-xs px-2 py-1 rounded mb-2 font-medium">
                          High Anomaly
                        </div>
                        <p className="text-sm text-slate-700 font-medium">{sample}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}
      
      {selectedImage && (
        <ImageLightbox
          imageUrl={selectedImage.image_url}
          caption={selectedImage.caption}
          isOpen={!!selectedImage}
          onClose={() => setSelectedImage(null)}
          metadata={{
            source_id: selectedImage.source_id,
            outlier_score: selectedImage.outlier_score,
            dist_to_v1_mean: selectedImage.dist_to_v1_mean,
            dist_to_v2_mean: selectedImage.dist_to_v2_mean,
          }}
        />
      )}
    </div>
  );
}

