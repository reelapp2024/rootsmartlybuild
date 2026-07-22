import type { Section, WebsiteData } from './types';
import { INITIAL_TEMPLATE, SECTION_TEMPLATES } from './constants';
import {
  DEMO_BLOG_CATEGORIES,
  extractDemoBlogSlugFromPath,
  getDemoBlogBySlug,
  getDemoBlogListItems,
  getRelatedDemoBlogs,
} from './demoBlogs';

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
  return (
    lower === '/contact' ||
    lower.endsWith('/contact') ||
    lower === '/contactus' ||
    lower.endsWith('/contactus') ||
    lower === '/contact-us' ||
    lower.endsWith('/contact-us')
  );
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

/** All Areas listing page (`/areas`) — only allareas sections. */
export function isLocalAreasListDemoPath(pathname: string): boolean {
  const normalized = (pathname || '').replace(/\\/g, '/').replace(/\/+$/, '') || '/';
  const lower = normalized.toLowerCase();
  return lower === '/areas' || lower.endsWith('/areas');
}

/** When GenieBuild runs without `projectId`, `/location/:name` (or `/locations/:name`)
 *  shows Area Detail = same as Home (homepage sections). Requires a location name
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

/** Demo-site header links so every page can navigate the full demo sitemap. */
const DEMO_SITE_NAV_ITEMS = [
  { label: 'Home', link: '/', linkNewTab: false },
  { label: 'About', link: '/about', linkNewTab: false },
  {
    label: 'Services',
    link: '/services',
    selectSource: 'services',
    viewAllLabel: 'View All Services',
    viewAllLink: '/services',
    linkNewTab: false,
  },
  {
    label: 'Areas',
    link: '/areas',
    selectSource: 'locations',
    viewAllLabel: 'View All Areas',
    viewAllLink: '/areas',
    linkNewTab: false,
  },
  { label: 'Blog', link: '/blogs', linkNewTab: false },
  { label: 'Contact', link: '/contact', linkNewTab: false },
];

/**
 * Ensure demo pages have navigable header/footer chrome and real route links.
 */
export function applyFullSiteDemoChrome(data: WebsiteData): WebsiteData {
  const next = cloneDeep(data);
  next.sections = (next.sections || []).map((section) => {
    if (section.type === 'header') {
      return {
        ...section,
        content: {
          ...(section.content as any),
          menuItems: DEMO_SITE_NAV_ITEMS,
          navItems: DEMO_SITE_NAV_ITEMS,
          ctaText: (section.content as any)?.ctaText || 'Book Now',
          ctaLink: '/contact',
          phoneText: (section.content as any)?.phoneText || '(555) 123-4567',
          phoneLink: (section.content as any)?.phoneLink || 'tel:5551234567',
          sticky: true,
        },
      };
    }
    if (section.type === 'footer') {
      return {
        ...section,
        content: {
          ...(section.content as any),
          ctaButtonLink: '/contact',
          phoneText: (section.content as any)?.phoneText || '(555) 123-4567',
          phoneLink: (section.content as any)?.phoneLink || 'tel:5551234567',
          emailText: (section.content as any)?.emailText || 'hello@proflow.com',
          emailLink: (section.content as any)?.emailLink || 'mailto:hello@proflow.com',
        },
      };
    }
    return section;
  });
  return next;
}

/**
 * Resolve full dummy WebsiteData for a path (home / about / services / etc.).
 * Used by GenieBuild standalone preview and SiteNextJS DEMOMODE.
 */
