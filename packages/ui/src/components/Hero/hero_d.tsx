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

// Hero D: Professional Split-Screen Layout
// Structure: Section → (main-container [grid] → content-column [flex] → badge, title, description, buttons-container [flex] → buttons, image-column → hero-image)
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
    elId: 'main-container',
    type: 'container',
    order: 0,
    parentElId: 'section',
    defaultProps: {},
    defaultStyle: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '80px',
      alignItems: 'center',
      padding: '100px 0', // No side padding - full width
      position: 'relative',
      zIndex: 2,
      width: '100%',
      width: '100%', // Full width - no maxWidth or margin auto
      backgroundColor: 'transparent',
      minHeight: '600px',
    }
  },
  {
    elId: 'content-column',
    type: 'container',
    order: 0,
    parentElId: 'main-container',
    defaultProps: {},
    defaultStyle: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      justifyContent: 'center',
      gap: '32px',
    }
  },
  {
    elId: 'badge',
    type: 'badge',
    order: 0,
    parentElId: 'content-column',
    defaultProps: {
      text: 'Professional Service',
    },
    defaultStyle: {
      padding: '10px 24px',
      backgroundColor: 'rgba(var(--color-primary-bg-rgb, 225, 29, 72), 0.15)',
      color: 'var(--color-primary-bg, #E11D48)',
      border: '1px solid rgba(var(--color-primary-bg-rgb, 225, 29, 72), 0.3)',
      borderRadius: '9999px',
      fontSize: '0.875rem',
      fontWeight: 600,
      marginBottom: '0',
    }
  },
  {
    elId: 'title',
    type: 'heading',
    order: 1,
    parentElId: 'content-column',
    defaultProps: {
      text: 'Empowering Your Business Growth',
      heading: 'Empowering Your Business Growth',
      headingTag: 'h1'
    },
    defaultStyle: {
      fontSize: '3.5rem',
      fontWeight: 800,
      backgroundImage: 'linear-gradient(135deg, var(--color-heading, #F8FAFC), var(--color-accent, #F59E0B))',
      WebkitBackgroundClip: 'text',
      backgroundClip: 'text',
      color: 'transparent',
      WebkitTextFillColor: 'transparent',
      marginBottom: '0',
      lineHeight: 1.1,
      letterSpacing: '-0.02em',
    }
  },
  {
    elId: 'description',
    type: 'text',
    order: 2,
    parentElId: 'content-column',
    defaultProps: {
      text: 'Transform your business with our innovative solutions. We deliver exceptional results that drive growth and success for your organization.',
      description: 'Transform your business with our innovative solutions. We deliver exceptional results that drive growth and success for your organization.',
    },
    defaultStyle: {
      fontSize: '1.25rem',
      color: 'var(--color-description, #C7CDD6)',
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
      buttonText: 'Get Started',
      text: 'Get Started',
    },
    defaultStyle: {
      padding: '18px 36px',
      background: 'linear-gradient(135deg, var(--color-primary-bg, #E11D48), var(--color-accent, #F59E0B))',
      color: 'var(--color-primary-text, #FFFFFF)',
      border: 'none',
      borderRadius: '12px',
      cursor: 'pointer',
      fontSize: '1.125rem',
      fontWeight: 700,
      boxShadow: '0 10px 30px var(--color-shadow, rgba(0,0,0,0.3)), 0 4px 12px rgba(var(--color-primary-bg-rgb, 225, 29, 72), 0.4)',
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
      padding: '18px 36px',
      backgroundColor: 'transparent',
      color: 'var(--color-secondary-text, #F8FAFC)',
      border: '2px solid var(--color-secondary-border, #F43F5E)',
      borderRadius: '12px',
      cursor: 'pointer',
      fontSize: '1.125rem',
      fontWeight: 700,
      backdropFilter: 'blur(8px)',
    }
  },
  {
    elId: 'image-column',
    type: 'container',
    order: 1,
    parentElId: 'main-container',
    defaultProps: {},
    defaultStyle: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
    }
  },
  {
    elId: 'hero-image',
    type: 'image',
    order: 0,
    parentElId: 'image-column',
    defaultProps: {
      imageUrl: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&h=600&fit=crop',
      imageAlt: 'Hero Image'
    },
    defaultStyle: {
      width: '100%',
      height: 'auto',
      borderRadius: '20px',
      boxShadow: '0 20px 60px var(--color-shadow, rgba(0,0,0,0.4))',
      objectFit: 'cover',
    }
  },
] as const;

export const uniqueId = "hero_d";

type ApiData = {
  projectName?: string;
  image?: string;
  description?: string;
  icon?: string;
};

