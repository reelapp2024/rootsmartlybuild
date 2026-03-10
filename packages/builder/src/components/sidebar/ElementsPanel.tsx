import React, { useState, useEffect } from 'react';
import { getBuilderElements } from '@ui/utils/builderElementsCache';
import { getElementProperties } from '../../elementProperties';
import { 
  LayoutGrid, 
  Container, 
  Type, 
  Image, 
  Video, 
  MousePointerClick, 
  Link, 
  List, 
  Badge, 
  Minus,
  Code,
  FileText,
  Square,
  LucideIcon
} from 'lucide-react';

interface ElementsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectElement: (elementType: string, targetContainerId?: string, targetSectionId?: string) => void;
  targetContainerId?: string; // Container slot to insert into
  targetSectionId?: string; // Section containing the target container
  builderMode: boolean;
}

// Element categories with icons
const CATEGORY_ICONS: Record<string, LucideIcon> = {
  'Layout': LayoutGrid,
  'Basic': Type,
  'Media': Image,
  'Form': MousePointerClick,
  'Advanced': Code,
};

// Element type to icon mapping
const ELEMENT_ICONS: Record<string, LucideIcon> = {
  'container': Container,
  'heading': Type,
  'text': FileText,
  'button': MousePointerClick,
  'image': Image,
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

export default function ElementsPanel({
  isOpen,
  onClose,
  onSelectElement,
  targetContainerId,
  targetSectionId,
  builderMode,
}: ElementsPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [builderElements, setBuilderElements] = useState<Array<{
    _id: string;
    elementId: string;
    displayName: string;
    category: string;
  }>>([]);
  const [loading, setLoading] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['Layout', 'Basic']));

  // Load builder elements (hardcoded, instant)
  useEffect(() => {
    if (!builderMode || !isOpen) {
      setBuilderElements([]);
      return;
    }
    
    // Get hardcoded elements and filter to only show those with sidebar settings
    getBuilderElements()
      .then((elements) => {
        const supportedElements = elements.filter((el: any) => {
          return el && el.elementId && getElementProperties(el.elementId) !== null;
        });
        setBuilderElements(supportedElements);
      })
      .catch((err) => {
        console.error('[ElementsPanel] Error loading builder elements:', err);
        setBuilderElements([]);
      });
  }, [builderMode, isOpen]);

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
    onSelectElement(elementId, targetContainerId, targetSectionId);
    onClose();
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

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        right: 0,
        top: 0,
        bottom: 0,
        width: '320px',
        backgroundColor: '#1e293b', // Dark gray like Elementor
        color: '#e2e8f0',
        zIndex: 10000,
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '-2px 0 8px rgba(0,0,0,0.2)',
      }}
    >
      {/* Header */}
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
        <h2
          style={{
            fontSize: '16px',
            fontWeight: 600,
            margin: 0,
            color: '#e2e8f0',
          }}
        >
          Elements
        </h2>
        <button
          onClick={onClose}
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

      {/* Search */}
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid #334155',
          flexShrink: 0,
        }}
      >
        <input
          type="text"
          placeholder="Search Element..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            padding: '8px 12px',
            borderRadius: '6px',
            border: '1px solid #334155',
            backgroundColor: '#0f172a',
            color: '#e2e8f0',
            fontSize: '14px',
            outline: 'none',
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = '#3b82f6';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = '#334155';
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
              color: '#94a3b8',
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
              color: '#94a3b8',
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
                    color: '#e2e8f0',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    transition: 'background-color 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#334155';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <CategoryIcon size={16} />
                  <span style={{ flex: 1, textAlign: 'left' }}>{category}</span>
                  <span style={{ fontSize: '10px', color: '#94a3b8' }}>
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
                            color: '#e2e8f0',
                            cursor: 'pointer',
                            fontSize: '14px',
                            textAlign: 'left',
                            transition: 'background-color 0.2s',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#334155';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                        >
                          <ElementIcon size={18} style={{ color: '#94a3b8', flexShrink: 0 }} />
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

      {/* Footer */}
      <div
        style={{
          padding: '12px 16px',
          borderTop: '1px solid #334155',
          fontSize: '12px',
          color: '#94a3b8',
          flexShrink: 0,
        }}
      >
        {targetContainerId ? (
          <div>Inserting into container slot</div>
        ) : (
          <div>Click an element to add it</div>
        )}
      </div>
    </div>
  );
}
