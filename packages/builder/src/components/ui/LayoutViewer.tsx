import React, { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronDown, FileText, Layers, Box, Loader2 } from 'lucide-react';

interface ElementData {
  elementId: string;
  elementType: string;
  order: number;
  style: Record<string, any>;
  data: Record<string, any>;
  hasChildren: boolean;
  childrenCount: number;
  children?: ElementData[];
}

interface ComponentData {
  uniqueId: string;
  componentId: string | null;
  style: Record<string, any>;
  elementsCount: number;
  elements: ElementData[];
}

interface PageLayoutData {
  pageId: string;
  components: ComponentData[];
  componentsCount: number;
}

interface ComponentLayoutData {
  uniqueId: string;
  componentId: string | null;
  style: Record<string, any>;
  elements: ElementData[];
  elementsCount: number;
}

interface PageData {
  pageId: string;
  pageName: string | null;
  pageSlug: string | null;
  pageDisplayName: string | null;
  style: Record<string, any>;
  componentsCount: number;
  components: ComponentData[];
}

interface LayoutViewerProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  pageId?: string;
  uniqueId?: string;
  elementId?: string;
  elementType?: string;
  elementData?: ElementData;
  position?: { x: number; y: number };
}

export default function LayoutViewer({
  isOpen,
  onClose,
  projectId,
  pageId,
  uniqueId,
  elementId,
  elementType,
  elementData,
  position
}: LayoutViewerProps) {
  const [layoutData, setLayoutData] = useState<PageData[] | null>(null);
  const [pageLayoutData, setPageLayoutData] = useState<PageLayoutData | null>(null);
  const [componentLayoutData, setComponentLayoutData] = useState<ComponentLayoutData | null>(null);
  const [elementChildren, setElementChildren] = useState<ElementData[] | null>(null);
  const [currentElement, setCurrentElement] = useState<ElementData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  // Fetch layout data
  useEffect(() => {
    if (!isOpen || !projectId) return;

    const fetchLayout = async () => {
      setLoading(true);
      setError(null);

      try {
        // Always use get_element_children API - it handles all scenarios
        const apiUrl = (window as any).__API_URL__ || 'http://localhost:1111';
        const cleanUrl = apiUrl.replace(/\/admin\/v1\/?$/, '').replace(/\/$/, '');
        
        const response = await fetch(`${cleanUrl}/custom/v1/get_element_children`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectId,
            pageId,
            uniqueId,
            elementId
          })
        });

        const result = await response.json();
        if (result.success && result.data) {
          // Clear previous data
          setLayoutData(null);
          setPageLayoutData(null);
          setComponentLayoutData(null);
          setElementChildren(null);
          setCurrentElement(null);

          // Determine response type based on what data is present
          if (result.data.components !== undefined) {
            // Scenario 1: Only pageId - page layout with components
            setPageLayoutData(result.data);
            const firstLevelIds = new Set<string>();
            result.data.components?.forEach((comp: ComponentData) => {
              firstLevelIds.add(`comp-${comp.uniqueId}`);
            });
            setExpandedItems(firstLevelIds);
          } else if (result.data.elements !== undefined) {
            // Scenario 2: pageId + uniqueId - component layout with elements
            setComponentLayoutData(result.data);
            const firstLevelIds = new Set<string>();
            result.data.elements?.forEach((el: ElementData, idx: number) => {
              firstLevelIds.add(`el-${el.elementId}-${idx}`);
            });
            setExpandedItems(firstLevelIds);
          } else if (result.data.children !== undefined) {
            // Scenario 3: pageId + uniqueId + elementId - element children
            setElementChildren(result.data.children || []);
            setCurrentElement(result.data.element);
            const firstLevelIds = new Set<string>();
            result.data.children?.forEach((el: ElementData, idx: number) => {
              firstLevelIds.add(`child-${el.elementId}-${idx}`);
            });
            setExpandedItems(firstLevelIds);
          } else {
            setError('Unexpected response format');
          }
        } else {
          setError(result.message || 'Failed to fetch layout data');
        }
      } catch (err: any) {
        setError(err.message || 'Error fetching layout data');
      } finally {
        setLoading(false);
      }
    };

    fetchLayout();
  }, [isOpen, projectId, pageId, uniqueId, elementId]);

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  const renderElement = (element: ElementData, depth: number = 0, parentId: string = '') => {
    const itemId = `${parentId}-${element.elementId}`;
    const isExpanded = expandedItems.has(itemId);
    const hasChildren = element.hasChildren && element.children && element.children.length > 0;

    return (
      <div key={element.elementId} style={{ marginLeft: `${depth * 20}px` }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 8px',
            borderRadius: '4px',
            backgroundColor: depth % 2 === 0 ? 'rgba(249, 250, 251, 1)' : 'rgba(255, 255, 255, 1)',
            cursor: hasChildren ? 'pointer' : 'default',
            border: '1px solid rgba(229, 231, 235, 1)',
            marginBottom: '2px'
          }}
          onClick={() => hasChildren && toggleExpand(itemId)}
        >
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown size={14} style={{ color: '#6b7280' }} />
            ) : (
              <ChevronRight size={14} style={{ color: '#6b7280' }} />
            )
          ) : (
            <Box size={14} style={{ color: '#9ca3af', marginLeft: '18px' }} />
          )}
          <span style={{ fontWeight: 500, color: '#111827' }}>{element.elementId}</span>
          <span style={{ fontSize: '12px', color: '#6b7280' }}>({element.elementType})</span>
          {element.childrenCount > 0 && (
            <span
              style={{
                fontSize: '11px',
                backgroundColor: '#dbeafe',
                color: '#1e40af',
                padding: '2px 6px',
                borderRadius: '12px',
                fontWeight: 500
              }}
            >
              {element.childrenCount} {element.childrenCount === 1 ? 'child' : 'children'}
            </span>
          )}
        </div>
        {isExpanded && hasChildren && element.children && (
          <div style={{ marginTop: '4px' }}>
            {element.children.map((child) => renderElement(child, depth + 1, itemId))}
          </div>
        )}
      </div>
    );
  };

  const renderComponent = (component: ComponentData, depth: number = 0) => {
    const itemId = `comp-${component.uniqueId}`;
    const isExpanded = expandedItems.has(itemId);

    return (
      <div key={component.uniqueId} style={{ marginLeft: `${depth * 20}px` }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 10px',
            borderRadius: '4px',
            backgroundColor: 'rgba(239, 246, 255, 1)',
            cursor: 'pointer',
            border: '1px solid rgba(191, 219, 254, 1)',
            marginBottom: '4px'
          }}
          onClick={() => toggleExpand(itemId)}
        >
          {isExpanded ? (
            <ChevronDown size={16} style={{ color: '#3b82f6' }} />
          ) : (
            <ChevronRight size={16} style={{ color: '#3b82f6' }} />
          )}
          <Layers size={16} style={{ color: '#3b82f6' }} />
          <span style={{ fontWeight: 600, color: '#1e40af' }}>{component.uniqueId}</span>
          <span
            style={{
              fontSize: '11px',
              backgroundColor: '#dbeafe',
              color: '#1e40af',
              padding: '2px 6px',
              borderRadius: '12px',
              fontWeight: 500
            }}
          >
            {component.elementsCount} {component.elementsCount === 1 ? 'element' : 'elements'}
          </span>
        </div>
        {isExpanded && (
          <div style={{ marginTop: '4px' }}>
            {component.elements.map((element) => renderElement(element, depth + 1, itemId))}
          </div>
        )}
      </div>
    );
  };

  const renderPage = (page: PageData, depth: number = 0) => {
    const itemId = `page-${page.pageId}`;
    const isExpanded = expandedItems.has(itemId);

    return (
      <div key={page.pageId} style={{ marginLeft: `${depth * 20}px`, marginBottom: '12px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 12px',
            borderRadius: '6px',
            backgroundColor: 'rgba(255, 247, 237, 1)',
            cursor: 'pointer',
            border: '2px solid rgba(251, 191, 36, 1)',
            marginBottom: '8px'
          }}
          onClick={() => toggleExpand(itemId)}
        >
          {isExpanded ? (
            <ChevronDown size={18} style={{ color: '#f59e0b' }} />
          ) : (
            <ChevronRight size={18} style={{ color: '#f59e0b' }} />
          )}
          <FileText size={18} style={{ color: '#f59e0b' }} />
          <span style={{ fontWeight: 700, color: '#92400e', fontSize: '15px' }}>
            {page.pageDisplayName || page.pageName || page.pageSlug || 'Untitled Page'}
          </span>
          <span
            style={{
              fontSize: '11px',
              backgroundColor: '#fef3c7',
              color: '#92400e',
              padding: '2px 8px',
              borderRadius: '12px',
              fontWeight: 600
            }}
          >
            {page.componentsCount} {page.componentsCount === 1 ? 'component' : 'components'}
          </span>
        </div>
        {isExpanded && (
          <div style={{ marginTop: '4px' }}>
            {page.components.map((component) => renderComponent(component, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  // Calculate modal position exactly at the click point
  const modalWidth = 800;
  const modalHeight = Math.min(window.innerHeight * 0.9, 600);
  
  let modalTop = '50%';
  let modalLeft = '50%';
  let transform = 'translate(-50%, -50%)';
  
  console.log('[LayoutViewer] Component render - isOpen:', isOpen, 'position:', position, 'position type:', typeof position, 'position.x:', position?.x, 'position.y:', position?.y);
  
  if (!isOpen) {
    console.log('[LayoutViewer] Not rendering because isOpen is false');
    return null;
  }
  
  if (!position) {
    console.log('[LayoutViewer] No position provided, using centered position');
  } else if (!position.x || !position.y || position.x <= 0 || position.y <= 0) {
    console.log('[LayoutViewer] Invalid position values:', position);
  }
  
  if (position && position.x > 0 && position.y > 0) {
    // Position modal exactly at the click point with small offset
    // e.clientX and e.clientY are viewport coordinates (relative to viewport, not document)
    // Since we're using position: fixed, we use viewport coordinates directly
    // CRITICAL: Use the exact click position - position.y is the Y coordinate where user clicked
    // Make top follow Y axis exactly like left follows X axis - NO CONSTRAINTS
    
    console.log('[LayoutViewer] Position received:', {
      'position.x': position.x,
      'position.y': position.y,
      'window.innerHeight': window.innerHeight,
      'window.innerWidth': window.innerWidth,
      'modalWidth': modalWidth,
      'modalHeight': modalHeight,
      'window.scrollY': window.scrollY,
      'document.documentElement.scrollTop': document.documentElement.scrollTop
    });
    
    // Start with exact click position + offset
    let left = position.x + 15;
    let top = position.y + 15; // THIS IS THE EXACT Y WHERE USER CLICKED + 15px offset
    
    console.log('[LayoutViewer] Initial calculated position:', {
      'left (before adjustment)': left,
      'top (before adjustment)': top
    });
    
    // Only adjust if modal would go off-screen - otherwise use exact click position
    // For horizontal (left) - same logic that's working correctly
    if (left + modalWidth > window.innerWidth) {
      left = position.x - modalWidth - 15;
      if (left < 0) left = 0;
    }
    
    // For vertical (top) - Use exact click Y position
    // Only adjust if modal would go off bottom of viewport
    // But don't clamp to 0 if it would go off top - let it be at the click position
    if (top + modalHeight > window.innerHeight) {
      // Try to position above the click point
      top = position.y - modalHeight - 15;
      // If that would go off the top, position at the top of viewport
      if (top < 0) {
        top = 0;
      }
    }
    
    // CRITICAL: Don't add any other constraints - let top be exactly what we calculated
    // The issue was that we were constraining it too much
    
    console.log('[LayoutViewer] Final calculated position:', {
      'left (after adjustment)': left,
      'top (after adjustment)': top,
      'modalLeft (final)': `${left}px`,
      'modalTop (final)': `${top}px`
    });
    
    // NO Math.max or Math.min constraints - let it use the calculated value
    // The top should be exactly position.y + 15 (or adjusted if off-screen)
    
    modalLeft = `${left}px`;
    modalTop = `${top}px`; // This will be the exact Y position where user clicked
    transform = 'none';
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: position ? 'block' : 'flex',
        alignItems: position ? undefined : 'center',
        justifyContent: position ? undefined : 'center',
        zIndex: 10000,
        padding: position ? '0' : '20px',
        margin: 0,
        transform: 'none', // Ensure no transforms interfere
        willChange: 'auto' // Prevent browser optimizations that might affect positioning
      }}
      onClick={onClose}
    >
      <div
        style={{
          position: position ? 'fixed' : 'relative',
          top: position ? modalTop : undefined,
          left: position ? modalLeft : undefined,
          transform: position ? transform : undefined,
          backgroundColor: 'white',
          borderRadius: '12px',
          width: '100%',
          maxWidth: `${modalWidth}px`,
          maxHeight: `${modalHeight}px`,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          margin: 0,
          padding: 0,
          // Ensure no transforms or positioning contexts interfere
          willChange: 'auto',
          contain: 'layout style paint', // Isolate from parent transforms
          // CRITICAL: Ensure no other CSS properties interfere with positioning
          right: position ? 'auto' : undefined,
          bottom: position ? 'auto' : undefined
        }}
        onClick={(e) => e.stopPropagation()}
        ref={(el) => {
          if (el && position) {
            console.log('[LayoutViewer] Modal element actual computed style:', {
              'computed top': window.getComputedStyle(el).top,
              'computed left': window.getComputedStyle(el).left,
              'computed position': window.getComputedStyle(el).position,
              'computed transform': window.getComputedStyle(el).transform,
              'element.offsetTop': el.offsetTop,
              'element.getBoundingClientRect().top': el.getBoundingClientRect().top,
              'expected top (modalTop)': modalTop,
              'expected left (modalLeft)': modalLeft
            });
          }
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 24px',
            borderBottom: '1px solid rgba(229, 231, 235, 1)'
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#111827' }}>
              {elementId ? 'Element Children' : uniqueId ? 'Component Layout' : 'Page Layout'}
            </h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#6b7280' }}>
              {elementId 
                ? `Children of element: ${elementId}`
                : uniqueId
                ? `Layout of component: ${uniqueId}`
                : pageId
                ? `Layout of page: ${pageId}`
                : 'Hierarchical structure of pages, components, and elements'}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#6b7280',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(243, 244, 246, 1)';
              e.currentTarget.style.color = '#111827';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#6b7280';
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div
          style={{
            flex: 1,
            overflow: 'auto',
            padding: '20px 24px'
          }}
        >
          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
              <Loader2 size={24} style={{ color: '#3b82f6', animation: 'spin 1s linear infinite' }} />
            </div>
          )}

          {error && (
            <div
              style={{
                padding: '16px',
                backgroundColor: 'rgba(254, 242, 242, 1)',
                border: '1px solid rgba(252, 165, 165, 1)',
                borderRadius: '6px',
                color: '#991b1b'
              }}
            >
              {error}
            </div>
          )}

          {!loading && !error && elementChildren !== null && (
            <div>
              {currentElement && (
                <div style={{ 
                  padding: '12px', 
                  backgroundColor: 'rgba(239, 246, 255, 1)', 
                  borderRadius: '6px', 
                  marginBottom: '12px',
                  border: '1px solid rgba(191, 219, 254, 1)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Box size={16} style={{ color: '#3b82f6' }} />
                    <span style={{ fontWeight: 600, color: '#1e40af' }}>
                      {currentElement.elementId}
                    </span>
                    <span style={{ fontSize: '12px', color: '#6b7280' }}>
                      ({currentElement.elementType})
                    </span>
                  </div>
                </div>
              )}
              {elementChildren.length === 0 ? (
                <p style={{ color: '#6b7280', textAlign: 'center', padding: '20px' }}>
                  This element has no children.
                </p>
              ) : (
                elementChildren.map((element, idx) => renderElement(element, 0, `root-${idx}`))
              )}
            </div>
          )}

          {!loading && !error && componentLayoutData && (
            <div>
              <div style={{ 
                padding: '12px', 
                backgroundColor: 'rgba(239, 246, 255, 1)', 
                borderRadius: '6px', 
                marginBottom: '12px',
                border: '1px solid rgba(191, 219, 254, 1)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Layers size={16} style={{ color: '#3b82f6' }} />
                  <span style={{ fontWeight: 600, color: '#1e40af' }}>
                    {componentLayoutData.uniqueId}
                  </span>
                  <span
                    style={{
                      fontSize: '11px',
                      backgroundColor: '#dbeafe',
                      color: '#1e40af',
                      padding: '2px 6px',
                      borderRadius: '12px',
                      fontWeight: 500
                    }}
                  >
                    {componentLayoutData.elementsCount} {componentLayoutData.elementsCount === 1 ? 'element' : 'elements'}
                  </span>
                </div>
              </div>
              {componentLayoutData.elements.length === 0 ? (
                <p style={{ color: '#6b7280', textAlign: 'center', padding: '20px' }}>
                  This component has no elements.
                </p>
              ) : (
                componentLayoutData.elements.map((element, idx) => renderElement(element, 0, `comp-${componentLayoutData.uniqueId}-${idx}`))
              )}
            </div>
          )}

          {!loading && !error && pageLayoutData && (
            <div>
              <div style={{ 
                padding: '12px', 
                backgroundColor: 'rgba(255, 247, 237, 1)', 
                borderRadius: '6px', 
                marginBottom: '12px',
                border: '2px solid rgba(251, 191, 36, 1)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileText size={18} style={{ color: '#f59e0b' }} />
                  <span style={{ fontWeight: 700, color: '#92400e', fontSize: '15px' }}>
                    Page: {pageLayoutData.pageId}
                  </span>
                  <span
                    style={{
                      fontSize: '11px',
                      backgroundColor: '#fef3c7',
                      color: '#92400e',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontWeight: 600
                    }}
                  >
                    {pageLayoutData.componentsCount} {pageLayoutData.componentsCount === 1 ? 'component' : 'components'}
                  </span>
                </div>
              </div>
              {pageLayoutData.components.length === 0 ? (
                <p style={{ color: '#6b7280', textAlign: 'center', padding: '20px' }}>
                  This page has no components.
                </p>
              ) : (
                pageLayoutData.components.map((component) => renderComponent(component, 0))
              )}
            </div>
          )}

          {!loading && !error && layoutData && (
            <div>
              {layoutData.length === 0 ? (
                <p style={{ color: '#6b7280', textAlign: 'center', padding: '20px' }}>
                  No pages found for this project.
                </p>
              ) : (
                layoutData.map((page) => renderPage(page, 0))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