export default function HeroD(props: HeroSectionProps) {
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
        elId: 'description',
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
      },
      {
        elId: 'description',
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
  
  // Initialize default elements using reusable hook
  useElementInitialization({
    __studio,
    __nodeId,
    defaultElements: DEFAULT_ELEMENTS,
    resolvedData: resolved,
    loading,
    skipElements: ['section'],
    containerElements: [
      { elId: 'section', parentElId: undefined },
      { elId: 'main-container', parentElId: 'section' },
      { elId: 'content-column', parentElId: 'main-container' },
      { elId: 'buttons-container', parentElId: 'content-column' },
      { elId: 'image-column', parentElId: 'main-container' }
    ],
    propResolver: (element, resolvedData) => {
      const props: any = {};
      if (element.elId === 'title' && resolvedData.title) {
        props.text = resolvedData.title;
        props.heading = resolvedData.title;
      } else if (element.elId === 'description' && resolvedData.description) {
        props.text = resolvedData.description;
        props.text = resolvedData.description;
      } else if (element.elId === 'hero-image' && resolvedData.backgroundImage) {
        props.imageUrl = resolvedData.backgroundImage;
      }
      return props;
    }
  });

  // Get element helpers using reusable hook
  const { builderMode, getElStyle, getElProps, isElSelected } = useElementHelpers({
    __studio,
    __nodeId,
    fallbackValues: {
      title: resolved.title,
      description: resolved.description,
    },
    debug: typeof window !== 'undefined' && (window as any).__DEV__
  });

  // Get section styles using reusable utilities
  const customElements = __studio?.getCustomElements?.() || [];
  const customStyles = getSectionStyles(customElements, getElStyle, 'section', props.style);

  // Build section styles using reusable hook
  const { sectionStyle, backgroundWrapper } = useSectionStyles({
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
      {/* Background image wrapper for opacity support */}
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
      {/* Content wrapper */}
      <div style={{ position: 'relative', zIndex: 1 }}>
      {/* Render elements - from DB or fallback */}
      {(() => {
        const customElements = __studio?.getCustomElements?.() || [];
        
        if (builderMode && customElements.length === 0) {
          return renderEmptyState({
            builderMode,
            loading,
            loadingMessage: 'Loading hero data...',
            initializingMessage: 'Initializing default elements...',
            emptyMessage: '[HeroD] No elements found - initializing default structure...'
          });
        }
        
        if (!builderMode && customElements.length === 0) {
          return (
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '80px',
              alignItems: 'center',
              padding: '100px 0', // No side padding - full width
              width: '100%', // Full width - no maxWidth or margin auto
              minHeight: '600px',
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                <div style={{
                  padding: '10px 24px',
                  backgroundColor: 'rgba(225, 29, 72, 0.15)',
                  color: 'var(--color-primary-bg, #E11D48)',
                  border: '1px solid rgba(225, 29, 72, 0.3)',
                  borderRadius: '9999px',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  width: 'fit-content',
                }}>
                  Professional Service
                </div>
                <h1 style={{
                  fontSize: '3.5rem',
                  fontWeight: 800,
                  backgroundImage: 'linear-gradient(135deg, var(--color-heading, #F8FAFC), var(--color-accent, #F59E0B))',
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  color: 'transparent',
                  WebkitTextFillColor: 'transparent',
                  lineHeight: 1.1,
                  margin: 0,
                }}>
                  {resolved.title}
                </h1>
                <p style={{
                  fontSize: '1.25rem',
                  color: 'var(--color-description, #C7CDD6)',
                  lineHeight: 1.7,
                  margin: 0,
                }}>
                  {resolved.description}
                </p>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '8px' }}>
                  <button style={{
                    padding: '18px 36px',
                    background: 'linear-gradient(135deg, var(--color-primary-bg, #E11D48), var(--color-accent, #F59E0B))',
                    color: 'var(--color-primary-text, #FFFFFF)',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '1.125rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}>
                    Get Started
                  </button>
                  <button style={{
                    padding: '18px 36px',
                    backgroundColor: 'transparent',
                    color: 'var(--color-secondary-text, #F8FAFC)',
                    border: '2px solid var(--color-secondary-border, #F43F5E)',
                    borderRadius: '12px',
                    fontSize: '1.125rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}>
                    Learn More
                  </button>
                </div>
              </div>
              <div>
                <img
                  src={resolved.backgroundImage || 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&h=600&fit=crop'}
                  alt="Hero"
                  style={{
                    width: '100%',
                    height: 'auto',
                    borderRadius: '20px',
                    boxShadow: '0 20px 60px var(--color-shadow, rgba(0,0,0,0.4))',
                  }}
                />
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
              const titleText = apiData?.projectName || elProps.text || resolved?.title || '';
              const titleHeading = apiData?.projectName || elProps.heading || resolved?.title || '';
              return { text: titleText, heading: titleHeading };
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
      
      {loading && <div style={{ color: "#fff", marginBottom: 16 }}>Loading...</div>}
      {props.children}
      </div>
    </section>
  );
}
