import { http } from '../config';

/**
 * Find or create a component in the database
 * Returns the componentId (existing or newly created)
 */
export async function findOrCreateComponent(
  componentType: string,
  componentName?: string,
  category: string = 'homepage'
): Promise<string> {
  try {
    const token = localStorage.getItem('token');
    
    // Map componentType to component name and uniqueId
    const componentNameMap: Record<string, { name: string; uniqueId: string; displayName: string; description: string }> = {
      'herosectionvarianta': {
        name: 'herosection',
        uniqueId: 'herosectionvarianta',
        displayName: 'Hero Section Variant A',
        description: 'Gradient background, centered layout'
      },
      'herosectionvariantb': {
        name: 'herosection',
        uniqueId: 'herosectionvariantb',
        displayName: 'Hero Section Variant B',
        description: 'Split layout with image on right'
      },
      'herosectionvariantc': {
        name: 'herosection',
        uniqueId: 'herosectionvariantc',
        displayName: 'Hero Section Variant C',
        description: 'Hero Section Variant C'
      },
      'herosectionvariantd': {
        name: 'herosection',
        uniqueId: 'herosectionvariantd',
        displayName: 'Hero Section Variant D',
        description: 'Hero Section Variant D'
      },
      'servicessectionvarianta': {
        name: 'servicessection',
        uniqueId: 'servicessectionvarianta',
        displayName: 'Services Section Variant A',
        description: 'Services grid with image, title, description'
      },
      'testimonialsection': {
        name: 'testimonialsection',
        uniqueId: 'testimonialsection',
        displayName: 'Testimonial Section',
        description: 'Customer reviews and testimonials'
      },
      'faqsection': {
        name: 'faqsection',
        uniqueId: 'faqsection',
        displayName: 'FAQ Section',
        description: 'Frequently asked questions'
      },
      'processsection': {
        name: 'processsection',
        uniqueId: 'processsection',
        displayName: 'Process Section',
        description: 'How it works'
      },
      'featuressectionvarianta': {
        name: 'featuressection',
        uniqueId: 'featuressectionvarianta',
        displayName: 'Features Section Variant A',
        description: 'Key features showcase'
      },
      'featuressectionvariantb': {
        name: 'featuressection',
        uniqueId: 'featuressectionvariantb',
        displayName: 'Features Section Variant B',
        description: 'Features with different layout'
      },
    };
    
    const componentInfo = componentNameMap[componentType.toLowerCase()] || {
      name: componentName || componentType.toLowerCase(),
      uniqueId: componentType.toLowerCase(),
      displayName: componentName || componentType,
      description: `${componentType} component`
    };
    
    // Try to find existing component by uniqueId
    // First try to get all components and find by uniqueId
    try {
      // Try direct search endpoint if available
      try {
        const searchResponse = await http.get(`/getWebsiteComponentByUniqueId/${componentInfo.uniqueId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        
        if (searchResponse.data && searchResponse.data.component && searchResponse.data.component._id) {
          console.log(`[findOrCreateComponent] Found existing component: ${searchResponse.data.component._id}`);
          return String(searchResponse.data.component._id);
        }
      } catch (directErr) {
        // Direct endpoint not available, try alternative approach
        // Get all components and search
        const allComponentsResponse = await http.get(`/getWebsiteComponents`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        
        if (allComponentsResponse.data && Array.isArray(allComponentsResponse.data.components)) {
          const foundComponent = allComponentsResponse.data.components.find((c: any) => 
            (c.uniqueId && c.uniqueId.toLowerCase() === componentInfo.uniqueId.toLowerCase()) ||
            (c.name && c.name.toLowerCase() === componentInfo.name.toLowerCase())
          );
          
          if (foundComponent && foundComponent._id) {
            console.log(`[findOrCreateComponent] Found existing component: ${foundComponent._id}`);
            return String(foundComponent._id);
          }
        }
      }
    } catch (err: any) {
      // Component doesn't exist, will create new one
      console.log(`[findOrCreateComponent] Component ${componentInfo.uniqueId} not found, will create new one`);
    }
    
    // Component doesn't exist, create new one
    const componentData = {
      name: componentInfo.name,
      variant: componentInfo.variant,
      uniqueId: componentInfo.uniqueId,
    };
    
    const createResponse = await http.post('/upsertWebsiteComponent', componentData, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    
    if (createResponse.data && createResponse.data.component) {
      const newComponentId = createResponse.data.component._id || createResponse.data.component.id;
      console.log(`[findOrCreateComponent] Created new component: ${newComponentId}`);
      return String(newComponentId);
    }
    
    throw new Error('Failed to create component');
  } catch (err: any) {
    console.error('[findOrCreateComponent] Error:', err);
    throw new Error(`Failed to find or create component: ${err.message || 'Unknown error'}`);
  }
}
