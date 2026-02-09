/**
 * Custom hook for real-time polling of dataset status
 * 
 * Usage:
 * ```tsx
 * const { data, isPolling, stopPolling } = useDatasetPolling(datasetId, version, {
 *   enabled: true,
 *   interval: 3000,
 *   stopOnStatus: ['PASS', 'WARN', 'BLOCK']
 * });
 * ```
 */

import { useEffect, useRef } from 'react';
import { useQuery, useQueryClient, QueryKey } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { DatasetObject, StatusEnum } from '@/lib/types';

export interface PollingOptions {
  enabled?: boolean;
  interval?: number; // milliseconds
  stopOnStatus?: StatusEnum[];
  onStatusChange?: (newStatus: StatusEnum, dataset: DatasetObject) => void;
}

const DEFAULT_OPTIONS: Required<PollingOptions> = {
  enabled: true,
  interval: 3000, // 3 seconds
  stopOnStatus: [],
  onStatusChange: () => {},
};

/**
 * Hook for polling a single dataset version
 */
export function useDatasetPolling(
  datasetId: string | null | undefined,
  version: string | null | undefined,
  options: PollingOptions = {}
) {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const queryClient = useQueryClient();
  const previousStatusRef = useRef<StatusEnum | null>(null);

  const query = useQuery({
    queryKey: ['dataset', datasetId, version] as QueryKey,
    queryFn: async () => {
      if (!datasetId || !version) return null;
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/datasets/${datasetId}/v/${version}`
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch dataset: ${response.statusText}`);
      }
      
      return response.json() as Promise<DatasetObject>;
    },
    enabled: opts.enabled && !!datasetId && !!version,
    refetchInterval: (query) => {
      const data = query.state.data;
      
      // Stop polling if we hit a terminal status
      if (data && opts.stopOnStatus.includes(data.status)) {
        return false;
      }
      
      return opts.interval;
    },
    refetchIntervalInBackground: true, // Continue polling even when tab is not focused
  });

  // Detect status changes and trigger callback
  useEffect(() => {
    if (query.data && query.data.status !== previousStatusRef.current) {
      if (previousStatusRef.current !== null) {
        // Status has changed
        opts.onStatusChange(query.data.status, query.data);
        
        // Show toast notification
        const statusLabel = {
          PASS: 'Passed',
          WARN: 'Warning',
          BLOCK: 'Blocked',
          VALIDATING: 'Validating',
          PENDING: 'Pending',
        }[query.data.status] || 'Updated';
        
        toast.info(
          `Dataset ${datasetId} ${version} - ${statusLabel}`,
          {
            description: query.data.status_history[0]?.reason || 'Status updated',
          }
        );
      }
      
      previousStatusRef.current = query.data.status;
    }
  }, [query.data, datasetId, version, opts]);

  const stopPolling = () => {
    queryClient.cancelQueries({ queryKey: ['dataset', datasetId, version] });
  };

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    isPolling: query.isRefetching,
    refetch: query.refetch,
    stopPolling,
  };
}

/**
 * Hook for polling all datasets (for dashboard)
 */
export function useAllDatasetsPolling(
  options: Omit<PollingOptions, 'stopOnStatus'> = {}
) {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  const query = useQuery({
    queryKey: ['datasets', 'all'] as QueryKey,
    queryFn: async () => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/datasets/`
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch datasets: ${response.statusText}`);
      }
      
      return response.json() as Promise<DatasetObject[]>;
    },
    enabled: opts.enabled,
    refetchInterval: opts.interval,
    refetchIntervalInBackground: true,
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    isPolling: query.isRefetching,
    refetch: query.refetch,
  };
}

/**
 * Hook for polling dataset statistics (for dashboard widgets)
 */
export function useDatasetStatsPolling(options: Omit<PollingOptions, 'stopOnStatus'> = {}) {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  const query = useQuery({
    queryKey: ['datasets', 'stats'] as QueryKey,
    queryFn: async () => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/datasets/stats`
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch stats: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data as {
        total: number;
        by_status: Record<StatusEnum, number>;
        recent_activity: Array<{
          dataset_id: string;
          version: string;
          status: StatusEnum;
          timestamp: string;
        }>;
      };
    },
    enabled: opts.enabled,
    refetchInterval: opts.interval,
    refetchIntervalInBackground: false, // Don't poll stats in background
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    isPolling: query.isRefetching,
    refetch: query.refetch,
  };
}
