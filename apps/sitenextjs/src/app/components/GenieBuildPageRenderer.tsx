'use client';

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import SectionRenderer from '@geniebuild/components/SectionRenderer';
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
  previewProjectId?: string;
  sitePathname?: string;
  sitePageType?: string;
  themeSettings?: ThemeSettingsInput;
  globalElementStyles?: GlobalElementStyles;
}

function appendPreviewProjectId(href: string, previewProjectId: string): string {
  const raw = String(href || '').trim();
  if (!raw || raw === '#' || /^https?:\/\//i.test(raw) || /^mailto:|^tel:/i.test(raw)) {
    return raw;
  }
  try {
    const url = new URL(raw, 'http://localhost');
    const path = url.pathname || '/';
    const params = new URLSearchParams(url.search);
    params.set('projectId', previewProjectId);
    const query = params.toString();
    return query ? `${path}?${query}` : path;
  } catch {
    const path = raw.startsWith('/') ? raw : `/${raw}`;
    return `${path}?projectId=${encodeURIComponent(previewProjectId)}`;
  }
}

export default function GenieBuildPageRenderer({
  sections,
  globalColors,
  projectId,
  previewProjectId,
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
    if (!previewProjectId) return;
    const root = document.getElementById('canvas-root');
    if (!root) return;

    const onClick = (event: MouseEvent) => {
      const anchor = (event.target as HTMLElement | null)?.closest('a');
      if (!anchor) return;
      const rawHref = anchor.getAttribute('href') || '';
      if (!rawHref || rawHref === '#' || /^https?:\/\//i.test(rawHref)) return;
      const nextHref = appendPreviewProjectId(rawHref, previewProjectId);
      if (nextHref === rawHref) return;
      event.preventDefault();
      router.push(nextHref);
    };

    root.addEventListener('click', onClick);
    return () => root.removeEventListener('click', onClick);
  }, [previewProjectId, router]);

  useEffect(() => {
    applySiteThemeToDocument(themeSettings ?? null, globalColors);
    applySiteTypographyToDocument(themeSettings ?? null, DEFAULT_TYPOGRAPHY);
    ensureSiteGoogleFontsLoaded('site-google-fonts');
    return mountSiteThemeCss({ themeSettings: themeSettings ?? null, globalColors });
  }, [themeSettings, globalColors]);

  return (
    <DefaultSizesContext.Provider value={resolvedDefaultSizes}>
    <GlobalElementStylesContext.Provider value={globalElementStyles}>
    <div id="canvas-root" className="min-h-full">
      {sections.map((section) => (
        <SectionRenderer
          key={section.id}
          section={section}
          readOnly={true}
          projectId={projectId}
          sitePathname={sitePathname}
          sitePageType={sitePageType}
        />
      ))}
    </div>
    </GlobalElementStylesContext.Provider>
    </DefaultSizesContext.Provider>
  );
}
