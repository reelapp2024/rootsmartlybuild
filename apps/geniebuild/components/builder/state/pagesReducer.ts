import type { WebsiteData, WebsitePage, Section } from '../../../types';

/** API uses `header`; older templates may still use `navbar`. Both are site chrome. */
const GLOBAL_SECTION_TYPES: ReadonlySet<string> = new Set(['navbar', 'header', 'footer']);

function mkPageId(): string {
  return `page-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export function isGlobalSectionType(type: string | undefined | null): boolean {
  return GLOBAL_SECTION_TYPES.has(String(type || '').toLowerCase().trim());
}

/**
 * Split a flat API sections array into persistent chrome (header/navbar/footer)
 * vs page body. GenieBuild keeps chrome in `globalSections` across page switches.
 */
export function splitGlobalAndPageSections(sections: Section[] | null | undefined): {
  globalSections: Section[];
  pageSections: Section[];
} {
  const headers: Section[] = [];
  const footers: Section[] = [];
  const otherGlobals: Section[] = [];
  const pageSections: Section[] = [];

  for (const s of sections || []) {
    const t = String(s?.type || '').toLowerCase().trim();
    if (t === 'header' || t === 'navbar') headers.push(s);
    else if (t === 'footer') footers.push(s);
    else if (isGlobalSectionType(t)) otherGlobals.push(s);
    else pageSections.push(s);
  }

  return {
    globalSections: [...headers, ...otherGlobals, ...footers],
    pageSections,
  };
}

/** Replace chrome of the same type with incoming; keep unrelated globals. */
export function mergeGlobalChrome(
  existing: Section[] | null | undefined,
  incoming: Section[] | null | undefined
): Section[] {
  const next = Array.isArray(incoming) ? incoming : [];
  if (!next.length) return Array.isArray(existing) ? existing : [];
  const incomingTypes = new Set(
    next.map((s) => String(s?.type || '').toLowerCase().trim()).filter(Boolean)
  );
  const kept = (existing || []).filter(
    (s) => !incomingTypes.has(String(s?.type || '').toLowerCase().trim())
  );
  return splitGlobalAndPageSections([...kept, ...next]).globalSections;
}

/**
 * If siteData has no `pages` array yet, migrate the flat `sections` into a
 * single-page structure. Header/navbar + footer move to `globalSections`,
 * the rest become page 0's sections. Returns the migrated siteData.
 *
 * Idempotent: calling on already-migrated data returns it unchanged.
 */
export function ensurePagesStructure(siteData: WebsiteData): WebsiteData {
  if (siteData.pages && siteData.pages.length > 0) return siteData;

  const { globalSections: splitGlobals, pageSections } = splitGlobalAndPageSections(
    siteData.sections || []
  );
  const globals =
    splitGlobals.length > 0 ? splitGlobals : siteData.globalSections || [];

  const homePage: WebsitePage = {
    id: mkPageId(),
    name: 'Home',
    slug: '/',
    sections: pageSections,
    seo: siteData.seo,
  };

  // Seed dummy placeholder pages alongside Home so the Pages panel shows
  // a realistic multi-page site layout. These pages have empty sections —
  // backend is expected to populate them at publish time (or user can
  // manually add sections by switching to each page).
  const dummyPages: WebsitePage[] = [
    { id: mkPageId(), name: 'Services', slug: '/services', sections: [], seo: {} },
    { id: mkPageId(), name: 'About', slug: '/about', sections: [], seo: {} },
    { id: mkPageId(), name: 'Contact', slug: '/contact', sections: [], seo: {} },
    { id: mkPageId(), name: 'Blog', slug: '/blog', sections: [], seo: {} },
  ];

  return {
    ...siteData,
    globalSections: globals,
    pages: [homePage, ...dummyPages],
    currentPageId: homePage.id,
    // Keep `sections` mirrored so legacy code keeps working.
    sections: pageSections,
  };
}

/**
 * Returns a new siteData with the current page's sections synced FROM the
 * top-level `sections` array. Used before saving or before switching pages
 * so in-progress edits persist into their page's sections bucket.
 */
export function commitSectionsToCurrentPage(siteData: WebsiteData): WebsiteData {
  const { pages, currentPageId, sections } = siteData;
  if (!pages || !currentPageId) return siteData;
  const updated = pages.map((p) => (p.id === currentPageId ? { ...p, sections } : p));
  return { ...siteData, pages: updated };
}

/**
 * Switch the editor to a different page. Commits the outgoing page's
 * sections into `pages` first, then copies the incoming page's sections up
 * to the top-level `sections` array so the existing rendering/edit pipeline
 * keeps working without changes.
 */
export function switchToPage(siteData: WebsiteData, nextPageId: string): WebsiteData {
  const committed = commitSectionsToCurrentPage(siteData);
  const nextPage = committed.pages?.find((p) => p.id === nextPageId);
  if (!nextPage) return committed;
  return {
    ...committed,
    currentPageId: nextPageId,
    sections: nextPage.sections,
    // Fall back to site-level SEO if page has none saved
    seo: nextPage.seo || siteData.seo,
  };
}

/**
 * Add a new blank page and switch to it immediately.
 */
export function addPage(siteData: WebsiteData, name: string, slug: string): WebsiteData {
  const withPages = ensurePagesStructure(siteData);
  const newPage: WebsitePage = {
    id: mkPageId(),
    name,
    slug: slug || `/${name.toLowerCase().replace(/\s+/g, '-')}`,
    sections: [],
    seo: {},
  };
  const committed = commitSectionsToCurrentPage(withPages);
  return {
    ...committed,
    pages: [...(committed.pages || []), newPage],
    currentPageId: newPage.id,
    sections: [],
    seo: {},
  };
}

export function renamePage(siteData: WebsiteData, pageId: string, name: string, slug: string): WebsiteData {
  if (!siteData.pages) return siteData;
  return {
    ...siteData,
    pages: siteData.pages.map((p) => (p.id === pageId ? { ...p, name, slug } : p)),
  };
}

export function deletePage(siteData: WebsiteData, pageId: string): WebsiteData {
  if (!siteData.pages || siteData.pages.length <= 1) return siteData; // can't delete last
  const remaining = siteData.pages.filter((p) => p.id !== pageId);
  // If deleted page was active, switch to the first remaining page
  if (siteData.currentPageId === pageId) {
    const fallback = remaining[0];
    return {
      ...siteData,
      pages: remaining,
      currentPageId: fallback.id,
      sections: fallback.sections,
      seo: fallback.seo || siteData.seo,
    };
  }
  return { ...siteData, pages: remaining };
}

export function reorderPage(siteData: WebsiteData, pageId: string, direction: 'up' | 'down'): WebsiteData {
  if (!siteData.pages) return siteData;
  const idx = siteData.pages.findIndex((p) => p.id === pageId);
  if (idx < 0) return siteData;
  const target = direction === 'up' ? idx - 1 : idx + 1;
  if (target < 0 || target >= siteData.pages.length) return siteData;
  const pages = [...siteData.pages];
  [pages[idx], pages[target]] = [pages[target], pages[idx]];
  return { ...siteData, pages };
}

/**
 * Update the SEO metadata for the currently-active page. Also keeps
 * top-level `seo` in sync for the live-preview applySeoToDocument hook.
 */
export function updateCurrentPageSeo(
  siteData: WebsiteData,
  patch: Partial<NonNullable<WebsitePage['seo']>>
): WebsiteData {
  if (!siteData.pages || !siteData.currentPageId) {
    return { ...siteData, seo: { ...(siteData.seo || {}), ...patch } };
  }
  const pages = siteData.pages.map((p) =>
    p.id === siteData.currentPageId ? { ...p, seo: { ...(p.seo || {}), ...patch } } : p
  );
  const mergedSeo = { ...(siteData.seo || {}), ...patch };
  return { ...siteData, pages, seo: mergedSeo };
}
