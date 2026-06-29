'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { getSlugToPageDetails, getWebsitePageData } from '@/lib/api';
import { resolveProjectId } from '@/lib/projectConfig';
import { applySeoToDocument, normalizePageSeoFromApi } from '@/lib/seo';
import GenieBuildPageRenderer from './GenieBuildPageRenderer';
import { Section, GlobalElementStyles } from '@geniebuild/types';
import { preloadVariant } from '@geniebuild/components/sections/SectionRouter';
import { hydrateSectionsForDisplay } from '@geniebuild/utils/sectionHydration';
import { syncThemeFromApiSettings } from '@geniebuild/utils/themeResolver';

type HomePageClientV2Props = {
  /** Server-read env fallback when client bundle omits NEXT_PUBLIC_PROJECT_ID */
  defaultProjectId?: string;
};

export default function HomePageClientV2({ defaultProjectId = '' }: HomePageClientV2Props) {
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [globalColors, setGlobalColors] = useState({
    backgroundColor: '#0E1214',
    textColor: '#D1D5DB',
    titleColor: '#F8FAFC',
    accentColor: '#F8FAFC',
    buttonBackgroundColor: '#E11D48',
    buttonTextColor: '#FFFFFF'
  });
  const [themeSettings, setThemeSettings] = useState<any>(null);
  const [globalElementStyles, setGlobalElementStyles] = useState<GlobalElementStyles | undefined>(undefined);
  const [seoData, setSeoData] = useState<ReturnType<typeof normalizePageSeoFromApi>>(null);
  const [sitePageType, setSitePageType] = useState('');
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const projectIdFromQuery = (searchParams.get('projectId') || '').trim();
  const routeSlug = String(pathname || '/')
    .replace(/^\/+|\/+$/g, '')
    .trim()
    .toLowerCase();
  const slugFromRoute = routeSlug && routeSlug !== 'home' ? routeSlug : '';
  const projectId = resolveProjectId(projectIdFromQuery || defaultProjectId).trim();

  useEffect(() => {
    async function loadPage() {
      try {
        setLoading(true);
        setError(null);
        setSitePageType('');

        if (!projectId) {
          throw new Error('Set NEXT_PUBLIC_PROJECT_ID or pass ?projectId= in the URL');
        }

        let resolvedProjectId = projectId;
        let resolvedPageId = '';
        let resolvedLocationId = '';
        let resolvedSlug = slugFromRoute;
        let resolvedPageType = '';

        const slugForDetails = slugFromRoute || '';
        try {
          const detailsResponse = await getSlugToPageDetails({
            projectId,
            slug: slugForDetails,
          });
          if (detailsResponse?.redirect?.to) {
            router.replace(detailsResponse.redirect.to);
            return;
          }
          const details = detailsResponse?.data;
          if (details?.pageId) {
            resolvedProjectId = (details.projectId || resolvedProjectId).trim();
            resolvedPageId = String(details.pageId).trim();
            resolvedLocationId = details.locationId ? String(details.locationId).trim() : '';
            resolvedSlug = (details.slug ?? slugForDetails).trim();
            resolvedPageType = String(details.pageType || '').trim().toLowerCase();
          }
        } catch {
          // website_page can still resolve by slug + projectId.
        }

        const response = await getWebsitePageData({
          projectId: resolvedProjectId,
          ...(resolvedPageId ? { pageId: resolvedPageId } : {}),
          ...(resolvedLocationId ? { locationId: resolvedLocationId } : {}),
          slug: resolvedSlug || '',
          ...(resolvedPageType ? { pageType: resolvedPageType } : {}),
        });

        if (response?.redirect?.to) {
          router.replace(response.redirect.to);
          return;
        }

        const data = response?.data;
        setSitePageType(resolvedPageType);
        const apiThemeSettings = data?.themeSettings || null;
        const themeSync = syncThemeFromApiSettings(apiThemeSettings, { projectId });
        const incomingSections = Array.isArray(data?.sections) ? data.sections : [];
        const normalizedSections = hydrateSectionsForDisplay(incomingSections, {
          themeSettings: apiThemeSettings,
          stripPresetColors: themeSync.shouldStripPresetColors,
        });
        setSections(normalizedSections);
        setThemeSettings(apiThemeSettings);
        setGlobalElementStyles(themeSync.globalElementStyles);
        setSeoData(normalizePageSeoFromApi(data));
        setGlobalColors(themeSync.globalColors);
      } catch (err: any) {
        setError(err?.message || 'Failed to load website page');
      } finally {
        setLoading(false);
      }
    }

    loadPage();
  }, [projectId, slugFromRoute, router]);

  useEffect(() => {
    applySeoToDocument(seoData);
  }, [seoData]);

  useEffect(() => {
    sections.forEach((section) => {
      const variant = String((section.styles as any)?.variant || '').trim();
      if (section.type && variant) preloadVariant(section.type, variant);
    });
  }, [sections]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading website...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Error</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <GenieBuildPageRenderer
      sections={sections}
      globalColors={globalColors}
      themeSettings={themeSettings}
      globalElementStyles={globalElementStyles}
      projectId={projectId || undefined}
      previewProjectId={projectIdFromQuery || undefined}
      sitePathname={pathname || '/'}
      sitePageType={sitePageType}
    />
  );
}
