"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { createDatasetVersion } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { Loader2, ChevronRight, AlertCircle, Plus, X } from "lucide-react";
import Link from "next/link";

interface RawDataItem {
  image_url: string;
  caption: string;
  source_id: string;
}

export default function NewDatasetPage() {
  const router = useRouter();
  const [datasetId, setDatasetId] = useState("");
  const [version, setVersion] = useState("");
  const [sourceId, setSourceId] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState("");
  const [rawDataJson, setRawDataJson] = useState("");
  const [rawDataItems, setRawDataItems] = useState<RawDataItem[]>([{ image_url: "", caption: "", source_id: "" }]);
  const [useJsonInput, setUseJsonInput] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const mutation = useMutation({
    mutationFn: createDatasetVersion,
    onSuccess: (data) => {
      toast.success(`Dataset ${data.dataset_id} ${data.version} created successfully!`);
      router.push(`/datasets/${data.dataset_id}`);
    },
    onError: (error: any) => {
      toast.error(`Failed to create dataset: ${error.message}`);
    }
  });

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!datasetId.trim()) {
      newErrors.datasetId = "Dataset ID is required";
    }

    if (!version.trim()) {
      newErrors.version = "Version is required";
    }

    if (!sourceId.trim()) {
      newErrors.sourceId = "Source ID is required";
    }

    if (useJsonInput) {
      if (!rawDataJson.trim()) {
        newErrors.rawDataJson = "Raw data JSON is required";
      } else {
        try {
          JSON.parse(rawDataJson);
        } catch (e) {
          newErrors.rawDataJson = "Invalid JSON format";
        }
      }
    } else {
      const validItems = rawDataItems.filter(item => 
        item.image_url.trim() && item.caption.trim() && item.source_id.trim()
      );
      if (validItems.length === 0) {
        newErrors.rawData = "At least one valid data item is required";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix the errors before submitting");
      return;
    }

    let rawData: RawDataItem[];

    if (useJsonInput) {
      try {
        rawData = JSON.parse(rawDataJson);
      } catch (e) {
        toast.error("Invalid JSON format");
        return;
      }
    } else {
      rawData = rawDataItems.filter(item => 
        item.image_url.trim() && item.caption.trim() && item.source_id.trim()
      );
    }

    mutation.mutate({
      dataset: {
        dataset_id: datasetId,
        version,
        source_id: sourceId,
        tags,
      },
      raw_data: rawData,
    });
  };

  const addTag = () => {
    if (currentTag.trim() && !tags.includes(currentTag.trim())) {
      setTags([...tags, currentTag.trim()]);
      setCurrentTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const addDataItem = () => {
    setRawDataItems([...rawDataItems, { image_url: "", caption: "", source_id: sourceId }]);
  };

  const removeDataItem = (index: number) => {
    setRawDataItems(rawDataItems.filter((_, i) => i !== index));
  };

  const updateDataItem = (index: number, field: keyof RawDataItem, value: string) => {
    const updated = [...rawDataItems];
    updated[index][field] = value;
    setRawDataItems(updated);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-slate-500" aria-label="Breadcrumb">
        <Link
          href="/"
          className="hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded px-1"
        >
          Home
        </Link>
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
        <span className="text-slate-900 font-medium">Create Dataset</span>
      </nav>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Create New Dataset</h1>
        <p className="text-slate-500">
          Define a new dataset version with metadata and raw data samples
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Dataset Metadata */}
        <Card>
          <CardHeader>
            <CardTitle>Dataset Metadata</CardTitle>
            <CardDescription>
              Basic information about your dataset
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dataset-id">
                  Dataset ID <span className="text-rose-600">*</span>
                </Label>
                <Input
                  id="dataset-id"
                  placeholder="e.g., sdv-vision"
                  value={datasetId}
                  onChange={(e) => setDatasetId(e.target.value)}
                  aria-required="true"
                  aria-invalid={!!errors.datasetId}
                  aria-describedby={errors.datasetId ? "dataset-id-error" : undefined}
                />
                {errors.datasetId && (
                  <p id="dataset-id-error" className="text-sm text-rose-600" role="alert">
                    {errors.datasetId}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="version">
                  Version <span className="text-rose-600">*</span>
                </Label>
                <Input
                  id="version"
                  placeholder="e.g., v1"
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  aria-required="true"
                  aria-invalid={!!errors.version}
                />
                {errors.version && (
                  <p className="text-sm text-rose-600" role="alert">{errors.version}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="source-id">
                Source ID <span className="text-rose-600">*</span>
              </Label>
              <Input
                id="source-id"
                placeholder="e.g., camera-01"
                value={sourceId}
                onChange={(e) => setSourceId(e.target.value)}
                aria-required="true"
                aria-invalid={!!errors.sourceId}
              />
              {errors.sourceId && (
                <p className="text-sm text-rose-600" role="alert">{errors.sourceId}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags</Label>
              <div className="flex gap-2">
                <Input
                  id="tags"
                  placeholder="Add a tag and press Enter"
                  value={currentTag}
                  onChange={(e) => setCurrentTag(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                />
                <Button type="button" variant="outline" onClick={addTag}>
                  Add
                </Button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 bg-brand-sage/20 text-brand-forest px-2 py-1 rounded text-sm border border-brand-sage/40"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="hover:text-brand-forest transition-colors"
                        aria-label={`Remove ${tag} tag`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Raw Data */}
        <Card>
          <CardHeader>
            <CardTitle>Raw Data</CardTitle>
            <CardDescription>
              Add sample data items (image URLs and captions)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2 mb-4">
              <Button
                type="button"
                variant={!useJsonInput ? "default" : "outline"}
                size="sm"
                onClick={() => setUseJsonInput(false)}
              >
                Form Input
              </Button>
              <Button
                type="button"
                variant={useJsonInput ? "default" : "outline"}
                size="sm"
                onClick={() => setUseJsonInput(true)}
              >
                JSON Input
              </Button>
            </div>

            {useJsonInput ? (
              <div className="space-y-2">
                <Textarea
                  placeholder={`[\n  {\n    "image_url": "https://example.com/image.jpg",\n    "caption": "Sample caption",\n    "source_id": "camera-01"\n  }\n]`}
                  value={rawDataJson}
                  onChange={(e) => setRawDataJson(e.target.value)}
                  className="font-mono text-sm min-h-[200px]"
                  aria-invalid={!!errors.rawDataJson}
                />
                {errors.rawDataJson && (
                  <p className="text-sm text-rose-600" role="alert">{errors.rawDataJson}</p>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {rawDataItems.map((item, index) => (
                  <div key={index} className="p-4 border border-slate-200 rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium">Item {index + 1}</h4>
                      {rawDataItems.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeDataItem(index)}
                          aria-label={`Remove item ${index + 1}`}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`image-url-${index}`}>Image URL</Label>
                      <Input
                        id={`image-url-${index}`}
                        placeholder="https://example.com/image.jpg"
                        value={item.image_url}
                        onChange={(e) => updateDataItem(index, "image_url", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`caption-${index}`}>Caption</Label>
                      <Input
                        id={`caption-${index}`}
                        placeholder="Describe the image"
                        value={item.caption}
                        onChange={(e) => updateDataItem(index, "caption", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`source-${index}`}>Source ID</Label>
                      <Input
                        id={`source-${index}`}
                        placeholder="camera-01"
                        value={item.source_id}
                        onChange={(e) => updateDataItem(index, "source_id", e.target.value)}
                      />
                    </div>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={addDataItem}
                  className="w-full"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Another Item
                </Button>
                {errors.rawData && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{errors.rawData}</AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex gap-4 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={mutation.isPending}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Dataset
          </Button>
        </div>
      </form>
    </div>
  );
}
