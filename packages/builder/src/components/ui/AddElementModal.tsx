import React, { useState, useEffect } from 'react';
import { getBuilderElements } from '@ui/utils/builderElementsCache';
import { getElementProperties } from '../../elementProperties';

interface AddElementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectElement: (elementType: string) => void;
}

export default function AddElementModal({
  isOpen,
  onClose,
  onSelectElement,
}: AddElementModalProps) {
  const [builderElements, setBuilderElements] = useState<Array<{
    _id: string;
    elementId: string;
    displayName: string;
    category: string;
  }>>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Load builder elements (hardcoded, instant)
  useEffect(() => {
    if (!isOpen) return;
    
    // Get hardcoded elements and filter to only show those with sidebar settings
    getBuilderElements()
      .then((elements) => {
        const supportedElements = elements.filter((el: any) => {
          return el && el.elementId && getElementProperties(el.elementId) !== null;
        });
        setBuilderElements(supportedElements);
      })
      .catch((err) => {
        console.error('[AddElementModal] Error loading builder elements:', err);
        setBuilderElements([]);
      });
  }, [isOpen]);

  // Close modal on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Group elements by category
  const groupedElements: Record<string, typeof builderElements> = {};
  builderElements.forEach((el) => {
    if (!groupedElements[el.category]) {
      groupedElements[el.category] = [];
    }
    groupedElements[el.category].push(el);
  });

  // Filter elements based on search query
  const filteredGroupedElements: Record<string, typeof builderElements> = {};
  Object.entries(groupedElements).forEach(([category, elements]) => {
    const filtered = elements.filter((el) =>
      el.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      el.elementId.toLowerCase().includes(searchQuery.toLowerCase())
    );
    if (filtered.length > 0) {
      filteredGroupedElements[category] = filtered;
    }
  });

  const handleSelectElement = (elementId: string) => {
    onSelectElement(elementId);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="bg-white rounded-lg shadow-2xl"
        style={{
          width: '90%',
          maxWidth: '600px',
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <h2
            style={{
              fontSize: '20px',
              fontWeight: 600,
              color: '#111827',
            }}
          >
            Add New Element
          </h2>
          <button
            onClick={onClose}
            style={{
              padding: '4px',
              borderRadius: '4px',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f3f4f6';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <span style={{ fontSize: '20px', lineHeight: '1' }}>×</span>
          </button>
        </div>

        {/* Search Bar */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid #e5e7eb',
          }}
        >
          <input
            type="text"
            placeholder="Search elements..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: '6px',
              border: '1px solid #d1d5db',
              fontSize: '14px',
            }}
            autoFocus
          />
        </div>

        {/* Content */}
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
                padding: '40px',
                textAlign: 'center',
                color: '#6b7280',
              }}
            >
              Loading elements...
            </div>
          ) : Object.keys(filteredGroupedElements).length === 0 ? (
            <div
              style={{
                padding: '40px',
                textAlign: 'center',
                color: '#6b7280',
                fontSize: '14px',
              }}
            >
              {searchQuery ? 'No elements found matching your search.' : 'No elements configured yet.'}
            </div>
          ) : (
            Object.entries(filteredGroupedElements).map(([category, elements], categoryIdx) => (
              <div key={category}>
                {categoryIdx > 0 && (
                  <div style={{ borderTop: '1px solid #e5e7eb', marginTop: '8px', marginBottom: '8px' }} />
                )}
                <div
                  style={{
                    padding: '8px 20px',
                    fontSize: '12px',
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
                    onClick={() => handleSelectElement(element.elementId)}
                    style={{
                      padding: '12px 20px',
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
            ))
          )}
        </div>
      </div>
    </div>
  );
}

