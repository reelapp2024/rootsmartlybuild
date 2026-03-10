/**
 * Container Hover Overlay System
 * 
 * DATA-DRIVEN HIERARCHY ARCHITECTURE:
 * 
 * PHASE 1: Build logical tree from data (once per section)
 * PHASE 2: Resolve hierarchy from logical tree (when root changes)
 * PHASE 3: Measure DOM positions (frequent, O(1))
 * 
 * DOM is for geometry only. Data is the source of truth for hierarchy.
 */

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';

export type ContainerType = 'box' | 'flex' | 'grid';

/**
 * Element data structure from builder
 */
interface ElementData {
  elId: string;
  type: string;
  order: number;
  parentElId?: string;
}

/**
 * Logical element tree - built from data, not DOM
 */
interface ElementTree {
  elementMap: Map<string, ElementData>; // elId -> element data
  parentMap: Map<string, string | null>; // elId -> parentElId
  childrenMap: Map<string, string[]>; // elId -> children elIds
}

/**
 * Hierarchy snapshot - stores ONLY element IDs (no DOM references)
 */
interface HierarchySnapshot {
  rootElId: string;
  parentElIds: string[];
  grandparentElIds: string[];
  siblingElIds: string[];
  childElIds: string[];
  descendantElIds: string[];
}

/**
 * Position data for rendering
 */
interface ElementPosition {
  left: number;
  top: number;
  width: number;
  height: number;
}

interface HierarchyPositions {
  root: ElementPosition | null;
  parents: ElementPosition[];
  grandparents: ElementPosition[];
  siblings: ElementPosition[];
  children: ElementPosition[];
  descendants: ElementPosition[];
}

/**
 * PHASE 1: Build logical element tree from data structure
 */
function buildElementTree(elements: ElementData[]): ElementTree {
  const elementMap = new Map<string, ElementData>();
  const parentMap = new Map<string, string | null>();
  const childrenMap = new Map<string, string[]>();

  // Build maps
  elements.forEach(element => {
    elementMap.set(element.elId, element);
    parentMap.set(element.elId, element.parentElId || null);
    
    // Initialize children array
    if (!childrenMap.has(element.elId)) {
      childrenMap.set(element.elId, []);
    }
    
    // Add to parent's children
    if (element.parentElId) {
      if (!childrenMap.has(element.parentElId)) {
        childrenMap.set(element.parentElId, []);
      }
      childrenMap.get(element.parentElId)!.push(element.elId);
    }
  });

  return { elementMap, parentMap, childrenMap };
}

/**
 * PHASE 2: Resolve hierarchy from logical tree (data-driven, not DOM-driven)
 */
function resolveHierarchyFromTree(
  rootElId: string,
  tree: ElementTree
): HierarchySnapshot | null {
  const { elementMap, parentMap, childrenMap } = tree;

  if (!elementMap.has(rootElId)) {
    return null;
  }

  const snapshot: HierarchySnapshot = {
    rootElId,
    parentElIds: [],
    grandparentElIds: [],
    siblingElIds: [],
    childElIds: [],
    descendantElIds: [],
  };

  // Walk UP to find parents and grandparents
  let currentElId: string | null = rootElId;
  let parentLevel = 0;
  
  while (currentElId) {
    const parentElId = parentMap.get(currentElId);
    if (!parentElId) break;

    if (parentLevel === 0) {
      snapshot.parentElIds.push(parentElId);
    } else {
      snapshot.grandparentElIds.push(parentElId);
    }
    
    currentElId = parentElId;
    parentLevel++;
  }

  // Find siblings (children of same parent)
  const parentElId = parentMap.get(rootElId);
  if (parentElId) {
    const siblings = childrenMap.get(parentElId) || [];
    siblings.forEach(siblingElId => {
      if (siblingElId !== rootElId) {
        snapshot.siblingElIds.push(siblingElId);
      }
    });
  } else {
    // Root element has no parent - siblings are root-level elements
    const rootLevelElements = Array.from(elementMap.values())
      .filter(el => !el.parentElId && el.elId !== rootElId)
      .map(el => el.elId);
    snapshot.siblingElIds.push(...rootLevelElements);
  }

  // Walk DOWN to find children and descendants
  function collectChildren(elId: string, depth: number) {
    const children = childrenMap.get(elId) || [];
    children.forEach(childElId => {
      if (depth === 0) {
        snapshot.childElIds.push(childElId);
      } else {
        snapshot.descendantElIds.push(childElId);
      }
      // Recursively collect deeper descendants
      collectChildren(childElId, depth + 1);
    });
  }

  collectChildren(rootElId, 0);

  return snapshot;
}

