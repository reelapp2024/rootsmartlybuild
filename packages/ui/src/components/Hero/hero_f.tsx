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
  title: "Transform Your Vision Into Reality",
  description: "We deliver exceptional results that drive growth and success for your business.",
  backgroundImage: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1920&h=1080&fit=crop",
  logo: "",
};

export const template = { ...defaultProps };

// Hero F: Cinematic Background-Image Hero with Dark Overlay
// Architecture: SECTION (background, overlay) → LAYOUT CONTAINER (full width) → CONTENT CONTAINER (max-width, centered) → ELEMENTS (content only)
// Two-container pattern: layout-container (full width, flex/grid) → content-container (max-width, centered)
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
      minHeight: '90vh', // 80-100vh range
      overflow: 'hidden',
      backgroundColor: 'var(--color-surface, #0E1214)',
      color: 'var(--color-heading, #F8FAFC)',
    }
  },
  {
    elId: 'overlay-layer',
    type: 'container',
    order: 0,
    parentElId: 'section',
    defaultProps: {},
    defaultStyle: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.6)', // Configurable overlay opacity (default 0.6, editable via backgroundColor)
      zIndex: 1,
      pointerEvents: 'none', // Allow clicks to pass through to section
    }
  },
  {
    elId: 'layout-container',
    type: 'container',
    order: 1,
    parentElId: 'section',
    defaultProps: {},
    defaultStyle: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      zIndex: 2,
      width: '100%', // Full width
      minHeight: '90vh',
      padding: '0', // No padding - handled by content-container
    }
  },
  {
    elId: 'content-container',
    type: 'container',
    order: 0,
    parentElId: 'layout-container',
    defaultProps: {},
    defaultStyle: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      maxWidth: '1200px', // Max-width container (1100-1200px range)
      margin: '0 auto', // Centered
      padding: '120px 40px', // Padding applied via container
      textAlign: 'center',
      backgroundColor: 'transparent',
    }
  },
  {
    elId: 'title',
    type: 'heading',
    order: 0,
    parentElId: 'content-container',
    defaultProps: {
      text: 'Transform Your Vision Into Reality',
      heading: 'Transform Your Vision Into Reality',
      headingTag: 'h1'
    },
    defaultStyle: {
      fontSize: '4rem',
      fontWeight: 800,
      color: 'var(--color-heading, #FFFFFF)', // White for contrast
      marginBottom: '24px',
      lineHeight: 1.2,
      textShadow: '0 4px 20px rgba(0, 0, 0, 0.5)', // Strong contrast
      letterSpacing: '-0.02em',
    }
  },
  {
    elId: 'description',
    type: 'text',
    order: 1,
    parentElId: 'content-container',
    defaultProps: {
      text: 'We deliver exceptional results that drive growth and success for your business.',
    },
    defaultStyle: {
      fontSize: '1.375rem',
      color: 'var(--color-description, #E2E8F0)', // Lighter text color
      lineHeight: 1.7,
      marginBottom: '40px',
      textShadow: '0 2px 10px rgba(0, 0, 0, 0.3)',
    }
  },
  {
    elId: 'buttons-container',
    type: 'container',
    order: 2,
    parentElId: 'content-container',
    defaultProps: {},
    defaultStyle: {
      display: 'flex',
      flexDirection: 'row',
      gap: '20px',
      flexWrap: 'wrap',
      justifyContent: 'center',
      alignItems: 'center',
    }
  },
  {
    elId: 'button-primary',
    type: 'button',
    order: 0,
    parentElId: 'buttons-container',
    defaultProps: {
      buttonText: 'Get Started',
      text: 'Get Started',
    },
    defaultStyle: {
      padding: '20px 40px',
      backgroundColor: 'var(--color-primary-bg, #E11D48)',
      color: 'var(--color-primary-text, #FFFFFF)',
      border: 'none',
      borderRadius: '12px',
      cursor: 'pointer',
      fontSize: '1.125rem',
      fontWeight: 700,
      boxShadow: '0 15px 35px rgba(0, 0, 0, 0.4)',
      transition: 'all 0.3s ease',
    }
  },
  {
    elId: 'button-secondary',
    type: 'button',
    order: 1,
    parentElId: 'buttons-container',
    defaultProps: {
      buttonText: 'Learn More',
      text: 'Learn More',
    },
    defaultStyle: {
      padding: '20px 40px',
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      color: 'var(--color-secondary-text, #FFFFFF)',
      border: '2px solid rgba(255, 255, 255, 0.3)',
      borderRadius: '12px',
      cursor: 'pointer',
      fontSize: '1.125rem',
      fontWeight: 700,
      backdropFilter: 'blur(10px)',
      transition: 'all 0.3s ease',
    }
  },
] as const;

