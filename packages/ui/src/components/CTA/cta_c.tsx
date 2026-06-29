'use client';

import React, { useMemo, useEffect } from "react";
import { useComponentApiData } from "../../utils/apiHelpers";
import { useElementInitialization, useElementHelpers } from "../../utils/componentHelpers";
import { useSectionStyles } from "../../utils/sectionStyles";
import { renderRootElements } from "../../utils/elementRendering";
import { renderEmptyState, getSectionStyles } from "../../utils/componentRendering";
import type { DefaultElement } from "../../utils/componentHelpers";

export type CTASectionProps = {
  projectId?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
  __studio?: any;
  __nodeId?: string;
};

export const defaultProps = {};
export const template = { ...defaultProps };
export const uniqueId = "cta_c";

// Variant C: Vertical stacked cards with icons
const DEFAULT_ELEMENTS: DefaultElement[] = [
  {
    elId: 'section',
    type: 'container',
    order: 0,
    defaultProps: {},
    defaultStyle: {
      position: 'relative',
      width: '100%',
      padding: '80px 0', // No side padding - full width
      backgroundColor: 'var(--color-surface, #0E1214)', // Dark background
      color: 'var(--color-heading, #F8FAFC)', // Light text
      display: 'flex',
      flexDirection: 'column',
      gap: '32px',
    }
  },
  {
    elId: 'ctas-container',
    type: 'container',
    order: 0,
    parentElId: 'section',
    defaultProps: {},
    defaultStyle: {
      display: 'grid',
      gap: '24px',
      width: '100%',
      width: '100%', // Full width - no maxWidth or margin auto
    }
  }
] as const;

type CTAData = { title?: string; description?: string; };
type ApiData = { ctas?: CTAData[]; };

