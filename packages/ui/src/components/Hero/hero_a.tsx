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
  title: "Welcome to Our Service",
  description: "We provide exceptional service with dedication and expertise.",
  backgroundImage: "",
  logo: "",
};

export const template = { ...defaultProps };

// Hero A: Centered Content Hero
// Architecture: SECTION (background) → LAYOUT CONTAINER (full width) → CONTENT CONTAINER (max-width, centered) → ELEMENTS (content only)
// Two-container pattern: layout-container (full width, flex) → content-container (max-width, centered)
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
      minHeight: '500px',
      overflow: 'hidden',
      backgroundColor: 'var(--color-surface, #0E1214)',
      color: 'var(--color-heading, #F8FAFC)',
    }
  },
  {
    elId: 'layout-container',
    type: 'container',
    order: 0,
    parentElId: 'section',
    defaultProps: {},
    defaultStyle: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      zIndex: 2,
      width: '100%',
      padding: '0', // No padding - handled by content-container
      backgroundColor: 'transparent',
      minHeight: '500px',
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
      maxWidth: '1200px', // Max-width container
      margin: '0 auto', // Centered
      padding: '80px 40px', // Padding applied via container
      backgroundColor: 'transparent',
      textAlign: 'center',
    }
  },
  {
    elId: 'icon',
    type: 'icon',
    order: 0,
    parentElId: 'content-container',
    defaultProps: {
      iconClass: 'fas fa-star',
    },
    defaultStyle: {
      fontSize: '3rem',
      color: 'var(--color-accent, #F59E0B)',
      marginBottom: '24px',
    }
  },
  {
    elId: 'title',
    type: 'heading',
    order: 1,
    parentElId: 'content-container',
    defaultProps: {
      text: 'Empowering Your Business Growth',
      heading: 'Empowering Your Business Growth',
      headingTag: 'h1'
    },
    defaultStyle: {
      fontSize: '3rem',
      fontWeight: 700,
      backgroundImage: 'linear-gradient(135deg, var(--color-heading, #F8FAFC), var(--color-accent, #F59E0B), var(--color-primary-bg, #E11D48))',
      WebkitBackgroundClip: 'text',
      backgroundClip: 'text',
      color: 'transparent',
      WebkitTextFillColor: 'transparent',
      marginBottom: '24px',
      lineHeight: 1.2,
      backgroundSize: '200% 200%',
    }
  },
  {
    elId: 'text',
    type: 'text',
    order: 2,
    parentElId: 'content-container',
    defaultProps: {
      text: 'Transform your business with our innovative solutions. We deliver exceptional results that drive growth and success for your organization.'
    },
    defaultStyle: {
      fontSize: '1.25rem',
      color: 'var(--color-description, #C7CDD6)',
      marginBottom: '32px',
      lineHeight: 1.6,
    }
  },
] as const;

export const uniqueId = "hero_a";

type ApiData = {
  projectName?: string;
  image?: string;
  description?: string;
  icon?: string;
};

export default function HeroA(props: HeroSectionProps) {
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
        elId: 'icon',
        apiKey: 'icon',
        propKey: 'iconClass',
        defaultValue: 'fas fa-star',
        checkFunction: (current, apiVal, defaultVal) => {
          if (!apiVal) return false;
          if (!current || current.trim() === '') return true;
          const defaultPatterns = ['fas fa-star', 'fa-star'];
          const isDefault = defaultPatterns.some(pattern => current.includes(pattern));
          return isDefault || current === apiVal;
        }
      },
      {
        elId: 'title',
        apiKey: 'projectName',
        propKey: 'text',
        defaultValue: 'Empowering Your Business Growth',
        checkFunction: (current, apiVal, defaultVal) => {
          if (!apiVal) return false;
          if (!current || current.trim() === '') return true;
          const defaultPatterns = [
            'Empowering Your Business',
            'Empowering Your Business Growth',
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
        defaultValue: 'Empowering Your Business Growth',
        checkFunction: (current, apiVal, defaultVal) => {
          if (!apiVal) return false;
          if (!current || current.trim() === '') return true;
          const defaultPatterns = [
            'Empowering Your Business',
            'Empowering Your Business Growth',
            'Welcome to Our Service',
            'Welcome'
          ];
          const isDefault = defaultPatterns.some(pattern => current.includes(pattern));
          return isDefault || current === apiVal;
        }
      },
      {
        elId: 'text',
        apiKey: 'description',
        propKey: 'text',
        defaultValue: 'Transform your business',
        checkFunction: (current, apiVal, defaultVal) => {
          if (!apiVal) return false;
          if (!current || current.trim() === '') return true;
          const defaultPatterns = [
            'Transform your business',
            'We provide exceptional service',
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
      { elId: 'layout-container', parentElId: 'section' },
      { elId: 'content-container', parentElId: 'layout-container' }
    ],
    propResolver: (element, resolvedData) => {
      const props: any = {};
      if (element.elId === 'icon') {
        props.iconClass = resolvedData.icon || 'fas fa-star';
      } else if (element.elId === 'title' && resolvedData.title) {
        props.text = resolvedData.title;
        props.heading = resolvedData.title;
      } else if (element.elId === 'text' && resolvedData.description) {
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
  const { sectionStyle, backgroundWrapper } = useSectionStyles({
    customStyles,
    apiImage: api?.image || resolved.backgroundImage,
    defaultBackground: "var(--color-surface, #0E1214)",
    isSelected: isElSelected("section"),
    propsStyle: props.style,
    defaultMinHeight: 500
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
        // Background image settings for section
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
            opacity: 0.3, // Background image opacity
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
            opacity: 0.3,
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
            emptyMessage: '[HeroA] No elements found - initializing default structure...'
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
            'icon': (elProps, apiData, resolved) => {
              const iconClass = apiData?.icon || elProps.iconClass || 'fas fa-star';
              return { iconClass: iconClass };
            },
            'title': (elProps, apiData, resolved) => {
              const titleText = apiData?.projectName || elProps.text || resolved?.title || '';
              const titleHeading = apiData?.projectName || elProps.heading || resolved?.title || '';
              return { text: titleText, heading: titleHeading };
            },
            'text': (elProps, apiData, resolved) => {
              const textContent = apiData?.description || elProps.text || resolved?.description || '';
              return { text: textContent };
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
