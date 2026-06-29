
import { generateSitemap } from './sitemapGenerator';
import { generateRSSFeed } from './rssGenerator';
import { validateStructuredData } from './structuredDataValidator';

export const generateSEOFiles = () => {
  // Generate sitemap
  const sitemap = generateSitemap();
  
  // Generate RSS feed
  const rss = generateRSSFeed();
  
  // Validate structured data
  const structuredDataResults = validateStructuredData();
  
  return {
    sitemap,
    rss,
    structuredDataResults
  };
};

export const preloadCriticalResources = () => {
  // Preload critical CSS
  const criticalCSS = document.createElement('link');
  criticalCSS.rel = 'preload';
  criticalCSS.href = '/src/index.css';
  criticalCSS.as = 'style';
  document.head.appendChild(criticalCSS);

  // Prefetch likely next pages
  const prefetchPages = ['/services', '/about', '/contact'];
  prefetchPages.forEach(page => {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = page;
    document.head.appendChild(link);
  });
};

export const optimizeMetaViewport = () => {
  let viewport = document.querySelector('meta[name="viewport"]') as HTMLMetaElement;
  if (!viewport) {
    viewport = document.createElement('meta');
    viewport.name = 'viewport';
    document.head.appendChild(viewport);
  }
  viewport.content = 'width=device-width, initial-scale=1, viewport-fit=cover';
};
