/**
 * Helper function to construct API URLs without duplicating the base path
 * If the base URL already includes /admin/v1, it won't add it again
 */
export function getApiUrl(endpoint: string = ''): string {
  let apiUrl = 'http://localhost:1111';
  
  // Try to get API URL from various sources
  if (typeof window !== 'undefined') {
    if ((window as any).__API_URL__) {
      apiUrl = (window as any).__API_URL__;
    } else if ((window as any).__ENV__?.VITE_API_URL) {
      apiUrl = (window as any).__ENV__.VITE_API_URL;
    }
  }
  
  if (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_URL) {
    apiUrl = (import.meta as any).env.VITE_API_URL;
  }
  
  // Remove trailing slash
  apiUrl = apiUrl.replace(/\/$/, '');
  
  // If no endpoint provided, return base URL
  if (!endpoint) {
    return apiUrl;
  }
  
  // Remove leading slash from endpoint
  endpoint = endpoint.replace(/^\//, '');
  
  // Check if base URL already ends with /admin/v1 (more precise check)
  const hasAdminV1 = /\/admin\/v1\/?$/.test(apiUrl);
  
  // If endpoint starts with admin/v1/, check if base URL already has it
  if (endpoint.startsWith('admin/v1/')) {
    if (hasAdminV1) {
      // Base URL already has /admin/v1, so just use the endpoint without the prefix
      const cleanEndpoint = endpoint.replace(/^admin\/v1\//, '');
      return `${apiUrl}/${cleanEndpoint}`;
    } else {
      // Base URL doesn't have /admin/v1, so add it
      return `${apiUrl}/${endpoint}`;
    }
  }
  
  // For other endpoints, just append
  return `${apiUrl}/${endpoint}`;
}

/**
 * Helper function specifically for admin/v1 endpoints
 * Handles the case where base URL already includes /admin/v1
 */
export function getAdminV1Url(endpoint: string): string {
  // Remove leading slash and admin/v1 prefix if present
  endpoint = endpoint.replace(/^\/?admin\/v1\//, '');
  
  let apiUrl = 'http://localhost:1111';
  
  // Try to get API URL from various sources
  if (typeof window !== 'undefined') {
    if ((window as any).__API_URL__) {
      apiUrl = (window as any).__API_URL__;
    } else if ((window as any).__ENV__?.VITE_API_URL) {
      apiUrl = (window as any).__ENV__.VITE_API_URL;
    }
  }
  
  if (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_URL) {
    apiUrl = (import.meta as any).env.VITE_API_URL;
  }
  
  // Remove trailing slash
  apiUrl = apiUrl.replace(/\/$/, '');
  
  // Check if base URL already ends with /admin/v1
  const hasAdminV1 = /\/admin\/v1\/?$/.test(apiUrl);
  
  if (hasAdminV1) {
    // Base URL already has /admin/v1, so just append the endpoint
    return `${apiUrl}/${endpoint}`;
  } else {
    // Base URL doesn't have /admin/v1, so add it
    return `${apiUrl}/admin/v1/${endpoint}`;
  }
}

