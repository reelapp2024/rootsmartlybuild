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
  title: "LUXE IS HERE TO BE YOUR ASSISTANCE",
  description: "I am here ready to help you in making creative digital products",
  backgroundImage: "",
  logo: "",
};

export const template = { ...defaultProps };

// Hero C: Split-screen layout with content on left and image with floating stats on right
// Structure: Section → (main-container [flex row] → content-column [flex column] → greeting, title, description, button, image-column [relative] → hero-image, stat-card-1, stat-card-2, stat-card-3)
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
      minHeight: '650px',
      overflow: 'hidden',
      backgroundColor: 'var(--color-surface, #FFFFFF)',
      color: 'var(--color-heading, #1F2937)',
    }
  },
  {
    elId: 'main-container',
    type: 'container',
    order: 0,
    parentElId: 'section',
    defaultProps: {},
    defaultStyle: {
      display: 'flex',
      flexDirection: 'row',
      gap: '60px',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '100px 60px',
      position: 'relative',
      zIndex: 2,
      width: '100%',
      width: '100%', // Full width - no maxWidth or margin auto
      backgroundColor: 'transparent',
      minHeight: '650px',
      flexWrap: 'wrap',
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
      gap: '28px',
      flex: '1 1 48%',
      minWidth: '320px',
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
      fontSize: '1rem',
      color: 'var(--color-description, #6B7280)',
      marginBottom: '0',
      lineHeight: 1.5,
      fontWeight: 400,
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
      flexWrap: 'wrap',
      alignItems: 'baseline',
      gap: '8px',
      marginBottom: '0',
    }
  },
  {
    elId: 'title-luxe',
    type: 'heading',
    order: 0,
    parentElId: 'title-container',
    defaultProps: {
      text: 'LUXE',
      heading: 'LUXE',
      headingTag: 'h1'
    },
    defaultStyle: {
      fontSize: '3.5rem',
      fontWeight: 700,
      color: 'var(--color-primary-bg, #EC4899)',
      marginBottom: '0',
      lineHeight: 1.2,
      letterSpacing: '-0.02em',
    }
  },
  {
    elId: 'title-rest',
    type: 'heading',
    order: 1,
    parentElId: 'title-container',
    defaultProps: {
      text: 'IS HERE TO BE YOUR ASSISTANCE',
      heading: 'IS HERE TO BE YOUR ASSISTANCE',
      headingTag: 'h1'
    },
    defaultStyle: {
      fontSize: '3.5rem',
      fontWeight: 700,
      color: 'var(--color-heading, #1F2937)',
      marginBottom: '0',
      lineHeight: 1.2,
      letterSpacing: '-0.02em',
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
      fontSize: '1.125rem',
      color: 'var(--color-description, #6B7280)',
      lineHeight: 1.6,
      marginBottom: '0',
    }
  },
  {
    elId: 'button-primary',
    type: 'button',
    order: 3,
    parentElId: 'content-column',
    defaultProps: {
      buttonText: "Let's Discuss",
      text: "Let's Discuss",
    },
    defaultStyle: {
      padding: '16px 32px',
      backgroundColor: 'var(--color-primary-bg, #EC4899)',
      color: 'var(--color-primary-text, #FFFFFF)',
      border: 'none',
      borderRadius: '12px',
      cursor: 'pointer',
      fontSize: '1rem',
      fontWeight: 600,
      marginTop: '8px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
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
      flex: '1 1 48%',
      minWidth: '320px',
      height: '550px',
    }
  },
  {
    elId: 'hero-image',
    type: 'image',
    order: 0,
    parentElId: 'image-column',
    defaultProps: {
      imageUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&h=800&fit=crop',
      imageAlt: 'Hero Image'
    },
    defaultStyle: {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      borderRadius: '24px',
      position: 'relative',
      zIndex: 1,
    }
  },
  {
    elId: 'stat-card-1',
    type: 'container',
    order: 1,
    parentElId: 'image-column',
    defaultProps: {},
    defaultStyle: {
      position: 'absolute',
      top: '20px',
      left: '20px',
      backgroundColor: 'var(--color-surface, #FFFFFF)',
      borderRadius: '16px',
      padding: '16px 20px',
      boxShadow: '0 10px 30px var(--color-shadow, rgba(0,0,0,0.1))',
      zIndex: 10,
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      gap: '12px',
      minWidth: '160px',
      border: '1px solid rgba(0,0,0,0.05)',
    }
  },
  {
    elId: 'stat-1-icon',
    type: 'icon',
    order: 0,
    parentElId: 'stat-card-1',
    defaultProps: {
      iconClass: 'fas fa-layer-group',
    },
    defaultStyle: {
      fontSize: '1.5rem',
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
      fontSize: '0.875rem',
      color: 'var(--color-heading, #1F2937)',
      fontWeight: 600,
      marginBottom: '0',
    }
  },
  {
    elId: 'stat-card-2',
    type: 'container',
    order: 2,
    parentElId: 'image-column',
    defaultProps: {},
    defaultStyle: {
      position: 'absolute',
      top: '20px',
      right: '20px',
      backgroundColor: 'var(--color-surface, #FFFFFF)',
      borderRadius: '16px',
      padding: '16px 20px',
      boxShadow: '0 10px 30px var(--color-shadow, rgba(0,0,0,0.1))',
      zIndex: 10,
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      gap: '12px',
      minWidth: '160px',
      border: '1px solid rgba(0,0,0,0.05)',
    }
  },
  {
    elId: 'stat-2-icon',
    type: 'icon',
    order: 0,
    parentElId: 'stat-card-2',
    defaultProps: {
      iconClass: 'fas fa-star',
    },
    defaultStyle: {
      fontSize: '1.5rem',
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
      fontSize: '0.875rem',
      color: '#1F2937',
      fontWeight: 600,
      marginBottom: '0',
    }
  },
  {
    elId: 'stat-card-3',
    type: 'container',
    order: 3,
    parentElId: 'image-column',
    defaultProps: {},
    defaultStyle: {
      position: 'absolute',
      bottom: '20px',
      right: '20px',
      backgroundColor: 'var(--color-surface, #FFFFFF)',
      borderRadius: '16px',
      padding: '16px 20px',
      boxShadow: '0 10px 30px var(--color-shadow, rgba(0,0,0,0.1))',
      zIndex: 10,
      display: 'flex',
      flexDirection: 'column',
      gap: '4px',
      minWidth: '180px',
      border: '1px solid rgba(0,0,0,0.05)',
    }
  },
  {
    elId: 'stat-3-icon',
    type: 'icon',
    order: 0,
    parentElId: 'stat-card-3',
    defaultProps: {
      iconClass: 'fas fa-user',
    },
    defaultStyle: {
      fontSize: '1.5rem',
      color: 'var(--color-primary-bg, #EC4899)',
    }
  },
  {
    elId: 'stat-3-title',
    type: 'text',
    order: 1,
    parentElId: 'stat-card-3',
    defaultProps: {
      text: 'Product Designer',
    },
    defaultStyle: {
      fontSize: '0.875rem',
      color: 'var(--color-heading, #1F2937)',
      fontWeight: 600,
      marginBottom: '0',
    }
  },
  {
    elId: 'stat-3-subtitle',
    type: 'text',
    order: 2,
    parentElId: 'stat-card-3',
    defaultProps: {
      text: '5 Years',
    },
    defaultStyle: {
      fontSize: '0.75rem',
      color: 'var(--color-description, #6B7280)',
      marginBottom: '0',
    }
  },
] as const;

