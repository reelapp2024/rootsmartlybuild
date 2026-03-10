import { http } from '../config';
import { prepareSectionForStorage } from './saveSections';

/**
 * Save a single section's changes to the database
 * Updates only the component's elementIds array in WebsiteDesignsData
 */
export async function saveSectionToDB(
  projectId: string,
  pageId: string,
  componentId: string,
  section: any // Section from store
): Promise<{ success: boolean; message?: string }> {
  try {
    // Prepare section data (only changed values)
    const preparedSection = prepareSectionForStorage(section);

    // Prepare the payload
    const payload = {
      projectId,
      pageId,
      componentId,
      style: preparedSection.style, // Only changed section styles
      elementIds: preparedSection.elementIds.map(el => ({
        elementId: el.elementId,
        elementType: el.elementType,
        style: el.style, // Only changed element styles
        data: el.data, // Only changed element props
        order: el.order,
      })),
    };

    // Call API to update the component's elementIds
    const response = await http.post('/updateComponentElements', payload);

    if (response.data && response.data.success) {
      return { success: true, message: 'Section saved successfully' };
    } else {
      throw new Error(response.data?.message || 'Failed to save section');
    }
  } catch (error: any) {
    console.error('Error saving section to DB:', error);
    throw new Error(
      error.response?.data?.message || 
      error.message || 
      'Failed to save section to database'
    );
  }
}


