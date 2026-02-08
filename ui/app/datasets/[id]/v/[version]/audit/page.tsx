"use client";

import { useQuery } from "@tanstack/react-query";
import { getDatasetVersions } from "@/lib/api-client";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis } from "recharts";

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
  params: { id: string; version: string };
}) {
  const { data: versions, isLoading } = useQuery({
    queryKey: ["dataset-versions", params.id],
    queryFn: () => getDatasetVersions(params.id),
  });

  const currentVersion = versions?.find((v) => v.version === params.version);
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

  const cosineMeanShift = l2?.distribution_drift.cosine_mean_shift || 0;
  const gaugeData = [
    {
      name: "Drift",
      value: cosineMeanShift * 100,
      fill: cosineMeanShift > 0.3 ? "#dc2626" : cosineMeanShift > 0.15 ? "#f59e0b" : "#10b981",
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
          href={`/datasets/${params.id}`}
          className="hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded px-1"
        >
          {params.id}
        </Link>
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
        <span className="text-slate-900 font-medium">Audit: {params.version}</span>
      </nav>

      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-bold text-slate-900">Semantic Audit Report</h1>
          {currentVersion && <StatusBadge status={currentVersion.status} />}
        </div>
        <p className="text-slate-500">
          L2 analysis for {params.id} {params.version}
        </p>
      </div>

      {isLoading ? (
        <AuditSkeleton />
      ) : !l2 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-slate-500">No L2 audit data available for this version.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
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
              <Card className="bg-blue-50 border-blue-200">
                <CardHeader>
                  <CardTitle className="text-blue-900">Gemini Judgment</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-blue-800">{l2.judgment_summary}</p>
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

          {/* Bottom: Flagged Samples */}
          {l2.flagged_samples.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Flagged Samples</CardTitle>
                <CardDescription>
                  Samples identified with high anomaly scores
                </CardDescription>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

