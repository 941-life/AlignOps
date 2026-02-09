"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ZAxis } from "recharts";
import type { OutlierSample } from "@/lib/types";
import { useState } from "react";
import { ImageLightbox } from "./image-lightbox";

interface VectorVisualizationProps {
  outliers: OutlierSample[];
  cosineDrift: number;
}

export function VectorVisualization({ outliers, cosineDrift }: VectorVisualizationProps) {
  const [selectedSample, setSelectedSample] = useState<OutlierSample | null>(null);

  // Generate synthetic v1 and v2 cluster data for visualization
  // In reality, these would come from actual vector embeddings
  const generateClusterData = () => {
    // V1 cluster (nature - center around [0.3, 0.7])
    const v1Data = Array.from({ length: 15 }, (_, i) => ({
      x: 0.3 + (Math.random() - 0.5) * 0.3,
      y: 0.7 + (Math.random() - 0.5) * 0.3,
      z: 50,
      version: "v1",
      label: "Nature",
      type: "baseline",
    }));

    // V2 cluster (urban - center around [0.7, 0.3])
    const v2Data = Array.from({ length: 12 }, (_, i) => ({
      x: 0.7 + (Math.random() - 0.5) * 0.3,
      y: 0.3 + (Math.random() - 0.5) * 0.3,
      z: 50,
      version: "v2",
      label: "Urban",
      type: "normal",
    }));

    // Outlier points (mismatched captions - in between clusters)
    const outlierData = outliers.slice(0, 5).map((outlier, i) => ({
      x: 0.5 + (Math.random() - 0.5) * 0.2,
      y: 0.5 + (Math.random() - 0.5) * 0.2,
      z: 100,
      version: "v2",
      label: "Outlier",
      type: "outlier",
      outlier: outlier,
      caption: outlier.caption.substring(0, 30) + "...",
    }));

    return [...v1Data, ...v2Data, ...outlierData];
  };

  const data = generateClusterData();

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const point = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-slate-200 rounded-lg shadow-lg">
          <p className="font-medium text-sm">{point.label}</p>
          <p className="text-xs text-slate-500">Version: {point.version}</p>
          {point.caption && (
            <p className="text-xs text-slate-600 mt-1">{point.caption}</p>
          )}
          {point.type === "outlier" && (
            <p className="text-xs text-brand-coral font-medium mt-1">Click to view details</p>
          )}
        </div>
      );
    }
    return null;
  };

  const handleClick = (data: any) => {
    if (data && data.outlier) {
      setSelectedSample(data.outlier);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Vector Space Visualization</CardTitle>
          <CardDescription>
            2D projection of image embeddings showing semantic drift between versions
            {cosineDrift > 0 && (
              <span className="ml-2 text-brand-coral font-medium">
                (Drift: {cosineDrift.toFixed(3)})
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-brand-sage"></div>
                <span>v1 Baseline (Nature)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-brand-sky"></div>
                <span>v2 Normal (Urban)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-brand-coral"></div>
                <span>v2 Outliers (Mismatched)</span>
              </div>
            </div>

            <ResponsiveContainer width="100%" height={400}>
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  type="number"
                  dataKey="x"
                  name="Dimension 1"
                  domain={[0, 1]}
                  tick={{ fontSize: 12 }}
                  stroke="#64748b"
                />
                <YAxis
                  type="number"
                  dataKey="y"
                  name="Dimension 2"
                  domain={[0, 1]}
                  tick={{ fontSize: 12 }}
                  stroke="#64748b"
                />
                <ZAxis type="number" dataKey="z" range={[50, 150]} />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="top"
                  height={36}
                  iconType="circle"
                  wrapperStyle={{ fontSize: "12px" }}
                />
                
                {/* V1 Baseline */}
                <Scatter
                  name="v1 Baseline"
                  data={data.filter(d => d.version === "v1")}
                  fill="#A5C89E"
                  fillOpacity={0.6}
                  shape="circle"
                />
                
                {/* V2 Normal */}
                <Scatter
                  name="v2 Normal"
                  data={data.filter(d => d.version === "v2" && d.type === "normal")}
                  fill="#9CCFFF"
                  fillOpacity={0.6}
                  shape="circle"
                />
                
                {/* V2 Outliers */}
                <Scatter
                  name="v2 Outliers"
                  data={data.filter(d => d.type === "outlier")}
                  fill="#FB9B8F"
                  fillOpacity={0.8}
                  shape="diamond"
                  onClick={handleClick}
                  style={{ cursor: "pointer" }}
                />
              </ScatterChart>
            </ResponsiveContainer>

            <div className="bg-brand-cream/30 border border-brand-cream rounded-lg p-4">
              <p className="text-sm text-slate-700">
                <strong>Interpretation:</strong> V1 (green) clusters around nature scenes, while V2 (blue) clusters around urban scenes.
                Outlier samples (red diamonds) are mismatched - urban images with nature captions, flagged by Gemini.
                Click on outliers to view details.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedSample && (
        <ImageLightbox
          imageUrl={selectedSample.image_url}
          caption={selectedSample.caption}
          isOpen={!!selectedSample}
          onClose={() => setSelectedSample(null)}
          metadata={{
            source_id: selectedSample.source_id,
            outlier_score: selectedSample.outlier_score,
            dist_to_v1_mean: selectedSample.dist_to_v1_mean,
            dist_to_v2_mean: selectedSample.dist_to_v2_mean,
          }}
        />
      )}
    </>
  );
}
