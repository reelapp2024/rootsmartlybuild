import type { Section, WebsiteData } from './types';
import { INITIAL_TEMPLATE, SECTION_TEMPLATES } from './constants';

/**
 * When GenieBuild runs without `projectId` in the URL, `/service` shows a
 * minimal dummy page (header + servicehero + aboutservice + footer) so the
 * service section variants can be previewed like the homepage dummy.
 */
export function isLocalServiceDemoPath(pathname: string): boolean {
  const normalized = (pathname || '').replace(/\\/g, '/').replace(/\/+$/, '') || '/';
  const lower = normalized.toLowerCase();
  return lower === '/service' || lower.endsWith('/service');
}

/** When GenieBuild runs without `projectId`, `/about` shows a dummy About page
 *  (header + about hero + footer) so the About hero can be previewed like the
 *  homepage and service dummies. */
export function isLocalAboutDemoPath(pathname: string): boolean {
  const normalized = (pathname || '').replace(/\\/g, '/').replace(/\/+$/, '') || '/';
  const lower = normalized.toLowerCase();
  return lower === '/about' || lower.endsWith('/about');
}

/** When GenieBuild runs without `projectId`, `/services/:serviceName` shows a
 *  full dummy Service Detail page so all service-detail section variants can be
 *  previewed. Note: this is the single-service DETAIL page, not the `/services`
 *  listing page (which has its own sections). Requires a service name segment
 *  after `/services/`, so bare `/services` does NOT match. */
export function isLocalServiceDetailDemoPath(pathname: string): boolean {
  const normalized = (pathname || '').replace(/\\/g, '/').replace(/\/+$/, '') || '/';
  const lower = normalized.toLowerCase();
  // Match `/services/<something>` — at least one non-empty segment after /services/
  return /(^|\/)services\/[^/]+$/.test(lower);
}

/** When GenieBuild runs without `projectId`, bare `/services` (no service name)
 *  shows the Services LISTING page (hero + services grid + why-choose + cta +
 *  guarantee + process + areas + faq). Distinct from `/services/:serviceName`
 *  (the service detail page). */
export function isLocalServicesListDemoPath(pathname: string): boolean {
  const normalized = (pathname || '').replace(/\\/g, '/').replace(/\/+$/, '') || '/';
  const lower = normalized.toLowerCase();
  return lower === '/services' || lower.endsWith('/services');
}

/** When GenieBuild runs without `projectId`, `/contact` shows the Contact page
 *  (contact hero + info methods + form + cta + faq). */
export function isLocalContactDemoPath(pathname: string): boolean {
  const normalized = (pathname || '').replace(/\\/g, '/').replace(/\/+$/, '') || '/';
  const lower = normalized.toLowerCase();
  return lower === '/contact' || lower.endsWith('/contact');
}

/** When GenieBuild runs without `projectId`, `/blogs` shows the Blogs listing
 *  page (blogs hero + search/filter + post grid). */
export function isLocalBlogsDemoPath(pathname: string): boolean {
  const normalized = (pathname || '').replace(/\\/g, '/').replace(/\/+$/, '') || '/';
  const lower = normalized.toLowerCase();
  return lower === '/blogs' || lower.endsWith('/blogs');
}

/** When GenieBuild runs without `projectId`, `/blog/:slug` shows the Blog Detail
 *  page (article header + content + author + related + comments). Requires a slug
 *  segment after `/blog/`, so bare `/blog` or `/blogs` do NOT match. */
export function isLocalBlogDetailDemoPath(pathname: string): boolean {
  const normalized = (pathname || '').replace(/\\/g, '/').replace(/\/+$/, '') || '/';
  const lower = normalized.toLowerCase();
  // `/blog/<slug>` — one non-empty segment after /blog/ (note: singular /blog, not /blogs)
  return /(^|\/)blog\/[^/]+$/.test(lower);
}

/** When GenieBuild runs without `projectId`, `/location/:name` (or `/locations/:name`)
 *  shows the full Location page (all combined sections). Requires a location name
 *  segment. */
