"use client";

import { useQuery } from "@tanstack/react-query";
import { listAllDatasets } from "@/lib/api-client";
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
import Link from "next/link";
import { useState } from "react";
import type { StatusEnum } from "@/lib/types";
import { useSearchParams, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

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

export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlFilter = (searchParams.get("status") as FilterStatus) || "ALL";
  const [filter, setFilter] = useState<FilterStatus>(urlFilter);

  const { data: datasets, isLoading } = useQuery({
    queryKey: ["datasets"],
    queryFn: listAllDatasets,
  });

  const filteredDatasets = datasets?.filter((ds) => {
    if (filter === "ALL") return true;
    return ds.status === filter;
  });

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
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              Datasets Control Tower
            </h1>
            <p className="text-slate-500">
              {datasets?.length || 0} total datasets
              {blockCount > 0 && (
                <span className="ml-2">
                  &bull; <span className="text-rose-700 font-medium">{blockCount} blocked</span>
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Filter buttons */}
        <div className="flex gap-2 mb-6" role="group" aria-label="Filter datasets by status">
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

      {isLoading ? (
        <DashboardSkeleton />
      ) : !filteredDatasets || filteredDatasets.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-slate-500">
              {filter === "ALL"
                ? "No datasets found. Create your first dataset to get started."
                : `No datasets with status "${filter}".`}
            </p>
          </CardContent>
        </Card>
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
                      dataset.status === "BLOCK" && "bg-rose-50 hover:bg-rose-50/80"
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
                      {dataset.latest_version}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={dataset.status} />
                    </TableCell>
                    <TableCell className="text-slate-500">
                      {new Intl.DateTimeFormat("en-US", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      }).format(new Date(dataset.last_evaluated))}
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

