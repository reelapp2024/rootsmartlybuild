
import { useState, useEffect, useCallback, useMemo } from 'react';
import { httpFile } from '../config.js';
import { apiCache } from '../services/apiCache.js';

export const useHeaderData = (params = {}) => {
  const [data, setData] = useState({
    phoneNumber: '',
    projectName: '',
    projectCategory: '',
    projectFasFA: 'fa-mobile-alt',
    projectSlogan: '',
    services: [],
    locations: []
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
      const formData = new FormData();
      formData.append('projectId', projectId);

      const cacheKey = apiCache.generateCacheKey('/webapp/v1/getheader', { projectId });
      const cachedData = apiCache.getCachedData(cacheKey);

      // If we have cached data and not forcing refresh, use it
      if (cachedData && !forceRefresh) {
        setData({
          phoneNumber: cachedData.data.projectInfo?.phoneNumber || '(555) 123-4567',
          projectName: cachedData.data.projectInfo?.projectName || 'Your Business',
          projectCategory: cachedData.data.projectInfo?.projectCategory || 'Service',
          projectFasFA: cachedData.data.projectInfo?.defaultFasFaIcon || 'fa-mobile-alt',
          projectSlogan: cachedData.data.projectInfo?.projectSlogan || 'Professional Service',
          services: cachedData.data.services || [],
          locations: cachedData.data.locations || []
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
      const response = await httpFile.post('/webapp/v1/getheader', formData, {
        headers
      });

      // If response is 304 (Not Modified), use cached data
      if (response.status === 304) {
        console.log('Using cached header data - ETag match');
        if (cachedData) {
          setData({
            phoneNumber: cachedData.data.projectInfo?.phoneNumber || '(555) 123-4567',
            projectName: cachedData.data.projectInfo?.projectName || 'Your Business',
            projectCategory: cachedData.data.projectInfo?.projectCategory || 'Service',
            projectFasFA: cachedData.data.projectInfo?.defaultFasFaIcon || 'fa-mobile-alt',
            projectSlogan: cachedData.data.projectInfo?.projectSlogan || 'Professional Service',
            services: cachedData.data.services || [],
            locations: cachedData.data.locations || []
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
      const headerData = {
        phoneNumber: responseData.projectInfo?.phoneNumber || '(555) 123-4567',
        projectName: responseData.projectInfo?.projectName || 'Your Business',
        projectCategory: responseData.projectInfo?.projectCategory || 'Service',
        projectFasFA: responseData.projectInfo?.defaultFasFaIcon || 'fa-mobile-alt',
        projectSlogan: responseData.projectInfo?.projectSlogan || 'Professional Service',
        services: responseData.services || [],
        locations: responseData.locations || []
      };

      setData(headerData);
      setIsLoading(false);
      setError(null);

      // Notify other components using the same cache key
      apiCache.notifySubscribers(cacheKey, responseData);

    } catch (err) {
      console.error("Error fetching header data:", err);
      setError(err);
      setIsLoading(false);
    }
  }, [memoizedParams, getProjectId]);

  useEffect(() => {
    const projectId = getProjectId();
    const cacheKey = apiCache.generateCacheKey('/webapp/v1/getheader', { projectId });

    // Subscribe to cache updates
    const unsubscribe = apiCache.subscribe(cacheKey, (cachedData) => {
      setData({
        phoneNumber: cachedData.projectInfo?.phoneNumber || '(555) 123-4567',
        projectName: cachedData.projectInfo?.projectName || 'Your Business',
        projectCategory: cachedData.projectInfo?.projectCategory || 'Service',
        projectFasFA: cachedData.projectInfo?.defaultFasFaIcon || 'fa-mobile-alt',
        projectSlogan: cachedData.projectInfo?.projectSlogan || 'Professional Service',
        services: cachedData.services || [],
        locations: cachedData.locations || []
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
        phoneNumber: cachedData.data.projectInfo?.phoneNumber || '(555) 123-4567',
        projectName: cachedData.data.projectInfo?.projectName || 'Your Business',
        projectCategory: cachedData.data.projectInfo?.projectCategory || 'Service',
        projectFasFA: cachedData.data.projectInfo?.defaultFasFaIcon || 'fa-mobile-alt',
        projectSlogan: cachedData.data.projectInfo?.projectSlogan || 'Professional Service',
        services: cachedData.data.services || [],
        locations: cachedData.data.locations || []
      });
      setIsLoading(false);
      setError(null);
    }

    return unsubscribe;
  }, [fetchData, getProjectId]);

  return {
    ...data,
    isLoading,
    error,
    refetch: () => fetchData(true)
  };
};
