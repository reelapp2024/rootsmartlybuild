'use client';

import React, { useState, useEffect } from 'react';
import { Section, Row, Column, Element } from '../../types/builder';
import SectionSettings from '../settings/SectionSettings';
import RowSettings from '../settings/RowSettings';
import ColumnSettings from '../settings/ColumnSettings';
import ElementSettings from '../settings/ElementSettings';
import { handleNumberKeyDown as HandleNumberKeyDownType, handleInputKeyDown as HandleInputKeyDownType } from '../../utils/helpers';
import { getElementProperties } from '../../elementProperties';
import ElementPropertyEditor from './ElementPropertyEditor';
import BoxSpacingControl from '../controls/BoxSpacingControl';
import PageSeoSettings from '../settings/PageSeoSettings';
import { http } from '../../config';
import { 
  Type, 
  FileText, 
  AlignLeft, 
  MousePointerClick, 
  Image as ImageIcon, 
  Video, 
  Code, 
  Star, 
  Box, 
  LayoutGrid, 
  Columns,
  Hand,
  RefreshCw,
  Loader2,
  Search,
  Container,
  Link,
  List,
  Badge,
  Minus,
  Square,
  LucideIcon
} from 'lucide-react';
import { getBuilderElements } from '@ui/utils/builderElementsCache';
import { createElementByType, createEmptySectionWithRootContainer } from '@ui/utils/elementStorage';
import { useStudio } from '../../store';

// Element categories with icons
const CATEGORY_ICONS: Record<string, LucideIcon> = {
  'Layout': LayoutGrid,
  'Basic': Type,
  'Media': ImageIcon,
  'Form': MousePointerClick,
  'Advanced': Code,
};

// Element type to icon mapping
const ELEMENT_ICONS: Record<string, LucideIcon> = {
  'container': Container,
  'heading': Type,
  'text': FileText,
  'button': MousePointerClick,
  'image': ImageIcon,
  'video': Video,
  'icon': Square,
  'link': Link,
  'list': List,
  'badge': Badge,
  'divider': Minus,
  'spacer': Square,
  'html': Code,
  'input': FileText,
  'textarea': FileText,
  'select': FileText,
  'label': FileText,
};

interface SettingsSidebarProps {
  sections: Section[];
  selectedElement: {
    type: 'section' | 'row' | 'column' | 'element';
    id: string;
    columnId?: string;
    rowId?: string;
    sectionId?: string;
  } | null;
  activeTab: 'content' | 'style' | 'advanced';
  setActiveTab: (tab: 'content' | 'style' | 'advanced') => void;
  activeBreakpoint: 'desktop' | 'tablet' | 'mobile';
  builderMode: boolean;
  updateSection: (sectionId: string, updates: Partial<Section>) => void;
  updateRow: (sectionId: string, rowId: string, updates: Partial<Row>) => void;
  updateColumn: (sectionId: string, rowId: string, colId: string, updates: Partial<Column>) => void;
  updateElement: (sectionId: string, rowId: string, colId: string, elementId: string, updates: Partial<Element>) => void;
  updateCustomElementStyle: (sectionId: string, elId: string, styles: React.CSSProperties) => void;
  updateCustomElementProps: (sectionId: string, elId: string, props: any) => void;
  getCustomElementStyle: (sectionId: string, elId: string) => React.CSSProperties;
  getCustomElementProps: (sectionId: string, elId: string) => any;
  getBreakpointStyles: (styles: any) => any;
  addCustomElement?: (sectionId: string, elementType: 'heading' | 'text' | 'button' | 'image' | 'video' | 'icon' | 'html' | 'container', elId: string, addAtFirst?: boolean, parentElId?: string) => void;
  removeCustomElement?: (sectionId: string, elId: string) => void;
  handleInputKeyDown: typeof HandleInputKeyDownType;
  handleNumberKeyDown: typeof HandleNumberKeyDownType;
  projectId?: string;
  pageId?: string;
}