export function resolveDemoWebsiteDataByPath(pathname: string): WebsiteData {
  const p = pathname || '/';
  let data: WebsiteData = INITIAL_TEMPLATE;
  if (isLocalAboutDemoPath(p)) data = buildLocalAboutDemoWebsiteData();
  else if (isLocalContactDemoPath(p)) data = buildLocalContactDemoWebsiteData();
  else {
    const legalTitle = getLocalLegalDemoTitle(p);
    if (legalTitle) data = buildLocalLegalDemoWebsiteData(legalTitle);
    else if (isLocalAreasListDemoPath(p)) data = buildLocalAllAreasDemoWebsiteData();
    else if (isLocalLocationDemoPath(p)) data = buildLocalLocationDemoWebsiteData();
    else if (isLocalBlogDetailDemoPath(p)) data = buildLocalBlogDetailDemoWebsiteData(p);
    else if (isLocalBlogsDemoPath(p)) data = buildLocalBlogsDemoWebsiteData();
    else if (isLocalServiceDetailDemoPath(p)) data = buildLocalServiceDetailDemoWebsiteData();
    else if (isLocalServicesListDemoPath(p)) data = buildLocalServicesListDemoWebsiteData();
    else if (isLocalServiceDemoPath(p)) data = buildLocalServiceDemoWebsiteData();
    else data = cloneDeep(INITIAL_TEMPLATE);
  }
  return applyFullSiteDemoChrome(data);
}

/** SiteNextJS DEMOMODE entry — full site demo with dummy content per route. */
export function buildSiteNextDemoWebsiteData(pathname: string): WebsiteData {
  return resolveDemoWebsiteDataByPath(pathname);
}

