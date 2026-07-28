'use client';

import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { getSlugToPageDetails, getWebsitePageData } from '@/lib/api';
import { isDemoMode, resolveProjectId, writeStoredProjectId } from '@/lib/projectConfig';
import { applySeoToDocument, normalizePageSeoFromApi } from '@/lib/seo';
import {
  SITE_PATH_CHANGE_EVENT,
  dispatchSitePathChange,
  normalizeSitePathname,
  slugFromPathname,
} from '@/lib/sitePath';
import GenieBuildPageRenderer from './GenieBuildPageRenderer';
import { Section, GlobalElementStyles } from '@geniebuild/types';
import { preloadVariant } from '@geniebuild/components/sections/SectionRouter';
import { hydrateSectionsForDisplay } from '@geniebuild/utils/sectionHydration';
import { syncThemeFromApiSettings } from '@geniebuild/utils/themeResolver';
import { buildSiteNextDemoWebsiteData } from '@geniebuild/localServiceDemo';
import {
  fetchPublishedBlogBySlug,
} from '@geniebuild/lib/blogsApi';
import {
  assembleLiveBlogDetailSections,
  extractBlogSlugFromPath,
} from '@geniebuild/lib/assembleLiveBlogDetail';

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
  if (
    lower === '/contact' ||
    lower.endsWith('/contact') ||
    lower === '/contactus' ||
    lower.endsWith('/contactus') ||
    lower === '/contact-us' ||
    lower.endsWith('/contact-us')
  ) {
    return 'contact';
  }
  if (/(^|\/)services\/[^/]+$/.test(lower)) return 'service';
  if (lower === '/services' || lower.endsWith('/services')) return 'services';
  if (lower === '/service' || lower.endsWith('/service')) return 'service';
  if (/(^|\/)blog\/[^/]+$/.test(lower)) return 'blog';
  if (lower === '/blogs' || lower.endsWith('/blogs') || lower === '/blog' || lower.endsWith('/blog')) {
    return 'blog';
  }
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
  const pathnameFromNext = usePathname();

  // Soft-nav can update the address bar before Next's usePathname settles — prefer live location.
  const [activePathname, setActivePathname] = useState(() =>
    normalizeSitePathname(
      typeof window !== 'undefined' ? window.location.pathname : pathnameFromNext || '/'
    )
  );

  useEffect(() => {
    const syncFromWindow = () => {
      setActivePathname(normalizeSitePathname(window.location.pathname));
    };
    // Never let a stale Next catch-all pathname (`/`) overwrite a soft-nav'd real path.
    const fromWindow = normalizeSitePathname(
      typeof window !== 'undefined' ? window.location.pathname : '/'
    );
    const fromNext = normalizeSitePathname(pathnameFromNext || '/');
    if (fromWindow && fromWindow !== '/') {
      setActivePathname(fromWindow);
    } else if (fromNext && fromNext !== '/') {
      setActivePathname(fromNext);
    } else {
      setActivePathname(fromWindow || fromNext || '/');
    }
    window.addEventListener(SITE_PATH_CHANGE_EVENT, syncFromWindow);
    window.addEventListener('popstate', syncFromWindow);
    return () => {
      window.removeEventListener(SITE_PATH_CHANGE_EVENT, syncFromWindow);
      window.removeEventListener('popstate', syncFromWindow);
    };
  }, [pathnameFromNext]);

  const projectIdFromQuery = (searchParams.get('projectId') || '').trim();
  const slugFromRoute = slugFromPathname(activePathname);
  // query → localStorage/cookie → env (admin preview sticks via writeStoredProjectId)
  const projectId = resolveProjectId(projectIdFromQuery || defaultProjectId).trim();

  useEffect(() => {
    if (demoMode) return;
    const toPersist = (projectIdFromQuery || projectId || '').trim();
    if (toPersist) writeStoredProjectId(toPersist);
  }, [demoMode, projectIdFromQuery, projectId]);

  useEffect(() => {
    let cancelled = false;

    async function loadPage() {
      try {
        if (!cancelled) {
          setError(null);
          setLoading(true);
        }

        // Full-site demo: skip API and swap sections instantly (no loading flash / hard reload feel).
        if (demoMode) {
          const demoData = buildSiteNextDemoWebsiteData(activePathname || '/');
          const demoSections = Array.isArray(demoData.sections) ? demoData.sections : [];
          const normalized = hydrateSectionsForDisplay(demoSections, {
            themeSettings: null,
            stripPresetColors: false,
          });
          if (cancelled) return;
          setSections(normalized);
          setThemeSettings(null);
          setGlobalElementStyles(undefined);
          setGlobalColors(DEMO_GLOBAL_COLORS);
          setSitePageType(resolveDemoPageType(activePathname || '/'));
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

        if (!cancelled) setSitePageType('');

        if (!projectId) {
          throw new Error('Set NEXT_PUBLIC_PROJECT_ID or pass ?projectId= in the URL');
        }

        // Live blog article: /blog/:slug → getPublishedBlog (GenieBuild-shaped) + chrome
        const liveBlogSlug = extractBlogSlugFromPath(activePathname || '');
        if (liveBlogSlug) {
          const detail = await fetchPublishedBlogBySlug({
            projectId,
            slug: liveBlogSlug,
          });
          if (cancelled) return;
          if (!detail) {
            throw new Error(`Blog not found for “/blog/${liveBlogSlug}”.`);
          }

          // Prefer homepage chrome (header/footer + theme); fall back to empty chrome templates.
          let chromeSections: Section[] = [];
          let apiThemeSettings: any = null;
          try {
            const homeResponse = await getWebsitePageData({
              projectId,
              slug: '',
            });
            if (cancelled) return;
            const homeData = homeResponse?.data;
            chromeSections = Array.isArray(homeData?.sections) ? homeData.sections : [];
            apiThemeSettings = homeData?.themeSettings || null;
          } catch {
            /* chrome optional */
          }

          const assembled = assembleLiveBlogDetailSections(detail, chromeSections);
          const themeSync = syncThemeFromApiSettings(apiThemeSettings, { projectId });
          const normalized = hydrateSectionsForDisplay(assembled, {
            themeSettings: apiThemeSettings,
            stripPresetColors: themeSync.shouldStripPresetColors,
          });
          if (cancelled) return;
          setSections(normalized);
          setThemeSettings(apiThemeSettings);
          setGlobalElementStyles(themeSync.globalElementStyles);
          setGlobalColors(themeSync.globalColors);
          setSitePageType('blog');
          setSeoData(
            normalizePageSeoFromApi({
              seo: {
                title: detail.seo?.metaTitle || detail.title || detail.hero?.title,
                description:
                  detail.seo?.metaDescription ||
                  detail.information ||
                  detail.content?.information ||
                  '',
                keywords: Array.isArray(detail.seo?.keywords)
                  ? detail.seo.keywords.join(', ')
                  : detail.seo?.keywords,
                ogTitle: detail.seo?.ogTitle || detail.seo?.metaTitle || detail.title,
                ogDescription:
                  detail.seo?.ogDescription ||
                  detail.seo?.metaDescription ||
                  detail.information ||
                  '',
                ogType: detail.seo?.ogType || 'article',
                schemas: Array.isArray(detail.seo?.schemas) ? detail.seo.schemas : [],
                structured_data: detail.seo?.structured_data || '',
                structuredData: detail.seo?.structured_data || '',
              },
            })
          );
          setLoading(false);
          return;
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
          if (cancelled) return;
          if (detailsResponse?.redirect?.to) {
            // Soft-nav to canonical path (preserves projectId query).
            dispatchSitePathChange(detailsResponse.redirect.to);
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
          // Always continue to website_page — details and page load share the same resolver,
          // but throwing here caused false “Page not found” before a second chance / redirect.
        }

        if (resolvedProjectId) writeStoredProjectId(resolvedProjectId);

        let response;
        try {
          response = await getWebsitePageData({
            projectId: resolvedProjectId,
            ...(resolvedPageId ? { pageId: resolvedPageId } : {}),
            ...(resolvedLocationId ? { locationId: resolvedLocationId } : {}),
            slug: resolvedSlug || slugForDetails || '',
            ...(resolvedPageType ? { pageType: resolvedPageType } : {}),
          });
        } catch (pageErr: any) {
          const msg = String(pageErr?.message || pageErr || '');
          if (slugForDetails && /not found|not available|404/i.test(msg)) {
            throw new Error(`Page not found for “/${slugForDetails}”.`);
          }
          throw pageErr;
        }
        if (cancelled) return;

        if (response?.redirect?.to) {
          dispatchSitePathChange(response.redirect.to);
          return;
        }

        const data = response?.data;
        if (!data && slugForDetails) {
          throw new Error(`Page not found for “/${slugForDetails}”.`);
        }

        setSitePageType(
          resolvedPageType ||
            String((data as any)?.page?.pageType || (data as any)?.pageType || '').toLowerCase()
        );
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
        if (cancelled) return;
        const raw = String(err?.message || 'Failed to load website page');
        const isNetwork = /network error/i.test(raw);
        setError(
          isNetwork
            ? `${raw}. SiteNext cannot reach the API. Ensure backend is on :1111 and apps/sitenextjs/.env.local has NEXT_PUBLIC_SITENEXTJS_API_URL=http://localhost:1111/sitenextjs/v1 (then restart next dev).`
            : raw
        );
        setSections([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadPage();
    return () => {
      cancelled = true;
    };
  }, [demoMode, projectId, slugFromRoute, activePathname]);

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
      key={activePathname || '/'}
      sections={sections}
      globalColors={globalColors}
      themeSettings={themeSettings}
      globalElementStyles={globalElementStyles}
      projectId={demoMode ? undefined : projectId || undefined}
      sitePathname={activePathname || '/'}
      sitePageType={sitePageType}
    />
  );
}