export default function CTAC(props: CTASectionProps) {
  const { __studio, __nodeId, projectId } = props;

  const { apiData: apiResponse, loading } = useComponentApiData({
    projectId,
    apiEndpoint: '/custom/v1/get_ctacomponentdata',
    uniqueId: uniqueId,
    enabled: !!projectId
  });

  const api: ApiData | null = apiResponse ? {
    ctas: Array.isArray(apiResponse) ? apiResponse : (apiResponse.ctas || [])
  } : null;

  const resolved = useMemo(() => ({ ...defaultProps, ...props }), [props]);

  const ctasToDisplay = useMemo(() => {
    if (api?.ctas && api.ctas.length > 0) {
      return api.ctas.filter(cta => cta.title && cta.title.trim() !== '');
    }
    return [];
  }, [api?.ctas]);

  useElementInitialization({
    __studio,
    __nodeId,
    defaultElements: DEFAULT_ELEMENTS,
    resolvedData: resolved,
    loading,
    skipElements: ['section'],
    containerElements: [
      { elId: 'section', parentElId: undefined },
      { elId: 'ctas-container', parentElId: 'section' }
    ],
    propResolver: () => ({}),
  });

  useEffect(() => {
    if (!__studio?.addCustomElement || !api?.ctas || loading) return;
    
    const customElements = __studio?.getCustomElements?.() || [];
    const ctasContainer = customElements.find((el: any) => el.elId === 'ctas-container');
    if (!ctasContainer) return;
    
    const existingCTAs = customElements.filter((el: any) => el.elId?.startsWith('cta-'));
    
    if (ctasToDisplay.length > 0 && existingCTAs.length === 0) {
      ctasToDisplay.forEach((cta, index) => {
        const ctaId = `cta-${index}`;
        const ctaContainerId = `${ctaId}-container`;
        const ctaIconId = `${ctaId}-icon`;
        const ctaHeadingId = `${ctaId}-heading`;
        const ctaTextId = `${ctaId}-text`;
        const ctaButtonId = `${ctaId}-button`;
        
        __studio.addCustomElement?.('container', ctaContainerId, false, 'ctas-container');
        __studio.updateCustomElementStyle?.(ctaContainerId, {
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          padding: '40px',
          backgroundColor: 'var(--color-surface, #0E1214)', // Dark background
          borderRadius: '16px',
          border: `1px solid var(--color-primary-bg, #E11D48)30`, // Theme-colored border
          width: '100%',
        });
        
        __studio.addCustomElement?.('icon', ctaIconId, false, ctaContainerId);
        __studio.updateCustomElementStyle?.(ctaIconId, {
          fontSize: '3rem',
          color: 'var(--color-accent, #F59E0B)', // Accent color for icons
          marginBottom: '20px',
        });
        __studio.updateCustomElementProps?.(ctaIconId, {
          iconClass: 'fas fa-check-circle',
        });
        
        __studio.addCustomElement?.('heading', ctaHeadingId, false, ctaContainerId);
        __studio.updateCustomElementStyle?.(ctaHeadingId, {
          fontSize: '1.5rem',
          fontWeight: 700,
          backgroundImage: 'linear-gradient(135deg, var(--color-heading, #F8FAFC), var(--color-accent, #F59E0B), var(--color-primary-bg, #E11D48))',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          color: 'transparent',
          WebkitTextFillColor: 'transparent',
          margin: 0,
          marginBottom: '12px',
          backgroundSize: '200% 200%',
        });
        __studio.updateCustomElementProps?.(ctaHeadingId, {
          text: cta.title || 'CTA Title',
          heading: cta.title || 'CTA Title',
          headingTag: 'h2',
        });
        
        __studio.addCustomElement?.('text', ctaTextId, false, ctaContainerId);
        __studio.updateCustomElementStyle?.(ctaTextId, {
          fontSize: '1rem',
          // Color will use CSS variable --color-description
          lineHeight: 1.6,
          margin: 0,
          marginBottom: '20px',
        });
        __studio.updateCustomElementProps?.(ctaTextId, {
          text: cta.description || 'CTA description goes here.',
        });
        
        __studio.addCustomElement?.('button', ctaButtonId, false, ctaContainerId);
        __studio.updateCustomElementStyle?.(ctaButtonId, {
          padding: '16px 32px',
          background: 'linear-gradient(135deg, var(--color-primary-bg, #E11D48), var(--color-accent, #F59E0B))',
          color: 'var(--color-primary-text, #FFFFFF)',
          border: 'none',
          borderRadius: '16px',
          cursor: 'pointer',
          fontSize: '1.125rem',
          fontWeight: 700,
          boxShadow: '0 15px 35px var(--color-shadow, rgba(0,0,0,0.35)), 0 5px 15px rgba(var(--color-primary-bg-rgb, 225, 29, 72), 0.4)',
        });
        __studio.updateCustomElementProps?.(ctaButtonId, {
          buttonText: 'Discover More',
          text: 'Discover More',
        });
      });
    }
  }, [api?.ctas, ctasToDisplay, __studio, loading]);

  const { builderMode, getElStyle, getElProps, isElSelected } = useElementHelpers({
    __studio,
    __nodeId,
    fallbackValues: {},
  });

  const customElements = __studio?.getCustomElements?.() || [];
  const customStyles = getSectionStyles(customElements, getElStyle, 'section', props.style);

  const sectionStyle = useSectionStyles({
    customStyles,
    defaultBackground: "#ffffff",
    isSelected: isElSelected("section"),
    propsStyle: props.style,
    defaultMinHeight: 400
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
      {(() => {
        const customElements = __studio?.getCustomElements?.() || [];
        
        if (customElements.length === 0) {
          if (builderMode) {
            return renderEmptyState({
              builderMode,
              loading,
              loadingMessage: 'Loading CTA data...',
              initializingMessage: 'Initializing default elements...',
              emptyMessage: '[CTAC] No elements found - initializing default structure...'
            });
          } else {
            if (loading) {
              return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-heading, #F8FAFC)' }}>Loading CTAs...</div>;
            }
            
            if (ctasToDisplay.length > 0) {
              return (
                <div style={{ display: 'grid', gap: '24px', width: '100%' }}>
                  {ctasToDisplay.map((cta, index) => (
                    <div
                      key={`cta-${index}`}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        textAlign: 'center',
                        padding: '40px',
                        backgroundColor: '#f8f9fa',
                        borderRadius: '16px',
                        border: '1px solid #e5e7eb',
                        width: '100%',
                      }}
                    >
                      <i className="fas fa-check-circle" style={{ fontSize: '3rem', color: '#2563eb', marginBottom: '20px' }}></i>
                      <h3 style={{ 
                        fontSize: '1.5rem', 
                        fontWeight: 700, 
                        backgroundImage: 'linear-gradient(135deg, var(--color-heading, #F8FAFC), var(--color-accent, #F59E0B), var(--color-primary-bg, #E11D48))',
                        WebkitBackgroundClip: 'text',
                        backgroundClip: 'text',
                        color: 'transparent',
                        WebkitTextFillColor: 'transparent',
                        margin: 0, 
                        marginBottom: '12px',
                        backgroundSize: '200% 200%',
                      }}>
                        {cta.title || 'CTA Title'}
                      </h3>
                      <p style={{ fontSize: '1rem', color: 'var(--color-description, #C7CDD6)', lineHeight: 1.6, margin: 0, marginBottom: '20px' }}>
                        {cta.description || 'CTA description goes here.'}
                      </p>
                      <button style={{
                        padding: '16px 32px',
                        background: 'linear-gradient(135deg, var(--color-primary-bg, #E11D48), var(--color-accent, #F59E0B))',
                        color: 'var(--color-primary-text, #FFFFFF)',
                        border: 'none',
                        borderRadius: '16px',
                        cursor: 'pointer',
                        fontSize: '1.125rem',
                        fontWeight: 700,
                        boxShadow: '0 15px 35px var(--color-shadow, rgba(0,0,0,0.35)), 0 5px 15px rgba(225, 29, 72, 0.4)',
                      }}>
                        Discover More
                      </button>
                    </div>
                  ))}
                </div>
              );
            }
            
            return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-heading, #F8FAFC)' }}>No CTA data available.</div>;
          }
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
          fallbackValues: {},
          propResolvers: {},
          apiData: api,
          resolved
        });
      })()}
      
      {props.children}
    </section>
  );
}