/**
 * PHASE 3: Measure DOM positions (O(1) - just getBoundingClientRect)
 */
function measurePositions(
  snapshot: HierarchySnapshot,
  sectionContainer: HTMLElement | null
): HierarchyPositions {
  const sectionRect = sectionContainer?.getBoundingClientRect() || { top: 0, left: 0 };

  const getPosition = (elId: string): ElementPosition | null => {
    // Query DOM for element
    const element = document.querySelector(`[data-el-id="${elId}"], [data-section-id="${elId}"]`) as HTMLElement;
    if (!element || !element.isConnected) return null;
    
    const rect = element.getBoundingClientRect();
    return {
      left: rect.left - sectionRect.left,
      top: rect.top - sectionRect.top,
      width: rect.width,
      height: rect.height,
    };
  };

  return {
    root: getPosition(snapshot.rootElId),
    parents: snapshot.parentElIds.map(getPosition).filter((p): p is ElementPosition => p !== null),
    grandparents: snapshot.grandparentElIds.map(getPosition).filter((p): p is ElementPosition => p !== null),
    siblings: snapshot.siblingElIds.map(getPosition).filter((p): p is ElementPosition => p !== null),
    children: snapshot.childElIds.map(getPosition).filter((p): p is ElementPosition => p !== null),
    descendants: snapshot.descendantElIds.map(getPosition).filter((p): p is ElementPosition => p !== null),
  };
}

/**
 * Container Hover Overlay Component
 * DATA-DRIVEN HIERARCHY with three-phase architecture
 */
interface ContainerHoverOverlayProps {
  hoveredElId: string | null;
  builderMode: boolean;
  canvasContainerRef?: React.RefObject<HTMLElement> | null;
  selectedElementId?: string | null;
  elements?: ElementData[]; // Element data from builder
  sectionId?: string; // Section ID (for section as root)
}

