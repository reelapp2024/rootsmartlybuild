import React, { useState } from 'react';
import { useStudio } from '../store';
import { http } from '../config';
import { prepareSectionForStorage } from '../utils/saveSections';
import { findOrCreateComponent } from '../utils/findOrCreateComponent';
import type { Section } from '../types/builder';

/**
 * Check if a section is element-only (no real component backing it)
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
  const hasCustomElements = section.customElements && section.customElements.length > 0;
  const hasNoComponentId = !section.componentId;
  
  // If it has customElements but no componentId, it's element-only
  return hasCustomElements && hasNoComponentId;
}

interface SectionSaveButtonProps {
  sectionId: string;
  projectId: string;
  pageId: string;
  componentId?: string; // The actual componentId from database (optional, will be found from section)
  componentType: string;
}

export default function SectionSaveButton({
  sectionId,
  projectId,
  pageId,
  componentId,
  componentType,
}: SectionSaveButtonProps) {
  const { sections, hasUnsavedChanges, markSectionSaved, prepareSectionsForSave } = useStudio();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const hasChanges = hasUnsavedChanges(sectionId);

  // Get the section to check if it's element-only
  const section = sections.find(s => s.id === sectionId);
  
  // Don't show button if no changes
  if (!hasChanges) {
    return null;
  }
  
  // Don't show button for element-only sections (they must be saved via page save)
  if (section && isElementOnlySection(section)) {
    return null; // Hide button for element-only sections
  }

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      // Get the section from store
      const section = sections.find(s => s.id === sectionId);
      if (!section) {
        throw new Error('Section not found');
      }

      // Check if this is an element-only section (no component backing)
      const isElementOnly = isElementOnlySection(section);
      
      // For element-only sections, skip component creation
      // They will be saved as layout JSON directly via the page save button
      if (isElementOnly) {
        // Element-only sections should be saved via PageSaveButton, not individually
        // This button should not appear for element-only sections, but if it does,
        // we'll show a helpful message
        throw new Error('Element-only sections must be saved using the "Save Page" button at the top right. Individual section save is not available for element-only sections.');
      }
      
      // Get componentId from section (it should be stored when section is loaded)
      let sectionComponentId = componentId || section.componentId || section.customId;
      
      // If componentId doesn't exist, create the component (only for component-backed sections)
      if (!sectionComponentId && section.componentType) {
        try {
          sectionComponentId = await findOrCreateComponent(
            section.componentType,
            section.componentType,
            'homepage' // Default category
          );
          
          // Update section in store with new componentId
          const updatedSections = sections.map(s =>
            s.id === sectionId ? { ...s, componentId: sectionComponentId } : s
          );
          useStudio.getState().sections = updatedSections;
        } catch (err: any) {
          throw new Error(`Failed to create component: ${err.message || 'Unknown error'}`);
        }
      }
      
      if (!sectionComponentId) {
        throw new Error('Component ID not found and could not be created. Please check component type.');
      }

      // Prepare section data (only changed values)
      const preparedSection = prepareSectionForStorage(section);

      // Prepare the payload for the API
      const payload = {
        projectId,
        pageId,
        componentId: sectionComponentId,
        style: preparedSection.style, // Only changed section styles
        elementIds: preparedSection.elementIds.map(el => {
          // Recursive function to ensure all elements (including children) have elementType
          const ensureElementType = (element: any): any => {
            const processed = {
              elementId: element.elementId,
              elementType: element.elementType || 'text', // Always include elementType
              style: element.style || {},
              data: element.data || {},
              order: element.order || 0
            };
            
            // Process children recursively
            if (element.children && Array.isArray(element.children) && element.children.length > 0) {
              processed.children = element.children.map((child: any) => ensureElementType(child));
            }
            
            return processed;
          };
          
          return ensureElementType(el);
        }),
      };

      // Call API to update the component's elementIds
      // Check if baseURL already includes /admin/v1 to avoid duplication
      const baseURL = http.defaults.baseURL || '';
      const hasAdminV1 = /\/admin\/v1\/?$/.test(baseURL);
      const endpoint = hasAdminV1 ? 'updateComponentElements' : '/admin/v1/updateComponentElements';
      const response = await http.post(endpoint, payload);

      if (response.data && response.data.success) {
        // Mark section as saved
        markSectionSaved(sectionId);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 2000);
      } else {
        throw new Error(response.data?.message || 'Failed to save');
      }
    } catch (err: any) {
      console.error('Error saving section:', err);
      setError(err.response?.data?.message || err.message || 'Failed to save');
      setTimeout(() => setError(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        position: 'relative',
        zIndex: 1000,
      }}
    >
      <button
        onClick={handleSave}
        disabled={saving}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 12px',
          borderRadius: '6px',
          border: 'none',
          background: success
            ? '#10b981'
            : error
            ? '#ef4444'
            : saving
            ? '#6b7280'
            : '#3b82f6',
          color: '#ffffff',
          fontWeight: 500,
          fontSize: '14px',
          cursor: saving ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        }}
        onMouseEnter={(e) => {
          if (!saving && !success && !error) {
            e.currentTarget.style.background = '#2563eb';
          }
        }}
        onMouseLeave={(e) => {
          if (!saving && !success && !error) {
            e.currentTarget.style.background = '#3b82f6';
          }
        }}
      >
        {saving ? (
          <>
            <span>⏳</span>
            <span>Saving...</span>
          </>
        ) : success ? (
          <>
            <span>✓</span>
            <span>Saved!</span>
          </>
        ) : error ? (
          <>
            <span>✗</span>
            <span>Error</span>
          </>
        ) : (
          <>
            <span>💾</span>
            <span>Save</span>
          </>
        )}
      </button>
      {error && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: '4px',
            padding: '8px 12px',
            background: '#fee2e2',
            color: '#991b1b',
            borderRadius: '4px',
            fontSize: '12px',
            whiteSpace: 'nowrap',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
}

