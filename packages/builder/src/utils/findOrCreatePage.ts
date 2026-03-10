import { http } from '../config';

/**
 * Find or create a page in the database
 * Returns the pageId (existing or newly created)
 */
export async function findOrCreatePage(
  projectId: string,
  pageId: string | null,
  pageName?: string,
  pageDisplayName?: string
): Promise<string> {
  try {
    const token = localStorage.getItem('token');
    
    // If pageId is provided, verify it exists by checking in WebsiteDesignData
    if (pageId) {
      try {
        // Check if page exists in WebsiteDesignData
        const response = await http.get(`/getWebsiteDesignData/${projectId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        
        const designData = response.data?.data;
        const pagesArray = designData?.pages || designData?.selectPages || [];
        const foundPage = pagesArray.find((p: any) => {
          const currentPageId = p.pageId?._id || p.pageId;
          return String(currentPageId) === String(pageId);
        });
        
        if (foundPage && foundPage.pageId) {
          const existingPageId = foundPage.pageId._id || foundPage.pageId;
          console.log(`[findOrCreatePage] Found existing page: ${existingPageId}`);
          return String(existingPageId);
        }
      } catch (err: any) {
        // Page doesn't exist, will create new one
        console.log(`[findOrCreatePage] Page ${pageId} not found, will create new one`);
      }
    }
    
    // Page doesn't exist or pageId not provided, create new page
    const pageData: any = {
      projectId,
      name: pageName || 'home',
      displayName: pageDisplayName || 'Home',
    };
    
    // If pageId was provided but not found, we'll still create a new one
    // (backend will handle duplicate prevention if needed)
    
    const createResponse = await http.post('/upsertWebsitePage', pageData, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    
    if (createResponse.data && createResponse.data.page) {
      const newPageId = createResponse.data.page._id || createResponse.data.page.id;
      console.log(`[findOrCreatePage] Created new page: ${newPageId}`);
      return String(newPageId);
    }
    
    throw new Error('Failed to create page');
  } catch (err: any) {
    console.error('[findOrCreatePage] Error:', err);
    throw new Error(`Failed to find or create page: ${err.message || 'Unknown error'}`);
  }
}
