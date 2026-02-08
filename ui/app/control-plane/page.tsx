"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

export default function ControlPlanePage() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionHistory, setActionHistory] = useState<
    Array<{
      action: string;
      timestamp: string;
      status: "success" | "error";
      message: string;
    }>
  >([
    {
      action: "Manual Override",
      timestamp: "2026-02-07T15:30:00Z",
      status: "success",
      message: "Dataset sdv-vision v1 manually approved for production",
    },
  ]);

  const handleAction = async (actionName: string) => {
    setIsProcessing(true);
    
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    const newAction = {
      action: actionName,
      timestamp: new Date().toISOString(),
      status: "success" as const,
      message: `${actionName} completed successfully`,
    };
    
    setActionHistory([newAction, ...actionHistory]);
    setIsProcessing(false);
  };

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
            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-medium text-slate-900 mb-2">
                  Data Operations
                </h3>
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => handleAction("Re-ingest Dataset")}
                  disabled={isProcessing}
                >
                  {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
                    onClick={() => handleAction("Manual PASS Override")}
                    disabled={isProcessing}
                  >
                    {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Override to PASS
                  </Button>
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => handleAction("Manual BLOCK Override")}
                    disabled={isProcessing}
                  >
                    {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
                  onClick={() => handleAction("Trigger L2 Audit")}
                  disabled={isProcessing}
                >
                  {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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