export function isLocalLocationDemoPath(pathname: string): boolean {
  const normalized = (pathname || '').replace(/\\/g, '/').replace(/\/+$/, '') || '/';
  const lower = normalized.toLowerCase();
  return /(^|\/)locations?\/[^/]+$/.test(lower);
}

/** When GenieBuild runs without `projectId`, the legal routes (/privacy, /terms,
 *  /disclaimer, /legal) show the Legal page (hero + document content). Returns
 *  the matched legal title so the hero shows the right heading. */
export function getLocalLegalDemoTitle(pathname: string): string | null {
  const normalized = (pathname || '').replace(/\\/g, '/').replace(/\/+$/, '') || '/';
  const lower = normalized.toLowerCase();
  if (lower === '/privacy' || lower.endsWith('/privacy') || lower.endsWith('/privacy-policy')) return 'Privacy Policy';
  if (lower === '/terms' || lower.endsWith('/terms') || lower.endsWith('/terms-of-service')) return 'Terms of Service';
  if (lower === '/disclaimer' || lower.endsWith('/disclaimer')) return 'Disclaimer';
  if (lower === '/legal' || lower.endsWith('/legal')) return 'Legal';
  return null;
}

function cloneDeep<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function sectionFromTemplate(type: string, id: string, variantOverride?: string): Section {
  const t = SECTION_TEMPLATES[type];
  const section = {
    ...cloneDeep(t),
    id,
    type: (t?.type as any) || type,
    elements: Array.isArray(t?.elements) ? cloneDeep(t.elements) : [],
  } as Section;
  if (variantOverride) {
    const nextStyles = { ...(section.styles as any), variant: variantOverride };
    // Some legacy templates (e.g. servicehero) hardcode dark theme colors in
    // styles (backgroundColor/titleColor/textColor/themeMode). When we swap to a
    // theme-consistent variant, strip those so the section follows the ACTIVE
    // theme (same as the About hero) instead of being stuck on a fixed color.
    delete nextStyles.backgroundColor;
    delete nextStyles.titleColor;
    delete nextStyles.textColor;
    delete nextStyles.themeMode;
    (section.styles as any) = nextStyles;
  }
  return section;
}

/** Initial canvas when opening GenieBuild without `projectId` (dummy / local preview). */
export function getStandaloneInitialWebsiteData(): WebsiteData {
  if (typeof window === 'undefined') return INITIAL_TEMPLATE;
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get('projectId')) return INITIAL_TEMPLATE;
    if (isLocalAboutDemoPath(window.location.pathname)) {
      return buildLocalAboutDemoWebsiteData();
    }
    if (isLocalContactDemoPath(window.location.pathname)) {
      return buildLocalContactDemoWebsiteData();
    }
    const legalTitle = getLocalLegalDemoTitle(window.location.pathname);
    if (legalTitle) {
      return buildLocalLegalDemoWebsiteData(legalTitle);
    }
    if (isLocalLocationDemoPath(window.location.pathname)) {
      return buildLocalLocationDemoWebsiteData();
    }
    // Check blog DETAIL (/blog/:slug) before blogs LISTING (/blogs).
    if (isLocalBlogDetailDemoPath(window.location.pathname)) {
      return buildLocalBlogDetailDemoWebsiteData();
    }
    if (isLocalBlogsDemoPath(window.location.pathname)) {
      return buildLocalBlogsDemoWebsiteData();
    }
    // Order matters: `/services/:serviceName` (detail) before bare `/services`
    // (listing) before `/service` (singular preview).
    if (isLocalServiceDetailDemoPath(window.location.pathname)) {
      return buildLocalServiceDetailDemoWebsiteData();
    }
    if (isLocalServicesListDemoPath(window.location.pathname)) {
      return buildLocalServicesListDemoWebsiteData();
    }
    if (isLocalServiceDemoPath(window.location.pathname)) {
      return buildLocalServiceDemoWebsiteData();
    }
  } catch {
    /* ignore */
  }
  return INITIAL_TEMPLATE;
}

