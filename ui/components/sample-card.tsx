"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import type { SampleWithMetadata, OutlierSample } from "@/lib/types";

interface SampleCardProps {
  sample: SampleWithMetadata | OutlierSample;
  onClick: () => void;
  showOutlierScore?: boolean;
}

export function SampleCard({ sample, onClick, showOutlierScore = false }: SampleCardProps) {
  const outlierSample = showOutlierScore ? sample as OutlierSample : null;
  
  return (
    <div
      className={cn(
        "border rounded-lg overflow-hidden bg-white transition-all cursor-pointer group",
        showOutlierScore
          ? "border-brand-coral/20 hover:shadow-lg hover:border-brand-coral/40"
          : "border-slate-200 hover:shadow-lg hover:border-brand-sky/50"
      )}
      onClick={onClick}
    >
      <div
        className={cn(
          "relative w-full h-48",
          showOutlierScore
            ? "bg-gradient-to-br from-brand-sky/20 to-brand-coral/10"
            : "bg-gradient-to-br from-brand-sky/10 to-brand-sage/5"
        )}
      >
        <Image
          src={sample.image_url}
          alt={sample.caption}
          fill
          className="object-cover group-hover:scale-105 transition-transform"
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
        />
        {sample.fallback_used && (
          <div className="absolute top-2 right-2 bg-brand-cream text-amber-700 text-xs px-2 py-1 rounded border border-amber-200">
            Fallback
          </div>
        )}
      </div>
      <div className="p-3">
        {outlierSample && (
          <div className="inline-block bg-brand-coral/10 text-brand-coral text-xs px-2 py-1 rounded mb-2 font-medium font-variant-tabular border border-brand-coral/30">
            Score: {outlierSample.outlier_score.toFixed(3)}
          </div>
        )}
        <p className="text-sm text-slate-700 line-clamp-2 mb-2">
          {sample.caption}
        </p>
        <p className="text-xs text-slate-500 font-mono">
          {sample.source_id}
        </p>
        {outlierSample && (
          <div className="mt-2 pt-2 border-t border-slate-100 text-xs text-slate-500 space-y-1">
            <div className="flex justify-between font-variant-tabular">
              <span>Dist to V1:</span>
              <span>{outlierSample.dist_to_v1_mean.toFixed(3)}</span>
            </div>
            <div className="flex justify-between font-variant-tabular">
              <span>Dist to V2:</span>
              <span>{outlierSample.dist_to_v2_mean.toFixed(3)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