export const uniqueId = "hero_f";

type ApiData = {
  projectName?: string;
  image?: string;
  description?: string;
  icon?: string;
};

export default function HeroF(props: HeroSectionProps) {
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
        elId: 'title',
        apiKey: 'projectName',
        propKey: 'text',
        defaultValue: 'Transform Your Vision Into Reality',
        checkFunction: (current, apiVal, defaultVal) => {
          if (!apiVal) return false;
          if (!current || current.trim() === '') return true;
          const defaultPatterns = [
            'Transform Your Vision',
            'Transform Your Vision Into Reality',
            'Welcome to Our Service',
            'Welcome'
          ];
          const isDefault = defaultPatterns.some(pattern => current.includes(pattern));
          return isDefault || current === apiVal;
        }
      },
      {
        elId: 'title',
        apiKey: 'projectName',
        propKey: 'heading',
        defaultValue: 'Transform Your Vision Into Reality',
        checkFunction: (current, apiVal, defaultVal) => {
          if (!apiVal) return false;
          if (!current || current.trim() === '') return true;
          const defaultPatterns = [
            'Transform Your Vision',
            'Transform Your Vision Into Reality',
            'Welcome to Our Service',
            'Welcome'
          ];
          const isDefault = defaultPatterns.some(pattern => current.includes(pattern));
          return isDefault || current === apiVal;
        }
      },
      {
        elId: 'description',
        apiKey: 'description',
        propKey: 'text',
        defaultValue: 'We deliver exceptional results',
        checkFunction: (current, apiVal, defaultVal) => {
          if (!apiVal) return false;
          if (!current || current.trim() === '') return true;
          const defaultPatterns = [
            'We deliver exceptional results',
            'Transform your business',
            'exceptional service with dedication'
          ];
          const isDefault = defaultPatterns.some(pattern => current.includes(pattern));
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
      { elId: 'overlay-layer', parentElId: 'section' },
      { elId: 'layout-container', parentElId: 'section' },
      { elId: 'content-container', parentElId: 'layout-container' },
      { elId: 'buttons-container', parentElId: 'content-container' }
    ],
    propResolver: (element, resolvedData) => {
      const props: any = {};
      if (element.elId === 'title' && resolvedData.title) {
        props.text = resolvedData.title;
        props.heading = resolvedData.title;
      } else if (element.elId === 'description' && resolvedData.description) {
        props.text = resolvedData.description;
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

  // Section background image handled via useSectionStyles
  // Supports background-size: cover, background-position: center automatically
  const { sectionStyle, backgroundWrapper } = useSectionStyles({
    customStyles,
    apiImage: api?.image || resolved.backgroundImage, // Background image from API or props
    defaultBackground: "var(--color-surface, #0E1214)",
    isSelected: isElSelected("section"),
    propsStyle: props.style,
    defaultMinHeight: 90
  });

  // Handle section click - only select section if clicking directly on section (not children)
  const handleSectionClick = (e: React.MouseEvent<HTMLElement>) => {
    // Only select section if clicking directly on section element (not children)
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
        // Only handle if clicking directly on section
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
        // Ensure background image settings for section
        backgroundSize: sectionStyle.background && sectionStyle.background.toString().startsWith('url(') ? 'cover' : undefined,
        backgroundPosition: sectionStyle.background && sectionStyle.background.toString().startsWith('url(') ? 'center' : undefined,
        backgroundRepeat: sectionStyle.background && sectionStyle.background.toString().startsWith('url(') ? 'no-repeat' : undefined,
      }}
    >
      {/* Background image layer - handled by useSectionStyles */}
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
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
        />
      )}
      
      {/* Fallback: If no backgroundWrapper but sectionStyle has background image */}
      {!backgroundWrapper && sectionStyle.background && sectionStyle.background.toString().startsWith('url(') && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: sectionStyle.background,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
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
            emptyMessage: '[HeroF] No elements found - initializing default structure...'
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
            'title': (elProps, apiData, resolved) => {
              const titleText = apiData?.projectName || elProps.text || resolved?.title || '';
              const titleHeading = apiData?.projectName || elProps.heading || resolved?.title || '';
              return { text: titleText, heading: titleHeading };
            },
            'description': (elProps, apiData, resolved) => {
              const textContent = apiData?.description || elProps.text || resolved?.description || '';
              return { text: textContent, description: textContent };
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
