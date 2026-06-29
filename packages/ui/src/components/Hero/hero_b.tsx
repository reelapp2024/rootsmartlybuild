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

// Default props for component
export const defaultProps = {
  title: "Welcome to Our Service",
  description: "We provide exceptional service with dedication and expertise.",
  backgroundImage: "",
  logo: "",
};

export const template = { ...defaultProps };

// Hero B: Simple Top-to-Bottom Layout
// Structure: Section → Container (flex column) → Heading → Description → Button Container → Two Buttons
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
      minHeight: '600px',
      overflow: 'hidden',
      backgroundColor: 'var(--color-surface, #0E1214)',
      color: 'var(--color-heading, #F8FAFC)',
    }
  },
  {
    elId: 'hero-container',
    type: 'container',
    order: 0,
    parentElId: 'section',
    defaultProps: {},
    defaultStyle: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'clamp(3rem, 8vw, 6rem) clamp(1.5rem, 6vw, 3rem)',
      position: 'relative',
      zIndex: 2,
      width: '100%',
      backgroundColor: 'transparent',
      minHeight: '600px',
      gap: '24px',
    }
  },
  {
    elId: 'title',
    type: 'heading',
    order: 0,
    parentElId: 'hero-container',
    defaultProps: {
      text: 'Empowering Your Business Growth',
      heading: 'Empowering Your Business Growth',
      headingTag: 'h1'
    },
    defaultStyle: {
      fontSize: 'clamp(2rem, 5vw, 3.5rem)',
      fontWeight: 700,
      color: 'var(--color-heading, #F8FAFC)',
      marginBottom: '0',
      lineHeight: 1.2,
      textAlign: 'center',
    }
  },
  {
    elId: 'description',
    type: 'text',
    order: 1,
    parentElId: 'hero-container',
    defaultProps: {
      text: 'Transform your business with our innovative solutions. We deliver exceptional results that drive growth and success.',
      description: 'Transform your business with our innovative solutions. We deliver exceptional results that drive growth and success.',
    },
    defaultStyle: {
      fontSize: '1.125rem',
      color: 'var(--color-description, #C7CDD6)',
      marginBottom: '0',
      lineHeight: 1.6,
      textAlign: 'center',
      maxWidth: '600px',
    }
  },
  {
    elId: 'buttons-container',
    type: 'container',
    order: 2,
    parentElId: 'hero-container',
    defaultProps: {},
    defaultStyle: {
      display: 'flex',
      flexDirection: 'row',
      gap: '16px',
      marginTop: '8px',
      alignItems: 'center',
      justifyContent: 'center',
      flexWrap: 'wrap',
    }
  },
  {
    elId: 'button-primary',
    type: 'button',
    order: 0,
    parentElId: 'buttons-container',
    defaultProps: {
      buttonText: 'Call Now',
      text: 'Call Now',
    },
    defaultStyle: {
      padding: '16px 32px',
      background: 'linear-gradient(135deg, var(--color-primary-bg, #E11D48), var(--color-accent, #F59E0B))',
      color: 'var(--color-primary-text, #FFFFFF)',
      border: 'none',
      borderRadius: '16px',
      cursor: 'pointer',
      fontSize: '1.125rem',
      fontWeight: 700,
      boxShadow: '0 15px 35px var(--color-shadow, rgba(0,0,0,0.35)), 0 5px 15px rgba(var(--color-primary-bg-rgb, 225, 29, 72), 0.4)',
    }
  },
  {
    elId: 'button-secondary',
    type: 'button',
    order: 1,
    parentElId: 'buttons-container',
    defaultProps: {
      buttonText: 'Get Free Estimate',
      text: 'Get Free Estimate',
    },
    defaultStyle: {
      padding: '16px 32px',
      backgroundColor: 'var(--color-secondary-bg, transparent)',
      color: 'var(--color-secondary-text, #F8FAFC)',
      border: '2px solid var(--color-secondary-border, #F43F5E)',
      borderRadius: '16px',
      cursor: 'pointer',
      fontSize: '1.125rem',
      fontWeight: 700,
      backdropFilter: 'blur(8px)',
      boxShadow: '0 15px 35px var(--color-shadow, rgba(0,0,0,0.35))',
    }
  },
] as const;