export const uniqueId = "hero_c";

type ApiData = {
  projectName?: string;
  image?: string;
  description?: string;
  icon?: string;
};

export default function HeroC(props: HeroSectionProps) {
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
        elId: 'title-luxe',
        apiKey: 'projectName',
        propKey: 'text',
        defaultValue: 'LUXE',
        checkFunction: (current, apiVal, defaultVal) => {
          if (!apiVal) return false;
          if (!current || current.trim() === '') return true;
          const firstWord = apiVal.split(' ')[0]?.toUpperCase() || 'LUXE';
          return current === firstWord || current === 'LUXE';
        }
      },
      {
        elId: 'title-rest',
        apiKey: 'projectName',
        propKey: 'text',
        defaultValue: 'IS HERE TO BE YOUR ASSISTANCE',
        checkFunction: (current, apiVal, defaultVal) => {
          if (!apiVal) return false;
          if (!current || current.trim() === '') return true;
          const words = apiVal.split(' ');
          const rest = words.slice(1).join(' ') || 'IS HERE TO BE YOUR ASSISTANCE';
          return current === rest || current.includes('IS HERE');
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
          const defaultPatterns = ['I am here ready', 'We provide exceptional service'];
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
      { elId: 'main-container', parentElId: 'section' },
      { elId: 'content-column', parentElId: 'main-container' },
      { elId: 'title-container', parentElId: 'content-column' },
      { elId: 'image-column', parentElId: 'main-container' },
      { elId: 'stat-card-1', parentElId: 'image-column' },
      { elId: 'stat-card-2', parentElId: 'image-column' },
      { elId: 'stat-card-3', parentElId: 'image-column' }
    ],
    propResolver: (element, resolvedData) => {
      const props: any = {};
      if (element.elId === 'title-luxe' && resolvedData.title) {
        const firstWord = resolvedData.title.split(' ')[0]?.toUpperCase() || 'LUXE';
        props.text = firstWord;
        props.heading = firstWord;
      } else if (element.elId === 'title-rest' && resolvedData.title) {
        const words = resolvedData.title.split(' ');
        const rest = words.slice(1).join(' ') || 'IS HERE TO BE YOUR ASSISTANCE';
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
    apiImage: undefined,
    defaultBackground: "var(--color-surface, #FFFFFF)",
    isSelected: isElSelected("section"),
    propsStyle: props.style,
    defaultMinHeight: 650
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
      <div style={{ position: 'relative', zIndex: 1 }}>
      {(() => {
        const customElements = __studio?.getCustomElements?.() || [];
        
        if (builderMode && customElements.length === 0) {
          return renderEmptyState({
            builderMode,
            loading,
            loadingMessage: 'Loading hero data...',
            initializingMessage: 'Initializing default elements...',
            emptyMessage: '[HeroC] No elements found - initializing default structure...'
          });
        }
        
        if (!builderMode && customElements.length === 0) {
          return (
            <div style={{
              display: 'flex',
              flexDirection: 'row',
              gap: '60px',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '100px 0', // No side padding - full width
      width: '100%', // Full width - no maxWidth or margin auto
              minHeight: '650px',
              flexWrap: 'wrap',
            }}>
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '28px',
                flex: '1 1 48%',
                minWidth: '320px',
              }}>
                <p style={{
                  fontSize: '1rem',
                  color: 'var(--color-description, #6B7280)',
                  margin: 0,
                }}>
                  Hi, there!
                </p>
                <div style={{
                  display: 'flex',
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  alignItems: 'baseline',
                  gap: '8px',
                }}>
                  <span style={{
                    fontSize: '3.5rem',
                    fontWeight: 700,
                    color: 'var(--color-primary-bg, #EC4899)',
                    lineHeight: 1.2,
                  }}>
                    {resolved.title.split(' ')[0]?.toUpperCase() || 'LUXE'}
                  </span>
                  <span style={{
                    fontSize: '3.5rem',
                    fontWeight: 700,
                    color: 'var(--color-heading, #1F2937)',
                    lineHeight: 1.2,
                  }}>
                    {resolved.title.split(' ').slice(1).join(' ') || 'IS HERE TO BE YOUR ASSISTANCE'}
                  </span>
                </div>
                <p style={{
                  fontSize: '1.125rem',
                  color: 'var(--color-description, #6B7280)',
                  lineHeight: 1.6,
                  margin: 0,
                }}>
                  {resolved.description}
                </p>
                <button style={{
                  padding: '16px 32px',
                  backgroundColor: 'var(--color-primary-bg, #EC4899)',
                  color: 'var(--color-primary-text, #FFFFFF)',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '1rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  marginTop: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                }}>
                  Let's Discuss
                </button>
              </div>
              <div style={{
                flex: '1 1 48%',
                minWidth: '320px',
                position: 'relative',
                height: '550px',
              }}>
                <img
                  src={resolved.backgroundImage || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&h=800&fit=crop'}
                  alt="Hero"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    borderRadius: '24px',
                  }}
                />
                <div style={{
                  position: 'absolute',
                  top: '20px',
                  left: '20px',
                  backgroundColor: 'var(--color-surface, #FFFFFF)',
                  borderRadius: '16px',
                  padding: '16px 20px',
                  boxShadow: '0 10px 30px var(--color-shadow, rgba(0,0,0,0.1))',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  border: '1px solid rgba(0,0,0,0.05)',
                }}>
                  <i className="fas fa-layer-group" style={{ fontSize: '1.5rem', color: 'var(--color-primary-bg, #EC4899)' }}></i>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-heading, #1F2937)' }}>2K+ Projects</span>
                </div>
                <div style={{
                  position: 'absolute',
                  top: '20px',
                  right: '20px',
                  backgroundColor: 'var(--color-surface, #FFFFFF)',
                  borderRadius: '16px',
                  padding: '16px 20px',
                  boxShadow: '0 10px 30px var(--color-shadow, rgba(0,0,0,0.1))',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  border: '1px solid rgba(0,0,0,0.05)',
                }}>
                  <i className="fas fa-star" style={{ fontSize: '1.5rem', color: 'var(--color-accent, #FBBF24)' }}></i>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-heading, #1F2937)' }}>4.8 Satisfaction</span>
                </div>
                <div style={{
                  position: 'absolute',
                  bottom: '20px',
                  right: '20px',
                  backgroundColor: 'var(--color-surface, #FFFFFF)',
                  borderRadius: '16px',
                  padding: '16px 20px',
                  boxShadow: '0 10px 30px var(--color-shadow, rgba(0,0,0,0.1))',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  border: '1px solid rgba(0,0,0,0.05)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <i className="fas fa-user" style={{ fontSize: '1.5rem', color: 'var(--color-primary-bg, #EC4899)' }}></i>
                    <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-heading, #1F2937)' }}>Product Designer</span>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-description, #6B7280)', marginLeft: '32px' }}>5 Years</span>
                </div>
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
            'title-luxe': (elProps, apiData, resolved) => {
              const title = apiData?.projectName || elProps.text || resolved?.title || 'LUXE';
              const firstWord = title.split(' ')[0]?.toUpperCase() || 'LUXE';
              return { text: firstWord, heading: firstWord };
            },
            'title-rest': (elProps, apiData, resolved) => {
              const title = apiData?.projectName || elProps.text || resolved?.title || 'IS HERE TO BE YOUR ASSISTANCE';
              const words = title.split(' ');
              const rest = words.slice(1).join(' ') || 'IS HERE TO BE YOUR ASSISTANCE';
              return { text: rest, heading: rest };
            },
            'description': (elProps, apiData, resolved) => {
              const textContent = apiData?.description || elProps.text || resolved?.description || '';
              return { text: textContent };
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



