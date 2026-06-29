'use client';

import React, { useMemo } from "react";
import { useComponentApiData } from "../../utils/apiHelpers";
import { useElementInitialization, useElementApiUpdate, useElementHelpers } from "../../utils/componentHelpers";
import { useSectionStyles } from "../../utils/sectionStyles";
import { renderRootElements } from "../../utils/elementRendering";
import { renderEmptyState, getSectionStyles } from "../../utils/componentRendering";
import type { DefaultElement } from "../../utils/componentHelpers";

export type HeroSectionProps = {
  projectId?: string;
  title?: string;
  description?: string;
  backgroundImage?: string;
  logo?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
  __studio?: {
    selectedEl?: { nodeId: string; elId: string } | null;
    selectElement?: (nodeId: string, elId: string, type: string) => void;
    getElementStyle?: (elId: string) => React.CSSProperties;
    getElementProps?: (elId: string) => any;
    addCustomElement?: (elementType: string, elId: string, addAtFirst?: boolean, parentElId?: string) => void;
    removeCustomElement?: (elId: string) => void;
    moveCustomElement?: (elId: string, direction: 'up' | 'down') => void;
    duplicateCustomElement?: (elId: string) => void;
    getCustomElements?: () => Array<{ id: string; type: string; elId: string; order: number }>;
    updateCustomElementProps?: (elId: string, props: any) => void;
    updateCustomElementStyle?: (elId: string, style: React.CSSProperties) => void;
    onElementContextMenu?: (e: React.MouseEvent, elId: string, elementType: string) => void;
  };
  __nodeId?: string;
};

export const defaultProps = {
  title: "LUXE is here to be your assistance",
  description: "I am here ready to help you in making creative digital products",
  backgroundImage: "",
  logo: "",
};

export const template = { ...defaultProps };

