
class ApiCache {
  constructor() {
    this.cache = new Map();
    this.listeners = new Map();
  }

  // Generate cache key from request parameters
  generateCacheKey(endpoint, params) {
    return `${endpoint}_${JSON.stringify(params)}`;
  }

  // Get cached data
  getCachedData(cacheKey) {
    return this.cache.get(cacheKey);
  }

  // Set cached data with ETag
  setCachedData(cacheKey, data, etag) {
    this.cache.set(cacheKey, {
      data,
      etag,
      timestamp: Date.now()
    });
  }

  // Subscribe to cache updates
  subscribe(cacheKey, callback) {
    if (!this.listeners.has(cacheKey)) {
      this.listeners.set(cacheKey, new Set());
    }
    this.listeners.get(cacheKey).add(callback);

    // Return unsubscribe function
    return () => {
      const listeners = this.listeners.get(cacheKey);
      if (listeners) {
        listeners.delete(callback);
        if (listeners.size === 0) {
          this.listeners.delete(cacheKey);
        }
      }
    };
  }

  // Notify all subscribers of cache updates
  notifySubscribers(cacheKey, data) {
    const listeners = this.listeners.get(cacheKey);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  }

  // Clear specific cache entry
  clearCache(cacheKey) {
    this.cache.delete(cacheKey);
  }

  // Clear all cache
  clearAllCache() {
    this.cache.clear();
  }
}

// Create singleton instance
export const apiCache = new ApiCache();
