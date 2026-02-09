"use client";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import Image from "next/image";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ImageLightboxProps {
  imageUrl: string;
  caption: string;
  isOpen: boolean;
  onClose: () => void;
  metadata?: {
    source_id?: string;
    outlier_score?: number;
    dist_to_v1_mean?: number;
    dist_to_v2_mean?: number;
  };
}

export function ImageLightbox({ 
  imageUrl, 
  caption, 
  isOpen, 
  onClose,
  metadata 
}: ImageLightboxProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
        <div className="relative">
          <DialogTitle className="sr-only">Image Details</DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-0 top-0 z-10"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </Button>
          <div className="mt-8">
            <div className="relative w-full h-[60vh] bg-slate-100 rounded-lg overflow-hidden">
              <Image
                src={imageUrl}
                alt={caption}
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
              />
            </div>
            <div className="mt-6 space-y-4">
              <div>
                <h3 className="text-sm font-medium text-slate-500 mb-2">Caption</h3>
                <p className="text-lg text-slate-900">{caption}</p>
              </div>
              
              {metadata && (
                <div className="pt-4 border-t border-slate-200 space-y-3">
                  {metadata.source_id && (
                    <div>
                      <span className="text-sm font-medium text-slate-500">Source ID: </span>
                      <span className="text-sm text-slate-900 font-mono">{metadata.source_id}</span>
                    </div>
                  )}
                  {metadata.outlier_score !== undefined && (
                    <div>
                      <span className="text-sm font-medium text-slate-500">Outlier Score: </span>
                      <span className="text-sm text-slate-900 font-variant-tabular">
                        {metadata.outlier_score.toFixed(4)}
                      </span>
                    </div>
                  )}
                  {metadata.dist_to_v1_mean !== undefined && (
                    <div>
                      <span className="text-sm font-medium text-slate-500">Distance to V1 Mean: </span>
                      <span className="text-sm text-slate-900 font-variant-tabular">
                        {metadata.dist_to_v1_mean.toFixed(4)}
                      </span>
                    </div>
                  )}
                  {metadata.dist_to_v2_mean !== undefined && (
                    <div>
                      <span className="text-sm font-medium text-slate-500">Distance to V2 Mean: </span>
                      <span className="text-sm text-slate-900 font-variant-tabular">
                        {metadata.dist_to_v2_mean.toFixed(4)}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