// Hero H: Modern Premium Hero with Two-Column Grid Layout
// Architecture: SECTION (background) → LAYOUT CONTAINER (full width, grid) → CONTENT CONTAINER (left column) + IMAGE CONTAINER (right column) → ELEMENTS
// Two-container pattern: layout-container (full width, grid) → content-container (max-width constraint removed, grid item)
const DEFAULT_ELEMENTS: DefaultElement[] = [
  {
    elId: 'section',
    type: 'container',
    order: 0,
    parentElId: undefined,
    defaultProps: {},
    defaultStyle: {
      position: 'relative',
      width: '100%',
      minHeight: '100vh',
      overflow: 'hidden',
      backgroundColor: 'var(--color-surface, #FFFFFF)',
      background: 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 50%, #F0F4F8 100%)',
      color: 'var(--color-heading, #1F2937)',
    }
  },
  {
    elId: 'layout-container',
    type: 'container',
    order: 0,
    parentElId: 'section',
    defaultProps: {},
    defaultStyle: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '80px',
      alignItems: 'center',
      padding: '120px 0', // Vertical padding only - full width
      position: 'relative',
      zIndex: 2,
      width: '100%',
      backgroundColor: 'transparent',
      minHeight: '100vh',
    }
  },
  {
    elId: 'content-column',
    type: 'container',
    order: 0,
    parentElId: 'layout-container',
    defaultProps: {},
    defaultStyle: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      justifyContent: 'center',
      gap: '32px',
      paddingLeft: '40px',
      paddingRight: '40px',
    }
  },
  {
    elId: 'greeting',
    type: 'text',
    order: 0,
    parentElId: 'content-column',
    defaultProps: {
      text: 'Hi, there!',
    },
    defaultStyle: {
      color: 'var(--color-description, #6B7280)',
      lineHeight: 1.5,
      marginBottom: '0',
      fontWeight: 500,
      letterSpacing: '0.05em',
      textTransform: 'uppercase',
      fontSize: '0.875rem',
    }
  },
  {
    elId: 'title-container',
    type: 'container',
    order: 1,
    parentElId: 'content-column',
    defaultProps: {},
    defaultStyle: {
      display: 'flex',
      flexDirection: 'row',
      gap: '12px',
      flexWrap: 'wrap',
      alignItems: 'baseline',
      marginBottom: '0',
    }
  },
  {
    elId: 'title-brand',
    type: 'heading',
    order: 0,
    parentElId: 'title-container',
    defaultProps: {
      text: 'LUXE',
      heading: 'LUXE',
      headingTag: 'h1'
    },
    defaultStyle: {
      fontWeight: 800,
      color: 'var(--color-primary-bg, #EC4899)',
      marginBottom: '0',
      lineHeight: 1.1,
      letterSpacing: '-0.03em',
      fontSize: '4rem',
    }
  },
  {
    elId: 'title-rest',
    type: 'heading',
    order: 1,
    parentElId: 'title-container',
    defaultProps: {
      text: 'is here to be your assistance',
      heading: 'is here to be your assistance',
      headingTag: 'h1'
    },
    defaultStyle: {
      fontWeight: 800,
      color: 'var(--color-heading, #1F2937)',
      marginBottom: '0',
      lineHeight: 1.1,
      letterSpacing: '-0.03em',
      fontSize: '4rem',
    }
  },
  {
    elId: 'description',
    type: 'text',
    order: 2,
    parentElId: 'content-column',
    defaultProps: {
      text: 'I am here ready to help you in making creative digital products',
    },
    defaultStyle: {
      fontSize: '1.25rem',
      color: 'var(--color-description, #6B7280)',
      lineHeight: 1.7,
      marginBottom: '0',
    }
  },
  {
    elId: 'buttons-container',
    type: 'container',
    order: 3,
    parentElId: 'content-column',
    defaultProps: {},
    defaultStyle: {
      display: 'flex',
      flexDirection: 'row',
      gap: '16px',
      marginTop: '8px',
      flexWrap: 'wrap',
    }
  },
  {
    elId: 'button-primary',
    type: 'button',
    order: 0,
    parentElId: 'buttons-container',
    defaultProps: {
      buttonText: "Let's Discuss",
      text: "Let's Discuss",
    },
    defaultStyle: {
      padding: '18px 36px',
      backgroundColor: 'var(--color-primary-bg, #EC4899)',
      color: 'var(--color-primary-text, #FFFFFF)',
      borderRadius: '9999px',
      fontSize: '1.125rem',
      marginTop: '8px',
      boxShadow: '0 8px 24px rgba(236, 72, 153, 0.3)',
      transition: 'all 0.3s ease',
      fontWeight: 600,
    }
  },
  {
    elId: 'image-column',
    type: 'container',
    order: 1,
    parentElId: 'layout-container',
    defaultProps: {},
    defaultStyle: {
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      height: '600px',
      paddingLeft: '40px',
      paddingRight: '40px',
    }
  },
  {
    elId: 'blob-shape',
    type: 'container',
    order: 0,
    parentElId: 'image-column',
    defaultProps: {},
    defaultStyle: {
      width: '500px',
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      height: '500px',
      borderRadius: '40% 60% 70% 30% / 40% 50% 60% 50%',
      background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.1) 0%, rgba(168, 85, 247, 0.1) 50%, rgba(59, 130, 246, 0.1) 100%)',
      zIndex: 0,
      animation: 'blob 20s infinite',
      filter: 'blur(40px)',
    }
  },
  {
    elId: 'hero-image',
    type: 'image',
    order: 1,
    parentElId: 'image-column',
    defaultProps: {
      imageUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&h=800&fit=crop',
      imageAlt: 'Hero Image'
    },
    defaultStyle: {
      maxWidth: '500px',
      height: '100%',
      borderRadius: '32px',
      width: '100%',
      maxHeight: '600px',
      objectFit: 'cover',
      position: 'relative',
      zIndex: 1,
      boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
    }
  },
  {
    elId: 'stat-card-1',
    type: 'container',
    order: 2,
    parentElId: 'image-column',
    defaultProps: {},
    defaultStyle: {
      display: 'flex',
      flexDirection: 'row',
      padding: '20px 24px',
      backgroundColor: 'var(--color-surface, #FFFFFF)',
      position: 'absolute',
      top: '40px',
      right: '-20px',
      borderRadius: '20px',
      boxShadow: '0 10px 40px rgba(0, 0, 0, 0.12)',
      zIndex: 10,
      alignItems: 'center',
      minWidth: '180px',
      border: '1px solid rgba(0, 0, 0, 0.05)',
      gap: '12px',
    }
  },
  {
    elId: 'stat-1-icon',
    type: 'icon',
    order: 0,
    parentElId: 'stat-card-1',
    defaultProps: {
      iconClass: 'fas fa-project-diagram'
    },
    defaultStyle: {
      fontSize: '1.75rem',
      color: 'var(--color-primary-bg, #EC4899)',
    }
  },
  {
    elId: 'stat-1-text',
    type: 'text',
    order: 1,
    parentElId: 'stat-card-1',
    defaultProps: {
      text: '2K+ Projects',
    },
    defaultStyle: {
      color: 'var(--color-heading, #1F2937)',
      fontWeight: 700,
      marginBottom: '0',
      fontSize: '1rem',
    }
  },
  {
    elId: 'stat-card-2',
    type: 'container',
    order: 3,
    parentElId: 'image-column',
    defaultProps: {},
    defaultStyle: {
      display: 'flex',
      flexDirection: 'row',
      padding: '20px 24px',
      backgroundColor: 'var(--color-surface, #FFFFFF)',
      position: 'absolute',
      bottom: '80px',
      left: '-20px',
      borderRadius: '20px',
      boxShadow: '0 10px 40px rgba(0, 0, 0, 0.12)',
      zIndex: 10,
      alignItems: 'center',
      minWidth: '180px',
      border: '1px solid rgba(0, 0, 0, 0.05)',
      gap: '12px',
    }
  },
  {
    elId: 'stat-2-icon',
    type: 'icon',
    order: 0,
    parentElId: 'stat-card-2',
    defaultProps: {
      iconClass: 'fas fa-star'
    },
    defaultStyle: {
      fontSize: '1.75rem',
      color: 'var(--color-accent, #FBBF24)',
    }
  },
  {
    elId: 'stat-2-text',
    type: 'text',
    order: 1,
    parentElId: 'stat-card-2',
    defaultProps: {
      text: '4.8 Satisfaction',
    },
    defaultStyle: {
      color: 'var(--color-heading, #1F2937)',
      fontWeight: 700,
      marginBottom: '0',
      fontSize: '1rem',
    }
  },
  {
    elId: 'stat-card-3',
    type: 'container',
    order: 4,
    parentElId: 'image-column',
    defaultProps: {},
    defaultStyle: {
      display: 'flex',
      flexDirection: 'row',
      padding: '20px 24px',
      backgroundColor: 'var(--color-surface, #FFFFFF)',
      position: 'absolute',
      top: '200px',
      left: '20px',
      borderRadius: '20px',
      boxShadow: '0 10px 40px rgba(0, 0, 0, 0.12)',
      zIndex: 10,
      alignItems: 'center',
      minWidth: '220px',
      border: '1px solid rgba(0, 0, 0, 0.05)',
      gap: '12px',
    }
  },
  {
    elId: 'stat-3-icon',
    type: 'icon',
    order: 0,
    parentElId: 'stat-card-3',
    defaultProps: {
      iconClass: 'fas fa-user-tie'
    },
    defaultStyle: {
      fontSize: '1.75rem',
      color: 'var(--color-primary-bg, #EC4899)',
    }
  },
  {
    elId: 'stat-3-text',
    type: 'text',
    order: 1,
    parentElId: 'stat-card-3',
    defaultProps: {
      text: 'Product Designer – 5 Years',
    },
    defaultStyle: {
      color: 'var(--color-heading, #1F2937)',
      fontWeight: 700,
      marginBottom: '0',
      fontSize: '1rem',
    }
  },
] as const;

