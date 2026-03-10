import { httpFile } from '@/config';

interface SEOData {
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string;
}

/**
 * Server-side function to get projectId
 * Uses environment variable as primary source
 * Note: URL params (siteId) are handled client-side in components
 */
function getServerProjectId(): string | null {
  // Use environment variable for server-side metadata generation
  // URL params are handled client-side in the actual page components
  return process.env.NEXT_PUBLIC_PROJECT_ID || null;
}

/**
 * Server-side function to fetch SEO data from API
 * Used in generateMetadata for Next.js App Router
 */
export async function fetchSEOData(pageUrl: string, projectId?: string): Promise<SEOData> {
  try {
    // Use provided projectId or get from server
    const currentProjectId = projectId || getServerProjectId();
    
    if (!currentProjectId) {
      // Return empty data if no projectId (will use default metadata)
      return {
        meta_title: '',
        meta_description: '',
        meta_keywords: ''
      };
    }

    const response = await httpFile.post('/webapp/v1/seo', {
      projectId: currentProjectId,
      pageUrl,
      reqfrom: "generateMetadata"
    });

    if (response.data && response.data.data) {
      return {
        meta_title: response.data.data.meta_title || '',
        meta_description: response.data.data.meta_description || '',
        meta_keywords: response.data.data.meta_keywords || ''
      };
    }

    return {
      meta_title: '',
      meta_description: '',
      meta_keywords: ''
    };
  } catch (error) {
    // Silently handle errors in server context to avoid source map warnings
    // Return empty SEO data as fallback
    return {
      meta_title: '',
      meta_description: '',
      meta_keywords: ''
    };
  }
}

