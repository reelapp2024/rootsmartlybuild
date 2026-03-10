import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { DndContext, DragEndEvent } from "@dnd-kit/core";
import { useStudio } from "./store";
import { http } from "./config";
import { preloadCommonFonts, loadGoogleFont } from "@ui/utils/fontLoader";
import { flattenElementsForBuilder } from "@ui/utils/elementStorage";
import { getSectionTemplate } from "./constants";

const DndContextWrapper = DndContext as any;
import Canvas from "./Canvas";
import NodeInspector from "./NodeInspector";
import PageSaveButton from "./components/PageSaveButton";
import ThemeSettingsModal from "./components/ui/ThemeSettingsModal";
import { ThemeProvider } from "@ui/blocks";
import type { Section, Row, Column, Element } from "./types/builder";

type ViewMode = 'desktop' | 'tablet' | 'mobile';

// Helper function to convert a template Node to a Section
export function templateToSection(templateType: string): Section {
  const timestamp = Date.now();
  let counter = 0;

  // Get the template from templates object
  const template = templates[templateType];
  
  // Create a default section structure
  const sectionId = `section-${timestamp}-${counter++}`;
  const rowId = `row-${timestamp}-${counter++}`;
  const colId = `col-${timestamp}-${counter++}`;
  const elementId = `element-${timestamp}-${counter++}`;

  // Extract template props if available
  const templateProps = template?.props || {};
  const templateTitle = templateProps.title || templateProps.heading || 'New Section';
  const templateDescription = templateProps.description || '';

  // Create default element based on template type
  // Try to create appropriate element type based on template
  let defaultElement: Element;
  
  if (templateType === 'hero_a' && templateProps) {
    // For hero_a, create as custom component with 10 elements
    const badgeElId = 'badge';
    const titleElId = 'title';
    const descElId = 'description';
    const textElId = 'subtitle-text';
    const iconElId = 'hero-icon';
    const buttonElId = 'button-primary';
    const buttonSecondaryElId = 'button-secondary';
    const dividerElId = 'divider';
    const imageElId = 'hero-image';
    const linkElId = 'learn-more-link';
    
    // Create 10 custom elements
    const customElements = [
      {
        id: `custom-el-${timestamp}-${counter++}`,
        type: 'badge',
        elId: badgeElId,
        order: 0,
      },
      {
        id: `custom-el-${timestamp}-${counter++}`,
        type: 'heading',
        elId: titleElId,
        order: 1,
      },
      {
        id: `custom-el-${timestamp}-${counter++}`,
        type: 'text',
        elId: descElId,
        order: 2,
      },
      {
        id: `custom-el-${timestamp}-${counter++}`,
        type: 'text',
        elId: textElId,
        order: 3,
      },
      {
        id: `custom-el-${timestamp}-${counter++}`,
        type: 'icon',
        elId: iconElId,
        order: 4,
      },
      {
        id: `custom-el-${timestamp}-${counter++}`,
        type: 'button',
        elId: buttonElId,
        order: 5,
      },
      {
        id: `custom-el-${timestamp}-${counter++}`,
        type: 'button',
        elId: buttonSecondaryElId,
        order: 6,
      },
      {
        id: `custom-el-${timestamp}-${counter++}`,
        type: 'divider',
        elId: dividerElId,
        order: 7,
      },
      {
        id: `custom-el-${timestamp}-${counter++}`,
        type: 'image',
        elId: imageElId,
        order: 8,
      },
      {
        id: `custom-el-${timestamp}-${counter++}`,
        type: 'link',
        elId: linkElId,
        order: 9,
      },
    ];
    
    // Default props
    const customElementProps = {
      [badgeElId]: {
        text: 'New',
      },
      [titleElId]: {
        heading: templateTitle,
        text: templateTitle,
      },
      [descElId]: {
        description: templateDescription || 'We provide exceptional service with dedication and expertise.',
        text: templateDescription || 'We provide exceptional service with dedication and expertise.',
      },
      [textElId]: {
        text: 'Transform your business with our innovative solutions',
      },
      [iconElId]: {
        iconClass: 'fas fa-star',
        iconName: 'star',
      },
      [buttonElId]: {
        buttonText: 'Get Started',
        text: 'Get Started',
      },
      [buttonSecondaryElId]: {
        buttonText: 'Learn More',
        text: 'Learn More',
      },
      [dividerElId]: {},
      [imageElId]: {
        imageUrl: 'https://via.placeholder.com/600x400',
        imageAlt: 'Hero Image',
      },
      [linkElId]: {
        text: 'View Portfolio',
        href: '#portfolio',
      },
    };
    
    // Default styles
    const customElementStyles = {
      [badgeElId]: {
        display: 'inline-block',
        padding: '4px 12px',
        backgroundColor: '#ffffff',
        color: '#667eea',
        borderRadius: '12px',
        fontSize: '0.875rem',
        fontWeight: '600',
        marginBottom: '16px',
      } as React.CSSProperties,
      [titleElId]: {
        fontSize: '3rem',
        fontWeight: '800',
        color: '#ffffff',
        marginBottom: '24px',
        lineHeight: '1.2',
      } as React.CSSProperties,
      [descElId]: {
        fontSize: '1.25rem',
        color: '#f1f5f9',
        marginBottom: '16px',
        lineHeight: '1.6',
      } as React.CSSProperties,
      [textElId]: {
        fontSize: '1rem',
        color: '#e2e8f0',
        marginBottom: '24px',
        lineHeight: '1.5',
      } as React.CSSProperties,
      [iconElId]: {
        fontSize: '2rem',
        color: '#ffffff',
        marginBottom: '16px',
      } as React.CSSProperties,
      [buttonElId]: {
        padding: '12px 24px',
        backgroundColor: '#ffffff',
        color: '#667eea',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '1rem',
        fontWeight: '600',
        marginRight: '12px',
        marginBottom: '16px',
      } as React.CSSProperties,
      [buttonSecondaryElId]: {
        padding: '12px 24px',
        backgroundColor: 'transparent',
        color: '#ffffff',
        border: '2px solid #ffffff',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '1rem',
        fontWeight: '600',
        marginBottom: '16px',
      } as React.CSSProperties,
      [dividerElId]: {
        width: '100%',
        border: 'none',
        borderTop: '1px solid rgba(255,255,255,0.3)',
        margin: '24px 0',
      } as React.CSSProperties,
      [imageElId]: {
        maxWidth: '100%',
        height: 'auto',
        borderRadius: '8px',
        marginTop: '32px',
      } as React.CSSProperties,
      [linkElId]: {
        color: '#ffffff',
        textDecoration: 'underline',
        fontSize: '1rem',
        marginTop: '16px',
        display: 'inline-block',
      } as React.CSSProperties,
      section: {
        backgroundImage: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      } as React.CSSProperties,
    };

    // Create section as custom component
    const defaultSection: Section = {
      id: sectionId,
      customId: `section-hero`,
      componentType: 'hero_a',
      customElements: customElements,
      customElementProps: customElementProps,
      customElementStyles: customElementStyles,
      rows: [{
        id: rowId,
        columns: [{
          id: colId,
          elements: [], // Empty elements, we'll render the component directly
        }],
        styles: {} as any,
      }],
      styles: {
        padding: '80px 40px',
        backgroundColor: '#ffffff',
      } as any,
    };

    return defaultSection;
  } else if (templateType === 'HeroWithBackground' && templateProps) {
    // For HeroWithBackground (old template), create heading and description elements with API support
    const headingId = `element-${timestamp}-${counter++}`;
    const descId = `element-${timestamp}-${counter++}`;
    
    // Create heading element with API configuration for dynamic content
    const headingElement: Element = {
      id: headingId,
      type: 'heading',
      content: {
        heading: templateTitle,
      },
      styles: {
        textColor: '#0f172a',
        backgroundColor: 'transparent',
        padding: '0px',
        headingFontSize: '2.5rem',
        headingFontWeight: '800',
        textAlign: 'center',
        marginBottom: '20px',
      },
      // Enable API for dynamic content from hero endpoint
      api: {
        enabled: true,
        url: 'http://localhost:1111/api/monorepo/hero',
        method: 'GET',
        refreshInterval: 0,
        dataPath: 'title', // Extract title from API response
        fallbackToContent: true,
      },
    };
    
    // Create description element with API configuration
    const descriptionElement: Element = {
      id: descId,
      type: 'text',
      content: {
        description: templateDescription,
      },
      styles: {
        textColor: '#334155',
        backgroundColor: 'transparent',
        padding: '0px',
        textAlign: 'center',
        marginBottom: '28px',
      } as any,
      // Enable API for dynamic content from hero endpoint
      api: {
        enabled: true,
        url: 'http://localhost:1111/api/monorepo/hero',
        method: 'GET',
        refreshInterval: 0,
        dataPath: 'description', // Extract description from API response
        fallbackToContent: true,
      },
    };
    
    // Create column with overlay effect (white background with transparency)
    const defaultColumn: Column = {
      id: colId,
      elements: [headingElement, descriptionElement],
      styles: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)', // Overlay effect
        padding: '28px',
        maxWidth: '600px',
        margin: '0 auto', // Center the column
        borderRadius: '8px',
      },
    };

    const defaultRow: Row = {
      id: rowId,
      columns: [defaultColumn],
      styles: {
        backgroundColor: 'transparent',
        padding: '0px',
        justifyContent: 'center',
        alignItems: 'center',
      } as any,
    };

    // STEP 1: Use SECTION_TEMPLATES for default styles with new background object architecture
    const defaultTemplate = getSectionTemplate('hero_a');
    const templateStyles = defaultTemplate.styles || {};
    
    // Section styles matching original HeroWithBackground design
    const sectionStyles: any = {
      ...templateStyles, // Start with template defaults
      padding: templateStyles.padding || '72px 40px',
      minHeight: templateStyles.minHeight || '420px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      position: 'relative',
      overflow: 'hidden',
    };
    
    // If template has backgroundImage, override the background object
    if (templateProps.backgroundImage) {
      sectionStyles.background = {
        type: 'image',
        image: {
          url: templateProps.backgroundImage,
          position: 'center',
          size: 'cover',
          repeat: 'no-repeat',
        },
        overlay: sectionStyles.background?.overlay || {
          enabled: false,
          color: '#000000',
          opacity: 0.5,
          blendMode: 'normal',
        },
      };
      sectionStyles.backgroundImage = templateProps.backgroundImage; // Legacy
      sectionStyles.backgroundSize = 'cover';
      sectionStyles.backgroundPosition = 'center';
      sectionStyles.backgroundRepeat = 'no-repeat';
    } else if (!sectionStyles.background) {
      // Use default from template (already set above)
      // Ensure legacy properties are set for backward compatibility
      if (sectionStyles.background?.type === 'image' && sectionStyles.background.image?.url) {
        sectionStyles.backgroundImage = sectionStyles.background.image.url;
        sectionStyles.backgroundSize = sectionStyles.background.image.size || 'cover';
        sectionStyles.backgroundPosition = sectionStyles.background.image.position || 'center';
        sectionStyles.backgroundRepeat = sectionStyles.background.image.repeat || 'no-repeat';
      }
    }

    const defaultSection: Section = {
      id: sectionId,
      rows: [defaultRow],
      styles: sectionStyles,
    };

    return defaultSection;
  } else if (templateType === 'FeaturesSection' && templateProps) {
    // For Features Section templates, create heading, subtitle, and feature cards
    const headingId = `element-${timestamp}-${counter++}`;
    const subtitleId = `element-${timestamp}-${counter++}`;
    
    // Create heading element (matching HeroWithBackground colors)
    const headingElement: Element = {
      id: headingId,
      type: 'heading',
      content: {
        heading: templateProps.title || 'Our Amazing Features',
      },
      styles: {
        textColor: '#0f172a', // Match HeroWithBackground title color
        backgroundColor: 'transparent',
        padding: '0px',
        headingFontSize: '2.5rem',
        headingFontWeight: '700',
        textAlign: 'center',
        marginBottom: '16px',
      },
      api: {
        enabled: true,
        url: 'http://localhost:1111/api/monorepo/features',
        method: 'GET',
        refreshInterval: 0,
        dataPath: 'title',
        fallbackToContent: true,
      },
    };
    
    // Create subtitle element (matching HeroWithBackground description color)
    const subtitleElement: Element = {
      id: subtitleId,
      type: 'text',
      content: {
        description: templateProps.subtitle || 'Discover what makes us special',
      },
      styles: {
        textColor: '#334155', // Match HeroWithBackground description color
        backgroundColor: 'transparent',
        padding: '0px',
        textAlign: 'center',
        marginBottom: '48px',
      } as any,
      api: {
        enabled: true,
        url: 'http://localhost:1111/api/monorepo/features',
        method: 'GET',
        refreshInterval: 0,
        dataPath: 'subtitle',
        fallbackToContent: true,
      },
    };
    
    // Create features row with columns (3 features = 3 columns)
    const features = templateProps.features || [
      { title: 'Feature 1', description: 'Description 1', icon: '✨' },
      { title: 'Feature 2', description: 'Description 2', icon: '🚀' },
      { title: 'Feature 3', description: 'Description 3', icon: '💡' }
    ];
    
    const featureColumns: Column[] = features.slice(0, 3).map((feature: any, idx: number) => {
      const featureHeadingId = `element-${timestamp}-${counter++}`;
      const featureDescId = `element-${timestamp}-${counter++}`;
      
      const featureHeading: Element = {
        id: featureHeadingId,
        type: 'heading',
        content: {
          heading: feature.title || `Feature ${idx + 1}`,
        },
        styles: {
          textColor: '#0f172a', // Match default heading color
          backgroundColor: 'transparent',
          padding: '0px',
          headingFontSize: '1.25rem',
          headingFontWeight: '600',
          textAlign: 'center',
          marginBottom: '8px',
        },
      };
      
      const featureDescription: Element = {
        id: featureDescId,
        type: 'text',
        content: {
          description: feature.description || `Description for feature ${idx + 1}`,
        },
        styles: {
          textColor: '#334155', // Match default description color
          backgroundColor: 'transparent',
          padding: '0px',
          textAlign: 'center',
          lineHeight: '1.6',
        } as any,
      };
      
      return {
        id: `col-${timestamp}-${counter++}`,
        elements: [featureHeading, featureDescription],
        styles: {
          backgroundColor: '#f8fafc',
          padding: '24px',
          borderRadius: '12px',
          borderWidth: '1px',
          borderStyle: 'solid',
          borderColor: '#e2e8f0',
        },
      };
    });
    
    // Header row with title and subtitle
    const headerColumn: Column = {
      id: `col-${timestamp}-${counter++}`,
      elements: [headingElement, subtitleElement],
      styles: {
        backgroundColor: 'transparent',
        padding: '0px',
        maxWidth: '800px',
        margin: '0 auto',
      },
    };
    
    const headerRow: Row = {
      id: `row-${timestamp}-${counter++}`,
      columns: [headerColumn],
      styles: {
        backgroundColor: 'transparent',
        padding: '0px',
        justifyContent: 'center',
        alignItems: 'center',
      } as any,
    };
    
    // Features row with feature columns
    const featuresRow: Row = {
      id: `row-${timestamp}-${counter++}`,
      columns: featureColumns,
      styles: {
        backgroundColor: 'transparent',
        padding: '32px 0px 0px 0px',
        gap: '32px',
        flexWrap: 'wrap',
      } as any,
    };
    
    // Section styles
    const sectionStyles: any = {
      backgroundColor: '#ffffff',
      padding: '80px 40px',
      maxWidth: '1200px',
      margin: '0 auto',
    };

    const defaultSection: Section = {
      id: sectionId,
      rows: [headerRow, featuresRow],
      styles: sectionStyles,
    };

    return defaultSection;
  } else if (false && templateType === 'AllElementsSection' && templateProps) {
    // REMOVED: AllElementsSection template - component no longer exists
    // For All Elements Section - create a section with all element types
    const headingId = `element-${timestamp}-${counter++}`;
    
    // Main heading
    const headingElement: Element = {
      id: headingId,
      type: 'heading',
      content: {
        heading: templateProps.title || 'All Elements Showcase',
      },
      styles: {
        textColor: '#0f172a',
        backgroundColor: 'transparent',
        padding: '0px',
        headingFontSize: '2.5rem',
        headingFontWeight: '700',
        textAlign: 'center',
        marginBottom: '48px',
      },
    };

    // Create elements for each type
    const elementTypes: Array<{ type: Element['type']; label: string }> = [
      { type: 'heading', label: 'Heading' },
      { type: 'text', label: 'Text' },
      { type: 'text', label: 'Text' },
      { type: 'button', label: 'Button' },
      { type: 'image', label: 'Image' },
      { type: 'video', label: 'Video' },
      { type: 'icon', label: 'Icon' },
      { type: 'html', label: 'HTML' },
    ];

    // Create columns with elements (2 elements per column)
    const elementColumns: Column[] = [];
    for (let i = 0; i < elementTypes.length; i += 2) {
      const colElements: Element[] = [];
      
      // First element in column
      const el1 = elementTypes[i];
      const el1Id = `element-${timestamp}-${counter++}`;
      colElements.push({
        id: el1Id,
        type: el1.type,
        content: el1.type === 'heading' ? { heading: `${el1.label} Element` } :
                 el1.type === 'text' ? { text: `This is a ${el1.label.toLowerCase()} element` } :
                 el1.type === 'text' ? { text: `This is a ${el1.label.toLowerCase()} element with HTML support` } :
                 el1.type === 'button' ? { text: 'Click Me' } :
                 el1.type === 'image' ? { imageUrl: '' } :
                 el1.type === 'video' ? { videoUrl: '' } :
                 el1.type === 'icon' ? { htmlCodeDesktop: '<svg>...</svg>' } :
                 { htmlCodeDesktop: `<div>${el1.label} Element</div>` },
        styles: {
          textColor: '#0f172a',
          backgroundColor: '#f8fafc',
          padding: '24px',
          borderRadius: '12px',
          borderWidth: '1px',
          borderStyle: 'solid',
          borderColor: '#e2e8f0',
        },
      });

      // Second element in column (if exists)
      if (i + 1 < elementTypes.length) {
        const el2 = elementTypes[i + 1];
        const el2Id = `element-${timestamp}-${counter++}`;
        colElements.push({
          id: el2Id,
          type: el2.type,
          content: el2.type === 'heading' ? { heading: `${el2.label} Element` } :
                   el2.type === 'text' ? { text: `This is a ${el2.label.toLowerCase()} element` } :
                   el2.type === 'text' ? { text: `This is a ${el2.label.toLowerCase()} element with HTML support` } :
                   el2.type === 'button' ? { text: 'Click Me' } :
                   el2.type === 'image' ? { imageUrl: '' } :
                   el2.type === 'video' ? { videoUrl: '' } :
                   el2.type === 'icon' ? { htmlCodeDesktop: '<svg>...</svg>' } :
                   { htmlCodeDesktop: `<div>${el2.label} Element</div>` },
          styles: {
            textColor: '#0f172a',
            backgroundColor: '#f8fafc',
            padding: '24px',
            borderRadius: '12px',
            borderWidth: '1px',
            borderStyle: 'solid',
            borderColor: '#e2e8f0',
          },
        });
      }

      elementColumns.push({
        id: `col-${timestamp}-${counter++}`,
        elements: colElements,
        styles: {
          backgroundColor: 'transparent',
          padding: '0px',
        },
      });
    }

    // Header row with title
    const headerColumn: Column = {
      id: `col-${timestamp}-${counter++}`,
      elements: [headingElement],
      styles: {
        backgroundColor: 'transparent',
        padding: '0px',
        maxWidth: '800px',
        margin: '0 auto',
      },
    };

    const headerRow: Row = {
      id: `row-${timestamp}-${counter++}`,
      columns: [headerColumn],
      styles: {
        backgroundColor: 'transparent',
        padding: '0px',
        justifyContent: 'center',
        alignItems: 'center',
      } as any,
    };

    // Elements row with all element columns
    const elementsRow: Row = {
      id: `row-${timestamp}-${counter++}`,
      columns: elementColumns,
      styles: {
        backgroundColor: 'transparent',
        padding: '48px 0px 0px 0px',
        gap: '32px',
        flexWrap: 'wrap',
      } as any,
    };

    // Section styles
    const sectionStyles: any = {
      backgroundColor: '#ffffff',
      padding: '80px 40px',
      maxWidth: '1200px',
      margin: '0 auto',
    };

    const defaultSection: Section = {
      id: sectionId,
      rows: [headerRow, elementsRow],
      styles: sectionStyles,
    };

    return defaultSection;
  } else if (templateType === 'ContentSection' && templateProps) {
    // For Content Section templates, create heading and description elements
    const headingId = `element-${timestamp}-${counter++}`;
    const descId = `element-${timestamp}-${counter++}`;
    
    // Create heading element
    const headingElement: Element = {
      id: headingId,
      type: 'heading',
      content: {
        heading: templateTitle,
      },
      styles: {
        textColor: '#1e293b',
        backgroundColor: 'transparent',
        padding: '0px',
        headingFontSize: '2.5rem',
        headingFontWeight: '700',
        textAlign: 'center',
        marginBottom: '24px',
      },
    };
    
    // Create description element
    const descriptionElement: Element = {
      id: descId,
      type: 'text',
      content: {
        description: templateDescription,
      },
      styles: {
        textColor: '#64748b',
        backgroundColor: 'transparent',
        padding: '0px',
        textAlign: 'center',
        lineHeight: '1.8',
      } as any,
    };
    
    // Create column with elements
    const defaultColumn: Column = {
      id: colId,
      elements: [headingElement, descriptionElement],
      styles: {
        backgroundColor: 'transparent',
        padding: '0px',
        maxWidth: '800px',
        margin: '0 auto',
      },
    };

    const defaultRow: Row = {
      id: rowId,
      columns: [defaultColumn],
      styles: {
        backgroundColor: 'transparent',
        padding: '0px',
        justifyContent: 'center',
        alignItems: 'center',
      } as any,
    };

    // STEP 1: Use SECTION_TEMPLATES for default styles
    const defaultTemplate = getSectionTemplate('content_a');
    const templateStyles = defaultTemplate.styles || {};
    
    // Section styles matching content section design
    const sectionStyles: any = {
      ...templateStyles, // Start with template defaults
      backgroundColor: template?.style?.background || template?.style?.backgroundColor || templateStyles.backgroundColor || '#ffffff',
      padding: template?.style?.padding || templateStyles.padding || '80px 40px',
      maxWidth: templateStyles.maxWidth || '1200px',
      margin: templateStyles.margin || '0 auto',
    };

    const defaultSection: Section = {
      id: sectionId,
      rows: [defaultRow],
      styles: sectionStyles,
    };

    return defaultSection;
  } else {
    // Default template structure
    defaultElement = {
      id: elementId,
      type: 'heading',
      content: {
        heading: templateType === 'DummyTemplate' ? 'New Section' : templateTitle || 'New Heading',
      },
      styles: {
        textColor: '#000000',
        backgroundColor: 'transparent',
        padding: '0px',
        headingFontSize: '2rem',
        headingFontWeight: '700',
        textAlign: 'center',
      },
    };

    const defaultColumn: Column = {
      id: colId,
      elements: [defaultElement],
      styles: {
        backgroundColor: '#ffffff',
        padding: '40px',
      },
    };

    const defaultRow: Row = {
      id: rowId,
      columns: [defaultColumn],
      styles: {
        backgroundColor: '#f3f4f6',
        padding: '20px',
      },
    };

    // STEP 1: Use SECTION_TEMPLATES for default styles
    const defaultTemplate = getSectionTemplate('default');
    const templateStyles = defaultTemplate.styles || {};
    
    const defaultSection: Section = {
      id: sectionId,
      rows: [defaultRow],
      styles: {
        ...templateStyles, // Start with template defaults
        backgroundColor: String(template?.style?.background || template?.style?.backgroundColor || templateStyles.backgroundColor || '#e5e7eb'),
        padding: String(template?.style?.padding || templateStyles.padding || '40px'),
      },
    };

    return defaultSection;
  }
}

