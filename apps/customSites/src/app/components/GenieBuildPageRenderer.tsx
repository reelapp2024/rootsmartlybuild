'use client';

import { useEffect, useState } from 'react';
import SectionRenderer from '@geniebuild/components/SectionRenderer';
import { Section } from '@geniebuild/types';

interface GenieBuildPageRendererProps {
  sections: Section[];
  globalColors: {
    backgroundColor: string;
    textColor: string;
    titleColor: string;
    accentColor: string;
    buttonBackgroundColor: string;
    buttonTextColor: string;
  };
  projectId?: string;
}

/**
 * GenieBuildPageRenderer - Renders GenieBuild sections exactly as GenieBuild does
 * This component replicates the exact structure and styling from GenieBuild's App.tsx
 */
export default function GenieBuildPageRenderer({ sections, globalColors, projectId }: GenieBuildPageRendererProps) {
  const [themeSettings, setThemeSettings] = useState<{
    defaultSizes?: {
      h1?: string;
      h2?: string;
      h3?: string;
      h4?: string;
      h5?: string;
      h6?: string;
      text?: string;
      textSmall?: string;
      textLarge?: string;
      textXl?: string;
    };
    defaultTypography?: {
      fontFamily?: string;
    };
  }>({});

  // Load theme settings
  useEffect(() => {
    if (!projectId) return;

    const loadThemeSettings = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://apis.smartlybuild.dev/admin/v1';
        const response = await fetch(`${apiUrl}/getThemeSettings?projectId=${projectId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            setThemeSettings({
              defaultSizes: result.data.defaultSizes,
              defaultTypography: result.data.defaultTypography
            });
          }
        }
      } catch (error) {
        console.error('Error loading theme settings:', error);
      }
    };

    loadThemeSettings();
  }, [projectId]);

  useEffect(() => {
    // Default sizes (fallback if theme settings not loaded)
    const defaultSizes = {
      h1: themeSettings.defaultSizes?.h1 || '3rem',
      h2: themeSettings.defaultSizes?.h2 || '2.5rem',
      h3: themeSettings.defaultSizes?.h3 || '2rem',
      h4: themeSettings.defaultSizes?.h4 || '1.5rem',
      h5: themeSettings.defaultSizes?.h5 || '1.25rem',
      h6: themeSettings.defaultSizes?.h6 || '1rem',
      text: themeSettings.defaultSizes?.text || '1rem',
      textSmall: themeSettings.defaultSizes?.textSmall || '0.875rem',
      textLarge: themeSettings.defaultSizes?.textLarge || '1.125rem',
      textXl: themeSettings.defaultSizes?.textXl || '1.25rem'
    };

    const fontFamily = themeSettings.defaultTypography?.fontFamily || 'Inter, sans-serif';

    // Generate CSS for default font sizes and typography (same as GenieBuild)
    const fontSizesCSS = `
      .h1-default { font-size: ${defaultSizes.h1}; }
      .h2-default { font-size: ${defaultSizes.h2}; }
      .h3-default { font-size: ${defaultSizes.h3}; }
      .h4-default { font-size: ${defaultSizes.h4}; }
      .h5-default { font-size: ${defaultSizes.h5}; }
      .h6-default { font-size: ${defaultSizes.h6}; }
      .text-default { font-size: ${defaultSizes.text}; }
      .text-small { font-size: ${defaultSizes.textSmall}; }
      .text-large { font-size: ${defaultSizes.textLarge}; }
      .text-xl { font-size: ${defaultSizes.textXl}; }
      
      /* Apply default font family only to canvas content, not GenieBuild UI */
      /* Inline styles (with fontFamily) will automatically override this CSS rule */
      #canvas-root {
        font-family: ${fontFamily};
      }
      
      /* Apply font family to all text elements within canvas */
      /* Inline fontFamily styles will automatically override this (higher specificity) */
      #canvas-root h1,
      #canvas-root h2,
      #canvas-root h3,
      #canvas-root h4,
      #canvas-root h5,
      #canvas-root h6,
      #canvas-root p,
      #canvas-root span,
      #canvas-root div {
        font-family: ${fontFamily};
      }
      
      /* Default heading sizes - apply to all headings, inline styles will override */
      #canvas-root h1 { font-size: ${defaultSizes.h1}; }
      #canvas-root h1 { font-size: ${defaultSizes.h1}; }
      #canvas-root h2 { font-size: ${defaultSizes.h2}; }
      #canvas-root h3 { font-size: ${defaultSizes.h3}; }
      #canvas-root h4 { font-size: ${defaultSizes.h4}; }
      #canvas-root h5 { font-size: ${defaultSizes.h5}; }
      #canvas-root h6 { font-size: ${defaultSizes.h6}; }
      #canvas-root p { font-size: ${defaultSizes.text}; }
      
      /* Text size variants - override default p size */
      #canvas-root p.text-sm { font-size: ${defaultSizes.textSmall}; }
      #canvas-root p.text-lg { font-size: ${defaultSizes.textLarge}; }
      #canvas-root p.text-xl { font-size: ${defaultSizes.textXl}; }
      
      /* Button styles - ensure buttons match GenieBuild exactly */
      #canvas-root button {
        transition: all 0.2s ease;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
      }
      #canvas-root button:hover {
        opacity: 0.9;
      }
      #canvas-root button:active {
        transform: scale(0.95);
      }
      
      /* Fallback for button colors when Tailwind arbitrary values don't work */
      #canvas-root button[class*="bg-["] {
        background-color: var(--btn-bg) !important;
      }
      #canvas-root button[class*="text-["] {
        color: var(--btn-text) !important;
      }
    `;

    // Inject CSS variables EXACTLY as GenieBuild does
    const styleString = `
      :root { 
        --bg-color: ${globalColors.backgroundColor}; 
        --text-color: ${globalColors.textColor}; 
        --title-color: ${globalColors.titleColor}; 
        --accent-color: ${globalColors.accentColor}; 
        --btn-bg: ${globalColors.buttonBackgroundColor}; 
        --btn-text: ${globalColors.buttonTextColor}; 
      } 
      #canvas-root { 
        background-color: var(--bg-color); 
        color: var(--text-color); 
        min-height: 100vh; 
      }
      ${fontSizesCSS}
    `;
    
    const styleEl = document.createElement('style');
    styleEl.id = 'dynamic-theme-styles';
    styleEl.innerHTML = styleString;
    const existing = document.getElementById('dynamic-theme-styles');
    if (existing) existing.remove();
    document.head.appendChild(styleEl);

    return () => {
      const styleEl = document.getElementById('dynamic-theme-styles');
      if (styleEl) {
        styleEl.remove();
      }
    };
  }, [globalColors, themeSettings]);

  // Render sections EXACTLY as GenieBuild does (from App.tsx line 565-568)
  return (
    <div id="canvas-root" className="min-h-full">
      {sections.map((section) => (
        <SectionRenderer
          key={section.id}
          section={section}
          onUpdate={() => {}}
          isSelected={false}
          readOnly={true}
          onClick={() => {}}
          onDelete={() => {}}
          onMoveUp={() => {}}
          onMoveDown={() => {}}
        />
      ))}
    </div>
  );
}
