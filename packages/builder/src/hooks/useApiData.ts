'use client';

import { useEffect, useState } from 'react';

interface ApiData {
  [key: string]: any;
}

interface UseApiDataOptions {
  enabled?: boolean;
  url?: string;
  method?: 'GET' | 'POST';
  refreshInterval?: number;
  dataPath?: string;
  fallbackToContent?: boolean;
}

export function useApiData<T = any>(
  options: UseApiDataOptions,
  fallbackData?: T
): { data: T | null; loading: boolean; error: Error | null; refetch: () => void } {
  const { enabled, url, method = 'GET', refreshInterval = 0, dataPath, fallbackToContent = true } = options;

  const [data, setData] = useState<T | null>(fallbackData || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    if (!enabled || !url) {
      setData(fallbackData || null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const fetchOptions: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'same-origin', // Only send credentials for same-origin requests
        mode: 'cors', // Explicitly set CORS mode
      };

      const response = await fetch(url, fetchOptions);
      
      // Check if response is opaque (cross-origin without CORS)
      if (response.type === 'opaque' || response.type === 'opaqueredirect') {
        throw new Error('Opaque response blocked - CORS issue');
      }
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const jsonData = await response.json();

      // Extract data using dataPath if provided
      let extractedData = jsonData;
      if (dataPath) {
        const pathParts = dataPath.split('.');
        for (const part of pathParts) {
          if (extractedData && typeof extractedData === 'object' && part in extractedData) {
            extractedData = extractedData[part];
          } else {
            extractedData = null;
            break;
          }
        }
      }

      setData(extractedData || fallbackData || null);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      
      if (fallbackToContent && fallbackData) {
        setData(fallbackData);
      } else {
        setData(null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Set up auto-refresh if interval is provided
    let intervalId: NodeJS.Timeout | null = null;
    if (refreshInterval > 0) {
      intervalId = setInterval(fetchData, refreshInterval);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [enabled, url, method, refreshInterval, dataPath]);

  return { data, loading, error, refetch: fetchData };
}


