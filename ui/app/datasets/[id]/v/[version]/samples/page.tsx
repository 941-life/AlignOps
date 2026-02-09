"use client";

import { useQuery } from "@tanstack/react-query";
import { getSamples } from "@/lib/api-client";
import { ImageLightbox } from "@/components/image-lightbox";
import { EmptyState } from "@/components/empty-state";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ChevronRight, Image as ImageIcon } from "lucide-react";
import { use, useState } from "react";
import Image from "next/image";
import type { SampleWithMetadata } from "@/lib/types";

function SamplesSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <Skeleton key={i} className="h-64 w-full" />
      ))}
    </div>
  );
}

export default function SamplesPage({
  params,
}: {
  params: Promise<{ id: string; version: string }>;
}) {
  const { id, version } = use(params);
  const [selectedImage, setSelectedImage] = useState<SampleWithMetadata | null>(null);
  const [loadMore, setLoadMore] = useState(false);

  const { data: samples, isLoading } = useQuery({
    queryKey: ["samples", id, version, loadMore],
    queryFn: () => getSamples(id, version, loadMore ? 200 : 100, 0),
    enabled: !!id && !!version,
  });

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
          href={`/datasets/${id}`}
          className="hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded px-1"
        >
          {id}
        </Link>
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
        <span className="text-slate-900 font-medium">Samples: {version}</span>
      </nav>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          Sample Browser
        </h1>
        <p className="text-slate-500">
          Browse all samples in {id} {version}
        </p>
      </div>

      {isLoading ? (
        <SamplesSkeleton />
      ) : !samples || samples.length === 0 ? (
        <EmptyState
          icon={ImageIcon}
          title="No samples found"
          description="This dataset version doesn't have any samples yet. Try ingesting data first."
        />
      ) : (
        <>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>All Samples</CardTitle>
                  <CardDescription>
                    Showing {samples.length} samples
                  </CardDescription>
                </div>
                {!loadMore && samples.length >= 100 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setLoadMore(true)}
                  >
                    Load More
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {samples.map((sample, i) => (
                  <div
                    key={i}
                    className="border border-slate-200 rounded-lg overflow-hidden bg-white hover:shadow-lg hover:border-brand-sky/50 transition-all cursor-pointer group"
                    onClick={() => setSelectedImage(sample)}
                  >
                    <div className="relative w-full h-48 bg-gradient-to-br from-brand-sky/10 to-brand-sage/5">
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
                      <p className="text-sm text-slate-700 line-clamp-2 mb-2">
                        {sample.caption}
                      </p>
                      <p className="text-xs text-slate-500 font-mono">
                        {sample.source_id}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="mt-6 flex gap-4 justify-center">
            <Button variant="outline" asChild>
              <Link href={`/datasets/${id}/v/${version}/audit`}>
                View Audit Report
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/datasets/${id}/v/${version}/lineage`}>
                View Lineage
              </Link>
            </Button>
          </div>
        </>
      )}

      {selectedImage && (
        <ImageLightbox
          imageUrl={selectedImage.image_url}
          caption={selectedImage.caption}
          isOpen={!!selectedImage}
          onClose={() => setSelectedImage(null)}
          metadata={{
            source_id: selectedImage.source_id,
          }}
        />
      )}
    </div>
  );
}
