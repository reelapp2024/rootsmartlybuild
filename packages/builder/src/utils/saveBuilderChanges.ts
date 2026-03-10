import { useStudio } from '../store';
import { prepareSectionsForStorage } from './saveSections';
import { findOrCreateComponent } from './findOrCreateComponent';
import type { Section } from '../types/builder';
import { prepareElementsForStorage } from '@ui/utils/elementStorage';

/**
 * Check if a section is element-only (no real component backing it)
 * Element-only sections use componentType as a placeholder for rendering
 * but don't require component creation in the database
 */
function isElementOnlySection(section: Section): boolean {
  // If section has a componentId, it's component-backed
  if (section.componentId) {
    return false;
  }
  
  // If section has no componentType, it's not element-only (it's legacy)
  if (!section.componentType) {
    return false;
  }
  
  // Element-only sections are those created from scratch
  // They have componentType but no componentId, and are built purely from elements
  // We can detect this by checking if the section was created manually
  // (i.e., it has customElements but no componentId)
  const hasCustomElements = section.customElements && section.customElements.length > 0;
  const hasNoComponentId = !section.componentId;
  
  // If it has customElements but no componentId, it's element-only
  return hasCustomElements && hasNoComponentId;
}

/**
 * Save builder changes to database
 * This function prepares sections from the store and updates the componentIds array
 * Only saves changed values (not defaults)
 * Creates components if they don't exist (only for component-backed sections)
 * Element-only sections are saved directly without component creation
 */
export async function saveBuilderChanges(
  projectId: string,
  pageId: string,
  existingComponentIds: Array<{
    componentId: any;
    variant?: string;
    style?: Record<string, any>;
    elementIds?: Array<{
      elementId: string;
      elementType?: string;
      style?: Record<string, any>;
      data?: Record<string, any>;
      order?: number;
    }>;
  }>
): Promise<Array<{
  componentId: any;
  variant: string;
  style: Record<string, any>;
  elementIds: Array<{
    elementId: string;
    elementType: string;
    style: Record<string, any>;
    data: Record<string, any>;
    order: number;
  }>;
}>> {
  const { sections, prepareSectionsForSave } = useStudio.getState();
  
  // Get prepared sections (only changed values)
  const preparedSections = prepareSectionsForSave();
  
  const sectionStore = useStudio.getState().sections;
  
  // Create a map of componentId -> prepared section data
  const preparedMap = new Map<string, typeof preparedSections[0]>();
  preparedSections.forEach((prepared) => {
    const storeSection = sectionStore.find(s => s.id === prepared.sectionId);
    if (storeSection) {
      // Use componentId if exists, otherwise use componentType to find/create
      if (storeSection.componentId) {
        const componentId = String(storeSection.componentId);
        preparedMap.set(componentId, prepared);
      } else if (storeSection.componentType) {
        // Component doesn't have componentId yet, will create it
        preparedMap.set(storeSection.componentType, prepared);
      }
    }
  });
  
  // Update existing componentIds with new data
  const updatedComponentIds = await Promise.all(
    existingComponentIds.map(async (compData: any) => {
      const componentId = String(compData.componentId?._id || compData.componentId || '');
    
      // Find matching prepared section by componentId
      const prepared = preparedMap.get(componentId);
    
    if (prepared) {
      return {
          componentId: compData.componentId, // Keep original componentId structure
        variant: compData.variant || 'A',
        style: prepared.style, // Only changed section styles
        elementIds: prepared.elementIds, // Only changed element styles and props, with order
      };
    }
    
    // If no match found, keep existing data
    return {
        componentId: compData.componentId,
      variant: compData.variant || 'A',
      style: compData.style || {},
      elementIds: compData.elementIds || [],
    };
    })
  );
  
  // Add any new sections that don't exist in existingComponentIds
  // Also create components if they don't exist (only for component-backed sections)
  // Element-only sections are saved directly without component creation
  for (const prepared of preparedSections) {
    const storeSection = sectionStore.find(s => s.id === prepared.sectionId);
    if (!storeSection) continue;
    
    // Skip element-only sections - they don't need component creation
    // They will be saved as layout JSON directly via the page's layout field
    if (isElementOnlySection(storeSection)) {
      console.log(`[saveBuilderChanges] Element-only section detected: ${storeSection.id}, converting to hierarchical structure`);
      
      // Convert flat builder format → hierarchical DB format
      const customElements = storeSection.customElements || [];
      const customElementStyles = storeSection.customElementStyles || {};
      const customElementProps = storeSection.customElementProps || {};
      
      // Use prepareElementsForStorage to convert to hierarchical tree
      const hierarchicalElements = prepareElementsForStorage(
        customElements,
        customElementStyles,
        customElementProps
      );
      
      // Save as hierarchical structure (matches component elementIds format)
      const elementOnlyEntry = {
        _isElementOnly: true, // Marker for PageSaveButton
        _layoutData: {
          sectionId: storeSection.id,
          componentType: storeSection.componentType || 'hero_a',
          elements: hierarchicalElements, // Hierarchical structure (same as component elementIds)
          styles: storeSection.styles || {},
        },
      };
      
      // Check if this section already exists in updatedComponentIds
      const exists = updatedComponentIds.some((comp: any) => {
        return comp._isElementOnly && comp._layoutData?.sectionId === storeSection.id;
      });
      
      if (!exists) {
        updatedComponentIds.push(elementOnlyEntry as any);
      }
      continue;
    }
    
    // For component-backed sections, proceed with component creation
    if (!storeSection.componentType) continue;
    
    let componentId: string | null = null;
    
    // If section has componentId, use it
    if (storeSection.componentId) {
      componentId = String(storeSection.componentId);
    } else {
      // Component doesn't exist, create it (only for component-backed sections)
      try {
        componentId = await findOrCreateComponent(
          storeSection.componentType,
          storeSection.componentType,
          'homepage' // Default category, can be made dynamic
        );
        
        // Update section in store with new componentId
        useStudio.getState().sections = useStudio.getState().sections.map(s =>
          s.id === storeSection.id ? { ...s, componentId } : s
        );
      } catch (err) {
        console.error(`[saveBuilderChanges] Failed to create component ${storeSection.componentType}:`, err);
        continue; // Skip this section if component creation fails
      }
    }
    
    if (!componentId) continue;
    
    // Check if component already exists in updatedComponentIds
    const exists = updatedComponentIds.some((comp: any) => {
      const compComponentId = String(comp.componentId?._id || comp.componentId || '');
      return compComponentId === componentId;
    });
    
    if (!exists) {
      // This is a new section, add it
      updatedComponentIds.push({
        componentId: componentId,
        variant: 'A',
        style: prepared.style,
        elementIds: prepared.elementIds,
      });
    }
  }
  
  return updatedComponentIds;
}

