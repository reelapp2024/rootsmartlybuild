
'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

interface SEOHeadProps {
  title?: string;
  description?: string;
  canonical?: string;
  noindex?: boolean;
  nofollow?: boolean;
  ogImage?: string;
}

const SEOHead = ({ 
  title, 
  description, 
  canonical, 
  noindex = false, 
  nofollow = false,
  ogImage 
}: SEOHeadProps) => {
  const pathname = usePathname();
  
  useEffect(() => {
    // Set canonical URL
    const canonicalUrl = canonical || `${window.location.origin}${location.pathname}`;
    let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.rel = 'canonical';
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.href = canonicalUrl;

    // Set robots meta tag
    let robotsMeta = document.querySelector('meta[name="robots"]') as HTMLMetaElement;
    if (!robotsMeta) {
      robotsMeta = document.createElement('meta');
      robotsMeta.name = 'robots';
      document.head.appendChild(robotsMeta);
    }
    
    const robotsDirectives = [];
    if (noindex) robotsDirectives.push('noindex');
    else robotsDirectives.push('index');
    
    if (nofollow) robotsDirectives.push('nofollow');
    else robotsDirectives.push('follow');
    
    robotsDirectives.push('max-snippet:-1', 'max-image-preview:large', 'max-video-preview:-1');
    robotsMeta.content = robotsDirectives.join(', ');

    // Update title if provided
    if (title) {
      document.title = title;
    }

    // Update description if provided
    if (description) {
      let descMeta = document.querySelector('meta[name="description"]') as HTMLMetaElement;
      if (!descMeta) {
        descMeta = document.createElement('meta');
        descMeta.name = 'description';
        document.head.appendChild(descMeta);
      }
      descMeta.content = description;
    }

    // Update OG image if provided
    if (ogImage) {
      let ogImageMeta = document.querySelector('meta[property="og:image"]') as HTMLMetaElement;
      if (!ogImageMeta) {
        ogImageMeta = document.createElement('meta');
        ogImageMeta.setAttribute('property', 'og:image');
        document.head.appendChild(ogImageMeta);
      }
      ogImageMeta.content = ogImage;
    }

    // Add preload for critical resources
    const preloadFont = document.createElement('link');
    preloadFont.rel = 'preload';
    preloadFont.href = 'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap';
    preloadFont.as = 'style';
    if (!document.querySelector(`link[href="${preloadFont.href}"]`)) {
      document.head.appendChild(preloadFont);
    }

  }, [pathname, title, description, canonical, noindex, nofollow, ogImage]);

  return null;
};

export default SEOHead;