export const uniqueId = "hero_b";

type ApiData = {
  projectName?: string;
  image?: string;
  description?: string;
  icon?: string;
};

export default function HeroB(props: HeroSectionProps) {
  const { __studio, __nodeId, projectId } = props;

  // Fetch API data using reusable hook
  const { apiData: apiResponse, loading } = useComponentApiData({
    projectId,
    apiEndpoint: '/custom/v1/get_herocomponetdata',
    uniqueId: uniqueId,
    enabled: !!projectId
  });

  // Transform API response to ApiData format
  const api: ApiData | null = apiResponse ? {
    projectName: apiResponse.projectName,
    image: apiResponse.image,
    description: apiResponse.description,
    icon: apiResponse.icon || apiResponse.fas_fa_icon || 'fas fa-star'
  } : null;

  // Resolve content: API → props → defaults
  const resolved = useMemo(() => {
    const resolvedData = {
      ...defaultProps,
      ...props,
      title: api?.projectName || props.title || defaultProps.title,
      description: api?.description || props.description || defaultProps.description,
      backgroundImage: api?.image || props.backgroundImage || defaultProps.backgroundImage,
      icon: api?.icon || 'fas fa-star',
      logo: props.logo || defaultProps.logo,
    };
    return resolvedData;
  }, [api, props.title, props.description, props.backgroundImage, props.logo]);

  // Update existing elements with API data
  useElementApiUpdate({
    apiData: api || {},
    __studio,
    updateRules: [
      {
        elId: 'title',
        apiKey: 'projectName',
        propKey: 'text',
        defaultValue: 'Empowering Your Business Growth',
        checkFunction: (current, apiVal, defaultVal) => {
          if (!apiVal) return false;
          if (!current || current.trim() === '') return true;
          const defaultPatterns = ['Empowering Your Business', 'Welcome to Our Service', 'Welcome'];
          const isDefault = defaultPatterns.some(pattern => current.includes(pattern));
          return isDefault || current === apiVal;
        }
      },
      {
        elId: 'description',
        apiKey: 'description',
        propKey: 'text',
        defaultValue: 'Transform your business',
        checkFunction: (current, apiVal, defaultVal) => {
          if (!apiVal) return false;
          if (!current || current.trim() === '') return true;
          const defaultPatterns = ['Transform your business', 'We provide exceptional service'];
          const isDefault = defaultPatterns.some(pattern => current.includes(pattern));
          return isDefault || current === apiVal;
        }
      }
    ]
  });
  
  // Initialize default elements
  useElementInitialization({
    __studio,
    __nodeId,
    defaultElements: DEFAULT_ELEMENTS,
    resolvedData: resolved,
    loading,
    skipElements: ['section'],
    containerElements: [
      { elId: 'section', parentElId: undefined },
      { elId: 'hero-container', parentElId: 'section' },
      { elId: 'buttons-container', parentElId: 'hero-container' },
    ],
    propResolver: (element, resolvedData) => {
      const props: any = {};
      if (element.elId === 'title' && resolvedData.title) {
        props.text = resolvedData.title;
        props.heading = resolvedData.title;
      } else if (element.elId === 'description' && resolvedData.description) {
        props.text = resolvedData.description;
        props.description = resolvedData.description;
      }
      return props;
    }
  });

  // Get element helpers
  const { builderMode, getElStyle, getElProps, isElSelected } = useElementHelpers({
    __studio,
    __nodeId,
    fallbackValues: {
      title: resolved.title,
      description: resolved.description,
    },
    debug: typeof window !== 'undefined' && (window as any).__DEV__
  });
  
  // Get section styles
  const customElements = __studio?.getCustomElements?.() || [];
  const customStyles = getSectionStyles(customElements, getElStyle, 'section', props.style);

  // Build section styles
  const { sectionStyle } = useSectionStyles({
    customStyles,
    apiImage: api?.image,
    defaultBackground: "var(--color-surface, #0E1214)",
    isSelected: isElSelected("section"),
    propsStyle: props.style,
    defaultMinHeight: 600
  });

  return (
    <section
      data-el-id="section"
      onClick={(e) => {
        if (__nodeId && __studio?.selectElement) {
          e.preventDefault();
          e.stopPropagation();
          __studio.selectElement(__nodeId, "section", "section");
        }
      }}
      onMouseDown={(e) => {
        if (builderMode && __nodeId && __studio?.selectElement) {
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
      {/* Render elements - from DB or fallback */}
      {(() => {
        const customElements = __studio?.getCustomElements?.() || [];
        
        // If no elements in builder mode, show empty state
        if (builderMode && customElements.length === 0) {
          return renderEmptyState({
            builderMode,
            loading,
            loadingMessage: 'Loading hero data...',
            initializingMessage: 'Initializing default elements...',
            emptyMessage: '[HeroB] No elements found in custom site - elements should be loaded from DB'
          });
        }
        
        // If no elements in custom site, render fallback with default elements
        if (!builderMode && customElements.length === 0) {
          return (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 'clamp(3rem, 8vw, 6rem) clamp(1.5rem, 6vw, 3rem)',
              position: 'relative',
              zIndex: 2,
              width: '100%',
              minHeight: '600px',
              gap: '24px',
            }}>
              {/* Heading */}
              <h1 style={{
                fontSize: 'clamp(2rem, 5vw, 3.5rem)',
                fontWeight: 700,
                color: 'var(--color-heading, #F8FAFC)',
                marginBottom: '0',
                lineHeight: 1.2,
                textAlign: 'center',
              }}>
                {resolved.title}
              </h1>
              
              {/* Description */}
              <p style={{
                fontSize: '1.125rem',
                color: 'var(--color-description, #C7CDD6)',
                marginBottom: '0',
                lineHeight: 1.6,
                textAlign: 'center',
                maxWidth: '600px',
              }}>
                {resolved.description}
              </p>
              
              {/* Buttons container */}
              <div style={{
                display: 'flex',
                flexDirection: 'row',
                gap: '16px',
                marginTop: '8px',
                alignItems: 'center',
                justifyContent: 'center',
                flexWrap: 'wrap',
              }}>
                {/* Primary button */}
                <button style={{
                  padding: '16px 32px',
                  background: 'linear-gradient(135deg, var(--color-primary-bg, #E11D48), var(--color-accent, #F59E0B))',
                  color: 'var(--color-primary-text, #FFFFFF)',
                  border: 'none',
                  borderRadius: '16px',
                  cursor: 'pointer',
                  fontSize: '1.125rem',
                  fontWeight: 700,
                  boxShadow: '0 15px 35px var(--color-shadow, rgba(0,0,0,0.35)), 0 5px 15px rgba(var(--color-primary-bg-rgb, 225, 29, 72), 0.4)',
                }}>
                  Call Now
                </button>
                
                {/* Secondary button */}
                <button style={{
                  padding: '16px 32px',
                  backgroundColor: 'var(--color-secondary-bg, transparent)',
                  color: 'var(--color-secondary-text, #F8FAFC)',
                  border: '2px solid var(--color-secondary-border, #F43F5E)',
                  borderRadius: '16px',
                  cursor: 'pointer',
                  fontSize: '1.125rem',
                  fontWeight: 700,
                  backdropFilter: 'blur(8px)',
                  boxShadow: '0 15px 35px var(--color-shadow, rgba(0,0,0,0.35))',
                }}>
                  Get Free Estimate
                </button>
              </div>
            </div>
          );
        }
        
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
              const title = apiData?.projectName || elProps.text || resolved?.title || '';
              return { text: title, heading: title };
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
      
      {loading && <div style={{ color: "#fff", marginBottom: 16 }}>Loading...</div>}
      {props.children}
    </section>
  );
}

