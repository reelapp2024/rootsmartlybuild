'use client';

import { useState } from 'react';

/**
 * Simple API caching utility using localStorage
 * Caches API responses to reduce redundant network requests
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiry: number; // milliseconds
}

const CACHE_PREFIX = 'api_cache_';
const DEFAULT_CACHE_TIME = 5 * 60 * 1000; // 5 minutes default

/**
 * Generate cache key from API endpoint and params
 */
function getCacheKey(endpoint: string, params?: Record<string, unknown>): string {
  const paramString = params ? JSON.stringify(params) : '';
  return `${CACHE_PREFIX}${endpoint}_${paramString}`;
}

/**
 * Get cached data if available and not expired
 */
export function getCachedData<T>(endpoint: string, params?: Record<string, unknown>): T | null {
  if (typeof window === 'undefined') return null; // SSR safety

  try {
    const cacheKey = getCacheKey(endpoint, params);
    const cached = localStorage.getItem(cacheKey);
    
    if (!cached) return null;

    const entry: CacheEntry<T> = JSON.parse(cached);
    const now = Date.now();

    // Check if cache is expired
    if (now > entry.timestamp + entry.expiry) {
      localStorage.removeItem(cacheKey);
      return null;
    }

    return entry.data;
  } catch (error) {
    console.error('Error reading cache:', error);
    return null;
  }
}

/**
 * Store data in cache
 */
export function setCachedData<T>(
  endpoint: string,
  data: T,
  params?: Record<string, unknown>,
  cacheTime: number = DEFAULT_CACHE_TIME
): void {
  if (typeof window === 'undefined') return; // SSR safety

  try {
    const cacheKey = getCacheKey(endpoint, params);
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      expiry: cacheTime,
    };

    localStorage.setItem(cacheKey, JSON.stringify(entry));
  } catch (error) {
    console.error('Error setting cache:', error);
    // If storage is full, clear old entries
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      clearOldCache();
    }
  }
}

/**
 * Clear expired cache entries
 */
function clearOldCache(): void {
  if (typeof window === 'undefined') return;

  try {
    const now = Date.now();
    const keysToRemove: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(CACHE_PREFIX)) {
        try {
          const entry = JSON.parse(localStorage.getItem(key) || '{}');
          if (now > entry.timestamp + entry.expiry) {
            keysToRemove.push(key);
          }
        } catch {
          keysToRemove.push(key); // Remove invalid entries
        }
      }
    }

    keysToRemove.forEach((key) => localStorage.removeItem(key));
  } catch (error) {
    console.error('Error clearing old cache:', error);
  }
}

/**
 * Clear all API cache
 */
export function clearApiCache(): void {
  if (typeof window === 'undefined') return;

  try {
    const keysToRemove: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(CACHE_PREFIX)) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach((key) => localStorage.removeItem(key));
  } catch (error) {
    console.error('Error clearing API cache:', error);
  }
}

/**
 * Hook to use cached API calls
 */
export function useCachedApiCall<T>(
  endpoint: string,
  params?: Record<string, unknown>,
  cacheTime: number = DEFAULT_CACHE_TIME
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async (forceRefresh = false) => {
    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const cached = getCachedData<T>(endpoint, params);
      if (cached) {
        setData(cached);
        return cached;
      }
    }

    setLoading(true);
    setError(null);

    try {
      // Import httpFile dynamically to avoid circular dependencies
      const { httpFile } = await import('@/config');
      
      const formData = new FormData();
      if (params) {
        Object.keys(params).forEach((key) => {
          if (params[key] !== undefined && params[key] !== null) {
            formData.append(key, String(params[key]));
          }
        });
      }

      const response = await httpFile.post(endpoint, formData);
      const responseData = response.data?.data || response.data;

      // Cache the response
      setCachedData(endpoint, responseData, params, cacheTime);
      setData(responseData);

      return responseData;
    } catch (err) {
      const apiError = err instanceof Error ? err : new Error('API call failed');
      setError(apiError);
      throw apiError;
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, fetchData, refetch: () => fetchData(true) };
}

