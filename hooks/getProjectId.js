// hooks/getProjectId.js
export const getProjectId = () => {
  // Priority 1: Check URL parameter (siteId)
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    const siteId = urlParams.get('siteId');
    if (siteId) {
      // Save to localStorage for future use
      if (localStorage.getItem('currentSiteId') !== siteId) {
        localStorage.setItem('currentSiteId', siteId);
      }
      return siteId;
    }

    // Priority 2: Check localStorage
    const savedSiteId = localStorage.getItem('currentSiteId');
    if (savedSiteId) {
      return savedSiteId;
    }
  }

  // Priority 3: Use environment variable
  return process.env.NEXT_PUBLIC_PROJECT_ID;
};