export function buildLocalServiceDemoWebsiteData(): WebsiteData {
  const base = cloneDeep(INITIAL_TEMPLATE);
  const header = base.sections.find((s) => s.type === 'header');
  const footer = base.sections.find((s) => s.type === 'footer');

  const sections: Section[] = [];
  if (header) sections.push({ ...cloneDeep(header), id: 'demo-header-1' });
  sections.push(sectionFromTemplate('servicehero', 'demo-servicehero-1'));
  sections.push(sectionFromTemplate('aboutservice', 'demo-aboutservice-1'));
  if (footer) sections.push({ ...cloneDeep(footer), id: 'demo-footer-1' });

  return {
    ...base,
    name: 'GenieBuild — Service (local demo)',
    sections,
    pages: undefined,
    currentPageId: undefined,
    globalSections: base.globalSections ? cloneDeep(base.globalSections) : undefined,
  };
}

export function buildLocalAboutDemoWebsiteData(): WebsiteData {
  const base = cloneDeep(INITIAL_TEMPLATE);
  const header = base.sections.find((s) => s.type === 'header');
  const footer = base.sections.find((s) => s.type === 'footer');

  // About page: header + 7 About sections + footer.
  // why-choose-us / cta / faq reuse the existing homepage variants.
  const aboutTypes = [
    'abouthero',
    'missionvision',
    'corevalues',
    'usp',
    'why-choose-us',
    'cta',
    'faq',
  ];
  const sections: Section[] = [];
  if (header) sections.push({ ...cloneDeep(header), id: 'demo-header-1' });
  aboutTypes.forEach((type, i) => {
    sections.push(sectionFromTemplate(type, `demo-about-${type}-${i + 1}`));
  });
  if (footer) sections.push({ ...cloneDeep(footer), id: 'demo-footer-1' });

  return {
    ...base,
    name: 'GenieBuild — About (local demo)',
    sections,
    pages: undefined,
    currentPageId: undefined,
    globalSections: base.globalSections ? cloneDeep(base.globalSections) : undefined,
  };
}

export function buildLocalContactDemoWebsiteData(): WebsiteData {
  const base = cloneDeep(INITIAL_TEMPLATE);
  const header = base.sections.find((s) => s.type === 'header');
  const footer = base.sections.find((s) => s.type === 'footer');

  // Contact page: hero + info methods + form + cta + faq.
  // cta / faq reuse existing homepage variants.
  const contactTypes = [
    'contacthero',
    'contactinfo',
    'contactform',
    'cta',
    'faq',
  ];
  const sections: Section[] = [];
  if (header) sections.push({ ...cloneDeep(header), id: 'demo-header-1' });
  contactTypes.forEach((type, i) => {
    sections.push(sectionFromTemplate(type, `demo-contact-${type}-${i + 1}`));
  });
  if (footer) sections.push({ ...cloneDeep(footer), id: 'demo-footer-1' });

  return {
    ...base,
    name: 'GenieBuild — Contact (local demo)',
    sections,
    pages: undefined,
    currentPageId: undefined,
    globalSections: base.globalSections ? cloneDeep(base.globalSections) : undefined,
  };
}

export function buildLocalBlogsDemoWebsiteData(): WebsiteData {
  const base = cloneDeep(INITIAL_TEMPLATE);
  const header = base.sections.find((s) => s.type === 'header');
  const footer = base.sections.find((s) => s.type === 'footer');

  // Blogs listing page: hero + search/filter + post grid.
  const blogsTypes = ['blogshero', 'blogssearch', 'blogslist'];
  const sections: Section[] = [];
  if (header) sections.push({ ...cloneDeep(header), id: 'demo-header-1' });
  blogsTypes.forEach((type, i) => {
    sections.push(sectionFromTemplate(type, `demo-blogs-${type}-${i + 1}`));
  });
  if (footer) sections.push({ ...cloneDeep(footer), id: 'demo-footer-1' });

  return {
    ...base,
    name: 'GenieBuild — Blogs (local demo)',
    sections,
    pages: undefined,
    currentPageId: undefined,
    globalSections: base.globalSections ? cloneDeep(base.globalSections) : undefined,
  };
}

