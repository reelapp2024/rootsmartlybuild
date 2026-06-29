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

export const defaultProps = {};

export const template = { ...defaultProps };

// Variant A: Simple centered grid cards
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
      background: 'linear-gradient(135deg, var(--color-gradient-from, #0E1214), var(--color-gradient-to, #1F2937))', // Gradient background like multicolor theme
      color: 'var(--color-heading, #F8FAFC)', // Light text on gradient
      display: 'flex',
      flexDirection: 'column',
      gap: '48px',
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

export const uniqueId = "cta_a";

type CTAData = {
  title?: string;
  description?: string;
};

type ApiData = {
  ctas?: CTAData[];
};

export default function CTAA(props: CTASectionProps) {
  const { __studio, __nodeId, projectId } = props;

  // Fetch API data
  const { apiData: apiResponse, loading } = useComponentApiData({
    projectId,
    apiEndpoint: '/custom/v1/get_ctacomponentdata',
    uniqueId: uniqueId,
    enabled: !!projectId
  });

  // Transform API response
  const api: ApiData | null = apiResponse ? {
    ctas: Array.isArray(apiResponse) ? apiResponse : (apiResponse.ctas || [])
  } : null;

  const resolved = useMemo(() => {
    return {
      ...defaultProps,
      ...props,
    };
  }, [props]);

  // Get CTAs to display
  const ctasToDisplay = useMemo(() => {
    if (api?.ctas && api.ctas.length > 0) {
      return api.ctas.filter(cta => 
        cta.title && cta.title.trim() !== ''
      );
    }
    return [];
  }, [api?.ctas]);

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
      { elId: 'ctas-container', parentElId: 'section' }
    ],
    propResolver: (element, resolvedData) => {
      return {};
    }
  });

  // Initialize CTA cards when API data arrives (only in builder mode)
  useEffect(() => {
    if (!__studio || !__studio?.addCustomElement) return;
    if (!api?.ctas || loading) return;
    
    const customElements = __studio?.getCustomElements?.() || [];
    const ctasContainer = customElements.find((el: any) => el.elId === 'ctas-container');
    
    if (!ctasContainer) return;
    
    const existingCTAs = customElements.filter((el: any) => 
      el.elId && el.elId.startsWith('cta-')
    );
    
    if (ctasToDisplay.length > 0 && existingCTAs.length === 0) {
      ctasToDisplay.forEach((cta, index) => {
        const ctaId = `cta-${index}`;
        const ctaContainerId = `${ctaId}-container`;
        const ctaHeadingId = `${ctaId}-heading`;
        const ctaTextId = `${ctaId}-text`;
        const ctaButtonId = `${ctaId}-button`;
        
        // Create CTA container - use theme colors
        __studio.addCustomElement?.('container', ctaContainerId, false, 'ctas-container');
        __studio.updateCustomElementStyle?.(ctaContainerId, {
          display: 'flex',
          flexDirection: 'column',
          padding: '32px',
          backgroundColor: 'rgba(255, 255, 255, 0.05)', // Semi-transparent white overlay
          backdropFilter: 'blur(10px)',
          borderRadius: '12px',
          border: `1px solid var(--color-primary-bg, #E11D48)30`, // Theme-colored border
          width: '100%',
        });
        
        // Create heading
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
        
        // Create text
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
        
        // Create button
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
          alignSelf: 'flex-start',
        });
        __studio.updateCustomElementProps?.(ctaButtonId, {
          buttonText: 'Learn More',
          text: 'Learn More',
        });
      });
    }
  }, [api?.ctas, ctasToDisplay, __studio, loading]);

  // Get element helpers
  const { builderMode, getElStyle, getElProps, isElSelected } = useElementHelpers({
    __studio,
    __nodeId,
    fallbackValues: {},
    debug: typeof window !== 'undefined' && (window as any).__DEV__
  });

  // Get section styles
  const customElements = __studio?.getCustomElements?.() || [];
  const customStyles = getSectionStyles(customElements, getElStyle, 'section', props.style);

  // Build section styles - use gradient background like multicolor theme
  const sectionStyle = useSectionStyles({
    customStyles,
    defaultBackground: "linear-gradient(135deg, var(--color-gradient-from, #0E1214), var(--color-gradient-to, #1F2937))",
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
              emptyMessage: '[CTAA] No elements found - initializing default structure...'
            });
          } else {
            if (loading) {
              return (
                <div style={{ 
                  padding: '40px', 
                  textAlign: 'center', 
                  color: '#000000',
                  backgroundColor: '#ffffff',
                }}>
                  <p>Loading CTAs...</p>
                </div>
              );
            }
            
            // Render directly from API if no elements in DB
            if (ctasToDisplay.length > 0) {
              return (
                <div style={{
                  display: 'grid',
                  gap: '24px',
                  width: '100%',
                  maxWidth: '1200px',
                  margin: '0 auto',
                }}>
                  {ctasToDisplay.map((cta, index) => (
                    <div
                      key={`cta-${index}`}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        padding: '32px',
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        backdropFilter: 'blur(10px)',
                        borderRadius: '12px',
                        border: `1px solid var(--color-primary-bg, #E11D48)30`,
                        width: '100%',
                      }}
                    >
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
                      <p style={{
                        fontSize: '1rem',
                        color: 'var(--color-description, #C7CDD6)',
                        lineHeight: 1.6,
                        margin: 0,
                        marginBottom: '20px',
                      }}>
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
                        alignSelf: 'flex-start',
                      }}>
                        Learn More
                      </button>
                    </div>
                  ))}
                </div>
              );
            }
            
            return (
              <div style={{ 
                padding: '40px', 
                textAlign: 'center', 
                color: 'var(--color-heading, #F8FAFC)',
                backgroundColor: 'var(--color-surface, #0E1214)',
              }}>
                <p>No CTA data available.</p>
              </div>
            );
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

