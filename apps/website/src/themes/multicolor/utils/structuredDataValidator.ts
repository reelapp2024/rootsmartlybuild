
export const validateStructuredData = () => {
  const scripts = document.querySelectorAll('script[type="application/ld+json"]');
  const results: { id: string; valid: boolean; errors: string[] }[] = [];

  scripts.forEach((script) => {
    const id = script.id || 'unknown';
    const errors: string[] = [];
    
    try {
      const data = JSON.parse(script.textContent || '');
      
      // Basic validation
      if (!data['@context']) {
        errors.push('Missing @context');
      }
      
      if (!data['@type']) {
        errors.push('Missing @type');
      }
      
      // Validate required fields based on type
      if (data['@type'] === 'Organization') {
        if (!data.name) errors.push('Organization missing name');
        if (!data.url) errors.push('Organization missing url');
      }
      
      if (data['@type'] === 'Service') {
        if (!data.name) errors.push('Service missing name');
        if (!data.provider) errors.push('Service missing provider');
      }
      
      if (data['@type'] === 'LocalBusiness') {
        if (!data.name) errors.push('LocalBusiness missing name');
        if (!data.address) errors.push('LocalBusiness missing address');
      }
      
      results.push({
        id,
        valid: errors.length === 0,
        errors
      });
      
    } catch (error) {
      results.push({
        id,
        valid: false,
        errors: ['Invalid JSON structure']
      });
    }
  });

  return results;
};

// Function to check if structured data is valid
export const isStructuredDataValid = (): boolean => {
  const results = validateStructuredData();
  return results.every(result => result.valid);
};