// Error Boundary Component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null; errorInfo: React.ErrorInfo | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Studio Builder Error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '20px',
          backgroundColor: '#fee',
          border: '2px solid #f00',
          margin: '20px',
          fontFamily: 'monospace',
          fontSize: '14px',
          maxHeight: '80vh',
          overflow: 'auto'
        }}>
          <h1 style={{ color: '#c00', marginTop: 0 }}>❌ Studio Builder Error</h1>
          <h2>Error Message:</h2>
          <pre style={{ background: '#fff', padding: '10px', borderRadius: '4px', overflow: 'auto' }}>
            {this.state.error?.toString() || 'Unknown error'}
          </pre>
          {this.state.errorInfo && (
            <>
              <h2>Component Stack:</h2>
              <pre style={{ background: '#fff', padding: '10px', borderRadius: '4px', overflow: 'auto', fontSize: '12px' }}>
                {this.state.errorInfo.componentStack}
              </pre>
              <h2>Stack Trace:</h2>
              <pre style={{ background: '#fff', padding: '10px', borderRadius: '4px', overflow: 'auto', fontSize: '12px' }}>
                {this.state.error?.stack}
              </pre>
            </>
          )}
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 20px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              marginTop: '10px'
            }}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

function AppContent() {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('projectId') || '';
  const pageId = searchParams.get('pageId') || ''; // Get pageId from URL
  // Debug info state removed - not needed for end users
  const [error, setError] = useState<string | null>(null);
  
  // Preload all available fonts when builder loads
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Preload common fonts
      preloadCommonFonts();
      
      // Preload all available fonts from the font dropdown
      const allFonts = [
        'Roboto, sans-serif',
        'Open Sans, sans-serif',
        'Lato, sans-serif',
        'Montserrat, sans-serif',
        'Playfair Display, serif',
        'Raleway, sans-serif',
        'Poppins, sans-serif',
        'Inter, sans-serif',
        'Nunito, sans-serif',
        'Oswald, sans-serif',
        'Merriweather, serif',
        'Source Sans Pro, sans-serif',
        'Ubuntu, sans-serif',
        'Dancing Script, cursive',
        'Pacifico, cursive',
        'Comfortaa, sans-serif',
        'Bebas Neue, sans-serif',
        'Crimson Text, serif',
      ];
      
      // Load all fonts immediately
      allFonts.forEach(font => {
        loadGoogleFont(font);
      });
      
      console.log('[App] Preloaded all available fonts for builder');
    }
  }, []);
  
  // Set API URL globally for components to use
  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:1111';
    if (typeof window !== 'undefined') {
      (window as any).__API_URL__ = apiUrl;
      console.log('[Builder] Set global API URL:', apiUrl);
      // Also set in __ENV__ for compatibility
      if (!(window as any).__ENV__) {
        (window as any).__ENV__ = {};
      }
      (window as any).__ENV__.VITE_API_URL = apiUrl;
    }
  }, []);
  
  const {
    sections,
    addSection,
    insertSectionAt,
    moveSection,
    setSelectedElement,
    activeBreakpoint,
    setActiveBreakpoint,
    builderMode,
    theme,
    font,
    selectedElement,
    setSections,
    moveCustomElement,
  } = useStudio();
  
  // Load design data when projectId is present
  const [designDataLoaded, setDesignDataLoaded] = useState(false);
  
  // Load design data when projectId is present and sections are empty
  useEffect(() => {
    // Early returns
    if (!projectId) {
      return;
    }
    
    if (designDataLoaded) {
      return;
    }
    
    if (sections.length > 0) {
      setDesignDataLoaded(true);
      return;
    }
    
    // Load the data
    const loadDesignData = async () => {
      try {
        const token = localStorage.getItem('token');
        
        if (!token) {
          console.error('[Builder] No authentication token found');
          setDesignDataLoaded(true);
          return;
        }
        
        const response = await http.get(`/getWebsiteDesignData/${projectId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });


        console.log(response, "response from getwebsiteDesignDATa")

        if (response.data?.data) {
          const designData = response.data.data;

          // Find the page to load
          // Use new 'pages' structure, fallback to 'selectPages' for backward compatibility
          const pagesArray = designData.pages || designData.selectPages || [];
          let selectedPage = null;
          
          if (pagesArray.length > 0) {
            // If pageId is provided in URL, find that specific page
            if (pageId) {
              selectedPage = pagesArray.find(
                (page: any) => {
                  const currentPageId = page.pageId?._id || page.pageId;
                  return String(currentPageId) === String(pageId);
                }
              );
            }
            
            // If no pageId or page not found, find homepage (or use first page)
            if (!selectedPage) {
              selectedPage = pagesArray.find(
                (page: any) => {
                  const pageName = (page.pageId?.name || '').toLowerCase().trim();
                  const pageDisplayName = (page.pageId?.displayName || '').toLowerCase().trim();
                  const isHome = pageName === 'home' || 
                                pageName === 'homepage' ||
                                pageDisplayName === 'home' ||
                                pageDisplayName === 'homepage';
                  return isHome;
                }
              ) || pagesArray[0];
              
              if (!selectedPage) {
                selectedPage = pagesArray[0];
              }
            }
          }
          
          // If pageId is provided but page not found, create it
          // Note: Page creation will happen on save, but we can log a warning here
          if (pageId && !selectedPage) {
            console.warn(`[Builder] Page ${pageId} not found in database. It will be created when you save.`);
          }

          // PRIORITY: Check layout first (element-only pages), then componentIds (component-backed pages)
          // This ensures layout-based pages load correctly
          const layout = selectedPage?.layout;
          const components = selectedPage?.componentIds || [];
          const hasNewStructure = components.length > 0 && typeof components[0] === 'object' && components[0].componentId;
          
          // PRIORITY 1: Load from layout JSON if available (element-only pages)
          if (selectedPage && layout && Array.isArray(layout) && layout.length > 0) {
            console.log('[Builder] Loading element-only page from layout JSON:', layout.length, 'sections');
            
            // Process layout sections
            const layoutSections: Section[] = layout.map((layoutSection: any, index: number) => {
              const timestamp = Date.now();
              const sectionId = layoutSection.sectionId || `section-${timestamp}-${index}`;
              const rowId = `row-${timestamp}-${index}`;
              const colId = `col-${timestamp}-${index}`;
              
              // Check if layout has hierarchical elements (new format) or flat customElements (old format)
              let customElements: Array<{ id: string; type: string; elId: string; order: number; parentElId?: string }> = [];
              let customElementProps: Record<string, any> = {};
              let customElementStyles: Record<string, React.CSSProperties> = {};
              
              if (layoutSection.elements && Array.isArray(layoutSection.elements) && layoutSection.elements.length > 0) {
                // NEW FORMAT: Hierarchical elements (same as component elementIds)
                console.log(`[Builder] Section ${index + 1}: Loading hierarchical elements (new format)`);
                const flattened = flattenElementsForBuilder(layoutSection.elements);
                customElements = flattened.customElements;
                customElementProps = flattened.customElementProps;
                customElementStyles = flattened.customElementStyles;
              } else if (layoutSection.customElements && Array.isArray(layoutSection.customElements) && layoutSection.customElements.length > 0) {
                // OLD FORMAT: Flat customElements (backward compatibility)
                console.log(`[Builder] Section ${index + 1}: Loading flat customElements (old format - backward compatibility)`);
                customElements = layoutSection.customElements;
                customElementProps = layoutSection.customElementProps || {};
                customElementStyles = layoutSection.customElementStyles || {};
              } else {
                // No elements - empty section
                console.log(`[Builder] Section ${index + 1}: No elements found`);
              }
              
              // Convert layout section to Section format
              const section: Section = {
                id: sectionId,
                customId: `section-${layoutSection.componentType || 'layout'}-${index}`,
                componentType: layoutSection.componentType || 'hero_a', // Default to hero_a for rendering
                projectId: projectId,
                customElements: customElements,
                customElementProps: customElementProps,
                customElementStyles: customElementStyles,
                rows: [{
                  id: rowId,
                  columns: [{
                    id: colId,
                    elements: [], // Empty elements, we'll render using customElements
                  }],
                  styles: {} as any,
                }],
                styles: layoutSection.styles || {
                  padding: '60px 40px',
                  backgroundColor: '#ffffff',
                  minHeight: '200px',
                } as any,
              };
              
              return section;
            });
            
            if (layoutSections.length > 0) {
              console.log('[Builder] ========================================');
              console.log('[Builder] SUCCESS: Loading', layoutSections.length, 'sections from layout JSON');
              console.log('[Builder] Sections:', layoutSections.map(s => ({ id: s.id, componentType: s.componentType })));
              console.log('[Builder] ========================================');
              setSections(layoutSections);
              setDesignDataLoaded(true);
            } else {
              console.warn('[Builder] Layout JSON is empty');
              setDesignDataLoaded(true);
            }
          }
          // PRIORITY 2: Load from componentIds if available (component-backed pages)
          else if (selectedPage && components.length > 0) {
            const newSections: Section[] = [];
            const timestamp = Date.now();
            let counter = 0;

            // Map component names to registry component types
            // Component IDs from defaultPages: "hero", "services", "cta"
            const componentNameMap: Record<string, string> = {
              'hero': 'hero_a',
              'herosection': 'hero_a',
              'service': 'services_a',
              'services': 'services_a',
              'servicessection': 'services_a',
              'cta': 'cta_a',
            };

            // Map uniqueId to variant component types (new format: {name}_{variant})
            // Support both new format (hero_a) and legacy format (herosectionvarianta)
            const uniqueIdToComponentMap: Record<string, string> = {
              // New format - only keep required components
              'hero_a': 'hero_a',
              'hero_b': 'hero_b',
              'hero_c': 'hero_c',
              'services_a': 'services_a',
              'cta_a': 'cta_a',
              'cta_b': 'cta_b',
              'cta_c': 'cta_c',
              'cta_d': 'cta_d',
              // Legacy format (for backward compatibility)
              'herosectionvarianta': 'hero_a',
              'herosectionvariantb': 'hero_b',
              'herosectionvariantc': 'hero_c',
            };

            // Create sections for each component
            // Process components - handle both populated and unpopulated componentIds
            for (let index = 0; index < components.length; index++) {
              const componentData = components[index];
              
              // Extract component from new structure or use directly from old structure
              // componentData can be:
              // 1. New structure: { componentId: ObjectId or populated object, variant, style, elementIds }
              // 2. Old structure: Just the componentId (ObjectId or populated object)
              let component: any;
              let componentStyle: any = {};
              let elementIds: any[] = [];
              
              if (hasNewStructure) {
                // New structure: componentData is an object with componentId, variant, style, elementIds
                component = componentData.componentId;
                componentStyle = componentData.style || {};
                elementIds = componentData.elementIds || [];
              } else {
                // Old structure: componentData is directly the componentId (ObjectId or populated object)
                component = componentData;
              }
              
              // Handle case where componentId might be just an ObjectId string (not populated)
              // Check if component is populated (has name or uniqueId)
              let componentId: string | undefined = typeof component === 'string' 
                ? component 
                : (component?._id?.toString() || component?._id || component?.toString());
              
              const isPopulated = component && (component.name || component.uniqueId || component.displayName);
              
              // If component is not populated but we have componentId, try to fetch it
              if (!isPopulated && componentId) {
                console.warn(`[Builder] Component ${index + 1} not populated (componentId: ${componentId}), trying to fetch...`);
                try {
                  const token = localStorage.getItem('token');
                  const compResponse = await http.get(`/getWebsiteComponent/${componentId}`, {
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                  });
                  if (compResponse.data && compResponse.data.component) {
                    component = compResponse.data.component;
                    componentId = String(compResponse.data.component._id || compResponse.data.component.id);
                    console.log(`[Builder] Successfully fetched component ${componentId}`);
                  } else {
                    console.warn(`[Builder] Component ${componentId} not found in database, will create it on save`);
                    // Set componentId to undefined so it gets created on save
                    componentId = undefined;
                  }
                } catch (err) {
                  console.warn(`[Builder] Failed to fetch component ${componentId}, will create it on save:`, err);
                  // Set componentId to undefined so it gets created on save
                  componentId = undefined;
                }
              }
              
              // If no component or componentId, we'll still create the section
              // Component will be created when saving
              if (!component && !componentId) {
                console.warn(`[Builder] Component ${index + 1} has no componentId, will create on save. Using componentType from mapping.`);
                componentId = undefined; // Ensure it's undefined so save logic can create it
              }
              
              console.log(`[Builder] Processing component ${index + 1}:`, {
                component: component,
                _id: component?._id,
                name: component?.name,
                variant: component?.variant,
                uniqueId: component?.uniqueId,
                pageId: component?.pageId,
                hasStyle: !!componentStyle,
                elementIdsCount: elementIds.length
              });
              
              // First, check if compData has uniqueId (primary field - what we save in database)
              // Then fall back to component?.uniqueId for backward compatibility
              let componentType: string | undefined;
              const uniqueId = (hasNewStructure && componentData.uniqueId) 
                ? componentData.uniqueId.toLowerCase().trim()
                : (component?.uniqueId ? component.uniqueId.toLowerCase().trim() : null);
              
              if (uniqueId) {
                componentType = uniqueIdToComponentMap[uniqueId] || uniqueId; // Use uniqueId directly if not in map
                if (componentType) {
                  console.log(`[Builder] Component ${index + 1} mapped by uniqueId: ${uniqueId} -> ${componentType}`);
                }
              }
              
              // If no variant found, fall back to name-based mapping
              if (!componentType) {
                const componentName = (component?.name || '').toLowerCase().trim();
                const variant = (component?.variant || 'a').toLowerCase();
                // Map to new format: {name}_{variant}
                componentType = componentNameMap[componentName] || 
                               (componentName.includes('hero') ? `hero_${variant}` :
                                componentName.includes('testimonial') ? `testimonial_${variant}` :
                                componentName.includes('faq') ? `faq_${variant}` :
                                componentName.includes('process') ? `process_${variant}` :
                                componentName.includes('service') ? `services_${variant}` :
                                componentName.includes('feature') ? `features_${variant}` : 
                                componentName ? `${componentName}_${variant}` : 'hero_a'); // Default fallback
              }
              
              // Ensure componentType is set - use uniqueId if available, otherwise fallback
              if (!componentType && uniqueId) {
                componentType = uniqueId; // Use uniqueId directly as componentType
              }
              
              // Final fallback - ensure we always have a componentType
              if (!componentType) {
                componentType = 'hero_a'; // Default fallback
              }
              
              console.log(`[Builder] Component ${index + 1} mapping:`, {
                compDataUniqueId: componentData.uniqueId,
                originalName: component?.name,
                variant: component?.variant,
                componentUniqueId: component?.uniqueId,
                finalUniqueId: uniqueId,
                mappedTo: componentType
              });

              const sectionId = `section-${timestamp}-${counter++}`;
              const rowId = `row-${timestamp}-${counter++}`;
              const colId = `col-${timestamp}-${counter++}`;

              // Initialize default elements for HeroSection
              let customElements: Array<{ id: string; type: string; elId: string; order: number }> = [];
              let customElementProps: Record<string, any> = {};
              let customElementStyles: Record<string, React.CSSProperties> = {};
              
              // Log elementIds status for debugging
              console.log(`[Builder] Component ${index + 1} elementIds:`, {
                hasNewStructure,
                elementIds,
                elementIdsLength: elementIds?.length || 0,
                isEmpty: Array.isArray(elementIds) && elementIds.length === 0
              });
              
              // Load elements from database if available (new structure)
              // If elementIds is empty array (fresh website), don't load any elements
              // Component will detect empty customElements and show hardcoded elements
              if (hasNewStructure && elementIds && Array.isArray(elementIds) && elementIds.length > 0) {
                // Helper function to flatten hierarchical structure to flat array with parentElId
                const flattenElements = (elements: any[], parentElId?: string): Array<{ elementId: string; elementType: string; style: any; data: any; order: number; children?: any[] }> => {
                  const flattened: any[] = [];
                  
                  elements.forEach((elementData: any) => {
                    // Add current element
                    flattened.push({
                      elementId: elementData.elementId,
                      elementType: elementData.elementType || elementData.elementType,
                      style: elementData.style || {},
                      data: elementData.data || {},
                      order: elementData.order || 0,
                      parentElId: parentElId,
                      children: elementData.children || []
                    });
                    
                    // Recursively flatten children
                    if (elementData.children && Array.isArray(elementData.children) && elementData.children.length > 0) {
                      const childElements = flattenElements(elementData.children, elementData.elementId);
                      flattened.push(...childElements);
                    }
                  });
                  
                  return flattened;
                };
                
                // Flatten hierarchical structure to flat array
                const flattenedElements = flattenElements(elementIds || []);
                
                flattenedElements.forEach((elementData: any, elIdx: number) => {
                  // elementIds structure: { elementId: string, elementType: string, style: object, data: object, order: number }
                  const elementId = elementData.elementId || elementData;
                  const elementType = elementData.elementType || elementId; // Use elementType from DB, fallback to elementId
                  const elementOrder = elementData.order !== undefined ? elementData.order : elIdx; // Use order from DB
                  
                  // Valid element types from DEFAULT_ELEMENT_STRUCTURES
                  const validElementTypes = ['heading', 'text', 'description', 'button', 'image', 'video', 'icon', 'link', 'divider', 'spacer', 'container', 'html', 'list', 'input', 'textarea', 'select', 'label', 'badge', 'form'];
                  
                  // Fallback mapping if elementType is not in DB or is invalid (for backward compatibility)
                  let finalElementType = elementType;
                  // Check if elementType is valid, if not, try to map from elementId
                  if (!elementType || elementType === elementId || !validElementTypes.includes(elementType)) {
                    // Simple mapping for common elementIds (backward compatibility)
                    // Check prefixes first (most specific)
                    if (elementId.startsWith('html-') || elementId.startsWith('html')) {
                      finalElementType = 'html';
                    } else if (elementId.startsWith('textarea-') || elementId.startsWith('textarea')) {
                      finalElementType = 'textarea';
                    } else if (elementId.startsWith('label-') || elementId.startsWith('label')) {
                      finalElementType = 'label';
                    } else if (elementId.startsWith('container-') || elementId.startsWith('container')) {
                      finalElementType = 'container';
                    } else if (elementId.startsWith('input-') || elementId.startsWith('input')) {
                      finalElementType = 'input';
                    } else if (elementId.startsWith('select-') || elementId.startsWith('select')) {
                      finalElementType = 'select';
                    } else if (elementId.startsWith('form-') || elementId.startsWith('form')) {
                      finalElementType = 'form';
                    } else if (elementId.startsWith('row-') || elementId.startsWith('row') || elementId.startsWith('column-') || elementId.startsWith('column') || elementId.startsWith('col-')) {
                      // Legacy row/column elements should be treated as containers
                      finalElementType = 'container';
                    } else if (elementId === 'title' || elementId.startsWith('heading-') || elementId.startsWith('heading')) {
                      finalElementType = 'heading';
                    } else if (elementId === 'description' || elementId.startsWith('desc-') || elementId.startsWith('desc')) {
                      finalElementType = 'text';
                    } else if (elementId.startsWith('button-') || elementId.startsWith('button') || elementId.includes('button')) {
                      finalElementType = 'button';
                    } else if (elementId.startsWith('image-') || elementId.startsWith('image') || elementId.startsWith('img-') || elementId.startsWith('img') || elementId.includes('image') || elementId.includes('img')) {
                      finalElementType = 'image';
                    } else if (elementId.startsWith('video-') || elementId.startsWith('video') || elementId.includes('video')) {
                      finalElementType = 'video';
                    } else if (elementId.startsWith('icon-') || elementId.startsWith('icon') || elementId.includes('icon')) {
                      finalElementType = 'icon';
                    } else if (elementId.startsWith('link-') || elementId.startsWith('link') || elementId.includes('link')) {
                      finalElementType = 'link';
                    } else if (elementId.startsWith('text-') || elementId.startsWith('text') || elementId.includes('text') || elementId.includes('subtitle')) {
                      finalElementType = 'text';
                    } else if (elementId === 'divider' || elementId.startsWith('divider-') || elementId.includes('divider')) {
                      finalElementType = 'divider';
                    } else if (elementId === 'badge' || elementId.startsWith('badge-') || elementId.includes('badge')) {
                      finalElementType = 'badge';
                    } else if (elementId.startsWith('list-') || elementId.startsWith('list') || elementId.includes('list')) {
                      finalElementType = 'list';
                    } else if (elementId === 'spacer' || elementId.startsWith('spacer-') || elementId.includes('spacer')) {
                      finalElementType = 'spacer';
                    } else {
                      // If still not mapped, default to 'text' for safety (most common)
                      finalElementType = 'text';
                    }
                  }
                  
                  // Add element with mapped type (we've already ensured it's valid)
                  customElements.push({
                    id: `custom-el-${timestamp}-${counter++}`,
                    type: finalElementType as any, // Use mapped elementType (cast to any to allow all valid types)
                    elId: elementId,
                    order: elementOrder, // Use order from DB
                    parentElId: elementData.parentElId || undefined, // Add parentElId from flattened structure
                  });
                  
                  // Load element data and styles from database structure
                  // Store only the changed values (from DB), defaults will be merged when reading
                  customElementProps[elementId] = elementData.data || {};
                  customElementStyles[elementId] = elementData.style || {};
                  
                  // Note: We store only changed values here
                  // The store's getCustomElementStyle/getCustomElementProps will merge with defaults
                });
              }
              
              // Don't auto-create elements for HeroSection
              // If elementIds is empty array (fresh website), customElements will be empty
              // HeroSection component will detect empty customElements and show hardcoded elements
              // Once user saves elements, they will be in elementIds and loaded here
              // Re-sort elements by order if any exist
              if (customElements.length > 0) {
                customElements.sort((a: any, b: any) => a.order - b.order);
                console.log(`[Builder] HeroSection loaded ${customElements.length} elements from DB:`, customElements.map((el: any) => el.elId));
              } else {
                console.log(`[Builder] HeroSection: elementIds is empty array - component will show hardcoded elements`);
              }

              // Create a section with a custom component
              // If componentId is not valid, we'll set it to undefined and create it on save
              const section: Section = {
                id: sectionId,
                customId: `section-${component?.name || componentType || 'component'}`,
                componentType: componentType, // Store the component type (required for creating component on save)
                componentId: componentId || undefined, // Store componentId only if valid, otherwise undefined (will be created on save)
                projectId: projectId, // Pass projectId to component
                customElements: customElements,
                customElementProps: customElementProps,
                customElementStyles: customElementStyles,
                rows: [{
                  id: rowId,
                  columns: [{
                    id: colId,
                    elements: [], // Empty elements, we'll render the component directly
                  }],
                  styles: {} as any,
                }],
                styles: {
                  // Load styles from API (componentStyle from compData.style)
                  // Only apply defaults if no styles exist from API
                  ...(hasNewStructure && componentStyle && Object.keys(componentStyle).length > 0 
                    ? componentStyle 
                    : {
                        // Only use defaults if no styles from API
                  padding: '80px 40px',
                  backgroundColor: '#ffffff',
                      }
                  ),
                } as any,
              };

              newSections.push(section);
            }

            if (newSections.length > 0) {
              console.log('[Builder] ========================================');
              console.log('[Builder] SUCCESS: Loading', newSections.length, 'sections into builder');
              console.log('[Builder] Sections:', newSections.map(s => ({ id: s.id, componentType: s.componentType })));
              console.log('[Builder] ========================================');
              setSections(newSections);
              setDesignDataLoaded(true);
            } else {
              console.warn('[Builder] No sections created from components');
              setDesignDataLoaded(true); // Mark as loaded even if no sections
            }
            } else {
              // No layout and no componentIds - create default empty section
              console.warn('[Builder] Page found but no layout or componentIds:', {
                hasSelectedPage: !!selectedPage,
                componentIds: selectedPage?.componentIds,
                componentIdsLength: selectedPage?.componentIds?.length || 0,
                hasLayout: !!selectedPage?.layout,
                layoutLength: selectedPage?.layout?.length || 0
              });
              setDesignDataLoaded(true); // Mark as loaded - user can add sections
            }
          } else {
            // No design data returned
            setDesignDataLoaded(true); // Mark as loaded if no design data
          }
        } catch (error: any) {
          console.error('[Builder] ERROR loading design data:', error.message);
          setDesignDataLoaded(true); // Mark as loaded even on error
        }
    };

    // Call the async function
    loadDesignData().catch((error) => {
      console.error('[Builder] Error in loadDesignData:', error);
      setDesignDataLoaded(true);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, pageId]); // Only depend on projectId and pageId to prevent re-runs
  
  // Debug info updates removed - not needed for end users

  const [viewMode, setViewMode] = useState<ViewMode>('desktop');
  const [zoomLevel, setZoomLevel] = useState<number>(100); // Zoom level in percentage (50-200%)
  const [showInspector, setShowInspector] = useState<boolean>(true);
  const [showThemeSettingsModal, setShowThemeSettingsModal] = useState<boolean>(false);
  // Debug and JSON viewer removed - using unified Publish button instead

  // Sync activeBreakpoint with viewMode
  useEffect(() => {
    const breakpoint = viewMode === 'mobile' ? 'mobile' : viewMode === 'tablet' ? 'tablet' : 'desktop';
    if (activeBreakpoint !== breakpoint) {
      setActiveBreakpoint(breakpoint);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode]); // Only depend on viewMode

  useEffect(() => {
    // Mark builder open (used by global styles if needed)
    document.body.classList.add('builder-open');
    return () => {
      document.body.classList.remove('builder-open');
    };
  }, []);

  // Close dropdown when clicking outside (removed - no templates dropdown exists)

  // Keyboard handler for ArrowUp/ArrowDown to move selected elements/sections
  useEffect(() => {
    if (!builderMode) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't handle if user is typing in an input, textarea, or contentEditable
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      // Handle ArrowUp/ArrowDown for moving elements/sections
      if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
        if (!selectedElement) return;

        event.preventDefault();
        event.stopPropagation();

        const direction = event.key === 'ArrowUp' ? 'up' : 'down';

        // Handle section movement
        if (selectedElement.type === 'section') {
          const sectionIndex = sections.findIndex((s) => s.id === selectedElement.id);
          if (sectionIndex === -1) return;

          const canMove = direction === 'up' 
            ? sectionIndex > 0 
            : sectionIndex < sections.length - 1;

          if (canMove) {
            moveSection(selectedElement.id, direction);
          }
        }
        // Handle custom element movement
        else if (selectedElement.type === 'element' && selectedElement.sectionId) {
          // Extract elId from selectedElement.id (format: "el-{elId}")
          const elId = selectedElement.id.replace(/^el-/, '');
          moveCustomElement(selectedElement.sectionId, elId, direction);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [builderMode, selectedElement, sections, moveSection, moveCustomElement]);

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over) return;

    const type = (active?.data as any)?.current?.type as string | undefined;
    if (type && String(active.id).startsWith('tpl_')) {
      // Convert template to section
      const newSection = templateToSection(type);

      if (over.id === 'canvas') {
        addSection(newSection);
      } else {
        // Find target section index
        const targetIdx = sections.findIndex((s) => s.id === over.id);
        if (targetIdx >= 0) {
          insertSectionAt(newSection, targetIdx + 1);
        } else {
          addSection(newSection);
        }
      }
      return;
    }

    // Handle section reordering
    const activeIdx = sections.findIndex((s) => s.id === active.id);
    const overIdx = sections.findIndex((s) => s.id === over.id);
    if (activeIdx !== -1 && overIdx !== -1 && activeIdx !== overIdx) {
      // Determine direction
      const direction = activeIdx < overIdx ? 'down' : 'up';
      const steps = Math.abs(activeIdx - overIdx);
      // Move section step by step
      for (let i = 0; i < steps; i++) {
        moveSection(sections[activeIdx].id, direction);
      }
    }
  };

  // Ensure body and html have proper styles when standalone
  useEffect(() => {
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.body.style.overflow = 'hidden';
    document.documentElement.style.height = '100%';
    document.body.style.height = '100%';
    
    return () => {
      document.body.style.margin = '';
      document.body.style.padding = '';
      document.body.style.overflow = '';
      document.documentElement.style.height = '';
      document.body.style.height = '';
    };
  }, []);

  return (
    <div 
      style={{ 
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        height: '100vh',
        width: '100vw',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        backgroundColor: '#ffffff',
        margin: 0,
        padding: 0,
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      }}
    >
      {/* Debug Panel removed - not needed for end users */}
      
      <ThemeProvider initialTheme={projectId ? undefined : theme} initialFont={font} projectId={projectId} isBuilder={true}>
        <DndContextWrapper onDragEnd={handleDragEnd}>
          {/* Header controls */}
          <div
            style={{
              position: 'sticky',
              top: 0,
              zIndex: 50,
              background: '#ffffff',
              borderBottom: '1px solid #e5e7eb',
            }}
          >
            <div
              style={{
                padding: '8px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ fontWeight: 700, color: '#334155' }}>Studio Builder</div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', position: 'relative' }}>
              {/* Theme Settings Button */}
              <button
                onClick={() => setShowThemeSettingsModal(true)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 6,
                  border: '1px solid #e5e7eb',
                  background: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  cursor: 'pointer',
                  fontWeight: 500,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#f3f4f6';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#fff';
                }}
              >
                <span>🎨</span>
                <span>Theme Settings</span>
              </button>
              <button
                onClick={() => setViewMode('desktop')}
                style={{
                  padding: '6px 10px',
                  borderRadius: 6,
                  border: '1px solid #e5e7eb',
                  background: viewMode === 'desktop' ? '#eef2ff' : '#fff',
                }}
              >
                Desktop
              </button>
              <button
                onClick={() => setViewMode('tablet')}
                style={{
                  padding: '6px 10px',
                  borderRadius: 6,
                  border: '1px solid #e5e7eb',
                  background: viewMode === 'tablet' ? '#eef2ff' : '#fff',
                }}
              >
                Tablet
              </button>
              <button
                onClick={() => setViewMode('mobile')}
                style={{
                  padding: '6px 10px',
                  borderRadius: 6,
                  border: '1px solid #e5e7eb',
                  background: viewMode === 'mobile' ? '#eef2ff' : '#fff',
                }}
              >
                Mobile
              </button>
              
              {/* Zoom Controls */}
              <div style={{ 
                marginLeft: 8, 
                display: 'flex', 
                alignItems: 'center', 
                gap: 4,
                padding: '4px 8px',
                border: '1px solid #e5e7eb',
                borderRadius: 6,
                background: '#fff',
              }}>
                <button
                  onClick={() => setZoomLevel(prev => Math.max(50, prev - 10))}
                  style={{
                    padding: '4px 8px',
                    borderRadius: 4,
                    border: '1px solid #e5e7eb',
                    background: '#fff',
                    cursor: 'pointer',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  title="Zoom Out"
                >
                  −
                </button>
                <span style={{ 
                  minWidth: '50px', 
                  textAlign: 'center', 
                  fontSize: '12px',
                  fontWeight: 500,
                  color: '#374151',
                }}>
                  {zoomLevel}%
                </span>
                <button
                  onClick={() => setZoomLevel(prev => Math.min(200, prev + 10))}
                  style={{
                    padding: '4px 8px',
                    borderRadius: 4,
                    border: '1px solid #e5e7eb',
                    background: '#fff',
                    cursor: 'pointer',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  title="Zoom In"
                >
                  +
                </button>
                <button
                  onClick={() => setZoomLevel(100)}
                  style={{
                    padding: '4px 8px',
                    borderRadius: 4,
                    border: '1px solid #e5e7eb',
                    background: '#fff',
                    cursor: 'pointer',
                    fontSize: '11px',
                    marginLeft: 4,
                  }}
                  title="Reset to 100%"
                >
                  Reset
                </button>
              </div>
              
              <button
                onClick={() => setShowInspector((v) => !v)}
                style={{
                  marginLeft: 8,
                  padding: '6px 10px',
                  borderRadius: 6,
                  border: '1px solid #e5e7eb',
                  background: showInspector ? '#fff' : '#eef2ff',
                }}
              >
                {showInspector ? 'Hide Inspector' : 'Show Inspector'}
              </button>
              <button
                onClick={() => {
                  // Open preview in new window
                  const previewWindow = window.open('', '_blank', 'width=1200,height=800');
                  if (previewWindow) {
                    const previewHTML = `
                      <!DOCTYPE html>
                      <html>
                        <head>
                          <title>Preview - Studio Builder</title>
                          <meta charset="utf-8">
                          <meta name="viewport" content="width=device-width, initial-scale=1.0">
                          <style>
                            * { margin: 0; padding: 0; box-sizing: border-box; }
                            body {
                              font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                              background: #ffffff;
                            }
                          </style>
                        </head>
                        <body>
                          <div id="preview-root"></div>
                          <script>
                            const sections = ${JSON.stringify(sections)};
                            const theme = ${JSON.stringify(theme)};
                            const font = ${JSON.stringify(font)};
                            
                            // Render preview (simplified - you can enhance this)
                            const root = document.getElementById('preview-root');
                            sections.forEach(section => {
                              const sectionEl = document.createElement('div');
                              sectionEl.style.cssText = \`
                                padding: \${section.styles?.padding || '40px'};
                                background: \${section.styles?.backgroundColor || '#ffffff'};
                                margin-bottom: 20px;
                              \`;
                              
                              section.rows?.forEach(row => {
                                const rowEl = document.createElement('div');
                                rowEl.style.cssText = \`
                                  display: flex;
                                  gap: 16px;
                                  padding: \${row.styles?.padding || '20px'};
                                  background: \${row.styles?.backgroundColor || 'transparent'};
                                  margin-bottom: 16px;
                                \`;
                                
                                row.columns?.forEach(column => {
                                  const colEl = document.createElement('div');
                                  colEl.style.cssText = \`
                                    flex: 1;
                                    padding: \${column.styles?.padding || '16px'};
                                    background: \${column.styles?.backgroundColor || 'transparent'};
                                  \`;
                                  
                                  column.elements?.forEach(element => {
                                    const el = document.createElement('div');
                                    if (element.type === 'heading') {
                                      el.innerHTML = element.content?.heading || '';
                                      el.style.cssText = \`
                                        font-size: \${element.styles?.headingFontSize || '2rem'};
                                        font-weight: \${element.styles?.headingFontWeight || '700'};
                                        color: \${element.styles?.textColor || '#000000'};
                                        text-align: \${element.styles?.textAlign || 'left'};
                                        margin-bottom: 12px;
                                      \`;
                                    } else if (element.type === 'text') {
                                      el.innerHTML = element.content?.text || '';
                                      el.style.cssText = \`
                                        color: \${element.styles?.textColor || '#000000'};
                                        font-size: \${element.styles?.fontSize || '1rem'};
                                        margin-bottom: 12px;
                                      \`;
                                    } else if (element.type === 'button') {
                                      el.innerHTML = element.content?.text || 'Button';
                                      el.style.cssText = \`
                                        display: inline-block;
                                        padding: \${element.styles?.padding || '12px 24px'};
                                        background: \${element.styles?.backgroundColor || '#3b82f6'};
                                        color: \${element.styles?.textColor || '#ffffff'};
                                        border-radius: 6px;
                                        cursor: pointer;
                                        text-decoration: none;
                                      \`;
                                    }
                                    colEl.appendChild(el);
                                  });
                                  
                                  rowEl.appendChild(colEl);
                                });
                                
                                sectionEl.appendChild(rowEl);
                              });
                              
                              root.appendChild(sectionEl);
                            });
                          </script>
                        </body>
                      </html>
                    `;
                    previewWindow.document.write(previewHTML);
                    previewWindow.document.close();
                  }
                }}
                style={{
                  marginLeft: 8,
                  padding: '6px 12px',
                  borderRadius: 6,
                  border: '1px solid #3b82f6',
                  background: '#3b82f6',
                  color: '#ffffff',
                  fontWeight: 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#2563eb';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#3b82f6';
                }}
              >
                <span>👁️</span>
                <span>Preview</span>
              </button>
              {/* Publish Button - unified save action for all page types */}
              <PageSaveButton />
              </div>
            </div>

            {/* JSON Panel removed - not needed for end users */}
          </div>

          {/* Content layout: canvas + optional inspector */}
          <div
            style={{
              flex: 1,
              display: 'grid',
              gridTemplateColumns: showInspector ? '1fr 320px' : '1fr',
              gap: 0,
              padding: 0,
              overflow: 'hidden',
              minHeight: 0,
            }}
          >
            <div 
              style={{ 
                padding: 0, 
                border: 'none', 
                borderRadius: 0, 
                background: 'transparent',
                overflowY: 'auto',
                overflowX: 'auto',
                minHeight: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'stretch',
                justifyContent: 'flex-start',
                position: 'relative',
                width: '100%',
              }}
            >
              {/* Canvas with zoom scaling */}
              <div
                style={{
                  transform: `scale(${zoomLevel / 100})`,
                  transformOrigin: 'top center',
                  width: viewMode === 'mobile' ? '375px' : viewMode === 'tablet' ? '768px' : '100%',
                  maxWidth: viewMode === 'desktop' ? '100%' : undefined,
                  minWidth: viewMode === 'mobile' ? '375px' : viewMode === 'tablet' ? '768px' : undefined,
                  transition: 'transform 0.2s ease, width 0.2s ease',
                  margin: '0 auto',
                  backgroundColor: '#fff',
                  boxShadow: viewMode !== 'desktop' ? '0 0 0 1px rgba(0,0,0,0.1), 0 4px 6px rgba(0,0,0,0.1)' : 'none',
                  position: 'relative',
                  minHeight: viewMode === 'mobile' ? '667px' : viewMode === 'tablet' ? '1024px' : 'auto',
                }}
              >
                <Canvas viewMode={viewMode} />
              </div>
              {/* Page Save Button moved to top bar as Publish button */}
            </div>
            {showInspector && (
              <div
                style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: 8,
                  background: '#f8fafc',
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                  minHeight: 0,
                }}
              >
                <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
                  <NodeInspector onHide={() => setShowInspector(false)} />
                </div>
              </div>
            )}
          </div>
        </DndContextWrapper>
      </ThemeProvider>
      
      {/* Theme Settings Modal */}
      <ThemeSettingsModal
        isOpen={showThemeSettingsModal}
        onClose={() => setShowThemeSettingsModal(false)}
        projectId={projectId}
        userId={searchParams.get('userId') || ''}
        currentTheme={theme}
        onThemeChange={(newTheme) => {
          setTheme(newTheme as ThemeName);
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}
