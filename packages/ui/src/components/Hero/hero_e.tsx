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
  title: "fyn digital marketing",
  description: "Welcome to Fyn Digital Marketing, your one-stop destination for top-notch digital marketing services for businesses. Our expert team specializes in SEO strategy, social media marketing, content creation, online advertising, search engine optimization, email campaigns, digital branding, and conversion rate optimization. With a focus on digital marketing and email marketing, we are dedicated to helping your business thrive in the digital landscape. Trust Fyn Digital Marketing to elevate your online presence and drive results.",
  backgroundImage: "https://images.pexels.com/photos/303383/pexels-photo-303383.jpeg",
  logo: "",
};

export const template = { ...defaultProps };

// Hero E: Professional Centered Layout with Stats
// Structure: Section → (hero-container [flex column] → title, description, button-primary, stats-container [grid] → stat-1, stat-2, stat-3)
const DEFAULT_ELEMENTS: DefaultElement[] = [
  {
    elId: 'section',
    type: 'container',
    order: 0,
    parentElId: undefined,
    defaultProps: {},
    defaultStyle: {
      padding: '16px',
      position: 'relative',
      width: '100%',
      minHeight: '700px',
      overflow: 'hidden',
      background: 'linear-gradient(180deg, var(--color-surface, #0E1214) 0%, var(--color-gradient-to, #1F2937) 100%)',
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
      padding: '120px 0 80px', // No side padding - full width
      position: 'relative',
      zIndex: 2,
      width: '100%',
      backgroundColor: 'transparent',
      textAlign: 'center',
      minHeight: '700px',
      opacity: 0.4,
    }
  },
  {
    elId: 'title',
    type: 'heading',
    order: 1,
    parentElId: 'hero-container',
    defaultProps: {
      text: 'fyn digital marketing',
      heading: 'fyn digital marketing',
      headingTag: 'h1'
    },
    defaultStyle: {
      fontSize: '4.5rem',
      fontWeight: 900,
      backgroundImage: 'linear-gradient(135deg, var(--color-heading, #F8FAFC), var(--color-accent, #F59E0B), var(--color-primary-bg, #E11D48))',
      WebkitBackgroundClip: 'text',
      backgroundClip: 'text',
      color: 'transparent',
      WebkitTextFillColor: 'transparent',
      marginBottom: '24px',
      lineHeight: 1.1,
      letterSpacing: '-0.03em',
      headingFontFamily: 'Raleway, sans-serif',
    }
  },
  {
    elId: 'description',
    type: 'text',
    order: 2,
    parentElId: 'hero-container',
    defaultProps: {
      text: 'Welcome to Fyn Digital Marketing, your one-stop destination for top-notch digital marketing services for businesses. Our expert team specializes in SEO strategy, social media marketing, content creation, online advertising, search engine optimization, email campaigns, digital branding, and conversion rate optimization. With a focus on digital marketing and email marketing, we are dedicated to helping your business thrive in the digital landscape. Trust Fyn Digital Marketing to elevate your online presence and drive results.',
      description: 'Welcome to Fyn Digital Marketing, your one-stop destination for top-notch digital marketing services for businesses. Our expert team specializes in SEO strategy, social media marketing, content creation, online advertising, search engine optimization, email campaigns, digital branding, and conversion rate optimization. With a focus on digital marketing and email marketing, we are dedicated to helping your business thrive in the digital landscape. Trust Fyn Digital Marketing to elevate your online presence and drive results.',
    },
    defaultStyle: {
      fontSize: '1.0rem',
      color: 'var(--color-description, #C7CDD6)',
      lineHeight: 1.6,
      marginBottom: '48px',
      padding: '21px',
      fontFamily: 'Raleway, sans-serif',
    }
  },
  {
    elId: 'button-primary',
    type: 'button',
    order: 3,
    parentElId: 'hero-container',
    defaultProps: {
      buttonText: 'Start Free Trial',
      text: 'Start Free Trial',
      buttonLink: '#',
    },
    defaultStyle: {
      padding: '24px 48px',
      backgroundColor: '#ffffff',
      background: 'linear-gradient(135deg, var(--color-primary-bg, #E11D48), var(--color-accent, #F59E0B))',
      color: 'var(--color-primary-text, #FFFFFF)',
      border: 'none',
      borderRadius: '16px',
      cursor: 'pointer',
      fontSize: '1.25rem',
      fontWeight: 700,
      boxShadow: '0 20px 40px var(--color-shadow, rgba(0,0,0,0.4)), 0 8px 16px rgba(var(--color-primary-bg-rgb, 225, 29, 72), 0.5)',
      marginBottom: '64px',
      fontFamily: 'Raleway, sans-serif',
    }
  },
  {
    elId: 'stats-container',
    type: 'container',
    order: 0,
    parentElId: 'hero-container',
    defaultProps: {},
    defaultStyle: {
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: '40px',
      padding: '16px',
      width: '100%',
      maxWidth: '900px',
      marginTop: '32px',
      flexWrap: 'wrap',
      opacity: 0,
    }
  },
  {
    elId: 'stat-1',
    type: 'container',
    order: 0,
    parentElId: 'stats-container',
    defaultProps: {},
    defaultStyle: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '8px',
      padding: '16px',
      opacity: 0,
    }
  },
  {
    elId: 'stat-1-value',
    type: 'heading',
    order: 0,
    parentElId: 'stat-1',
    defaultProps: {
      text: '10K+',
      heading: '10K+',
      headingTag: 'h2'
    },
    defaultStyle: {
      fontSize: '3rem',
      fontWeight: 800,
      color: 'var(--color-accent, #F59E0B)',
      marginBottom: '0',
      lineHeight: 1,
    }
  },
  {
    elId: 'stat-1-label',
    type: 'text',
    order: 1,
    parentElId: 'stat-1',
    defaultProps: {
      text: 'Happy Customers',
    },
    defaultStyle: {
      fontSize: '1rem',
      color: 'var(--color-description, #C7CDD6)',
      marginBottom: '0',
    }
  },
  {
    elId: 'stat-2',
    type: 'container',
    order: 1,
    parentElId: 'stats-container',
    defaultProps: {},
    defaultStyle: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '8px',
      padding: '16px',
      opacity: 0.3,
    }
  },
  {
    elId: 'stat-2-value',
    type: 'heading',
    order: 0,
    parentElId: 'stat-2',
    defaultProps: {
      text: '99.9%',
      heading: '99.9%',
      headingTag: 'h2'
    },
    defaultStyle: {
      fontSize: '3rem',
      fontWeight: 800,
      color: 'var(--color-accent, #F59E0B)',
      marginBottom: '0',
      lineHeight: 1,
    }
  },
  {
    elId: 'stat-2-label',
    type: 'text',
    order: 1,
    parentElId: 'stat-2',
    defaultProps: {
      text: 'Uptime',
    },
    defaultStyle: {
      fontSize: '1rem',
      color: 'var(--color-description, #C7CDD6)',
      marginBottom: '0',
    }
  },
  {
    elId: 'stat-3',
    type: 'container',
    order: 2,
    parentElId: 'stats-container',
    defaultProps: {},
    defaultStyle: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '8px',
      padding: '16px',
      opacity: 0,
    }
  },
  {
    elId: 'stat-3-value',
    type: 'heading',
    order: 0,
    parentElId: 'stat-3',
    defaultProps: {
      text: '24/7',
      heading: '24/7',
      headingTag: 'h2'
    },
    defaultStyle: {
      fontSize: '3rem',
      fontWeight: 800,
      color: 'var(--color-accent, #F59E0B)',
      marginBottom: '0',
      lineHeight: 1,
    }
  },
  {
    elId: 'stat-3-label',
    type: 'text',
    order: 1,
    parentElId: 'stat-3',
    defaultProps: {
      text: 'Support',
    },
    defaultStyle: {
      fontSize: '1rem',
      color: 'var(--color-description, #C7CDD6)',
      marginBottom: '0',
    }
  },
] as const;

