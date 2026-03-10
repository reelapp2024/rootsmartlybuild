import { create } from "zustand";
import type { ThemeName, FontName } from "@ui/blocks";
import type { Section, Row, Column, Element } from "./types/builder";
import { getBreakpointStyles as getBreakpointStylesUtil } from "./utils/helpers";
import { 
  getElementDefaults, 
  mergeWithDefaults,
  prepareElementsForStorage,
  getChangedValues
} from "@ui/utils/elementStorage";
import { prepareSectionsForStorage } from "./utils/saveSections";
import { loadGoogleFont } from "@ui/utils/fontLoader";

// Selection type for section/row/column/element
type SelectedElement = {
  type: 'section' | 'row' | 'column' | 'element';
  id: string;
  columnId?: string;
  rowId?: string;
  sectionId?: string;
} | null;

type S = {
  // Data
  sections: Section[];
  selectedElement: SelectedElement;
  activeBreakpoint: 'desktop' | 'tablet' | 'mobile';
  builderMode: boolean;
  theme: ThemeName;
  font: FontName;
  // Change tracking: sectionId -> hasUnsavedChanges
  unsavedChanges: Record<string, boolean>;
  // Sidebar mode state - SINGLE SOURCE OF TRUTH
  // 'elements' → show Elements List
  // 'settings' → show Settings Panel
  // null → sidebar closed
  sidebarMode: 'settings' | 'elements' | null;
  sidebarContext: {
    targetType: 'section' | 'container';
    targetSectionId: string;
    targetContainerId?: string;
  } | null;

  // Selection
  setSelectedElement: (element: SelectedElement) => void;
  clearSelection: () => void;

  // Sections
  addSection: (section: Section) => void;
  insertSectionAt: (section: Section, index: number) => void;
  updateSection: (sectionId: string, updates: Partial<Section>) => void;
  removeSection: (sectionId: string) => void;
  moveSection: (sectionId: string, direction: 'up' | 'down') => void;
  duplicateSection: (sectionId: string) => void;

  // Rows
  addRow: (sectionId: string, row: Row) => void;
  insertRowAt: (sectionId: string, row: Row, index: number) => void;
  updateRow: (sectionId: string, rowId: string, updates: Partial<Row>) => void;
  removeRow: (sectionId: string, rowId: string) => void;
  moveRow: (sectionId: string, rowId: string, direction: 'up' | 'down') => void;
  duplicateRow: (sectionId: string, rowId: string) => void;

  // Columns
  addColumn: (sectionId: string, rowId: string, column: Column) => void;
  insertColumnAt: (sectionId: string, rowId: string, column: Column, index: number) => void;
  updateColumn: (sectionId: string, rowId: string, colId: string, updates: Partial<Column>) => void;
  removeColumn: (sectionId: string, rowId: string, colId: string) => void;
  moveColumn: (sectionId: string, rowId: string, colId: string, direction: 'up' | 'down') => void;
  duplicateColumn: (sectionId: string, rowId: string, colId: string) => void;

  // Elements
  addElement: (sectionId: string, rowId: string, colId: string, elementType: Element['type']) => void;
  updateElement: (sectionId: string, rowId: string, colId: string, elementId: string, updates: Partial<Element>) => void;
  removeElement: (sectionId: string, rowId: string, colId: string, elementId: string) => void;
  moveElement: (sectionId: string, rowId: string, colId: string, elementId: string, direction: 'up' | 'down') => void;
  
  // Custom Component Elements (for components like HeroSection)
  updateCustomElementStyle: (sectionId: string, elId: string, styles: React.CSSProperties) => void;
  updateCustomElementProps: (sectionId: string, elId: string, props: any) => void;
  addCustomElement: (sectionId: string, elementType: 'heading' | 'text' | 'button' | 'image' | 'video' | 'icon' | 'html' | 'container', elId: string, addAtFirst?: boolean, parentElId?: string) => void;
  removeCustomElement: (sectionId: string, elId: string) => void;
  moveCustomElement: (sectionId: string, elId: string, direction: 'up' | 'down') => void;
  duplicateCustomElement: (sectionId: string, elId: string) => void;
  updateCustomElementLayout: (sectionId: string, layoutType: 'flex' | 'grid' | 'column') => void;
  // Insert element into section (builder-level element picker)
  insertElementIntoSection: (sectionId: string, element: { elementId: string; elementType: string; style: Record<string, any>; data: Record<string, any>; order: number; children: any[] }, parentElId?: string) => void;

  // Helpers
  getBreakpointStyles: (styles: any) => any;
  setSections: (sections: Section[]) => void;
  setActiveBreakpoint: (breakpoint: 'desktop' | 'tablet' | 'mobile') => void;
  setBuilderMode: (mode: boolean) => void;
  setTheme: (theme: ThemeName) => void;
  setFont: (font: FontName) => void;
  
  // Custom Component Element Helpers
  getCustomElementStyle: (sectionId: string, elId: string) => React.CSSProperties;
  getCustomElementProps: (sectionId: string, elId: string) => any;
  getCustomElements: (sectionId: string) => Array<{ id: string; type: string; elId: string; order: number; parentElId?: string }>;
  // Prepare sections for database storage (only changed values)
  prepareSectionsForSave: () => Array<{
    sectionId: string;
    componentType: string;
    style: Record<string, any>;
    elementIds: Array<{
      elementId: string;
      elementType: string;
      style: Record<string, any>;
      data: Record<string, any>;
      order: number;
    }>;
  }>;
  // Change tracking
  markSectionChanged: (sectionId: string) => void;
  markSectionSaved: (sectionId: string) => void;
  hasUnsavedChanges: (sectionId: string) => boolean;
  // Sidebar mode
  setSidebarMode: (mode: 'settings' | 'elements' | null, context?: { targetType: 'section' | 'container'; targetSectionId: string; targetContainerId?: string }) => void;
};

