'use client';

import { useEffect } from 'react';

/**
 * FontAwesome CDN Loader
 * Loads FontAwesome via CDN instead of bundling entire library
 * Saves ~400KB from bundle size
 */
export default function FontAwesomeLoader() {
  useEffect(() => {
    // Check if FontAwesome is already loaded
    if (document.querySelector('link[href*="font-awesome"]')) {
      return;
    }

    // Create and add FontAwesome CDN link
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css';
    link.integrity = 'sha512-DTOQO9RWCH3ppGqcWaEA1BIZOC6xxalwEsw9c2QQeAIftl+Vegovlnee1c9QX4TctnWMn13TZye+giMm8e2LwA==';
    link.crossOrigin = 'anonymous';
    link.referrerPolicy = 'no-referrer';
    
    document.head.appendChild(link);

    // Cleanup function (though we want to keep it loaded)
    return () => {
      // Don't remove on unmount - we want it to persist
    };
  }, []);

  return null; // This component doesn't render anything
}