export const uniqueId = "hero_e";

type ApiData = {
  projectName?: string;
  image?: string;
  description?: string;
  icon?: string;
};

export default function HeroE(props: HeroSectionProps) {
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
      { elId: 'hero-container', parentElId: 'section' },
      { elId: 'stats-container', parentElId: 'hero-container' },
      { elId: 'stat-1', parentElId: 'stats-container' },
      { elId: 'stat-2', parentElId: 'stats-container' },
      { elId: 'stat-3', parentElId: 'stats-container' }
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
    defaultMinHeight: 700
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
            emptyMessage: '[HeroE] No elements found - initializing default structure...'
          });
        }
        
        if (!builderMode && customElements.length === 0) {
          return (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '120px 0 80px', // No side padding - full width
              maxWidth: '1200px',
              width: '100%', // Full width - no margin auto
              textAlign: 'center',
              minHeight: '700px',
            }}>
              <h1 style={{
                fontSize: '4.5rem',
                fontWeight: 900,
                backgroundImage: 'linear-gradient(135deg, var(--color-heading, #F8FAFC), var(--color-accent, #F59E0B), var(--color-primary-bg, #E11D48))',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
                WebkitTextFillColor: 'transparent',
                marginBottom: '24px',
                lineHeight: 1.1,
                margin: '0 0 24px 0',
              }}>
                {resolved.title}
              </h1>
              <p style={{
                fontSize: '1.5rem',
                color: 'var(--color-description, #C7CDD6)',
                lineHeight: 1.6,
                marginBottom: '48px',
                margin: '0 auto 48px',
              }}>
                {resolved.description}
              </p>
              <button style={{
                padding: '24px 48px',
                background: 'linear-gradient(135deg, var(--color-primary-bg, #E11D48), var(--color-accent, #F59E0B))',
                color: 'var(--color-primary-text, #FFFFFF)',
                border: 'none',
                borderRadius: '16px',
                fontSize: '1.25rem',
                fontWeight: 700,
                cursor: 'pointer',
                marginBottom: '64px',
              }}>
                Start Free Trial
              </button>
              <div style={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '40px',
                width: '100%',
                maxWidth: '900px',
                flexWrap: 'wrap',
              }}>
                {[
                  { value: '10K+', label: 'Happy Customers' },
                  { value: '99.9%', label: 'Uptime' },
                  { value: '24/7', label: 'Support' },
                ].map((stat, idx) => (
                  <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <h2 style={{
                      fontSize: '3rem',
                      fontWeight: 800,
                      color: 'var(--color-accent, #F59E0B)',
                      margin: 0,
                      lineHeight: 1,
                    }}>
                      {stat.value}
                    </h2>
                    <p style={{
                      fontSize: '1rem',
                      color: 'var(--color-description, #C7CDD6)',
                      margin: 0,
                    }}>
                      {stat.label}
                    </p>
                  </div>
                ))}
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
