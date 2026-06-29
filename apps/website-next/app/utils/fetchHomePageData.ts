import { httpFile } from '@/config';

interface HomePageData {
  projectInfo?: any;
  aboutUs?: any;
}

/**
 * Server-side function to get projectId
 * Uses environment variable as primary source
 * Note: URL params (siteId) are handled client-side in components
 */
function getServerProjectId(): string | null {
  // Use environment variable for server-side data fetching
  // URL params are handled client-side in the actual page components
  return process.env.NEXT_PUBLIC_PROJECT_ID || null;
}

/**
 * Server-side function to fetch homepage data from API
 * Used in SSR for faster initial page load
 */
export async function fetchHomePageData(projectId?: string | null): Promise<HomePageData | null> {
  try {
    // Use provided projectId or get from server
    const currentProjectId = projectId || getServerProjectId();
    
    if (!currentProjectId) {
      // Return null if no projectId (client will handle fetching)
      console.warn('Project ID is not set for server-side fetch. Client will fetch data.');
      return null;
    }

    const { data } = await httpFile.post('/webapp/v1/my_site', {
      projectId: currentProjectId,
      pageType: 'home',
      reqFrom: 'Hero'
    });

    // Return the data in the format expected by HomePageClient
    return {
      projectInfo: data?.projectInfo || {},
      aboutUs: data?.aboutUs || {}
    };
  } catch (error) {
    // Log error but don't throw - let client handle fallback
    console.error('Error fetching homepage data server-side:', error);
    return null;
  }
}
