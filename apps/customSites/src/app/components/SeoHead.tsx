'use client';

import { useEffect } from 'react';

interface SeoHeadProps {
  keywords?: string;
  canonicalUrl?: string;
}

/**
 * Client component to add meta keywords and canonical URL
 * (Next.js metadata API doesn't support keywords directly)
 */
export default function SeoHead({ keywords, canonicalUrl }: SeoHeadProps) {
  useEffect(() => {
    // Add meta keywords tag
    if (keywords) {
      let keywordsTag = document.querySelector('meta[name="keywords"]');
      if (!keywordsTag) {
        keywordsTag = document.createElement('meta');
        keywordsTag.setAttribute('name', 'keywords');
        document.head.appendChild(keywordsTag);
      }
      keywordsTag.setAttribute('content', keywords);
    }

    // Add canonical link if not already present
    if (canonicalUrl) {
      let canonicalLink = document.querySelector('link[rel="canonical"]');
      if (!canonicalLink) {
        canonicalLink = document.createElement('link');
        canonicalLink.setAttribute('rel', 'canonical');
        document.head.appendChild(canonicalLink);
      }
      canonicalLink.setAttribute('href', canonicalUrl);
    }
  }, [keywords, canonicalUrl]);

  return null;
}