export function buildLocalBlogDetailDemoWebsiteData(): WebsiteData {
  const base = cloneDeep(INITIAL_TEMPLATE);
  const header = base.sections.find((s) => s.type === 'header');
  const footer = base.sections.find((s) => s.type === 'footer');

  // Blog Detail page: article header (+ breadcrumb + cover) → content → author
  // → related articles → comments.
  const blogDetailTypes = [
    'blogarticlehero',
    'blogcontent',
    'blogauthor',
    'blogrelated',
    'blogcomments',
  ];
  const sections: Section[] = [];
  if (header) sections.push({ ...cloneDeep(header), id: 'demo-header-1' });
  blogDetailTypes.forEach((type, i) => {
    sections.push(sectionFromTemplate(type, `demo-blogdetail-${type}-${i + 1}`));
  });
  if (footer) sections.push({ ...cloneDeep(footer), id: 'demo-footer-1' });

  return {
    ...base,
    name: 'GenieBuild — Blog Detail (local demo)',
    sections,
    pages: undefined,
    currentPageId: undefined,
    globalSections: base.globalSections ? cloneDeep(base.globalSections) : undefined,
  };
}

export function buildLocalLegalDemoWebsiteData(legalTitle: string = 'Privacy Policy'): WebsiteData {
  const base = cloneDeep(INITIAL_TEMPLATE);
  const header = base.sections.find((s) => s.type === 'header');
  const footer = base.sections.find((s) => s.type === 'footer');

  // Legal page: hero + document content. The hero title comes from the route
  // (Privacy Policy / Terms of Service / Disclaimer).
  const hero = sectionFromTemplate('legalhero', 'demo-legal-hero-1');
  (hero.content as any) = { ...(hero.content as any), heroTitle: legalTitle, breadcrumbLabel: legalTitle };
  const content = sectionFromTemplate('legalcontent', 'demo-legal-content-1');

  const sections: Section[] = [];
  if (header) sections.push({ ...cloneDeep(header), id: 'demo-header-1' });
  sections.push(hero);
  sections.push(content);
  if (footer) sections.push({ ...cloneDeep(footer), id: 'demo-footer-1' });

  return {
    ...base,
    name: `GenieBuild — ${legalTitle} (local demo)`,
    sections,
    pages: undefined,
    currentPageId: undefined,
    globalSections: base.globalSections ? cloneDeep(base.globalSections) : undefined,
  };
}

export function buildLocalLocationDemoWebsiteData(): WebsiteData {
  const base = cloneDeep(INITIAL_TEMPLATE);
  const header = base.sections.find((s) => s.type === 'header');
  const footer = base.sections.find((s) => s.type === 'footer');

  // Full Location page (all combined). Most sections reuse existing variants;
  // `sublocations` + `locationmap` are the new ones. CTA appears twice.
  // [type, idSuffix, variantOverride?]
  const locationPlan: Array<[string, string, string?]> = [
    ['servicehero',     'locationhero', 'ServiceHeroConsistent'],   // Location hero (theme dark)
    ['aboutservice',    'about', 'AboutServiceConsistent'],         // About (location/service)
    ['services',        'services', 'ServicesPlumbing2'],           // Services grid
    ['sublocations',    'sublocations'],                            // Sub-locations
    ['why-choose-us',   'whychoose'],
    ['process',         'process'],
    ['cta',             'cta1', 'CTAPlumbing2'],                    // mid CTA
    ['guarantee',       'guarantee'],
    ['promise',         'promise'],
    ['testimonials',    'testimonials'],
    ['areas',           'areas'],                                   // Service areas
    ['locationmap',     'map'],                                     // Map
    ['cta',             'cta2', 'CTAPlumbing1'],                    // end CTA
    ['faq',             'faq'],
  ];

  const sections: Section[] = [];
  if (header) sections.push({ ...cloneDeep(header), id: 'demo-header-1' });
  locationPlan.forEach(([type, suffix, variant], i) => {
    sections.push(sectionFromTemplate(type, `demo-location-${suffix}-${i + 1}`, variant));
  });
  if (footer) sections.push({ ...cloneDeep(footer), id: 'demo-footer-1' });

  return {
    ...base,
    name: 'GenieBuild — Location (local demo)',
    sections,
    pages: undefined,
    currentPageId: undefined,
    globalSections: base.globalSections ? cloneDeep(base.globalSections) : undefined,
  };
}