export const uniqueId = "hero_h";

type ApiData = {
  projectName?: string;
  image?: string;
  description?: string;
  icon?: string;
};

export default function HeroH(props: HeroSectionProps) {
  const { __studio, __nodeId, projectId } = props;

  const { apiData: apiResponse, loading } = useComponentApiData({
    projectId,
    apiEndpoint: '/custom/v1/get_herocomponetdata',
    uniqueId: uniqueId,
    enabled: !!projectId
  });

  const api: ApiData | null = apiResponse ? {
    projectName: apiResponse.projectName,
    image: apiResponse.image,
    description: apiResponse.description,
    icon: apiResponse.icon || apiResponse.fas_fa_icon || 'fas fa-star'
  } : null;

  const resolved = useMemo(() => {
    return {
      ...defaultProps,
      ...props,
      title: api?.projectName || props.title || defaultProps.title,
      description: api?.description || props.description || defaultProps.description,
      backgroundImage: api?.image || props.backgroundImage || defaultProps.backgroundImage,
      icon: api?.icon || 'fas fa-star',
      logo: props.logo || defaultProps.logo,
    };
  }, [api, props.title, props.description, props.backgroundImage, props.logo]);

  useElementApiUpdate({
    apiData: api || {},
    __studio,
    updateRules: [
      {
        elId: 'title-brand',
        apiKey: 'projectName',
        propKey: 'text',
        defaultValue: 'LUXE',
        checkFunction: (current, apiVal, defaultVal) => {
          if (!apiVal) return false;
          if (!current || current.trim() === '') return true;
          const defaultPatterns = ['LUXE', 'Welcome', 'Hi'];
          const isDefault = defaultPatterns.some(pattern => current.includes(pattern));
          return isDefault || current === apiVal;
        }
      },
      {
        elId: 'title-brand',
        apiKey: 'projectName',
        propKey: 'heading',
        defaultValue: 'LUXE',
        checkFunction: (current, apiVal, defaultVal) => {
          if (!apiVal) return false;
          if (!current || current.trim() === '') return true;
          const defaultPatterns = ['LUXE', 'Welcome', 'Hi'];
          const isDefault = defaultPatterns.some(pattern => current.includes(pattern));
          return isDefault || current === apiVal;
        }
      },
      {
        elId: 'description',
        apiKey: 'description',
        propKey: 'text',
        defaultValue: 'I am here ready to help you',
        checkFunction: (current, apiVal, defaultVal) => {
          if (!apiVal) return false;
          if (!current || current.trim() === '') return true;
          const defaultPatterns = ['I am here ready', 'creative digital products', 'help you'];
          const isDefault = defaultPatterns.some(pattern => current.includes(pattern));
          return isDefault || current === apiVal;
        }
      },
      {
        elId: 'hero-image',
        apiKey: 'image',
        propKey: 'imageUrl',
        defaultValue: 'unsplash.com',
        checkFunction: (current, apiVal, defaultVal) => {
          if (!apiVal) return false;
          if (!current || current.trim() === '') return true;
          const isDefault = current.includes('unsplash.com') || current.includes('placeholder');
          return isDefault || current === apiVal;
        }
      }
    ]
  });
  
  useElementInitialization({
    __studio,
    __nodeId,
    defaultElements: DEFAULT_ELEMENTS,
    resolvedData: resolved,
    loading,
    skipElements: ['section'],
    containerElements: [
      { elId: 'section', parentElId: undefined },
      { elId: 'layout-container', parentElId: 'section' },
      { elId: 'content-column', parentElId: 'layout-container' },
      { elId: 'title-container', parentElId: 'content-column' },
      { elId: 'buttons-container', parentElId: 'content-column' },
      { elId: 'image-column', parentElId: 'layout-container' },
      { elId: 'stat-card-1', parentElId: 'image-column' },
      { elId: 'stat-card-2', parentElId: 'image-column' },
      { elId: 'stat-card-3', parentElId: 'image-column' },
    ],
    propResolver: (element, resolvedData) => {
      const props: any = {};
      if (element.elId === 'title-brand' && resolvedData.title) {
        const brandName = resolvedData.title.split(' ')[0] || 'LUXE';
        props.text = brandName;
        props.heading = brandName;
      } else if (element.elId === 'title-rest' && resolvedData.title) {
        const parts = resolvedData.title.split(' ');
        const rest = parts.length > 1 ? parts.slice(1).join(' ') : 'is here to be your assistance';
        props.text = rest;
        props.heading = rest;
      } else if (element.elId === 'description' && resolvedData.description) {
        props.text = resolvedData.description;
      } else if (element.elId === 'hero-image' && resolvedData.backgroundImage) {
        props.imageUrl = resolvedData.backgroundImage;
      }
      return props;
    }
  });

  const { builderMode, getElStyle, getElProps, isElSelected } = useElementHelpers({
    __studio,
    __nodeId,
    fallbackValues: {
      title: resolved.title,
      description: resolved.description,
    },
    debug: typeof window !== 'undefined' && (window as any).__DEV__
  });

  const customElements = __studio?.getCustomElements?.() || [];
  const customStyles = getSectionStyles(customElements, getElStyle, 'section', props.style);

  const { sectionStyle, backgroundWrapper } = useSectionStyles({
    customStyles,
    apiImage: api?.image,
    defaultBackground: "linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 50%, #F0F4F8 100%)",
    isSelected: isElSelected("section"),
    propsStyle: props.style,
    defaultMinHeight: 100
  });

  // Handle section click - only select section if clicking directly on section (not children)
  const handleSectionClick = (e: React.MouseEvent<HTMLElement>) => {
    if (e.target === e.currentTarget && __nodeId && __studio?.selectElement) {
      e.preventDefault();
      e.stopPropagation();
      __studio.selectElement(__nodeId, "section", "section");
    }
  };

  return (
    <section
      data-el-id="section"
      onClick={handleSectionClick}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && builderMode && __nodeId && __studio?.selectElement) {
          e.preventDefault();
          e.stopPropagation();
          __studio.selectElement(__nodeId, "section", "section");
        }
      }}
      onContextMenu={(e) => {
        if (builderMode && __nodeId && __studio?.onElementContextMenu) {
          __studio.onElementContextMenu(e, "section", "section");
        }
      }}
      style={{
        ...sectionStyle,
        cursor: builderMode ? 'pointer' : undefined,
        transition: 'outline 0.15s ease-in-out',
        outlineOffset: isElSelected("section") ? "2px" : undefined,
      }}
    >
      {backgroundWrapper && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            ...backgroundWrapper,
            zIndex: 0,
            pointerEvents: 'none',
          }}
        />
      )}
      
      {/* Content - rendered via builder system only, no static fallbacks */}
      {(() => {
        const customElements = __studio?.getCustomElements?.() || [];
        
        if (builderMode && customElements.length === 0) {
          return renderEmptyState({
            builderMode,
            loading,
            loadingMessage: 'Loading hero data...',
            initializingMessage: 'Initializing default elements...',
            emptyMessage: '[HeroH] No elements found - initializing default structure...'
          });
        }
        
        // Always use renderRootElements - no static JSX fallbacks
        const sortedElements = [...customElements].sort((a, b) => (a.order || 0) - (b.order || 0));
        
        return renderRootElements({
          sortedElements,
          getElProps,
          getElStyle,
          isElSelected,
          builderMode,
          __nodeId,
          __studio,
          fallbackValues: {
            title: resolved.title,
            description: resolved.description,
          },
          propResolvers: {
            'title-brand': (elProps, apiData, resolved) => {
              const brandName = apiData?.projectName?.split(' ')[0] || elProps.text || resolved?.title?.split(' ')[0] || 'LUXE';
              return { text: brandName, heading: brandName };
            },
            'title-rest': (elProps, apiData, resolved) => {
              const fullTitle = apiData?.projectName || elProps.text || resolved?.title || 'LUXE is here to be your assistance';
              const parts = fullTitle.split(' ');
              const rest = parts.length > 1 ? parts.slice(1).join(' ') : 'is here to be your assistance';
              return { text: rest, heading: rest };
            },
            'description': (elProps, apiData, resolved) => {
              const textContent = apiData?.description || elProps.text || resolved?.description || '';
              return { text: textContent, description: textContent };
            },
            'hero-image': (elProps, apiData, resolved) => {
              const imageUrl = apiData?.image || elProps.imageUrl || resolved?.backgroundImage || '';
              return { imageUrl: imageUrl };
            },
          },
          apiData: api,
          resolved
        });
      })()}
      
      {loading && <div style={{ color: "#fff", marginBottom: 16, position: 'relative', zIndex: 3 }}>Loading...</div>}
      {props.children}
    </section>
  );
}