/** Initial canvas when opening GenieBuild without `projectId` (dummy / local preview). */
export function getStandaloneInitialWebsiteData(): WebsiteData {
  if (typeof window === 'undefined') return applyFullSiteDemoChrome(cloneDeep(INITIAL_TEMPLATE));
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get('projectId')) return INITIAL_TEMPLATE;
    return resolveDemoWebsiteDataByPath(window.location.pathname);
  } catch {
    /* ignore */
  }
  return applyFullSiteDemoChrome(cloneDeep(INITIAL_TEMPLATE));
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

  // About page: header + 7 About sections + footer. All sections are the About
  // page's OWN components so its content/variants are independent.
  const aboutTypes = [
    'abouthero',
    'missionvision',
    'corevalues',
    'usp',
    'aboutwhychoose',
    'aboutcta',
    'aboutfaq',
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

  // Contact page: hero + info methods + form + cta + faq. All own components.
  const contactTypes = [
    'contacthero',
    'contactinfo',
    'contactform',
    'contactcta',
    'contactfaq',
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

  // Blogs listing page: hero + search/filter + post grid (seeded with 5 dummy posts).
  const sections: Section[] = [];
  if (header) sections.push({ ...cloneDeep(header), id: 'demo-header-1' });

  sections.push(sectionFromTemplate('blogshero', 'demo-blogs-blogshero-1'));

  const search = sectionFromTemplate('blogssearch', 'demo-blogs-blogssearch-2');
  (search.content as any) = {
    ...(search.content as any),
    categories: [...DEMO_BLOG_CATEGORIES],
  };
  sections.push(search);

  const list = sectionFromTemplate('blogslist', 'demo-blogs-blogslist-3');
  (list.content as any) = {
    ...(list.content as any),
    items: getDemoBlogListItems(),
  };
  sections.push(list);

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

export function buildLocalBlogDetailDemoWebsiteData(pathname?: string): WebsiteData {
  const base = cloneDeep(INITIAL_TEMPLATE);
  const header = base.sections.find((s) => s.type === 'header');
  const footer = base.sections.find((s) => s.type === 'footer');

  const slug = extractDemoBlogSlugFromPath(pathname || '');
  const post = getDemoBlogBySlug(slug);

  // Blog Detail page: article header (+ breadcrumb + cover) → content → author
  // → related articles → comments — all filled from the matching demo post.
  const hero = sectionFromTemplate('blogarticlehero', 'demo-blogdetail-blogarticlehero-1');
  (hero.content as any) = {
    ...(hero.content as any),
    category: post.category,
    badgeText: post.category,
    title: post.title,
    authorName: post.author.name,
    author: post.author.name,
    date: post.date,
    readTime: post.readTime,
    read: post.readTime,
    coverImage: { url: post.coverImage, alt: post.title },
    imageUrl: post.coverImage,
  };

  const body = sectionFromTemplate('blogcontent', 'demo-blogdetail-blogcontent-2');
  (body.content as any) = {
    ...(body.content as any),
    content: post.body,
    body: post.body,
  };

  const author = sectionFromTemplate('blogauthor', 'demo-blogdetail-blogauthor-3');
  (author.content as any) = {
    ...(author.content as any),
    name: post.author.name,
    authorName: post.author.name,
    jobTitle: post.author.jobTitle,
    role: post.author.jobTitle,
    bio: post.author.bio,
    image: post.author.image,
    avatar: post.author.image,
    links: post.author.links,
  };

  const related = sectionFromTemplate('blogrelated', 'demo-blogdetail-blogrelated-4');
  (related.content as any) = {
    ...(related.content as any),
    badgeText: 'Keep Reading',
    relatedTitle: 'Related Articles',
    items: getRelatedDemoBlogs(post.slug, 3),
  };

  const comments = sectionFromTemplate('blogcomments', 'demo-blogdetail-blogcomments-5');
  (comments.content as any) = {
    ...(comments.content as any),
    commentSectionTitle: 'Join the Conversation',
    commentSectionSubtitle: "Share your thoughts — we'd love to hear from you.",
    ctaText: 'Post Comment',
    comments: post.comments,
  };

  const sections: Section[] = [];
  if (header) sections.push({ ...cloneDeep(header), id: 'demo-header-1' });
  sections.push(hero, body, author, related, comments);
  if (footer) sections.push({ ...cloneDeep(footer), id: 'demo-footer-1' });

  return {
    ...base,
    name: `GenieBuild — ${post.title} (local demo)`,
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
  // Full Legal page — GenieBuild legalhero + legalcontent.
  // Backend maps privacy/terms/disclaimer page context into the right document body.
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

/** All Areas directory (`/areas`) — dedicated allareas sections. */
export function buildLocalAllAreasDemoWebsiteData(): WebsiteData {
  const base = cloneDeep(INITIAL_TEMPLATE);
  const header = base.sections.find((s) => s.type === 'header');
  const footer = base.sections.find((s) => s.type === 'footer');

  const sections: Section[] = [];
  if (header) sections.push({ ...cloneDeep(header), id: 'demo-header-1' });
  sections.push(sectionFromTemplate('areashero', 'demo-allareas-hero-1'));
  sections.push(sectionFromTemplate('sublocations', 'demo-allareas-list-1'));
  sections.push(sectionFromTemplate('locationmap', 'demo-allareas-map-1'));
  sections.push(sectionFromTemplate('areastestimonials', 'demo-allareas-reviews-1'));
  sections.push(sectionFromTemplate('areasfaq', 'demo-allareas-faq-1'));
  if (footer) sections.push({ ...cloneDeep(footer), id: 'demo-footer-1' });

  return {
    ...base,
    name: 'GenieBuild — All Areas (listing)',
    sections,
    pages: undefined,
    currentPageId: undefined,
    globalSections: base.globalSections ? cloneDeep(base.globalSections) : undefined,
  };
}

/** Area detail (`/location/:name`) — same as Home (homepage sections). */
export function buildLocalLocationDemoWebsiteData(): WebsiteData {
  const base = applyFullSiteDemoChrome(cloneDeep(INITIAL_TEMPLATE));
  return {
    ...base,
    name: 'GenieBuild — Area Detail (same as Home)',
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
    ['servicedetailhero',         'hero'],
    ['servicedetailabout',        'about'],
    ['servicedetailservices',     'subservices'],
    ['servicedetailprocess',      'process'],
    ['servicedetailcta',          'cta1'],
    ['servicedetailwhychoose',    'whychoose'],
    ['servicedetailguarantee',    'guarantee'],
    ['relatedservices',           'related'],
    ['servicedetailtestimonials', 'testimonials'],
    ['servicedetailcta',          'cta2'],
    ['servicedetailfaq',          'faq'],
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

  // Services LISTING page (/services) — all its OWN components.
  const listingPlan: Array<[string, string, string?]> = [
    ['serviceslisthero',      'hero'],
    ['serviceslistgrid',      'grid'],
    ['serviceslistwhychoose', 'whychoose'],
    ['serviceslistcta',       'cta'],
    ['serviceslistguarantee', 'guarantee'],
    ['serviceslistprocess',   'process'],
    ['serviceslistareas',     'areas'],
    ['serviceslistfaq',       'faq'],
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