export default function SettingsSidebar({
  sections,
  selectedElement,
  activeTab,
  setActiveTab,
  activeBreakpoint,
  builderMode,
  updateSection,
  updateRow,
  updateColumn,
  updateElement,
  updateCustomElementStyle,
  updateCustomElementProps,
  getCustomElementStyle,
  getCustomElementProps,
  getBreakpointStyles,
  addCustomElement,
  removeCustomElement,
  handleInputKeyDown,
  handleNumberKeyDown,
  projectId,
  pageId,
}: SettingsSidebarProps) {
  // Get sidebar mode from store (CRITICAL - fixes undefined error)
  const {
    sidebarMode = 'settings',
    sidebarContext = null,
    setSidebarMode,
    insertElementIntoSection: storeInsertElementIntoSection,
    setSelectedElement: storeSetSelectedElement,
    addSection: storeAddSection,
  } = useStudio();
  
  const [hasVariants, setHasVariants] = useState(false);
  const [checkingVariants, setCheckingVariants] = useState(false);
  const [changingVariant, setChangingVariant] = useState(false);
  const [activeView, setActiveView] = useState<'settings' | 'seo'>('settings');
  
  // Elements list state (for sidebarMode === 'elements')
  const [searchQuery, setSearchQuery] = useState('');
  const [builderElements, setBuilderElements] = useState<Array<{
    _id: string;
    elementId: string;
    displayName: string;
    category: string;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['Layout', 'Basic']));
  
  // Load builder elements when in elements mode (hardcoded, instant)
  useEffect(() => {
    if (!builderMode || sidebarMode !== 'elements') {
      setBuilderElements([]);
      setLoading(false);
      return;
    }
    
    // Get hardcoded elements and filter to only show those with sidebar settings
    getBuilderElements()
      .then((elements) => {
        const supportedElements = elements.filter((el: any) => {
          return el && el.elementId && getElementProperties(el.elementId) !== null;
        });
        setBuilderElements(supportedElements);
        setLoading(false);
      })
      .catch((err) => {
        console.error('[SettingsSidebar] Error loading builder elements:', err);
        setBuilderElements([]);
        setLoading(false);
      });
  }, [builderMode, sidebarMode]);
  
  // Group elements by category
  const groupedElements: Record<string, typeof builderElements> = {};
  builderElements.forEach((el) => {
    const category = el.category || 'Basic';
    if (!groupedElements[category]) {
      groupedElements[category] = [];
    }
    groupedElements[category].push(el);
  });
  
  // Filter by search query
  const filteredGroupedElements: Record<string, typeof builderElements> = {};
  if (searchQuery.trim()) {
    Object.entries(groupedElements).forEach(([category, elements]) => {
      const filtered = elements.filter((el) =>
        el.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        el.elementId.toLowerCase().includes(searchQuery.toLowerCase())
      );
      if (filtered.length > 0) {
        filteredGroupedElements[category] = filtered;
      }
    });
  } else {
    Object.assign(filteredGroupedElements, groupedElements);
  }
  
  const handleElementClick = (elementId: string) => {
    if (!storeInsertElementIntoSection) return;
    
    const element = createElementByType(elementId);
    
    // CRITICAL: If no sidebarContext (empty canvas), auto-create a section first
    let targetSectionId: string;
    if (!sidebarContext || !sidebarContext.targetSectionId) {
      // Auto-create a section if canvas is empty
      if (sections.length === 0) {
        if (!storeAddSection) {
          console.error('[SettingsSidebar] Cannot create section: addSection not available');
          return;
        }
        // Create an empty section with root container
        const { section: newSection } = createEmptySectionWithRootContainer();
        storeAddSection(newSection);
        targetSectionId = newSection.id;
      } else {
        // Use the first section if no context
        targetSectionId = sections[0].id;
      }
    } else {
      targetSectionId = sidebarContext.targetSectionId;
    }
    
    // Insert element based on context
    // CRITICAL: Always find root container if no specific container is targeted
    // This ensures elements are added inside containers, not at section level
    let targetContainerId: string | undefined;
    
    if (sidebarContext && sidebarContext.targetType === 'container' && sidebarContext.targetContainerId) {
      // Use the specified container
      targetContainerId = sidebarContext.targetContainerId;
    } else {
      // Find root container in the section to add element inside it
      const section = sections.find(s => s.id === targetSectionId);
      if (section) {
        const customElements = section.customElements || [];
        const rootContainer = customElements.find((el: any) => !el.parentElId && el.type === 'container');
        if (rootContainer) {
          targetContainerId = rootContainer.elId;
        }
      }
    }
    
    // Insert element with container ID (or undefined if no container found - will create one)
    storeInsertElementIntoSection(
      targetSectionId,
      element,
      targetContainerId
    );
    
    // Switch back to settings mode
    if (setSidebarMode) {
      setSidebarMode('settings');
    }
    
    // Auto-select the newly added element
    if (storeSetSelectedElement && targetSectionId) {
      setTimeout(() => {
        const section = sections.find(s => s.id === targetSectionId);
        if (section && section.customElements) {
          const newElement = section.customElements.find((el: any) => el.elId === element.elementId);
          if (newElement) {
            storeSetSelectedElement({
              type: 'element',
              id: `el-${element.elementId}`,
              sectionId: targetSectionId,
            });
          }
        }
      }, 100);
    }
  };
  
  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };
  // Function to get selected element data
  const getSelectedElementData = () => {
    if (!selectedElement) return null;

    if (selectedElement.type === 'section') {
      const section = sections.find(s => s.id === selectedElement.id);
      return section ? { type: 'section', data: section, sectionId: section.id } : null;
    }

    if (selectedElement.type === 'row') {
      for (const section of sections) {
        const row = section.rows.find(r => r.id === selectedElement.id);
        if (row) {
          return { type: 'row', data: row, sectionId: section.id };
        }
      }
    }

    if (selectedElement.type === 'column') {
      for (const section of sections) {
        for (const row of section.rows) {
          const col = row.columns.find(c => c.id === selectedElement.id);
          if (col) {
            return { type: 'column', data: col, rowId: row.id, sectionId: section.id };
          }
        }
      }
    }

    if (selectedElement.type === 'element') {
      // Check if this is a custom component element (format: el-${elId} with sectionId)
      if (selectedElement.sectionId && selectedElement.id.startsWith('el-')) {
        const elId = selectedElement.id.replace(/^el-/, '');
        const section = sections.find(s => s.id === selectedElement.sectionId);
        if (section && section.componentType) {
          // This is a custom component element
          // Use store functions that merge defaults with DB values
          const currentStyles = getCustomElementStyle(section.id, elId);
          const currentProps = getCustomElementProps(section.id, elId);
          return {
            type: 'customElement',
            data: { elId, styles: currentStyles, props: currentProps },
            sectionId: section.id,
          };
        }
      }
      
      // Find the element in the sections structure (regular elements)
      for (const section of sections) {
        for (const row of section.rows) {
          for (const col of row.columns) {
            const element = (col.elements || []).find(el => el.id === selectedElement.id);
            if (element && selectedElement.sectionId === section.id && 
                selectedElement.rowId === row.id && 
                selectedElement.columnId === col.id) {
              return { 
                type: 'element', 
                data: element, 
                sectionId: section.id, 
                rowId: row.id, 
                columnId: col.id 
              };
            }
          }
        }
      }
    }

    return null;
  };

  if (!builderMode) return null;

  const selectedData = getSelectedElementData();

  // Get the actual element type for display
  const getElementDisplayType = () => {
    if (!selectedElement) return null;
    
    // If it's an element, get the actual element type from selectedData
    if (selectedElement.type === 'element' && selectedData) {
      // Check if it's a custom element (from custom components)
      if (selectedData.type === 'customElement') {
        const section = sections.find(s => s.id === selectedData.sectionId);
        const customEl = selectedData.data as { elId: string; styles: React.CSSProperties; props: any };
        const customElements = section?.customElements || [];
        const element = customElements.find((el: any) => el.elId === customEl.elId);
        return element?.type || 'text';
      }
      // Regular element
      if (selectedData.data) {
      return (selectedData.data as Element).type;
      }
    }
    
    // For section, row, column, return the type as is
    return selectedElement.type;
  };

  const getElementName = (type: string | null) => {
    if (!type) return '';
    const names: { [key: string]: string } = {
      'heading': 'Heading',
      'text': 'Text',
      'button': 'Button',
      'image': 'Image',
      'video': 'Video',
      'html': 'HTML',
      'icon': 'Icon',
      'container': 'Container',
      'row': 'Row',
      'column': 'Column',
      'section': 'Section',
    };
    return names[type] || type.charAt(0).toUpperCase() + type.slice(1);
  };

  const getElementIcon = (type: string | null) => {
    if (!type) return <FileText className="w-6 h-6 text-gray-400" />;
    const iconProps = { className: "w-6 h-6" };
    const icons: { [key: string]: React.ReactNode } = {
      'heading': <Type {...iconProps} className="w-6 h-6 text-blue-600" />,
      'text': <FileText {...iconProps} className="w-6 h-6 text-purple-600" />,
      'button': <MousePointerClick {...iconProps} className="w-6 h-6 text-green-600" />,
      'image': <ImageIcon {...iconProps} className="w-6 h-6 text-pink-600" />,
      'video': <Video {...iconProps} className="w-6 h-6 text-red-600" />,
      'html': <Code {...iconProps} className="w-6 h-6 text-orange-600" />,
      'icon': <Star {...iconProps} className="w-6 h-6 text-yellow-600" />,
      'section': <Box {...iconProps} className="w-6 h-6" style={{ color: '#94a3b8' }} />,
      'row': <LayoutGrid {...iconProps} className="w-6 h-6 text-cyan-600" />,
      'column': <Columns {...iconProps} className="w-6 h-6 text-teal-600" />,
    };
    return icons[type] || <FileText {...iconProps} className="w-6 h-6" style={{ color: '#64748b' }} />;
  };

  const getElementBadgeColor = (type: string | null) => {
    if (!type) return 'bg-gray-100 text-gray-700';
    const colors: { [key: string]: string } = {
      'heading': 'bg-blue-100 text-blue-700',
      'text': 'bg-purple-100 text-purple-700',
      'button': 'bg-green-100 text-green-700',
      'image': 'bg-pink-100 text-pink-700',
      'video': 'bg-red-100 text-red-700',
      'html': 'bg-orange-100 text-orange-700',
      'icon': 'bg-yellow-100 text-yellow-700',
      'container': 'bg-slate-100 text-slate-700',
      'section': 'bg-gray-100 text-gray-700',
      'row': 'bg-cyan-100 text-cyan-700',
      'column': 'bg-teal-100 text-teal-700',
    };
    return colors[type] || 'bg-gray-100 text-gray-700';
  };

  const displayType = getElementDisplayType();
  
  // Get component name for sections
  const getComponentDisplayName = () => {
    if (selectedElement?.type === 'section' && selectedData?.type === 'section') {
      const section = selectedData.data as Section;
      if (section.componentType) {
        // Format component type nicely (e.g., "hero_a" -> "Hero A", "services_a" -> "Services A")
        const parts = section.componentType.split('_');
        if (parts.length > 1) {
          const name = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
          const variant = parts[1].toUpperCase();
          return `${name} ${variant}`;
        }
        // If no underscore, capitalize first letter
        return section.componentType.charAt(0).toUpperCase() + section.componentType.slice(1);
      }
    }
    return null;
  };

  const componentName = getComponentDisplayName();
  const elementName = componentName || (displayType ? getElementName(displayType) : null);
  const elementIcon = displayType ? getElementIcon(displayType) : null;
  const badgeColor = displayType ? getElementBadgeColor(displayType) : 'bg-gray-100 text-gray-700';

  // Get current component uniqueId when section is selected
  const getCurrentComponentUniqueId = () => {
    if (selectedElement?.type === 'section' && selectedData?.type === 'section') {
      const section = selectedData.data as Section;
      return section.componentType || null;
    }
    return null;
  };

  const currentUniqueId = getCurrentComponentUniqueId();

  // Check if variants are available for the selected component
  useEffect(() => {
    const checkVariants = async () => {
      if (!currentUniqueId || !projectId) {
        setHasVariants(false);
        return;
      }

      setCheckingVariants(true);
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setHasVariants(false);
          return;
        }

        const response = await http.get(`/checkComponentVariants?uniqueId=${currentUniqueId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.data?.hasVariants) {
          setHasVariants(true);
        } else {
          setHasVariants(false);
        }
      } catch (error) {
        console.error('Error checking variants:', error);
        setHasVariants(false);
      } finally {
        setCheckingVariants(false);
      }
    };

    checkVariants();
  }, [currentUniqueId, projectId]);

  // Handle variant refresh
  const handleRefreshVariant = async () => {
    const uniqueId = getCurrentComponentUniqueId();
    if (!uniqueId || !projectId || !selectedElement) {
      console.error('[handleRefreshVariant] Missing required data:', { uniqueId, projectId, selectedElement });
      return;
    }

    setChangingVariant(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert('Authentication token not found');
        return;
      }

      const section = sections.find(s => s.id === selectedElement.id);
      if (!section) {
        console.error('[handleRefreshVariant] Section not found:', selectedElement.id);
        return;
      }

      // Get pageId from section or use the provided pageId
      const currentPageId = pageId || section.pageId;
      
      console.log('[handleRefreshVariant] Changing variant:', {
        projectId,
        pageId: currentPageId,
        sectionId: section.id,
        currentUniqueId: uniqueId,
        sectionComponentType: section.componentType
      });

      const response = await http.post(
        '/changeComponentVariant',
        {
          projectId,
          pageId: currentPageId,
          sectionId: section.id,
          currentUniqueId: uniqueId,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data?.newUniqueId) {
        const newUniqueId = response.data.newUniqueId;
        
        console.log('[handleRefreshVariant] Updating section componentType:', {
          sectionId: section.id,
          oldComponentType: section.componentType,
          newComponentType: newUniqueId
        });
        
        // When variant changes, clear customElements so the component uses its default elements
        // This ensures the new variant shows its default structure, not the old variant's elements
        updateSection(section.id, {
          componentType: newUniqueId,
          customElements: [], // Clear elements - component will use defaults
          customElementProps: {}, // Clear props - component will use defaults
          customElementStyles: {} // Clear styles - component will use defaults
        });

        // Force React to detect the change by updating again after a brief delay
        // This ensures the store update propagates and React re-renders
        setTimeout(() => {
          console.log('[handleRefreshVariant] Force update after delay');
          updateSection(section.id, {
            componentType: newUniqueId
          });
        }, 50);

        // Re-check variants for the new uniqueId
        const checkResponse = await http.get(`/checkComponentVariants?uniqueId=${newUniqueId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setHasVariants(checkResponse.data?.hasVariants || false);

        // Show success message
        console.log('[handleRefreshVariant] Variant changed successfully:', newUniqueId);
        console.log('[handleRefreshVariant] Section updated in store, customElements cleared, component should re-render with default elements');
      }
    } catch (error: any) {
      console.error('Error changing variant:', error);
      alert(error.response?.data?.message || 'Failed to change variant');
    } finally {
      setChangingVariant(false);
    }
  };

  // Unified sidebar wrapper with dark theme (Elementor-style)
  // Sidebar shell (dark outer container)
  const SIDEBAR_SHELL_STYLE: React.CSSProperties = {
    background: '#1e293b', // Dark shell (Elementor)
    height: '100%',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  };

  // Sidebar content (white inner panel)
  const SIDEBAR_CONTENT_STYLE: React.CSSProperties = {
    background: '#ffffff', // LIGHT content
    color: '#0f172a',
    flex: 1,
    overflowY: 'auto',
  };

  // Settings card style (white cards inside content)
  const SETTINGS_CARD_STYLE: React.CSSProperties = {
    background: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '16px',
  };

  // Standard input styles (light theme)
  const INPUT_STYLE: React.CSSProperties = {
    background: '#ffffff',
    color: '#0f172a',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    padding: '8px 12px',
    fontSize: '14px',
    outline: 'none',
  };

  // Label style
  const LABEL_STYLE: React.CSSProperties = {
    color: '#334155',
    fontSize: '14px',
    fontWeight: 500,
    marginBottom: '8px',
    display: 'block',
  };

  // Unified header (context-aware)
  const renderSidebarHeader = () => {
    if (sidebarMode === 'elements') {
  return (
        <div
          style={{
            padding: '16px',
            borderBottom: '1px solid #334155',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}
        >
          <div>
            <h2
              style={{
                fontSize: '18px',
                fontWeight: 700,
                marginTop: 0,
                marginRight: 0,
                marginLeft: 0,
                marginBottom: '4px',
                color: '#e2e8f0',
              }}
            >
              Elements
            </h2>
            {sidebarContext ? (
              <p
                style={{
                  fontSize: '12px',
                  color: '#94a3b8',
                  margin: 0,
                }}
              >
                {sidebarContext.targetType === 'container'
                  ? 'Element will be added to this container'
                  : 'Element will be added to this section'}
              </p>
            ) : sections.length === 0 ? (
              <p
                style={{
                  fontSize: '12px',
                  color: '#94a3b8',
                  margin: 0,
                }}
              >
                A section will be created automatically
              </p>
            ) : (
              <p
                style={{
                  fontSize: '12px',
                  color: '#94a3b8',
                  margin: 0,
                }}
              >
                Element will be added to the first section
              </p>
            )}
          </div>
          <button
            onClick={() => setSidebarMode && setSidebarMode(null)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              fontSize: '20px',
              padding: '4px 8px',
              borderRadius: '4px',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#334155';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            ✕
          </button>
        </div>
      );
    }

    // Settings mode header
    return (
      <div
        style={{
          padding: '16px',
          borderBottom: '1px solid #334155',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: '#e2e8f0' }}>Settings</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {selectedElement && (
              <span
                style={{
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: 600,
                  backgroundColor: '#334155',
                  color: '#e2e8f0',
                }}
              >
                {elementName}
              </span>
            )}
            <button
              onClick={() => setSidebarMode && setSidebarMode(null)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                fontSize: '20px',
                padding: '4px 8px',
                borderRadius: '4px',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#334155';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
              title="Close Sidebar"
            >
              ✕
            </button>
          </div>
        </div>
        {displayType ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
            <div style={{ flexShrink: 0, color: '#94a3b8' }}>
              {elementIcon}
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '14px', fontWeight: 500, margin: 0, color: '#e2e8f0' }}>
                {componentName ? `Component: ${componentName}` : `Editing: ${elementName}`}
              </p>
              <p style={{ fontSize: '12px', color: '#94a3b8', margin: '4px 0 0 0' }}>
                {componentName ? 'Component Settings' : 'Element Settings'}
              </p>
            </div>
            {/* Refresh Variant Button */}
            {componentName && selectedElement?.type === 'section' && (
              <div style={{ flexShrink: 0 }}>
                {checkingVariants ? (
                  <button
                    disabled
                    style={{
                      padding: '6px 12px',
                      fontSize: '12px',
                      fontWeight: 500,
                      color: '#64748b',
                      backgroundColor: '#334155',
                      borderRadius: '6px',
                      cursor: 'not-allowed',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Checking...
                  </button>
                ) : hasVariants ? (
                  <button
                    onClick={handleRefreshVariant}
                    disabled={changingVariant}
                    style={{
                      padding: '6px 12px',
                      fontSize: '12px',
                      fontWeight: 500,
                      color: '#3b82f6',
                      backgroundColor: '#1e3a5f',
                      borderRadius: '6px',
                      cursor: changingVariant ? 'not-allowed' : 'pointer',
                      transition: 'background-color 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      opacity: changingVariant ? 0.5 : 1,
                    }}
                    onMouseEnter={(e) => {
                      if (!changingVariant) {
                        e.currentTarget.style.backgroundColor = '#1e40af';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!changingVariant) {
                        e.currentTarget.style.backgroundColor = '#1e3a5f';
                      }
                    }}
                    title="Refresh Variant - Randomly change to another variant"
                  >
                    {changingVariant ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Changing...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-3 h-3" />
                        Refresh Variant
                      </>
                    )}
                  </button>
                ) : null}
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
            <Hand className="w-6 h-6" style={{ color: '#64748b' }} />
            <p style={{ fontSize: '14px', color: '#94a3b8', margin: 0 }}>Select an element to edit</p>
          </div>
        )}
      </div>
    );
  };

  // Render elements list (white content area)
  const renderElementsList = () => {
    return (
      <>
        {/* Search */}
        <div
          style={{
            padding: '12px 16px',
            borderBottom: '1px solid #e5e7eb',
            flexShrink: 0,
          }}
        >
          <input
            type="text"
            placeholder="Search Element..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              ...INPUT_STYLE,
              width: '100%',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = '#3b82f6';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = '#e5e7eb';
            }}
          />
        </div>

        {/* Elements List */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '8px 0',
          }}
        >
          {loading ? (
            <div
              style={{
                padding: '24px',
                textAlign: 'center',
                color: '#64748b',
                fontSize: '14px',
              }}
            >
              Loading elements...
            </div>
          ) : Object.keys(filteredGroupedElements).length === 0 ? (
            <div
              style={{
                padding: '24px',
                textAlign: 'center',
                color: '#64748b',
                fontSize: '14px',
              }}
            >
              {searchQuery ? 'No elements found' : 'No elements configured yet'}
            </div>
          ) : (
            Object.entries(filteredGroupedElements).map(([category, elements]) => {
              const CategoryIcon = CATEGORY_ICONS[category] || LayoutGrid;
              const isExpanded = expandedCategories.has(category);

              return (
                <div key={category}>
                  {/* Category Header */}
                  <button
                    onClick={() => toggleCategory(category)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      background: 'transparent',
                      border: 'none',
                      color: '#334155',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      transition: 'background-color 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#f1f5f9';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <CategoryIcon size={16} style={{ color: '#64748b' }} />
                    <span style={{ flex: 1, textAlign: 'left' }}>{category}</span>
                    <span style={{ fontSize: '10px', color: '#64748b' }}>
                      {isExpanded ? '▼' : '▶'}
                    </span>
                  </button>

                  {/* Category Elements */}
                  {isExpanded && (
                    <div>
                      {elements.map((element) => {
                        const ElementIcon = ELEMENT_ICONS[element.elementId] || Square;

                        return (
                          <button
                            key={element._id}
                            onClick={() => handleElementClick(element.elementId)}
                            style={{
                              width: '100%',
                              padding: '12px 16px 12px 40px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '12px',
                              background: 'transparent',
                              border: 'none',
                              color: '#0f172a',
                              cursor: 'pointer',
                              fontSize: '14px',
                              textAlign: 'left',
                              transition: 'background-color 0.2s',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#f1f5f9';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent';
                            }}
                          >
                            <ElementIcon size={18} style={{ color: '#64748b', flexShrink: 0 }} />
                            <span>{element.displayName}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </>
    );
  };

  // Render settings panel (white content area)
  const renderSettingsPanel = () => (
    <>
      {/* View Toggle Buttons */}
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid #e5e7eb',
          backgroundColor: '#f8fafc',
        }}
      >
        <button
          onClick={() => setActiveView('settings')}
          style={{
            flex: 1,
            padding: '10px 16px',
            fontSize: '14px',
            fontWeight: 500,
            transition: 'all 0.2s',
            border: 'none',
            background: activeView === 'settings' ? '#ffffff' : 'transparent',
            color: activeView === 'settings' ? '#3b82f6' : '#64748b',
            borderBottom: activeView === 'settings' ? '2px solid #3b82f6' : '2px solid transparent',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => {
            if (activeView !== 'settings') {
              e.currentTarget.style.backgroundColor = '#f1f5f9';
            }
          }}
          onMouseLeave={(e) => {
            if (activeView !== 'settings') {
              e.currentTarget.style.backgroundColor = 'transparent';
            }
          }}
        >
          Settings
        </button>
        <button
          onClick={() => setActiveView('seo')}
          style={{
            flex: 1,
            padding: '10px 16px',
            fontSize: '14px',
            fontWeight: 500,
            transition: 'all 0.2s',
            border: 'none',
            background: activeView === 'seo' ? '#ffffff' : 'transparent',
            color: activeView === 'seo' ? '#3b82f6' : '#64748b',
            borderBottom: activeView === 'seo' ? '2px solid #3b82f6' : '2px solid transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
          }}
          onMouseEnter={(e) => {
            if (activeView !== 'seo') {
              e.currentTarget.style.backgroundColor = '#f1f5f9';
            }
          }}
          onMouseLeave={(e) => {
            if (activeView !== 'seo') {
              e.currentTarget.style.backgroundColor = 'transparent';
            }
          }}
        >
            <Search className="w-4 h-4" />
            SEO Settings
        </button>
      </div>

      {/* Content based on active view */}
      {activeView === 'seo' ? (
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px',
            minHeight: 0,
            backgroundColor: '#ffffff',
          }}
        >
          <PageSeoSettings projectId={projectId} pageId={pageId} />
        </div>
      ) : (
        <>
          {/* Tabs */}
          {selectedElement && (
            <div
              style={{
                display: 'flex',
                borderBottom: '1px solid #e5e7eb',
                backgroundColor: '#f8fafc',
              }}
            >
              <button
                onClick={() => setActiveTab('content')}
                style={{
                  flex: 1,
                  padding: '8px 16px',
                  fontSize: '14px',
                  fontWeight: 500,
                  transition: 'all 0.2s',
                  border: 'none',
                  background: activeTab === 'content' ? '#ffffff' : 'transparent',
                  color: activeTab === 'content' ? '#3b82f6' : '#64748b',
                  borderBottom: activeTab === 'content' ? '2px solid #3b82f6' : '2px solid transparent',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== 'content') {
                    e.currentTarget.style.backgroundColor = '#f1f5f9';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== 'content') {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                {selectedElement.type === 'section' || selectedElement.type === 'row' || selectedElement.type === 'column' ? 'Layout' : 'Content'}
              </button>
              <button
                onClick={() => setActiveTab('style')}
                style={{
                  flex: 1,
                  padding: '8px 16px',
                  fontSize: '14px',
                  fontWeight: 500,
                  transition: 'all 0.2s',
                  border: 'none',
                  background: activeTab === 'style' ? '#ffffff' : 'transparent',
                  color: activeTab === 'style' ? '#3b82f6' : '#64748b',
                  borderBottom: activeTab === 'style' ? '2px solid #3b82f6' : '2px solid transparent',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== 'style') {
                    e.currentTarget.style.backgroundColor = '#f1f5f9';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== 'style') {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                Style
              </button>
              <button
                onClick={() => setActiveTab('advanced')}
                style={{
                  flex: 1,
                  padding: '8px 16px',
                  fontSize: '14px',
                  fontWeight: 500,
                  transition: 'all 0.2s',
                  border: 'none',
                  background: activeTab === 'advanced' ? '#ffffff' : 'transparent',
                  color: activeTab === 'advanced' ? '#3b82f6' : '#64748b',
                  borderBottom: activeTab === 'advanced' ? '2px solid #3b82f6' : '2px solid transparent',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== 'advanced') {
                    e.currentTarget.style.backgroundColor = '#f1f5f9';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== 'advanced') {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                Advanced
              </button>
            </div>
          )}

          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '16px',
              minHeight: 0,
              backgroundColor: '#ffffff',
            }}
          >
            {!selectedElement ? (
              <div>
                <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>Select an element to edit its properties</p>
              </div>
            ) : !selectedData ? (
          <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>Element not found</p>
        ) : (
          <>
            {selectedData.type === 'section' && (
              <SectionSettings
                section={selectedData.data as Section}
                sectionId={selectedData.sectionId!}
                activeTab={activeTab}
                activeBreakpoint={activeBreakpoint}
                updateSection={updateSection}
                getBreakpointStyles={getBreakpointStyles}
                handleInputKeyDown={handleInputKeyDown}
                handleNumberKeyDown={handleNumberKeyDown}
              />
            )}

            {selectedData.type === 'row' && (
              <RowSettings
                row={selectedData.data as Row}
                sectionId={selectedData.sectionId!}
                activeTab={activeTab}
                activeBreakpoint={activeBreakpoint}
                updateRow={updateRow}
                getBreakpointStyles={getBreakpointStyles}
                handleInputKeyDown={handleInputKeyDown}
                handleNumberKeyDown={handleNumberKeyDown}
              />
            )}

            {selectedData.type === 'column' && (() => {
              // Find the row to get its layout type
              const row = sections
                .find(s => s.id === selectedData.sectionId)?.rows
                .find(r => r.id === selectedData.rowId);
              return (
                <ColumnSettings
                  column={selectedData.data as Column}
                  sectionId={selectedData.sectionId!}
                  rowId={selectedData.rowId!}
                  activeTab={activeTab}
                  activeBreakpoint={activeBreakpoint}
                  parentRowLayoutType={getBreakpointStyles(row?.styles || {}).layoutType || 'grid'}
                  updateColumn={updateColumn}
                  getBreakpointStyles={getBreakpointStyles}
                  handleInputKeyDown={handleInputKeyDown}
                  handleNumberKeyDown={handleNumberKeyDown}
                />
              );
            })()}

            {selectedData.type === 'customElement' && (() => {
              const customEl = selectedData.data as { elId: string; styles: React.CSSProperties; props: any };
              const section = sections.find(s => s.id === selectedData.sectionId);
              const elId = customEl.elId;
              
              // Get element type from customElements array
              const customElements = section?.customElements || [];
              const element = customElements.find((el: any) => el.elId === elId);
              const elementType = element?.type || 'text'; // Default to 'text' if not found
              
              // Get element properties from registry
              const elementProps = getElementProperties(elementType);
              
              // Use ElementPropertyEditor if properties are available, otherwise fallback to basic editor
              if (elementProps) {
                return (
                  <ElementPropertyEditor
                    elementProperties={elementProps}
                    currentProps={customEl.props || {}}
                    currentStyles={customEl.styles || {}}
                    activeTab={activeTab}
                    elId={elId}
                    sectionId={selectedData.sectionId!}
                    elementType={elementType}
                    sections={sections}
                    updateCustomElementStyle={updateCustomElementStyle}
                    getCustomElementStyle={getCustomElementStyle}
                    getCustomElements={(sectionId) => {
                      const section = sections.find(s => s.id === sectionId);
                      return section?.customElements || [];
                    }}
                    getCustomElementProps={getCustomElementProps}
                    updateCustomElementProps={updateCustomElementProps}
                    addCustomElement={addCustomElement}
                    removeCustomElement={removeCustomElement}
                    onPropsChange={(newProps) => {
                      updateCustomElementProps(selectedData.sectionId!, elId, newProps);
                    }}
                    onStylesChange={(newStyles) => {
                      updateCustomElementStyle(selectedData.sectionId!, elId, newStyles);
                    }}
                  />
                );
              }
              
              // Fallback to basic editor if no properties found
              return (
                <div className="space-y-4">
                  {activeTab === 'content' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div>
                        <label style={LABEL_STYLE}>Text Content</label>
                        <input
                          type="text"
                          value={customEl.props?.text || customEl.props?.heading || ''}
                          onChange={(e) => {
                            const propKey = customEl.props?.text !== undefined ? 'text' : 
                                          customEl.props?.heading !== undefined ? 'heading' : 
                                          'text';
                            updateCustomElementProps(selectedData.sectionId!, elId, { [propKey]: e.target.value });
                          }}
                          style={{
                            ...INPUT_STYLE,
                            width: '100%',
                          }}
                          onFocus={(e) => {
                            e.currentTarget.style.borderColor = '#3b82f6';
                          }}
                          onBlur={(e) => {
                            e.currentTarget.style.borderColor = '#e5e7eb';
                          }}
                          placeholder="Enter text..."
                        />
                      </div>
                    </div>
                  )}
                  
                  {activeTab === 'style' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div>
                        <label style={LABEL_STYLE}>Font Size</label>
                        <input
                          type="text"
                          value={(customEl.styles?.fontSize as string) || ''}
                          onChange={(e) => updateCustomElementStyle(selectedData.sectionId!, elId, { fontSize: e.target.value })}
                          style={{
                            ...INPUT_STYLE,
                            width: '100%',
                          }}
                          onFocus={(e) => {
                            e.currentTarget.style.borderColor = '#3b82f6';
                          }}
                          onBlur={(e) => {
                            e.currentTarget.style.borderColor = '#e5e7eb';
                          }}
                          placeholder="e.g., 2rem, 24px"
                        />
                      </div>
                      <div>
                        <label style={LABEL_STYLE}>Color</label>
                        <input
                          type="color"
                          value={(customEl.styles?.color as string) || '#000000'}
                          onChange={(e) => updateCustomElementStyle(selectedData.sectionId!, elId, { color: e.target.value })}
                          style={{
                            width: '100%',
                            height: '40px',
                            border: '1px solid #e5e7eb',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            backgroundColor: '#ffffff',
                          }}
                        />
                      </div>
                    </div>
                  )}
                  
                  {activeTab === 'advanced' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <BoxSpacingControl
                        label="Margin"
                        styles={customEl.styles || {}}
                        breakpoint={activeBreakpoint}
                        onChange={(partialStyles) => {
                          if (activeBreakpoint === 'desktop') {
                            updateCustomElementStyle(selectedData.sectionId!, elId, {
                              ...customEl.styles,
                              ...partialStyles,
                            });
                          } else {
                            const breakpointStyles = getBreakpointStyles(customEl.styles || {});
                            const updatedBreakpointStyles = { ...breakpointStyles, ...partialStyles };
                            updateCustomElementStyle(selectedData.sectionId!, elId, {
                              ...customEl.styles,
                              [activeBreakpoint]: updatedBreakpointStyles,
                            });
                          }
                        }}
                      />
                      <BoxSpacingControl
                        label="Padding"
                        styles={customEl.styles || {}}
                        breakpoint={activeBreakpoint}
                        onChange={(partialStyles) => {
                          if (activeBreakpoint === 'desktop') {
                            updateCustomElementStyle(selectedData.sectionId!, elId, {
                              ...customEl.styles,
                              ...partialStyles,
                            });
                          } else {
                            const breakpointStyles = getBreakpointStyles(customEl.styles || {});
                            const updatedBreakpointStyles = { ...breakpointStyles, ...partialStyles };
                            updateCustomElementStyle(selectedData.sectionId!, elId, {
                              ...customEl.styles,
                              [activeBreakpoint]: updatedBreakpointStyles,
                            });
                          }
                        }}
                      />
                    </div>
                  )}
                </div>
              );
            })()}

            {selectedData.type === 'element' && (
              <ElementSettings
                element={selectedData.data as Element}
                sectionId={selectedData.sectionId!}
                rowId={selectedData.rowId!}
                columnId={selectedData.columnId || ''}
                activeTab={activeTab}
                activeBreakpoint={activeBreakpoint}
                updateElement={updateElement}
                getBreakpointStyles={getBreakpointStyles}
                handleInputKeyDown={handleInputKeyDown}
                handleNumberKeyDown={handleNumberKeyDown}
              />
            )}
          </>
            )}
          </div>
        </>
      )}
    </>
  );

  // Single unified return structure
  return (
    <div style={SIDEBAR_SHELL_STYLE}>
      {renderSidebarHeader()}
      <div style={SIDEBAR_CONTENT_STYLE}>
        {sidebarMode === 'elements' ? renderElementsList() : renderSettingsPanel()}
      </div>
    </div>
  );
}