import React, { useState, useMemo, useEffect, useRef } from 'react';
import { WebsiteData, Section, SectionType, WebsiteElement, ElementType, SEOMetadata } from './types';
import { DEFAULT_TYPOGRAPHY, INITIAL_TEMPLATE, SECTION_TEMPLATES, PRESET_THEMES, ELEMENT_DEFAULTS } from './constants';
import { getStandaloneInitialWebsiteData, isLocalServiceDemoPath, isLocalAboutDemoPath, isLocalServiceDetailDemoPath, isLocalServicesListDemoPath, isLocalContactDemoPath, isLocalBlogsDemoPath, isLocalBlogDetailDemoPath, isLocalLocationDemoPath, isLocalAreasListDemoPath, getLocalLegalDemoTitle, resolveDemoWebsiteDataByPath } from './localServiceDemo';
import { geminiService } from './services/geminiService';
import { API_BASE_URL, MEDIA_BASE_URL, isValidHttpUrl, toAbsoluteMediaUrl } from './config';
import SectionRenderer from './components/SectionRenderer';
import { preloadVariant } from './components/sections/SectionRouter';
import { PreviewFrame } from './components/PreviewFrame';
import toast, { Toaster } from 'react-hot-toast';
import { getDefaultVariant, getVariantsForSection, setActiveProjectType } from './components/SectionsAndVariantRegistry';
import { ThemeProvider, useTheme, type ThemeData } from '@ui/blocks';
import { AboutUsContactProvider } from './components/builder/context/AboutUsContactContext';
import { OpenInternalLinkProvider } from './components/builder/context/OpenInternalLinkContext';
import { GlobalElementStylesContext } from './components/builder/state/GlobalElementStylesContext';
import { DefaultSizesContext } from './components/builder/state/DefaultSizesContext';
import {
  AccordionGroup,
  ColorInput,
  TextInput,
  TextAreaInput,
  RangeInput,
  SelectInput,
  SpacingInputGroup,
  IconPicker,
  ImageControl,
  VideoControl,
  BackgroundControl,
  FontSizeInput,
  ButtonGroup,
} from './components/builder/inputs';
import { colorToHex, applyUpdateSection, applyUpdateElement, mergeElementContent } from './components/builder/state/sectionUpdaters';
import { applyThemeToSiteData } from './components/builder/state/applyThemeReducer';
import { applyRestoreSectionElements, applyResetSectionStyles } from './components/builder/state/sectionResetReducers';
import { getActiveGlobalTheme as _getActiveGlobalTheme, computeThemeOverlayDefaults } from './components/builder/state/themeHelpers';
import { uploadFileToApi, normalizeSectionImages, parseBackgroundImageIndex } from './components/builder/state/fileUploadHelpers';
import { compressImageFile } from './components/builder/state/imageCompressor';
import { normalizeSectionContent } from './components/builder/state/sectionContentNormalizer';
import { buildUpdatedComponentIds, buildWebsitePayload, buildSectionContentEntries, buildThemePayload } from './components/builder/state/savePayloadBuilders';
import { hydrateSectionsForDisplay } from './utils/sectionHydration';
import {
  findPageIdByHref,
  isTrueExternalHref,
  normalizeInternalPath,
} from './utils/resolveInternalPageLink';
import {
  applySiteThemeToDocument,
  applySiteTypographyToDocument,
  buildThemeSavePayload,
  ensureSiteGoogleFontsLoaded,
  hasPresetThemeSettings,
  mountSiteThemeCss,
  settingsFromPresetIndex,
  syncThemeFromApiSettings,
} from './utils/themeResolver';
import { buildDefaultSizesFromApi, buildDefaultTypographyFromApi, applyCustomColorsToSiteData } from './components/builder/state/themeSettingsHelpers';
import { applyVariantRefresh } from './components/builder/state/variantRefreshReducer';
import { buildNewSection } from './components/builder/state/newSectionBuilder';
import { buildDefaultAccordionStyle } from './components/builder/state/accordionDefaults';
import { applyClearMatchingDefaultSizes } from './components/builder/state/clearDefaultSizesReducer';
import { useHistory, useUndoRedoShortcuts } from './components/builder/state/useHistory';
import { useAutosave, readLocalBackup, clearLocalBackup } from './components/builder/state/useAutosave';
import { buildResponsiveOverrideCss, resolveSectionForBreakpoint, styleFieldForBreakpoint, type EditBreakpoint } from './components/builder/state/responsiveOverrideCss';
import { flushInlineEdits } from './components/sections/editableHtmlHelpers';
import { commitPendingEditablesToSiteData } from './components/sections/flushEditableForSave';
import { applySeoToDocument } from './components/builder/state/seoHelpers';
import {
  apiSeoToMetadata,
  fetchPageSeo,
  pickSeoFromGenieBuildPageResponse,
} from './components/builder/state/pageSeoApi';
import {
  commitSectionsToCurrentPage,
  switchToPage,
  addPage as addPageReducer,
  renamePage,
  deletePage as deletePageReducer,
  reorderPage,
  updateCurrentPageSeo,
  splitGlobalAndPageSections,
  mergeGlobalChrome,
} from './components/builder/state/pagesReducer';
import { PagesPanel } from './components/builder/layout/PagesPanel';
import { KeyboardShortcutsModal } from './components/builder/layout/KeyboardShortcutsModal';
import { hasMeaningfulSectionContent, resolveSectionStyles, resolveElementStyle } from './components/builder/state/styleResolvers';
import { BuilderHeader } from './components/builder/layout/BuilderHeader';
import { GlobalThemePanel } from './components/builder/layout/GlobalThemePanel';
import { SectionSidebarHeader } from './components/builder/layout/SectionSidebarHeader';
import { SectionSidebarBody } from './components/builder/layout/SectionSidebarBody';
import { formatVariantName } from './components/builder/state/variantNameFormatter';
import { BadgeStylesBlock, CardStylesBlock, AccordionStylesBlock, ButtonStylesBlock, FeatureBoxStylesBlock, StatCardStylesBlock, StarRatingStylesBlock, RowStylesBlock, ColumnStylesBlock, TestimonialCardStylesBlock, TrustStripStylesBlock, ListStylesBlock, NavMenuStylesBlock, AlertBoxStylesBlock, DividerStylesBlock, IconStylesBlock, HighlightTextStylesBlock, BlockquoteStylesBlock, CounterStylesBlock, ProgressBarStylesBlock, CountdownTimerStylesBlock, ToggleStylesBlock, TabsStylesBlock, PricingTableStylesBlock, PricingItemStylesBlock, FlipBoxStylesBlock, VideoStylesBlock, ImageBoxStylesBlock, LogoCloudStylesBlock, UserAvatarsStylesBlock, ReviewCarouselStylesBlock, HeadingStylesBlock, TextStylesBlock, TypographyBlock, LayoutSpacingBlock, BorderBlock, SectionImageSettingsBlock, ElementBackgroundOverlayBlock, ImageElementStylesBlock, SectionBackgroundBlock, BulkElementStylesBlock, ElementBackgroundBlock, SectionLayoutPresetsBlock, SectionDesignExtrasBlock, SectionDividersBlock, ElementAdvancedBlock } from './components/builder/style-editor';

import {
  resolveClientProjectId,
  syncGenieBuildUrl,
  writeStoredProjectId,
} from './lib/projectIdStorage';

// Token TTL: 8 hours. Stored in sessionStorage so it's cleared when the tab closes.
const TOKEN_EXPIRY_MS = 8 * 60 * 60 * 1000;

const getUrlParams = () => {
  const params = new URLSearchParams(window.location.search);
  const urlToken = params.get('token');

  if (urlToken) {
    // New token from URL — persist to sessionStorage with expiry
    sessionStorage.setItem('gb_token', urlToken);
    sessionStorage.setItem('gb_token_exp', String(Date.now() + TOKEN_EXPIRY_MS));
    // Remove stale localStorage token if present
    localStorage.removeItem('token');
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.delete('token');
    window.history.replaceState({}, '', newUrl.toString());
  }

  // Validate stored token expiry
  const storedToken = sessionStorage.getItem('gb_token');
  const tokenExp = Number(sessionStorage.getItem('gb_token_exp') || 0);
  const validStoredToken = storedToken && Date.now() < tokenExp ? storedToken : null;

  // Same resolution order as SiteNextJS: ?projectId= → localStorage/cookie
  const projectId = resolveClientProjectId(params.get('projectId'));
  const pageId = params.get('pageId');
  const locationId = params.get('locationId');

  // If we recovered projectId from storage, put it back on the URL for share/refresh.
  if (projectId && !params.get('projectId')) {
    syncGenieBuildUrl({ projectId, pageId, locationId });
  }

  return {
    projectId,
    pageId,
    locationId,
    token: urlToken || validStoredToken,
  };
};

// Helper lists for sidebar categorization
const BASIC_ELEMENTS: ElementType[] = ['heading', 'text', 'button', 'image', 'video', 'icon', 'icon-box', 'feature-box', 'image-box', 'list', 'star-rating', 'badge', 'highlight-text', 'blockquote', 'pricing-item', 'trust-strip'];
const ADVANCED_ELEMENTS: ElementType[] = ['accordion', 'toggle', 'tabs', 'progress-bar', 'counter', 'testimonial', 'testimonial-card', 'review-carousel', 'alert-box', 'pricing-table', 'flip-box', 'call-to-action', 'countdown-timer'];

// Helper function to format variant name for display

// --- UI Components for Sidebar ---
// colorToHex, applyUpdateSection, applyUpdateElement now live in ./components/builder/state/sectionUpdaters



// --- Main App Component ---

