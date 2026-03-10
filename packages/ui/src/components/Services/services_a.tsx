'use client';

import React, { useMemo, useEffect } from "react";
import { useComponentApiData } from "../../utils/apiHelpers";
import { useElementInitialization, useElementHelpers } from "../../utils/componentHelpers";
import { useSectionStyles } from "../../utils/sectionStyles";
import { renderRootElements } from "../../utils/elementRendering";
import { renderEmptyState, getSectionStyles } from "../../utils/componentRendering";
import type { DefaultElement } from "../../utils/componentHelpers";

export type ServicesSectionProps = {
  projectId?: string;
  title?: string;
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
  title: "Our Services",
};

export const template = { ...defaultProps };

// Default elements structure:
// Section (outer container)
//   ├── heading-container (contains "Our Services" TEXT element)
//   │   └── services-heading (text element - "Our Services")
//   └── services-container (loop container - contains service containers)
//       └── service-{id} containers (loop - each service)
//           ├── heading (service name/title)
//           ├── image (service image)
//           └── text (service description)
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
      backgroundColor: 'var(--color-surface, #0E1214)', // Dark background like multicolor theme
      color: 'var(--color-heading, #F8FAFC)', // Light text on dark background
      display: 'flex',
      flexDirection: 'column',
      gap: '48px',
    }
  },
  {
    elId: 'heading-container',
    type: 'container',
    order: 0,
    parentElId: 'section',
    defaultProps: {},
    defaultStyle: {
      display: 'flex',
      justifyContent: 'center',
      width: '100%',
    }
  },
  {
    elId: 'services-heading',
    type: 'heading',
    order: 0,
    parentElId: 'heading-container',
    defaultProps: {
      text: 'Our Services',
      heading: 'Our Services',
      headingTag: 'h2'
    },
    defaultStyle: {
      fontSize: '2.5rem',
      fontWeight: 700,
      backgroundImage: 'linear-gradient(135deg, var(--color-heading, #F8FAFC), var(--color-accent, #F59E0B), var(--color-primary-bg, #E11D48))',
      WebkitBackgroundClip: 'text',
      backgroundClip: 'text',
      color: 'transparent',
      WebkitTextFillColor: 'transparent',
      textAlign: 'center',
      margin: 0,
      backgroundSize: '200% 200%',
    }
  },
  {
    elId: 'services-container',
    type: 'container',
    order: 1,
    parentElId: 'section',
    defaultProps: {},
    defaultStyle: {
      display: 'grid', // User can change this to flex, block, etc.
      gap: '32px',
      width: '100%',
      width: '100%', // Full width - no maxWidth or margin auto
      // DO NOT set gridTemplateColumns here - let it be dynamic based on user selection
    }
  }
] as const;

export const uniqueId = "services_a";

type ServiceData = {
  service_name?: string;
  service_description?: string;
  fas_fa_icon?: string;
  images?: Array<{ url?: string; description?: string }>;
};

type ApiData = {
  services?: ServiceData[];
};

