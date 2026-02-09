"use client";

import { useQuery } from "@tanstack/react-query";
import { listAllDatasets, getDatasetStats } from "@/lib/api-client";
import { useAllDatasetsPolling, useDatasetStatsPolling } from "@/hooks/use-polling";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { StatCard } from "@/components/stat-card";
import { EmptyState } from "@/components/empty-state";
import Link from "next/link";
import { Suspense, useState, useMemo } from "react";
import type { StatusEnum } from "@/lib/types";
import { useSearchParams, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { CheckCircle, AlertTriangle, XCircle, Database, Search, RefreshCw, Play, ArrowRight } from "lucide-react";
import { DemoLoader } from "@/components/demo-loader";

type FilterStatus = "ALL" | StatusEnum;

function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-9 w-20" />
        ))}
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlFilter = (searchParams.get("status") as FilterStatus) || "ALL";
  const [filter, setFilter] = useState<FilterStatus>(urlFilter);
  const [searchQuery, setSearchQuery] = useState("");

  // Real-time polling for datasets (every 3 seconds)
  const { data: datasets, isLoading, isPolling } = useAllDatasetsPolling({
    interval: 3000,
    enabled: true,
  });

  // Real-time polling for stats (every 5 seconds)
  const { data: stats, isPolling: isStatsPolling } = useDatasetStatsPolling({
    interval: 5000,
    enabled: true,
  });

  const filteredDatasets = useMemo(() => {
    return datasets?.filter((ds) => {
      // Status filter
      if (filter !== "ALL" && ds.status !== filter) return false;
      
      // Search filter
      if (searchQuery && !ds.dataset_id.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      
      return true;
    });
  }, [datasets, filter, searchQuery]);

  const blockCount = datasets?.filter((ds) => ds.status === "BLOCK").length || 0;

  const handleFilterChange = (newFilter: FilterStatus) => {
    setFilter(newFilter);
    const params = new URLSearchParams(searchParams.toString());
    if (newFilter === "ALL") {
      params.delete("status");
    } else {
      params.set("status", newFilter);
    }
    router.push(`/?${params.toString()}`);
  };

  const filters: { value: FilterStatus; label: string }[] = [
    { value: "ALL", label: "All" },
    { value: "PASS", label: "Pass" },
    { value: "WARN", label: "Warn" },
    { value: "BLOCK", label: "Block" },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-slate-900">
                Datasets Control Tower
              </h1>
              {(isPolling || isStatsPolling) && (
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <RefreshCw className="h-4 w-4 animate-spin text-brand-sage" aria-hidden="true" />
                  <span className="text-xs">Live</span>
                </div>
              )}
            </div>
            <p className="text-slate-500">
              Monitor and manage dataset validation status (auto-refreshes every 3s)
            </p>
          </div>
          <Button asChild>
            <Link href="/datasets/new">
              Create Dataset
            </Link>
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <StatCard 
            title="Total Datasets" 
            value={stats?.total || datasets?.length || 0}
            icon={Database}
            color="blue"
          />
          <StatCard 
            title="Pass" 
            value={stats?.by_status.PASS || datasets?.filter(d => d.status === "PASS").length || 0}
            icon={CheckCircle}
            color="emerald"
          />
          <StatCard 
            title="Warn" 
            value={stats?.by_status.WARN || datasets?.filter(d => d.status === "WARN").length || 0}
            icon={AlertTriangle}
            color="amber"
          />
          <StatCard 
            title="Block" 
            value={stats?.by_status.BLOCK || blockCount}
            icon={XCircle}
            color="rose"
          />
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" aria-hidden="true" />
            <Input
              placeholder="Search datasets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              aria-label="Search datasets"
            />
          </div>
          <div className="flex gap-2" role="group" aria-label="Filter datasets by status">
            {filters.map((f) => (
              <Button
                key={f.value}
                variant={filter === f.value ? "default" : "outline"}
                size="sm"
                onClick={() => handleFilterChange(f.value)}
                aria-pressed={filter === f.value}
              >
                {f.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {isLoading ? (
        <DashboardSkeleton />
      ) : !filteredDatasets || filteredDatasets.length === 0 ? (
        <div className="space-y-8">
          {/* Hero Section for first-time visitors */}
          {filter === "ALL" && !searchQuery && (
            <>
              <Card className="border-2 border-brand-sage/20 bg-gradient-to-br from-white via-brand-sage/5 to-brand-sky/5">
                <CardContent className="pt-12 pb-12">
                  <div className="max-w-3xl mx-auto text-center space-y-6">
                    <div className="inline-block p-3 bg-brand-sage/10 rounded-full mb-4">
                      <Play className="h-8 w-8 text-brand-sage" />
                    </div>
                    <h1 className="text-4xl font-bold text-slate-900 mb-4">
                      Welcome to AlignOps
                    </h1>
                    <p className="text-xl text-slate-600 mb-6">
                      Automated Dataset Quality Control with AI-Powered Semantic Drift Detection
                    </p>
                    <div className="grid md:grid-cols-3 gap-6 text-left mt-8">
                      <div className="space-y-2">
                        <div className="text-3xl font-bold text-brand-sage">L1</div>
                        <div className="text-sm font-medium text-slate-900">Schema Validation</div>
                        <div className="text-xs text-slate-500">Automatic checks for data quality, volume, and freshness</div>
                      </div>
                      <div className="space-y-2">
                        <div className="text-3xl font-bold text-brand-sky">L2</div>
                        <div className="text-sm font-medium text-slate-900">Semantic Analysis</div>
                        <div className="text-xs text-slate-500">Gemini AI detects meaning shifts between versions</div>
                      </div>
                      <div className="space-y-2">
                        <div className="text-3xl font-bold text-brand-forest">RCA</div>
                        <div className="text-sm font-medium text-slate-900">Root Cause Analysis</div>
                        <div className="text-xs text-slate-500">Pinpoint exact sources of data drift</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Demo Loader */}
              <div className="max-w-2xl mx-auto">
                <DemoLoader onComplete={() => router.refresh()} />
              </div>

              {/* Alternative: Manual Creation */}
              <Card>
                <CardHeader>
                  <CardTitle>Or Create Your Own Dataset</CardTitle>
                  <CardDescription>
                    Upload your own data to start validation
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild variant="outline" className="w-full" size="lg">
                    <Link href="/datasets/new">
                      <Database className="mr-2 h-4 w-4" />
                      Create Custom Dataset
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </>
          )}

          {/* Filtered empty state */}
          {(filter !== "ALL" || searchQuery) && (
            <EmptyState
              icon={Database}
              title="No matching datasets"
              description={
                searchQuery
                  ? `No datasets matching "${searchQuery}". Try a different search term.`
                  : `No datasets with status "${filter}". Try a different filter.`
              }
            />
          )}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Dataset Overview</CardTitle>
            <CardDescription>
              Monitor and manage dataset validation status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dataset Name</TableHead>
                  <TableHead>Latest Version</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Evaluated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDatasets.map((dataset) => (
                  <TableRow
                    key={dataset.dataset_id}
                    className={cn(
                      dataset.status === "BLOCK" && "bg-brand-coral/5 hover:bg-brand-coral/10"
                    )}
                  >
                    <TableCell className="font-medium">
                      <Link
                        href={`/datasets/${dataset.dataset_id}`}
                        className="hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
                      >
                        {dataset.dataset_id}
                      </Link>
                    </TableCell>
                    <TableCell className="font-variant-tabular">
                      {dataset.version}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={dataset.status} />
                    </TableCell>
                    <TableCell className="text-slate-500">
                      {new Intl.DateTimeFormat("en-US", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      }).format(new Date(dataset.created_at))}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/datasets/${dataset.dataset_id}`}>
                          View Analytics
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-8">
          <DashboardSkeleton />
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}