export function ContainerHoverOverlay({
  hoveredElId: _hoveredElId,
  builderMode,
  canvasContainerRef,
  selectedElementId,
  elements = [],
  sectionId,
}: ContainerHoverOverlayProps) {
  // PHASE 1: Build logical tree (once per section)
  const elementTreeRef = useRef<ElementTree | null>(null);
  
  // Rebuild tree when elements change
  useEffect(() => {
    if (elements.length > 0) {
      elementTreeRef.current = buildElementTree(elements);
    } else {
      elementTreeRef.current = null;
    }
  }, [elements]);

  // PHASE 2: Hierarchy snapshot (built only when root changes)
  const hierarchySnapshotRef = useRef<HierarchySnapshot | null>(null);
  const lastRootIdRef = useRef<string | null>(null);
  
  // PHASE 3: Positions (updated frequently)
  const [positions, setPositions] = useState<HierarchyPositions | null>(null);
  
  const rafIdRef = useRef<number | null>(null);

  /**
   * PHASE 2: Resolve hierarchy from logical tree
   */
  const resolveHierarchy = useCallback((rootElId: string | null) => {
    if (!rootElId) {
      hierarchySnapshotRef.current = null;
      lastRootIdRef.current = null;
      setPositions(null);
      return;
    }

    const tree = elementTreeRef.current;
    if (!tree) {
      hierarchySnapshotRef.current = null;
      setPositions(null);
      return;
    }

    // Only rebuild if root ID changed
    if (rootElId === lastRootIdRef.current && hierarchySnapshotRef.current) {
      // Root unchanged, just update positions
      updatePositions();
      return;
    }

    // Root changed - rebuild hierarchy snapshot
    lastRootIdRef.current = rootElId;

    // Check if root is section (special case)
    if (rootElId === sectionId) {
      // Section as root - find all root-level elements as children
      const snapshot: HierarchySnapshot = {
        rootElId,
        parentElIds: [],
        grandparentElIds: [],
        siblingElIds: [],
        childElIds: [],
        descendantElIds: [],
      };

      // Get root-level elements (no parentElId)
      const rootLevelElements = Array.from(tree.elementMap.values())
        .filter(el => !el.parentElId)
        .map(el => el.elId);
      snapshot.childElIds.push(...rootLevelElements);

      // Collect all descendants
      function collectAllDescendants(elId: string) {
        const children = tree.childrenMap.get(elId) || [];
        children.forEach(childElId => {
          snapshot.descendantElIds.push(childElId);
          collectAllDescendants(childElId);
        });
      }

      rootLevelElements.forEach(elId => {
        collectAllDescendants(elId);
      });

      hierarchySnapshotRef.current = snapshot;
    } else {
      // Element as root - use normal hierarchy resolution
      const snapshot = resolveHierarchyFromTree(rootElId, tree);
      hierarchySnapshotRef.current = snapshot;
    }

    if (!hierarchySnapshotRef.current) {
      setPositions(null);
      return;
    }

    // Immediately calculate initial positions
    const sectionContainer = canvasContainerRef?.current || null;
    const initialPositions = measurePositions(hierarchySnapshotRef.current, sectionContainer);
    setPositions(initialPositions);
  }, [canvasContainerRef, sectionId]);

  /**
   * PHASE 3: Update positions (FREQUENT - O(1) operation)
   */
  const updatePositions = useCallback(() => {
    const snapshot = hierarchySnapshotRef.current;
    if (!snapshot) {
      setPositions(null);
      return;
    }

    const sectionContainer = canvasContainerRef?.current || null;
    const newPositions = measurePositions(snapshot, sectionContainer);
    setPositions(newPositions);
  }, [canvasContainerRef]);

  // Main effect: Handle hover and selection
  useEffect(() => {
    if (!builderMode) {
      hierarchySnapshotRef.current = null;
      setPositions(null);
      return;
    }

    let lastHoverRootId: string | null = null;
    let lastSelectedRootId: string | null = null;

    const handleMouseMove = (e: MouseEvent) => {
      // Cancel pending updates
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }

      rafIdRef.current = requestAnimationFrame(() => {
        // Priority: selection > hover
        let rootElId: string | null = null;

        // Check selection first
        if (selectedElementId && selectedElementId !== lastSelectedRootId) {
          rootElId = selectedElementId;
          lastSelectedRootId = selectedElementId;
          lastHoverRootId = null; // Clear hover when selection active
        } else if (selectedElementId) {
          // Selection unchanged
          rootElId = selectedElementId;
        }

        // If no selection, use hover
        if (!rootElId) {
          const target = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement;
          if (!target) {
            if (lastHoverRootId !== null) {
              lastHoverRootId = null;
              resolveHierarchy(null);
            }
            return;
          }

          // Skip overlay/controls
          if (
            target.closest('[data-container-overlay]') ||
            target.closest('[data-element-controls]')
          ) {
            return;
          }

          // Find nearest element and get its elId
          let current: HTMLElement | null = target;
          while (current) {
            const elId = current.getAttribute('data-el-id') || current.getAttribute('data-section-id');
            if (elId) {
              rootElId = elId;
              break;
            }
            current = current.parentElement;
            if (!current || current.tagName === 'BODY') break;
          }
        }

        // PHASE 2: Resolve hierarchy only if root ID changed
        if (rootElId && rootElId !== lastHoverRootId && rootElId !== lastSelectedRootId) {
          lastHoverRootId = rootElId;
          resolveHierarchy(rootElId);
        } else if (!rootElId && lastHoverRootId !== null) {
          lastHoverRootId = null;
          resolveHierarchy(null);
        } else if (rootElId) {
          // PHASE 3: Root unchanged, just update positions
          updatePositions();
        }
      });
    };

    const handleMouseLeave = () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
      if (!selectedElementId && lastHoverRootId !== null) {
        lastHoverRootId = null;
        resolveHierarchy(null);
      }
    };

    // Position updates (scroll/resize)
    const handlePositionUpdate = () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
      rafIdRef.current = requestAnimationFrame(() => {
        updatePositions();
      });
    };

    document.addEventListener('mousemove', handleMouseMove, true);
    document.body.addEventListener('mouseleave', handleMouseLeave, true);
    window.addEventListener('scroll', handlePositionUpdate, true);
    window.addEventListener('resize', handlePositionUpdate);

    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
      document.removeEventListener('mousemove', handleMouseMove, true);
      document.body.removeEventListener('mouseleave', handleMouseLeave, true);
      window.removeEventListener('scroll', handlePositionUpdate, true);
      window.removeEventListener('resize', handlePositionUpdate);
    };
  }, [builderMode, selectedElementId, resolveHierarchy, updatePositions]);

  // Handle selection changes
  useEffect(() => {
    if (!builderMode) return;

    if (selectedElementId) {
      resolveHierarchy(selectedElementId);
    } else if (!lastRootIdRef.current) {
      // Clear if no selection and no hover
      resolveHierarchy(null);
    }
  }, [selectedElementId, builderMode, resolveHierarchy]);

  if (!positions || !builderMode || !positions.root) {
    return null;
  }

  const { root, parents, grandparents, siblings, children, descendants } = positions;

  const overlayStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
    zIndex: 9998,
  };

  const renderOutline = (
    pos: ElementPosition,
    border: string,
    key: string
  ) => (
    pos.width > 0 && pos.height > 0 && (
      <div
        key={key}
        style={{
          position: 'absolute',
          left: `${pos.left}px`,
          top: `${pos.top}px`,
          width: `${pos.width}px`,
          height: `${pos.height}px`,
          border,
          pointerEvents: 'none',
          boxSizing: 'border-box',
        }}
      />
    )
  );

  return (
    <div style={overlayStyle} data-container-overlay="true">
      {/* Root element - strong solid outline */}
      {root && renderOutline(root, '2px solid #3B82F6', 'root')}

      {/* Parent containers - dashed green */}
      {parents.map((parent, i) =>
        renderOutline(parent, '1px dashed rgba(16, 185, 129, 0.8)', `parent-${i}`)
      )}

      {/* Grandparent containers - dashed purple */}
      {grandparents.map((grandparent, i) =>
        renderOutline(grandparent, '1px dashed rgba(168, 85, 247, 0.8)', `grandparent-${i}`)
      )}

      {/* Siblings - dashed light blue */}
      {siblings.map((sibling, i) =>
        renderOutline(sibling, '1px dashed rgba(147, 197, 253, 0.6)', `sibling-${i}`)
      )}

      {/* Children - dashed orange */}
      {children.map((child, i) =>
        renderOutline(child, '1px dashed rgba(249, 115, 22, 0.8)', `child-${i}`)
      )}

      {/* Deeper descendants - dashed orange with lower opacity */}
      {descendants.map((descendant, i) =>
        renderOutline(descendant, '1px dashed rgba(249, 115, 22, 0.4)', `descendant-${i}`)
      )}
    </div>
  );
}

/**
 * Hook for inline rendering (kept for compatibility)
 */
export function useContainerHoverInfo(
  elementRef: React.RefObject<HTMLElement>,
  elId: string,
  isHovered: boolean,
  builderMode: boolean
): HierarchySnapshot | null {
  const [snapshot, setSnapshot] = useState<HierarchySnapshot | null>(null);

  useEffect(() => {
    if (!isHovered || !builderMode || !elementRef.current) {
      setSnapshot(null);
      return;
    }

    // This hook is deprecated - use ContainerHoverOverlay with element data instead
    setSnapshot(null);
  }, [isHovered, builderMode, elId, elementRef]);

  return snapshot;
}

// Export for compatibility
export function detectContainerType(element: HTMLElement): 'box' | 'flex' | 'grid' {
  const computed = window.getComputedStyle(element);
  const display = computed.display;
  
  if (display === 'grid' || display === 'inline-grid') return 'grid';
  if (display === 'flex' || display === 'inline-flex') return 'flex';
  return 'box';
}
