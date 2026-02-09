"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listAllDatasets, manualOverride, triggerReingestion, triggerL2Audit } from "@/lib/api-client";
import { Loader2, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import type { StatusEnum } from "@/lib/types";

export default function ControlPlanePage() {
  const [selectedDataset, setSelectedDataset] = useState<string>("");
  const [selectedVersion, setSelectedVersion] = useState<string>("");
  const [actionHistory, setActionHistory] = useState<
    Array<{
      action: string;
      timestamp: string;
      status: "success" | "error";
      message: string;
    }>
  >([]);

  const queryClient = useQueryClient();

  const { data: datasets } = useQuery({
    queryKey: ["datasets"],
    queryFn: listAllDatasets,
  });

  const overrideMutation = useMutation({
    mutationFn: ({ datasetId, version, action }: { datasetId: string; version: string; action: StatusEnum }) =>
      manualOverride(datasetId, version, action),
    onSuccess: (data, variables) => {
      toast.success(`Successfully overrode ${variables.datasetId} ${variables.version} to ${variables.action}`);
      queryClient.invalidateQueries({ queryKey: ["datasets"] });
      queryClient.invalidateQueries({ queryKey: ["dataset-versions", variables.datasetId] });
      
      setActionHistory([
        {
          action: `Manual Override to ${variables.action}`,
          timestamp: new Date().toISOString(),
          status: "success",
          message: `Dataset ${variables.datasetId} ${variables.version} manually set to ${variables.action}`,
        },
        ...actionHistory,
      ]);
    },
    onError: (error: any) => {
      toast.error(`Override failed: ${error.message}`);
      setActionHistory([
        {
          action: "Manual Override",
          timestamp: new Date().toISOString(),
          status: "error",
          message: error.message || "Override failed",
        },
        ...actionHistory,
      ]);
    },
  });

  const reingestMutation = useMutation({
    mutationFn: ({ datasetId, version }: { datasetId: string; version: string }) =>
      triggerReingestion(datasetId, version),
    onSuccess: (data, variables) => {
      toast.success(`Re-ingestion triggered for ${variables.datasetId} ${variables.version}`);
      queryClient.invalidateQueries({ queryKey: ["datasets"] });
      queryClient.invalidateQueries({ queryKey: ["dataset-versions", variables.datasetId] });
      
      setActionHistory([
        {
          action: "Re-ingest Dataset",
          timestamp: new Date().toISOString(),
          status: "success",
          message: `Re-ingestion triggered for ${variables.datasetId} ${variables.version}`,
        },
        ...actionHistory,
      ]);
    },
    onError: (error: any) => {
      toast.error(`Re-ingestion failed: ${error.message}`);
    },
  });

  const l2AuditMutation = useMutation({
    mutationFn: ({ datasetId, version }: { datasetId: string; version: string }) =>
      triggerL2Audit(datasetId, version),
    onSuccess: (data, variables) => {
      toast.success(`L2 Audit completed for ${variables.datasetId} ${variables.version}`);
      queryClient.invalidateQueries({ queryKey: ["datasets"] });
      queryClient.invalidateQueries({ queryKey: ["dataset-versions", variables.datasetId] });
      
      setActionHistory([
        {
          action: "Trigger L2 Audit",
          timestamp: new Date().toISOString(),
          status: "success",
          message: `L2 Audit completed for ${variables.datasetId} ${variables.version}`,
        },
        ...actionHistory,
      ]);
    },
    onError: (error: any) => {
      toast.error(`L2 Audit failed: ${error.message}`);
    },
  });

  const handleManualOverride = (action: StatusEnum) => {
    if (!selectedDataset || !selectedVersion) {
      toast.error("Please select a dataset and version");
      return;
    }
    overrideMutation.mutate({ datasetId: selectedDataset, version: selectedVersion, action });
  };

  const handleReingest = () => {
    if (!selectedDataset || !selectedVersion) {
      toast.error("Please select a dataset and version");
      return;
    }
    reingestMutation.mutate({ datasetId: selectedDataset, version: selectedVersion });
  };

  const handleTriggerL2 = () => {
    if (!selectedDataset || !selectedVersion) {
      toast.error("Please select a dataset and version");
      return;
    }
    l2AuditMutation.mutate({ datasetId: selectedDataset, version: selectedVersion });
  };

  const isProcessing = overrideMutation.isPending || reingestMutation.isPending || l2AuditMutation.isPending;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Control Plane</h1>
        <p className="text-slate-500">
          Manage dataset operations and manual interventions
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Dataset Actions</CardTitle>
            <CardDescription>
              Execute operations on dataset versions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Dataset Selection */}
            <div className="space-y-3 pb-4 border-b border-slate-200">
              <div className="space-y-2">
                <Label htmlFor="dataset-select">Dataset</Label>
                <Select value={selectedDataset} onValueChange={setSelectedDataset}>
                  <SelectTrigger id="dataset-select">
                    <SelectValue placeholder="Select a dataset" />
                  </SelectTrigger>
                  <SelectContent>
                    {datasets?.map((ds) => (
                      <SelectItem key={ds.dataset_id} value={ds.dataset_id}>
                        {ds.dataset_id} ({ds.latest_version})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="version-input">Version</Label>
                <Select value={selectedVersion} onValueChange={setSelectedVersion}>
                  <SelectTrigger id="version-input">
                    <SelectValue placeholder="Enter version (e.g., v1, v2)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="v1">v1</SelectItem>
                    <SelectItem value="v2">v2</SelectItem>
                    <SelectItem value="v3">v3</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-medium text-slate-900 mb-2">
                  Data Operations
                </h3>
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={handleReingest}
                  disabled={isProcessing || !selectedDataset || !selectedVersion}
                >
                  {reingestMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Re-ingest Dataset
                </Button>
              </div>

              <div>
                <h3 className="text-sm font-medium text-slate-900 mb-2">
                  Manual Overrides
                </h3>
                <div className="space-y-2">
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => handleManualOverride("PASS")}
                    disabled={isProcessing || !selectedDataset || !selectedVersion}
                  >
                    {overrideMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <CheckCircle className="mr-2 h-4 w-4" aria-hidden="true" />
                    Override to PASS
                  </Button>
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => handleManualOverride("WARN")}
                    disabled={isProcessing || !selectedDataset || !selectedVersion}
                  >
                    {overrideMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <AlertTriangle className="mr-2 h-4 w-4" aria-hidden="true" />
                    Override to WARN
                  </Button>
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => handleManualOverride("BLOCK")}
                    disabled={isProcessing || !selectedDataset || !selectedVersion}
                  >
                    {overrideMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <XCircle className="mr-2 h-4 w-4" aria-hidden="true" />
                    Override to BLOCK
                  </Button>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-slate-900 mb-2">
                  Analysis
                </h3>
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={handleTriggerL2}
                  disabled={isProcessing || !selectedDataset || !selectedVersion}
                >
                  {l2AuditMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Trigger L2 Audit
                </Button>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200">
              <p className="text-xs text-slate-500">
                <strong>Note:</strong> Manual overrides should be used sparingly and documented
                in the action history below.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Action History */}
        <Card>
          <CardHeader>
            <CardTitle>Action History</CardTitle>
            <CardDescription>
              Log of all control plane operations
            </CardDescription>
          </CardHeader>
          <CardContent>
            {actionHistory.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                No actions recorded yet
              </div>
            ) : (
              <div className="space-y-4">
                {actionHistory.map((action, index) => (
                  <div
                    key={index}
                    className="flex gap-3 p-3 rounded-lg border border-slate-200 bg-slate-50"
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      {action.status === "success" ? (
                        <CheckCircle className="h-5 w-5 text-emerald-600" aria-hidden="true" />
                      ) : (
                        <XCircle className="h-5 w-5 text-rose-600" aria-hidden="true" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900">{action.action}</p>
                      <p className="text-sm text-slate-600 mt-1">{action.message}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        {new Intl.DateTimeFormat("en-US", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        }).format(new Date(action.timestamp))}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

