'use client';

import React, { useEffect, useRef, useState } from 'react';
import { MoreVertical, ArrowLeft, ChevronRight, ChevronDown, FileText, Layers, Box, Loader2, Plus, ArrowUp, ArrowDown } from 'lucide-react';
import { ContextMenuItem } from './ContextMenu';

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

interface SelectionMenuProps {
  items: ContextMenuItem[];
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  buttonClassName?: string;
  // Layout viewer props
  projectId?: string;
  pageId?: string;
  uniqueId?: string;
  elementId?: string;
  elementType?: string;
  // Add element props
  onAddElement?: (elementType: string) => void;
  availableElementTypes?: string[];
  // Callback to refresh builder after reordering
  onLayoutReorder?: () => void;
}

type MenuView = 'main' | 'layout' | 'addElement';

export default function SelectionMenu({ 
  items, 
  position = 'top-right', 
  buttonClassName = '',
  projectId,
  pageId,
  uniqueId,
  elementId,
  elementType,
  onAddElement,
  availableElementTypes = ['heading', 'text', 'button', 'image', 'video', 'icon', 'html', 'container'],
  onLayoutReorder
}: SelectionMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentView, setCurrentView] = useState<MenuView>('main');
  const [layoutData, setLayoutData] = useState<ElementData[] | ComponentData[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [draggedItem, setDraggedItem] = useState<{ item: ElementData | ComponentData; index: number; parentId: string; parentElementId?: string } | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Fetch layout data when switching to layout view
  useEffect(() => {
    if (currentView === 'layout' && projectId && isOpen) {
      fetchLayoutData();
    } else if (currentView !== 'layout') {
      setLayoutData(null);
      setError(null);
    }
  }, [currentView, projectId, pageId, uniqueId, elementId, isOpen]);

  const fetchLayoutData = async () => {
    if (!projectId) {
      setError('Project ID is required');
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);

    try {
      const apiUrl = (window as any).__API_URL__ || 'http://localhost:1111';
      // Clean URL: remove trailing slashes and /admin/v1 if present
      let cleanUrl = apiUrl.replace(/\/admin\/v1\/?$/, '').replace(/\/$/, '');
      // Ensure we have a protocol
      if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
        cleanUrl = `http://${cleanUrl}`;
      }
      
      const requestBody: any = {
        projectId,
      };
      
      // Only include optional parameters if they have values
      if (pageId) requestBody.pageId = pageId;
      if (uniqueId) requestBody.uniqueId = uniqueId;
      if (elementId) requestBody.elementId = elementId;
      
      const endpointUrl = `${cleanUrl}/custom/v1/get_element_children`;
      console.log('[SelectionMenu] Fetching layout data from:', endpointUrl, 'with body:', requestBody);
      
      const response = await fetch(endpointUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      let result;
      try {
        result = await response.json();
      } catch (parseError) {
        const errorText = await response.text();
        throw new Error(`Failed to parse response: ${errorText}`);
      }
      
      if (!response.ok || !result.success) {
        const errorMessage = result.message || `HTTP error! status: ${response.status}`;
        console.error('[SelectionMenu] API Error:', errorMessage, result);
        console.error('[SelectionMenu] Request details:', { endpointUrl, requestBody });
        throw new Error(errorMessage);
      }

      if (result.success && result.data) {
        if (result.data.children) {
          // Element children
          setLayoutData(result.data.children || []);
          const firstLevelIds = new Set<string>();
          result.data.children?.forEach((el: ElementData, idx: number) => {
            firstLevelIds.add(`el-${el.elementId}-${idx}`);
          });
          setExpandedItems(firstLevelIds);
        } else if (result.data.elements) {
          // Component elements
          setLayoutData(result.data.elements || []);
          const firstLevelIds = new Set<string>();
          result.data.elements?.forEach((el: ElementData, idx: number) => {
            firstLevelIds.add(`el-${el.elementId}-${idx}`);
          });
          setExpandedItems(firstLevelIds);
        } else if (result.data.components) {
          // Page components
          setLayoutData(result.data.components || []);
          const firstLevelIds = new Set<string>();
          result.data.components?.forEach((comp: ComponentData) => {
            firstLevelIds.add(`comp-${comp.uniqueId}`);
          });
          setExpandedItems(firstLevelIds);
        } else {
          // No data found
          setLayoutData([]);
          setExpandedItems(new Set());
        }
      } else {
        setError(result.message || 'Failed to fetch layout data');
        setLayoutData(null);
      }
    } catch (err: any) {
      console.error('Error fetching layout data:', err);
      setError(err.message || 'Error fetching layout data');
      setLayoutData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setCurrentView('main');
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (currentView !== 'main') {
          setCurrentView('main');
        } else {
          setIsOpen(false);
        }
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, currentView]);

  const handleItemClick = (item: ContextMenuItem) => {
    if (item.disabled) return;
    
    // Check if item should open a submenu
    // Handle "View Layout" - check if label starts with "View Layout" (may have additional text like "(3 children)")
    if (item.label?.startsWith('View Layout') && projectId) {
      setCurrentView('layout');
      return;
    }
    
    // REMOVED: Special handling for "Add New Element" - now handled by onClick in menu item
    // The menu item's onClick calls setSidebarMode to open sidebar elements list
    
    if (!item.submenu && item.onClick) {
      item.onClick();
      setIsOpen(false);
      setCurrentView('main');
    }
  };

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  const handleReorder = async (item: ElementData | ComponentData, direction: 'up' | 'down', parentElementId?: string) => {
    if (!projectId) {
      setError('Project ID is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const apiUrl = (window as any).__API_URL__ || 'http://localhost:1111';
      let cleanUrl = apiUrl.replace(/\/admin\/v1\/?$/, '').replace(/\/$/, '');
      if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
        cleanUrl = `http://${cleanUrl}`;
      }

      const isComponent = 'uniqueId' in item;
      const requestBody: any = {
        projectId,
        direction,
      };

      if (pageId) requestBody.pageId = pageId;
      if (isComponent) {
        // Component reordering - would need componentId or index
        setError('Component reordering not yet implemented');
        setLoading(false);
        return;
      } else {
        // Element reordering
        if (!uniqueId) {
          setError('Component uniqueId is required for element reordering');
          setLoading(false);
          return;
        }
        requestBody.uniqueId = uniqueId;
        requestBody.elementId = (item as ElementData).elementId;
        if (parentElementId) {
          requestBody.parentElementId = parentElementId;
        }
      }

      console.log('[SelectionMenu] Reordering element:', requestBody);

      const response = await fetch(`${cleanUrl}/custom/v1/reorder_layout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || `Failed to reorder: ${response.status}`);
      }

      // Refresh layout data after successful reorder
      await fetchLayoutData();
      
      // Fetch updated component layout and update builder in real-time
      if (projectId && uniqueId && !isComponent) {
        try {
          const apiUrl = (window as any).__API_URL__ || 'http://localhost:1111';
          let cleanUrl = apiUrl.replace(/\/admin\/v1\/?$/, '').replace(/\/$/, '');
          if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
            cleanUrl = `http://${cleanUrl}`;
          }

          const layoutRequestBody: any = { projectId };
          if (pageId) layoutRequestBody.pageId = pageId;
          layoutRequestBody.uniqueId = uniqueId;

          const layoutResponse = await fetch(`${cleanUrl}/custom/v1/component_layout`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(layoutRequestBody)
          });

          const layoutResult = await layoutResponse.json();
          
          if (layoutResponse.ok && layoutResult.success && layoutResult.data?.elements) {
            // Convert API elements to builder format (flatten hierarchy)
            const flattenElements = (elements: ElementData[], parentElId?: string): any[] => {
              const result: any[] = [];
              elements.forEach((el, idx) => {
                result.push({
                  id: `element-${el.elementId}-${idx}`,
                  type: el.elementType,
                  elId: el.elementId,
                  order: el.order !== undefined ? el.order : idx,
                  parentElId: parentElId
                });
                // Recursively add children
                if (el.children && Array.isArray(el.children) && el.children.length > 0) {
                  result.push(...flattenElements(el.children, el.elementId));
                }
              });
              return result;
            };
            
            const updatedElements = flattenElements(layoutResult.data.elements);

            // Dispatch event to update builder
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('builder:update-elements', {
                detail: {
                  projectId,
                  pageId,
                  uniqueId,
                  elements: updatedElements
                }
              }));
            }
          }
        } catch (refreshErr) {
          console.error('Error refreshing builder elements:', refreshErr);
          // Non-critical error - layout view is already updated
        }
      }
      
      // Call the callback if provided
      if (onLayoutReorder) {
        onLayoutReorder();
      }
    } catch (err: any) {
      console.error('Error reordering layout:', err);
      setError(err.message || 'Error reordering layout');
    } finally {
      setLoading(false);
    }
  };

  const renderLayoutItem = (item: ElementData | ComponentData, depth: number = 0, parentId: string = '', index: number = 0, siblings: (ElementData | ComponentData)[] = [], actualParentElementId?: string) => {
    const isComponent = 'uniqueId' in item;
    const itemId = isComponent ? `comp-${item.uniqueId}` : `el-${item.elementId}-${parentId}`;
    const isExpanded = expandedItems.has(itemId);
    const hasChildren = isComponent ? (item as ComponentData).elementsCount > 0 : (item as ElementData).hasChildren && (item as ElementData).children && (item as ElementData).children!.length > 0;
    const canMoveUp = index > 0;
    const canMoveDown = index < siblings.length - 1;
    // Use the actual parent element ID if provided, otherwise extract from parentId
    const parentElementId = actualParentElementId || (parentId && parentId.startsWith('el-') ? parentId.replace(/^el-[^-]+-/, '') : undefined);
    const isDragging = draggedItem?.item === item && draggedItem?.index === index && draggedItem?.parentId === parentId;
    const isDragOver = dragOverIndex === index && draggedItem?.parentId === parentId;

    const handleDragStart = (e: React.DragEvent) => {
      if (isComponent) {
        e.preventDefault();
        return;
      }
      e.stopPropagation();
      setDraggedItem({ item, index, parentId, parentElementId });
      e.dataTransfer.effectAllowed = 'move';
      if (e.dataTransfer) {
        e.dataTransfer.setData('text/plain', '');
      }
    };

    const handleDragOver = (e: React.DragEvent) => {
      if (isComponent) return;
      e.preventDefault();
      e.stopPropagation();
      e.dataTransfer.dropEffect = 'move';
      setDragOverIndex(index);
    };

    const handleDragLeave = () => {
      setDragOverIndex(null);
    };

    const handleDrop = async (e: React.DragEvent) => {
      if (isComponent || !draggedItem) return;
      e.preventDefault();
      e.stopPropagation();
      setDragOverIndex(null);

      const { item: draggedItemData, index: sourceIndex, parentId: sourceParentId, parentElementId: sourceParentElementId } = draggedItem;

      // Only allow dropping within the same parent
      if (sourceParentId !== parentId || sourceParentElementId !== parentElementId) {
        setDraggedItem(null);
        return;
      }

      // Calculate direction based on index
      if (sourceIndex === index) {
        setDraggedItem(null);
        return;
      }

      const direction = index < sourceIndex ? 'up' : 'down';
      const moves = Math.abs(index - sourceIndex);

      // Move the item step by step
      setLoading(true);
      try {
        for (let i = 0; i < moves; i++) {
          await handleReorder(draggedItemData, direction, sourceParentElementId);
          // Small delay between moves to ensure backend processes each one
          if (i < moves - 1) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }
      } catch (err) {
        console.error('Error during drag and drop reorder:', err);
        setError('Failed to reorder element');
      } finally {
        setLoading(false);
        setDraggedItem(null);
      }
    };

    return (
      <div 
        key={itemId} 
        draggable={!isComponent}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{
          marginLeft: `${depth * 16}px`,
          opacity: isDragging ? 0.5 : 1,
          borderTop: isDragOver ? '2px solid #3b82f6' : 'none',
          transition: 'all 0.2s'
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 8px',
            borderRadius: '4px',
            backgroundColor: isDragOver 
              ? 'rgba(59, 130, 246, 0.1)' 
              : depth % 2 === 0 
                ? 'rgba(249, 250, 251, 1)' 
                : 'rgba(255, 255, 255, 1)',
            cursor: !isComponent ? 'grab' : (hasChildren ? 'pointer' : 'default'),
            border: isDragOver 
              ? '1px solid #3b82f6' 
              : '1px solid rgba(229, 231, 235, 1)',
            marginBottom: '2px',
            userSelect: 'none'
          }}
        >
          <div
            onClick={() => hasChildren && toggleExpand(itemId)}
            style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: 1, cursor: hasChildren ? 'pointer' : 'default' }}
          >
            {hasChildren ? (
              isExpanded ? (
                <ChevronDown size={12} style={{ color: '#6b7280' }} />
              ) : (
                <ChevronRight size={12} style={{ color: '#6b7280' }} />
              )
            ) : (
              <Box size={12} style={{ color: '#9ca3af', marginLeft: '14px' }} />
            )}
            {!isComponent && (
              <div
                style={{
                  width: '12px',
                  height: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'grab',
                  color: '#9ca3af',
                  marginRight: '4px'
                }}
                title="Drag to reorder"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="9" cy="5" r="1" />
                  <circle cx="9" cy="12" r="1" />
                  <circle cx="9" cy="19" r="1" />
                  <circle cx="15" cy="5" r="1" />
                  <circle cx="15" cy="12" r="1" />
                  <circle cx="15" cy="19" r="1" />
                </svg>
              </div>
            )}
            <span style={{ fontSize: '12px', fontWeight: 500, color: '#111827' }}>
              {isComponent ? (item as ComponentData).uniqueId : (item as ElementData).elementId}
            </span>
            <span style={{ fontSize: '11px', color: '#6b7280' }}>
              ({isComponent ? 'component' : (item as ElementData).elementType})
            </span>
          </div>
          {!isComponent && (
            <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleReorder(item, 'up', parentElementId);
                }}
                disabled={!canMoveUp}
                style={{
                  padding: '2px 4px',
                  border: 'none',
                  background: canMoveUp ? '#f3f4f6' : '#e5e7eb',
                  borderRadius: '3px',
                  cursor: canMoveUp ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  opacity: canMoveUp ? 1 : 0.5
                }}
                title="Move up"
              >
                <ArrowUp size={12} style={{ color: canMoveUp ? '#374151' : '#9ca3af' }} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleReorder(item, 'down', parentElementId);
                }}
                disabled={!canMoveDown}
                style={{
                  padding: '2px 4px',
                  border: 'none',
                  background: canMoveDown ? '#f3f4f6' : '#e5e7eb',
                  borderRadius: '3px',
                  cursor: canMoveDown ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  opacity: canMoveDown ? 1 : 0.5
                }}
                title="Move down"
              >
                <ArrowDown size={12} style={{ color: canMoveDown ? '#374151' : '#9ca3af' }} />
              </button>
            </div>
          )}
        </div>
        {isExpanded && hasChildren && (
          <div style={{ marginTop: '2px' }}>
            {isComponent 
              ? (item as ComponentData).elements?.map((el, idx, arr) => renderLayoutItem(el, depth + 1, itemId, idx, arr, undefined))
              : (item as ElementData).children?.map((child, idx, arr) => renderLayoutItem(child, depth + 1, itemId, idx, arr, (item as ElementData).elementId))
            }
          </div>
        )}
      </div>
    );
  };

  const getMenuPosition = () => {
    switch (position) {
      case 'top-right':
        return {
          bottom: '100%',
          right: '0',
          marginBottom: '4px',
        };
      case 'top-left':
        return {
          bottom: '100%',
          left: '0',
          marginBottom: '4px',
        };
      case 'bottom-right':
        return {
          top: '100%',
          right: '0',
          marginTop: '4px',
        };
      case 'bottom-left':
        return {
          top: '100%',
          left: '0',
          marginTop: '4px',
        };
      default:
        return {
          bottom: '100%',
          right: '0',
          marginBottom: '4px',
        };
    }
  };

  const renderMainMenu = () => (
    <>
      {items.map((item, index) => {
        if (item.separator) {
          return <div key={index} className="border-t border-gray-200 my-1" />;
        }

        if (!item.label) {
          return null;
        }

        const isLayoutItem = item.label?.startsWith('View Layout') && projectId;
        // REMOVED: isAddElementItem - "Add Element" now handled by onClick, opens sidebar (no submenu)

        return (
          <div key={index} className="relative group">
            <button
              onClick={() => handleItemClick(item)}
              disabled={item.disabled}
              className={`
                w-full px-4 py-2.5 text-left text-sm flex items-center gap-3
                hover:bg-indigo-50 transition-colors duration-150
                disabled:opacity-50 disabled:cursor-not-allowed
                ${item.disabled ? '' : 'cursor-pointer'}
                ${isLayoutItem ? 'pr-8' : ''}
              `}
            >
              {item.icon && <span className="w-4 h-4 flex-shrink-0 text-gray-600">{item.icon}</span>}
              <span className="flex-1 text-gray-700">{item.label}</span>
              {isLayoutItem && <ChevronRight className="w-4 h-4 text-gray-400" />}
            </button>
          </div>
        );
      })}
    </>
  );

  const renderLayoutView = () => (
    <>
      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
        </div>
      )}

      {error && (
        <div className="px-4 py-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded">
          {error}
        </div>
      )}

      {!loading && !error && layoutData && (
        <div className="px-2 py-2 max-h-[350px] overflow-y-auto">
          {Array.isArray(layoutData) && layoutData.length > 0 ? (
            layoutData.map((item, idx, arr) => renderLayoutItem(item, 0, `root-${idx}`, idx, arr, undefined))
          ) : (
            <div className="text-sm text-gray-500 text-center py-4">
              No children found
            </div>
          )}
        </div>
      )}

      {!loading && !error && !layoutData && (
        <div className="text-sm text-gray-500 text-center py-4">
          No layout data available
        </div>
      )}
    </>
  );

  const renderAddElementView = () => (
    <>
      <div className="px-2 py-2">
        {availableElementTypes.map((type) => (
          <button
            key={type}
            onClick={() => {
              if (onAddElement) {
                onAddElement(type);
                setIsOpen(false);
                setCurrentView('main');
              }
            }}
            className="w-full px-4 py-2.5 text-left text-sm flex items-center gap-3 hover:bg-indigo-50 transition-colors duration-150 rounded cursor-pointer"
          >
            <Plus className="w-4 h-4 text-gray-600" />
            <span className="flex-1 text-gray-700 capitalize">{type}</span>
          </button>
        ))}
      </div>
    </>
  );

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
          if (!isOpen) {
            setCurrentView('main');
          }
        }}
        className={`bg-indigo-500 text-white p-2 hover:bg-indigo-600 transition-all duration-200 shadow-lg rounded ${buttonClassName} ${
          isOpen ? 'bg-indigo-600 ring-2 ring-indigo-300' : ''
        }`}
        title="More Options"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {isOpen && (
        <div
          ref={menuRef}
          className="absolute z-[60] bg-white border border-gray-200 rounded-lg shadow-2xl min-w-[280px] max-w-[400px] max-h-[500px] overflow-hidden flex flex-col"
          style={{
            ...getMenuPosition(),
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header with back button */}
          {currentView !== 'main' && (
            <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-200 bg-gray-50">
              <button
                onClick={() => setCurrentView('main')}
                className="p-1 hover:bg-gray-200 rounded transition-colors"
                title="Back"
              >
                <ArrowLeft className="w-4 h-4 text-gray-600" />
              </button>
              <span className="text-sm font-semibold text-gray-700">
                {currentView === 'layout' ? 'View Layout' : 'Add Element'}
              </span>
            </div>
          )}

          {/* Content */}
          <div className="overflow-y-auto flex-1">
            {currentView === 'main' && renderMainMenu()}
            {currentView === 'layout' && renderLayoutView()}
            {currentView === 'addElement' && renderAddElementView()}
          </div>
        </div>
      )}
    </div>
  );
}
