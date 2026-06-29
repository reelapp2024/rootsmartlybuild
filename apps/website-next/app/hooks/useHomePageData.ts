// Step 3: API Caching - React Query hook for homepage data with SSR support
import { useQuery } from '@tanstack/react-query';
import { httpFile } from '@/config';
import { getProjectId } from '@/hooks/getProjectId';

interface HomePageData {
  projectInfo?: any;
  aboutUs?: any;
}

interface UseHomePageDataProps {
  initialData?: HomePageData | null;
  projectId?: string | null;
}

// Step 3: API Caching - Fetch homepage data with React Query caching
export function useHomePageData({ initialData, projectId }: UseHomePageDataProps = {}) {
  // Get projectId from props, URL, or env
  const getCurrentProjectId = () => {
    if (projectId) return projectId;
    
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const siteIdFromUrl = urlParams.get('siteId');
      if (siteIdFromUrl) {
        localStorage.setItem('currentSiteId', siteIdFromUrl);
        return siteIdFromUrl;
      }
    }
    return getProjectId();
  };

  const currentProjectId = getCurrentProjectId();

  // Step 3: API Caching - Use React Query with SSR data as initial data
  const { data, isLoading, error } = useQuery({
    queryKey: ['homePageData', currentProjectId],
    queryFn: async () => {
      if (!currentProjectId) {
        throw new Error('Project ID is not set');
      }

      const { data } = await httpFile.post('/webapp/v1/my_site', {
        projectId: currentProjectId,
        pageType: 'home',
        reqFrom: 'Hero'
      });

      return data;
    },
    // Step 3: Use SSR data as initial data for instant display
    initialData: initialData || undefined,
    // Step 3: Cache settings - data is fresh for 5 minutes (from providers.tsx)
    enabled: !!currentProjectId, // Only fetch if projectId exists
    staleTime: 5 * 60 * 1000, // 5 minutes - matches providers.tsx
    gcTime: 10 * 60 * 1000, // 10 minutes cache
  });

  return {
    data: data || null,
    isLoading,
    error,
  };
}

