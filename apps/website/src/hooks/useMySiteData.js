
import { useState, useEffect, useCallback, useMemo } from 'react';
import { httpFile } from '../config.js';
import { apiCache } from '../services/apiCache.js';

export const useMySiteData = (params = {}) => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Memoize params to prevent unnecessary re-renders
  const memoizedParams = useMemo(() => params, [JSON.stringify(params)]);

  // Get project ID from env only
  const getProjectId = useCallback(() => {
    return import.meta.env.VITE_PROJECT_ID;
  }, []);

  const fetchData = useCallback(async (forceRefresh = false) => {
    try {
      const projectId = getProjectId();
      const requestParams = {
        projectId,
        pageType: memoizedParams.pageType || "home",
        ...memoizedParams
      };

      const cacheKey = apiCache.generateCacheKey('/webapp/v1/my_site', requestParams);
      const cachedData = apiCache.getCachedData(cacheKey);

      // If we have cached data and not forcing refresh, use it
      if (cachedData && !forceRefresh) {
        setData(cachedData.data);
        setIsLoading(false);
        setError(null);
        return; // Important: return early to avoid making API call
      }

      // Prepare headers for ETag conditional request
      const headers = {};
      if (cachedData?.etag && !forceRefresh) {
        headers['If-None-Match'] = cachedData.etag;
      }

      // Make API request
      const response = await httpFile.post("/webapp/v1/my_site", requestParams, {
        headers
      });

      // If response is 304 (Not Modified), use cached data
      if (response.status === 304) {
        console.log('Using cached data - ETag match');
        if (cachedData) {
          setData(cachedData.data);
          setIsLoading(false);
          setError(null);
        }
        return;
      }

      // New data received
      const responseData = response.data;
      const etag = response.headers?.etag || response.headers?.ETag;

      // Update cache
      apiCache.setCachedData(cacheKey, responseData, etag);

      // Update state
      setData(responseData);
      setIsLoading(false);
      setError(null);

      // Notify other components using the same cache key
      apiCache.notifySubscribers(cacheKey, responseData);

    } catch (err) {
      console.error("Error fetching my_site data:", err);
      setError(err);
      setIsLoading(false);
    }
  }, [memoizedParams, getProjectId]);

  useEffect(() => {
    const projectId = getProjectId();
    const requestParams = {
      projectId,
      pageType: memoizedParams.pageType || "home",
      ...memoizedParams
    };

    const cacheKey = apiCache.generateCacheKey('/webapp/v1/my_site', requestParams);

    // Subscribe to cache updates
    const unsubscribe = apiCache.subscribe(cacheKey, (cachedData) => {
      setData(cachedData);
      setIsLoading(false);
      setError(null);
    });

    // Initial fetch - only if we don't have cached data
    const cachedData = apiCache.getCachedData(cacheKey);
    if (!cachedData) {
      fetchData();
    } else {
      // Use cached data immediately
      setData(cachedData.data);
      setIsLoading(false);
      setError(null);
    }

    return unsubscribe;
  }, [fetchData, getProjectId, memoizedParams]);

  return {
    data,
    isLoading,
    error,
    refetch: () => fetchData(true)
  };
};
