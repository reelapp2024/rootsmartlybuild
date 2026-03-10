
import { useState, useEffect, useCallback, useMemo } from 'react';
import { httpFile } from '../config.js';
import { apiCache } from '../services/apiCache.js';

export const useProcessData = (params = {}) => {
  const [data, setData] = useState({
    projectOurProcess: [],
    projectCategory: 'Service'
  });
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
        pageType: "home",
        ...memoizedParams
      };

      const cacheKey = apiCache.generateCacheKey('/webapp/v1/my_site', requestParams);
      const cachedData = apiCache.getCachedData(cacheKey);

      // If we have cached data and not forcing refresh, use it
      if (cachedData && !forceRefresh) {
        setData({
          projectOurProcess: cachedData.data.projectInfo?.ourProcessSection || [],
          projectCategory: cachedData.data.projectInfo?.projectCategory || 'Service'
        });
        setIsLoading(false);
        setError(null);
        return;
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
        console.log('Using cached process data - ETag match');
        if (cachedData) {
          setData({
            projectOurProcess: cachedData.data.projectInfo?.ourProcessSection || [],
            projectCategory: cachedData.data.projectInfo?.projectCategory || 'Service'
          });
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
      const processData = {
        projectOurProcess: responseData.projectInfo?.ourProcessSection || [],
        projectCategory: responseData.projectInfo?.projectCategory || 'Service'
      };

      setData(processData);
      setIsLoading(false);
      setError(null);

      // Notify other components using the same cache key
      apiCache.notifySubscribers(cacheKey, responseData);

    } catch (err) {
      console.error("Error fetching process data:", err);
      setError(err);
      setIsLoading(false);
    }
  }, [memoizedParams, getProjectId]);

  useEffect(() => {
    const projectId = getProjectId();
    const requestParams = {
      projectId,
      pageType: "home",
      ...memoizedParams
    };

    const cacheKey = apiCache.generateCacheKey('/webapp/v1/my_site', requestParams);

    // Subscribe to cache updates
    const unsubscribe = apiCache.subscribe(cacheKey, (cachedData) => {
      setData({
        projectOurProcess: cachedData.data.projectInfo?.ourProcessSection || [],
        projectCategory: cachedData.data.projectInfo?.projectCategory || 'Service'
      });
      setIsLoading(false);
      setError(null);
    });

    // Initial fetch - only if we don't have cached data
    const cachedData = apiCache.getCachedData(cacheKey);
    if (!cachedData) {
      fetchData();
    } else {
      // Use cached data immediately
      setData({
        projectOurProcess: cachedData.data.projectInfo?.ourProcessSection || [],
        projectCategory: cachedData.data.projectInfo?.projectCategory || 'Service'
      });
      setIsLoading(false);
      setError(null);
    }

    return unsubscribe;
  }, [fetchData, getProjectId, memoizedParams]);

  return {
    ...data,
    isLoading,
    error,
    refetch: () => fetchData(true)
  };
};
