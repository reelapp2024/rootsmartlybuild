'use client';

import { useEffect } from 'react';

interface WebVitalsMetric {
  name: string;
  value: number;
  id: string;
  rating: 'good' | 'needs-improvement' | 'poor';
}

const WebVitals = () => {
  useEffect(() => {
    // Only run in production
    if (process.env.NODE_ENV !== 'production') return;
    const sendToAnalytics = (metric: WebVitalsMetric) => {
      console.log('Web Vitals:', metric);
      // In production, send to your analytics service
      // Example: gtag('event', metric.name, { value: metric.value });
    };

    // Dynamic import to avoid bundle size impact - using correct v5 API
    import('web-vitals').then(({ onCLS, onINP, onFCP, onLCP, onTTFB }) => {
      onCLS(sendToAnalytics);
      onINP(sendToAnalytics);
      onFCP(sendToAnalytics);
      onLCP(sendToAnalytics);
      onTTFB(sendToAnalytics);
    }).catch(() => {
      // Fallback if web-vitals is not available
      console.log('Web Vitals library not available');
    });
  }, []);

  return null;
};

export default WebVitals;