export function buildLocalServiceDetailDemoWebsiteData(): WebsiteData {
  const base = cloneDeep(INITIAL_TEMPLATE);
  const header = base.sections.find((s) => s.type === 'header');
  const footer = base.sections.find((s) => s.type === 'footer');

  // Full Service Detail page (/services/:serviceName). Most sections reuse existing
  // homepage/service variants; `relatedservices` is new. CTA appears twice with two
  // different variants so the two blocks don't look identical.
  // Order matches the Service Detail spec:
  // Hero → About Service → Sub-services → Process → CTA → Why Choose → Guarantee
  // → Promise → Related Services → Testimonials → CTA → FAQ
  // [type, idSuffix, variantOverride?]
  const servicesPlan: Array<[string, string, string?]> = [
    ['servicehero',     'servicehero', 'ServiceHeroConsistent'],   // theme-consistent dark hero
    ['aboutservice',    'aboutservice', 'AboutServiceConsistent'], // theme-consistent light split
    ['services',        'subservices'],        // Sub-services grid/list
    ['process',         'process'],
    ['cta',             'cta1', 'CTAPlumbing2'], // mid-page CTA
    ['why-choose-us',   'whychoose'],
    ['guarantee',       'guarantee'],
    ['relatedservices', 'related'],
    ['testimonials',    'testimonials'],
    ['cta',             'cta2', 'CTAPlumbing1'], // end CTA
    ['faq',             'faq'],
  ];

  const sections: Section[] = [];
  if (header) sections.push({ ...cloneDeep(header), id: 'demo-header-1' });
  servicesPlan.forEach(([type, suffix, variant], i) => {
    sections.push(sectionFromTemplate(type, `demo-services-${suffix}-${i + 1}`, variant));
  });
  if (footer) sections.push({ ...cloneDeep(footer), id: 'demo-footer-1' });

  return {
    ...base,
    name: 'GenieBuild — Service Detail (local demo)',
    sections,
    pages: undefined,
    currentPageId: undefined,
    globalSections: base.globalSections ? cloneDeep(base.globalSections) : undefined,
  };
}

export function buildLocalServicesListDemoWebsiteData(): WebsiteData {
  const base = cloneDeep(INITIAL_TEMPLATE);
  const header = base.sections.find((s) => s.type === 'header');
  const footer = base.sections.find((s) => s.type === 'footer');

  // Services LISTING page (/services). All sections reuse existing variants.
  // `services` type has two variants — force ServicesPlumbing2 (the grid) here,
  // not RelatedServicesDefault.
  // [type, idSuffix, variantOverride?]
  const listingPlan: Array<[string, string, string?]> = [
    ['servicehero',   'servicehero', 'ServiceHeroConsistent'], // theme-consistent dark hero
    ['services',      'grid', 'ServicesPlumbing2'],            // services list/grid
    ['why-choose-us', 'whychoose'],
    ['cta',           'cta', 'CTAPlumbing1'],
    ['guarantee',     'guarantee'],
    ['process',       'process'],
    ['areas',         'areas'],
    ['faq',           'faq'],
  ];

  const sections: Section[] = [];
  if (header) sections.push({ ...cloneDeep(header), id: 'demo-header-1' });
  listingPlan.forEach(([type, suffix, variant], i) => {
    sections.push(sectionFromTemplate(type, `demo-serviceslist-${suffix}-${i + 1}`, variant));
  });
  if (footer) sections.push({ ...cloneDeep(footer), id: 'demo-footer-1' });

  return {
    ...base,
    name: 'GenieBuild — Services List (local demo)',
    sections,
    pages: undefined,
    currentPageId: undefined,
    globalSections: base.globalSections ? cloneDeep(base.globalSections) : undefined,
  };
}
