/**
 * Builder Configuration
 * 
 * This config can be overridden by the parent application
 * or use environment variables for API endpoints.
 */

import axios from 'axios';

// Get API URL from environment or use default
const API_URL = typeof window !== 'undefined' 
  ? (window as any).__API_URL__ || import.meta.env.VITE_API_URL || 'http://localhost:1111'
  : 'http://localhost:1111';

// Create axios instance for API calls
export const http = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to add auth token if available
http.interceptors.request.use(
  (config) => {
    // Try to get token from localStorage (if available)
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Export function to set API URL dynamically
export function setApiUrl(url: string) {
  http.defaults.baseURL = url;
  if (typeof window !== 'undefined') {
    (window as any).__API_URL__ = url;
  }
}

// Export function to set auth token dynamically
export function setAuthToken(token: string | null) {
  if (token) {
    http.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete http.defaults.headers.common['Authorization'];
  }
}
