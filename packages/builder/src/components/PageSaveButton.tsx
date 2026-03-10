'use client';

import React, { useState, useEffect } from 'react';
import { useStudio } from '../store';
import { useSearchParams } from 'react-router-dom';
import { http } from '../config';
import { saveBuilderChanges } from '../utils/saveBuilderChanges';
import { findOrCreatePage } from '../utils/findOrCreatePage';
import { Save, Upload } from 'lucide-react';

interface PageSaveButtonProps {
  existingComponentIds?: Array<{
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
  }>;
}

export default function PageSaveButton({ existingComponentIds = [] }: PageSaveButtonProps) {
  const { sections, prepareSectionsForSave, hasUnsavedChanges, markSectionSaved } = useStudio();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('projectId') || '';
  const pageId = searchParams.get('pageId') || '';
  
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [existingComponentIdsState, setExistingComponentIdsState] = useState(existingComponentIds);

  // Check if any section has unsaved changes
  const hasAnyChanges = sections.some(section => hasUnsavedChanges(section.id));
  
  // For element-only pages, also check if there are any sections at all
  // (new empty pages need to be saved even if no changes tracked yet)
  const hasSections = sections.length > 0;
  
  // Check if page has element-only sections (these MUST use page save)
  const hasElementOnlySections = sections.some(section => {
    // Element-only sections have componentType but no componentId, and have customElements
    return section.componentType && !section.componentId && 
           section.customElements && section.customElements.length > 0;
  });

  // Fetch componentIds if not provided
  useEffect(() => {
    if (existingComponentIds.length === 0 && projectId && pageId) {
      const fetchComponentIds = async () => {
        try {
          const token = localStorage.getItem('token');
          const response = await http.get(`/getWebsiteDesignData/${projectId}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });
          const designData = response.data?.data;
          const selectedPage = designData?.pages?.find((p: any) => {
            const currentPageId = p.pageId?._id || p.pageId;
            return String(currentPageId) === String(pageId);
          });
          if (selectedPage?.componentIds) {
            setExistingComponentIdsState(selectedPage.componentIds);
          }
        } catch (err) {
          console.error('Error fetching componentIds:', err);
        }
      };
      fetchComponentIds();
    }
  }, [projectId, pageId, existingComponentIds.length]);

  // Show button if:
  // 1. Has unsaved changes (component-backed or element-only sections)
  // 2. OR has element-only sections (they MUST use page save, even if no changes tracked)
  // 3. AND has projectId (pageId can be created)
  const shouldShowButton = projectId && (hasAnyChanges || (hasElementOnlySections && hasSections));

  if (!shouldShowButton) {
    return null; // Don't show button if no changes and no element-only sections, or missing projectId
  }

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      // Get all prepared sections
      const preparedSections = prepareSectionsForSave();
      
      if (preparedSections.length === 0) {
        throw new Error('No sections to save');
      }

      // Find or create page if it doesn't exist
      let finalPageId = pageId;
      if (!pageId) {
        // Try to get pageId from URL or create new one
        const pageName = searchParams.get('pageName') || 'home';
        const pageDisplayName = searchParams.get('pageDisplayName') || 'Home';
        finalPageId = await findOrCreatePage(projectId, null, pageName, pageDisplayName);
      } else {
        // Verify page exists, create if not
        finalPageId = await findOrCreatePage(projectId, pageId);
      }

      // Use existing componentIds if provided, otherwise use state
      let componentIdsToUpdate = existingComponentIds.length > 0 ? existingComponentIds : existingComponentIdsState;
      
      if (componentIdsToUpdate.length === 0) {
        // Fetch current page data to get componentIds
        const token = localStorage.getItem('token');
        const response = await http.get(`/getWebsiteDesignData/${projectId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const designData = response.data?.data;
        const selectedPage = designData?.pages?.find((p: any) => {
          const currentPageId = p.pageId?._id || p.pageId;
          return String(currentPageId) === String(finalPageId);
        });
        componentIdsToUpdate = selectedPage?.componentIds || [];
      }

      // Save all sections using saveBuilderChanges (this will create components if needed)
      // This handles both component-backed sections and element-only sections
      const updatedComponentIds = await saveBuilderChanges(
        projectId,
        finalPageId,
        componentIdsToUpdate
      );

      // Separate element-only sections (layout JSON) from component-backed sections
      const componentBackedSections = updatedComponentIds.filter((comp: any) => 
        !comp._isElementOnly && comp.componentId && comp.componentId !== null
      );
      const elementOnlySections = updatedComponentIds.filter((comp: any) => 
        comp._isElementOnly && comp._layoutData
      );

      // Prepare layout JSON for element-only sections
      const layoutJson = elementOnlySections.length > 0 
        ? elementOnlySections.map((comp: any) => comp._layoutData).filter(Boolean)
        : undefined;

      // Update the database with all changes
      const token = localStorage.getItem('token');
      const savePayload: any = {
        projectId,
        pageId: finalPageId,
        componentIds: componentBackedSections,
      };
      
      // Include layout JSON if there are element-only sections
      if (layoutJson && layoutJson.length > 0) {
        savePayload.layout = layoutJson;
      }
      
      const saveResponse = await http.post('/updateWebsiteDesignData', savePayload, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (saveResponse.data && saveResponse.data.success) {
        // Mark all sections as saved
        sections.forEach(section => {
          markSectionSaved(section.id);
        });
        
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        throw new Error(saveResponse.data?.message || 'Failed to save page');
      }
    } catch (err: any) {
      console.error('Error saving page:', err);
      setError(err.message || 'Failed to save page. Please try again.');
      setTimeout(() => setError(null), 5000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <button
      onClick={handleSave}
      disabled={saving}
      style={{
        marginLeft: 8,
        padding: '6px 12px',
        borderRadius: 6,
        border: '1px solid',
        borderColor: saving 
          ? '#9ca3af'
          : success
          ? '#10b981'
          : error
          ? '#ef4444'
          : '#3b82f6',
        background: saving 
          ? '#9ca3af'
          : success
          ? '#10b981'
          : error
          ? '#ef4444'
          : '#3b82f6',
        color: '#ffffff',
        fontWeight: 500,
        cursor: saving ? 'not-allowed' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        transition: 'all 0.2s',
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
      title={error ? error : success ? 'Page published successfully!' : 'Publish page (save all sections)'}
    >
      {saving ? (
        <>
          <span>⏳</span>
          <span>Publishing...</span>
        </>
      ) : success ? (
        <>
          <span>✓</span>
          <span>Published!</span>
        </>
      ) : error ? (
        <>
          <span>✗</span>
          <span>Error</span>
        </>
      ) : (
        <>
          <Upload className="w-4 h-4" />
          <span>Publish</span>
        </>
      )}
    </button>
  );
}