export default function ServicesA(props: ServicesSectionProps) {
  const { __studio, __nodeId, projectId } = props;

  // Debug logging for custom site (disabled for performance)
  // if (typeof window !== 'undefined' && !__studio?.updateCustomElementProps) {
  //   const customElements = __studio?.getCustomElements?.() || [];
  //   console.log('[ServicesA] Rendering in custom site mode', {
  //     projectId,
  //     __nodeId,
  //     hasStudio: !!__studio,
  //     hasGetCustomElements: !!__studio?.getCustomElements,
  //     customElementsCount: customElements.length,
  //     customElements: customElements.map((el: any) => ({ elId: el.elId, type: el.type }))
  //   });
  // }

  // Fetch API data using reusable hook
  const { apiData: apiResponse, loading } = useComponentApiData({
    projectId,
    apiEndpoint: '/custom/v1/get_servicescomponentdata',
    uniqueId: uniqueId, // Send component uniqueId (e.g., 'services_a')
    enabled: !!projectId
  });

  // Transform API response to ApiData format
  const api: ApiData | null = apiResponse ? {
    services: Array.isArray(apiResponse) ? apiResponse : (apiResponse.services || [])
  } : null;

  // Resolve content: API → props → defaults
  const resolved = useMemo(() => {
    return {
      ...defaultProps,
      ...props,
      title: props.title || defaultProps.title,
    };
  }, [props.title]);

  // Get services to display
  const servicesToDisplay = useMemo(() => {
    if (api?.services && api.services.length > 0) {
      return api.services.filter(service => 
        service.service_name && 
        service.service_name.trim() !== '' &&
        !service.service_name.toLowerCase().includes('our services') // Filter out heading text
      );
    }
    return [];
  }, [api?.services]);

  // Initialize default elements using reusable hook
  useElementInitialization({
    __studio,
    __nodeId,
    defaultElements: DEFAULT_ELEMENTS,
    resolvedData: resolved,
    loading,
    skipElements: ['section', 'heading-container'], // These are created as containers first
    containerElements: [
      { elId: 'section', parentElId: undefined },
      { elId: 'heading-container', parentElId: 'section' },
      { elId: 'services-container', parentElId: 'section' }
    ],
    propResolver: (element, resolvedData) => {
      const props: any = {};
      if (element.elId === 'services-heading' && resolvedData.title) {
        props.text = resolvedData.title;
        props.heading = resolvedData.title;
      }
      return props;
    }
  });

  // Initialize service containers when API data arrives (only in builder mode)
  useEffect(() => {
    // Only run in builder mode (when addCustomElement is available)
    if (!__studio || !__studio?.addCustomElement) return;
    if (!api?.services || loading) return;
    
    const customElements = __studio?.getCustomElements?.() || [];
    const servicesContainer = customElements.find((el: any) => el.elId === 'services-container');
    
    if (!servicesContainer) return; // Wait for services-container to be created
    
    // Check if service containers already exist
    const existingServiceContainers = customElements.filter((el: any) => 
      el.elId && el.elId.startsWith('service-')
    );
    
    // Only create if we have services and no existing containers (builder mode only)
    if (servicesToDisplay.length > 0 && existingServiceContainers.length === 0) {
      servicesToDisplay.forEach((service, index) => {
        const serviceId = service.service_name?.toLowerCase().replace(/\s+/g, '-') || `service-${index}`;
        const serviceContainerId = `service-${serviceId}-${index}`;
        const serviceHeadingId = `${serviceContainerId}-heading`;
        const serviceTextId = `${serviceContainerId}-text`;
        const serviceImageId = `${serviceContainerId}-image`;
        
        // Create service container (child of services-container - which is directly under section)
        __studio.addCustomElement?.('container', serviceContainerId, false, 'services-container');
        __studio.updateCustomElementStyle?.(serviceContainerId, {
          display: 'flex',
          flexDirection: 'column',
          border: `1px solid var(--color-primary-bg, #E11D48)15`, // Theme-colored border with opacity
          borderRadius: '8px',
          overflow: 'hidden',
          backgroundColor: 'var(--color-surface, #0E1214)', // Dark background
          boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
          width: '100%',
          // Add transition for smooth hover effects
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          cursor: 'pointer',
        });
        
        // Create heading (service name)
        __studio.addCustomElement?.('heading', serviceHeadingId, false, serviceContainerId);
        __studio.updateCustomElementStyle?.(serviceHeadingId, {
          fontSize: '1.5rem',
          fontWeight: 700,
          backgroundImage: 'linear-gradient(135deg, var(--color-heading, #F8FAFC), var(--color-accent, #F59E0B), var(--color-primary-bg, #E11D48))',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          color: 'transparent',
          WebkitTextFillColor: 'transparent',
          margin: 0,
          padding: '16px 16px 8px 16px',
          backgroundSize: '200% 200%',
          // Add transition for smooth hover effects
          transition: 'color 0.2s ease-in-out',
        });
        __studio.updateCustomElementProps?.(serviceHeadingId, {
          text: service.service_name || 'Service Title',
          heading: service.service_name || 'Service Title',
          headingTag: 'h3',
        });
        
        // Create image
        const firstImage = service.images && service.images.length > 0 ? service.images[0] : null;
        __studio.addCustomElement?.('image', serviceImageId, false, serviceContainerId);
        __studio.updateCustomElementStyle?.(serviceImageId, {
          width: '100%',
          height: '200px',
          objectFit: 'cover',
          // Add transition for smooth hover effects
          transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease-in-out',
        });
        __studio.updateCustomElementProps?.(serviceImageId, {
          imageUrl: firstImage?.url || null,
          imageAlt: service.service_name || 'Service Image',
        });
        
        // Create text (description)
        __studio.addCustomElement?.('text', serviceTextId, false, serviceContainerId);
        __studio.updateCustomElementStyle?.(serviceTextId, {
          fontSize: '1rem',
          color: 'var(--color-description, #C7CDD6)', // Description color
          lineHeight: 1.6,
          margin: 0,
          padding: '0 16px 16px 16px',
        });
        __studio.updateCustomElementProps?.(serviceTextId, {
          text: service.service_description || 'Service description goes here.',
        });
      });
    }
  }, [api?.services, servicesToDisplay, __studio, loading]);

  // Get element helpers using reusable hook
  const { builderMode, getElStyle, getElProps, isElSelected } = useElementHelpers({
    __studio,
    __nodeId,
    fallbackValues: {
      title: resolved.title,
    },
    debug: typeof window !== 'undefined' && (window as any).__DEV__
  });

  // Get section styles using reusable utilities
  const customElements = __studio?.getCustomElements?.() || [];
  const customStyles = getSectionStyles(customElements, getElStyle, 'section', props.style);

  // Build section styles using reusable hook - use dark background like multicolor theme
  const sectionStyle = useSectionStyles({
    customStyles,
    defaultBackground: "var(--color-surface, #0E1214)", // Dark background
    isSelected: isElSelected("section"),
    propsStyle: props.style,
    defaultMinHeight: 400
  });

  return (
    <>
      {/* Hover effects CSS - only apply in non-builder mode */}
      {!builderMode && (
        <style>{`
          /* Service container hover effects - lift and shadow */
          [data-el-id^="service-"]:not([data-el-id$="-heading"]):not([data-el-id$="-text"]):not([data-el-id$="-image"]):hover {
            transform: translateY(-8px) !important;
            box-shadow: 0 12px 28px rgba(0, 0, 0, 0.15) !important;
            border-color: #9ca3af !important;
          }
          
          /* Service image hover effects - zoom */
          [data-el-id^="service-"][data-el-id$="-image"]:hover {
            transform: scale(1.08) !important;
          }
          
          /* Service container hover - image zoom effect */
          [data-el-id^="service-"]:not([data-el-id$="-heading"]):not([data-el-id$="-text"]):not([data-el-id$="-image"]):hover [data-el-id$="-image"] {
            transform: scale(1.1) !important;
          }
          
          /* Service heading hover effect - color change */
          [data-el-id^="service-"][data-el-id$="-heading"]:hover {
            color: #2563eb !important;
          }
          
          /* Service text hover effect - slight color change */
          [data-el-id^="service-"][data-el-id$="-text"]:hover {
            color: #4b5563 !important;
          }
          
          /* Services container - fade other items on hover */
          [data-el-id="services-container"]:hover [data-el-id^="service-"]:not([data-el-id$="-heading"]):not([data-el-id$="-text"]):not([data-el-id$="-image"]):not(:hover) {
            opacity: 0.6;
            transform: scale(0.98);
          }
        `}</style>
      )}
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
      {/* Render elements - ONLY from DB, NO hardcoded elements */}
      {(() => {
        const customElements = __studio?.getCustomElements?.() || [];
        
        // Debug logging (disabled for performance)
        // if (typeof window !== 'undefined') {
        //   console.log('[ServicesA] Rendering elements', {
        //     builderMode,
        //     customElementsCount: customElements.length,
        //     loading,
        //     hasStudio: !!__studio,
        //     hasGetCustomElements: !!__studio?.getCustomElements,
        //     customElements: customElements.map((el: any) => ({ elId: el.elId, type: el.type, order: el.order, parentElId: el.parentElId }))
        //   });
        // }
        
        // In custom site mode, wait for loading to complete before showing empty state
        // Elements should come from DB via __studio.getCustomElements()
        // BUT: If we have API data but no elements in DB, render services directly from API
        if (customElements.length === 0) {
          if (builderMode) {
            // Builder mode: show empty state (elements will be initialized)
            return renderEmptyState({
              builderMode,
              loading,
              loadingMessage: 'Loading services data...',
              initializingMessage: 'Initializing default elements...',
              emptyMessage: '[ServicesA] No elements found - initializing default structure...'
            });
          } else {
            // Custom site mode: if still loading, show loading state
            if (loading) {
              return (
                <div style={{ 
                  padding: '40px', 
                  textAlign: 'center', 
                  color: 'var(--color-heading, #F8FAFC)',
                  backgroundColor: 'var(--color-surface, #0E1214)',
                  minHeight: '200px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <div>
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-4" style={{ borderColor: 'var(--color-primary-bg, #E11D48)' }}></div>
                    <p style={{ fontSize: '14px', color: 'var(--color-description, #C7CDD6)' }}>Loading services...</p>
                  </div>
                </div>
              );
            }
            
            // Custom site mode: If we have API data but no elements in DB, render services directly
            if (servicesToDisplay.length > 0) {
              // console.log('[ServicesA] Rendering services directly from API (no elements in DB)', servicesToDisplay.length);
              return (
                <>
                  {/* Heading Container */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    width: '100%',
                  }}>
                    <h2 style={{
                      fontSize: '2.5rem',
                      fontWeight: 700,
                      backgroundImage: 'linear-gradient(135deg, var(--color-heading, #F8FAFC), var(--color-accent, #F59E0B), var(--color-primary-bg, #E11D48))',
                      WebkitBackgroundClip: 'text',
                      backgroundClip: 'text',
                      color: 'transparent',
                      WebkitTextFillColor: 'transparent',
                      textAlign: 'center',
                      margin: 0,
                      backgroundSize: '200% 200%',
                    }}>
                      {resolved.title || 'Our Services'}
                    </h2>
                  </div>
                  
                  {/* Services Grid Container */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '32px',
                    width: '100%',
                    width: '100%', // Full width - no maxWidth or margin auto
                  }}>
                    {servicesToDisplay.map((service, index) => {
                      const firstImage = service.images && service.images.length > 0 ? service.images[0] : null;
                      return (
                        <div
                          key={`service-${index}`}
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            border: `1px solid var(--color-primary-bg, #E11D48)15`,
                            borderRadius: '8px',
                            overflow: 'hidden',
                            backgroundColor: 'var(--color-surface, #0E1214)',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                            width: '100%',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            cursor: 'pointer',
                          }}
                        >
                          {firstImage?.url && (
                            <img
                              src={firstImage.url}
                              alt={service.service_name || 'Service Image'}
                              style={{
                                width: '100%',
                                height: '200px',
                                objectFit: 'cover',
                              }}
                            />
                          )}
                          <h3 style={{
                            fontSize: '1.5rem',
                            fontWeight: 700,
                            backgroundImage: 'linear-gradient(135deg, var(--color-heading, #F8FAFC), var(--color-accent, #F59E0B), var(--color-primary-bg, #E11D48))',
                            WebkitBackgroundClip: 'text',
                            backgroundClip: 'text',
                            color: 'transparent',
                            WebkitTextFillColor: 'transparent',
                            margin: 0,
                            padding: '16px 16px 8px 16px',
                            backgroundSize: '200% 200%',
                          }}>
                            {service.service_name || 'Service Title'}
                          </h3>
                          <p style={{
                            fontSize: '1rem',
                            color: 'var(--color-description, #C7CDD6)',
                            lineHeight: 1.6,
                            margin: 0,
                            padding: '0 16px 16px 16px',
                          }}>
                            {service.service_description || 'Service description goes here.'}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </>
              );
            }
            
            // No API data and no elements - show fallback
            // console.warn('[ServicesA] No elements found in custom site mode. Component may not have been saved in builder yet.');
            return (
              <div style={{ 
                padding: '40px', 
                textAlign: 'center', 
                color: 'var(--color-heading, #F8FAFC)',
                backgroundColor: 'var(--color-surface, #0E1214)',
                minHeight: '200px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <div>
                  <p style={{ fontSize: '18px', marginBottom: '8px', color: 'var(--color-heading, #F8FAFC)' }}>Services Section</p>
                  <p style={{ fontSize: '14px', color: 'var(--color-description, #C7CDD6)' }}>
                    No services data available. Please configure this section in the builder.
                  </p>
                </div>
              </div>
            );
          }
        }
        
        const sortedElements = [...customElements].sort((a, b) => (a.order || 0) - (b.order || 0));
        
        // Use reusable element rendering function
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
          },
          propResolvers: {
            'services-heading': (elProps, apiData, resolved) => {
              const headingText = elProps.text || resolved?.title || 'Our Services';
              return { text: headingText, heading: headingText };
            }
          },
          apiData: api,
          resolved
        });
      })()}
      
      {loading && <div style={{ color: "#666", marginBottom: 16 }}>Loading...</div>}
      {props.children}
    </section>
    </>
  );
}
