"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Loader2, Sparkles, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";

const DEMO_DATA_V1 = [
  { image_url: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b", caption: "A majestic mountain range under a clear blue sky", source_id: "cam_01" },
  { image_url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e", caption: "A peaceful tropical beach with white sand and palm trees", source_id: "cam_02" },
  { image_url: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e", caption: "Sunlight streaming through the trees in a lush green forest", source_id: "cam_01" },
  { image_url: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05", caption: "Foggy morning in the countryside with rolling hills", source_id: "cam_03" },
  { image_url: "https://images.unsplash.com/photo-1501785888041-af3ef285b470", caption: "A calm lake reflecting the surrounding mountains at sunset", source_id: "cam_02" },
];

const DEMO_DATA_V2 = [
  { image_url: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df", caption: "A busy city street with tall buildings and traffic", source_id: "cam_01" },
  { image_url: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000", caption: "Modern architecture with glass windows in a metropolitan area", source_id: "cam_02" },
  { image_url: "https://images.unsplash.com/photo-1493246507139-91e8bef99c17", caption: "Bright neon lights and signs on a city building at night", source_id: "cam_01" },
  { image_url: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b", caption: "A tropical beach with palm trees", source_id: "cam_02" },
  { image_url: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df", caption: "A peaceful mountain landscape with a lake", source_id: "cam_03" },
];

interface DemoLoaderProps {
  onComplete?: () => void;
}

export function DemoLoader({ onComplete }: DemoLoaderProps) {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState("");
  const router = useRouter();

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const loadDemo = async () => {
    setLoading(true);
    setProgress(0);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

    try {
      // Step 1: Create v1
      setCurrentStep("Creating baseline dataset (v1) with nature images...");
      setProgress(20);
      
      const v1Response = await fetch(`${apiUrl}/datasets/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dataset: {
            dataset_id: "demo_vlm_dataset",
            version: "v1",
            source_id: "nature_pipeline",
            tags: ["nature", "demo", "baseline"],
          },
          raw_data: DEMO_DATA_V1,
        }),
      });

      if (!v1Response.ok) throw new Error("Failed to create v1");
      
      // Wait for ingestion
      await sleep(8000);
      setProgress(40);

      // Step 2: Validate v1 L1
      setCurrentStep("Validating v1 quality checks...");
      await fetch(`${apiUrl}/datasets/demo_vlm_dataset/v/v1/validate-l1`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schema_passed: true,
          volume_actual: 5,
          volume_expected: 5,
          freshness_delay_sec: 30,
          l1_status: "PASS",
          details: {},
        }),
      });

      setProgress(50);

      // Step 3: Create v2 (with drift)
      setCurrentStep("Creating new version (v2) with urban images...");
      const v2Response = await fetch(`${apiUrl}/datasets/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dataset: {
            dataset_id: "demo_vlm_dataset",
            version: "v2",
            source_id: "urban_pipeline",
            tags: ["urban", "demo", "drifted"],
          },
          raw_data: DEMO_DATA_V2,
        }),
      });

      if (!v2Response.ok) throw new Error("Failed to create v2");
      
      await sleep(8000);
      setProgress(70);

      // Step 4: Validate v2 L1
      setCurrentStep("Running quality checks on v2...");
      await fetch(`${apiUrl}/datasets/demo_vlm_dataset/v/v2/validate-l1`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schema_passed: true,
          volume_actual: 5,
          volume_expected: 5,
          freshness_delay_sec: 45,
          l1_status: "PASS",
          details: {},
        }),
      });

      setProgress(85);

      // Step 5: Trigger L2 Audit
      setCurrentStep("Running Gemini semantic analysis...");
      await fetch(`${apiUrl}/datasets/demo_vlm_dataset/v/v2/trigger-l2`, {
        method: "POST",
      }).catch(() => {
        // L2 might fail, that's okay for demo
        console.log("L2 audit pending or failed (expected in demo)");
      });

      setProgress(100);
      setCurrentStep("Demo data loaded successfully!");
      
      toast.success("Demo data created! Redirecting to dashboard...");
      
      await sleep(1500);
      
      if (onComplete) {
        onComplete();
      } else {
        router.push("/?demo=true");
        router.refresh();
      }
    } catch (error) {
      console.error("Demo load error:", error);
      toast.error("Failed to load demo data. Please check if the backend is running.");
      setCurrentStep("Error loading demo data");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-brand-sage/30 bg-gradient-to-br from-white to-brand-sage/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-brand-sage" />
          Try Interactive Demo
        </CardTitle>
        <CardDescription>
          See how AlignOps detects semantic drift between datasets in real-time
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!loading && progress === 0 && (
          <>
            <p className="text-sm text-slate-600">
              This will create two dataset versions:
            </p>
            <ul className="text-sm text-slate-600 space-y-1 ml-4">
              <li>• <strong>v1</strong>: Nature scenes (baseline)</li>
              <li>• <strong>v2</strong>: Urban scenes (with intentional drift)</li>
              <li>• Gemini will analyze the semantic shift automatically</li>
            </ul>
            <Button 
              onClick={loadDemo} 
              className="w-full"
              size="lg"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Load Demo Data (30 seconds)
            </Button>
          </>
        )}

        {loading && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-brand-sage" />
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-900">{currentStep}</p>
                <Progress value={progress} className="mt-2" />
              </div>
            </div>
            <p className="text-xs text-slate-500 text-center">
              {progress}% complete • This may take 20-30 seconds
            </p>
          </div>
        )}

        {!loading && progress === 100 && (
          <div className="flex items-center gap-3 text-brand-forest">
            <CheckCircle2 className="h-5 w-5" />
            <p className="text-sm font-medium">{currentStep}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
