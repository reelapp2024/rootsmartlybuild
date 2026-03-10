'use client';

import React, { useEffect, useRef, useState, memo, useMemo, useCallback } from 'react';
import { Section, Element } from '../../types/builder';
import { buildBoxShadow, buildBorderStyle } from '../../utils/helpers';
import { resolveColor } from '../../utils/colorResolution';
import HeadingElement from '../elements/HeadingElement';
import TextElement from '../elements/TextElement';
import ImageElement from '../elements/ImageElement';
import ButtonElement from '../elements/ButtonElement';
import VideoElement from '../elements/VideoElement';
import IconElement from '../elements/IconElement';
import HtmlElement from '../elements/HtmlElement';
import ListElement from '../elements/ListElement';
import DividerElement from '../elements/DividerElement';
import SpacerElement from '../elements/SpacerElement';
import LinkElement from '../elements/LinkElement';
import BadgeElement from '../elements/BadgeElement';
import InputElement from '../elements/InputElement';
import TextareaElement from '../elements/TextareaElement';
import SelectElement from '../elements/SelectElement';
import LabelElement from '../elements/LabelElement';
import ContextMenu, { ContextMenuItem } from '../ui/ContextMenu';
import { Copy, ArrowUp, ArrowDown, Trash2, Settings, ArrowLeft, ArrowRight, Plus, Layout, LayoutList, Grid3x3 } from 'lucide-react';
import { registry } from '@ui/blocks';
// SectionSaveButton removed - using unified Publish button instead
import LayoutViewer from '../ui/LayoutViewer';
import SelectionMenu from '../ui/SelectionMenu';
import { loadGoogleFont } from '@ui/utils/fontLoader';
import { templateToSection } from '../../App';
import { useStudio } from '../../store';
import { createElementByType, createEmptySectionWithRootContainer } from '@ui/utils/elementStorage';
import { renderElement } from '@ui/utils/renderElement';

// Import header and footer components
const HeaderA = registry['header_a'];
const FooterA = registry['footer_a'];

interface BuilderCanvasProps {
  sections: Section[];
  setSections: (sections: Section[]) => void;
  selectedElement: {
    type: 'section' | 'row' | 'column' | 'element';
    id: string;
    columnId?: string;
    rowId?: string;
    sectionId?: string;
  } | null;
  setSelectedElement: (element: any) => void;
  builderMode: boolean;
  activeBreakpoint: 'desktop' | 'tablet' | 'mobile';
  moveSection: (sectionId: string, direction: 'up' | 'down') => void;
  duplicateSection: (sectionId: string) => void;
  duplicateRow: (sectionId: string, rowId: string) => void;
  duplicateColumn: (sectionId: string, rowId: string, colId: string) => void;
  moveRow: (sectionId: string, rowId: string, direction: 'up' | 'down') => void;
  moveColumn: (sectionId: string, rowId: string, colId: string, direction: 'up' | 'down') => void;
  moveElement: (sectionId: string, rowId: string, colId: string, elementId: string, direction: 'up' | 'down') => void;
  deleteRow: (sectionId: string, rowId: string) => void;
  deleteColumn: (sectionId: string, rowId: string, colId: string) => void;
  deleteElement: (sectionId: string, rowId: string, colId: string, elementId: string) => void;
  addElement: (sectionId: string, rowId: string, colId: string, type: Element['type']) => void;
  updateElement: (sectionId: string, rowId: string, colId: string, elementId: string, updates: any) => void;
  getBreakpointStyles: (styles: any) => any;
  // Custom component element management
  addCustomElement: (sectionId: string, elementType: 'heading' | 'text' | 'button' | 'image' | 'video' | 'icon' | 'html', elId: string, addAtFirst?: boolean) => void;
  removeCustomElement: (sectionId: string, elId: string) => void;
  moveCustomElement: (sectionId: string, elId: string, direction: 'up' | 'down') => void;
  duplicateCustomElement: (sectionId: string, elId: string) => void;
  getCustomElements: (sectionId: string) => Array<{ id: string; type: string; elId: string; order: number }>;
  updateCustomElementStyle: (sectionId: string, elId: string, styles: React.CSSProperties) => void;
  updateCustomElementProps: (sectionId: string, elId: string, props: any) => void;
  getCustomElementStyle: (sectionId: string, elId: string) => React.CSSProperties;
  getCustomElementProps: (sectionId: string, elId: string) => any;
}

