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

// Hero G: Professional Minimalist Layout
// Structure: Section → (hero-container [flex column] → title, description, button-primary)
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
      minHeight: '80vh',
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
      padding: '100px 0', // No side padding - full width
      position: 'relative',
      zIndex: 2,
      width: '100%',
      maxWidth: '1000px',
      margin: '0 auto',
      backgroundColor: 'transparent',
      textAlign: 'center',
      minHeight: '80vh',
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
      fontSize: '5.5rem',
      fontWeight: 300,
      color: 'var(--color-heading, #F8FAFC)',
      marginBottom: '32px',
      lineHeight: 1.1,
      letterSpacing: '-0.04em',
    }
  },
  {
    elId: 'description',
    type: 'text',
    order: 1,
    parentElId: 'hero-container',
    defaultProps: {
      text: 'Transform your business with our innovative solutions. We deliver exceptional results.',
      description: 'Transform your business with our innovative solutions. We deliver exceptional results.',
    },
    defaultStyle: {
      fontSize: '1.5rem',
      color: 'var(--color-description, #94A3B8)',
      lineHeight: 1.6,
      marginBottom: '48px',
      fontWeight: 300,
    }
  },
  {
    elId: 'button-primary',
    type: 'button',
    order: 2,
    parentElId: 'hero-container',
    defaultProps: {
      buttonText: 'Explore',
      text: 'Explore',
    },
    defaultStyle: {
      padding: '16px 48px',
      backgroundColor: 'var(--color-primary-bg, #E11D48)',
      color: 'var(--color-primary-text, #FFFFFF)',
      border: 'none',
      borderRadius: '0',
      cursor: 'pointer',
      fontSize: '1rem',
      fontWeight: 400,
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
      transition: 'background-color 0.3s',
    }
  },
] as const;

export const uniqueId = "hero_g";

type ApiData = {
  projectName?: string;
  image?: string;
  description?: string;
  icon?: string;
};

export default function HeroG(props: HeroSectionProps) {
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
      { elId: 'hero-container', parentElId: 'section' }
    ],
    propResolver: (element, resolvedData) => {
      const props: any = {};
      if (element.elId === 'title' && resolvedData.title) {
        props.text = resolvedData.title;
        props.heading = resolvedData.title;
      } else if (element.elId === 'description' && resolvedData.description) {
        props.text = resolvedData.description;
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
            emptyMessage: '[HeroG] No elements found - initializing default structure...'
          });
        }
        
        if (!builderMode && customElements.length === 0) {
          return (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '100px 0', // No side padding - full width
              maxWidth: '1000px',
              margin: '0 auto',
              textAlign: 'center',
              minHeight: '80vh',
            }}>
              <h1 style={{
                fontSize: '5.5rem',
                fontWeight: 300,
                color: 'var(--color-heading, #F8FAFC)',
                marginBottom: '32px',
                lineHeight: 1.1,
                letterSpacing: '-0.04em',
                margin: '0 0 32px 0',
              }}>
                {resolved.title}
              </h1>
              <p style={{
                fontSize: '1.5rem',
                color: 'var(--color-description, #94A3B8)',
                lineHeight: 1.6,
                marginBottom: '48px',
                fontWeight: 300,
                margin: '0 auto 48px',
              }}>
                {resolved.description}
              </p>
              <button style={{
                padding: '16px 48px',
                backgroundColor: 'var(--color-primary-bg, #E11D48)',
                color: 'var(--color-primary-text, #FFFFFF)',
                border: 'none',
                borderRadius: '0',
                fontSize: '1rem',
                fontWeight: 400,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                cursor: 'pointer',
              }}>
                Explore
              </button>
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