export const useStudio = create<S>((set, get) => ({
  // Initial state
  sections: [],
  selectedElement: null,
  activeBreakpoint: 'desktop',
  builderMode: true,
  theme: 'crimson-jet',
  font: 'inter',
  unsavedChanges: {},
  sidebarMode: null, // Default: sidebar closed
  sidebarContext: null,

  // Selection
  setSelectedElement: (element) => set({ 
    selectedElement: element,
    // CRITICAL: Selecting any element MUST switch to settings panel and close elements list
    sidebarMode: element ? 'settings' : null
  }),
  clearSelection: () => set({ 
    selectedElement: null,
    // CRITICAL: Clearing selection closes sidebar
    sidebarMode: null
  }),

  // Sections
  addSection: (section) => set((s) => ({ 
    sections: [...s.sections, section],
    // Mark new section as changed (needs to be saved)
    unsavedChanges: { ...s.unsavedChanges, [section.id]: true },
  })),
  insertSectionAt: (section, index) => set((s) => {
    const next = [...s.sections];
    const idx = Math.max(0, Math.min(index, next.length));
    next.splice(idx, 0, section);
    return { 
      sections: next,
      // Mark new section as changed (needs to be saved)
      unsavedChanges: { ...s.unsavedChanges, [section.id]: true },
    };
  }),
  updateSection: (sectionId, updates) => set((s) => ({
    sections: s.sections.map((section) =>
      section.id === sectionId ? { ...section, ...updates } : section
    ),
    unsavedChanges: { ...s.unsavedChanges, [sectionId]: true },
  })),
  removeSection: (sectionId) => set((s) => {
    const sectionIndex = s.sections.findIndex((section) => section.id === sectionId);
    const filteredSections = s.sections.filter((section) => section.id !== sectionId);
    
    // Auto-select nearest section (prefer above, fallback to below)
    let newSelectedElement = s.selectedElement;
    if (s.selectedElement?.type === 'section' && s.selectedElement.id === sectionId) {
      if (sectionIndex > 0 && filteredSections.length > 0) {
        // Select section above (preferred)
        newSelectedElement = { type: 'section' as const, id: filteredSections[sectionIndex - 1].id };
      } else if (filteredSections.length > 0) {
        // Select section below (fallback)
        newSelectedElement = { type: 'section' as const, id: filteredSections[0].id };
      } else {
        // No sections left
        newSelectedElement = null;
      }
    }
    
    return {
      sections: filteredSections,
      selectedElement: newSelectedElement,
    };
  }),
  moveSection: (sectionId, direction) => set((s) => {
    const currentIndex = s.sections.findIndex((section) => section.id === sectionId);
    if (currentIndex === -1) return s;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= s.sections.length) return s;

    const newSections = [...s.sections];
    [newSections[currentIndex], newSections[newIndex]] = [newSections[newIndex], newSections[currentIndex]];
    return { sections: newSections };
  }),
  duplicateSection: (sectionId) => set((s) => {
    const sectionToDuplicate = s.sections.find((section) => section.id === sectionId);
    if (!sectionToDuplicate) return s;

    // Deep clone the section
    const duplicatedSection: Section = JSON.parse(JSON.stringify(sectionToDuplicate));

    // Generate unique timestamp for this duplication
    const timestamp = Date.now();
    let counter = 0;

    // Generate new IDs for the duplicated section and all nested elements
    const newSectionId = `section-${timestamp}-${counter++}`;
    duplicatedSection.id = newSectionId;
    duplicatedSection.customId = duplicatedSection.customId ? `${duplicatedSection.customId}-copy` : undefined;

    // Update all row IDs
    duplicatedSection.rows = duplicatedSection.rows.map((row) => {
      const newRowId = `row-${timestamp}-${counter++}`;
      const updatedRow = { ...row, id: newRowId };

      // Update all column IDs
      updatedRow.columns = updatedRow.columns.map((col) => {
        const newColId = `col-${timestamp}-${counter++}`;
        const updatedCol = { ...col, id: newColId };

        // Update all element IDs
        if (updatedCol.elements) {
          updatedCol.elements = updatedCol.elements.map((element) => ({
            ...element,
            id: `element-${timestamp}-${counter++}`,
          }));
        }

        return updatedCol;
      });

      return updatedRow;
    });

    // Update customElements IDs if they exist (for element-only sections)
    if (duplicatedSection.customElements && duplicatedSection.customElements.length > 0) {
      const newCustomElementStyles: Record<string, any> = {};
      const newCustomElementProps: Record<string, any> = {};
      const oldToNewElIdMap: Record<string, string> = {}; // Map old elId -> new elId
      
      // First pass: create all elements with new IDs and build mapping
      duplicatedSection.customElements = duplicatedSection.customElements.map((el: any) => {
        const newElId = `container-${timestamp}-${counter++}`;
        const newCustomElId = `custom-el-${timestamp}-${counter++}`;
        const oldElId = el.elId;
        
        // Store mapping for parent reference updates
        oldToNewElIdMap[oldElId] = newElId;
        
        // Copy styles and props for this element
        if (sectionToDuplicate.customElementStyles?.[oldElId]) {
          newCustomElementStyles[newElId] = JSON.parse(JSON.stringify(sectionToDuplicate.customElementStyles[oldElId]));
        }
        if (sectionToDuplicate.customElementProps?.[oldElId]) {
          newCustomElementProps[newElId] = JSON.parse(JSON.stringify(sectionToDuplicate.customElementProps[oldElId]));
        }
        
        return {
          ...el,
          id: newCustomElId,
          elId: newElId,
          // parentElId will be updated in second pass
          _oldParentElId: el.parentElId, // Temporary storage
        };
      });
      
      // Second pass: update parentElId references using the mapping
      duplicatedSection.customElements = duplicatedSection.customElements.map((el: any) => {
        const updatedEl = { ...el };
        if (el._oldParentElId && oldToNewElIdMap[el._oldParentElId]) {
          updatedEl.parentElId = oldToNewElIdMap[el._oldParentElId];
        }
        delete updatedEl._oldParentElId; // Clean up temporary property
        return updatedEl;
      });
      
      duplicatedSection.customElementStyles = newCustomElementStyles;
      duplicatedSection.customElementProps = newCustomElementProps;
    }

    // Insert duplicated section right after the original
    const currentIndex = s.sections.findIndex((section) => section.id === sectionId);
    const newSections = [...s.sections];
    newSections.splice(currentIndex + 1, 0, duplicatedSection);

    return {
      sections: newSections,
      selectedElement: { type: 'section', id: newSectionId },
      // Mark duplicated section as changed
      unsavedChanges: { ...s.unsavedChanges, [newSectionId]: true },
    };
  }),

  // Rows
  addRow: (sectionId, row) => set((s) => ({
    sections: s.sections.map((section) =>
      section.id === sectionId
        ? { ...section, rows: [...section.rows, row] }
        : section
    ),
  })),
  insertRowAt: (sectionId, row, index) => set((s) => ({
    sections: s.sections.map((section) => {
      if (section.id !== sectionId) return section;
      const next = [...section.rows];
      const idx = Math.max(0, Math.min(index, next.length));
      next.splice(idx, 0, row);
      return { ...section, rows: next };
    }),
  })),
  updateRow: (sectionId, rowId, updates) => set((s) => ({
    sections: s.sections.map((section) =>
      section.id === sectionId
        ? {
            ...section,
            rows: section.rows.map((row) => (row.id === rowId ? { ...row, ...updates } : row)),
          }
        : section
    ),
  })),
  removeRow: (sectionId, rowId) => set((s) => ({
    sections: s.sections.map((section) =>
      section.id === sectionId
        ? {
            ...section,
            rows: section.rows.filter((row) => row.id !== rowId),
          }
        : section
    ),
    selectedElement: s.selectedElement?.type === 'row' && s.selectedElement.id === rowId
      ? null
      : s.selectedElement,
  })),
  moveRow: (sectionId, rowId, direction) => set((s) => ({
    sections: s.sections.map((section) => {
      if (section.id !== sectionId) return section;
      const currentIndex = section.rows.findIndex((row) => row.id === rowId);
      if (currentIndex === -1) return section;

      const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      if (newIndex < 0 || newIndex >= section.rows.length) return section;

      const newRows = [...section.rows];
      [newRows[currentIndex], newRows[newIndex]] = [newRows[newIndex], newRows[currentIndex]];
      return { ...section, rows: newRows };
    }),
  })),
  duplicateRow: (sectionId, rowId) => set((s) => {
    const timestamp = Date.now();
    let counter = 0;
    let newRowId = '';

    const newSections = s.sections.map((section) => {
      if (section.id !== sectionId) return section;

      const rowToDuplicate = section.rows.find((r) => r.id === rowId);
      if (!rowToDuplicate) return section;

      // Deep clone the row
      const duplicatedRow: Row = JSON.parse(JSON.stringify(rowToDuplicate));

      // Generate new IDs for the duplicated row and all nested elements
      newRowId = `row-${timestamp}-${counter++}`;
      duplicatedRow.id = newRowId;
      duplicatedRow.customId = duplicatedRow.customId ? `${duplicatedRow.customId}-copy` : undefined;

      // Update all column IDs
      duplicatedRow.columns = duplicatedRow.columns.map((col) => {
        const newColId = `col-${timestamp}-${counter++}`;
        const updatedCol = { ...col, id: newColId };

        // Update all element IDs
        if (updatedCol.elements) {
          updatedCol.elements = updatedCol.elements.map((element) => ({
            ...element,
            id: `element-${timestamp}-${counter++}`,
          }));
        }

        return updatedCol;
      });

      // Insert duplicated row right after the original
      const currentIndex = section.rows.findIndex((r) => r.id === rowId);
      const newRows = [...section.rows];
      newRows.splice(currentIndex + 1, 0, duplicatedRow);

      return { ...section, rows: newRows };
    });

    return {
      sections: newSections,
      selectedElement: newRowId ? { type: 'row', id: newRowId } : s.selectedElement,
    };
  }),

  // Columns
  addColumn: (sectionId, rowId, column) => set((s) => ({
    sections: s.sections.map((section) =>
      section.id === sectionId
        ? {
            ...section,
            rows: section.rows.map((row) =>
              row.id === rowId
                ? { ...row, columns: [...row.columns, column] }
                : row
            ),
          }
        : section
    ),
  })),
  insertColumnAt: (sectionId, rowId, column, index) => set((s) => ({
    sections: s.sections.map((section) => {
      if (section.id !== sectionId) return section;
      return {
        ...section,
        rows: section.rows.map((row) => {
          if (row.id !== rowId) return row;
          const next = [...row.columns];
          const idx = Math.max(0, Math.min(index, next.length));
          next.splice(idx, 0, column);
          return { ...row, columns: next };
        }),
      };
    }),
  })),
  updateColumn: (sectionId, rowId, colId, updates) => set((s) => ({
    sections: s.sections.map((section) =>
      section.id === sectionId
        ? {
            ...section,
            rows: section.rows.map((row) =>
              row.id === rowId
                ? {
                    ...row,
                    columns: row.columns.map((col) => (col.id === colId ? { ...col, ...updates } : col)),
                  }
                : row
            ),
          }
        : section
    ),
  })),
  removeColumn: (sectionId, rowId, colId) => set((s) => ({
    sections: s.sections.map((section) =>
      section.id === sectionId
        ? {
            ...section,
            rows: section.rows.map((row) =>
              row.id === rowId
                ? {
                    ...row,
                    columns: row.columns.filter((col) => col.id !== colId),
                  }
                : row
            ),
          }
        : section
    ),
    selectedElement: s.selectedElement?.type === 'column' && s.selectedElement.id === colId
      ? null
      : s.selectedElement,
  })),
  moveColumn: (sectionId, rowId, colId, direction) => set((s) => ({
    sections: s.sections.map((section) => {
      if (section.id !== sectionId) return section;
      return {
        ...section,
        rows: section.rows.map((row) => {
          if (row.id !== rowId) return row;
          const currentIndex = row.columns.findIndex((col) => col.id === colId);
          if (currentIndex === -1) return row;

          const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
          if (newIndex < 0 || newIndex >= row.columns.length) return row;

          const newColumns = [...row.columns];
          [newColumns[currentIndex], newColumns[newIndex]] = [newColumns[newIndex], newColumns[currentIndex]];
          return { ...row, columns: newColumns };
        }),
      };
    }),
  })),
  duplicateColumn: (sectionId, rowId, colId) => set((s) => {
    const timestamp = Date.now();
    let counter = 0;
    let newColId = '';

    const newSections = s.sections.map((section) => {
      if (section.id !== sectionId) return section;

      const row = section.rows.find((r) => r.id === rowId);
      if (!row) return section;

      const colToDuplicate = row.columns.find((c) => c.id === colId);
      if (!colToDuplicate) return section;

      // Deep clone the column
      const duplicatedCol: Column = JSON.parse(JSON.stringify(colToDuplicate));

      // Generate new IDs for the duplicated column and all nested elements
      newColId = `col-${timestamp}-${counter++}`;
      duplicatedCol.id = newColId;
      duplicatedCol.customId = duplicatedCol.customId ? `${duplicatedCol.customId}-copy` : undefined;

      // Update all element IDs
      if (duplicatedCol.elements) {
        duplicatedCol.elements = duplicatedCol.elements.map((element) => ({
          ...element,
          id: `element-${timestamp}-${counter++}`,
        }));
      }

      // Insert duplicated column right after the original
      const currentIndex = row.columns.findIndex((c) => c.id === colId);
      const newColumns = [...row.columns];
      newColumns.splice(currentIndex + 1, 0, duplicatedCol);

      return {
        ...section,
        rows: section.rows.map((r) => (r.id === rowId ? { ...r, columns: newColumns } : r)),
      };
    });

    return {
      sections: newSections,
      selectedElement: newColId ? { type: 'column', id: newColId } : s.selectedElement,
    };
  }),

  // Elements
  addElement: (sectionId, rowId, colId, elementType) => set((s) => {
    const newElement: Element = {
      id: `element-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: elementType,
      content:
        elementType === 'heading'
          ? { heading: 'New Heading' }
          : elementType === 'text'
          ? { text: 'New Text' }
          : elementType === 'button'
          ? { buttonText: 'Button', buttonLink: '#' }
          : elementType === 'image'
          ? { imageUrl: '' }
          : elementType === 'video'
          ? { videoUrl: '' }
          : elementType === 'icon'
          ? { iconName: '⭐' }
          : elementType === 'html'
          ? { htmlCode: '<p>Enter HTML code</p>' }
          : {},
      styles: {},
    };

    return {
      sections: s.sections.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              rows: section.rows.map((row) =>
                row.id === rowId
                  ? {
                      ...row,
                      columns: row.columns.map((col) =>
                        col.id === colId
                          ? { ...col, elements: [...(col.elements || []), newElement] }
                          : col
                      ),
                    }
                  : row
              ),
            }
          : section
      ),
    };
  }),
  updateElement: (sectionId, rowId, colId, elementId, updates) => set((s) => ({
    sections: s.sections.map((section) =>
      section.id === sectionId
        ? {
            ...section,
            rows: section.rows.map((row) =>
              row.id === rowId
                ? {
                    ...row,
                    columns: row.columns.map((col) =>
                      col.id === colId
                        ? {
                            ...col,
                            elements: (col.elements || []).map((el) =>
                              el.id === elementId ? { ...el, ...updates } : el
                            ),
                          }
                        : col
                    ),
                  }
                : row
            ),
          }
        : section
    ),
  })),
  removeElement: (sectionId, rowId, colId, elementId) => set((s) => ({
    sections: s.sections.map((section) =>
      section.id === sectionId
        ? {
            ...section,
            rows: section.rows.map((row) =>
              row.id === rowId
                ? {
                    ...row,
                    columns: row.columns.map((col) =>
                      col.id === colId
                        ? {
                            ...col,
                            elements: (col.elements || []).filter((el) => el.id !== elementId),
                          }
                        : col
                    ),
                  }
                : row
            ),
          }
        : section
    ),
    selectedElement:
      s.selectedElement?.type === 'element' &&
      s.selectedElement.id === elementId &&
      s.selectedElement.sectionId === sectionId &&
      s.selectedElement.rowId === rowId &&
      s.selectedElement.columnId === colId
        ? null
        : s.selectedElement,
  })),
  moveElement: (sectionId, rowId, colId, elementId, direction) => set((s) => ({
    sections: s.sections.map((section) => {
      if (section.id !== sectionId) return section;
      return {
        ...section,
        rows: section.rows.map((row) => {
          if (row.id !== rowId) return row;
          return {
            ...row,
            columns: row.columns.map((col) => {
              if (col.id !== colId || !col.elements) return col;
              const currentIndex = col.elements.findIndex((e) => e.id === elementId);
              if (currentIndex === -1) return col;

              const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
              if (newIndex < 0 || newIndex >= col.elements.length) return col;

              const newElements = [...col.elements];
              [newElements[currentIndex], newElements[newIndex]] = [newElements[newIndex], newElements[currentIndex]];
              return { ...col, elements: newElements };
            }),
          };
        }),
      };
    }),
  })),

  // Helpers
  getBreakpointStyles: (styles) => getBreakpointStylesUtil(styles, get().activeBreakpoint),
  setSections: (sections) => set({ sections }),
  setActiveBreakpoint: (breakpoint) => set({ activeBreakpoint: breakpoint }),
  setBuilderMode: (mode) => set({ builderMode: mode }),
  setTheme: (theme) => set({ theme }),
  setFont: (font) => set({ font }),
  
  // Custom Component Element Helpers
  updateCustomElementStyle: (sectionId, elId, styles) => {
    // Load fonts immediately when fontFamily is changed
    if (typeof window !== 'undefined') {
      if (styles.fontFamily || styles.headingFontFamily) {
        const fontFamily = styles.fontFamily || styles.headingFontFamily;
        if (fontFamily && fontFamily.trim() !== '') {
          loadGoogleFont(fontFamily);
        }
      }
    }
    
    return set((s) => {
    const section = s.sections.find((sec) => sec.id === sectionId);
    if (!section) return s;
    
    // Special handling for section styles (elId === 'section')
    if (elId === 'section') {
      // For section, merge with existing section.styles and customElementStyles
      // Start with section.styles (from API/DB), then apply customElementStyles overrides, then new styles
      const currentSectionStyles = section.styles || {};
      const currentCustomStyles = section.customElementStyles?.[elId] || {};
      // Merge: API styles (base) -> customElementStyles (previous overrides) -> new styles (latest)
      const mergedStyles = { ...currentSectionStyles, ...currentCustomStyles, ...styles };
      
      return {
        sections: s.sections.map((sec) =>
          sec.id === sectionId
            ? {
                ...sec,
                // Update section.styles with merged styles (for persistence and display)
                styles: mergedStyles,
                // Store only the new/changed styles in customElementStyles (for diff calculation on save)
                customElementStyles: {
                  ...(sec.customElementStyles || {}),
                  [elId]: { ...currentCustomStyles, ...styles }, // Merge previous overrides with new changes
                },
              }
            : sec
        ),
        unsavedChanges: { ...s.unsavedChanges, [sectionId]: true },
      };
    }
    
    // For regular elements, use the existing logic
    // Find element type to get defaults
    const element = section.customElements?.find(el => el.elId === elId);
    const elementType = element?.type || '';
    const defaults = getElementDefaults(elementType);
    
    // Get current merged styles (defaults + DB values)
    const currentMergedStyles = {
      ...defaults.defaultStyle,
      ...(section.customElementStyles?.[elId] || {})
    };
    
    // Apply new styles to merged styles
    const newMergedStyles = { ...currentMergedStyles, ...styles };
    
    // Compare with defaults - only save changed values
    const changedStyles = getChangedValues(newMergedStyles, defaults.defaultStyle);
    
    return {
      sections: s.sections.map((sec) =>
        sec.id === sectionId
          ? {
              ...sec,
              customElementStyles: {
                ...(sec.customElementStyles || {}),
                [elId]: changedStyles, // Only store changed values
              },
            }
          : sec
      ),
      unsavedChanges: { ...s.unsavedChanges, [sectionId]: true },
    };
    });
  },
  updateCustomElementProps: (sectionId, elId, props) => set((s) => {
    const section = s.sections.find((sec) => sec.id === sectionId);
    if (!section) return s;
    
    // Find element type to get defaults
    const element = section.customElements?.find(el => el.elId === elId);
    const elementType = element?.type || '';
    const defaults = getElementDefaults(elementType);
    
    // Get current merged props (defaults + DB values)
    const currentMergedProps = {
      ...defaults.defaultProps,
      ...(section.customElementProps?.[elId] || {})
    };
    
    // Apply new props to merged props
    const newMergedProps = { ...currentMergedProps, ...props };
    
    // Compare with defaults - only save changed values
    const changedProps = getChangedValues(newMergedProps, defaults.defaultProps);
    
    return {
      sections: s.sections.map((sec) =>
        sec.id === sectionId
          ? {
              ...sec,
              customElementProps: {
                ...(sec.customElementProps || {}),
                [elId]: changedProps, // Only store changed values
              },
            }
          : sec
      ),
      unsavedChanges: { ...s.unsavedChanges, [sectionId]: true },
    };
  }),
  getCustomElementStyle: (sectionId, elId) => {
    const section = get().sections.find((s) => s.id === sectionId);
    if (!section) return {};
    
    // Get DB values (stored in store - these are the changed values)
    // IMPORTANT: Return raw DB styles like customSites does - renderElement will handle defaults
    // This ensures builder and customSites show elements in the same position
    const dbStyles = section?.customElementStyles?.[elId] || {};
    
    // Debug logging removed for performance
    
    // Return raw DB styles - renderElement will merge with defaults internally
    // This matches customSites behavior where styles are passed directly
    return dbStyles;
  },
  getCustomElementProps: (sectionId, elId) => {
    const section = get().sections.find((s) => s.id === sectionId);
    if (!section) return {};
    
    // Find the element type
    const element = section.customElements?.find(el => el.elId === elId);
    const elementType = element?.type || '';
    
    // Get defaults for this element type
    const defaults = getElementDefaults(elementType);
    
    // Get DB values (stored in store - these are the changed values)
    const dbProps = section?.customElementProps?.[elId] || {};
    
    // Merge: defaults first, then DB values override
    return mergeWithDefaults(dbProps, defaults.defaultProps);
  },
  getCustomElements: (sectionId) => {
    const section = get().sections.find((s) => s.id === sectionId);
    return section?.customElements || [];
  },
  addCustomElement: (sectionId, elementType, elId, addAtFirst = false, parentElId?: string) => set((s) => {
    const section = s.sections.find((sec) => sec.id === sectionId);
    if (!section) return s;
    
    const existingElements = section.customElements || [];
    
    // If adding to a container, only consider elements with same parent
    const siblingElements = parentElId 
      ? existingElements.filter(e => (e as any).parentElId === parentElId)
      : existingElements.filter(e => !(e as any).parentElId);
    
    // If adding at first, shift all sibling elements' orders up by 1
    let updatedElements = existingElements;
    if (addAtFirst && siblingElements.length > 0) {
      updatedElements = existingElements.map(e => {
        if (parentElId && (e as any).parentElId === parentElId) {
          return { ...e, order: e.order + 1 };
        } else if (!parentElId && !(e as any).parentElId) {
          return { ...e, order: e.order + 1 };
        }
        return e;
      });
    }
    
    const maxOrder = siblingElements.length > 0 
      ? Math.max(...siblingElements.map(e => e.order)) 
      : -1;
    
    const newElement = {
      id: `custom-el-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: elementType,
      elId: elId,
      order: addAtFirst ? 0 : maxOrder + 1,
      parentElId: parentElId,
    };
    
    // Initialize default props and styles for the new element
    // UNIFIED: Use getElementDefaults from elementStorage (which uses DEFAULT_ELEMENT_STRUCTURES)
    // This ensures consistency with rendering and property definitions
    const elementDefaults = getElementDefaults(elementType);
    const defaultProps: any = { ...elementDefaults.defaultProps };
    const defaultStyles: React.CSSProperties = { ...elementDefaults.defaultStyle };
    
    return {
      sections: s.sections.map((sec) =>
        sec.id === sectionId
          ? {
              ...sec,
              customElements: addAtFirst ? [newElement, ...updatedElements] : [...updatedElements, newElement],
              customElementProps: {
                ...(sec.customElementProps || {}),
                [elId]: defaultProps,
              },
              customElementStyles: {
                ...(sec.customElementStyles || {}),
                [elId]: defaultStyles,
              },
            }
          : sec
      ),
      unsavedChanges: { ...s.unsavedChanges, [sectionId]: true },
    };
  }),
  removeCustomElement: (sectionId, elId) => set((s) => ({
    sections: s.sections.map((section) =>
      section.id === sectionId
        ? {
            ...section,
            customElements: (section.customElements || []).filter((el) => el.elId !== elId),
            customElementProps: (() => {
              const props = { ...(section.customElementProps || {}) };
              delete props[elId];
              return props;
            })(),
            customElementStyles: (() => {
              const styles = { ...(section.customElementStyles || {}) };
              delete styles[elId];
              return styles;
            })(),
          }
        : section
    ),
    selectedElement: s.selectedElement?.type === 'element' && 
                     s.selectedElement.sectionId === sectionId &&
                     s.selectedElement.id === `el-${elId}`
      ? null
      : s.selectedElement,
  })),
  duplicateCustomElement: (sectionId, elId) => set((s) => {
    const section = s.sections.find((sec) => sec.id === sectionId);
    if (!section || !section.customElements) return s;
    
    const elementToDuplicate = section.customElements.find((el) => el.elId === elId);
    if (!elementToDuplicate) return s;
    
    // Get the element's props and styles
    const elementProps = section.customElementProps?.[elId] || {};
    const elementStyles = section.customElementStyles?.[elId] || {};
    
    // Create new unique elId
    const newElId = `${elementToDuplicate.type}-${Date.now()}`;
    const maxOrder = Math.max(...section.customElements.map(e => e.order || 0), -1);
    
    // Create duplicate element
    const duplicatedElement = {
      id: `custom-el-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: elementToDuplicate.type,
      elId: newElId,
      order: maxOrder + 1,
    };
    
    return {
      sections: s.sections.map((sec) =>
        sec.id === sectionId
          ? {
              ...sec,
              customElements: [...(sec.customElements || []), duplicatedElement],
              customElementProps: {
                ...(sec.customElementProps || {}),
                [newElId]: { ...elementProps }, // Copy props
              },
              customElementStyles: {
                ...(sec.customElementStyles || {}),
                [newElId]: { ...elementStyles }, // Copy styles
              },
            }
          : sec
      ),
      unsavedChanges: { ...s.unsavedChanges, [sectionId]: true },
    };
  }),
  insertElementIntoSection: (sectionId, element, parentElId) => set((s) => {
    const section = s.sections.find((sec) => sec.id === sectionId);
    if (!section) return s;
    
    // Ensure customElements exists
    const existingElements = section.customElements || [];
    
    // If section has no root container, create one
    let rootContainerId: string | undefined;
    const rootContainer = existingElements.find(e => !(e as any).parentElId && e.type === 'container');
    
    if (!rootContainer && existingElements.length === 0) {
      // Create root container
      const timestamp = Date.now();
      rootContainerId = `container-${timestamp}`;
      const rootContainerElement = {
        id: `custom-el-${timestamp}`,
        type: 'container',
        elId: rootContainerId,
        order: 0,
        parentElId: undefined,
      };
      
      // Initialize container with defaults
      const containerDefaults = getElementDefaults('container');
      
      // Insert container first, then the new element
      const maxOrder = existingElements.length > 0 
        ? Math.max(...existingElements.map(e => e.order || 0), -1)
        : -1;
      
      const newElementFlat = {
        id: `custom-el-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: element.elementType,
        elId: element.elementId,
        order: maxOrder + 1,
        parentElId: rootContainerId, // Insert into root container
      };
      
      return {
        sections: s.sections.map((sec) =>
          sec.id === sectionId
            ? {
                ...sec,
                customElements: [rootContainerElement, newElementFlat],
                customElementProps: {
                  ...(sec.customElementProps || {}),
                  [rootContainerId]: containerDefaults.defaultProps,
                  [element.elementId]: element.data,
                },
                customElementStyles: {
                  ...(sec.customElementStyles || {}),
                  [rootContainerId]: containerDefaults.defaultStyle,
                  [element.elementId]: element.style,
                },
              }
            : sec
        ),
        unsavedChanges: { ...s.unsavedChanges, [sectionId]: true },
      };
    } else {
      // Section has elements - use provided parentElId or find root container
      const targetParentId = parentElId || rootContainer?.elId;
      
      // Get max order for elements with the same parent
      const siblingElements = existingElements.filter(e => (e as any).parentElId === targetParentId);
      const maxOrder = siblingElements.length > 0 
        ? Math.max(...siblingElements.map(e => e.order || 0), -1)
        : -1;
      
      const newElementFlat = {
        id: `custom-el-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: element.elementType,
        elId: element.elementId,
        order: maxOrder + 1,
        parentElId: targetParentId, // Use provided parentElId or root container
      };
      
      return {
        sections: s.sections.map((sec) =>
          sec.id === sectionId
            ? {
                ...sec,
                customElements: [...(sec.customElements || []), newElementFlat],
                customElementProps: {
                  ...(sec.customElementProps || {}),
                  [element.elementId]: element.data,
                },
                customElementStyles: {
                  ...(sec.customElementStyles || {}),
                  [element.elementId]: element.style,
                },
              }
            : sec
        ),
        unsavedChanges: { ...s.unsavedChanges, [sectionId]: true },
      };
    }
  }),
  moveCustomElement: (sectionId, elId, direction) => set((s) => {
    const section = s.sections.find((sec) => sec.id === sectionId);
    if (!section || !section.customElements || section.customElements.length === 0) return s;
    
    // Find the element being moved
    const elementToMove = section.customElements.find((el) => el.elId === elId);
    if (!elementToMove) return s;
    
    // Get all child elements (elements with this element as parent) - these move with the container
    const childElements = section.customElements.filter((el) => (el as any).parentElId === elId);
    
    // Get all sibling elements (same parent or no parent)
    const parentElId = (elementToMove as any).parentElId;
    const siblingElements = section.customElements.filter((el) => {
      const elParentElId = (el as any).parentElId;
      return (parentElId && elParentElId === parentElId) || (!parentElId && !elParentElId);
    });
    
    // Sort siblings by order
    const sortedSiblings = [...siblingElements].sort((a, b) => a.order - b.order);
    const currentIndex = sortedSiblings.findIndex((el) => el.elId === elId);
    if (currentIndex === -1) return s;
    
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= sortedSiblings.length) return s;
    
    // Swap positions
    const temp = sortedSiblings[currentIndex];
    sortedSiblings[currentIndex] = sortedSiblings[newIndex];
    sortedSiblings[newIndex] = temp;
    
    // Update orders for all siblings
    const updatedSiblings = sortedSiblings.map((el, idx) => ({
      ...el,
      order: idx
    }));
    
    // Create new elements array with updated siblings and unchanged other elements
    const allElements = [...section.customElements];
    const updatedElements = allElements.map((el) => {
      const updatedSibling = updatedSiblings.find((s) => s.elId === el.elId);
      if (updatedSibling) {
        return updatedSibling;
      }
      // Child elements keep their order (they move with parent)
      return el;
    });
    
    return {
      sections: s.sections.map((sec) =>
        sec.id === sectionId 
          ? { 
              ...sec, 
              customElements: updatedElements
            } 
          : sec
      ),
      unsavedChanges: { ...s.unsavedChanges, [sectionId]: true },
    };
  }),
  updateCustomElementLayout: (sectionId, layoutType) => set((s) => ({
    sections: s.sections.map((section) =>
      section.id === sectionId
        ? {
            ...section,
            customElementProps: {
              ...(section.customElementProps || {}),
              _layout: layoutType, // Store layout in props
            },
          }
        : section
    ),
  })),
  // Prepare sections for database storage (only changed values)
  prepareSectionsForSave: () => {
    const sections = get().sections;
    return prepareSectionsForStorage(sections);
  },
  // Change tracking
  markSectionChanged: (sectionId) => set((s) => ({
    unsavedChanges: { ...s.unsavedChanges, [sectionId]: true },
  })),
  markSectionSaved: (sectionId) => set((s) => {
    const newChanges = { ...s.unsavedChanges };
    delete newChanges[sectionId];
    return { unsavedChanges: newChanges };
  }),
  hasUnsavedChanges: (sectionId) => {
    const state = get();
    return !!state.unsavedChanges[sectionId];
  },
  // Sidebar mode
  setSidebarMode: (mode, context) => set({
    sidebarMode: mode,
    sidebarContext: context || null,
  }),
}));
