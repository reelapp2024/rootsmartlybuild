'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { getSlugToPageDetails, getWebsitePageData } from '@/lib/api';
import { isDemoMode, resolveProjectId, writeStoredProjectId } from '@/lib/projectConfig';
import { applySeoToDocument, normalizePageSeoFromApi } from '@/lib/seo';
import GenieBuildPageRenderer from './GenieBuildPageRenderer';
import { Section, GlobalElementStyles } from '@geniebuild/types';
import { preloadVariant } from '@geniebuild/components/sections/SectionRouter';
import { hydrateSectionsForDisplay } from '@geniebuild/utils/sectionHydration';
import { syncThemeFromApiSettings } from '@geniebuild/utils/themeResolver';
import { buildSiteNextDemoWebsiteData } from '@geniebuild/localServiceDemo';

type HomePageClientV2Props = {
  /** Server-read env fallback when client bundle omits NEXT_PUBLIC_PROJECT_ID */
  defaultProjectId?: string;
  /** Server-resolved DEMOMODE (also checks NEXT_PUBLIC_DEMOMODE on client) */
  demoMode?: boolean;
};

function resolveDemoPageType(pathname: string): string {
  const lower = String(pathname || '/')
    .replace(/\\/g, '/')
    .replace(/\/+$/, '')
    .toLowerCase() || '/';
  if (lower === '/about' || lower.endsWith('/about')) return 'about';
  if (lower === '/contact' || lower.endsWith('/contact')) return 'contact';
  if (/(^|\/)services\/[^/]+$/.test(lower)) return 'service';
  if (lower === '/services' || lower.endsWith('/services')) return 'services';
  if (lower === '/service' || lower.endsWith('/service')) return 'service';
  if (/(^|\/)blog\/[^/]+$/.test(lower)) return 'blog';
  if (lower === '/blogs' || lower.endsWith('/blogs')) return 'blog';
  if (/(^|\/)locations?\/[^/]+$/.test(lower)) return 'home';
  if (lower === '/areas' || lower.endsWith('/areas')) return 'areas';
  if (
    lower.endsWith('/privacy') ||
    lower.endsWith('/privacy-policy') ||
    lower.endsWith('/terms') ||
    lower.endsWith('/terms-of-service') ||
    lower.endsWith('/disclaimer') ||
    lower === '/legal' ||
    lower.endsWith('/legal')
  ) {
    return 'legal';
  }
  return 'home';
}

const DEMO_GLOBAL_COLORS = {
  backgroundColor: '#0E1214',
  textColor: '#D1D5DB',
  titleColor: '#F8FAFC',
  accentColor: '#F8FAFC',
  buttonBackgroundColor: '#E11D48',
  buttonTextColor: '#FFFFFF',
};

export default function HomePageClientV2({
  defaultProjectId = '',
  demoMode: demoModeProp,
}: HomePageClientV2Props) {
  const demoMode = isDemoMode(demoModeProp);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [globalColors, setGlobalColors] = useState(DEMO_GLOBAL_COLORS);
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
  // query → localStorage/cookie → env (admin preview sticks via writeStoredProjectId)
  const projectId = resolveProjectId(projectIdFromQuery || defaultProjectId).trim();

  useEffect(() => {
    if (demoMode) return;
    const toPersist = (projectIdFromQuery || projectId || '').trim();
    if (toPersist) writeStoredProjectId(toPersist);
  }, [demoMode, projectIdFromQuery, projectId]);

  useEffect(() => {
    async function loadPage() {
      try {
        setError(null);

        // Full-site demo: skip API and swap sections instantly (no loading flash / hard reload feel).
        if (demoMode) {
          const demoData = buildSiteNextDemoWebsiteData(pathname || '/');
          const demoSections = Array.isArray(demoData.sections) ? demoData.sections : [];
          const normalized = hydrateSectionsForDisplay(demoSections, {
            themeSettings: null,
            stripPresetColors: false,
          });
          setSections(normalized);
          setThemeSettings(null);
          setGlobalElementStyles(undefined);
          setGlobalColors(DEMO_GLOBAL_COLORS);
          setSitePageType(resolveDemoPageType(pathname || '/'));
          setSeoData(
            normalizePageSeoFromApi({
              seo: {
                title: `${demoData.name || 'Site Demo'} | Demo Mode`,
                description:
                  'Full-site demo with dummy GenieBuild sections. Set NEXT_PUBLIC_DEMOMODE=false to load live project content.',
              },
            })
          );
          setLoading(false);
          return;
        }

        setLoading(true);
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

        if (resolvedProjectId) writeStoredProjectId(resolvedProjectId);

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
        const themeSync = syncThemeFromApiSettings(apiThemeSettings, { projectId: resolvedProjectId });
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
        const raw = String(err?.message || 'Failed to load website page');
        const isNetwork = /network error/i.test(raw);
        setError(
          isNetwork
            ? `${raw}. SiteNext cannot reach the API. Ensure backend is on :1111 and apps/sitenextjs/.env.local has NEXT_PUBLIC_SITENEXTJS_API_URL=http://localhost:1111/sitenextjs/v1 (then restart next dev).`
            : raw
        );
      } finally {
        setLoading(false);
      }
    }

    loadPage();
  }, [demoMode, projectId, slugFromRoute, pathname, router]);

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
          <p className="mt-4 text-gray-600">
            {demoMode ? 'Loading demo site...' : 'Loading website...'}
          </p>
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
      projectId={demoMode ? undefined : projectId || undefined}
      sitePathname={pathname || '/'}
      sitePageType={sitePageType}
    />
  );
}
