import { useEffect, useState, useRef } from 'react';

/**
 * Fetch API data for a component
 * Handles API URL resolution and caching
 */
export function useComponentApiData(options: {
  projectId?: string;
  apiEndpoint: string; // e.g., '/custom/v1/get_herocomponetdata'
  uniqueId?: string; // Component uniqueId (e.g., 'hero_a')
  enabled?: boolean; // Whether to fetch (default: true)
}) {
  const { projectId, apiEndpoint, uniqueId, enabled = true } = options;
  const [apiData, setApiData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const apiFetchedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled || !projectId || apiFetchedRef.current === projectId) return;
    apiFetchedRef.current = projectId;
    setLoading(true);

    let apiUrl = 'http://localhost:1111';

    // Try to get API URL from various sources
    if (typeof window !== 'undefined') {
      if ((window as any).__API_URL__) {
        apiUrl = (window as any).__API_URL__;
      } else if ((window as any).__ENV__?.VITE_API_URL) {
        apiUrl = (window as any).__ENV__.VITE_API_URL;
      } else if (typeof (window as any).process !== 'undefined' && (window as any).process.env?.NEXT_PUBLIC_API_URL) {
        apiUrl = (window as any).process.env.NEXT_PUBLIC_API_URL;
      }
    }

    // Remove trailing slash
    apiUrl = apiUrl.replace(/\/$/, '');

    // Remove /admin/v1 if it exists in the base URL
    apiUrl = apiUrl.replace(/\/admin\/v1\/?$/, '');

    fetch(`${apiUrl}${apiEndpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId, uniqueId }),
    })
      .then((r) => r.ok ? r.json() : null)
      .then((data: any) => {
        if (data?.success && data?.data) {
          setApiData(data.data);
        } else {
          setApiData(null);
        }
      })
      .catch((error) => {
        console.error(`[API] Error fetching data from ${apiEndpoint}:`, error);
        setApiData(null);
      })
      .finally(() => setLoading(false));
  }, [projectId, apiEndpoint, uniqueId, enabled]);

  return { apiData, loading };
}

