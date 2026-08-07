'use client';

import React, { useEffect, useMemo, useState } from 'react';
import SectionRenderer from '@geniebuild/components/SectionRenderer';
import { AboutUsContactProvider } from '@geniebuild/components/builder/context/AboutUsContactContext';
import { Section, GlobalElementStyles, WebsiteData } from '@geniebuild/types';
import { DEFAULT_TYPOGRAPHY, resolveSiteFontSizes } from '@geniebuild/constants';
import { DefaultSizesContext } from '@geniebuild/components/builder/state/DefaultSizesContext';
import { GlobalElementStylesContext } from '@geniebuild/components/builder/state/GlobalElementStylesContext';
import {
  applySiteThemeToDocument,
  applySiteTypographyToDocument,
  ensureSiteGoogleFontsLoaded,
  mountSiteThemeCss,
  type ThemeSettingsInput,
} from '@geniebuild/utils/themeResolver';
import {
  buildResponsiveOverrideCss,
  resolveSectionForBreakpoint,
  type EditBreakpoint,
} from '@geniebuild/components/builder/state/responsiveOverrideCss';
import { dispatchSitePathChange } from '@/lib/sitePath';

function useViewportEditBreakpoint(): EditBreakpoint {
  const [bp, setBp] = useState<EditBreakpoint>('desktop');
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mqMobile = window.matchMedia('(max-width: 767px)');
    const mqTablet = window.matchMedia('(max-width: 1023px)');
    const sync = () => {
      if (mqMobile.matches) setBp('mobile');
      else if (mqTablet.matches) setBp('tablet');
      else setBp('desktop');
    };
    sync();
    mqMobile.addEventListener('change', sync);
    mqTablet.addEventListener('change', sync);
    return () => {
      mqMobile.removeEventListener('change', sync);
      mqTablet.removeEventListener('change', sync);
    };
  }, []);
  return bp;
}

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
  sitePathname?: string;
  sitePageType?: string;
  themeSettings?: ThemeSettingsInput;
  globalElementStyles?: GlobalElementStyles;
}

export default function GenieBuildPageRenderer({
  sections,
  globalColors,
  projectId,
  sitePathname = '/',
  sitePageType = '',
  themeSettings,
  globalElementStyles,
}: GenieBuildPageRendererProps) {
  const resolvedDefaultSizes = useMemo(
    () => resolveSiteFontSizes(themeSettings ?? null),
    [themeSettings]
  );
  const viewportBp = useViewportEditBreakpoint();
  const displaySections = useMemo(
    () => sections.map((section) => resolveSectionForBreakpoint(section, viewportBp)),
    [sections, viewportBp]
  );

  useEffect(() => {
    const root = document.getElementById('canvas-root');
    if (!root) return;

    const onClick = (event: MouseEvent) => {
      // Allow modified clicks (new tab / download) to keep browser defaults.
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }
      const anchor = (event.target as HTMLElement | null)?.closest('a');
      if (!anchor) return;
      const rawHref = anchor.getAttribute('href') || '';
      if (!rawHref || rawHref === '#' || /^https?:\/\//i.test(rawHref) || /^mailto:|^tel:/i.test(rawHref)) {
        return;
      }
      if (anchor.getAttribute('target') === '_blank' || anchor.hasAttribute('download')) {
        return;
      }

      // Soft-navigate internal links. Prefer history + custom event so HomePageClientV2
      // always refetches even when Next's catch-all soft-nav is sticky on `/`.
      let nextHref: string | null = null;
      try {
        const url = new URL(rawHref, window.location.origin);
        if (url.origin !== window.location.origin) return;
        nextHref = `${url.pathname}${url.search}${url.hash}`;
      } catch {
        nextHref = rawHref.startsWith('/') ? rawHref : `/${rawHref}`;
      }

      if (!nextHref) return;

      // Hash-only links on the current page (e.g. /#contact) — let the browser scroll.
      if (nextHref.startsWith('#')) return;
      try {
        const current = `${window.location.pathname}${window.location.search}`;
        const targetUrl = new URL(nextHref, window.location.origin);
        const targetPath = `${targetUrl.pathname}${targetUrl.search}`;
        if (targetPath === current && targetUrl.hash) return;
      } catch {
        /* continue soft-nav */
      }

      event.preventDefault();
      dispatchSitePathChange(nextHref);
    };

    root.addEventListener('click', onClick);
    return () => root.removeEventListener('click', onClick);
  }, []);

  useEffect(() => {
    applySiteThemeToDocument(themeSettings ?? null, globalColors);
    applySiteTypographyToDocument(themeSettings ?? null, DEFAULT_TYPOGRAPHY);
    ensureSiteGoogleFontsLoaded('site-google-fonts');
    return mountSiteThemeCss({ themeSettings: themeSettings ?? null, globalColors });
  }, [themeSettings, globalColors]);

  // Real CSS props (padding, fontSize, color, …) via media queries; semantic
  // keys (titleColor, markerColor, …) come from resolveSectionForBreakpoint above.
  useEffect(() => {
    const css = buildResponsiveOverrideCss({ sections } as WebsiteData);
    let styleEl = document.getElementById('geniebuild-responsive-overrides');
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'geniebuild-responsive-overrides';
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = css;
    return () => {
      styleEl.textContent = '';
    };
  }, [sections]);

  const effectiveProjectId = projectId || '';

  return (
    <DefaultSizesContext.Provider value={resolvedDefaultSizes}>
    <GlobalElementStylesContext.Provider value={globalElementStyles}>
    <AboutUsContactProvider projectId={effectiveProjectId || null}>
    <div id="canvas-root" className="min-h-full">
      {displaySections.map((section) => (
        <SectionRenderer
          key={section.id}
          section={section}
          readOnly={true}
          projectId={effectiveProjectId || undefined}
          sitePathname={sitePathname}
          sitePageType={sitePageType}
        />
      ))}
    </div>
    </AboutUsContactProvider>
    </GlobalElementStylesContext.Provider>
    </DefaultSizesContext.Provider>
  );
}
