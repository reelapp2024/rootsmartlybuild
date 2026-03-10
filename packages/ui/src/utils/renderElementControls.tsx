import React from 'react';

export interface ElementControlMenuItem {
  label?: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  separator?: boolean;
}

interface RenderElementControlsProps {
  elementIdx: number;
  sortedElements: any[];
  elId: string;
  isSelected: boolean;
  builderMode: boolean;
  onMoveUp?: (elId: string) => void;
  onMoveDown?: (elId: string) => void;
  onDelete?: (elId: string) => void;
  menuItems?: ElementControlMenuItem[];
  SelectionMenuComponent?: React.ComponentType<{ 
    items: ElementControlMenuItem[]; 
    position?: string; 
    buttonClassName?: string;
    elId?: string;
    elementType?: string;
    [key: string]: any;
  }>;
  elementType?: string;
}

/**
 * Shared component for rendering element controls (move up/down, delete)
 * Used across all builder components
 */
export function RenderElementControls({
  elementIdx,
  sortedElements,
  elId,
  isSelected,
  builderMode,
  onMoveUp,
  onMoveDown,
  onDelete,
  menuItems = [],
  SelectionMenuComponent,
  elementType
}: RenderElementControlsProps) {
  // Only show controls when element is selected
  if (!isSelected || !builderMode) return null;
  
  const canMoveUp = elementIdx > 0;
  const canMoveDown = elementIdx < sortedElements.length - 1;
  
  const handleMoveUp = React.useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!canMoveUp) return;
    // Call immediately - no debouncing
    onMoveUp?.(elId);
  }, [elId, onMoveUp, canMoveUp]);
  
  const handleMoveDown = React.useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!canMoveDown) return;
    // Call immediately - no debouncing
    onMoveDown?.(elId);
  }, [elId, onMoveDown, canMoveDown]);
  
  const handleDelete = React.useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (confirm('Delete this element?')) {
      onDelete?.(elId);
    }
  }, [elId, onDelete]);
  
  return (
    <div
      data-element-controls
      style={{
        position: 'absolute',
        top: '-32px',
        right: '0',
        display: 'flex',
        gap: '4px',
        zIndex: 1000,
        backgroundColor: 'white',
        borderRadius: '4px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        pointerEvents: 'auto', // Ensure controls are clickable
      }}
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
      }}
      onMouseDown={(e) => {
        e.stopPropagation();
        e.preventDefault();
      }}
    >
      <button
        onClick={handleMoveUp}
        onMouseDown={(e) => {
          e.stopPropagation();
          e.preventDefault();
        }}
        disabled={!canMoveUp}
        style={{
          padding: '6px',
          backgroundColor: canMoveUp ? '#3b82f6' : '#e5e7eb',
          color: 'white',
          border: 'none',
          borderRadius: '4px 0 0 4px',
          cursor: canMoveUp ? 'pointer' : 'not-allowed',
          opacity: canMoveUp ? 1 : 0.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'opacity 0.2s',
          pointerEvents: 'auto',
        }}
        title="Move Up"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M5 15l7-7 7 7" />
        </svg>
      </button>
      <button
        onClick={handleMoveDown}
        onMouseDown={(e) => {
          e.stopPropagation();
          e.preventDefault();
        }}
        disabled={!canMoveDown}
        style={{
          padding: '6px',
          backgroundColor: canMoveDown ? '#3b82f6' : '#e5e7eb',
          color: 'white',
          border: 'none',
          cursor: canMoveDown ? 'pointer' : 'not-allowed',
          opacity: canMoveDown ? 1 : 0.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'opacity 0.2s',
          pointerEvents: 'auto',
        }}
        title="Move Down"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <button
        onClick={handleDelete}
        onMouseDown={(e) => {
          e.stopPropagation();
          e.preventDefault();
        }}
        style={{
          padding: '6px',
          backgroundColor: '#ef4444',
          color: 'white',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'auto',
        }}
        title="Delete Element"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
        </svg>
      </button>
      {SelectionMenuComponent && menuItems.length > 0 && (
        <SelectionMenuComponent
          items={menuItems}
          position="bottom-right"
          buttonClassName="rounded-r"
          elId={elId}
          elementType={elementType}
        />
      )}
    </div>
  );
}

