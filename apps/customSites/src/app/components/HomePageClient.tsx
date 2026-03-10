'use client';

import { useEffect, useState } from 'react';
import { getWebsiteDesignData } from '@/lib/api';
import { renderComponent } from '@/lib/componentRenderer';
import { registry } from '@/lib/registry';
import { getSeoSettings } from '@/lib/seo';
import SeoHead from './SeoHead';
import { renderRootElements } from '@ui/utils/elementRendering';
import GenieBuildPageRenderer from './GenieBuildPageRenderer';
import { Section } from '@geniebuild/types';

// Get header and footer components from registry
const HeaderA = registry['header_a'];
const FooterA = registry['footer_a'];

// Safety check - ensure components exist
if (!HeaderA) {
  console.warn('[HomePageClient] HeaderA component not found in registry');
}
if (!FooterA) {
  console.warn('[HomePageClient] FooterA component not found in registry');
}

const DEFAULT_PAGE_ID = '691eb4420ed7c44f21286770';

export default function HomePageClient() {
  const [sections, setSections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [seoData, setSeoData] = useState<any>(null);
  const [isGenieBuildPage, setIsGenieBuildPage] = useState(false);
  const [genieBuildSections, setGenieBuildSections] = useState<Section[]>([]);
  const [globalColors, setGlobalColors] = useState({
    backgroundColor: '#0E1214',
    textColor: '#D1D5DB',
    titleColor: '#F8FAFC',
    accentColor: '#F8FAFC',
    buttonBackgroundColor: '#E11D48',
    buttonTextColor: '#FFFFFF'
  });

  useEffect(() => {
    async function loadWebsiteData() {
      try {
        setLoading(true);
        setError(null);

        // Get projectId from environment variable
        const projectId = process.env.NEXT_PUBLIC_PROJECT_ID;
        
        if (!projectId) {
          throw new Error('NEXT_PUBLIC_PROJECT_ID is not set in environment variables');
        }

        console.log('Loading website data for projectId:', projectId);

        // Fetch website design data directly from backend API
        // No authentication required - API endpoint is now public
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://apis.smartlybuild.dev/admin/v1';
        const apiEndpoint = `${apiUrl}/getWebsiteDesignData/${projectId}`;
        console.log('Fetching from:', apiEndpoint);
        
        const response = await fetch(apiEndpoint, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        console.log('<<<<<<<<<>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>Response status:', response.status, response.statusText,response);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('API Error:', errorData);
          throw new Error(errorData.message || errorData.error || `Failed to fetch website data: ${response.statusText} (Status: ${response.status})`);
        }
        
        const designData = await response.json();
        console.log('Design data received:', designData);

        if (!designData?.data?.pages) {
          throw new Error('No pages found in design data');
        }

        // Extract global colors from designData (will be passed to GenieBuildPageRenderer)
        const extractedColors = {
          backgroundColor: designData.data.colorSecondary || '#0E1214',
          textColor: designData.data.colorAccent || '#D1D5DB',
          titleColor: designData.data.colorAccent || '#F8FAFC',
          accentColor: designData.data.colorAccent || '#F8FAFC',
          buttonBackgroundColor: designData.data.colorPrimary || '#E11D48',
          buttonTextColor: '#FFFFFF'
        };
        setGlobalColors(extractedColors);

        // Find homepage - prioritize by name "home", then fallback to first page
        const pagesArray = designData.data.pages;
        console.log('[customSites] Total pages found:', pagesArray.length);
        console.log('[customSites] Pages:', pagesArray.map((p: any) => ({
          pageId: p.pageId?._id || p.pageId,
          name: p.pageId?.name,
          displayName: p.pageId?.displayName,
          renderer: p.style?.renderer,
          componentIdsCount: p.componentIds?.length || 0
        })));
        
        let selectedPage = null;

        // First, try to find page by name "home" (most common case)
        selectedPage = pagesArray.find(
          (page: any) => {
            const pageName = (page.pageId?.name || '').toLowerCase().trim();
            const pageDisplayName = (page.pageId?.displayName || '').toLowerCase().trim();
            const isHome = pageName === 'home' || 
                          pageName === 'homepage' ||
                          pageDisplayName === 'home' ||
                          pageDisplayName === 'homepage';
            if (isHome) {
              console.log('[customSites] Found homepage by name:', { pageName, pageDisplayName, pageId: page.pageId?._id || page.pageId });
            }
            return isHome;
          }
        );

        // If not found by name, try to find by DEFAULT_PAGE_ID (for backward compatibility)
        if (!selectedPage) {
          selectedPage = pagesArray.find(
            (page: any) => {
              const currentPageId = page.pageId?._id || page.pageId;
              const matches = String(currentPageId) === String(DEFAULT_PAGE_ID);
              if (matches) {
                console.log('[customSites] Found homepage by DEFAULT_PAGE_ID:', currentPageId);
              }
              return matches;
            }
          );
        }

        // If still not found, use first page as fallback
        if (!selectedPage && pagesArray.length > 0) {
          selectedPage = pagesArray[0];
          console.warn('[customSites] Homepage not found by name or ID, using first page:', {
            pageId: selectedPage.pageId?._id || selectedPage.pageId,
            name: selectedPage.pageId?.name,
            displayName: selectedPage.pageId?.displayName
          });
        }

        if (!selectedPage) {
          throw new Error(`Homepage not found. Total pages: ${pagesArray.length}`);
        }
        
        console.log('[customSites] Selected page:', {
          pageId: selectedPage.pageId?._id || selectedPage.pageId,
          name: selectedPage.pageId?.name,
          displayName: selectedPage.pageId?.displayName,
          renderer: selectedPage.style?.renderer,
          componentIdsCount: selectedPage.componentIds?.length || 0
        });

        console.log('Selected page:', selectedPage);
        console.log('Component IDs:', selectedPage.componentIds);
        console.log('Layout JSON:', selectedPage.layout);
        console.log('Style renderer:', selectedPage.style?.renderer);

        // Check if page uses GenieBuild sections (highest priority)
        // Read from componentIds[].sectionData (single source of truth)
        let processedSections: any[] = [];
        
        if (selectedPage.style?.renderer === 'geniebuild' && selectedPage.componentIds && Array.isArray(selectedPage.componentIds) && selectedPage.componentIds.length > 0) {
          // Extract sectionData from componentIds (same logic as GenieBuild)
          const genieBuildSections = selectedPage.componentIds
            .map((compData: any) => compData.sectionData)
            .filter((section: any) => section != null) as Section[]; // Filter out null/undefined
          
          if (genieBuildSections.length > 0) {
            console.log('[customSites] Loading GenieBuild page with', genieBuildSections.length, 'sections from componentIds');
            setIsGenieBuildPage(true);
            setGenieBuildSections(genieBuildSections);
            processedSections = []; // Empty - we'll render GenieBuild sections directly
          } else {
            console.warn('[customSites] Page marked as GenieBuild but no valid sections found in componentIds');
          }
        } else if (selectedPage.layout && Array.isArray(selectedPage.layout) && selectedPage.layout.length > 0) {
          console.log('[customSites] Loading element-only page from layout JSON:', selectedPage.layout.length, 'sections');
          
          // Process layout sections - support both hierarchical (new) and flat (old) formats
          processedSections = selectedPage.layout.map((layoutSection: any, index: number) => {
            const sectionId = layoutSection.sectionId || `section-${Date.now()}-${index}`;
            const componentType = layoutSection.componentType || 'hero_a'; // Default to hero_a for rendering
            
            // Check if layout has hierarchical elements (new format) or flat customElements (old format)
            let elementIds: any[] = [];
            
            if (layoutSection.elements && Array.isArray(layoutSection.elements) && layoutSection.elements.length > 0) {
              // NEW FORMAT: Hierarchical elements (same as component elementIds)
              console.log(`[customSites] Section ${index + 1}: Using hierarchical elements (new format)`);
              elementIds = layoutSection.elements;
            } else if (layoutSection.customElements && Array.isArray(layoutSection.customElements) && layoutSection.customElements.length > 0) {
              // OLD FORMAT: Flat customElements (backward compatibility)
              // Convert flat to hierarchical for rendering
              console.log(`[customSites] Section ${index + 1}: Converting flat customElements to hierarchical (old format)`);
              elementIds = (layoutSection.customElements || []).map((el: any) => ({
                elementId: el.elId,
                elementType: el.type || 'text',
                style: layoutSection.customElementStyles?.[el.elId] || {},
                data: layoutSection.customElementProps?.[el.elId] || {},
                order: el.order !== undefined ? el.order : 0,
                parentElId: el.parentElId || undefined,
              }));
            }
            
            // Use the same processing logic as component-backed pages (lines 164-466)
            // This ensures consistent rendering for both page types
            const customElements: any[] = [];
            const customElementProps: Record<string, any> = {};
            const customElementStyles: Record<string, any> = {};
            
            // Recursive function to flatten nested element structure (same as component-backed pages)
            const flattenElements = (elements: any[], parentElId?: string): any[] => {
              const flattened: any[] = [];
              
              elements.forEach((el: any) => {
                const currentElId = el.elementId || el.elId;
                
                const flatElement = {
                  ...el,
                  elementId: currentElId,
                  parentElId: parentElId || el.parentElId || undefined
                };
                flattened.push(flatElement);
                
                if (el.children && Array.isArray(el.children) && el.children.length > 0) {
                  const childElements = flattenElements(el.children, currentElId);
                  flattened.push(...childElements);
                }
              });
              
              return flattened;
            };
            
            // Flatten all elements (including nested children)
            const allElements = flattenElements(elementIds);
            
            // Sort elements by order
            const sortedElementIds = [...allElements].sort((a: any, b: any) => {
              const orderA = a.order !== undefined && a.order !== null ? a.order : 999;
              const orderB = b.order !== undefined && b.order !== null ? b.order : 999;
              return orderA - orderB;
            });
            
            // Helper function to extract element type (same as component-backed pages)
            const getElementTypeFromId = (elementId: string, elementType?: string): string => {
              if (elementType) {
                const validElementTypes = ['heading', 'text', 'description', 'button', 'image', 'video', 'icon', 'link', 'divider', 'spacer', 'container', 'html', 'list', 'input', 'textarea', 'select', 'label', 'badge', 'form'];
                if (validElementTypes.includes(elementType)) {
                  return elementType;
                }
              }
              
              const id = elementId.toLowerCase();
              if (id.startsWith('html-') || id.startsWith('html')) return 'html';
              else if (id.startsWith('textarea-') || id.startsWith('textarea')) return 'textarea';
              else if (id.startsWith('label-') || id.startsWith('label')) return 'label';
              else if (id.startsWith('container-') || id.startsWith('container')) return 'container';
              else if (id.startsWith('input-') || id.startsWith('input')) return 'input';
              else if (id.startsWith('select-') || id.startsWith('select')) return 'select';
              else if (id.startsWith('form-') || id.startsWith('form')) return 'form';
              else if (id.startsWith('row-') || id.startsWith('row') || id.startsWith('column-') || id.startsWith('column') || id.startsWith('col-')) return 'container'; // Legacy row/column elements treated as containers
              else if (id === 'title' || id.startsWith('heading-') || id.startsWith('heading')) return 'heading';
              else if (id === 'description' || id.startsWith('desc-') || id.startsWith('desc')) return 'description';
              else if (id.startsWith('button-') || id.startsWith('button') || id.includes('button')) return 'button';
              else if (id.startsWith('image-') || id.startsWith('image') || id.startsWith('img-') || id.startsWith('img') || id.includes('image') || id.includes('img')) return 'image';
              else if (id.startsWith('video-') || id.startsWith('video') || id.includes('video')) return 'video';
              else if (id.startsWith('icon-') || id.startsWith('icon') || id.includes('icon')) return 'icon';
              else if (id.startsWith('link-') || id.startsWith('link') || id.includes('link')) return 'link';
              else if (id.startsWith('text-') || id.startsWith('text') || id.includes('text') || id.includes('subtitle')) return 'text';
              else if (id === 'divider' || id.startsWith('divider-') || id.includes('divider')) return 'divider';
              else if (id === 'badge' || id.startsWith('badge-') || id.includes('badge')) return 'badge';
              else if (id.startsWith('list-') || id.startsWith('list') || id.includes('list')) return 'list';
              else if (id === 'spacer' || id.startsWith('spacer-') || id.includes('spacer')) return 'spacer';
              else return 'text';
            };
            
            // Build customElements array with proper structure
            sortedElementIds.forEach((el: any, idx: number) => {
              const elementType = getElementTypeFromId(el.elementId, el.elementType);
              customElements.push({
                id: `custom-el-${el.elementId}-${idx}`,
                type: elementType,
                elId: el.elementId,
                order: el.order !== undefined && el.order !== null ? el.order : idx,
                parentElId: el.parentElId || undefined,
              });
              
              // Store props and styles (same logic as component-backed pages)
              if (el.elementId) {
                if (el.data !== undefined && el.data !== null) {
                  if (typeof el.data === 'object' && !Array.isArray(el.data)) {
                    customElementProps[el.elementId] = { ...el.data };
                  } else {
                    // Map primitive data to props (same as component-backed pages)
                    const mapPrimitiveDataToProps = (elementType: string, data: any): any => {
                      switch (elementType) {
                        case 'heading': return { text: data, heading: data, headingTag: 'h1' };
                        case 'text': case 'description': return { text: data, ...(elementType === 'description' && { description: data }) };
                        case 'button': return { buttonText: data, text: data };
                        case 'image': return { imageUrl: data, imageAlt: '' };
                        case 'video': return { videoUrl: data };
                        case 'icon': return { iconClass: data };
                        case 'link': return { href: '#', text: data };
                        case 'badge': case 'label': return { text: data };
                        case 'html': return { htmlContent: data };
                        case 'list': return { items: data, listType: 'ul', listStyle: 'disc' };
                        case 'input': return { placeholder: data || 'Enter text...', type: 'text' };
                        case 'textarea': return { placeholder: data || 'Enter text...' };
                        case 'select': return Array.isArray(data) ? { options: data } : { options: [data] };
                        default: return { text: data };
                      }
                    };
                    customElementProps[el.elementId] = mapPrimitiveDataToProps(elementType, el.data);
                  }
                } else {
                  customElementProps[el.elementId] = {};
                }
                
                // Store styles
                if (el.style && typeof el.style === 'object' && !Array.isArray(el.style)) {
                  let elementStyles = { ...el.style };
                  
                  // Convert gridColumns/gridRows (same as component-backed pages)
                  if (elementStyles.display === 'grid' && (elementStyles as any).gridColumns && !elementStyles.gridTemplateColumns) {
                    const gridColumnsValue = (elementStyles as any).gridColumns;
                    if (gridColumnsValue !== 'auto' && gridColumnsValue !== undefined && gridColumnsValue !== null && gridColumnsValue !== '') {
                      const numColumns = parseInt(String(gridColumnsValue), 10);
                      if (!isNaN(numColumns) && numColumns > 0) {
                        elementStyles.gridTemplateColumns = `repeat(${numColumns}, 1fr)`;
                      }
                    }
                  }
                  if (elementStyles.display === 'grid' && (elementStyles as any).gridRows && !elementStyles.gridTemplateRows) {
                    const gridRowsValue = (elementStyles as any).gridRows;
                    if (gridRowsValue !== 'auto' && gridRowsValue !== undefined && gridRowsValue !== null && gridRowsValue !== '') {
                      const numRows = parseInt(String(gridRowsValue), 10);
                      if (!isNaN(numRows) && numRows > 0) {
                        elementStyles.gridTemplateRows = `repeat(${numRows}, auto)`;
                      }
                    }
                  }
                  
                  customElementStyles[el.elementId] = elementStyles;
                } else {
                  customElementStyles[el.elementId] = {};
                }
              }
            });
            
            // Add section styles
            if (layoutSection.styles && typeof layoutSection.styles === 'object' && !Array.isArray(layoutSection.styles)) {
              customElementStyles['section'] = { ...layoutSection.styles };
            } else {
              customElementStyles['section'] = {};
            }
            
            return {
              id: sectionId,
              componentType: componentType,
              componentId: null, // No component ID for layout sections
              projectId: projectId,
              customElements: customElements,
              customElementProps: customElementProps,
              customElementStyles: customElementStyles,
              styles: layoutSection.styles || {},
            };
          });
        } else if (selectedPage.componentIds && Array.isArray(selectedPage.componentIds) && selectedPage.componentIds.length > 0) {
          // Fallback to componentIds (component-backed pages)
          console.log('[customSites] Loading component-backed page from componentIds:', selectedPage.componentIds.length, 'components');
          
          // Process components into sections
          processedSections = (selectedPage.componentIds || []).map((compData: any) => {
          const component = compData.componentId;
          // Use uniqueId directly from compData (primary field) - this is what we save in the database
          // Fallback to component.uniqueId for backward compatibility
          const uniqueId = compData.uniqueId || component?.uniqueId || component?.name?.toLowerCase().replace(/\s+/g, '');
          
          console.log(`[customSites] Processing component with uniqueId: ${uniqueId}`, {
            compDataUniqueId: compData.uniqueId,
            componentUniqueId: component?.uniqueId,
            componentName: component?.name
          });
          
          // Process elementIds - ensure order is preserved from DB
          // Elements can be nested with children, so we need to flatten them recursively
          const elementIds = compData.elementIds || [];
          console.log(`[customSites] Processing component ${uniqueId} with ${elementIds.length} top-level elements:`, elementIds);
          
          // Recursive function to flatten nested element structure
          const flattenElements = (elements: any[], parentElId?: string): any[] => {
            const flattened: any[] = [];
            
            elements.forEach((el: any) => {
              // Get the element ID (could be elementId or elId)
              const currentElId = el.elementId || el.elId;
              
              // Add current element with parentElId
              const flatElement = {
                ...el,
                elementId: currentElId, // Ensure elementId is always set
                parentElId: parentElId || el.parentElId || undefined
              };
              flattened.push(flatElement);
              
              // Recursively process children if they exist
              if (el.children && Array.isArray(el.children) && el.children.length > 0) {
                const childElements = flattenElements(el.children, currentElId);
                flattened.push(...childElements);
              }
            });
            
            return flattened;
          };
          
          // Flatten all elements (including nested children)
          const allElements = flattenElements(elementIds);
          console.log(`[customSites] Flattened ${allElements.length} total elements (including children) from ${elementIds.length} top-level elements`);
          
          // Sort elements by order if available, otherwise keep original order
          const sortedElementIds = [...allElements].sort((a: any, b: any) => {
            const orderA = a.order !== undefined && a.order !== null ? a.order : 999;
            const orderB = b.order !== undefined && b.order !== null ? b.order : 999;
            return orderA - orderB;
          });
          
          // Helper function to extract element type from elementId (same logic as builder)
          const getElementTypeFromId = (elementId: string, elementType?: string): string => {
            // If elementType is provided and valid, use it
            if (elementType) {
              const validElementTypes = ['heading', 'text', 'description', 'button', 'image', 'video', 'icon', 'link', 'divider', 'spacer', 'container', 'html', 'list', 'input', 'textarea', 'select', 'label', 'badge', 'form'];
              if (validElementTypes.includes(elementType)) {
                return elementType;
              }
            }
            
            // Extract type from elementId prefix (same logic as builder)
            const id = elementId.toLowerCase();
            
            // Check prefixes first (most specific)
            if (id.startsWith('html-') || id.startsWith('html')) {
              return 'html';
            } else if (id.startsWith('textarea-') || id.startsWith('textarea')) {
              return 'textarea';
            } else if (id.startsWith('label-') || id.startsWith('label')) {
              return 'label';
            } else if (id.startsWith('container-') || id.startsWith('container')) {
              return 'container';
            } else if (id.startsWith('input-') || id.startsWith('input')) {
              return 'input';
            } else if (id.startsWith('select-') || id.startsWith('select')) {
              return 'select';
            } else if (id.startsWith('form-') || id.startsWith('form')) {
              return 'form';
            } else if (id.startsWith('row-') || id.startsWith('row') || id.startsWith('column-') || id.startsWith('column') || id.startsWith('col-')) {
              return 'container'; // Legacy row/column elements treated as containers
            } else if (id === 'title' || id.startsWith('heading-') || id.startsWith('heading')) {
              return 'heading';
            } else if (id === 'description' || id.startsWith('desc-') || id.startsWith('desc')) {
              return 'description';
            } else if (id.startsWith('button-') || id.startsWith('button') || id.includes('button')) {
              return 'button';
            } else if (id.startsWith('image-') || id.startsWith('image') || id.startsWith('img-') || id.startsWith('img') || id.includes('image') || id.includes('img')) {
              return 'image';
            } else if (id.startsWith('video-') || id.startsWith('video') || id.includes('video')) {
              return 'video';
            } else if (id.startsWith('icon-') || id.startsWith('icon') || id.includes('icon')) {
              return 'icon';
            } else if (id.startsWith('link-') || id.startsWith('link') || id.includes('link')) {
              return 'link';
            } else if (id.startsWith('text-') || id.startsWith('text') || id.includes('text') || id.includes('subtitle')) {
              return 'text';
            } else if (id === 'divider' || id.startsWith('divider-') || id.includes('divider')) {
              return 'divider';
            } else if (id === 'badge' || id.startsWith('badge-') || id.includes('badge')) {
              return 'badge';
            } else if (id.startsWith('list-') || id.startsWith('list') || id.includes('list')) {
              return 'list';
            } else if (id === 'spacer' || id.startsWith('spacer-') || id.includes('spacer')) {
              return 'spacer';
            } else {
              // Default to 'text' for safety (most common)
              return 'text';
            }
          };
          
          // Build customElements array with proper structure
          const customElements = sortedElementIds.map((el: any, idx: number) => {
            const elementType = getElementTypeFromId(el.elementId, el.elementType);
            console.log(`[customSites] Element ${el.elementId}: extracted type="${elementType}" (from elementType: ${el.elementType || 'none'}), parentElId="${el.parentElId || 'none'}", data:`, JSON.stringify(el.data), 'data type:', typeof el.data, 'isArray:', Array.isArray(el.data), 'style:', JSON.stringify(el.style));
            return {
              id: `custom-el-${el.elementId}-${idx}`,
              type: elementType,
              elId: el.elementId,
              order: el.order !== undefined && el.order !== null ? el.order : idx, // Use order from DB, fallback to index
              parentElId: el.parentElId || undefined, // Include parentElId for container hierarchy
            };
          });
          
          // Build props and styles objects
          const customElementProps: Record<string, any> = {};
          const customElementStyles: Record<string, any> = {};
          
          // Helper function to map primitive data to correct prop based on element type
          const mapPrimitiveDataToProps = (elementType: string, data: any): any => {
            switch (elementType) {
              case 'heading':
                return { text: data, heading: data, headingTag: 'h1' };
              case 'text':
              case 'description':
                return { text: data, ...(elementType === 'description' && { description: data }) };
              case 'button':
                return { buttonText: data, text: data };
              case 'image':
                return { imageUrl: data, imageAlt: '' };
              case 'video':
                return { videoUrl: data };
              case 'icon':
                return { iconClass: data };
              case 'link':
                return { href: '#', text: data };
              case 'badge':
              case 'label':
                return { text: data };
              case 'html':
                return { htmlContent: data };
              case 'list':
                // For list, if data is a string, treat as items (newline-separated)
                if (typeof data === 'string') {
                  return { items: data, listType: 'ul', listStyle: 'disc' };
                }
                return { items: data, listType: 'ul', listStyle: 'disc' };
              case 'input':
                return { placeholder: data || 'Enter text...', type: 'text' };
              case 'textarea':
                return { placeholder: data || 'Enter text...' };
              case 'select':
                // For select, if data is an array, use as options
                if (Array.isArray(data)) {
                  return { options: data };
                }
                return { options: [data] };
              default:
                return { text: data };
            }
          };
          
          sortedElementIds.forEach((el: any) => {
            if (el.elementId) {
              const elementType = getElementTypeFromId(el.elementId, el.elementType);
              
              // Store props - el.data contains the element properties
              // Handle both object and primitive data
              if (el.data !== undefined && el.data !== null) {
                if (typeof el.data === 'object' && !Array.isArray(el.data)) {
                  // If data is an object, use it directly (already has correct structure from DB)
                  // But ensure we have all required properties based on element type
                  const baseProps: any = {};
                  
                  // Copy all existing properties from el.data
                  Object.keys(el.data).forEach(key => {
                    baseProps[key] = el.data[key];
                  });
                  
                  // For heading elements, ensure we have text, heading, and headingTag
                  if (elementType === 'heading') {
                    // If we have heading but no text, copy it
                    if (baseProps.heading && !baseProps.text) {
                      baseProps.text = baseProps.heading;
                    }
                    // If we have text but no heading, copy it
                    if (baseProps.text && !baseProps.heading) {
                      baseProps.heading = baseProps.text;
                    }
                    // Ensure headingTag exists
                    if (!baseProps.headingTag) {
                      baseProps.headingTag = baseProps.headingTag || 'h1';
                    }
                  }
                  
                  // For description elements, ensure we have both text and description
                  if (elementType === 'description') {
                    if (baseProps.description && !baseProps.text) {
                      baseProps.text = baseProps.description;
                    }
                    if (baseProps.text && !baseProps.description) {
                      baseProps.description = baseProps.text;
                    }
                  }
                  
                  // For button elements, ensure we have buttonText
                  if (elementType === 'button') {
                    if (baseProps.buttonText && !baseProps.text) {
                      baseProps.text = baseProps.buttonText;
                    }
                    if (baseProps.text && !baseProps.buttonText) {
                      baseProps.buttonText = baseProps.text;
                    }
                  }
                  
                  // For image elements, ensure we have imageUrl
                  if (elementType === 'image') {
                    if (!baseProps.imageUrl && baseProps.src) {
                      baseProps.imageUrl = baseProps.src;
                    }
                    if (!baseProps.imageAlt && baseProps.alt) {
                      baseProps.imageAlt = baseProps.alt;
                    }
                  }
                  
                  // For video elements, ensure we have videoUrl
                  if (elementType === 'video') {
                    if (!baseProps.videoUrl && baseProps.src) {
                      baseProps.videoUrl = baseProps.src;
                    }
                  }
                  
                  // For link elements, ensure we have href and text
                  if (elementType === 'link') {
                    if (!baseProps.href) {
                      baseProps.href = baseProps.href || '#';
                    }
                    if (!baseProps.text && baseProps.label) {
                      baseProps.text = baseProps.label;
                    }
                  }
                  
                  customElementProps[el.elementId] = baseProps;
                  console.log(`[customSites] Element ${el.elementId} (${elementType}): Using object data with ${Object.keys(baseProps).length} props:`, JSON.stringify(baseProps));
                } else if (Array.isArray(el.data)) {
                  // If data is an array, map it based on element type
                  if (elementType === 'select') {
                    customElementProps[el.elementId] = { options: el.data };
                  } else if (elementType === 'list') {
                    customElementProps[el.elementId] = { items: el.data, listType: 'ul', listStyle: 'disc' };
                  } else {
                    // For other types, try to map array to appropriate prop
                    customElementProps[el.elementId] = mapPrimitiveDataToProps(elementType, el.data);
                  }
                  console.log(`[customSites] Element ${el.elementId} (${elementType}): Mapped array data:`, customElementProps[el.elementId]);
                } else {
                  // If data is primitive (string, number, boolean), map it to appropriate props based on element type
                  customElementProps[el.elementId] = mapPrimitiveDataToProps(elementType, el.data);
                  console.log(`[customSites] Element ${el.elementId} (${elementType}): Mapped primitive data (${typeof el.data}):`, customElementProps[el.elementId]);
                }
              } else {
                // No data - use empty object (renderElement will use defaults)
                customElementProps[el.elementId] = {};
                console.warn(`[customSites] Element ${el.elementId} (${elementType}): No data (el.data is ${el.data}), using empty props - will show defaults`);
              }
              
              // Store styles - el.style contains the element styles
              if (el.style && typeof el.style === 'object' && !Array.isArray(el.style)) {
                let elementStyles = { ...el.style };
                
                // CRITICAL: Convert gridColumns to gridTemplateColumns if display is grid
                // This ensures the grid layout works correctly
                if (elementStyles.display === 'grid' && (elementStyles as any).gridColumns && !elementStyles.gridTemplateColumns) {
                  const gridColumnsValue = (elementStyles as any).gridColumns;
                  if (gridColumnsValue !== 'auto' && gridColumnsValue !== undefined && gridColumnsValue !== null && gridColumnsValue !== '') {
                    const numColumns = parseInt(String(gridColumnsValue), 10);
                    if (!isNaN(numColumns) && numColumns > 0) {
                      elementStyles.gridTemplateColumns = `repeat(${numColumns}, 1fr)`;
                      console.log(`[HomePageClient] Converted gridColumns="${gridColumnsValue}" to gridTemplateColumns="${elementStyles.gridTemplateColumns}" for ${el.elementId}`);
                    }
                  }
                }
                
                // CRITICAL: Convert gridRows to gridTemplateRows if display is grid
                if (elementStyles.display === 'grid' && (elementStyles as any).gridRows && !elementStyles.gridTemplateRows) {
                  const gridRowsValue = (elementStyles as any).gridRows;
                  if (gridRowsValue !== 'auto' && gridRowsValue !== undefined && gridRowsValue !== null && gridRowsValue !== '') {
                    const numRows = parseInt(String(gridRowsValue), 10);
                    if (!isNaN(numRows) && numRows > 0) {
                      elementStyles.gridTemplateRows = `repeat(${numRows}, auto)`;
                      console.log(`[HomePageClient] Converted gridRows="${gridRowsValue}" to gridTemplateRows="${elementStyles.gridTemplateRows}" for ${el.elementId}`);
                    }
                  }
                }
                
                customElementStyles[el.elementId] = elementStyles;
              } else {
                customElementStyles[el.elementId] = {};
              }
            }
          });
          
          // Add section styles to customElementStyles for "section" elId
          // This allows the component to apply section-level styles (layoutType, grid, flex, etc.)
          if (compData.style && typeof compData.style === 'object' && !Array.isArray(compData.style)) {
            customElementStyles['section'] = { ...compData.style };
          } else {
            // Initialize empty section styles if not provided
            customElementStyles['section'] = {};
          }
          
          console.log(`[customSites] Processed section ${uniqueId}:`, {
            customElements,
            customElementProps,
            customElementStyles,
            sectionStyles: customElementStyles['section'],
          });
          
          // Ensure section styles are available both in customElementStyles and as styles property
          const sectionStylesData = compData.style && typeof compData.style === 'object' && !Array.isArray(compData.style) 
            ? compData.style 
            : {};
          
          // Generate section ID - use component._id if available, otherwise use uniqueId
          const sectionId = component?._id 
            ? `section-${component._id}` 
            : `section-${uniqueId}-${Date.now()}`;
          
          // Get componentId if available (for backward compatibility)
          const componentId = component?._id || compData.componentId || null;
          
          return {
            id: sectionId,
            componentType: uniqueId, // Use uniqueId directly - this is what we save in database
            componentId: componentId, // Keep for backward compatibility
            projectId: projectId,
            customElements,
            customElementProps,
            customElementStyles: {
              ...customElementStyles,
              // Ensure section styles are always available
              section: customElementStyles['section'] || sectionStylesData,
            },
            styles: sectionStylesData,
          };
          });
        } else {
          console.warn('[customSites] Page has no GenieBuild sections, layout, or componentIds');
          processedSections = [];
        }

        setSections(processedSections);
        // Note: isGenieBuildPage and genieBuildSections are already set above if GenieBuild page is detected
        console.log('Processed sections:', processedSections);
        console.log('Is GenieBuild page:', isGenieBuildPage);
        console.log('GenieBuild sections count:', genieBuildSections.length);
      } catch (err: any) {
        console.error('Error loading website data:', err);
        setError(err.message || 'Failed to load website data');
      } finally {
        setLoading(false);
      }
    }

    loadWebsiteData();
  }, []);

  if (loading) {
    return (
      <>
        <SeoHead keywords={seoData?.meta_keywords} canonicalUrl={seoData?.canonical_url} />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading website...</p>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <SeoHead keywords={seoData?.meta_keywords} canonicalUrl={seoData?.canonical_url} />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-2">Error</h1>
            <p className="text-gray-600">{error}</p>
          </div>
        </div>
      </>
    );
  }

  // Get projectId from environment variable
  const projectId = process.env.NEXT_PUBLIC_PROJECT_ID;

  return (
    <>
      <SeoHead keywords={seoData?.meta_keywords} canonicalUrl={seoData?.canonical_url} />
      {/* Header */}
      {projectId && HeaderA && <HeaderA projectId={projectId} />}
      
      {/* Render GenieBuild sections if this is a GenieBuild page */}
      {isGenieBuildPage && genieBuildSections.length > 0 ? (
        <GenieBuildPageRenderer 
          sections={genieBuildSections} 
          globalColors={globalColors}
          projectId={projectId || undefined}
        />
      ) : (
        <div className="full-width" style={{ width: '100%', maxWidth: '100%', margin: 0, padding: 0 }}>
        {sections.map((section) => {
        const Component = registry[section.componentType];
        const hasCustomElements = section.customElements && section.customElements.length > 0;
        const isLayoutSection = section.componentType === 'layout' || (!Component && hasCustomElements);
        
        // Create __studio object for both component-backed and layout sections
        const studioObject = {
          getCustomElements: () => {
            // Return sorted elements by order
            const elements = section.customElements || [];
            const sorted = [...elements].sort((a, b) => (a.order || 0) - (b.order || 0));
            console.log(`[customSites] getCustomElements for ${section.componentType}:`, sorted);
            return sorted;
          },
          getElementStyle: (elId: string) => {
            // Special handling for section styles
            let styles = section.customElementStyles[elId] || {};
            
            // If elId is "section" and we have section styles, use them
            if (elId === 'section' && section.styles && Object.keys(section.styles).length > 0) {
              styles = { ...section.styles, ...styles }; // Merge section.styles with customElementStyles['section']
            }
            
            // CRITICAL: Ensure gridColumns is converted to gridTemplateColumns if not already converted
            // This is a safety check in case conversion didn't happen during data loading
            if (styles.display === 'grid' && (styles as any).gridColumns && !styles.gridTemplateColumns) {
              const gridColumnsValue = (styles as any).gridColumns;
              if (gridColumnsValue !== 'auto' && gridColumnsValue !== undefined && gridColumnsValue !== null && gridColumnsValue !== '') {
                const numColumns = parseInt(String(gridColumnsValue), 10);
                if (!isNaN(numColumns) && numColumns > 0) {
                  styles.gridTemplateColumns = `repeat(${numColumns}, 1fr)`;
                  console.log(`[customSites] getElementStyle: Converted gridColumns="${gridColumnsValue}" to gridTemplateColumns="${styles.gridTemplateColumns}" for ${elId}`);
                }
              }
            }
            
            // CRITICAL: Ensure gridRows is converted to gridTemplateRows if not already converted
            if (styles.display === 'grid' && (styles as any).gridRows && !styles.gridTemplateRows) {
              const gridRowsValue = (styles as any).gridRows;
              if (gridRowsValue !== 'auto' && gridRowsValue !== undefined && gridRowsValue !== null && gridRowsValue !== '') {
                const numRows = parseInt(String(gridRowsValue), 10);
                if (!isNaN(numRows) && numRows > 0) {
                  styles.gridTemplateRows = `repeat(${numRows}, auto)`;
                  console.log(`[customSites] getElementStyle: Converted gridRows="${gridRowsValue}" to gridTemplateRows="${styles.gridTemplateRows}" for ${elId}`);
                }
              }
            }
            
            console.log(`[customSites] getElementStyle for ${elId} in ${section.componentType}:`, styles, 'keys:', Object.keys(styles), 'gridTemplateColumns:', styles.gridTemplateColumns);
            
            // If styles is empty, log a warning
            if (Object.keys(styles).length === 0 && elId === 'section') {
              console.warn(`[customSites] WARNING: Empty section styles for ${section.componentType}. Section styles may not be applied.`);
            }
            
            return styles;
          },
          getElementProps: (elId: string) => {
            const props = section.customElementProps[elId] || {};
            console.log(`[customSites] getElementProps for ${elId} in ${section.componentType}:`, JSON.stringify(props), 'keys:', Object.keys(props));
            // If props is empty object, log a warning
            if (Object.keys(props).length === 0) {
              console.warn(`[customSites] WARNING: Empty props for element ${elId} in ${section.componentType}. Element will use defaults.`);
            }
            return props;
          },
          selectElement: () => {}, // No-op in non-builder mode
          selectedEl: null, // No selection in non-builder mode
        };
        
        // Handle layout sections (componentType === 'layout' or no Component but has customElements)
        if (isLayoutSection) {
          // Render layout section directly using renderRootElements (same as BuilderCanvas)
          const elements = studioObject.getCustomElements();
          const sectionStyles = studioObject.getElementStyle('section');
          
          // Build section background styles (same logic as BuilderCanvas)
          const backgroundType = sectionStyles.backgroundType || 
            (sectionStyles.backgroundVideoUrl ? 'video' : 
             sectionStyles.gradientColors ? 'gradient' : 
             sectionStyles.backgroundImage ? 'image' : 
             sectionStyles.backgroundColor && sectionStyles.backgroundColor !== 'transparent' ? 'color' : 'none');
          
          // Build background styles object
          const backgroundStyles: React.CSSProperties = (() => {
            // For video backgrounds, don't set any background (video element handles it)
            if (backgroundType === 'video') {
              return {}; // Empty object - no backgroundColor or background
            }
            
            // For gradient backgrounds
            if (backgroundType === 'gradient' || sectionStyles.gradientColors) {
              try {
                const colors = typeof sectionStyles.gradientColors === 'string' 
                  ? JSON.parse(sectionStyles.gradientColors) 
                  : sectionStyles.gradientColors;
                const colorStops = Array.isArray(colors) 
                  ? colors.map((c: any) => `${c.color || c} ${c.stop || ''}`).join(', ')
                  : '';
                const gradient = sectionStyles.gradientType === 'radial'
                  ? `radial-gradient(${sectionStyles.gradientDirection || 'center'}, ${colorStops})`
                  : `linear-gradient(${sectionStyles.gradientAngle || sectionStyles.gradientDirection || '90deg'}, ${colorStops})`;
                return {
                  background: gradient, // Use background shorthand (includes background-color: transparent)
                };
              } catch (e) {
                // Fallback if gradient parsing fails
                return {
                  backgroundColor: 'transparent',
                };
              }
            }
            
            // For image backgrounds
            if (backgroundType === 'image' && sectionStyles.backgroundImage) {
              const imageUrl = sectionStyles.backgroundImage.startsWith('linear-gradient') || 
                             sectionStyles.backgroundImage.startsWith('radial-gradient')
                ? sectionStyles.backgroundImage
                : `url(${sectionStyles.backgroundImage})`;
              return {
                backgroundImage: imageUrl,
                backgroundSize: sectionStyles.backgroundSize || 'cover',
                backgroundPosition: sectionStyles.backgroundPosition || 'center',
                backgroundRepeat: sectionStyles.backgroundRepeat || 'no-repeat',
                backgroundAttachment: sectionStyles.backgroundAttachment || 'scroll',
                backgroundColor: 'transparent', // Explicitly set transparent to prevent white
              };
            }
            
            // For color backgrounds
            if (backgroundType === 'color') {
              return {
                backgroundColor: sectionStyles.backgroundColor || 'transparent',
              };
            }
            
            // For none or fallback
            return {
              backgroundColor: 'transparent',
            };
          })();
          
          // Extract non-background styles from sectionStyles
          const { 
            backgroundType: _bgType,
            backgroundImage: _bgImage,
            backgroundColor: _bgColor,
            gradientColors: _gradColors,
            gradientType: _gradType,
            gradientDirection: _gradDir,
            gradientAngle: _gradAngle,
            backgroundSize: _bgSize,
            backgroundPosition: _bgPos,
            backgroundRepeat: _bgRepeat,
            backgroundAttachment: _bgAttach,
            backgroundVideoUrl: _bgVideoUrl,
            ...nonBackgroundStyles 
          } = sectionStyles;
          
          return (
            <div 
              key={`${section.id}-layout`} 
              className="full-width" 
              style={{ 
                width: '100%', 
                maxWidth: 'none', // Sections have no max-width constraint (Elementor-style)
                margin: 0, 
                padding: 0,
                position: 'relative',
                display: 'block',
                boxSizing: 'border-box',
                ...backgroundStyles, // Apply background styles
                ...nonBackgroundStyles, // Apply other section styles (padding, margin, etc.)
              }}
            >
              {/* Background Video */}
              {(backgroundType === 'video' || sectionStyles.backgroundVideoUrl) && sectionStyles.backgroundVideoUrl && (
                <video
                  autoPlay={sectionStyles.backgroundVideoAutoplay !== false}
                  loop={sectionStyles.backgroundVideoLoop !== false}
                  muted={sectionStyles.backgroundVideoMuted !== false}
                  playsInline
                  className="absolute inset-0 w-full h-full object-cover z-0"
                  style={{ 
                    pointerEvents: 'none',
                    display: sectionStyles.backgroundVideoDisableOnMobile ? 'none' : 'block'
                  }}
                  poster={sectionStyles.backgroundVideoPoster || sectionStyles.posterImage}
                >
                  <source src={sectionStyles.backgroundVideoUrl} type="video/mp4" />
                </video>
              )}
              
              {/* Background Overlay - Show for ALL background types (gradient, color, image, video) - MUST be BEFORE content */}
              {(() => {
                // Overlay should appear for ALL background types when overlayColor and overlayOpacity are set
                // Default to black if overlayOpacity is set but overlayColor is not
                const overlayOpacity = sectionStyles.overlayOpacity !== undefined 
                  ? parseFloat(String(sectionStyles.overlayOpacity)) 
                  : 0;
                const overlayColor = sectionStyles.overlayColor || 
                  (overlayOpacity > 0 ? '#000000' : undefined); // Default to black if opacity is set
                
                const shouldShowOverlay = overlayColor && 
                  overlayColor !== 'transparent' &&
                  overlayOpacity > 0;
                
                return shouldShowOverlay ? (
                  <div
                    className="absolute inset-0"
                    style={{
                      zIndex: 1, // Above background (z-0) but below content (z-10)
                      backgroundColor: (() => {
                        // Use the resolved overlayColor (already defaults to black if opacity is set)
                        const color = overlayColor || '#000000';
                        // Use the color directly (like preview does) - opacity will be applied via CSS opacity property
                        if (color.startsWith('#')) {
                          return color;
                        }
                        // If rgba, extract just the color part (remove opacity)
                        if (color.startsWith('rgba')) {
                          const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
                          if (match) {
                            return `rgb(${match[1]}, ${match[2]}, ${match[3]})`;
                          }
                        }
                        return color;
                      })(),
                      opacity: overlayOpacity,
                      pointerEvents: 'none', // Allow clicks to pass through
                    }}
                  />
                ) : null;
              })()}
              
              {/* Content - render customElements */}
              <div style={{ position: 'relative', zIndex: 10 }}>
                {renderRootElements({
                  sortedElements: elements,
                  getElProps: (elId: string) => studioObject.getElementProps(elId),
                  getElStyle: (elId: string) => studioObject.getElementStyle(elId),
                  isElSelected: () => false, // No selection in custom sites
                  builderMode: false,
                  __nodeId: section.id,
                  __studio: studioObject,
                })}
              </div>
            </div>
          );
        }
        
        // Handle component-backed sections
        if (!Component) {
          console.warn(`Component ${section.componentType} not found in registry`);
          return (
            <div key={section.id} className="full-width" style={{ padding: '20px', backgroundColor: '#fee2e2', color: '#991b1b' }}>
              Component &quot;{section.componentType}&quot; not found
            </div>
          );
        }

        return (
          <div key={`${section.id}-${section.componentType}`} className="full-width" style={{ width: '100%', maxWidth: '100%', margin: 0, padding: 0 }}>
            <Component
              key={`${section.id}-${section.componentType}`}
              __nodeId={section.id}
              projectId={section.projectId}
              __studio={studioObject}
            />
          </div>
        );
      })}
        </div>
      )}
      
      {/* Footer */}
      {projectId && FooterA && <FooterA projectId={projectId} />}
    </>
  );
}
