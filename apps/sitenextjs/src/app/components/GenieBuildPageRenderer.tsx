'use client';

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import SectionRenderer from '@geniebuild/components/SectionRenderer';
import { AboutUsContactProvider } from '@geniebuild/components/builder/context/AboutUsContactContext';
import { Section, GlobalElementStyles } from '@geniebuild/types';
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
  const router = useRouter();
  const resolvedDefaultSizes = useMemo(
    () => resolveSiteFontSizes(themeSettings ?? null),
    [themeSettings]
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

      // Soft-navigate internal links. projectId lives in localStorage — no need to
      // append ?projectId= on every href (admin open still persists it once).
      let nextHref: string | null = null;
      try {
        const url = new URL(rawHref, window.location.origin);
        if (url.origin !== window.location.origin) return;
        nextHref = `${url.pathname}${url.search}${url.hash}`;
      } catch {
        nextHref = rawHref.startsWith('/') ? rawHref : `/${rawHref}`;
      }

      if (!nextHref) return;

      event.preventDefault();
      router.push(nextHref);
    };

    root.addEventListener('click', onClick);
    return () => root.removeEventListener('click', onClick);
  }, [router]);

  useEffect(() => {
    applySiteThemeToDocument(themeSettings ?? null, globalColors);
    applySiteTypographyToDocument(themeSettings ?? null, DEFAULT_TYPOGRAPHY);
    ensureSiteGoogleFontsLoaded('site-google-fonts');
    return mountSiteThemeCss({ themeSettings: themeSettings ?? null, globalColors });
  }, [themeSettings, globalColors]);

  const effectiveProjectId = projectId || '';

  return (
    <DefaultSizesContext.Provider value={resolvedDefaultSizes}>
    <GlobalElementStylesContext.Provider value={globalElementStyles}>
    <AboutUsContactProvider projectId={effectiveProjectId || null}>
    <div id="canvas-root" className="min-h-full">
      {sections.map((section) => (
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
