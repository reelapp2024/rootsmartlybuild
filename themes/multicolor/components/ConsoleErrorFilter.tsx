'use client';

import { useEffect } from 'react';

/**
 * Component to filter out expected API errors (404, 400) from console
 * These are handled gracefully in catch blocks and don't need to clutter the console
 */
export function ConsoleErrorFilter() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Store original console.error
    const originalError = console.error;

    // Override console.error to filter expected axios errors
    console.error = (...args: any[]) => {
      // Check all arguments for axios error information
      const errorText = args.map(arg => {
        if (typeof arg === 'string') return arg;
        if (arg?.message) return arg.message;
        if (arg?.toString) return arg.toString();
        return '';
      }).join(' ');

      const isAxiosError = errorText.includes('AxiosError') || 
                          errorText.includes('Request failed with status code') ||
                          (args[0]?.isAxiosError === true) ||
                          (args[0]?.response !== undefined);

      if (isAxiosError) {
        // Try to extract status code from various formats
        let status: number | null = null;
        
        // Check error object directly
        if (args[0]?.response?.status) {
          status = args[0].response.status;
        }
        // Check error message string
        else {
          const statusMatch = errorText.match(/status code (\d+)/i) || 
                             errorText.match(/status (\d+)/i) ||
                             errorText.match(/\((\d+)\)/);
          status = statusMatch ? parseInt(statusMatch[1]) : null;
        }
        
        // Suppress expected errors (404, 400, 500) - they're handled in catch blocks
        // These errors are logged server-side and don't need to clutter the client console
        if (status === 404 || status === 400 || status === 500) {
          return; // Suppress expected errors
        }
      }

      // Log all other errors normally
      originalError.apply(console, args);
    };

    // Cleanup: restore original console.error on unmount
    return () => {
      console.error = originalError;
    };
  }, []);

  return null;
}