function BuilderCanvas({
  sections,
  setSections,
  selectedElement,
  setSelectedElement,
  builderMode,
  activeBreakpoint,
  moveSection,
  duplicateSection,
  duplicateRow,
  duplicateColumn,
  moveRow,
  moveColumn,
  moveElement,
  deleteRow,
  deleteColumn,
  deleteElement,
  addElement,
  updateElement,
  getBreakpointStyles,
  addCustomElement,
  removeCustomElement,
  moveCustomElement,
  duplicateCustomElement,
  getCustomElements,
  updateCustomElementStyle,
  updateCustomElementProps,
  getCustomElementStyle,
  getCustomElementProps,
}: BuilderCanvasProps) {
  const { 
    addSection, 
    insertSectionAt, 
    removeSection,
    markSectionChanged, 
    insertElementIntoSection,
    setSidebarMode,
  } = useStudio();
  const [contextMenu, setContextMenu] = useState<{
    items: ContextMenuItem[];
    position: { x: number; y: number };
    originalClickPosition?: { x: number; y: number }; // Store original right-click position
  } | null>(null);
  // Use a ref to store the current right-click position so it's accessible in onClick handlers
  const currentRightClickPositionRef = useRef<{ x: number; y: number } | null>(null);
  const [layoutViewer, setLayoutViewer] = useState<{
    isOpen: boolean;
    projectId?: string;
    pageId?: string;
    uniqueId?: string;
    elementId?: string;
    elementType?: string;
    position?: { x: number; y: number };
  }>({ isOpen: false });
  // Track hovered section for outline visibility
  const [hoveredSectionId, setHoveredSectionId] = useState<string | null>(null);
  // Track which section is showing the container chooser (Flex/Grid)
  const [showContainerChooser, setShowContainerChooser] = useState<string | null>(null);


  // Get projectId from sections or URL
  const searchParamsRef = useRef(new URLSearchParams(window.location.search));
  const projectId = sections.length > 0 && (sections[0] as any).projectId 
    ? (sections[0] as any).projectId 
    : searchParamsRef.current.get('projectId') || '';
  
  // Helper function to render an element
  // OPTIMIZED: Compute styles once per element
  const renderElement = (element: Element, sectionId: string, rowId: string, colId: string, elementIdx?: number, totalElements?: number) => {
    const currentElementStyles = getBreakpointStyles(element.styles);
    const isSelected = selectedElement?.type === 'element' && 
                      selectedElement.id === element.id &&
                      selectedElement.sectionId === sectionId &&
                      selectedElement.rowId === rowId &&
                      selectedElement.columnId === colId;

    // Resolve backgroundColor using explicit colorSource
    const backgroundColorResolved = resolveColor(
      currentElementStyles.backgroundColor,
      currentElementStyles.backgroundColorSource,
      '',
      '#ffffff',
      'background',
      element.type
    );

    const elementWrapper = (
      <div
        key={element.id}
        id={element.customId || undefined}
        className={`relative ${builderMode ? 'cursor-pointer' : ''} ${isSelected ? 'ring-2 ring-orange-500' : ''} ${element.customClasses || ''} transition-all duration-150 ease-in-out`.trim()}
        data-element-type="element"
        onClick={(e) => {
          if (builderMode) {
            e.preventDefault();
            e.stopPropagation();
            // Direct update for faster response (removed requestAnimationFrame)
            setSelectedElement({
              type: 'element',
              id: element.id,
              sectionId,
              rowId,
              columnId: colId,
            });
          }
        }}
        onMouseDown={(e) => {
          if (builderMode) {
            e.stopPropagation();
          }
        }}
        onContextMenu={(e) => {
          if (builderMode) {
            e.preventDefault();
            e.stopPropagation();
          }
        }}
        style={{
          backgroundColor: backgroundColorResolved.displayValue || undefined,
          // Remove all padding from element wrapper - elements should not have padding on the wrapper
          // Padding should be applied to the element content itself, not the wrapper
          padding: '0',
          paddingTop: '0',
          paddingRight: '0',
          paddingBottom: '0',
          paddingLeft: '0',
          // CRITICAL: Don't mix shorthand (margin) with non-shorthand (marginTop, etc.)
          // If margin exists, use only margin. Otherwise, use individual properties.
          ...(currentElementStyles.margin
            ? { 
                margin: currentElementStyles.margin,
                // Explicitly clear individual margin properties to prevent React warning
                marginTop: undefined,
                marginRight: undefined,
                marginBottom: undefined,
                marginLeft: undefined,
              }
            : (currentElementStyles.marginTop || currentElementStyles.marginRight || currentElementStyles.marginBottom || currentElementStyles.marginLeft)
              ? {
                  // Explicitly clear shorthand margin to prevent React warning
                  margin: undefined,
                  marginTop: currentElementStyles.marginTop,
                  marginRight: currentElementStyles.marginRight,
                  marginBottom: currentElementStyles.marginBottom,
                  marginLeft: currentElementStyles.marginLeft,
                }
              : {}
          ),
          ...buildBorderStyle(currentElementStyles),
          boxShadow: buildBoxShadow(currentElementStyles),
        }}
      >
        {builderMode && isSelected && (
          <>
            <div className="absolute -top-6 left-0 bg-orange-500 text-white px-2 py-1 rounded text-xs z-50">
              {element.type} Selected
            </div>
            {elementIdx !== undefined && totalElements !== undefined && (
              <div className="absolute top-0 right-0 flex items-center gap-1 z-50">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    moveElement(sectionId, rowId, colId, element.id, 'up');
                  }}
                  disabled={elementIdx === 0}
                  className={`bg-blue-500 text-white p-1 rounded-tl rounded-bl hover:bg-blue-600 transition shadow-lg ${elementIdx === 0 ? 'opacity-30 cursor-not-allowed' : ''}`}
                  title="Move Up"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    moveElement(sectionId, rowId, colId, element.id, 'down');
                  }}
                  disabled={elementIdx === totalElements - 1}
                  className={`bg-blue-500 text-white p-1 hover:bg-blue-600 transition shadow-lg ${elementIdx === totalElements - 1 ? 'opacity-30 cursor-not-allowed' : ''}`}
                  title="Move Down"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm('Delete this element?')) {
                      // Check if this is a custom element by looking for elId or checking customElements
                      const section = sections.find(s => s.id === sectionId);
                      const customElement = section?.customElements?.find(ce => ce.id === element.id);
                      if (customElement?.elId) {
                        // Use removeCustomElement for custom elements
                        removeCustomElement(sectionId, customElement.elId);
                      } else if ((element as any).elId) {
                        // Element has elId property directly
                        removeCustomElement(sectionId, (element as any).elId);
                      } else {
                        // Use regular deleteElement for standard elements
                      deleteElement(sectionId, rowId, colId, element.id);
                      }
                    }
                  }}
                  className="bg-red-500 text-white p-1 hover:bg-red-600 transition shadow-lg"
                  title="Delete Element"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
                <SelectionMenu
                  items={[
                    {
                      label: 'Element Settings',
                      icon: <Settings className="w-4 h-4" />,
                      onClick: () => setSelectedElement({
                        type: 'element',
                        id: element.id,
                        sectionId,
                        rowId,
                        columnId: colId,
                      }),
                    },
                    { separator: true },
                    {
                      label: 'Duplicate Element',
                      icon: <Copy className="w-4 h-4" />,
                      onClick: () => {
                        const section = sections.find(s => s.id === sectionId);
                        if (!section) return;
                        const row = section.rows.find(r => r.id === rowId);
                        if (!row) return;
                        const column = row.columns.find(c => c.id === colId);
                        if (!column) return;
                        const elementIndex = column.elements.findIndex(el => el.id === element.id);
                        if (elementIndex === -1) return;
                        
                        const duplicatedElement: Element = JSON.parse(JSON.stringify(element));
                        duplicatedElement.id = `element-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                        
                        const newElements = [...column.elements];
                        newElements.splice(elementIndex + 1, 0, duplicatedElement);
                        
                        setSections(sections.map(s => {
                          if (s.id !== sectionId) return s;
                          return {
                            ...s,
                            rows: s.rows.map(r => {
                              if (r.id !== rowId) return r;
                              return {
                                ...r,
                                columns: r.columns.map(c => {
                                  if (c.id !== colId) return c;
                                  return { ...c, elements: newElements };
                                })
                              };
                            })
                          };
                        }));
                        
                        setSelectedElement({
                          type: 'element',
                          id: duplicatedElement.id,
                          sectionId,
                          rowId,
                          columnId: colId,
                        });
                      },
                    },
                    { separator: true },
                    {
                      label: 'Move Up',
                      icon: <ArrowUp className="w-4 h-4" />,
                      onClick: () => moveElement(sectionId, rowId, colId, element.id, 'up'),
                      disabled: elementIdx === 0,
                    },
                    {
                      label: 'Move Down',
                      icon: <ArrowDown className="w-4 h-4" />,
                      onClick: () => moveElement(sectionId, rowId, colId, element.id, 'down'),
                      disabled: elementIdx === totalElements - 1,
                    },
                    { separator: true },
                    {
                      label: 'Delete Element',
                      icon: <Trash2 className="w-4 h-4" />,
                      onClick: () => {
                        if (confirm('Delete this element?')) {
                          const section = sections.find(s => s.id === sectionId);
                          const customElement = section?.customElements?.find(ce => ce.id === element.id);
                          if (customElement?.elId) {
                            removeCustomElement(sectionId, customElement.elId);
                          } else if ((element as any).elId) {
                            removeCustomElement(sectionId, (element as any).elId);
                          } else {
                            deleteElement(sectionId, rowId, colId, element.id);
                          }
                        }
                      },
                    },
                  ]}
                  position="bottom-right"
                  buttonClassName="rounded-tr rounded-br"
                  projectId={(() => {
                    const projectId = sections.length > 0 && (sections[0] as any).projectId 
                      ? (sections[0] as any).projectId 
                      : searchParamsRef.current.get('projectId') || '';
                    return projectId;
                  })()}
                  pageId={(sections.find(s => s.id === sectionId) as any)?.pageId || searchParamsRef.current.get('pageId') || ''}
                />
              </div>
            )}
            {elementIdx === undefined && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm('Delete this element?')) {
                    // Check if this is a custom element (has elId property)
                    const section = sections.find(s => s.id === sectionId);
                    const isCustomElement = section?.customElements?.some(ce => ce.id === element.id || ce.elId === (element as any).elId);
                    if (isCustomElement && (element as any).elId) {
                      // Use removeCustomElement for custom elements
                      removeCustomElement(sectionId, (element as any).elId);
                    } else {
                      // Use regular deleteElement for standard elements
                    deleteElement(sectionId, rowId, colId, element.id);
                    }
                  }
                }}
                className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition z-50 shadow-lg"
                title="Delete Element"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </>
        )}

        {element.type === 'heading' && (
          <HeadingElement
            element={element}
            builderMode={builderMode}
            currentElementStyles={currentElementStyles}
            sectionId={sectionId}
            rowId={rowId}
            colId={colId}
            setSelectedElement={setSelectedElement}
            updateElement={updateElement}
          />
        )}

        {element.type === 'text' && (
          <TextElement
            element={element}
            builderMode={builderMode}
            currentElementStyles={currentElementStyles}
            sectionId={sectionId}
            rowId={rowId}
            colId={colId}
            updateElement={updateElement}
          />
        )}


        {element.type === 'image' && (
          <ImageElement 
            element={element} 
            builderMode={builderMode}
            activeBreakpoint={activeBreakpoint}
            currentElementStyles={currentElementStyles}
          />
        )}

        {element.type === 'button' && (
          <ButtonElement
            element={element}
            builderMode={builderMode}
            currentElementStyles={currentElementStyles}
            sectionId={sectionId}
            rowId={rowId}
            colId={colId}
            updateElement={updateElement}
          />
        )}

        {element.type === 'video' && (
          <VideoElement element={element} builderMode={builderMode} />
        )}

        {element.type === 'icon' && (
          <IconElement
            element={element}
            currentElementStyles={currentElementStyles}
          />
        )}

        {element.type === 'html' && (
          <HtmlElement 
            element={element} 
            builderMode={builderMode} 
            currentElementStyles={currentElementStyles}
            activeBreakpoint={activeBreakpoint}
          />
        )}

        {element.type === 'list' && (
          <ListElement
            element={element}
            builderMode={builderMode}
            currentElementStyles={currentElementStyles}
            sectionId={sectionId}
            rowId={rowId}
            colId={colId}
            updateElement={updateElement}
          />
        )}

        {element.type === 'divider' && (
          <DividerElement
            element={element}
            builderMode={builderMode}
            currentElementStyles={currentElementStyles}
          />
        )}

        {element.type === 'spacer' && (
          <SpacerElement
            element={element}
            builderMode={builderMode}
            currentElementStyles={currentElementStyles}
          />
        )}

        {element.type === 'link' && (
          <LinkElement
            element={element}
            builderMode={builderMode}
            currentElementStyles={currentElementStyles}
            sectionId={sectionId}
            rowId={rowId}
            colId={colId}
            updateElement={updateElement}
          />
        )}

        {element.type === 'badge' && (
          <BadgeElement
            element={element}
            builderMode={builderMode}
            currentElementStyles={currentElementStyles}
            sectionId={sectionId}
            rowId={rowId}
            colId={colId}
            updateElement={updateElement}
          />
        )}

        {element.type === 'container' && (
          <div
            style={{
              ...currentElementStyles,
              outline: isSelected ? '2px solid #f97316' : undefined,
              width: currentElementStyles.width || '100%',
              maxWidth: currentElementStyles.maxWidth,
              padding: currentElementStyles.padding || '16px',
              backgroundColor: currentElementStyles.backgroundColor,
            }}
          >
            {element.data?.content || ''}
          </div>
        )}


        {element.type === 'form' && (
          <form
            onSubmit={(e) => {
              if (builderMode) {
                e.preventDefault();
                e.stopPropagation();
              }
            }}
            style={{
              ...currentElementStyles,
              outline: isSelected ? '2px solid #f97316' : undefined,
              display: 'flex',
              flexDirection: currentElementStyles.flexDirection || 'column',
              gap: currentElementStyles.gap || '12px',
            }}
          >
            {element.data?.content || ''}
          </form>
        )}

        {element.type === 'input' && (
          <InputElement
            element={element}
            builderMode={builderMode}
            currentElementStyles={currentElementStyles}
            sectionId={sectionId}
            rowId={rowId}
            colId={colId}
            updateElement={updateElement}
          />
        )}

        {element.type === 'textarea' && (
          <TextareaElement
            element={element}
            builderMode={builderMode}
            currentElementStyles={currentElementStyles}
            sectionId={sectionId}
            rowId={rowId}
            colId={colId}
            updateElement={updateElement}
          />
        )}

        {element.type === 'select' && (
          <SelectElement
            element={element}
            builderMode={builderMode}
            currentElementStyles={currentElementStyles}
            sectionId={sectionId}
            rowId={rowId}
            colId={colId}
            updateElement={updateElement}
          />
        )}

        {element.type === 'label' && (
          <LabelElement
            element={element}
            builderMode={builderMode}
            currentElementStyles={currentElementStyles}
            sectionId={sectionId}
            rowId={rowId}
            colId={colId}
            updateElement={updateElement}
          />
        )}
      </div>
    );

    return elementWrapper;
  };

  // Parallax effect handler
  // Listen for element reorder updates from layout view
  useEffect(() => {
    const handleElementUpdate = (event: CustomEvent) => {
      const { projectId, pageId, uniqueId, elements } = event.detail;
      
      // Find the section that matches this uniqueId
      const targetSection = sections.find(s => {
        const sectionUniqueId = s.componentType || s.customId || '';
        const sectionPageId = (s as any).pageId || searchParamsRef.current.get('pageId') || '';
        const sectionProjectId = (s as any).projectId || searchParamsRef.current.get('projectId') || '';
        
        return sectionUniqueId === uniqueId && 
               (!pageId || sectionPageId === pageId) &&
               (!projectId || sectionProjectId === projectId);
      });

      if (targetSection) {
        // Update the section's customElements with new order
        const updatedSections = sections.map(s => {
          if (s.id === targetSection.id) {
            return {
              ...s,
              customElements: elements.map((el: any) => {
                // Preserve existing element data if it exists
                const existing = s.customElements?.find(ce => ce.elId === el.elId);
                return {
                  ...el,
                  // Preserve existing styles and props
                  ...(existing ? {
                    // Keep existing data structure
                  } : {})
                };
              })
            };
          }
          return s;
        });
        
        setSections(updatedSections);
      }
    };

    window.addEventListener('builder:update-elements', handleElementUpdate as EventListener);
    
    return () => {
      window.removeEventListener('builder:update-elements', handleElementUpdate as EventListener);
    };
  }, [sections, setSections]);

  useEffect(() => {
    if (builderMode) return; // Only in preview mode
    
    const handleScroll = () => {
      const parallaxSections = document.querySelectorAll('.parallax-section');
      parallaxSections.forEach((section) => {
        const element = section as HTMLElement;
        const speed = parseFloat(element.dataset.parallaxSpeed || '0.5');
        const rect = element.getBoundingClientRect();
        const scrolled = window.pageYOffset;
        const rate = scrolled * speed;
        
        // Apply parallax to background position
        if (element.style.backgroundImage && !element.style.backgroundImage.includes('gradient')) {
          element.style.backgroundPosition = `center ${rate}px`;
        }
      });
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [builderMode]);

  // Listen for LayoutViewer open events
  useEffect(() => {
    const handleOpenLayoutViewer = (e: CustomEvent) => {
      const { projectId, pageId, uniqueId, elementId, elementType, position } = e.detail;
      setLayoutViewer({
        isOpen: true,
        projectId,
        pageId,
        uniqueId,
        elementId,
        elementType,
        position
      });
    };

    window.addEventListener('openLayoutViewer', handleOpenLayoutViewer as EventListener);
    return () => {
      window.removeEventListener('openLayoutViewer', handleOpenLayoutViewer as EventListener);
    };
  }, []);

  return (
    <>
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(50px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-50px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideLeft {
          from { opacity: 0; transform: translateX(50px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideRight {
          from { opacity: 0; transform: translateX(-50px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes zoomIn {
          from { opacity: 0; transform: scale(0.8); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes zoomOut {
          from { opacity: 0; transform: scale(1.2); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
      <div className={`flex-1 overflow-y-auto ${builderMode ? 'bg-gray-100' : 'bg-white'}`} style={{ minHeight: '100%', minWidth: 0, padding: '0', margin: '0' }}>
      <div 
        data-website-content="true"
        className={`${builderMode ? 'transition-all duration-300' : ''} ${
          builderMode 
            ? activeBreakpoint === 'desktop' 
              ? '' 
              : activeBreakpoint === 'tablet' 
              ? 'max-w-4xl mx-auto' 
              : 'max-w-sm mx-auto'
            : ''
        }`}
        style={{
          padding: '0',
          margin: '0',
          minHeight: '100%',
          width: '100%',
          backgroundColor: builderMode ? '#ffffff' : 'transparent',
          boxShadow: builderMode && activeBreakpoint !== 'desktop' ? '0 0 0 2px rgba(59, 130, 246, 0.5)' : 'none',
        }}
      >
        {/* Header */}
        {projectId && HeaderA && (
          <HeaderA
            projectId={projectId}
            __studio={builderMode ? {
              selectElement: () => {},
              selectedEl: null,
            } : undefined}
          />
        )}
        
        {/* Sections */}
        {sections.length === 0 ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
            <button
              onClick={() => {
                  // Create empty section with root container (enforces invariant: every section has ONE root container)
                  const { section: newSection } = createEmptySectionWithRootContainer();
                  // Use addSection to properly mark section as changed
                  addSection(newSection as Section);
                  // Also update local sections state for immediate UI update
                  setSections([newSection as Section]);
                }}
                className="inline-flex items-center gap-3 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-lg font-medium text-lg"
              >
                <Plus size={20} />
                <span>Add Section</span>
            </button>
            </div>
          </div>
        ) : (
          sections.map((section, sectionIdx) => {
            // CRITICAL: Merge component-level styles (from componentIds[0].style) into section styles
            // This ensures backgroundImage and other component-level styles are available in builder
            const componentLevelStyles = (section as any).componentLevelStyles || {};
            const mergedSectionStyles = { ...section.styles, ...componentLevelStyles };
            const currentSectionStyles = getBreakpointStyles(mergedSectionStyles);
            const isPositioned = currentSectionStyles.position && currentSectionStyles.position !== 'static';
            return (
              <div
                key={section.id}
                id={section.customId || undefined}
                className={section.customClasses || undefined}
                style={{
                  position: isPositioned ? 'relative' : undefined,
                  minHeight: isPositioned && !currentSectionStyles.height ? (currentSectionStyles.minHeight || '100px') : undefined,
                }}
              >
            <div
              onContextMenu={(e) => {
                if (!builderMode) return;
                e.preventDefault();
                e.stopPropagation();
                const items: ContextMenuItem[] = [
                  {
                    label: 'Duplicate Section',
                    icon: <Copy className="w-4 h-4" />,
                    onClick: () => duplicateSection(section.id),
                  },
                  {
                    label: 'Move Up',
                    icon: <ArrowUp className="w-4 h-4" />,
                    onClick: () => moveSection(section.id, 'up'),
                    disabled: sectionIdx === 0,
                  },
                  {
                    label: 'Move Down',
                    icon: <ArrowDown className="w-4 h-4" />,
                    onClick: () => moveSection(section.id, 'down'),
                    disabled: sectionIdx === sections.length - 1,
                  },
                  { separator: true },
                  {
                    label: 'Delete Section',
                    icon: <Trash2 className="w-4 h-4" />,
                    onClick: () => {
                      if (confirm('Delete entire section?')) {
                        setSections(sections.filter(s => s.id !== section.id));
                        setSelectedElement(null);
                      }
                    },
                  },
                  { separator: true },
                  {
                    label: 'Open Settings',
                    icon: <Settings className="w-4 h-4" />,
                    onClick: () => {
                      // Select section to open sidebar automatically
                      setSelectedElement({ type: 'section', id: section.id });
                    },
                  },
                  { separator: true },
                  {
                    label: 'Duplicate',
                    icon: <Copy className="w-4 h-4" />,
                    onClick: () => duplicateSection(section.id),
                  },
                ];
                setContextMenu({ 
            items, 
            position: { x: e.clientX, y: e.clientY },
            originalClickPosition: { x: e.clientX, y: e.clientY }
          });
              }}
              style={{
                // CRITICAL: Responsive visibility - hide section per breakpoint
                display: (() => {
                  // Check responsive visibility flags
                  if (activeBreakpoint === 'desktop' && currentSectionStyles.hideOnDesktop) return 'none';
                  if (activeBreakpoint === 'tablet' && currentSectionStyles.hideOnTablet) return 'none';
                  if (activeBreakpoint === 'mobile' && currentSectionStyles.hideOnMobile) return 'none';
                  // CRITICAL: Sections are ALWAYS block-level (Elementor-style)
                  // Never allow flex/grid layouts on sections - only containers handle layout
                  return builderMode ? 'table' : 'block';
                })(),
                // CRITICAL: Build background styles based on backgroundType
                // Use background shorthand for image/gradient to ensure proper rendering
                ...(() => {
                  const backgroundType = currentSectionStyles.backgroundType || 
                    (currentSectionStyles.backgroundVideoUrl ? 'video' : 
                     currentSectionStyles.gradientColors ? 'gradient' : 
                     currentSectionStyles.backgroundImage ? 'image' : 
                     currentSectionStyles.backgroundColor && currentSectionStyles.backgroundColor !== 'transparent' ? 'color' : 'none');
                  
                  // For video backgrounds, don't set any background (video element handles it)
                  if (backgroundType === 'video') {
                    return {}; // Empty object - no backgroundColor or background
                  }
                  
                  // For gradient backgrounds
                  if (backgroundType === 'gradient' || currentSectionStyles.gradientColors) {
                    try {
                      const colors = typeof currentSectionStyles.gradientColors === 'string' 
                        ? JSON.parse(currentSectionStyles.gradientColors) 
                        : currentSectionStyles.gradientColors;
                      const colorStops = Array.isArray(colors) 
                        ? colors.map((c: any) => `${c.color || c} ${c.stop || ''}`).join(', ')
                        : '';
                      const gradient = currentSectionStyles.gradientType === 'radial'
                        ? `radial-gradient(${currentSectionStyles.gradientDirection || 'center'}, ${colorStops})`
                        : `linear-gradient(${currentSectionStyles.gradientAngle || currentSectionStyles.gradientDirection || '90deg'}, ${colorStops})`;
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
                  if (backgroundType === 'image' && currentSectionStyles.backgroundImage) {
                    const imageUrl = currentSectionStyles.backgroundImage.startsWith('linear-gradient') || 
                                   currentSectionStyles.backgroundImage.startsWith('radial-gradient')
                      ? currentSectionStyles.backgroundImage
                      : `url(${currentSectionStyles.backgroundImage})`;
                    return {
                      backgroundImage: imageUrl,
                      backgroundSize: currentSectionStyles.backgroundSize || 'cover',
                      backgroundPosition: currentSectionStyles.backgroundPosition || 'center',
                      backgroundRepeat: currentSectionStyles.backgroundRepeat || 'no-repeat',
                      backgroundAttachment: currentSectionStyles.backgroundAttachment || 'scroll',
                      backgroundColor: 'transparent', // Explicitly set transparent to prevent white
                    };
                  }
                  
                  // For color backgrounds
                  if (backgroundType === 'color') {
                    return {
                      backgroundColor: currentSectionStyles.backgroundColor || 'transparent',
                    };
                  }
                  
                  // For none or fallback
                  return {
                    backgroundColor: 'transparent',
                  };
                })(),
                minHeight: currentSectionStyles.minHeight,
                height: currentSectionStyles.height,
                width: '100%',
                maxWidth: 'none', // Sections have no max-width constraint (Elementor-style)
                boxSizing: 'border-box',
                // CRITICAL: Sections NEVER have flex/grid layouts - only block
                // Remove all layout properties that don't belong to sections
                overflow: currentSectionStyles.overflow,
                overflowX: currentSectionStyles.overflowX,
                overflowY: currentSectionStyles.overflowY,
                position: selectedElement?.type === 'section' && selectedElement.id === section.id ? 'relative' : (currentSectionStyles.position || 'relative'),
                top: currentSectionStyles.top,
                right: currentSectionStyles.right || '0',
                bottom: currentSectionStyles.bottom,
                left: currentSectionStyles.left || '0',
                zIndex: selectedElement?.type === 'section' && selectedElement.id === section.id ? 10 : (currentSectionStyles.zIndex || 1),
                // CRITICAL: Section padding affects children (spacing inside section)
                // Section margin moves section itself (Elementor behavior)
                padding: currentSectionStyles.padding !== undefined ? currentSectionStyles.padding : undefined,
                paddingTop: currentSectionStyles.paddingTop !== undefined ? currentSectionStyles.paddingTop : undefined,
                paddingRight: currentSectionStyles.paddingRight !== undefined ? currentSectionStyles.paddingRight : undefined,
                paddingBottom: currentSectionStyles.paddingBottom !== undefined ? currentSectionStyles.paddingBottom : undefined,
                paddingLeft: currentSectionStyles.paddingLeft !== undefined ? currentSectionStyles.paddingLeft : undefined,
                // CRITICAL: Section margin moves section itself (not children)
                // CRITICAL: Don't mix shorthand (margin) with non-shorthand (marginTop, etc.)
                ...(currentSectionStyles.margin
                  ? { 
                      margin: currentSectionStyles.margin,
                      // Explicitly clear individual margin properties to prevent React warning
                      marginTop: undefined,
                      marginRight: undefined,
                      marginBottom: undefined,
                      marginLeft: undefined,
                    }
                  : (currentSectionStyles.marginTop || currentSectionStyles.marginRight || currentSectionStyles.marginBottom || currentSectionStyles.marginLeft)
                    ? {
                        // Explicitly clear shorthand margin to prevent React warning
                        margin: undefined,
                        marginTop: currentSectionStyles.marginTop,
                        marginRight: currentSectionStyles.marginRight || '0',
                        marginBottom: currentSectionStyles.marginBottom,
                        marginLeft: currentSectionStyles.marginLeft || '0',
                      }
                    : { 
                        // Use only shorthand when no individual properties are set
                        margin: '0',
                        marginTop: undefined,
                        marginRight: undefined,
                        marginBottom: undefined,
                        marginLeft: undefined,
                      }
                  ),
                ...buildBorderStyle(currentSectionStyles),
                boxShadow: buildBoxShadow(currentSectionStyles),
                // Animation styles
                animation: (() => {
                  if (!currentSectionStyles.animationType || currentSectionStyles.animationType === 'none') return undefined;
                  const duration = currentSectionStyles.animationDuration || '1s';
                  const delay = currentSectionStyles.animationDelay || '0s';
                  const animationMap: Record<string, string> = {
                    fadeIn: 'fadeIn',
                    slideUp: 'slideUp',
                    slideDown: 'slideDown',
                    slideLeft: 'slideLeft',
                    slideRight: 'slideRight',
                    zoomIn: 'zoomIn',
                    zoomOut: 'zoomOut',
                  };
                  return `${animationMap[currentSectionStyles.animationType]} ${duration} ease-out ${delay} both`;
                })(),
              }}
              onClick={(e) => {
                // Only select section if clicking directly on wrapper (not on component content)
                // Component's section element will handle its own selection
                const target = e.target as HTMLElement;
                if (builderMode && (target === e.currentTarget || target.classList.contains('section-wrapper'))) {
                  e.preventDefault();
                  e.stopPropagation();
                  requestAnimationFrame(() => {
                    setSelectedElement({ type: 'section', id: section.id });
                  });
                }
              }}
              onMouseDown={(e) => {
                // Immediate selection on mousedown for smooth UX
                const target = e.target as HTMLElement;
                if (builderMode && (target === e.currentTarget || target.classList.contains('section-wrapper'))) {
                  e.preventDefault();
                  e.stopPropagation();
                  requestAnimationFrame(() => {
                    setSelectedElement({ type: 'section', id: section.id });
                  });
                }
              }}
              className={`relative section-wrapper ${builderMode ? 'cursor-pointer' : ''} ${currentSectionStyles.parallaxEnabled ? 'parallax-section' : ''}`}
              data-parallax-speed={currentSectionStyles.parallaxEnabled ? (currentSectionStyles.parallaxSpeed || '0.5') : undefined}
              onMouseEnter={() => {
                if (builderMode) {
                  setHoveredSectionId(section.id);
                }
              }}
              onMouseLeave={() => {
                if (builderMode) {
                  setHoveredSectionId(null);
                }
              }}
            >
              {/* SECTION OVERLAY: Chrome DevTools-style highlighting */}
              {/* CRITICAL: Overlay must NOT cover background - use border-only approach */}
              {builderMode && (selectedElement?.type === 'section' && selectedElement.id === section.id || hoveredSectionId === section.id) && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    border: '2px dashed #2563eb',
                    backgroundColor: 'transparent', // CRITICAL: Transparent so background shows through
                    pointerEvents: 'none',
                    boxSizing: 'border-box',
                    zIndex: 1000, // Below container (1001) and element (1002) overlays
                    // Add subtle background tint using box-shadow inset instead of backgroundColor
                    boxShadow: selectedElement?.type === 'section' && selectedElement.id === section.id 
                      ? 'inset 0 0 0 999px rgba(37, 99, 235, 0.03)' 
                      : 'inset 0 0 0 999px rgba(37, 99, 235, 0.01)',
                  }}
                />
              )}
              {/* Section overlay only shows when THIS section is selected/hovered */}
              {/* Child container overlays are handled independently in renderElement.tsx */}
              {/* Background Video */}
              {(currentSectionStyles.backgroundType === 'video' || currentSectionStyles.backgroundVideoUrl) && currentSectionStyles.backgroundVideoUrl && (
                <video
                  autoPlay={currentSectionStyles.backgroundVideoAutoplay !== false}
                  loop={currentSectionStyles.backgroundVideoLoop !== false}
                  muted={currentSectionStyles.backgroundVideoMuted !== false}
                  playsInline
                  className="absolute inset-0 w-full h-full object-cover z-0"
                  style={{ 
                    pointerEvents: 'none',
                    display: (activeBreakpoint === 'mobile' && currentSectionStyles.backgroundVideoDisableOnMobile) ? 'none' : 'block'
                  }}
                  poster={currentSectionStyles.backgroundVideoPoster || currentSectionStyles.posterImage}
                >
                  <source src={currentSectionStyles.backgroundVideoUrl} type="video/mp4" />
                </video>
              )}
              
              {/* Background Overlay - Show for ALL background types (gradient, color, image, video) - MUST be BEFORE content container */}
              {(() => {
                const backgroundType = currentSectionStyles.backgroundType || 
                  (currentSectionStyles.backgroundVideoUrl ? 'video' : 
                   currentSectionStyles.gradientColors ? 'gradient' : 
                   currentSectionStyles.backgroundImage ? 'image' : 
                   currentSectionStyles.backgroundColor && currentSectionStyles.backgroundColor !== 'transparent' ? 'color' : 'none');
                
                // Overlay should appear for ALL background types when overlayColor and overlayOpacity are set
                // Default to black if overlayOpacity is set but overlayColor is not
                const overlayOpacity = currentSectionStyles.overlayOpacity !== undefined 
                  ? parseFloat(String(currentSectionStyles.overlayOpacity)) 
                  : 0;
                const overlayColor = currentSectionStyles.overlayColor || 
                  (overlayOpacity > 0 ? '#000000' : undefined); // Default to black if opacity is set
                
                const shouldShowOverlay = overlayColor && 
                  overlayColor !== 'transparent' &&
                  overlayOpacity > 0;
                
                return shouldShowOverlay ? (
                  <div
                    className="absolute inset-0"
                    style={{
                      zIndex: 1, // Above background (z-0) but below content container (z-10)
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
              
              {/* Legacy selection UI - hidden but kept for reference */}
              {false && builderMode && selectedElement?.type === 'section' && selectedElement.id === section.id && (
                <>
                  <div className="absolute top-0 left-0 bg-blue-500 text-white px-3 py-1 rounded-br text-sm z-50">
                    Section Selected
                  </div>
                  <div className="absolute top-2 right-2 flex items-center gap-1 z-50">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        moveSection(section.id, 'up');
                      }}
                      disabled={sectionIdx === 0}
                      className={`bg-blue-500 text-white p-1.5 rounded-tl rounded-bl hover:bg-blue-600 transition shadow-lg ${sectionIdx === 0 ? 'opacity-30 cursor-not-allowed' : ''}`}
                      title="Move Up"
                    >
                      <ArrowUp className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        moveSection(section.id, 'down');
                      }}
                      disabled={sectionIdx === sections.length - 1}
                      className={`bg-blue-500 text-white p-1.5 hover:bg-blue-600 transition shadow-lg ${sectionIdx === sections.length - 1 ? 'opacity-30 cursor-not-allowed' : ''}`}
                      title="Move Down"
                    >
                      <ArrowDown className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // Create new empty section with root container (enforces invariant: every section has ONE root container)
                        const { section: newSection } = createEmptySectionWithRootContainer();
                        // Insert section at index + 1 (below current section)
                        insertSectionAt(newSection as Section, sectionIdx + 1);
                        // Select the new section
                        setSelectedElement({ type: 'section', id: newSection.id });
                      }}
                      className="bg-green-500 text-white p-1.5 hover:bg-green-600 transition shadow-lg"
                      title="Add Section Below"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('Delete entire section?')) {
                          setSections(sections.filter(s => s.id !== section.id));
                          setSelectedElement(null);
                        }
                      }}
                      className="bg-red-500 text-white p-1.5 hover:bg-red-600 transition shadow-lg"
                      title="Delete Section"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                    <SelectionMenu
                      projectId={(() => {
                        return sections.length > 0 && (sections[0] as any).projectId 
                          ? (sections[0] as any).projectId 
                          : searchParamsRef.current.get('projectId') || '';
                      })()}
                      pageId={(section as any).pageId || searchParamsRef.current.get('pageId') || ''}
                      uniqueId={section.componentType || section.customId || ''}
                      onLayoutReorder={() => {
                        // Trigger a page reload to refresh the builder with updated data
                        if (typeof window !== 'undefined') {
                          window.location.reload();
                        }
                      }}
                      items={(() => {
                        const pageId = (section as any).pageId || searchParamsRef.current.get('pageId') || '';
                        const uniqueId = section.componentType || section.customId || '';
                        const projectId = sections.length > 0 && (sections[0] as any).projectId 
                          ? (sections[0] as any).projectId 
                          : searchParamsRef.current.get('projectId') || '';
                        return [
                          {
                            label: 'Open Settings',
                            icon: <Settings className="w-4 h-4" />,
                            onClick: () => setSelectedElement({ type: 'section', id: section.id }),
                          },
                          { separator: true },
                          ...(projectId && uniqueId ? [{
                            label: 'View Layout',
                            icon: <Layout className="w-4 h-4" />,
                            onClick: () => {}, // Handled by SelectionMenu
                          }, { separator: true }] : []),
                          {
                            label: 'Move Up',
                            icon: <ArrowUp className="w-4 h-4" />,
                            onClick: () => moveSection(section.id, 'up'),
                            disabled: sectionIdx === 0,
                          },
                          {
                            label: 'Move Down',
                            icon: <ArrowDown className="w-4 h-4" />,
                            onClick: () => moveSection(section.id, 'down'),
                            disabled: sectionIdx === sections.length - 1,
                          },
                          { separator: true },
                          {
                            label: 'Duplicate',
                            icon: <Copy className="w-4 h-4" />,
                            onClick: () => duplicateSection(section.id),
                          },
                          { separator: true },
                          {
                            label: 'Delete',
                            icon: <Trash2 className="w-4 h-4" />,
                            onClick: () => {
                              if (confirm('Delete entire section?')) {
                                setSections(sections.filter(s => s.id !== section.id));
                                setSelectedElement(null);
                              }
                            },
                          },
                        ] as ContextMenuItem[];
                      })()}
                      position="top-right"
                      buttonClassName="rounded-tr rounded-br"
                      projectId={(() => {
                        const projectId = sections.length > 0 && (sections[0] as any).projectId 
                          ? (sections[0] as any).projectId 
                          : searchParamsRef.current.get('projectId') || '';
                        return projectId;
                      })()}
                      pageId={(section as any).pageId || searchParamsRef.current.get('pageId') || ''}
                      uniqueId={section.componentType || section.customId || ''}
                      onLayoutReorder={() => {
                        // No action needed - layout view updates immediately
                        // Builder will reflect changes on next page load or manual refresh
                      }}
                    />
                  </div>
                </>
              )}
              {/* Background color layer with opacity (only affects background, not children) */}
              {(() => {
                const backgroundType = currentSectionStyles.backgroundType || 
                  (currentSectionStyles.backgroundVideoUrl ? 'video' : 
                   currentSectionStyles.gradientColors ? 'gradient' : 
                   currentSectionStyles.backgroundImage ? 'image' : 
                   currentSectionStyles.backgroundColor && currentSectionStyles.backgroundColor !== 'transparent' ? 'color' : 'none');
                
                // Only show opacity layer if backgroundType is 'color' and opacity < 1
                if (currentSectionStyles.opacity !== undefined && currentSectionStyles.opacity < 1 && backgroundType === 'color') {
                  return (
                    <div
                      className="absolute inset-0 z-0"
                      style={{
                        backgroundColor: currentSectionStyles.backgroundColor || 'transparent',
                        opacity: currentSectionStyles.opacity,
                        pointerEvents: 'none', // Allow clicks to pass through
                      }}
                    />
                  );
                }
                return null;
              })()}
              
              {/* Content Container - always at full opacity so children are not affected */}
              <div className="relative z-10 w-full" style={{
                opacity: 1, // Explicitly set to 1 so children maintain their own opacity 
                maxWidth: (() => {
                  const containerWidth = currentSectionStyles.containerWidth || 'boxed';
                  if (containerWidth === 'full') return '100%';
                  const maxWidth = currentSectionStyles.maxWidth || (activeBreakpoint === 'mobile' ? '100%' : activeBreakpoint === 'tablet' ? '768px' : '1200px');
                  return maxWidth;
                })(),
                width: '100%',
                margin: (() => {
                  const alignment = currentSectionStyles.containerAlignment || 'center';
                  if (alignment === 'left') return '0';
                  if (alignment === 'right') return '0 0 0 auto';
                  // For full width sections, no auto margins
                  const containerWidth = currentSectionStyles.containerWidth || 'boxed';
                  if (containerWidth === 'full') return '0';
                  return '0 auto';
                })(),
                padding: '0',
                paddingLeft: '0',
                paddingRight: '0',
                boxSizing: 'border-box',
              }}>
              {/* Unified Section Toolbar - shows for ALL sections (component-backed OR element-only) */}
              {builderMode && (() => {
                const projectId = sections.length > 0 && (sections[0] as any).projectId 
                  ? (sections[0] as any).projectId 
                  : searchParamsRef.current.get('projectId') || '';
                const pageId = (section as any).pageId || searchParamsRef.current.get('pageId') || '';
                return projectId && pageId ? (
                  <div
                    style={{
                      position: 'absolute',
                      top: '8px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      display: 'flex',
                      gap: '8px',
                      zIndex: 1000,
                      alignItems: 'center',
                    }}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        
                        // EMPTY SECTION → CONTAINER ONLY: Check if section is empty
                        const customElements = section.customElements || [];
                        const rootContainers = customElements.filter((el: any) => !el.parentElId);
                        
                        // If section is empty, create container instead of opening element sidebar
                        if (rootContainers.length === 0) {
                          // Create a container with default styles
                          const timestamp = Date.now();
                          const containerElId = `container-${timestamp}`;
                          
                          // Add container to section
                          addCustomElement(section.id, 'container' as any, containerElId, false);
                          
                          // Auto-select the new container
                          setSelectedElement({ type: 'container', id: containerElId, sectionId: section.id });
                          
                          // Open sidebar to container settings
                          setSidebarMode('settings');
                          return;
                        }
                        
                        // Section has container - open elements sidebar with container context
                        // Find the root container to add elements inside it
                        const rootContainer = rootContainers[0];
                        setSidebarMode('elements', section.id && rootContainer ? {
                          targetType: 'container',
                          targetSectionId: section.id,
                          targetContainerId: rootContainer.elId,
                        } : section.id ? {
                          targetType: 'section',
                          targetSectionId: section.id,
                        } : undefined);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '6px',
                        borderRadius: '6px',
                        border: '1px solid #d1d5db',
                        background: '#ffffff',
                        color: '#374151',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#f9fafb';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#ffffff';
                      }}
                    >
                      <Plus size={16} />
                    </button>
                    {/* Section Button - Select section and open settings */}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setSelectedElement({ type: 'section', id: section.id });
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '6px',
                        borderRadius: '6px',
                        border: 'none',
                        background: '#6b7280',
                        color: '#ffffff',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#4b5563';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#6b7280';
                      }}
                    >
                      <Layout size={16} />
                    </button>
                    {/* Add Section Below Button */}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        // Create new empty section with root container (enforces invariant: every section has ONE root container)
                        const { section: newSection } = createEmptySectionWithRootContainer();
                        // Insert section at index + 1 (below current section)
                        insertSectionAt(newSection as Section, sectionIdx + 1);
                        // Select the new section
                        setSelectedElement({ type: 'section', id: newSection.id });
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '6px',
                        borderRadius: '6px',
                        border: 'none',
                        background: '#10b981',
                        color: '#ffffff',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#059669';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#10b981';
                      }}
                    >
                      <ArrowDown size={16} />
                    </button>
                    {/* Duplicate Section Button */}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        duplicateSection(section.id);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '6px',
                        borderRadius: '6px',
                        border: 'none',
                        background: '#6366f1',
                        color: '#ffffff',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#4f46e5';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#6366f1';
                      }}
                    >
                      <Copy size={16} />
                    </button>
                    {/* Delete Section Button */}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (confirm('Delete entire section?')) {
                          removeSection(section.id);
                        }
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '6px',
                        borderRadius: '6px',
                        border: 'none',
                        background: '#ef4444',
                        color: '#ffffff',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#dc2626';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#ef4444';
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ) : null;
              })()}
              {/* Empty Section PLUS Icon - Show when section has no containers or only empty root container */}
              {builderMode && (() => {
                const customElements = section.customElements || [];
                const allElements = getCustomElements(section.id);
                // Check if section is empty: no customElements OR only one root container with no children
                const rootContainer = customElements.find((el: any) => !el.parentElId);
                const hasChildren = rootContainer ? allElements.some((el: any) => el.parentElId === rootContainer.elId) : false;
                const isEmpty = customElements.length === 0 || (customElements.length === 1 && rootContainer && !hasChildren);
                
                return isEmpty ? (
                  <div
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      zIndex: 100,
                      pointerEvents: 'auto',
                    }}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      
                      // PREVENT MULTIPLE CONTAINERS: Check if container already exists
                      const existingContainers = customElements.filter((el: any) => !el.parentElId);
                      if (existingContainers.length > 0) {
                        // Container already exists, do nothing
                        return;
                      }
                      
                      // Show Flex/Grid chooser
                      setShowContainerChooser(section.id);
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        background: '#3b82f6',
                        color: '#ffffff',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#2563eb';
                        e.currentTarget.style.transform = 'scale(1.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#3b82f6';
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                    >
                      <Plus size={24} />
                    </div>
                  </div>
                ) : null;
              })()}
              {/* Container Chooser - Show when showContainerChooser matches section.id */}
              {builderMode && showContainerChooser === section.id && (
                <div
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    zIndex: 200,
                    pointerEvents: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    background: '#ffffff',
                    padding: '20px',
                    borderRadius: '8px',
                    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
                    border: '1px solid #e5e7eb',
                    minWidth: '200px',
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: '#374151' }}>
                    Choose Container Type
                  </div>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      
                      // Create Flex Container
                      const timestamp = Date.now();
                      const containerElId = `container-${timestamp}`;
                      
                      // Add container with flex defaults
                      addCustomElement(section.id, 'container' as any, containerElId, false);
                      
                      // Apply flex defaults
                      updateCustomElementStyle(section.id, containerElId, {
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'stretch',
                        justifyContent: 'flex-start',
                        flexWrap: 'wrap',
                        gap: 0,
                        // height: auto (default - user can adjust in builder)
                        marginRight: '20px',
                        marginLeft: '20px',
                        boxSizing: 'border-box',
                        position: 'relative',
                      });
                      
                      // Close chooser
                      setShowContainerChooser(null);
                      
                      // Auto-select the new container
                      setSelectedElement({ type: 'container', id: containerElId, sectionId: section.id });
                      setSidebarMode('settings');
                    }}
                    style={{
                      padding: '12px 16px',
                      borderRadius: '6px',
                      border: '1px solid #d1d5db',
                      background: '#ffffff',
                      color: '#374151',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      textAlign: 'left',
                      fontWeight: 500,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#f9fafb';
                      e.currentTarget.style.borderColor = '#3b82f6';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#ffffff';
                      e.currentTarget.style.borderColor = '#d1d5db';
                    }}
                  >
                    <div style={{ fontSize: '13px', fontWeight: 600 }}>Flex Container</div>
                    <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>Vertical stacking layout</div>
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      
                      // Create Grid Container
                      const timestamp = Date.now();
                      const containerElId = `container-${timestamp}`;
                      
                      // Add container with grid defaults
                      addCustomElement(section.id, 'container' as any, containerElId, false);
                      
                      // Apply grid defaults
                      updateCustomElementStyle(section.id, containerElId, {
                        display: 'grid',
                        gridTemplateColumns: '1fr',
                        gap: 0,
                        // height: auto (default - user can adjust in builder)
                        marginRight: '20px',
                        marginLeft: '20px',
                        boxSizing: 'border-box',
                        position: 'relative',
                      });
                      
                      // Close chooser
                      setShowContainerChooser(null);
                      
                      // Auto-select the new container
                      setSelectedElement({ type: 'container', id: containerElId, sectionId: section.id });
                      setSidebarMode('settings');
                    }}
                    style={{
                      padding: '12px 16px',
                      borderRadius: '6px',
                      border: '1px solid #d1d5db',
                      background: '#ffffff',
                      color: '#374151',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      textAlign: 'left',
                      fontWeight: 500,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#f9fafb';
                      e.currentTarget.style.borderColor = '#3b82f6';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#ffffff';
                      e.currentTarget.style.borderColor = '#d1d5db';
                    }}
                  >
                    <div style={{ fontSize: '13px', fontWeight: 600 }}>Grid Container</div>
                    <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>Column-based layout</div>
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowContainerChooser(null);
                    }}
                    style={{
                      padding: '8px',
                      borderRadius: '6px',
                      border: 'none',
                      background: '#f3f4f6',
                      color: '#6b7280',
                      cursor: 'pointer',
                      fontSize: '12px',
                      marginTop: '4px',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#e5e7eb';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#f3f4f6';
                    }}
                  >
                    Cancel
                  </button>
                </div>
              )}
              {/* Click outside to close chooser */}
              {builderMode && showContainerChooser === section.id && (
                <div
                  style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 199,
                    pointerEvents: 'auto',
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowContainerChooser(null);
                  }}
                />
              )}
              {/* Custom Component Rendering - customElements takes priority over componentType */}
              {((section.customElements && section.customElements.length > 0) || section.componentType) && <CustomComponentRenderer
                key={`${section.id}-${section.componentType}-${section.customElements?.length || 0}`}
                section={section}
                sectionIdx={sectionIdx}
                currentSectionStyles={currentSectionStyles}
                builderMode={builderMode}
                selectedElement={selectedElement}
                setSelectedElement={setSelectedElement}
                getCustomElementStyle={getCustomElementStyle}
                getCustomElementProps={getCustomElementProps}
                getCustomElements={getCustomElements}
                addCustomElement={addCustomElement}
                removeCustomElement={removeCustomElement}
                moveCustomElement={moveCustomElement}
                duplicateCustomElement={duplicateCustomElement}
                updateCustomElementStyle={updateCustomElementStyle}
                updateCustomElementProps={updateCustomElementProps}
                setRightClickPosition={(pos) => { currentRightClickPositionRef.current = pos; }}
                getRightClickPosition={() => currentRightClickPositionRef.current}
                sections={sections}
                setSections={setSections}
                moveSection={moveSection}
                duplicateSection={duplicateSection}
                insertSectionAt={insertSectionAt}
                setContextMenu={setContextMenu}
              />}

              {/* Rows - Only render if no custom component */}
              {!section.componentType && section.rows.map((row, rowIdx) => {
                const currentRowStyles = getBreakpointStyles(row.styles);
                return (
                  <div
                    key={row.id}
                    id={row.customId || undefined}
                    style={{
                      backgroundColor: (() => {
                        // If gradient is set, don't use backgroundColor
                        if (currentRowStyles.gradientColors) return undefined;
                        return currentRowStyles.backgroundColor || '#f3f4f6';
                      })(),
                      backgroundImage: (() => {
                        // Priority: gradient > backgroundImage
                        if (currentRowStyles.gradientColors) {
                          try {
                            const colors = JSON.parse(currentRowStyles.gradientColors);
                            const colorStops = colors.map((c: any) => `${c.color} ${c.stop}`).join(', ');
                            if (currentRowStyles.gradientType === 'radial') {
                              return `radial-gradient(${currentRowStyles.gradientDirection || 'center'}, ${colorStops})`;
                            }
                            return `linear-gradient(${currentRowStyles.gradientAngle || '90deg'}, ${colorStops})`;
                          } catch (e) {
                            // Fallback to backgroundImage if gradient parsing fails
                          }
                        }
                        if (currentRowStyles.backgroundImage) {
                          if (currentRowStyles.backgroundImage.startsWith('linear-gradient') || currentRowStyles.backgroundImage.startsWith('radial-gradient')) {
                            return currentRowStyles.backgroundImage;
                          }
                          return `url(${currentRowStyles.backgroundImage})`;
                        }
                        return undefined;
                      })(),
                      backgroundSize: currentRowStyles.backgroundImage && !currentRowStyles.backgroundImage.startsWith('linear-gradient') && !currentRowStyles.backgroundImage.startsWith('radial-gradient') && !currentRowStyles.gradientColors ? 'cover' : undefined,
                      backgroundPosition: currentRowStyles.backgroundImage && !currentRowStyles.backgroundImage.startsWith('linear-gradient') && !currentRowStyles.backgroundImage.startsWith('radial-gradient') && !currentRowStyles.gradientColors ? 'center' : undefined,
                      backgroundRepeat: currentRowStyles.backgroundImage && !currentRowStyles.backgroundImage.startsWith('linear-gradient') && !currentRowStyles.backgroundImage.startsWith('radial-gradient') && !currentRowStyles.gradientColors ? 'no-repeat' : undefined,
                      display: currentRowStyles.display,
                      flexDirection: currentRowStyles.flexDirection,
                      alignItems: currentRowStyles.alignItems,
                      justifyContent: currentRowStyles.justifyContent,
                      width: currentRowStyles.width,
                      height: currentRowStyles.height,
                      minWidth: currentRowStyles.minWidth,
                      maxWidth: currentRowStyles.maxWidth,
                      minHeight: currentRowStyles.minHeight,
                      maxHeight: currentRowStyles.maxHeight,
                      overflow: currentRowStyles.overflow,
                      overflowX: currentRowStyles.overflowX,
                      overflowY: currentRowStyles.overflowY,
                      position: currentRowStyles.position,
                      top: currentRowStyles.top,
                      right: currentRowStyles.right,
                      bottom: currentRowStyles.bottom,
                      left: currentRowStyles.left,
                      zIndex: currentRowStyles.zIndex,
                      // Remove padding when selected (has ring-4 ring-green-500)
                      ...(selectedElement?.type === 'row' && selectedElement.id === row.id
                        ? { padding: 0 }
                        : (currentRowStyles.padding
                        ? { padding: currentRowStyles.padding }
                        : (currentRowStyles.paddingTop || currentRowStyles.paddingRight || currentRowStyles.paddingBottom || currentRowStyles.paddingLeft)
                          ? {
                              paddingTop: currentRowStyles.paddingTop,
                              paddingRight: currentRowStyles.paddingRight,
                              paddingBottom: currentRowStyles.paddingBottom,
                              paddingLeft: currentRowStyles.paddingLeft,
                            }
                          : builderMode 
                            ? { padding: '4px' } // Small padding in builder mode to make row clickable
                            : { padding: '20px' }
                          )
                      ),
                      ...(currentRowStyles.margin
                        ? { margin: currentRowStyles.margin }
                        : (currentRowStyles.marginTop || currentRowStyles.marginRight || currentRowStyles.marginBottom || currentRowStyles.marginLeft)
                          ? {
                              marginTop: currentRowStyles.marginTop,
                              marginRight: currentRowStyles.marginRight,
                              marginBottom: currentRowStyles.marginBottom || '20px',
                              marginLeft: currentRowStyles.marginLeft,
                            }
                          : { margin: '0 0 20px 0' }
                      ),
                      ...buildBorderStyle(currentRowStyles),
                      boxShadow: buildBoxShadow(currentRowStyles),
                      // Animation styles
                      animation: (() => {
                        if (!currentRowStyles.animationType || currentRowStyles.animationType === 'none') return undefined;
                        const duration = currentRowStyles.animationDuration || '1s';
                        const delay = currentRowStyles.animationDelay || '0s';
                        const animationMap: Record<string, string> = {
                          fadeIn: 'fadeIn',
                          slideUp: 'slideUp',
                          slideDown: 'slideDown',
                          slideLeft: 'slideLeft',
                          slideRight: 'slideRight',
                          zoomIn: 'zoomIn',
                          zoomOut: 'zoomOut',
                        };
                        return `${animationMap[currentRowStyles.animationType]} ${duration} ease-out ${delay} both`;
                      })(),
                    }}
                    onClick={(e) => {
                      if (builderMode) {
                        // Only select row if click is directly on row div, not on column/element/columns-container
                        const target = e.target as HTMLElement;
                        const clickedElement = target.closest('[data-element-type]');
                        
                        // If clicked on column, element, or columns-container, don't select row
                        if (clickedElement && (
                          clickedElement.getAttribute('data-element-type') === 'column' || 
                          clickedElement.getAttribute('data-element-type') === 'element' ||
                          clickedElement.getAttribute('data-element-type') === 'columns-container'
                        )) {
                          return;
                        }
                        
                        // If clicked directly on row div (e.currentTarget) or row controls, select row
                        if (target === e.currentTarget || target.closest('.row-controls')) {
                          e.stopPropagation();
                          setSelectedElement({ type: 'row', id: row.id });
                        }
                      }
                    }}
                    onContextMenu={(e) => {
                      // Right-click context menu disabled - use three-dot menu instead
                      if (builderMode) {
                        e.preventDefault();
                        e.stopPropagation();
                      }
                    }}
                    className={`relative ${builderMode ? 'cursor-pointer' : ''} ${selectedElement?.type === 'row' && selectedElement.id === row.id ? 'ring-4 ring-green-500' : builderMode ? 'ring-1 ring-green-200' : ''} ${currentRowStyles.parallaxEnabled ? 'parallax-section' : ''} ${row.customClasses || ''}`}
                    data-parallax-speed={currentRowStyles.parallaxEnabled ? (currentRowStyles.parallaxSpeed || '0.5') : undefined}
                  >
                    {/* Background Video */}
                    {currentRowStyles.backgroundVideo && (
                      <video
                        autoPlay={currentRowStyles.backgroundVideoAutoplay !== false}
                        loop={currentRowStyles.backgroundVideoLoop !== false}
                        muted={currentRowStyles.backgroundVideoMuted !== false}
                        playsInline
                        className="absolute inset-0 w-full h-full object-cover z-0"
                        style={{ pointerEvents: 'none' }}
                      >
                        <source src={currentRowStyles.backgroundVideo} type="video/mp4" />
                      </video>
                    )}
                    {/* Background Overlay */}
                    {((currentRowStyles.backgroundImage && !currentRowStyles.gradientColors) || (currentRowStyles.backgroundVideo && currentRowStyles.backgroundVideoOverlay)) && (
                      <div
                        className="absolute inset-0 z-0"
                        style={{
                          backgroundColor: (() => {
                            const overlayColor = currentRowStyles.overlayColor || currentRowStyles.backgroundColor || '#000000';
                            const opacity = currentRowStyles.overlayOpacity || '0.5';
                            // Convert hex to rgba if needed
                            if (overlayColor.startsWith('#')) {
                              const hex = overlayColor.replace('#', '');
                              const r = parseInt(hex.substring(0, 2), 16);
                              const g = parseInt(hex.substring(2, 4), 16);
                              const b = parseInt(hex.substring(4, 6), 16);
                              return `rgba(${r}, ${g}, ${b}, ${opacity})`;
                            }
                            // If already rgba, extract and replace opacity
                            if (overlayColor.startsWith('rgba')) {
                              const match = overlayColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
                              if (match) {
                                return `rgba(${match[1]}, ${match[2]}, ${match[3]}, ${opacity})`;
                              }
                            }
                            return `rgba(0, 0, 0, ${opacity})`;
                          })(),
                        }}
                      />
                    )}
                    {builderMode && selectedElement?.type === 'row' && selectedElement.id === row.id && (
                      <>
                        <div className="absolute -top-8 left-0 bg-green-500 text-white px-3 py-1 rounded text-sm z-50">
                          Row Selected
                        </div>
                        <div className="absolute top-2 right-2 flex items-center gap-1 z-50 row-controls">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              moveRow(section.id, row.id, 'up');
                            }}
                            disabled={rowIdx === 0}
                            className={`bg-blue-500 text-white p-2 rounded-tl rounded-bl hover:bg-blue-600 transition shadow-lg ${rowIdx === 0 ? 'opacity-30 cursor-not-allowed' : ''}`}
                            title="Move Up"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              moveRow(section.id, row.id, 'down');
                            }}
                            disabled={rowIdx === section.rows.length - 1}
                            className={`bg-blue-500 text-white p-2 hover:bg-blue-600 transition shadow-lg ${rowIdx === section.rows.length - 1 ? 'opacity-30 cursor-not-allowed' : ''}`}
                            title="Move Down"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              duplicateRow(section.id, row.id);
                            }}
                            className="bg-green-500 text-white p-2 hover:bg-green-600 transition shadow-lg"
                            title="Duplicate Row"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm('Delete this row?')) {
                                deleteRow(section.id, row.id);
                              }
                            }}
                            className="bg-red-500 text-white p-2 rounded-tr rounded-br hover:bg-red-600 transition shadow-lg"
                            title="Delete Row"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </>
                    )}

                    {/* Columns */}
                    <div 
                      data-element-type="columns-container"
                      className={(() => {
                        const layoutType = currentRowStyles.layoutType || 'grid';
                        if (layoutType === 'flex') return '';
                        if (layoutType === 'grid') return 'grid';
                        return ''; // block
                      })()}
                      style={{
                        display: (() => {
                          const layoutType = currentRowStyles.layoutType || 'grid';
                          if (layoutType === 'flex') return 'flex';
                          if (layoutType === 'grid') return 'grid';
                          return 'block';
                        })(),
                        flexDirection: (() => {
                          // On mobile, if flex layout, stack vertically
                          if (activeBreakpoint === 'mobile' && currentRowStyles.layoutType === 'flex') {
                            return 'column';
                          }
                          return currentRowStyles.flexDirection;
                        })(),
                        justifyContent: currentRowStyles.justifyContent,
                        alignItems: currentRowStyles.alignItems,
                        flexWrap: (() => {
                          // On mobile, always wrap flex items
                          if (activeBreakpoint === 'mobile' && currentRowStyles.layoutType === 'flex') {
                            return 'wrap';
                          }
                          return currentRowStyles.flexWrap;
                        })(),
                        gridTemplateColumns: (() => {
                          const layoutType = currentRowStyles.layoutType || 'grid';
                          if (layoutType === 'grid') {
                            // On mobile, stack columns vertically (1 column)
                            if (activeBreakpoint === 'mobile') {
                              return '1fr';
                            }
                            // Use custom gridTemplateColumns if set, otherwise calculate based on column count
                            if (currentRowStyles.gridTemplateColumns) {
                              return currentRowStyles.gridTemplateColumns;
                            }
                            // Default: distribute columns equally based on actual column count
                            const columnCount = row.columns.length;
                            return `repeat(${columnCount}, 1fr)`;
                          }
                          return undefined;
                        })(),
                        gap: currentRowStyles.gap || (activeBreakpoint === 'mobile' ? '16px' : activeBreakpoint === 'tablet' ? '20px' : '24px'),
                        rowGap: (() => {
                          const layoutType = currentRowStyles.layoutType || 'grid';
                          return layoutType === 'grid' ? currentRowStyles.rowGap : undefined;
                        })(),
                        width: currentRowStyles.width,
                      }}
                    >
                      {row.columns.map((col, colIdx) => {
                        const currentColStyles = getBreakpointStyles(col.styles);
                        return (
                  <div
                    key={col.id}
                    id={col.customId || undefined}
                    data-element-type="column"
                    style={{
                      // On mobile, force 100% width to stack columns (both grid and flex)
                      width: (activeBreakpoint === 'mobile' && (currentRowStyles.layoutType === 'grid' || currentRowStyles.layoutType === 'flex'))
                        ? '100%' 
                        : (currentColStyles.width || (currentRowStyles.layoutType === 'flex' ? undefined : '100%')),
                      minWidth: (activeBreakpoint === 'mobile' && (currentRowStyles.layoutType === 'grid' || currentRowStyles.layoutType === 'flex'))
                        ? undefined
                        : (currentColStyles.minWidth !== undefined ? currentColStyles.minWidth : 0),
                      maxWidth: (activeBreakpoint === 'mobile' && (currentRowStyles.layoutType === 'grid' || currentRowStyles.layoutType === 'flex'))
                        ? undefined
                        : currentColStyles.maxWidth,
                      // Flex properties (when parent is flex)
                      // On mobile with flex, reset flex properties to allow stacking
                      flexGrow: (activeBreakpoint === 'mobile' && currentRowStyles.layoutType === 'flex')
                        ? undefined
                        : (currentRowStyles.layoutType === 'flex' ? (currentColStyles.flexGrow !== undefined ? currentColStyles.flexGrow : undefined) : undefined),
                      flexShrink: (activeBreakpoint === 'mobile' && currentRowStyles.layoutType === 'flex')
                        ? undefined
                        : (currentRowStyles.layoutType === 'flex' ? (currentColStyles.flexShrink !== undefined ? currentColStyles.flexShrink : undefined) : undefined),
                      flexBasis: (activeBreakpoint === 'mobile' && currentRowStyles.layoutType === 'flex')
                        ? undefined
                        : (currentRowStyles.layoutType === 'flex' ? currentColStyles.flexBasis : undefined),
                      // Grid properties (when parent is grid)
                      // On mobile, don't apply gridColumn span to allow stacking
                      gridColumn: (activeBreakpoint === 'mobile' && currentRowStyles.layoutType === 'grid')
                        ? undefined
                        : (currentRowStyles.layoutType === 'grid' ? currentColStyles.gridColumn : undefined),
                      gridRow: currentRowStyles.layoutType === 'grid' ? currentColStyles.gridRow : undefined,
                      justifySelf: currentRowStyles.layoutType === 'grid' ? currentColStyles.justifySelf : undefined,
                      // Align Self (works for both flex and grid)
                      alignSelf: currentColStyles.alignSelf,
                      // Order
                      order: currentColStyles.order,
                      backgroundColor: (() => {
                        // If gradient is set, don't use backgroundColor
                        if (currentColStyles.gradientColors) return undefined;
                        if (currentColStyles.backgroundImage) return undefined;
                        return currentColStyles.backgroundColor || 'transparent';
                      })(),
                      backgroundImage: (() => {
                        // Priority: gradient > backgroundImage
                        if (currentColStyles.gradientColors) {
                          try {
                            const colors = JSON.parse(currentColStyles.gradientColors);
                            const colorStops = colors.map((c: any) => `${c.color} ${c.stop}`).join(', ');
                            if (currentColStyles.gradientType === 'radial') {
                              return `radial-gradient(${currentColStyles.gradientDirection || 'center'}, ${colorStops})`;
                            }
                            return `linear-gradient(${currentColStyles.gradientAngle || '90deg'}, ${colorStops})`;
                          } catch (e) {
                            // Fallback to backgroundImage if gradient parsing fails
                          }
                        }
                        if (currentColStyles.backgroundImage) {
                          if (currentColStyles.backgroundImage.startsWith('linear-gradient') || currentColStyles.backgroundImage.startsWith('radial-gradient')) {
                            return currentColStyles.backgroundImage;
                          }
                          return `url(${currentColStyles.backgroundImage})`;
                        }
                        return undefined;
                      })(),
                      backgroundSize: currentColStyles.backgroundImage && !currentColStyles.backgroundImage.startsWith('linear-gradient') && !currentColStyles.backgroundImage.startsWith('radial-gradient') && !currentColStyles.gradientColors ? 'cover' : undefined,
                      backgroundPosition: currentColStyles.backgroundImage && !currentColStyles.backgroundImage.startsWith('linear-gradient') && !currentColStyles.backgroundImage.startsWith('radial-gradient') && !currentColStyles.gradientColors ? 'center' : undefined,
                      backgroundRepeat: currentColStyles.backgroundImage && !currentColStyles.backgroundImage.startsWith('linear-gradient') && !currentColStyles.backgroundImage.startsWith('radial-gradient') && !currentColStyles.gradientColors ? 'no-repeat' : undefined,
                      textAlign: currentColStyles.textAlign,
                      height: currentColStyles.height,
                      minHeight: currentColStyles.minHeight,
                      maxHeight: currentColStyles.maxHeight,
                      overflow: currentColStyles.overflow,
                      overflowX: currentColStyles.overflowX,
                      overflowY: currentColStyles.overflowY,
                      // Remove padding when selected (has ring-4 ring-purple-500)
                      ...(selectedElement?.type === 'column' && selectedElement.id === col.id
                        ? { padding: 0 }
                        : (currentColStyles.padding
                        ? { padding: currentColStyles.padding }
                        : (currentColStyles.paddingTop || currentColStyles.paddingRight || currentColStyles.paddingBottom || currentColStyles.paddingLeft)
                          ? {
                              paddingTop: currentColStyles.paddingTop,
                              paddingRight: currentColStyles.paddingRight,
                              paddingBottom: currentColStyles.paddingBottom,
                              paddingLeft: currentColStyles.paddingLeft,
                            }
                          : { padding: activeBreakpoint === 'mobile' ? '12px' : activeBreakpoint === 'tablet' ? '16px' : '20px' }
                          )
                      ),
                      ...(currentColStyles.margin
                        ? { margin: currentColStyles.margin }
                        : (currentColStyles.marginTop || currentColStyles.marginRight || currentColStyles.marginBottom || currentColStyles.marginLeft)
                          ? {
                              marginTop: currentColStyles.marginTop,
                              marginRight: currentColStyles.marginRight,
                              marginBottom: currentColStyles.marginBottom,
                              marginLeft: currentColStyles.marginLeft,
                            }
                          : {}
                      ),
                      color: currentColStyles.textColor || '#000000',
                      position: currentColStyles.position,
                      top: currentColStyles.top,
                      right: currentColStyles.right,
                      bottom: currentColStyles.bottom,
                      left: currentColStyles.left,
                      zIndex: currentColStyles.zIndex,
                      ...buildBorderStyle(currentColStyles),
                      boxShadow: buildBoxShadow(currentColStyles),
                      // Animation styles
                      animation: (() => {
                        if (!currentColStyles.animationType || currentColStyles.animationType === 'none') return undefined;
                        const duration = currentColStyles.animationDuration || '1s';
                        const delay = currentColStyles.animationDelay || '0s';
                        const animationMap: Record<string, string> = {
                          fadeIn: 'fadeIn',
                          slideUp: 'slideUp',
                          slideDown: 'slideDown',
                          slideLeft: 'slideLeft',
                          slideRight: 'slideRight',
                          zoomIn: 'zoomIn',
                          zoomOut: 'zoomOut',
                        };
                        if (!animationMap[currentColStyles.animationType]) return undefined;
                        return `${animationMap[currentColStyles.animationType]} ${duration} ease-out ${delay} both`;
                      })(),
                    }}
                    onClick={(e) => {
                      if (builderMode) {
                        e.stopPropagation();
                        setSelectedElement({ type: 'column', id: col.id });
                      }
                    }}
                    onContextMenu={(e) => {
                      if (!builderMode) return;
                      const target = e.target as HTMLElement;
                      const clickedElement = target.closest('[data-element-type]');
                      
                      // Don't show column menu if clicking on element
                      if (clickedElement && clickedElement.getAttribute('data-element-type') === 'element') {
                        return;
                      }
                      
                      e.preventDefault();
                      e.stopPropagation();
                      const items: ContextMenuItem[] = [
                        {
                          label: 'Duplicate Column',
                          icon: <Copy className="w-4 h-4" />,
                          onClick: () => duplicateColumn(section.id, row.id, col.id),
                        },
                        {
                          label: 'Move Left',
                          icon: <ArrowLeft className="w-4 h-4" />,
                          onClick: () => moveColumn(section.id, row.id, col.id, 'up'),
                          disabled: colIdx === 0,
                        },
                        {
                          label: 'Move Right',
                          icon: <ArrowRight className="w-4 h-4" />,
                          onClick: () => moveColumn(section.id, row.id, col.id, 'down'),
                          disabled: colIdx === row.columns.length - 1,
                        },
                        { separator: true },
                        {
                          label: 'Delete Column',
                          icon: <Trash2 className="w-4 h-4" />,
                          onClick: () => {
                            if (confirm('Delete this column? All elements will be removed.')) {
                              deleteColumn(section.id, row.id, col.id);
                            }
                          },
                        },
                        { separator: true },
                        {
                          label: 'Column Settings',
                          icon: <Settings className="w-4 h-4" />,
                          onClick: () => setSelectedElement({ type: 'column', id: col.id }),
                        },
                      ];
                      setContextMenu({ 
            items, 
            position: { x: e.clientX, y: e.clientY },
            originalClickPosition: { x: e.clientX, y: e.clientY }
          });
                    }}
                    className={`relative ${builderMode ? 'cursor-pointer' : ''} ${selectedElement?.type === 'column' && selectedElement.id === col.id ? 'ring-4 ring-purple-500' : ''} ${currentColStyles.parallaxEnabled ? 'parallax-section' : ''} ${col.customClasses || ''}`}
                    data-parallax-speed={currentColStyles.parallaxEnabled ? (currentColStyles.parallaxSpeed || '0.5') : undefined}
                  >
                    {/* Background Video */}
                    {currentColStyles.backgroundVideo && (
                      <video
                        autoPlay={currentColStyles.backgroundVideoAutoplay !== false}
                        loop={currentColStyles.backgroundVideoLoop !== false}
                        muted={currentColStyles.backgroundVideoMuted !== false}
                        playsInline
                        className="absolute inset-0 w-full h-full object-cover z-0"
                        style={{ pointerEvents: 'none' }}
                      >
                        <source src={currentColStyles.backgroundVideo} type="video/mp4" />
                      </video>
                    )}
                    {/* Background Overlay */}
                    {((currentColStyles.backgroundImage && !currentColStyles.gradientColors) || (currentColStyles.backgroundVideo && currentColStyles.backgroundVideoOverlay)) && (
                      <div
                        className="absolute inset-0 z-0"
                        style={{
                          backgroundColor: (() => {
                            const overlayColor = currentColStyles.overlayColor || currentColStyles.backgroundColor || '#000000';
                            const opacity = currentColStyles.overlayOpacity || '0.5';
                            if (overlayColor.startsWith('#')) {
                              const hex = overlayColor.replace('#', '');
                              const r = parseInt(hex.substring(0, 2), 16);
                              const g = parseInt(hex.substring(2, 4), 16);
                              const b = parseInt(hex.substring(4, 6), 16);
                              return `rgba(${r}, ${g}, ${b}, ${opacity})`;
                            }
                            if (overlayColor.startsWith('rgba')) {
                              const match = overlayColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
                              if (match) {
                                return `rgba(${match[1]}, ${match[2]}, ${match[3]}, ${opacity})`;
                              }
                            }
                            return `rgba(0, 0, 0, ${opacity})`;
                          })(),
                        }}
                      />
                    )}
                    {builderMode && selectedElement?.type === 'column' && selectedElement.id === col.id && (
                      <>
                        <div className="absolute -top-8 left-0 bg-purple-500 text-white px-3 py-1 rounded text-sm z-50">
                          Column Selected
                        </div>
                        <div className="absolute top-2 right-2 flex items-center gap-1 z-50">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              moveColumn(section.id, row.id, col.id, 'up');
                            }}
                            disabled={colIdx === 0}
                            className={`bg-blue-500 text-white p-2 rounded-tl rounded-bl hover:bg-blue-600 transition shadow-lg ${colIdx === 0 ? 'opacity-30 cursor-not-allowed' : ''}`}
                            title="Move Up"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              moveColumn(section.id, row.id, col.id, 'down');
                            }}
                            disabled={colIdx === row.columns.length - 1}
                            className={`bg-blue-500 text-white p-2 hover:bg-blue-600 transition shadow-lg ${colIdx === row.columns.length - 1 ? 'opacity-30 cursor-not-allowed' : ''}`}
                            title="Move Down"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              duplicateColumn(section.id, row.id, col.id);
                            }}
                            className="bg-green-500 text-white p-2 hover:bg-green-600 transition shadow-lg"
                            title="Duplicate Column"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm('Delete this column?')) {
                                deleteColumn(section.id, row.id, col.id);
                              }
                            }}
                            className="bg-red-500 text-white p-2 hover:bg-red-600 transition shadow-lg"
                            title="Delete Column"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                          <SelectionMenu
                            items={[
                              {
                                label: 'Column Settings',
                                icon: <Settings className="w-4 h-4" />,
                                onClick: () => setSelectedElement({ type: 'column', id: col.id }),
                              },
                              { separator: true },
                              {
                                label: 'Duplicate Column',
                                icon: <Copy className="w-4 h-4" />,
                                onClick: () => duplicateColumn(section.id, row.id, col.id),
                              },
                              { separator: true },
                              {
                                label: 'Move Up',
                                icon: <ArrowUp className="w-4 h-4" />,
                                onClick: () => moveColumn(section.id, row.id, col.id, 'up'),
                                disabled: colIdx === 0,
                              },
                              {
                                label: 'Move Down',
                                icon: <ArrowDown className="w-4 h-4" />,
                                onClick: () => moveColumn(section.id, row.id, col.id, 'down'),
                                disabled: colIdx === row.columns.length - 1,
                              },
                              { separator: true },
                              {
                                label: 'Delete Column',
                                icon: <Trash2 className="w-4 h-4" />,
                                onClick: () => {
                                  if (confirm('Delete this column?')) {
                                    deleteColumn(section.id, row.id, col.id);
                                  }
                                },
                              },
                            ]}
                            position="bottom-right"
                            buttonClassName="rounded-tr rounded-br"
                          />
                        </div>
                        {/* Add Element Button */}
                        <div className="absolute top-12 right-2 flex flex-col gap-2 z-50">
                          <select
                            onChange={(e) => {
                              if (e.target.value) {
                                addElement(section.id, row.id, col.id, e.target.value as Element['type']);
                                e.target.value = '';
                              }
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="text-xs px-2 py-1 border border-gray-300 rounded bg-white shadow-lg"
                            defaultValue=""
                          >
                            <option value="">+ Add Element</option>
                            <option value="heading">Heading</option>
                            <option value="text">Text</option>
                            <option value="description">Description</option>
                            <option value="button">Button</option>
                            <option value="image">Image</option>
                            <option value="video">Video</option>
                            <option value="icon">Icon</option>
                            <option value="html">HTML</option>
                          </select>
                        </div>
                      </>
                    )}

                    {/* Render Elements */}
                    <div className="space-y-2">
                      {(() => {
                        const elements = col.elements || [];
                        if (Array.isArray(elements) && elements.length > 0) {
                          return elements.map((element, elementIdx) => {
                            if (!element || !element.type) return null;
                            return renderElement(element, section.id, row.id, col.id, elementIdx, elements.length);
                          });
                        }
                        return builderMode ? (
                          <div className="text-center py-8 text-gray-400 text-sm border-2 border-dashed border-gray-300 rounded">
                            <p>No elements in this column</p>
                            <p className="text-xs mt-1">Use &quot;Add Element&quot; button to add elements</p>
                          </div>
                        ) : null;
                      })()}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
                );
              })}
              </div>
            </div>
          </div>
        );
      }))}
      </div>
      
      {/* Context Menu */}
      {/* Context menu disabled - using three-dot menu instead */}

        {/* Footer */}
        {projectId && FooterA && (
          <FooterA
            projectId={projectId}
            __studio={builderMode ? {
              selectElement: () => {},
              selectedEl: null,
            } : undefined}
          />
        )}
      </div>
      {/* Layout Viewer Modal */}
      {layoutViewer.isOpen && projectId && (
        <LayoutViewer
          isOpen={layoutViewer.isOpen}
          onClose={() => setLayoutViewer({ isOpen: false })}
          projectId={projectId}
          pageId={layoutViewer.pageId}
          uniqueId={layoutViewer.uniqueId}
          elementId={layoutViewer.elementId}
          elementType={layoutViewer.elementType}
          position={layoutViewer.position}
        />
      )}
      {layoutViewer.isOpen && console.log('[BuilderCanvas] Rendering LayoutViewer with position:', layoutViewer.position)}
    </>
  );
}

// Separate component for custom component rendering to allow hooks
// Use memo with custom comparison to allow updates when needed but prevent unnecessary re-renders
const CustomComponentRenderer = memo(({
  section,
  sectionIdx,
  currentSectionStyles,
  builderMode,
  selectedElement,
  setSelectedElement,
  getCustomElementStyle,
  getCustomElementProps,
  getCustomElements,
  addCustomElement,
  removeCustomElement,
  moveCustomElement,
  duplicateCustomElement,
  updateCustomElementStyle,
  updateCustomElementProps,
  sections,
  setSections,
  moveSection,
  duplicateSection,
  insertSectionAt,
  setContextMenu,
  setRightClickPosition,
}: {
  section: Section;
  sectionIdx: number;
  currentSectionStyles: any;
  builderMode: boolean;
  selectedElement: any;
  setSelectedElement: (element: any) => void;
  getCustomElementStyle: (sectionId: string, elId: string) => React.CSSProperties;
  getCustomElementProps: (sectionId: string, elId: string) => any;
  getCustomElements: (sectionId: string) => Array<{ id: string; type: string; elId: string; order: number }>;
  addCustomElement: (sectionId: string, elementType: any, elId: string, addAtFirst?: boolean, parentElId?: string) => void;
  removeCustomElement: (sectionId: string, elId: string) => void;
  moveCustomElement: (sectionId: string, elId: string, direction: 'up' | 'down') => void;
  duplicateCustomElement: (sectionId: string, elId: string) => void;
  updateCustomElementStyle: (sectionId: string, elId: string, styles: React.CSSProperties) => void;
  updateCustomElementProps: (sectionId: string, elId: string, props: any) => void;
  sections: Section[];
  setSections: (sections: Section[]) => void;
  moveSection: (sectionId: string, direction: 'up' | 'down') => void;
  duplicateSection: (sectionId: string) => void;
  insertSectionAt: (section: Section, index: number) => void;
  setContextMenu: (menu: any) => void;
  setRightClickPosition: (position: { x: number; y: number }) => void;
  getRightClickPosition: () => { x: number; y: number } | null;
}) => {
  // Get setSidebarMode from store for container add element
  const { setSidebarMode } = useStudio();
  
  // Hover tracking state - builder-only feature
  const [hoveredElId, setHoveredElId] = useState<string | null>(null);
  
  // Handler to set hovered element
  const handleSetHoveredElement = useCallback((elId: string | null) => {
    if (builderMode) {
      setHoveredElId(elId);
    }
  }, [builderMode]);
  
  // Force re-render when componentType changes by using it in the component lookup
  const componentType = section.componentType || '';
  
  const Component = registry[componentType];
  
  // If component not found but customElements exist, render customElements directly
  // This handles 'layout' sections and enforces: customElements > componentType
  const hasCustomElements = section.customElements && section.customElements.length > 0;
  
  if (!Component && !hasCustomElements) {
    // Component not found and no customElements - silently return null (don't show error in builder)
    return null;
  }
  
  // Get projectId from URL or section (memoize to prevent re-creation)
  const searchParamsRef = useRef(new URLSearchParams(window.location.search));
  const projectId = section.projectId || searchParamsRef.current.get('projectId') || '';
  const pageId = searchParamsRef.current.get('pageId') || '';
  
  // Get custom elements list - use section.customElements directly for instant updates
  // Sort by order to ensure correct display order
  // Memoize to prevent unnecessary recalculations
  const customElementsList = useMemo(() => {
    const elements = section.customElements || getCustomElements(section.id);
    // Sort by order to ensure correct display
    return [...elements].sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [section.id, section.customElements, getCustomElements]);
  
  // Cache sorted elements for menu calculations
  const sortedElementsCache = useMemo(() => {
    return customElementsList;
  }, [customElementsList]);
  
  // Create stable selectElement function using useCallback with smooth selection
  // Optimized: Remove requestAnimationFrame for immediate response
  const handleSelectElement = useCallback((nodeId: string, elId: string, type: string) => {
    // Direct update for faster response
    if (elId === 'section') {
      setSelectedElement({ 
        type: 'section', 
        id: section.id 
      });
    } else {
      setSelectedElement({ 
        type: 'element', 
        id: `el-${elId}`, 
        sectionId: section.id 
      });
    }
  }, [section.id, setSelectedElement]);

  // Create studio object - always create it when builderMode is true to ensure selection works
  // OPTIMIZED: Memoize with minimal dependencies to prevent unnecessary recreations
  const studioObject = useMemo(() => {
    if (!builderMode) return undefined;
    
    const selectedEl = (() => {
      if (selectedElement?.type === 'element' && selectedElement.sectionId === section.id) {
        const elId = selectedElement.id.replace(/^el-/, '');
        return {
          nodeId: section.id,
          elId: elId,
        };
      }
      if (selectedElement?.type === 'section' && selectedElement.id === section.id) {
        return {
          nodeId: section.id,
          elId: 'section',
        };
      }
      return null;
    })();
    
    // Get pageId and uniqueId from section
    // componentType is the uniqueId string (e.g., "cta_c", "hero_g")
    const pageId = (section as any).pageId || searchParamsRef.current.get('pageId') || '';
    const uniqueId = section.componentType || section.customId || '';
    
    // Use cached elements instead of calling getCustomElements multiple times
    return {
      selectedEl,
      selectElement: handleSelectElement,
      hoveredElId: hoveredElId,
      setHoveredElement: handleSetHoveredElement,
      projectId: projectId,
      pageId: pageId,
      uniqueId: uniqueId,
      getElementStyle: (elId: string): React.CSSProperties => {
        // For section, merge currentSectionStyles with custom element styles
        if (elId === 'section') {
          const customStyles = getCustomElementStyle(section.id, elId);
          // Merge currentSectionStyles (from section.styles) with custom element styles
          // Custom element styles take precedence for any overlapping properties
          const mergedStyles = { ...currentSectionStyles, ...customStyles };
          return mergedStyles;
        }
        // For other elements, get raw styles and map them to CSS properties
        // This ensures headingFontFamily -> fontFamily mapping works correctly
        const rawStyles = getCustomElementStyle(section.id, elId);
        
        // Map custom property keys to standard CSS keys (e.g., headingFontFamily -> fontFamily)
        const mappedStyles: React.CSSProperties = {};
        Object.keys(rawStyles).forEach((key) => {
          let cssKey = key;
          // Map heading-specific keys to standard CSS keys
          if (key === 'headingFontSize') cssKey = 'fontSize';
          else if (key === 'headingFontWeight') cssKey = 'fontWeight';
          else if (key === 'headingTextAlign') cssKey = 'textAlign';
          else if (key === 'headingLineHeight') cssKey = 'lineHeight';
          else if (key === 'headingLetterSpacing') cssKey = 'letterSpacing';
          else if (key === 'headingTextTransform') cssKey = 'textTransform';
          else if (key === 'headingTextDecoration') cssKey = 'textDecoration';
          else if (key === 'headingFontFamily') cssKey = 'fontFamily';
          else if (key === 'textColor') {
            // Map textColor to color, but also preserve textColor for EditableHeading/EditableText
            cssKey = 'color';
            // Preserve textColor in styles so EditableHeading/EditableText can read it directly
            (mappedStyles as any).textColor = rawStyles[key];
          }
          // Keep other keys as-is
          (mappedStyles as any)[cssKey] = rawStyles[key];
        });
        
        // Load font immediately if fontFamily is present
        if (typeof window !== 'undefined' && mappedStyles.fontFamily) {
          const fontFamily = mappedStyles.fontFamily as string;
          if (fontFamily && fontFamily.trim() !== '') {
            loadGoogleFont(fontFamily);
          }
        }
        
        return mappedStyles;
      },
      getElementProps: (elId: string): any => {
        return getCustomElementProps(section.id, elId);
      },
      addCustomElement: (elementType: 'heading' | 'text' | 'description' | 'button' | 'image' | 'video' | 'icon' | 'html' | 'container', elId: string, addAtFirst?: boolean, parentElId?: string) => {
        addCustomElement(section.id, elementType, elId, addAtFirst || false, parentElId);
      },
      removeCustomElement: (elId: string) => {
        removeCustomElement(section.id, elId);
      },
      moveCustomElement: (elId: string, direction: 'up' | 'down') => {
        moveCustomElement(section.id, elId, direction);
      },
      duplicateCustomElement: (elId: string) => {
        duplicateCustomElement(section.id, elId);
      },
      // Always get fresh elements from store, sorted by order
      // OPTIMIZED: Use cached sorted elements
      getCustomElements: () => {
        return sortedElementsCache;
      },
      updateCustomElementStyle: (elId: string, styles: React.CSSProperties) => {
        updateCustomElementStyle(section.id, elId, styles);
      },
      updateCustomElementProps: (elId: string, props: any) => {
        updateCustomElementProps(section.id, elId, props);
      },
      // Get menu items for element selection menu - MEMOIZED for performance
      getElementMenuItems: ((elId: string, elementType: string) => {
        // Use cached sorted elements instead of recalculating
        const elements = sortedElementsCache;
        const elementIdx = elements.findIndex(el => el.elId === elId);
        const currentElement = elements.find(el => el.elId === elId);
        const actualElementType = currentElement?.type || elementType;
        const isContainer = actualElementType === 'container' || elementType === 'container';
        const parentElId = (currentElement as any)?.parentElId;
        
        // Optimize: Single pass to calculate sibling info and children
        let siblingIdx = -1;
        let canMoveUpSibling = false;
        let canMoveDownSibling = false;
        let hasChildren = false;
        let childrenCount = 0;
        
        const siblingElements: typeof elements = [];
        for (let i = 0; i < elements.length; i++) {
          const el = elements[i];
          const elParentElId = (el as any).parentElId;
          const isSibling = (parentElId && elParentElId === parentElId) || (!parentElId && !elParentElId);
          
          if (isSibling) {
            siblingElements.push(el);
            if (el.elId === elId) {
              siblingIdx = siblingElements.length - 1;
            }
          }
          
          if ((el as any).parentElId === elId) {
            hasChildren = true;
            childrenCount++;
          }
        }
        
        canMoveUpSibling = siblingIdx > 0;
        canMoveDownSibling = siblingIdx < siblingElements.length - 1;
        
        const pageId = (section as any).pageId || searchParamsRef.current.get('pageId') || '';
        const uniqueId = section.componentType || section.customId || '';
        const projectId = sections.length > 0 && (sections[0] as any).projectId 
          ? (sections[0] as any).projectId 
          : searchParamsRef.current.get('projectId') || '';
        
        const menuItems: import('@ui/utils/renderElementControls').ElementControlMenuItem[] = [
          {
            label: 'Open Settings',
            icon: <Settings className="w-4 h-4" />,
            onClick: () => handleSelectElement(section.id, elId, elementType),
          },
          { separator: true },
          // View Layout option - only show if element has children
          ...(hasChildren && projectId ? [{
            label: `View Layout${childrenCount > 0 ? ` (${childrenCount} children)` : ''}`,
            icon: <Layout className="w-4 h-4" />,
            onClick: () => {}, // Handled by SelectionMenu
          }, { separator: true }] : []),
          ...(isContainer ? [{
            label: 'Add New Element Inside Container',
            icon: <Plus className="w-4 h-4" />,
            onClick: () => {
              setSidebarMode('elements', {
                targetType: 'container',
                targetSectionId: section.id,
                targetContainerId: elId,
              });
            },
          }, { separator: true }] : []),
          {
            label: 'Move Up',
            icon: <ArrowUp className="w-4 h-4" />,
            onClick: () => moveCustomElement(section.id, elId, 'up'),
            disabled: !canMoveUpSibling,
          },
          {
            label: 'Move Down',
            icon: <ArrowDown className="w-4 h-4" />,
            onClick: () => moveCustomElement(section.id, elId, 'down'),
            disabled: !canMoveDownSibling,
          },
          { separator: true },
          {
            label: 'Duplicate',
            icon: <Copy className="w-4 h-4" />,
            onClick: () => duplicateCustomElement(section.id, elId),
          },
          { separator: true },
          {
            label: 'Delete',
            icon: <Trash2 className="w-4 h-4" />,
            onClick: () => {
              if (confirm('Delete this element?')) {
                removeCustomElement(section.id, elId);
              }
            },
          },
        ];
        return menuItems;
      }),
      // Memoize SelectionMenuComponent to prevent unnecessary re-renders
      SelectionMenuComponent: ((props: any) => {
        // Use cached elements instead of recalculating
        const elements = sortedElementsCache;
        const currentElement = elements.find(el => el.elId === props.elId);
        const hasChildren = elements.some((el: any) => el.parentElId === props.elId);
        const isContainer = (currentElement?.type || props.elementType) === 'container';
        
        return (
          <SelectionMenu
            {...props}
            onLayoutReorder={() => {
              // No action needed - layout view updates immediately
              // Builder will reflect changes on next page load or manual refresh
            }}
            projectId={projectId}
            pageId={pageId}
            uniqueId={uniqueId}
            elementId={props.elId}
            elementType={props.elementType}
            onAddElement={(elementType: string) => {
              const newElId = `element-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
              addCustomElement(section.id, elementType as any, newElId, false, props.elId);
              // Select the newly added element
              handleSelectElement(section.id, newElId, elementType);
            }}
            availableElementTypes={['heading', 'text', 'button', 'image', 'video', 'icon', 'html', 'container']}
          />
        );
      }),
      // Context menu handler for custom elements and section
      onElementContextMenu: (e: React.MouseEvent, elId: string, elementType: string) => {
        // Right-click context menu disabled - use three-dot menu instead
        if (builderMode) {
          e.preventDefault();
          e.stopPropagation();
        }
      },
    };
  }, [
    section.id, 
    section.customElements, 
    section.customElementStyles, 
    section.customElementProps, 
    section.styles, 
    builderMode, 
    selectedElement?.type, 
    selectedElement?.id, 
    selectedElement?.sectionId, 
    hoveredElId, 
    handleSetHoveredElement, 
    getCustomElementStyle, 
    getCustomElementProps, 
    addCustomElement, 
    removeCustomElement, 
    moveCustomElement, 
    duplicateCustomElement, 
    updateCustomElementStyle, 
    updateCustomElementProps, 
    handleSelectElement, 
    sortedElementsCache, // Use cached instead of getCustomElements
    currentSectionStyles, 
    setContextMenu, 
    sections, 
    setSections, 
    setSelectedElement, 
    moveSection, 
    duplicateSection, 
    projectId,
    pageId
  ]);
  
  // Create ref for section container (canvas-relative positioning)
  const sectionContainerRef = useRef<HTMLDivElement>(null);
  
  // If Component is null but customElements exist, render customElements directly
  // This handles 'layout' sections: customElements > componentType
  // Use the same __studio pattern as mono-repo components to render customElements
  if (!Component && hasCustomElements) {
    // Create a simple LayoutWrapper that uses __studio to render customElements
    // This matches how mono-repo components render their customElements
    const LayoutWrapper = ({ __studio, style }: { __studio: any; style: any }) => {
      const elements = __studio?.getCustomElements() || [];
      const rootElements = elements.filter((el: any) => !el.parentElId);
      
      return (
        <div style={style}>
          {rootElements.map((element: any, idx: number) => {
            // Use renderElement with proper signature (imported at top of file)
            return (
              <React.Fragment key={element.elId}>
                {renderElement({
                  element: {
                    type: element.type,
                    elId: element.elId,
                    id: element.id,
                  },
                  elementIdx: idx,
                  sortedElements: elements,
                  elProps: __studio?.getElementProps(element.elId) || {},
                  elStyles: __studio?.getElementStyle(element.elId) || {},
                  isSelected: __studio?.selectedEl?.elId === element.elId,
                  builderMode: builderMode,
                  __nodeId: section.id,
                  __studio: __studio,
                })}
              </React.Fragment>
            );
          })}
        </div>
      );
    };
  
  return (
    <div ref={sectionContainerRef} style={{ position: 'relative' }}>
        {/* Toolbar moved to main section rendering for unified UX */}
        <LayoutWrapper
          __studio={builderMode ? studioObject : undefined}
          style={currentSectionStyles}
          />
        </div>
    );
  }
  
  // Normal rendering path: Component exists (mono-repo component)
  return (
    <div ref={sectionContainerRef} style={{ position: 'relative' }}>
      {/* Toolbar moved to main section rendering for unified UX */}
      <Component
        projectId={projectId}
        __studio={builderMode ? studioObject : undefined}
        __nodeId={section.id}
        style={currentSectionStyles}
      />
    </div>
  );
}, (prevProps, nextProps) => {
  // Always re-render if customElements array changes (length or content)
  const prevCustomElements = prevProps.section.customElements || [];
  const nextCustomElements = nextProps.section.customElements || [];
  
  if (prevCustomElements.length !== nextCustomElements.length) {
    return false; // Re-render
  }
  
  // Check if element order changed by comparing positions (not sorted)
  // This ensures we detect when elements swap positions
  for (let i = 0; i < prevCustomElements.length; i++) {
    const prevEl = prevCustomElements[i];
    const nextEl = nextCustomElements[i];
    if (!prevEl || !nextEl || 
        prevEl.elId !== nextEl.elId || 
        prevEl.order !== nextEl.order) {
      return false; // Re-render - order or elements changed
    }
  }
  
  // Check if customElementStyles changed (sidebar style updates)
  const prevStyles = prevProps.section.customElementStyles || {};
  const nextStyles = nextProps.section.customElementStyles || {};
  if (JSON.stringify(prevStyles) !== JSON.stringify(nextStyles)) {
    return false; // Re-render - styles changed
  }
  
  // Check if customElementProps changed (sidebar prop updates)
  const prevProps_data = prevProps.section.customElementProps || {};
  const nextProps_data = nextProps.section.customElementProps || {};
  if (JSON.stringify(prevProps_data) !== JSON.stringify(nextProps_data)) {
    return false; // Re-render - props changed
  }
  
  // Check if section.styles changed (section-level style updates)
  const prevSectionStyles = prevProps.section.styles || {};
  const nextSectionStyles = nextProps.section.styles || {};
  if (JSON.stringify(prevSectionStyles) !== JSON.stringify(nextSectionStyles)) {
    return false; // Re-render - section styles changed
  }
  
  // Check other critical props
  if (prevProps.section.id !== nextProps.section.id) return false;
  if (prevProps.builderMode !== nextProps.builderMode) return false;
  if (prevProps.selectedElement?.id !== nextProps.selectedElement?.id) return false;
  if (prevProps.selectedElement?.sectionId !== nextProps.selectedElement?.sectionId) return false;
  
  // Check if sections array changed (for section context menu)
  if (prevProps.sections.length !== nextProps.sections.length) return false;
  if (JSON.stringify(prevProps.sections.map(s => s.id)) !== JSON.stringify(nextProps.sections.map(s => s.id))) return false;
  
  // Props are the same, skip re-render
  return true;
});

export default memo(BuilderCanvas);