"use client";

import { useQuery } from "@tanstack/react-query";
import { getDatasetVersions } from "@/lib/api-client";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

function TimelineSkeleton() {
  return (
    <div className="space-y-6">
      {[1, 2].map((i) => (
        <div key={i} className="flex gap-4">
          <Skeleton className="h-12 w-12 rounded-full flex-shrink-0" />
          <Skeleton className="h-32 flex-1" />
        </div>
      ))}
    </div>
  );
}

export default function DatasetVersionsPage({ params }: { params: { id: string } }) {
  const { data: versions, isLoading } = useQuery({
    queryKey: ["dataset-versions", params.id],
    queryFn: () => getDatasetVersions(params.id),
  });

  const sortedVersions = versions?.sort((a, b) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

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
        <span className="text-slate-900 font-medium">Dataset: {params.id}</span>
      </nav>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Version Timeline</h1>
        <p className="text-slate-500">
          View the history and evolution of dataset {params.id}
        </p>
      </div>

      {isLoading ? (
        <TimelineSkeleton />
      ) : !sortedVersions || sortedVersions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-slate-500">No versions found for this dataset.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="max-w-4xl">
          {/* Timeline */}
          <div className="relative">
            {/* Vertical line */}
            <div
              className="absolute left-6 top-0 bottom-0 w-0.5 bg-slate-200"
              aria-hidden="true"
            />

            {/* Version nodes */}
            <div className="space-y-8">
              {sortedVersions.map((version, index) => {
                const hasL2 = version.l2_reasoning !== undefined;
                const prevVersion = sortedVersions[index + 1];
                const showDriftHint = hasL2 && prevVersion;

                return (
                  <div key={version.version} className="relative">
                    <div className="flex gap-6">
                      {/* Node circle */}
                      <div className="relative flex-shrink-0">
                        <div
                          className={cn(
                            "h-12 w-12 rounded-full border-4 border-white flex items-center justify-center text-sm font-bold shadow-md z-10 relative",
                            version.status === "PASS" && "bg-emerald-100 text-emerald-700",
                            version.status === "WARN" && "bg-amber-100 text-amber-700",
                            version.status === "BLOCK" && "bg-rose-100 text-rose-700",
                            (version.status === "PENDING" || version.status === "VALIDATING") &&
                              "bg-slate-100 text-slate-700"
                          )}
                        >
                          {version.version}
                        </div>
                      </div>

                      {/* Version card */}
                      <Card className="flex-1">
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <CardTitle className="text-xl">{version.version}</CardTitle>
                              <StatusBadge status={version.status} />
                            </div>
                            <div className="text-sm text-slate-500">
                              {new Intl.DateTimeFormat("en-US", {
                                dateStyle: "medium",
                                timeStyle: "short",
                              }).format(new Date(version.created_at))}
                            </div>
                          </div>
                          <CardDescription>
                            Judged by:{" "}
                            <span className="font-medium text-slate-700">
                              {version.status_source || "SYSTEM"}
                            </span>
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          {/* L1 Report Summary */}
                          {version.l1_report && (
                            <div className="mb-4 text-sm">
                              <p className="text-slate-500 mb-2">L1 Validation:</p>
                              <ul className="space-y-1 text-slate-700 font-variant-tabular">
                                <li>
                                  Schema: {version.l1_report.schema_passed ? "✓" : "✗"}
                                </li>
                                <li>
                                  Volume: {version.l1_report.volume_actual} /{" "}
                                  {version.l1_report.volume_expected}
                                </li>
                                <li>
                                  Freshness: {version.l1_report.freshness_delay_sec} sec
                                </li>
                              </ul>
                            </div>
                          )}

                          {/* L2 Reasoning Summary */}
                          {version.l2_reasoning && (
                            <div className="bg-blue-50 rounded-lg p-4 mb-4 border border-blue-100">
                              <p className="text-sm font-medium text-blue-900 mb-2">
                                Gemini Analysis Summary
                              </p>
                              <p className="text-sm text-blue-800">
                                {version.l2_reasoning.judgment_summary}
                              </p>
                            </div>
                          )}

                          {/* Action buttons */}
                          <div className="flex gap-2">
                            {hasL2 && (
                              <>
                                <Button variant="outline" size="sm" asChild>
                                  <Link
                                    href={`/datasets/${params.id}/v/${version.version}/audit`}
                                  >
                                    View Audit Report
                                  </Link>
                                </Button>
                                <Button variant="outline" size="sm" asChild>
                                  <Link
                                    href={`/datasets/${params.id}/v/${version.version}/lineage`}
                                  >
                                    View Lineage
                                  </Link>
                                </Button>
                              </>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Drift hint between versions */}
                    {showDriftHint && (
                      <div className="ml-6 mt-4 mb-4 pl-6">
                        <div className="inline-block bg-slate-100 text-slate-700 text-xs px-3 py-1 rounded-full border border-slate-200">
                          Drift Analysis Available ↓
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

