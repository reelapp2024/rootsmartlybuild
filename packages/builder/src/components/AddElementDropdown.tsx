import React, { useState, useEffect, useRef } from 'react';
import { getBuilderElements } from '@ui/utils/builderElementsCache';
import { getElementProperties } from '../elementProperties';

interface AddElementDropdownProps {
  sectionId: string;
  onAddElement: (elementType: string, elId?: string) => void;
  builderMode: boolean;
}

export default function AddElementDropdown({
  sectionId,
  onAddElement,
  builderMode,
}: AddElementDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [builderElements, setBuilderElements] = useState<Array<{
    _id: string;
    elementId: string;
    displayName: string;
    category: string;
  }>>([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load builder elements (hardcoded, instant)
  useEffect(() => {
    if (!builderMode) return;
    
    // Get hardcoded elements and filter to only show those with sidebar settings
    getBuilderElements()
      .then((elements) => {
        const supportedElements = elements.filter((el: any) => {
          return el && el.elementId && getElementProperties(el.elementId) !== null;
        });
        setBuilderElements(supportedElements);
      })
      .catch((err) => {
        console.error('[AddElementDropdown] Error loading builder elements:', err);
        setBuilderElements([]);
      });
  }, [builderMode]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  if (!builderMode) return null;

  // Group elements by category
  const groupedElements: Record<string, typeof builderElements> = {};
  builderElements.forEach((el) => {
    if (!groupedElements[el.category]) {
      groupedElements[el.category] = [];
    }
    groupedElements[el.category].push(el);
  });

  const handleAddElement = (elementId: string) => {
    // Call onAddElement with just elementType - createElementByType will generate elementId
    onAddElement(elementId);
    setIsOpen(false);
  };

  return (
    <div
      ref={dropdownRef}
      style={{
        position: 'relative',
        display: 'inline-block',
      }}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 12px',
          borderRadius: '6px',
          border: '1px solid #d1d5db',
          background: '#ffffff',
          color: '#374151',
          fontWeight: 500,
          fontSize: '14px',
          cursor: 'pointer',
          transition: 'all 0.2s',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = '#f9fafb';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = '#ffffff';
        }}
      >
        <span>➕</span>
        <span>Add Element</span>
        <span style={{ fontSize: '10px' }}>▼</span>
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            marginTop: '4px',
            minWidth: '200px',
            maxWidth: '300px',
            maxHeight: '400px',
            overflowY: 'auto',
            background: '#ffffff',
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 10000,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {loading ? (
            <div style={{ padding: '16px', textAlign: 'center', color: '#6b7280' }}>
              Loading...
            </div>
          ) : builderElements.length === 0 ? (
            <div style={{ padding: '16px', textAlign: 'center', color: '#6b7280', fontSize: '14px' }}>
              No elements configured yet
            </div>
          ) : (
            <>
              <div
                style={{
                  padding: '8px 12px',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#6b7280',
                  borderBottom: '1px solid #e5e7eb',
                  backgroundColor: '#f9fafb',
                }}
              >
                Add Element
              </div>
              {Object.entries(groupedElements).map(([category, elements], categoryIdx) => (
                <div key={category}>
                  {categoryIdx > 0 && (
                    <div style={{ borderTop: '1px solid #e5e7eb', marginTop: '4px' }} />
                  )}
                  <div
                    style={{
                      padding: '6px 12px',
                      fontSize: '11px',
                      fontWeight: 600,
                      color: '#6b7280',
                      textTransform: 'uppercase',
                      backgroundColor: '#f9fafb',
                    }}
                  >
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </div>
                  {elements.map((element) => (
                    <div
                      key={element._id}
                      onClick={() => handleAddElement(element.elementId)}
                      style={{
                        padding: '10px 12px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        color: '#374151',
                        transition: 'background-color 0.15s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f3f4f6';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      {element.displayName}
                    </div>
                  ))}
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