const AppContent: React.FC = () => {
  const { themeData } = useTheme();
  
  // Get theme overlay defaults dynamically based on API theme or Crimson Jet fallback
  const getThemeOverlayDefaults = () => {
    return computeThemeOverlayDefaults(themeData) as {
      enabled: boolean;
      color: string;
      opacity: number;
      blendMode: any;
    };
  };
  const [siteData, setSiteData, undo, redo, canUndo, canRedo, resetSiteDataHistory] = useHistory<WebsiteData>(getStandaloneInitialWebsiteData());
  useUndoRedoShortcuts(undo, redo);

  /** Without `projectId`, swap dummy homepage vs `/service` vs `/services/:name` (detail) vs `/services` (listing) vs `/about` preview when the user uses browser back/forward. */
  const standaloneDemoModeRef = useRef<string | null>(null);
  useEffect(() => {
    const { projectId } = getUrlParams();
    if (projectId) {
      standaloneDemoModeRef.current = null;
      return;
    }
    // Order matters: DETAIL routes (/services/:name, /blog/:slug) before their
    // listing counterparts (/services, /blogs). Legal (privacy/terms/…) carries
    // a title so the mode key includes it.
    const resolveMode = (): string => {
      const p = window.location.pathname;
      const legalTitle = getLocalLegalDemoTitle(p);
      if (isLocalAboutDemoPath(p)) return 'about';
      if (isLocalContactDemoPath(p)) return 'contact';
      if (legalTitle) return `legal:${legalTitle}`;
      if (isLocalAreasListDemoPath(p)) return 'areas';
      if (isLocalLocationDemoPath(p)) return 'location';
      if (isLocalBlogDetailDemoPath(p)) return 'blogdetail';
      if (isLocalBlogsDemoPath(p)) return 'blogs';
      if (isLocalServiceDetailDemoPath(p)) return 'servicedetail';
      if (isLocalServicesListDemoPath(p)) return 'serviceslist';
      if (isLocalServiceDemoPath(p)) return 'service';
      return 'home';
    };
    standaloneDemoModeRef.current = resolveMode();
    const sync = () => {
      if (getUrlParams().projectId) return;
      const mode = resolveMode();
      if (standaloneDemoModeRef.current === mode) return;
      standaloneDemoModeRef.current = mode;
      resetSiteDataHistory(resolveDemoWebsiteDataByPath(window.location.pathname));
    };
    window.addEventListener('popstate', sync);
    return () => window.removeEventListener('popstate', sync);
  }, [resetSiteDataHistory]);

  // Preload every section variant used on the current page in parallel.
  // Runs whenever the section list changes. Without this, each <SectionRouter>
  // requests its own chunk on mount, so sections pop in one by one on refresh.
  useEffect(() => {
    const all = [...(siteData.globalSections || []), ...(siteData.sections || [])];
    for (const s of all) {
      const variant = (s.styles as any)?.variant || getDefaultVariant(s.type);
      if (s.type && variant) preloadVariant(s.type, variant);
    }
  }, [siteData.sections, siteData.globalSections]);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null); 
  const [selectedVirtualElement, setSelectedVirtualElement] = useState<WebsiteElement | null>(null); 
  const initialSectionContentRef = useRef<Record<string, any>>({});
  
  const [editTab, setEditTab] = useState<'content' | 'design' | 'advanced'>('content'); 
  const [globalTab, setGlobalTab] = useState<'typography' | 'seo' | 'pages' | 'sections'>('pages');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<number>(100); // Zoom level in percentage (25-200%)
  const [viewMode, setViewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  
  // Device viewport widths (fixed, independent of builder UI)
  const deviceWidths = {
    desktop: 1440,
    tablet: 1024,
    mobile: 375
  };
  
  const currentDeviceWidth = deviceWidths[viewMode];
  const zoomScale = zoomLevel / 100;

  /** What breakpoint the sidebar edits write to. Tracks `viewMode` so switching
   *  to the tablet/mobile device puts the sidebar in override-edit mode. */
  const editBreakpoint: EditBreakpoint = viewMode;

  // Auto-adjust zoom when sidebar opens/closes
  useEffect(() => {
    setZoomLevel(isSidebarOpen && !isPreviewMode ? 87 : 100);
  }, [isSidebarOpen, isPreviewMode]);
  const zoomViewportWidthPercent = 100 / zoomScale;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadTarget, setUploadTarget] = useState<{sectionId: string, elementId?: string, field: string} | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [loadingPageData, setLoadingPageData] = useState(false);
  const [savingPageData, setSavingPageData] = useState(false);
  const [sectionContentSource, setSectionContentSource] = useState<Record<string, 'api' | 'default' | 'loading'>>({});
  
  // Theme settings state
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  const [isCustomTheme, setIsCustomTheme] = useState(false);
  const [defaultSizes, setDefaultSizes] = useState({
    h1: '3rem',      // 48px
    h2: '2.5rem',    // 40px
    h3: '2rem',      // 32px
    h4: '1.5rem',    // 24px
    h5: '1.25rem',   // 20px
    h6: '1rem',      // 16px
    text: '1rem',    // 16px
    textSmall: '0.875rem',  // 14px
    textLarge: '1.125rem',  // 18px
    textXl: '1.25rem'       // 20px
  });
  const [defaultTypography, setDefaultTypography] = useState({
    titleFontFamily: DEFAULT_TYPOGRAPHY.h1.fontFamily,
    subtitleFontFamily: DEFAULT_TYPOGRAPHY.h2.fontFamily,
    descriptionFontFamily: DEFAULT_TYPOGRAPHY.p.fontFamily,
    buttonFontFamily: DEFAULT_TYPOGRAPHY.button.fontFamily,
  });
  const [additionalCss, setAdditionalCss] = useState<{
    blogCss: string;
    siteCss: string;
    applyBlogCssToSite: boolean;
  }>({ blogCss: '', siteCss: '', applyBlogCssToSite: false });
  const [savingTheme, setSavingTheme] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  /** Toggleable in Global Settings — draws a subtle dashed outline around
   *  every section so users can spot boundaries without hovering. */
  const [showSectionOutlines, setShowSectionOutlines] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('genieBuild.showSectionOutlines');
      return stored === null ? true : stored === 'true'; // default ON for first-time users
    } catch { return true; }
  });
  useEffect(() => {
    try { localStorage.setItem('genieBuild.showSectionOutlines', String(showSectionOutlines)); } catch {}
  }, [showSectionOutlines]);

  // Load page data + theme settings, then the project page list.
  // Sequential on purpose: loadPageData resets history; loadPageList must
  // merge afterward so the Pages panel keeps every server page.
  useEffect(() => {
    const { projectId, pageId } = getUrlParams();
    if (!projectId) return;
    let cancelled = false;
    setLoadingPageData(true);
    (async () => {
      try {
        // Resolve which page to open. When the URL carries no pageId (the common
        // case when a site is opened straight from its projectId — e.g. the MCP
        // link, or "open in builder" without a specific page), fall back to the
        // project's FIRST page. Previously we only loaded page data when a pageId
        // was present, so a bare ?projectId= link showed the empty default
        // template instead of the real saved project.
        let targetPageId = pageId;
        if (!targetPageId) {
          targetPageId = await resolveFirstPageId(projectId);
        }
        if (!cancelled && targetPageId) await loadPageData(projectId, targetPageId);
        if (!cancelled) await loadPageList(projectId);
      } finally {
        if (!cancelled) setLoadingPageData(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Fetch the project's page list and return the first page's id, so a bare
  // ?projectId= link (no pageId) can still open the real home page's content.
  const resolveFirstPageId = async (projectId: string): Promise<string | null> => {
    try {
      const { token } = getUrlParams();
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`${API_BASE_URL}/getWebsitePages/${projectId}`, { method: 'GET', headers });
      if (!res.ok) return null;
      const body = await res.json().catch(() => ({}));
      const serverPages = Array.isArray(body?.data) ? body.data : [];
      if (!serverPages.length) return null;
      // Prefer the home page (slug '/' or 'home'), else the first page.
      const home = serverPages.find((sp: any) => {
        const slug = String(sp.slug || '').replace(/^\//, '').toLowerCase();
        const name = String(sp.name || sp.displayName || '').toLowerCase();
        return slug === '' || slug === 'home' || name === 'home';
      });
      const chosen = home || serverPages[0];
      return String(chosen.pageId || chosen._id || '') || null;
    } catch {
      return null;
    }
  };

  // Fetch the full WebsitePage list for the project and merge it into siteData.
  // Each page that already exists in local state keeps its sections; new
  // pages from the server show up empty (sections will be loaded on switch).
  const loadPageList = async (projectId: string) => {
    try {
      const { token } = getUrlParams();
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`${API_BASE_URL}/getWebsitePages/${projectId}`, { method: 'GET', headers });
      if (!res.ok) {
        console.warn('[loadPageList] non-OK response', res.status);
        return;
      }
      const body = await res.json().catch(() => ({}));
      const serverPages = Array.isArray(body?.data) ? body.data : [];
      if (!serverPages.length) return;

      // Map server rows into the local WebsitePage shape. Sections start
      // empty for every page except the one already loaded (URL / current).
      const { pageId: urlPageId } = getUrlParams();
      setSiteData(prev => {
        const existingById = new Map((prev.pages || []).map(p => [p.id, p]));
        const activeId = String(urlPageId || prev.currentPageId || '').trim();
        const merged = serverPages.map((sp: any) => {
          const id = String(sp.pageId || sp._id);
          const existing = existingById.get(id);
          const name = sp.displayName || sp.name || 'Untitled';
          const slug = sp.slug?.startsWith('/') ? sp.slug : `/${sp.slug || ''}`;
          if (existing && Array.isArray(existing.sections) && existing.sections.length > 0) {
            return { ...existing, name, slug };
          }
          // Attach already-loaded body sections to the real server page id.
          if (id === activeId && Array.isArray(prev.sections) && prev.sections.length > 0) {
            return {
              id,
              name,
              slug,
              sections: prev.sections,
              seo: prev.seo || {},
            };
          }
          return existing || {
            id,
            name,
            slug,
            sections: [],
            seo: {},
          };
        });
        return {
          ...prev,
          pages: merged,
          currentPageId: activeId || prev.currentPageId || merged[0]?.id,
        };
      });
    } catch (e) {
      console.error('[loadPageList] error:', e);
    }
  };

  const loadPageData = async (projectId: string, pageId: string) => {
    try {
      const { token, locationId } = getUrlParams();
      const apiUrl = API_BASE_URL;
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(
        `${apiUrl}/getGenieBuildPageData/${projectId}/${pageId}${locationId ? `?locationId=${encodeURIComponent(locationId)}` : ''}`,
        {
        method: 'GET',
        headers,
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch website data');
      }

      const data = await response.json();
      if (data?.data?.projectType !== undefined && data?.data?.projectType !== null) {
        setActiveProjectType(Number(data.data.projectType));
      }
      if (Array.isArray(data?.data?.sections) && data.data.sections.length > 0) {
        const apiThemeSettings = data?.data?.themeSettings || null;
        const themeSync = syncThemeFromApiSettings(apiThemeSettings, { projectId });
        const globalColors = {
          ...themeSync.globalColors,
          subtitleColor: themeSync.globalColors.textColor,
          linkColor: themeSync.globalColors.accentColor,
          borderColor: themeSync.globalColors.accentColor,
        };

        let cleanedSections = hydrateSectionsForDisplay(data.data.sections, {
          themeSettings: apiThemeSettings,
          stripPresetColors: false,
        });
        initialSectionContentRef.current = Object.fromEntries(
          cleanedSections.map((s) => [s.id, JSON.parse(JSON.stringify(s.content || {}))])
        );

        if (apiThemeSettings) {
          const { defaultSizes: savedSizes, defaultTypography: savedTypography, theme, customColors } =
            apiThemeSettings;
          setDefaultSizes(buildDefaultSizesFromApi(savedSizes));
          setDefaultTypography(buildDefaultTypographyFromApi(savedTypography, apiThemeSettings));
          setAdditionalCss({
            blogCss: String(apiThemeSettings.additionalCss?.blogCss || ''),
            siteCss: String(apiThemeSettings.additionalCss?.siteCss || ''),
            applyBlogCssToSite: Boolean(apiThemeSettings.additionalCss?.applyBlogCssToSite),
          });
          applySiteTypographyToDocument(apiThemeSettings, DEFAULT_TYPOGRAPHY);
          if (customColors && theme === 'custom') {
            setSiteData((prev) => applyCustomColorsToSiteData(prev, customColors));
          }
          setSelectedPresetId(themeSync.selectedPresetId);
          setIsCustomTheme(themeSync.resolved.isCustom);
        } else {
          applySiteThemeToDocument(null);
        }

        // API returns a flat header + body + footer stack (same as SiteNextJS).
        // Keep chrome in globalSections so page switches don't drop the header.
        const { globalSections, pageSections } = splitGlobalAndPageSections(cleanedSections);
        const pageSeo = pickSeoFromGenieBuildPageResponse(data?.data);
        const loadedData: WebsiteData = {
          ...INITIAL_TEMPLATE,
          sections: pageSections,
          globalSections,
          globalStyles: {
            ...INITIAL_TEMPLATE.globalStyles,
            colors: globalColors,
          },
          globalElementStyles: themeSync.globalElementStyles,
          pages: [
            {
              id: pageId,
              name: String(data?.data?.displayName || data?.data?.name || 'Home'),
              slug: String(data?.data?.slug || '/').startsWith('/')
                ? String(data?.data?.slug || '/')
                : `/${data?.data?.slug || ''}`,
              sections: pageSections,
              seo: pageSeo || {},
            },
          ],
          currentPageId: pageId,
          seo: pageSeo || INITIAL_TEMPLATE.seo,
        };

        // Always load the server snapshot on refresh; discard stale local backup.
        const backupKey = `genieBuild.backup.${projectId}.${pageId}`;
        clearLocalBackup(backupKey);
        resetSiteDataHistory(loadedData);
      }
    } catch (error) {
      console.error('Error loading page data:', error);
    }
  };

  const savePageData = async (silent: boolean = false) => {
      const { projectId, pageId, token, locationId } = getUrlParams();
    if (!projectId || !pageId) {
      if (!silent) toast.error('Missing projectId or pageId in URL');
      return;
    }

    if (!token) {
      if (!silent) toast.error('Authentication token not found. Please open GenieBuild from the admin panel.');
      return;
    }

    try {
      // Read live contentEditable DOM into siteData BEFORE build — blur/setState is async
      // and would otherwise save the previous heading/text (refresh shows old content).
      const siteDataWithEdits = commitPendingEditablesToSiteData(siteData);
      if (siteDataWithEdits !== siteData) {
        setSiteData(siteDataWithEdits);
      }
      flushInlineEdits();
      setSavingPageData(true);
      const apiUrl = API_BASE_URL;
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      };
      
      // Commit the active page's current working sections into pages[currentPageId]
      // before building the payload, so in-progress edits persist with the page.
      const siteDataForSave = commitSectionsToCurrentPage(siteDataWithEdits);
      // Persist chrome + body together — backend expects a flat header/body/footer stack.
      const sectionsForSave = [
        ...(siteDataForSave.globalSections || []),
        ...(siteDataForSave.sections || []),
      ];
      const updatedComponentIds = buildUpdatedComponentIds([], sectionsForSave);
      const savePayload = buildWebsitePayload(siteDataForSave, projectId, pageId, updatedComponentIds);

      const saveResponse = await fetch(`${apiUrl}/saveWebsiteDesignData`, {
        method: 'POST',
        headers,
        body: JSON.stringify(savePayload),
      });

      if (!saveResponse.ok) {
        const errorData = await saveResponse.json();
        throw new Error(errorData.message || 'Failed to save website data');
      }

      // Persist builder-edited section content into SectionContent as well.
      // This makes "reset to default" use the last saved user content on subsequent loads.
      try {
        const sections = buildSectionContentEntries(updatedComponentIds);
        const upsertResponse = await fetch(`${apiUrl}/upsertSectionContentFromBuilder`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ projectId, pageId, locationId: locationId || null, sections })
        });
        if (!upsertResponse.ok) {
          const upsertError = await upsertResponse.json().catch(() => ({} as any));
          throw new Error(upsertError?.message || 'Failed to persist section content');
        }
      } catch (e) {
        console.warn('[GenieBuild] Failed to upsert SectionContent from builder:', e);
        throw e;
      }

      // Also save theme settings if they exist
      try {
        const themePayload = buildThemePayload(siteData, projectId, selectedPresetId, defaultSizes, defaultTypography);
        const themeResponse = await fetch(`${apiUrl}/updateProjectTheme`, {
          method: 'POST',
          headers,
          body: JSON.stringify(themePayload)
        });
        if (!themeResponse.ok) {
          console.warn('Failed to save theme settings, but page data was saved');
        }
      } catch (themeError) {
        console.warn('Error saving theme settings:', themeError);
      }

      try {
        const pageSeo =
          siteDataForSave.pages?.find((p) => p.id === (siteDataForSave.currentPageId || pageId))?.seo ||
          siteDataForSave.seo;
        if (pageSeo && Object.keys(pageSeo).length > 0) {
          await fetch(`${apiUrl}/updateWebsitePageSeo`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ projectId, pageId, seo: pageSeo }),
          });
        }
      } catch (seoErr) {
        console.warn('[GenieBuild] Failed to save page SEO:', seoErr);
      }

      if (!silent) toast.success('Website changes saved successfully!');
    } catch (error: any) {
      console.error('Error saving page data:', error);
      if (!silent) toast.error(`Failed to save: ${error.message}`);
      throw error; // let autosave hook mark status='error'
    } finally {
      setSavingPageData(false);
    }
  };

  // Manual save mode: track unsaved changes + local backup only.
  // No backend save call until user clicks Save (or Ctrl/Cmd+S).
  const autosaveKey = (() => {
    const { projectId, pageId } = getUrlParams();
    return projectId && pageId ? `genieBuild.backup.${projectId}.${pageId}` : null;
  })();

  const autosave = useAutosave({
    value: siteData,
    onSave: () => savePageData(true),
    delayMs: 3000,
    pause: loadingPageData,
    localStorageKey: autosaveKey,
    autoSaveEnabled: false,
  });

  // Clear localStorage backup after a successful manual save via the header button.
  // Wrap savePageData so the Save button also marks autosave clean.
  const savePageDataAndMarkClean = async () => {
    try {
      await savePageData(false);
      autosave.markClean();
      if (autosaveKey) clearLocalBackup(autosaveKey);
    } catch {
      // Error already toasted inside savePageData
    }
  };

  // Warn before closing/navigating away with unsaved changes.
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (autosave.isDirty) {
        e.preventDefault();
        // Chrome requires returnValue to be set
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [autosave.isDirty]);

  // Global keyboard shortcuts: `?` to open the shortcuts modal, Ctrl/Cmd+S
  // to save manually. Skips when typing in a form field so native browser
  // behavior (and text entry of the "?" character) still works.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInput = !!target && (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable
      );

      // Ctrl/Cmd+S — manual save
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        savePageDataAndMarkClean();
        return;
      }

      // `?` — open shortcuts panel (not while typing)
      if (!isInput && (e.key === '?' || (e.shiftKey && e.key === '/'))) {
        e.preventDefault();
        setShowShortcuts(true);
        return;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
    // savePageDataAndMarkClean is stable enough that re-binding on every
    // render is fine; no dep array to avoid stale closures on siteData.
  });

  const selectedSection = useMemo(() => {
    const section = siteData.sections.find(s => s.id === selectedSectionId);
    return section;
  }, [siteData.sections, selectedSectionId]);


  // Detect whether selected section content is API-backed from loaded page payload.
  useEffect(() => {
    if (!selectedSection) return;
    setSectionContentSource(prev => ({
      ...prev,
      [selectedSection.id]: hasMeaningfulSectionContent(selectedSection) ? 'api' : 'default'
    }));
  }, [selectedSection?.id, selectedSection?.type]);

  const selectedElement = useMemo(() => {
    if (!selectedSection || !selectedElementId) return null;
    // Canvas click passes the resolved element (DNA + API merge). That snapshot is what
    // the user sees in preview — prefer it over raw section.elements[] so the sidebar
    // never shows stale/empty content while the canvas shows live DNA-filled text.
    if (selectedVirtualElement && selectedVirtualElement.id === selectedElementId) {
      return selectedVirtualElement;
    }
    return selectedSection.elements?.find(e => e.id === selectedElementId) || null;
  }, [selectedSection, selectedElementId, selectedVirtualElement, themeData]);

  // Cascading style resolvers (pure helpers in state/styleResolvers.ts)
  const activeTemplate = selectedSection ? (SECTION_TEMPLATES[selectedSection.type] || null) : null;
  const baseResolvedSectionStyles: any = resolveSectionStyles(selectedSection);
  // Merge breakpoint section overrides on top so Design/Advanced tab inputs
  // reflect the effective value at the active device view.
  const sectionBreakpointOverride: Partial<Section['styles']> = selectedSection
    ? (editBreakpoint === 'mobile'
        ? (selectedSection.mobileStyles || {})
        : editBreakpoint === 'tablet'
          ? (selectedSection.tabletStyles || {})
          : {})
    : {};
  const resolvedSectionStyles: any = { ...baseResolvedSectionStyles, ...sectionBreakpointOverride };
  const resolvedElementStyle = resolveElementStyle(selectedElement, selectedSection);

  useEffect(() => {
    if (selectedSectionId && !isPreviewMode) {
      setIsSidebarOpen(true);
      
      // If an element is selected, verify it actually exists either in the array OR as our active virtual element
      if (selectedElementId && selectedSection) {
        const existsInArray = selectedSection.elements?.find(e => e.id === selectedElementId);
        const isOurVirtualElement = selectedVirtualElement && selectedVirtualElement.id === selectedElementId;
        
        // If it's completely orphaned (neither saved nor currently virtual), clear the selection
        if (!existsInArray && !isOurVirtualElement) {
          setSelectedElementId(null);
          setSelectedVirtualElement(null);
        }
      }
    } else {
      setIsSidebarOpen(false);
    }
  }, [selectedSectionId, selectedElementId, isPreviewMode, selectedSection, selectedVirtualElement]);
  
  useEffect(() => {
      if(selectedElementId) {
          if(editTab === 'advanced') setEditTab('content');
      }
  }, [selectedElementId]);

  // Update sections with default sizes in real-time when defaultSizes change
  // Always clear titleSize/subtitleSize to let CSS defaults apply (unless custom override exists)
  useEffect(() => {
    setSiteData(prev => applyClearMatchingDefaultSizes(prev, defaultSizes));
  }, [defaultSizes]);

  useEffect(() => {
    const { colors } = siteData.globalStyles;
    const themeSettings = { defaultTypography, defaultSizes, additionalCss };

    applySiteTypographyToDocument(themeSettings, DEFAULT_TYPOGRAPHY);
    ensureSiteGoogleFontsLoaded('geniebuild-fonts');

    const zoomSliderCss = `
      .zoom-slider::-webkit-slider-thumb {
        appearance: none;
        width: 14px;
        height: 14px;
        border-radius: 50%;
        background: #3b82f6;
        cursor: pointer;
        border: 2px solid #1e293b;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
      }
      .zoom-slider::-moz-range-thumb {
        width: 14px;
        height: 14px;
        border-radius: 50%;
        background: #3b82f6;
        cursor: pointer;
        border: 2px solid #1e293b;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
      }
      .zoom-slider:focus { outline: none; }
      .zoom-slider:focus::-webkit-slider-thumb {
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
      }
    `;

    const cleanup = mountSiteThemeCss({
      themeSettings,
      globalColors: {
        backgroundColor: colors.backgroundColor,
        textColor: colors.textColor,
        titleColor: colors.titleColor,
        accentColor: colors.accentColor,
        buttonBackgroundColor: colors.buttonBackgroundColor,
        buttonTextColor: colors.buttonTextColor,
      },
    });

    const styleEl = document.getElementById('dynamic-theme-styles');
    if (styleEl) {
      styleEl.textContent = `${styleEl.textContent || ''}\n${zoomSliderCss}`;
    }

    return cleanup;
  }, [siteData.globalStyles.colors, defaultSizes, defaultTypography, additionalCss]);

  // Inject per-element tablet/mobile style overrides as media-queried CSS.
  // Targets `[data-element-id="..."]` — section components that set this
  // attribute get responsive overrides for free; components that don't are
  // simply unaffected (safe to roll out progressively).
  // Eagerly create the responsive-overrides style tag on mount so PreviewFrame's
  // mirror observer picks it up immediately (before any user edit).
  useEffect(() => {
    if (!document.getElementById('geniebuild-responsive-overrides')) {
      const styleEl = document.createElement('style');
      styleEl.id = 'geniebuild-responsive-overrides';
      document.head.appendChild(styleEl);
    }
  }, []);

  useEffect(() => {
    const css = buildResponsiveOverrideCss(siteData);
    let styleEl = document.getElementById('geniebuild-responsive-overrides');
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'geniebuild-responsive-overrides';
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = css;
  }, [siteData.sections]);

  // Apply page-level SEO metadata to the outer document so the live preview
  // and dev tools reflect it immediately. On publish, the host app is
  // expected to render the same metadata into the public page's <head>.
  useEffect(() => {
    applySeoToDocument(siteData.seo);
  }, [siteData.seo]);

  // Keep global typography in sync with the sidebar controls
  useEffect(() => {
    setSiteData(prev => ({
      ...prev,
      globalStyles: {
        ...prev.globalStyles,
        typography: {
          ...prev.globalStyles.typography,
          h1: { ...prev.globalStyles.typography.h1, fontFamily: defaultTypography.titleFontFamily },
          h2: { ...prev.globalStyles.typography.h2, fontFamily: defaultTypography.subtitleFontFamily },
          p: { ...prev.globalStyles.typography.p, fontFamily: defaultTypography.descriptionFontFamily },
          button: { ...prev.globalStyles.typography.button, fontFamily: defaultTypography.buttonFontFamily },
        },
      },
    }));
  }, [
    defaultTypography.titleFontFamily,
    defaultTypography.subtitleFontFamily,
    defaultTypography.descriptionFontFamily,
    defaultTypography.buttonFontFamily,
  ]);

  // One-time migration: strip legacy baked-in color overrides from feature-box / icon-box /
  // testimonial-card elements so they inherit from the live theme instead of staying frozen
  // at their original theme colors (otherwise e.g. a testimonial card saved with an old
  // grey/colored theme would keep that bg even after we moved to a white-default design).
  useEffect(() => {
    setSiteData(prev => {
      let changed = false;
      const nextSections = prev.sections.map(sec => {
        if (!sec.elements || sec.elements.length === 0) return sec;
        const nextElements = sec.elements.map(el => {
          if (el.type !== 'feature-box' && el.type !== 'icon-box' && el.type !== 'testimonial-card') return el;
          const s: any = el.style || {};
          const keysToStrip = ['iconColor', 'iconBackgroundColor', 'iconBgColor', 'iconBorderColor', 'backgroundColor', 'borderColor', 'titleColor', 'descriptionColor', 'textColor', 'color'];
          const hasStale = keysToStrip.some(k => s[k] !== undefined);
          if (!hasStale) return el;
          changed = true;
          const cleaned = { ...s };
          keysToStrip.forEach(k => { delete cleaned[k]; });
          return { ...el, style: cleaned };
        });
        return changed ? { ...sec, elements: nextElements } : sec;
      });
      return changed ? { ...prev, sections: nextSections } : prev;
    });
    // Run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateSection = (id: string, updates: Partial<Section>) => {
    setSiteData(prev => applyUpdateSection(prev, id, updates));
    // Canvas inline edits go through SectionRenderer → updateSection. When a
    // virtual element is upserted into `elements`, refresh the sidebar snapshot.
    if (updates.elements && selectedElementId) {
      const found = updates.elements.find((e) => e.id === selectedElementId);
      if (found) setSelectedVirtualElement(found);
    }
  };

  const updateElement = (sectionId: string, elementId: string, updates: Partial<WebsiteElement>) => {
    setSiteData(prev => applyUpdateElement(prev, sectionId, elementId, updates, selectedVirtualElement));
    // Keep the sidebar snapshot in sync for virtual (not-yet-persisted) elements
    // while the user types on the canvas.
    setSelectedVirtualElement((prev) => {
      if (!prev || prev.id !== elementId) return prev;
      return {
        ...prev,
        ...updates,
        content:
          updates.content !== undefined
            ? mergeElementContent(prev.content, updates.content, prev.type || updates.type)
            : prev.content,
        style:
          updates.style !== undefined
            ? { ...(prev.style || {}), ...(updates.style || {}) }
            : prev.style,
      };
    });
  };

  /**
   * Breakpoint-aware style patch writer. Accepts only the DELTA, not the
   * merged style. Desktop writes merge into `style`; tablet/mobile merge
   * into the respective override field.
   */
  const patchElementStyleForBreakpoint = (sectionId: string, elementId: string, patch: Partial<WebsiteElement['style']>) => {
    const section = siteData.sections.find(s => s.id === sectionId);
    const existingEl = section?.elements?.find(e => e.id === elementId);
    if (editBreakpoint === 'desktop') {
      const merged = { ...(existingEl?.style || {}), ...patch };
      updateElement(sectionId, elementId, { style: merged });
      return;
    }
    const field = styleFieldForBreakpoint(editBreakpoint);
    const existingOverride = (existingEl?.[field] as Partial<WebsiteElement['style']> | undefined) || {};
    const mergedOverride = { ...existingOverride, ...patch };
    updateElement(sectionId, elementId, { [field]: mergedOverride } as Partial<WebsiteElement>);
  };

  /**
   * Wipes element styles (desktop + tablet + mobile overrides) so the renderer
   * falls back to theme + template defaults. Content is never modified.
   */
  const cleanElementStyle = () => {
    if (!selectedSection || !selectedElementId || !selectedElement) return;
    if (selectedElement.type === 'accordion') {
      const defaultStyle = buildDefaultAccordionStyle(selectedSection, getActiveGlobalTheme());
      updateElement(selectedSection.id, selectedElementId, { style: defaultStyle });
    } else {
      updateElement(selectedSection.id, selectedElementId, {
        style: {},
        tabletStyle: {},
        mobileStyle: {},
      });
      if (selectedVirtualElement?.id === selectedElementId) {
        setSelectedVirtualElement({
          ...selectedElement,
          style: {} as WebsiteElement['style'],
          tabletStyle: {},
          mobileStyle: {},
        });
      }
    }
    toast.success('Element styles cleared — content unchanged.');
  };

  const resetElementToDefault = async () => {
    if (!selectedSection || !selectedElementId || !selectedElement) return;

    // Accordion: reset to same theme colors as card (light section → light accordion, dark section → dark accordion)
    if (selectedElement.type === 'accordion') {
      try {
        const defaultStyle = buildDefaultAccordionStyle(selectedSection, getActiveGlobalTheme());
        updateElement(selectedSection.id, selectedElementId, { style: defaultStyle });
        toast.success('Accordion reset to theme default.');
      } catch (e: any) {
        console.error('Error resetting accordion:', e);
        toast.error(`Failed to reset: ${e.message}`);
      }
      return;
    }

    try {
      const originalData = initialSectionContentRef.current[selectedSection.id] || selectedSection.content || {};

      // Handle Hero section virtual elements
      if (selectedSection.type === 'hero' && selectedElementId.startsWith(`${selectedSection.id}-hero-`)) {
        const elementType = selectedElementId.replace(`${selectedSection.id}-hero-`, '');
        
        if (elementType === 'title' && originalData.title) {
          updateElement(selectedSection.id, selectedElementId, { content: { text: originalData.title } });
        } else if (elementType === 'subtitle' && originalData.subtitle) {
          updateElement(selectedSection.id, selectedElementId, { content: { text: originalData.subtitle } });
        } else if (elementType === 'button' && originalData.ctaText) {
          updateElement(selectedSection.id, selectedElementId, { content: { text: originalData.ctaText } });
        } else if (elementType === 'image' && originalData.imageUrl) {
          updateElement(selectedSection.id, selectedElementId, { content: { imageUrl: originalData.imageUrl } });
        } else if (elementType === 'icon' && originalData.icon) {
          updateElement(selectedSection.id, selectedElementId, { content: { icon: originalData.icon } });
        } else if (elementType === 'badge' && originalData.badgeText) {
          updateElement(selectedSection.id, selectedElementId, { content: { text: originalData.badgeText } });
        }
      } else {
        // Handle regular elements - find the element in the original data
        if (selectedElement && originalData) {
          const elementContent = originalData[selectedElement.type] || originalData;
          if (elementContent) {
            updateElement(selectedSection.id, selectedElementId, { content: elementContent });
          }
        }
      }

      toast.success('Content reset to default successfully!');
    } catch (error: any) {
      console.error('Error resetting element:', error);
      toast.error(`Failed to reset: ${error.message}`);
    }
  };

  const updateSectionStyle = (id: string, key: string, value: any) => {
    // Variant change: always writes to base styles (variant is structural, not responsive)
    if (key === 'variant') {
      const section = siteData.sections.find(s => s.id === id);
      if (!section) return;
      const currentVariant = section.styles?.variant || getDefaultVariant(section.type);
      setSiteData(prev => applyVariantRefresh(prev, {
        sectionId: id,
        sectionType: section.type,
        currentVariant,
        nextVariant: value,
        activeGlobalTheme: getActiveGlobalTheme(),
      }));
      return;
    }

    // When editing tablet/mobile, write to the per-breakpoint override field
    // on the Section instead of the base `styles` — so other breakpoints stay intact.
    if (editBreakpoint !== 'desktop') {
      const field = editBreakpoint === 'mobile' ? 'mobileStyles' : 'tabletStyles';
      setSiteData(prev => ({
        ...prev,
        sections: prev.sections.map(s => {
          if (s.id !== id) return s;
          const existingOverride = (s[field] || {}) as Partial<Section['styles']>;
          return {
            ...s,
            [field]: { ...existingOverride, [key]: value },
          } as Section;
        }),
      }));
      return;
    }

    setSiteData(prev => ({
      ...prev,
      sections: prev.sections.map(s => {
        if (s.id !== id) return s;
        const currentVariant = s.styles?.variant || getDefaultVariant(s.type);
        const variantStyles = s.variantStyles || {};
        variantStyles[currentVariant] = {
          ...variantStyles[currentVariant],
          [key]: value,
        };
        return {
          ...s,
          styles: { ...s.styles, [key]: value },
          variantStyles,
        } as Section;
      }),
    }));
  };

  // Restore missing elements from template
  const restoreSectionElements = (sectionId: string) => {
    setSiteData(prev => applyRestoreSectionElements(prev, sectionId).next);
    toast.success('Missing elements restored successfully!');
  };

  // Reset section styles to theme/section defaults (preserves current variant and content)
  // Reset section and element styles to dynamic theme defaults
  const resetSectionStyles = (sectionId: string) => {
    const activeGlobalTheme = getActiveGlobalTheme();
    setSiteData(prev => applyResetSectionStyles(prev, sectionId, activeGlobalTheme, getDefaultVariant));
    toast.success('Section & elements reset to theme defaults!');
  };

  // Helper to update section background (handles nested object)
  const updateSectionBackground = (id: string, background: any) => {
    updateSectionStyle(id, 'background', background);
  };

  // Handle variant refresh - cycles through available variants
  const handleRefreshVariant = () => {
    if (!selectedSectionId || !selectedSection) return;
    
    const sectionType = selectedSection.type;
    const availableVariants = getVariantsForSection(sectionType);
    
    // Only show button if there are multiple variants
    if (availableVariants.length <= 1) return;
    
    const currentVariant = selectedSection.styles?.variant || getDefaultVariant(sectionType);
    const currentIndex = availableVariants.indexOf(currentVariant);
    
    // Get next variant (cycle to first if at end)
    const nextIndex = (currentIndex + 1) % availableVariants.length;
    const nextVariant = availableVariants[nextIndex];
    
    // Save current styles to variant-specific storage before switching
    const activeGlobalTheme = getActiveGlobalTheme();
    setSiteData(prev => applyVariantRefresh(prev, {
      sectionId: selectedSectionId,
      sectionType,
      currentVariant,
      nextVariant,
      activeGlobalTheme,
    }));
    
    toast.success(`Variant changed to ${formatVariantName(nextVariant, sectionType) || nextVariant}`);
  };
  
  const updateGlobalColor = (key: keyof typeof siteData.globalStyles.colors, value: string) => {
      setSiteData(prev => ({
          ...prev,
          globalStyles: { ...prev.globalStyles, colors: { ...prev.globalStyles.colors, [key]: value } }
      }));
      setSelectedVirtualElement(null);
  };

  /** Update page-level SEO metadata. Routes to the currently-active page when
   *  `pages` is populated; otherwise falls back to top-level `seo` for legacy
   *  single-page data. */
  const updateSeo = (patch: Partial<NonNullable<typeof siteData.seo>>) => {
    setSiteData(prev => updateCurrentPageSeo(prev, patch));
  };

  const handleSeoRegenerate = async () => {
    const { projectId, pageId } = getUrlParams();
    if (!projectId || !pageId) {
      toast.error('Missing projectId or pageId for SEO generation');
      return;
    }
    const { token } = getUrlParams();
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${API_BASE_URL}/generateWebsitePageSeo`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ projectId, pageId }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body?.message || 'SEO generation failed');
    }
    const body = await res.json();
    const seo = apiSeoToMetadata(body?.data);
    if (seo.title || seo.description) {
      updateSeo(seo);
      toast.success('SEO regenerated with AI');
    }
  };

  // ── Multi-page handlers ────────────────────────────────────────────────
  // Backend persistence pattern: update local state first (optimistic) so the
  // UI feels instant, then fire-and-forget the API call. Failures show a
  // toast — we don't auto-revert because the user may have made follow-up
  // edits already; instead they'll see a clear error and can retry on save.
  const callPagesApi = async (path: string, init: RequestInit) => {
    const { token } = getUrlParams();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${API_BASE_URL}${path}`, { ...init, headers: { ...headers, ...(init.headers as any) } });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body?.message || `HTTP ${res.status}`);
    }
    return res.json();
  };

  const handleSelectPage = (pageId: string) => {
    setSelectedSectionId(null);
    setSelectedElementId(null);
    setSelectedVirtualElement(null);

    // Read page meta before switch — list entries often have empty sections until lazy-load.
    const targetPage = (siteData.pages || []).find((p) => p.id === pageId);
    // Always refetch when body is empty. Never treat "missing page row" as loaded.
    const needsSections =
      !targetPage || !Array.isArray(targetPage.sections) || targetPage.sections.length === 0;
    const needsSeo =
      !targetPage ||
      !targetPage.seo ||
      (!targetPage.seo.title && !targetPage.seo.description);

    setSiteData((prev) => switchToPage(prev, pageId));

    const { projectId, token, locationId } = getUrlParams();
    // Keep ?projectId=&pageId= in sync so refresh / Open stay on this project.
    if (projectId) {
      syncGenieBuildUrl({
        projectId,
        pageId,
        locationId: (targetPage as any)?.locationId || locationId || null,
      });
    }

    // Scroll canvas to top when opening a linked page.
    try {
      const frame = document.querySelector('iframe');
      const win = (frame as HTMLIFrameElement | null)?.contentWindow;
      win?.scrollTo?.({ top: 0, behavior: 'smooth' });
      window.scrollTo?.({ top: 0, behavior: 'smooth' });
    } catch {
      /* ignore */
    }

    if (!needsSections && !needsSeo) return;

    if (!projectId) {
      toast.error('Missing projectId — reopen this site from Admin with ?projectId=');
      return;
    }
    // Always load sections when empty — don't soft-fail into a chrome-only canvas.
    fetchPageContentForPage(projectId, pageId, token, {
      loadSections: needsSections,
      loadSeo: needsSeo,
    }).catch((err) => {
      console.warn('[handleSelectPage] failed to load page content:', err);
      toast.error('Failed to load page content');
    });
  };

  const handleOpenInternalLink = (href: string) => {
    const raw = String(href || '').trim();
    if (!raw || raw === '#') return;

    if (/^(mailto:|tel:)/i.test(raw)) {
      window.location.href = raw;
      return;
    }

    // True external only — never treat /contact-style paths as external (no new tab / no refresh).
    if (isTrueExternalHref(raw)) {
      window.open(raw, '_blank', 'noopener,noreferrer');
      return;
    }

    const { projectId } = getUrlParams();
    if (projectId) writeStoredProjectId(projectId);

    const pageId = findPageIdByHref(raw, siteData.pages || []);
    if (pageId) {
      handleSelectPage(pageId);
      return;
    }

    // No matching builder page — stay in GenieBuild under this projectId (never open a bare path).
    const path = normalizeInternalPath(raw);
    if (path && projectId) {
      toast.error(
        `No page matched “${path}” in this project. Check Pages panel / slug.`
      );
      syncGenieBuildUrl({
        projectId,
        pageId: getUrlParams().pageId,
        locationId: getUrlParams().locationId,
      });
      return;
    }
    if (path) {
      toast.error(`No project loaded — cannot open “${path}”`);
      return;
    }
    toast.error('Invalid link');
  };

  /** Load sections and/or SEO for a page when switching in the Pages panel. */
  const fetchPageContentForPage = async (
    projectId: string,
    pageId: string,
    token?: string | null,
    opts: { loadSections?: boolean; loadSeo?: boolean } = { loadSections: true, loadSeo: true }
  ) => {
    const { locationId } = getUrlParams();
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const loadSections = opts.loadSections !== false;
    const loadSeo = opts.loadSeo !== false;

    const fetches: Promise<Response | SEOMetadata | null>[] = [];
    if (loadSections) {
      fetches.push(
        fetch(
          `${API_BASE_URL}/getGenieBuildPageData/${projectId}/${pageId}${locationId ? `?locationId=${encodeURIComponent(locationId)}` : ''}`,
          { method: 'GET', headers }
        )
      );
    } else {
      fetches.push(Promise.resolve(null as unknown as Response));
    }
    if (loadSeo) {
      fetches.push(fetchPageSeo(API_BASE_URL, projectId, pageId, token));
    } else {
      fetches.push(Promise.resolve(null));
    }

    const [pageResOrNull, seoMeta] = await Promise.all(fetches);
    const pageRes = pageResOrNull instanceof Response ? pageResOrNull : null;

    const body =
      pageRes && pageRes.ok ? await pageRes.json().catch(() => ({})) : {};
    const apiThemeForPage = body?.data?.themeSettings || null;
    if (apiThemeForPage?.additionalCss) {
      setAdditionalCss({
        blogCss: String(apiThemeForPage.additionalCss.blogCss || ''),
        siteCss: String(apiThemeForPage.additionalCss.siteCss || ''),
        applyBlogCssToSite: Boolean(apiThemeForPage.additionalCss.applyBlogCssToSite),
      });
    }
    const flatSections: Section[] =
      loadSections && Array.isArray(body?.data?.sections)
        ? hydrateSectionsForDisplay(body.data.sections, {
            themeSettings: apiThemeForPage,
            stripPresetColors: false,
          })
        : [];
    // Same split as initial load — never park header/footer only on one page.
    const { globalSections: chrome, pageSections } =
      splitGlobalAndPageSections(flatSections);
    const pageSeo: SEOMetadata | null = loadSeo
      ? (seoMeta && typeof seoMeta === 'object' && Object.keys(seoMeta).length > 0
          ? seoMeta
          : pickSeoFromGenieBuildPageResponse(body?.data))
      : null;

    setSiteData((prev) => {
      const pages = (prev.pages || []).map((p) => {
        if (p.id !== pageId) return p;
        return {
          ...p,
          ...(pageSections.length || flatSections.length
            ? { sections: pageSections }
            : {}),
          ...(pageSeo && Object.keys(pageSeo).length ? { seo: pageSeo } : {}),
        };
      });
      const isActive = prev.currentPageId === pageId;
      let next: WebsiteData = {
        ...prev,
        pages,
        globalSections: mergeGlobalChrome(prev.globalSections, chrome),
      };
      if ((pageSections.length || flatSections.length) && isActive) {
        next = { ...next, sections: pageSections };
      }
      if (pageSeo && Object.keys(pageSeo).length && isActive) {
        next = { ...next, seo: pageSeo };
      }
      return next;
    });
  };
  const handleAddPage = (name: string, slug: string) => {
    setSelectedSectionId(null);
    setSelectedElementId(null);
    setSelectedVirtualElement(null);
    setSiteData(prev => addPageReducer(prev, name, slug));
    toast.success(`Page "${name}" created`);

    // Persist to backend. The reducer just generated a local id; we re-key
    // the page once the server returns its real _id so subsequent saves
    // target the right document.
    const { projectId } = getUrlParams();
    if (!projectId) return;
    callPagesApi('/upsertWebsitePage', {
      method: 'POST',
      body: JSON.stringify({
        projectId,
        name: name.toLowerCase(),       // backend stores name lowercase + non-changeable
        slug: slug.replace(/^\/+/, ''), // backend strips leading slash
        displayName: name,
      }),
    })
      .then((res) => {
        const serverPageId = res?.data?.pageId || res?.data?._id;
        if (!serverPageId) return;
        // Swap the local-generated id with the server id so future renames /
        // deletes / saves use the canonical key.
        setSiteData(prev => {
          if (!prev.pages) return prev;
          const updated = prev.pages.map(p =>
            p.name === name && (p.id !== serverPageId)
              ? { ...p, id: String(serverPageId) }
              : p
          );
          return {
            ...prev,
            pages: updated,
            currentPageId: prev.currentPageId && updated.find(p => p.id === prev.currentPageId)
              ? prev.currentPageId
              : (updated.find(p => p.name === name)?.id || prev.currentPageId),
          };
        });
      })
      .catch(err => {
        console.error('[handleAddPage] backend create failed:', err);
        toast.error(`Failed to save page: ${err.message}`);
      });
  };
  const handleRenamePage = (pageId: string, name: string, slug: string) => {
    setSiteData(prev => renamePage(prev, pageId, name, slug));

    const { projectId } = getUrlParams();
    if (!projectId) return;
    callPagesApi('/upsertWebsitePage', {
      method: 'POST',
      body: JSON.stringify({
        projectId,
        pageId,
        // name is non-changeable per backend rule, but slug + displayName are
        slug: slug.replace(/^\/+/, ''),
        displayName: name,
      }),
    }).catch(err => {
      console.error('[handleRenamePage] backend update failed:', err);
      toast.error(`Failed to save rename: ${err.message}`);
    });
  };
  const handleDeletePage = (pageId: string) => {
    setSelectedSectionId(null);
    setSelectedElementId(null);
    setSelectedVirtualElement(null);
    setSiteData(prev => deletePageReducer(prev, pageId));
    toast.success('Page deleted');

    const { projectId } = getUrlParams();
    callPagesApi(`/deleteWebsitePage/${pageId}`, {
      method: 'DELETE',
      body: projectId ? JSON.stringify({ projectId }) : undefined,
    }).catch(err => {
      console.error('[handleDeletePage] backend delete failed:', err);
      toast.error(`Failed to delete on server: ${err.message}`);
    });
  };
  const handleReorderPage = (pageId: string, direction: 'up' | 'down') => {
    setSiteData(prev => reorderPage(prev, pageId, direction));
    // Reorder is purely a UI ordering preference — backend doesn't currently
    // store page order, so we don't fire an API call here. If/when the
    // backend gains an `order` field, mirror this with an upsert call.
  };

  /** Trigger the global file picker for SEO fields (ogImage / favicon). */
  const triggerSeoUpload = (field: 'ogImage' | 'favicon') => {
    setUploadTarget({ sectionId: '__seo__', field });
    fileInputRef.current?.click();
  };

  const loadThemeSettings = async (projectId: string) => {
    void projectId;
    // Deprecated: theme settings now come from getWebsiteDesignData single payload.
    return;
  };

  const getActiveGlobalTheme = _getActiveGlobalTheme;

  const saveThemeSettings = async () => {
    try {
      setSavingTheme(true);
      const { projectId, token } = getUrlParams();
      if (!projectId) {
        toast.error('Project ID not found');
        return;
      }

      const apiUrl = API_BASE_URL;
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const presetForSave = isCustomTheme ? null : selectedPresetId;
      const payload = buildThemeSavePayload(
        projectId,
        presetForSave,
        siteData,
        defaultSizes,
        defaultTypography
      );

      const response = await fetch(`${apiUrl}/updateProjectTheme`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(`Failed to save theme settings: ${errorData.message || 'Unknown error'}`);
        return;
      }

      const savedTheme = String(payload.theme || '');
      setIsCustomTheme(savedTheme === 'custom');
      if (savedTheme !== 'custom' && payload.presetId != null) {
        setSelectedPresetId(String(payload.presetId));
      } else if (savedTheme === 'custom') {
        setSelectedPresetId(null);
      }

      toast.success('Theme settings saved successfully!');
    } catch (error) {
      console.error('Error saving theme settings:', error);
      toast.error('Failed to save theme settings');
    } finally {
      setSavingTheme(false);
    }
  };

  const applyTheme = (theme: typeof PRESET_THEMES[0] | ThemeData, presetId?: string | null, isInit: boolean = false) => {
      const { projectId } = getUrlParams();
      const idx =
        presetId !== null && presetId !== undefined && presetId !== '' && !Number.isNaN(Number(presetId))
          ? Number(presetId)
          : -1;

      const settings =
        idx >= 0 ? settingsFromPresetIndex(idx) : { theme: 'custom' as const, customColors: (theme as ThemeData).elements || theme };

      const resolved = applySiteThemeToDocument(settings);

      if (projectId && resolved.presetIndex >= 0) {
        try {
          localStorage.setItem(`activeBuilderTheme_${projectId}`, resolved.themeSlug);
        } catch {
          /* ignore */
        }
      }

      const themeTypo = (theme as ThemeData).typography as any;
      if (themeTypo && !isInit) {
        setDefaultTypography((prev) => ({
          ...prev,
          titleFontFamily: themeTypo.heading || prev.titleFontFamily,
          subtitleFontFamily: themeTypo.heading || prev.subtitleFontFamily,
          descriptionFontFamily: themeTypo.body || prev.descriptionFontFamily,
          buttonFontFamily: themeTypo.button || prev.buttonFontFamily,
        }));
      }

      setSiteData((prev) => applyThemeToSiteData(prev, resolved.elements, isInit));

      if (presetId !== undefined) {
        setSelectedPresetId(presetId);
        setIsCustomTheme(presetId === null);
      }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const originalFile = e.target.files?.[0];
    if (!originalFile || !uploadTarget) return;

    setUploading(true);
    setUploadProgress(0);

    // Faked progress bar (backend doesn't stream progress)
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) { clearInterval(progressInterval); return 90; }
        return prev + 10;
      });
    }, 200);

    try {
      const { token } = getUrlParams();
      // Client-side compress images before upload (skip videos / SVG / GIF / tiny).
      const file = originalFile.type.startsWith('image/')
        ? await compressImageFile(originalFile, { maxDimension: 2000, quality: 0.82 })
        : originalFile;
      if (file !== originalFile) {
        const savedKb = Math.round((originalFile.size - file.size) / 1024);
        if (savedKb > 50) {
          console.log(`[upload] compressed ${originalFile.name}: ${Math.round(originalFile.size/1024)}KB → ${Math.round(file.size/1024)}KB (saved ${savedKb}KB)`);
        }
      }
      const fullImageUrl = await uploadFileToApi(file, token);
      clearInterval(progressInterval);
      setUploadProgress(100);

      if (uploadTarget.sectionId === '__seo__' && (uploadTarget.field === 'ogImage' || uploadTarget.field === 'favicon')) {
        updateSeo({ [uploadTarget.field]: fullImageUrl });
      } else if (uploadTarget.elementId) {
        const section = siteData.sections.find(s => s.id === uploadTarget.sectionId);
        const element = section?.elements?.find(el => el.id === uploadTarget.elementId);
        if (section && element) {
          const updateField = uploadTarget.field === 'videoUrl' ? 'src' : (uploadTarget.field === 'imageUrl' ? 'imageUrl' : uploadTarget.field);
          const newContent: any = { ...element.content, [updateField]: fullImageUrl };
          if (uploadTarget.field === 'videoUrl' && element.type === 'video') {
            newContent.src = fullImageUrl;
          }
          updateElement(uploadTarget.sectionId, uploadTarget.elementId, { content: newContent });
        }
      } else if (uploadTarget.field.startsWith('backgroundImage')) {
        const section = siteData.sections.find(s => s.id === uploadTarget.sectionId);
        if (section) {
          const themeOverlayDefaults = getThemeOverlayDefaults();
          const uploadIndex = parseBackgroundImageIndex(uploadTarget.field);
          const currentBackground: any = section.styles?.background || {
            type: 'image',
            image: { url: '', position: 'center', size: 'cover', repeat: 'no-repeat', attachment: 'scroll', overlay: themeOverlayDefaults },
          };
          const existingImages = normalizeSectionImages(section.content?.images);
          const nextImages = [...existingImages];
          if (nextImages[uploadIndex]) {
            nextImages[uploadIndex] = { ...nextImages[uploadIndex], url: fullImageUrl };
          } else {
            nextImages[uploadIndex] = { id: `img-${Date.now()}-${uploadIndex}`, url: fullImageUrl };
          }
          const updatedBackground = {
            ...currentBackground,
            type: 'image',
            image: {
              ...(currentBackground.image || { position: 'center', size: 'cover', repeat: 'no-repeat', attachment: 'scroll', overlay: themeOverlayDefaults }),
              url: nextImages[0]?.url || fullImageUrl,
            },
          };
          updateSectionStyle(uploadTarget.sectionId, 'background', updatedBackground);
          updateSection(uploadTarget.sectionId, {
            content: { ...section.content, images: nextImages, imageUrl: nextImages[0]?.url || fullImageUrl },
          });
        }
      } else {
        const section = siteData.sections.find(s => s.id === uploadTarget.sectionId);
        if (section) {
          updateSection(uploadTarget.sectionId, { content: { ...section.content, [uploadTarget.field]: fullImageUrl } });
        }
      }

      const fileType = file.type.startsWith('video/') ? 'Video' : 'Image';
      toast.success(`${fileType} uploaded successfully`);
    } catch (error: any) {
      clearInterval(progressInterval);
      console.error('Upload error:', error);
      const fileType = originalFile.type?.startsWith('video/') ? 'video' : 'image';
      toast.error(error?.message || `Failed to upload ${fileType}`);
    } finally {
      setUploadTarget(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const triggerUpload = (sectionId: string, field: string, elementId?: string) => {
    setUploadTarget({ sectionId, field, elementId });
    fileInputRef.current?.click();
  };

  const deleteSection = (id: string) => {
    setSiteData(prev => {
      const isGlobal = prev.globalSections?.some(s => s.id === id);
      if (isGlobal) {
        return { ...prev, globalSections: prev.globalSections!.filter(s => s.id !== id) };
      }
      return { ...prev, sections: prev.sections.filter(s => s.id !== id) };
    });
    if (selectedSectionId === id) setSelectedSectionId(null);
  };

  const moveSection = (id: string, direction: 'up' | 'down') => {
    setSiteData(prev => {
      // Global sections move within the globalSections list only
      const isGlobal = prev.globalSections?.some(s => s.id === id);
      const source = isGlobal ? (prev.globalSections || []) : prev.sections;
      const idx = source.findIndex(s => s.id === id);
      if (idx === -1) return prev;
      const newIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (newIdx < 0 || newIdx >= source.length) return prev;
      const next = [...source];
      const [moved] = next.splice(idx, 1);
      next.splice(newIdx, 0, moved);
      return isGlobal
        ? { ...prev, globalSections: next }
        : { ...prev, sections: next };
    });
  };

  /**
   * Deep-clone a section with fresh IDs (section + all nested elements),
   * insert directly after the source, and select the duplicate.
   */
  const duplicateSection = (id: string) => {
    const ts = Date.now();
    let newId: string | null = null;
    setSiteData(prev => {
      const isGlobal = prev.globalSections?.some(s => s.id === id);
      const source = isGlobal ? (prev.globalSections || []) : prev.sections;
      const idx = source.findIndex(s => s.id === id);
      if (idx === -1) return prev;
      const original = source[idx];
      const clonedId = `section-${ts}-${Math.random().toString(36).slice(2, 6)}`;
      newId = clonedId;
      // Deep clone to avoid shared refs between siblings
      const deepCloned = JSON.parse(JSON.stringify(original)) as typeof original;
      // Rewrite element ids that referenced the original section id so
      // virtual-element lookups and remove-by-prefix logic still work
      // against the new section.
      const rewriteElId = (elId: string) =>
        elId.startsWith(`${original.id}-`) ? `${clonedId}-${elId.slice(original.id.length + 1)}` : elId;
      const cloned = {
        ...deepCloned,
        id: clonedId,
        elements: (deepCloned.elements || []).map((el: any) => ({
          ...el,
          id: rewriteElId(el.id),
        })),
      };
      const next = [...source];
      next.splice(idx + 1, 0, cloned);
      return isGlobal
        ? { ...prev, globalSections: next }
        : { ...prev, sections: next };
    });
    // Select the duplicate so user sees it selected after the operation
    if (newId) {
      setSelectedSectionId(newId);
      setSelectedElementId(null);
      setSelectedVirtualElement(null);
      toast.success('Section duplicated');
    }
  };

  const addNewSection = (type: SectionType) => {
    const newSection = buildNewSection(type, getActiveGlobalTheme());

    setSiteData(prev => {
        const sections = [...prev.sections];
        const heroIdx = sections.findIndex(s => s.type === 'hero');
        if (heroIdx > -1 && type !== 'navbar') sections.splice(heroIdx + 1, 0, newSection);
        else sections.push(newSection);
        return { ...prev, sections };
    });
    setSelectedSectionId(newSection.id);
    setIsAddMenuOpen(false);
  };

  const renderStyleEditor = (
      styles: any,
      onUpdate: (key: string, val: any) => void,
      context: 'section' | 'element',
      elementType?: string,
      sectionId?: string,
      themeColors?: any,
      onBatchUpdate?: (updates: Record<string, any>) => void,
      sectionEditorTab: 'design' | 'advanced' = 'design',
      elementEditorTab: 'design' | 'advanced' = 'design'
  ) => {
      // Normalize theme colors to handle both section styles and global theme presets
      const normalizedTheme = {
        accentColor: themeColors?.accentColor || themeColors?.accent,
        titleColor: themeColors?.titleColor || themeColors?.heading,
        textColor: themeColors?.textColor || themeColors?.description,
        buttonBackgroundColor: themeColors?.buttonBackgroundColor || themeColors?.primaryButton?.bg,
        secondaryHeadingColor: themeColors?.secondaryHeadingColor || themeColors?.buttonBackgroundColor || themeColors?.primaryButton?.bg,
        ...themeColors
      };

      const getSpacingValues = (type: 'margin' | 'padding') => {
        if (context === 'element') {
            const val = styles[type];
            if (typeof val === 'string') return { top: val, right: val, bottom: val, left: val };
            return val || {};
        } else {
            if (type === 'padding') {
                return {
                    top: styles.paddingTop ?? '10px',
                    bottom: styles.paddingBottom ?? '10px',
                    left: styles.paddingLeft ?? '10px',
                    right: styles.paddingRight ?? '10px',
                };
            }
            return {
                top: styles.marginTop,
                bottom: styles.marginBottom,
                left: styles.marginLeft,
                right: styles.marginRight,
            };
        }
      };

      const handleSpacingUpdate = (type: 'margin' | 'padding', newValues: any) => {
          if (context === 'element') {
              onUpdate(type, newValues);
          } else {
              if (type === 'padding') {
                  if (newValues.top !== undefined) onUpdate('paddingTop', newValues.top);
                  if (newValues.bottom !== undefined) onUpdate('paddingBottom', newValues.bottom);
                  if (newValues.left !== undefined) onUpdate('paddingLeft', newValues.left);
                  if (newValues.right !== undefined) onUpdate('paddingRight', newValues.right);
              } else {
                  if (newValues.top !== undefined) onUpdate('marginTop', newValues.top);
                  if (newValues.bottom !== undefined) onUpdate('marginBottom', newValues.bottom);
                  if (newValues.left !== undefined) onUpdate('marginLeft', newValues.left);
                  if (newValues.right !== undefined) onUpdate('marginRight', newValues.right);
              }
          }
      };
      
      const isCardOrAccordion = context === 'element' && (elementType === 'card' || elementType === 'accordion');
      const isSectionDesignTab = context === 'section' && sectionEditorTab === 'design';
      const isSectionAdvancedTab = context === 'section' && sectionEditorTab === 'advanced';
      const isElementDesignTab = context === 'element' && elementEditorTab === 'design';
      const isElementAdvancedTab = context === 'element' && elementEditorTab === 'advanced';

      // Layout (padding/margin) lives in Advanced tab for both sections + elements.
      // UNIVERSAL: every element gets spacing controls (Elementor-style). Previously
      // card/accordion were excluded, and row/column had no spacing at all — which
      // blocked free layout. Now padding/margin is available on all element types.
      const showLayoutBlock = isSectionAdvancedTab || isElementAdvancedTab;

      // Border:
      //   • Sections — Advanced tab (unchanged).
      //   • Elements — Design tab, but only for types that DON'T already include border controls
      //     in their dedicated style block (feature-box, button, image, etc. have their own).
      const ELEMENTS_WITH_BUILTIN_BORDER = new Set([
          'feature-box', 'icon-box', 'stat-card', 'testimonial-card',
          'button', 'image', 'card', 'accordion',
          // Dedicated blocks added in Tier 1 + Tier 2 — they include their own border controls.
          'alert-box', 'counter', 'blockquote', 'icon', 'divider', 'toggle', 'tabs', 'pricing-table', 'pricing-item', 'flip-box', 'video', 'image-box', 'review-carousel',
      ]);
      const showBorderBlock = isSectionAdvancedTab
          || (isElementDesignTab && !ELEMENTS_WITH_BUILTIN_BORDER.has(elementType || ''));

      // Elements that carry their own typography controls inside their dedicated
      // style block — the generic TypographyBlock is shown for everything else
      // (row / column / any new element), so no element is left without type control.
      const ELEMENTS_WITH_BUILTIN_TYPOGRAPHY = new Set([
          'card', 'accordion', 'feature-box', 'icon-box', 'stat-card', 'testimonial-card',
          'trust-strip', 'list', 'alert-box', 'badge', 'icon', 'highlight-text', 'blockquote',
          'counter', 'progress-bar', 'countdown-timer', 'toggle', 'tabs', 'pricing-table',
          'pricing-item', 'flip-box', 'image-box', 'logo-cloud', 'user-avatars', 'review-carousel',
          'button', 'call-to-action', 'cta-button', 'heading', 'text', 'image', 'video',
          'divider', 'nav-menu', 'spacer', 'star-rating', 'row', 'column',
      ]);

      return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-2 duration-300">
              {/* Section Advanced — quick presets first (spacing / width / visibility / anchor / class / theme mode) */}
              {isSectionAdvancedTab && (
                  <SectionLayoutPresetsBlock styles={styles} onUpdate={onUpdate} onBatchUpdate={onBatchUpdate} />
              )}
              {showLayoutBlock && (
                  <LayoutSpacingBlock
                      paddingValues={getSpacingValues('padding')}
                      marginValues={getSpacingValues('margin')}
                      onPaddingChange={(v) => handleSpacingUpdate('padding', v)}
                      onMarginChange={(v) => handleSpacingUpdate('margin', v)}
                      onUpdate={onUpdate}
                      onBatchUpdate={onBatchUpdate}
                  />
              )}
              {showBorderBlock && (
                  <BorderBlock styles={styles} onUpdate={onUpdate} onBatchUpdate={onBatchUpdate} />
              )}
              {/* Element Advanced tab — transform, position, entrance animation,
                  custom CSS/ID/classes (Elementor parity). */}
              {isElementAdvancedTab && (
                  <ElementAdvancedBlock styles={styles} onUpdate={onUpdate} onBatchUpdate={onBatchUpdate} elementId={sectionId} />
              )}
              {isElementDesignTab
                && !ELEMENTS_WITH_BUILTIN_TYPOGRAPHY.has(elementType || '') && (
                  <TypographyBlock
                      styles={styles}
                      onUpdate={onUpdate}
                      onBatchUpdate={onBatchUpdate}
                      context={context}
                      elementType={elementType}
                      sectionId={sectionId}
                      themeColors={themeColors}
                      normalizedTheme={normalizedTheme}
                      defaultTypography={defaultTypography}
                      onSectionStyleUpdate={updateSectionStyle}
                  />
              )}
              {isElementDesignTab && elementType === 'heading' && (
                  <HeadingStylesBlock
                      styles={styles}
                      onUpdate={onUpdate}
                      onBatchUpdate={onBatchUpdate}
                      themeColors={normalizedTheme}
                      onSectionStyleUpdate={(k, v) => sectionId && updateSectionStyle(sectionId, k, v)}
                  />
              )}
              {isElementDesignTab && elementType === 'text' && (
                  <TextStylesBlock
                      styles={styles}
                      onUpdate={onUpdate}
                      onBatchUpdate={onBatchUpdate}
                      themeColors={normalizedTheme}
                  />
              )}
              {isElementDesignTab && elementType === 'card' && (
                  <CardStylesBlock styles={styles} onUpdate={onUpdate} onBatchUpdate={onBatchUpdate} themeColors={themeColors} />
              )}
              {isElementDesignTab && elementType === 'accordion' && (
                  <AccordionStylesBlock styles={styles} onUpdate={onUpdate} onBatchUpdate={onBatchUpdate} themeColors={themeColors} />
              )}
              {isElementDesignTab && elementType === 'badge' && (
                  <BadgeStylesBlock
                      styles={styles}
                      onUpdate={onUpdate}
                      onBatchUpdate={onBatchUpdate}
                      liveSurface={siteData.globalStyles.colors.backgroundColor || ''}
                      fallbackButtonBg={siteData.globalStyles.colors.buttonBackgroundColor || '#3b82f6'}
                      fallbackButtonText={siteData.globalStyles.colors.buttonTextColor || '#FFFFFF'}
                  />
              )}
              {isElementDesignTab && (elementType === 'button' || elementType === 'call-to-action' || elementType === 'cta-button') && (
                  <ButtonStylesBlock styles={styles} onUpdate={onUpdate} onBatchUpdate={onBatchUpdate} />
              )}
              {isElementDesignTab && (elementType === 'feature-box' || elementType === 'icon-box') && (
                  <FeatureBoxStylesBlock
                      styles={styles}
                      onUpdate={onUpdate}
                      onBatchUpdate={onBatchUpdate}
                      elementType={elementType as 'feature-box' | 'icon-box'}
                      themeColors={themeColors}
                  />
              )}
              {isElementDesignTab && elementType === 'stat-card' && (
                  <StatCardStylesBlock
                      styles={styles}
                      onUpdate={onUpdate}
                      onBatchUpdate={onBatchUpdate}
                      themeColors={themeColors}
                  />
              )}
              {isElementDesignTab && elementType === 'star-rating' && (
                  <StarRatingStylesBlock
                      styles={styles}
                      onUpdate={onUpdate}
                      onBatchUpdate={onBatchUpdate}
                      themeColors={themeColors}
                  />
              )}
              {isElementDesignTab && elementType === 'row' && (
                  <RowStylesBlock
                      styles={styles}
                      onUpdate={onUpdate}
                      onBatchUpdate={onBatchUpdate}
                      themeColors={themeColors}
                  />
              )}
              {isElementDesignTab && elementType === 'column' && (
                  <ColumnStylesBlock
                      styles={styles}
                      onUpdate={onUpdate}
                      onBatchUpdate={onBatchUpdate}
                      themeColors={themeColors}
                  />
              )}
              {isElementDesignTab && elementType === 'testimonial-card' && (
                  <TestimonialCardStylesBlock
                      styles={styles}
                      onUpdate={onUpdate}
                      onBatchUpdate={onBatchUpdate}
                      themeColors={themeColors}
                  />
              )}
              {isElementDesignTab && elementType === 'trust-strip' && (
                  <TrustStripStylesBlock
                      styles={styles}
                      onUpdate={onUpdate}
                      onBatchUpdate={onBatchUpdate}
                      themeColors={themeColors}
                  />
              )}
              {isElementDesignTab && elementType === 'list' && (
                  <ListStylesBlock
                      styles={styles}
                      onUpdate={onUpdate}
                      onBatchUpdate={onBatchUpdate}
                      themeColors={themeColors}
                  />
              )}
              {isElementDesignTab && elementType === 'nav-menu' && (
                  <NavMenuStylesBlock
                      styles={styles}
                      onUpdate={onUpdate}
                      onBatchUpdate={onBatchUpdate}
                      themeColors={themeColors}
                  />
              )}
              {isElementDesignTab && elementType === 'alert-box' && (
                  <AlertBoxStylesBlock
                      styles={styles}
                      onUpdate={onUpdate}
                      onBatchUpdate={onBatchUpdate}
                      themeColors={themeColors}
                  />
              )}
              {isElementDesignTab && elementType === 'divider' && (
                  <DividerStylesBlock
                      styles={styles}
                      onUpdate={onUpdate}
                      onBatchUpdate={onBatchUpdate}
                      themeColors={themeColors}
                  />
              )}
              {isElementDesignTab && elementType === 'icon' && (
                  <IconStylesBlock
                      styles={styles}
                      onUpdate={onUpdate}
                      onBatchUpdate={onBatchUpdate}
                      themeColors={themeColors}
                  />
              )}
              {isElementDesignTab && elementType === 'highlight-text' && (
                  <HighlightTextStylesBlock
                      styles={styles}
                      onUpdate={onUpdate}
                      onBatchUpdate={onBatchUpdate}
                      themeColors={themeColors}
                  />
              )}
              {isElementDesignTab && elementType === 'blockquote' && (
                  <BlockquoteStylesBlock
                      styles={styles}
                      onUpdate={onUpdate}
                      onBatchUpdate={onBatchUpdate}
                      themeColors={themeColors}
                  />
              )}
              {isElementDesignTab && elementType === 'counter' && (
                  <CounterStylesBlock
                      styles={styles}
                      onUpdate={onUpdate}
                      onBatchUpdate={onBatchUpdate}
                      themeColors={themeColors}
                  />
              )}
              {isElementDesignTab && elementType === 'progress-bar' && (
                  <ProgressBarStylesBlock
                      styles={styles}
                      onUpdate={onUpdate}
                      onBatchUpdate={onBatchUpdate}
                      themeColors={themeColors}
                  />
              )}
              {isElementDesignTab && elementType === 'countdown-timer' && (
                  <CountdownTimerStylesBlock
                      styles={styles}
                      onUpdate={onUpdate}
                      onBatchUpdate={onBatchUpdate}
                      themeColors={themeColors}
                  />
              )}
              {isElementDesignTab && elementType === 'toggle' && (
                  <ToggleStylesBlock
                      styles={styles}
                      onUpdate={onUpdate}
                      onBatchUpdate={onBatchUpdate}
                      themeColors={themeColors}
                  />
              )}
              {isElementDesignTab && elementType === 'tabs' && (
                  <TabsStylesBlock
                      styles={styles}
                      onUpdate={onUpdate}
                      onBatchUpdate={onBatchUpdate}
                      themeColors={themeColors}
                  />
              )}
              {isElementDesignTab && elementType === 'pricing-table' && (
                  <PricingTableStylesBlock
                      styles={styles}
                      onUpdate={onUpdate}
                      onBatchUpdate={onBatchUpdate}
                      themeColors={themeColors}
                  />
              )}
              {isElementDesignTab && elementType === 'pricing-item' && (
                  <PricingItemStylesBlock
                      styles={styles}
                      onUpdate={onUpdate}
                      onBatchUpdate={onBatchUpdate}
                      themeColors={themeColors}
                  />
              )}
              {isElementDesignTab && elementType === 'flip-box' && (
                  <FlipBoxStylesBlock
                      styles={styles}
                      onUpdate={onUpdate}
                      onBatchUpdate={onBatchUpdate}
                      themeColors={themeColors}
                  />
              )}
              {isElementDesignTab && elementType === 'video' && (
                  <VideoStylesBlock
                      styles={styles}
                      onUpdate={onUpdate}
                      onBatchUpdate={onBatchUpdate}
                      themeColors={themeColors}
                  />
              )}
              {isElementDesignTab && elementType === 'image-box' && (
                  <ImageBoxStylesBlock
                      styles={styles}
                      onUpdate={onUpdate}
                      onBatchUpdate={onBatchUpdate}
                      themeColors={themeColors}
                      defaultSizes={defaultSizes}
                  />
              )}
              {isElementDesignTab && elementType === 'logo-cloud' && (
                  <LogoCloudStylesBlock
                      styles={styles}
                      onUpdate={onUpdate}
                      onBatchUpdate={onBatchUpdate}
                      themeColors={themeColors}
                  />
              )}
              {isElementDesignTab && elementType === 'user-avatars' && (
                  <UserAvatarsStylesBlock
                      styles={styles}
                      onUpdate={onUpdate}
                      onBatchUpdate={onBatchUpdate}
                      themeColors={themeColors}
                  />
              )}
              {isElementDesignTab && elementType === 'review-carousel' && (
                  <ReviewCarouselStylesBlock
                      styles={styles}
                      onUpdate={onUpdate}
                      onBatchUpdate={onBatchUpdate}
                      themeColors={themeColors}
                  />
              )}
              {isSectionDesignTab && (
                  <>
                      {selectedSection && (
                          <BulkElementStylesBlock
                              section={selectedSection}
                              onSectionUpdate={updateSection}
                              themeColors={themeColors}
                          />
                      )}
                      <SectionBackgroundBlock
                          styles={styles}
                          onUpdate={onUpdate}
                          onBatchUpdate={onBatchUpdate}
                          sectionId={sectionId}
                          selectedSection={selectedSection}
                          onSectionUpdate={updateSection}
                          triggerUpload={triggerUpload}
                          uploading={uploading}
                          uploadTarget={uploadTarget}
                          uploadProgress={uploadProgress}
                          getActiveGlobalTheme={getActiveGlobalTheme}
                          getThemeOverlayDefaults={getThemeOverlayDefaults}
                      />
                      {(styles.background?.type === 'image' || styles.backgroundImage) && (
                          <SectionImageSettingsBlock styles={styles} onUpdate={onUpdate} />
                      )}
                      {/* Shape Dividers (Elementor-style top/bottom SVG shapes) — the
                          block + renderer already existed; re-exposed here in a
                          collapsed accordion so it doesn't clutter the panel. */}
                      <SectionDividersBlock styles={styles} onUpdate={onUpdate} />
                      <SectionDesignExtrasBlock styles={styles} onUpdate={onUpdate} onBatchUpdate={onBatchUpdate} />
                  </>
              )}
              {/* Background routing —
                  • image            → its own ImageElementStylesBlock (covers everything)
                  • elements that use card/container surfaces → new ElementBackgroundBlock with Color/Gradient/Image + Overlay
                  • everything else → legacy ElementBackgroundOverlayBlock (simple bg color + opacity) */}
              {(() => {
                  if (!isElementDesignTab) return null;
                  if (elementType === 'image') {
                      return <ImageElementStylesBlock styles={styles} onUpdate={onUpdate} onBatchUpdate={onBatchUpdate} themeColors={themeColors} />;
                  }
                  // Heading + text use a simple bg color (legacy block) because their
                  // gradient TEXT-FILL feature conflicts with element bg gradient.
                  // call-to-action shares the button render path — its bg goes through
                  // ButtonStylesBlock, not this generic block.
                  const NEW_BG_ELEMENTS = new Set([
                      'feature-box', 'icon-box', 'stat-card', 'testimonial-card',
                      'alert-box', 'accordion', 'blockquote',
                      'flip-box', 'pricing-item', 'card',
                  ]);
                  // Image-like elements (where overlay actually makes sense visually)
                  const SHOW_OVERLAY = new Set([
                      'feature-box', 'icon-box', 'stat-card', 'testimonial-card',
                      'alert-box', 'accordion', 'flip-box', 'pricing-item', 'card',
                  ]);
                  if (NEW_BG_ELEMENTS.has(elementType || '')) {
                      return (
                          <ElementBackgroundBlock
                              styles={styles}
                              onUpdate={onUpdate}
                              showOverlay={SHOW_OVERLAY.has(elementType || '')}
                              themeColors={themeColors}
                          />
                      );
                  }
                  // Skip fallback bg for elements whose dedicated block already handles bg internally.
                  const SKIP_FALLBACK_BG = new Set(['button', 'call-to-action', 'badge', 'icon', 'divider', 'spacer', 'video', 'image-box', 'logo-cloud', 'user-avatars', 'review-carousel']);
                  if (SKIP_FALLBACK_BG.has(elementType || '')) return null;
                  // Fallback for everything else (list, blockquote, etc.)
                  return <ElementBackgroundOverlayBlock styles={styles} onUpdate={onUpdate} />;
              })()}
          </div>
      );
  };

  if (loadingPageData) {
    return (
      <div className="h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-sm text-gray-400">Loading page data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-black text-white selection:bg-blue-500/30 overflow-hidden flex flex-col">
        <BuilderHeader
          selectedSectionId={selectedSectionId}
          isSidebarOpen={isSidebarOpen}
          viewMode={viewMode}
          zoomLevel={zoomLevel}
          isPreviewMode={isPreviewMode}
          savingPageData={savingPageData}
          onOpenThemes={() => { setSelectedSectionId(null); setSelectedElementId(null); setGlobalTab('pages'); setIsSidebarOpen(true); }}
          onAddTestSection={() => addNewSection('canvasShowcase')}
          onAddCanvasSection={() => addNewSection('canvas')}
          onViewModeChange={setViewMode}
          onZoomChange={setZoomLevel}
          onTogglePreview={() => setIsPreviewMode(!isPreviewMode)}
          onSave={savePageDataAndMarkClean}
          canUndo={canUndo}
          canRedo={canRedo}
          onUndo={undo}
          onRedo={redo}
          autosaveStatus={autosave.status}
          lastSavedAt={autosave.lastSavedAt}
          onShowShortcuts={() => setShowShortcuts(true)}
          selectedPresetId={selectedPresetId}
          isCustomTheme={isCustomTheme}
          onPresetSelect={(theme, idx) => {
            applyTheme(theme, idx.toString());
            setIsCustomTheme(false);
            setSelectedVirtualElement(null);
          }}
        />

        <div className="flex-1 flex overflow-hidden relative h-full">
            <aside
              className={`w-80 bg-[#080808] border-r border-white/10 flex flex-col shrink-0 transition-all duration-300 absolute z-40 h-full sm:relative ${isSidebarOpen && !isPreviewMode ? 'translate-x-0' : '-translate-x-full sm:hidden'} ${!isPreviewMode ? 'sm:translate-x-0' : 'sm:-translate-x-full sm:w-0 sm:border-none'}`}
              aria-label="Builder sidebar"
            >
                {/* Floating close button — always visible at top-right of sidebar */}
                <button
                    onClick={() => {
                        setIsSidebarOpen(false);
                        setSelectedSectionId(null);
                        setSelectedElementId(null);
                        setSelectedVirtualElement(null);
                    }}
                    title="Close sidebar"
                    aria-label="Close sidebar"
                    className="absolute top-2 right-2 z-50 w-7 h-7 flex items-center justify-center rounded-md bg-white/5 hover:bg-red-500/20 text-white/60 hover:text-red-400 border border-white/10 hover:border-red-500/40 transition-all"
                >
                    <i className="fa-solid fa-xmark text-[11px]" aria-hidden="true"></i>
                </button>
                {!selectedSectionId ? (
                  <GlobalThemePanel
                    globalTab={globalTab}
                    onGlobalTabChange={setGlobalTab}
                    selectedPresetId={selectedPresetId}
                    onPresetSelect={(theme, idx) => {
                      applyTheme(theme, idx.toString());
                      setIsCustomTheme(false);
                      setSelectedVirtualElement(null);
                    }}
                    globalColors={siteData.globalStyles.colors}
                    onGlobalColorChange={(key, value) => updateGlobalColor(key, value)}
                    defaultTypography={defaultTypography}
                    setDefaultTypography={setDefaultTypography}
                    defaultSizes={defaultSizes}
                    setDefaultSizes={setDefaultSizes}
                    savingTheme={savingTheme}
                    onSaveTheme={() => saveThemeSettings()}
                    seo={siteData.seo || {}}
                    onSeoChange={updateSeo}
                    onSeoUpload={triggerSeoUpload}
                    onSeoRegenerate={handleSeoRegenerate}
                    pages={siteData.pages}
                    currentPageId={siteData.currentPageId}
                    onSelectPage={handleSelectPage}
                    onAddPage={handleAddPage}
                    onRenamePage={handleRenamePage}
                    onDeletePage={handleDeletePage}
                    onReorderPage={handleReorderPage}
                    globalSections={siteData.globalSections}
                    pageSections={siteData.sections}
                    currentPageName={siteData.pages?.find(p => p.id === siteData.currentPageId)?.name}
                    selectedSectionId={selectedSectionId}
                    onSelectSection={(id) => { setSelectedSectionId(id); setSelectedElementId(null); setSelectedVirtualElement(null); }}
                    onMoveSection={moveSection}
                    onDuplicateSection={duplicateSection}
                    onDeleteSection={deleteSection}
                    showSectionOutlines={showSectionOutlines}
                    onToggleSectionOutlines={setShowSectionOutlines}
                  />
                ) : (
                    <div className="flex flex-col h-full">
                        {selectedSection && (
                          <SectionSidebarHeader
                            selectedSection={selectedSection}
                            selectedElement={selectedElement}
                            selectedElementId={selectedElementId}
                            editTab={editTab}
                            onEditTabChange={setEditTab}
                            onBack={() => {
                              if (selectedElementId) {
                                setSelectedElementId(null);
                                setSelectedVirtualElement(null);
                              } else {
                                setSelectedSectionId(null);
                              }
                            }}
                            onClearElementSelection={() => { setSelectedElementId(null); setSelectedVirtualElement(null); }}
                            onRefreshVariant={handleRefreshVariant}
                          />
                        )}
                        {selectedSection && (
                          <SectionSidebarBody
                            selectedSection={selectedSection}
                            selectedElement={selectedElement}
                            selectedElementId={selectedElementId}
                            editTab={editTab}
                            resolvedSectionStyles={resolvedSectionStyles}
                            resolvedElementStyle={resolvedElementStyle}
                            themeData={themeData}
                            sectionContentSource={sectionContentSource}
                            defaultSizes={defaultSizes}
                            siteData={siteData}
                            onUpdateSection={updateSection}
                            onUpdateSectionStyle={updateSectionStyle}
                            onUpdateElement={updateElement}
                            onResetElementToDefault={resetElementToDefault}
                            onCleanElementStyle={cleanElementStyle}
                            onPatchElementStyle={patchElementStyleForBreakpoint}
                            editBreakpoint={editBreakpoint}
                            onRefreshVariant={handleRefreshVariant}
                            onRestoreSectionElements={restoreSectionElements}
                            onResetSectionStyles={resetSectionStyles}
                            onTriggerUpload={triggerUpload}
                            getActiveGlobalTheme={getActiveGlobalTheme}
                            renderStyleEditor={renderStyleEditor}
                          />
                        )}
                    </div>
                )}
            </aside>
            {/* Canvas Wrapper - full remaining width; content inside uses 80% when sidebar open */}
            <main
                className="flex-1 bg-[#111] relative overflow-hidden transition-all duration-300"
                onClick={() => { setSelectedSectionId(null); setSelectedElementId(null); }}
            >
                {/* Scrollable viewport container */}
                <div className="absolute inset-0 flex items-start justify-center overflow-auto custom-scrollbar">
                    {/* Device Container - fixed width by selected device */}
                    <div
                        className="transition-all duration-300 origin-top"
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            width: `${currentDeviceWidth}px`,
                            maxWidth: '100%',
                            flexShrink: 0,
                            minHeight: '100%',
                            height: 'auto',
                            backgroundColor: themeData?.surface || '#0E1214',
                            position: 'relative',
                            fontFamily: defaultTypography.descriptionFontFamily,
                        }}
                    >
                        {/* Browser-like zoom: keep device frame fixed, change inner viewport scale */}
                        <div className="w-full overflow-hidden">
                        <PreviewFrame
                            className="block origin-top-left"
                            style={{
                                backgroundColor: 'transparent',
                                width: `${zoomViewportWidthPercent}%`,
                                height: 'auto',
                                minHeight: '500px',
                                display: 'block',
                                border: 'none',
                                transform: `scale(${zoomScale})`,
                                transformOrigin: 'top left'
                            }}
                            onIframeClick={() => {
                                // Click anywhere outside an element/section toolbar →
                                // fully deselect (drop both element + section). Lets the
                                // user "click empty space" to clear the sidebar without
                                // having to pick a different element first.
                                setSelectedElementId(null);
                                setSelectedVirtualElement(null);
                                setSelectedSectionId(null);
                            }}
                            onInternalLinkClick={handleOpenInternalLink}
                        >
                            <DefaultSizesContext.Provider value={defaultSizes}>
                            <GlobalElementStylesContext.Provider value={siteData.globalElementStyles}>
                            <OpenInternalLinkProvider value={handleOpenInternalLink}>
                            <div
                                id="canvas-root"
                                className="w-full"
                                style={{
                                    width: '100%',
                                    height: 'auto'
                                }}
                            >
                         {(() => {
                            // Interleave global header/navbar (first), active page body,
                            // and global footers (last). Chrome persists across page switches.
                            const globals = siteData.globalSections || [];
                            const isHeaderChrome = (t: string) => t === 'navbar' || t === 'header';
                            const navbars = globals.filter((g) =>
                              isHeaderChrome(String(g.type).toLowerCase())
                            );
                            const footers = globals.filter(
                              (g) => String(g.type).toLowerCase() === 'footer'
                            );
                            const otherGlobals = globals.filter((g) => {
                              const t = String(g.type).toLowerCase();
                              return !isHeaderChrome(t) && t !== 'footer';
                            });
                            const allInOrder = [
                              ...navbars,
                              ...otherGlobals,
                              ...siteData.sections,
                              ...footers,
                            ];
                            return allInOrder.map((section) => (
                              <SectionRenderer
                                key={section.id}
                                section={resolveSectionForBreakpoint(section, editBreakpoint)}
                                onUpdate={updateSection}
                                isSelected={selectedSectionId === section.id}
                                readOnly={isPreviewMode}
                                showSectionOutlines={showSectionOutlines}
                                onClick={() => {
                                  setSelectedSectionId(section.id);
                                  setSelectedElementId(null);
                                  setSelectedVirtualElement(null);
                                }}
                                onDelete={deleteSection}
                                onMoveUp={(id) => moveSection(id, 'up')}
                                onMoveDown={(id) => moveSection(id, 'down')}
                                onDuplicate={duplicateSection}
                                onUpload={triggerUpload}
                                selectedElementId={selectedElementId}
                                onElementSelect={(elId, el) => {
                                  setSelectedSectionId(section.id);
                                  setSelectedElementId(elId);
                                  setSelectedVirtualElement(el || null);
                                }}
                                onElementUpdate={(elId, updates) => updateElement(section.id, elId, updates)}
                                onOpenInternalLink={handleOpenInternalLink}
                              />
                            ));
                         })()}
                    </div>
                            </OpenInternalLinkProvider>
                            </GlobalElementStylesContext.Provider>
                            </DefaultSizesContext.Provider>
                </PreviewFrame>
                        </div>
                    </div>
                </div>
            </main>
        </div>
        <input type="file" ref={fileInputRef} className="hidden" accept="image/*,video/*" onChange={handleFileUpload} />
        <KeyboardShortcutsModal open={showShortcuts} onClose={() => setShowShortcuts(false)} />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#1a1a1a',
              color: '#ffffff',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              padding: '12px 16px',
              fontSize: '14px',
              fontFamily: 'Inter, sans-serif',
            },
            success: {
              iconTheme: {
                primary: '#22c55e',
                secondary: '#ffffff',
              },
              style: {
                background: '#1a1a1a',
                border: '1px solid rgba(34, 197, 94, 0.3)',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#ffffff',
              },
              style: {
                background: '#1a1a1a',
                border: '1px solid rgba(239, 68, 68, 0.3)',
              },
            },
          }}
        />
    </div>
  );
};

const App: React.FC = () => {
  const urlParams = getUrlParams();
  const projectId = urlParams.projectId || undefined;
  const apiUrl = API_BASE_URL;
  
  // Set global API URL for ThemeProvider and other shared packages
  if (typeof window !== 'undefined') {
    (window as any).__API_URL__ = apiUrl;
    if (projectId) writeStoredProjectId(projectId);
  }
  
  return (
    <ThemeProvider projectId={projectId ?? null} isBuilder={true} typography={DEFAULT_TYPOGRAPHY}>
      <AboutUsContactProvider projectId={projectId || null}>
        <AppContent />
      </AboutUsContactProvider>
    </ThemeProvider>
  );
};

export default App;