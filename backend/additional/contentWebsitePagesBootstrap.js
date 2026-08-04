/**
 * Bootstrap WebsitePage rows + WebsiteDesignsData for content websites (projectType 2).
 * Mirrors business/bulk design-step persistence so /dashboard/pages lists selected pages.
 * Sections get dummy GenieBuild structure (Funky variants); AI content is enqueued separately
 * via sectionGeneration.queue (same Redis/Bull path as bulk/business).
 *
 * Always injects HeaderFunky + FooterFunky on every page so SiteNextJS / GenieBuild chrome
 * is present (business sites use HeaderPlumbing via ensureHeaderFooterComponents).
 */

const WebsitePage = require('../models/WebsitePage');
const WebsiteDesignsData = require('../models/WebsiteDesignsData');

/** Map wizard section ids → GenieBuild type + Funky variant filename */
const CONTENT_SECTION_VARIANT_MAP = {
  hero: { type: 'hero', variant: 'HeroFunky' },
  featured_posts: { type: 'featuredposts', variant: 'FeaturedPostsFunky' },
  categories_grid: { type: 'categoriesgrid', variant: 'CategoriesGridFunky' },
  about_teaser: { type: 'aboutteaser', variant: 'AboutTeaserFunky' },
  authors: { type: 'authors', variant: 'AuthorsFunky' },
  newsletter: { type: 'newsletter', variant: 'NewsletterFunky' },
  faq: { type: 'faq', variant: 'FaqFunky' },
  trending_pins: { type: 'trendingpins', variant: 'TrendingPinsFunky' },
  pin_board_cta: { type: 'pinboardcta', variant: 'PinBoardCtaFunky' },
  seasonal_spotlight: { type: 'seasonalspotlight', variant: 'SeasonalSpotlightFunky' },
  blog_hero: { type: 'bloghero', variant: 'BlogHeroFunky' },
  post_grid: { type: 'postgrid', variant: 'PostGridFunky' },
  category_filter: { type: 'categoryfilter', variant: 'CategoryFilterFunky' },
  popular_posts: { type: 'popularposts', variant: 'PopularPostsFunky' },
  category_hero: { type: 'categoryhero', variant: 'CategoryHeroFunky' },
  related_categories: { type: 'relatedcategories', variant: 'RelatedCategoriesFunky' },
  article_hero: { type: 'articlehero', variant: 'ArticleHeroFunky' },
  article_body: { type: 'articlebody', variant: 'ArticleBodyFunky' },
  author_box: { type: 'authorbox', variant: 'AuthorBoxFunky' },
  related_posts: { type: 'relatedposts', variant: 'RelatedPostsFunky' },
  pin_cta: { type: 'pincta', variant: 'PinCtaFunky' },
  shop_the_look: { type: 'shopthelook', variant: 'ShopTheLookFunky' },
  about_hero: { type: 'abouthero', variant: 'AboutHeroFunky' },
  brand_story: { type: 'brandstory', variant: 'BrandStoryFunky' },
  brand_voice: { type: 'brandvoice', variant: 'BrandVoiceFunky' },
  about_cta: { type: 'aboutcta', variant: 'AboutCtaFunky' },
  contact_hero: { type: 'contacthero', variant: 'ContactHeroFunky' },
  contact_form: { type: 'contactform', variant: 'ContactFormFunky' },
  contact_info: { type: 'contactinfo', variant: 'ContactInfoFunky' },
  legal_body: { type: 'privacybody', variant: 'PrivacyBodyFunky' },
  author_hero: { type: 'authorhero', variant: 'AuthorHeroFunky' },
  author_bio: { type: 'authorbio', variant: 'AuthorBioFunky' },
  author_posts: { type: 'authorposts', variant: 'AuthorPostsFunky' },
  header: { type: 'header', variant: 'HeaderFunky' },
  footer: { type: 'footer', variant: 'FooterFunky' },
};

const DEFAULT_PAGE_SLUGS = {
  home: 'home',
  blog: 'blog',
  category: 'category',
  article: 'article',
  about: 'about',
  contact: 'contact',
  privacy: 'privacy',
  terms: 'terms',
  disclaimer: 'disclaimer',
  author: 'author',
};

/** Wizard page id → WebsitePage.pageType (drives section prompt folders) */
const CONTENT_PAGE_TYPE_BY_ID = {
  home: 'home',
  blog: 'blog',
  category: 'category',
  article: 'article',
  about: 'about',
  contact: 'contact',
  author: 'author',
  privacy: 'legal',
  terms: 'legal',
  disclaimer: 'legal',
};

/** Legal page id → section type folder + Funky variant file */
const LEGAL_BY_PAGE = {
  privacy: { type: 'privacybody', variant: 'PrivacyBodyFunky' },
  terms: { type: 'termsbody', variant: 'TermsBodyFunky' },
  disclaimer: { type: 'disclaimerbody', variant: 'DisclaimerBodyFunky' },
};

/**
 * Full fallback catalog — mirrors admin contentWebsiteConfig defaults
 * (not a thin stub). Used when create payload has no selectedPages.
 */
const FALLBACK_CONTENT_PAGES = [
  {
    id: 'home',
    name: 'Home',
    description: 'Main landing page for the niche site',
    sections: [
      { id: 'hero', name: 'Hero' },
      { id: 'featured_posts', name: 'Featured Posts' },
      { id: 'categories_grid', name: 'Categories Grid' },
      { id: 'trending_pins', name: 'Trending Pins' },
      { id: 'about_teaser', name: 'About Teaser' },
      { id: 'authors', name: 'Authors' },
      { id: 'seasonal_spotlight', name: 'Seasonal Spotlight' },
      { id: 'newsletter', name: 'Newsletter' },
      { id: 'faq', name: 'FAQ' },
    ],
  },
  {
    id: 'blog',
    name: 'Blog / Articles',
    description: 'Article listing & archive',
    sections: [
      { id: 'blog_hero', name: 'Blog Hero' },
      { id: 'category_filter', name: 'Category Filter' },
      { id: 'post_grid', name: 'Post Grid' },
      { id: 'popular_posts', name: 'Popular Posts' },
      { id: 'newsletter', name: 'Newsletter' },
      { id: 'faq', name: 'FAQ' },
    ],
  },
  {
    id: 'category',
    name: 'Category Template',
    description: 'Layout for each content category',
    templateOnly: true,
    sections: [
      { id: 'category_hero', name: 'Category Hero' },
      { id: 'post_grid', name: 'Post Grid' },
      { id: 'related_categories', name: 'Related Categories' },
      { id: 'faq', name: 'FAQ' },
    ],
  },
  {
    id: 'article',
    name: 'Article Template',
    description: 'Single article / pin landing layout',
    templateOnly: true,
    sections: [
      { id: 'article_hero', name: 'Article Hero' },
      { id: 'article_body', name: 'Article Body' },
      { id: 'shop_the_look', name: 'Shop the Look' },
      { id: 'author_box', name: 'Author Box' },
      { id: 'related_posts', name: 'Related Posts' },
      { id: 'pin_cta', name: 'Pin / Save CTA' },
      { id: 'faq', name: 'FAQ Schema' },
    ],
  },
  {
    id: 'about',
    name: 'About',
    description: 'Brand story + E-E-A-T',
    sections: [
      { id: 'about_hero', name: 'About Hero' },
      { id: 'brand_story', name: 'Brand Story' },
      { id: 'brand_voice', name: 'Brand Voice' },
      { id: 'authors', name: 'Team / Authors' },
      { id: 'about_cta', name: 'CTA' },
    ],
  },
  {
    id: 'contact',
    name: 'Contact',
    description: 'Contact form & details',
    sections: [
      { id: 'contact_hero', name: 'Contact Hero' },
      { id: 'contact_form', name: 'Contact Form' },
      { id: 'contact_info', name: 'Contact Info' },
      { id: 'faq', name: 'FAQ' },
    ],
  },
  {
    id: 'author',
    name: 'Author Profile',
    description: 'Per-author E-E-A-T page',
    templateOnly: true,
    sections: [
      { id: 'author_hero', name: 'Author Hero' },
      { id: 'author_bio', name: 'Author Bio' },
      { id: 'author_posts', name: 'Author Posts' },
    ],
  },
  {
    id: 'privacy',
    name: 'Privacy Policy',
    description: 'Legal privacy page',
    sections: [{ id: 'legal_body', name: 'Policy Body' }],
  },
  {
    id: 'terms',
    name: 'Terms of Use',
    description: 'Legal terms page',
    sections: [{ id: 'legal_body', name: 'Terms Body' }],
  },
  {
    id: 'disclaimer',
    name: 'Disclaimer',
    description: 'Affiliate / editorial disclaimer',
    sections: [{ id: 'legal_body', name: 'Disclaimer Body' }],
  },
];

const NAV_PAGE_ORDER = ['home', 'blog', 'category', 'about', 'contact', 'author'];
const FOOTER_LEGAL_ORDER = ['privacy', 'terms', 'disclaimer'];

function resolveSlug(pageId, urlStructure = {}) {
  const fromBp = urlStructure?.[pageId];
  if (typeof fromBp === 'string' && fromBp.trim()) {
    return fromBp.replace(/^\//, '').replace(/\{[^}]+\}/g, 'sample').replace(/\/+/g, '-') || pageId;
  }
  return DEFAULT_PAGE_SLUGS[pageId] || String(pageId).toLowerCase();
}

function hrefForPage(pageId, urlStructure = {}) {
  if (pageId === 'home') return '/';
  const slug = resolveSlug(pageId, urlStructure);
  return `/${String(slug).replace(/^\//, '')}`;
}

function buildNavLinks(selectedPages = [], urlStructure = {}) {
  const byId = new Map(
    (selectedPages || []).map((p) => [String(p.id || '').toLowerCase(), p])
  );
  const links = [];
  for (const id of NAV_PAGE_ORDER) {
    const page = byId.get(id);
    if (!page) continue;
    if (page.templateOnly && (id === 'category' || id === 'article' || id === 'author')) {
      // Still useful nav targets for templates in editor / sample routes
    }
    links.push({
      label: page.name || id,
      href: hrefForPage(id, urlStructure),
    });
  }
  if (!links.length) {
    return [
      { label: 'Home', href: '/' },
      { label: 'Blog', href: '/blog' },
      { label: 'About', href: '/about' },
      { label: 'Contact', href: '/contact' },
    ];
  }
  return links;
}

function buildLegalLinks(selectedPages = [], urlStructure = {}) {
  const byId = new Map(
    (selectedPages || []).map((p) => [String(p.id || '').toLowerCase(), p])
  );
  return FOOTER_LEGAL_ORDER.filter((id) => byId.has(id)).map((id) => ({
    label: byId.get(id).name || id,
    href: hrefForPage(id, urlStructure),
  }));
}

function dummyContentForSection(sectionId, blueprint = {}, pageId = '', chromeCtx = {}) {
  const brand = blueprint.websiteName || 'Content Site';
  const tagline = blueprint.tagline || 'Pin-worthy ideas for curious readers.';
  const hero = blueprint.pages?.homepage || {};
  const nav = Array.isArray(blueprint.navigation) && blueprint.navigation.length
    ? blueprint.navigation.map((item) =>
        typeof item === 'string'
          ? { label: item, href: `/${String(item).toLowerCase().replace(/\s+/g, '-')}` }
          : {
              label: item.label || item.name || 'Link',
              href: item.href || item.url || '/',
            }
      )
    : chromeCtx.navLinks || [];

  switch (sectionId) {
    case 'header':
      return {
        brand,
        siteName: brand,
        links: nav,
      };
    case 'footer':
      return {
        brand,
        blurb: tagline,
        links: nav,
        legalLinks: chromeCtx.legalLinks || [],
        copyright:
          blueprint.footer?.copyright ||
          `© ${new Date().getFullYear()} ${brand}. All rights reserved.`,
        disclaimerLine: blueprint.footer?.disclaimerLine || '',
      };
    case 'hero':
    case 'blog_hero':
    case 'category_hero':
    case 'article_hero':
    case 'about_hero':
    case 'contact_hero':
    case 'author_hero':
      return {
        badgeText: brand,
        title: hero.heroHeading || brand,
        subtitle: hero.heroSubheading || tagline,
      };
    case 'newsletter':
      return {
        title: `Join ${brand}`,
        subtitle: 'Weekly niche drops. Zero boring.',
        placeholder: 'you@email.com',
        ctaText: 'Subscribe',
      };
    case 'pin_cta':
    case 'pin_board_cta':
      return {
        title: 'Love this? Pin it.',
        subtitle: tagline,
        ctaText: 'Save to Pinterest',
      };
    case 'legal_body':
      return {
        title:
          pageId === 'terms'
            ? 'Terms of Use'
            : pageId === 'disclaimer'
              ? 'Disclaimer'
              : 'Privacy Policy',
        body: `This is placeholder legal copy for ${brand}. Replace after generation.`,
      };
    case 'brand_story':
    case 'brand_voice':
    case 'about_teaser':
      return {
        title: blueprint.brandVoice?.tone || 'Our story',
        body: blueprint.brandVoice?.sampleBio || tagline,
      };
    case 'authors':
    case 'author_box':
      return {
        title: 'Authors',
        items: Array.isArray(blueprint.authors)
          ? blueprint.authors.map((a) => ({
              title: a.name || 'Author',
              description: a.bio || a.role || '',
            }))
          : [{ title: 'Editor', description: 'E-E-A-T author bio placeholder.' }],
      };
    case 'featured_posts':
    case 'post_grid':
    case 'popular_posts':
    case 'related_posts':
    case 'author_posts':
      return {
        title: String(sectionId).replace(/_/g, ' '),
        subtitle: tagline,
        items: [
          { title: 'Starter guide for your niche', description: 'Dummy featured article.' },
          { title: 'Ideas readers save on Pinterest', description: 'Dummy pin-worthy post.' },
          { title: 'How-to that converts', description: 'Dummy how-to article.' },
        ],
      };
    case 'categories_grid':
    case 'related_categories':
    case 'category_filter':
      return {
        title: 'Browse categories',
        subtitle: tagline,
        items: [
          { title: 'Guides', description: 'Evergreen how-tos' },
          { title: 'Ideas', description: 'Inspiration boards' },
          { title: 'Seasonal', description: 'Trend calendar' },
        ],
      };
    default:
      return {
        title: String(sectionId).replace(/_/g, ' '),
        subtitle: tagline,
        description: `Starter ${sectionId.replace(/_/g, ' ')} content for ${brand}.`,
      };
  }
}

function buildDummySection(sectionId, sectionName, index, blueprint, pageId, chromeCtx = {}) {
  const key = String(sectionId || '').toLowerCase();
  let mapping = CONTENT_SECTION_VARIANT_MAP[key] || {
    type: key.replace(/_/g, ''),
    variant: 'HeroFunky',
  };

  if (key === 'legal_body' && LEGAL_BY_PAGE[pageId]) {
    mapping = LEGAL_BY_PAGE[pageId];
  }

  const colors = blueprint.colors || {};
  const content = dummyContentForSection(key, blueprint, pageId, chromeCtx);
  const isChrome = key === 'header' || key === 'footer';

  const sectionData = {
    id: `sec-${key}-${index}`,
    type: mapping.type,
    content,
    styles: {
      variant: mapping.variant,
      backgroundColor: isChrome
        ? key === 'footer'
          ? colors.text || '#1A1025'
          : colors.background || '#FFF8F0'
        : colors.background || '#FFF8F0',
      textColor: colors.text || '#1A1025',
      titleColor: colors.text || '#1A1025',
      themeMode: 'light',
      buttonBackgroundColor: colors.primary || '#FF4D6D',
      buttonTextColor: '#FFFFFF',
      subtitleColor: '#6B6178',
      paddingTop: isChrome ? 'pt-0' : 'pt-12 sm:pt-16',
      paddingBottom: isChrome ? 'pb-0' : 'pb-12 sm:pb-16',
      paddingX: 'px-4 sm:px-6',
    },
  };

  return {
    variant_uniqueId: mapping.variant,
    componentId: null,
    sectionData,
    order: index,
    sectionId: key,
  };
}

function isChromeSection(sec) {
  const t = String(sec?.sectionData?.type || sec?.type || '').toLowerCase();
  const v = String(sec?.variant_uniqueId || sec?.sectionData?.styles?.variant || '').toLowerCase();
  return (
    t === 'header' ||
    t === 'navbar' ||
    t === 'footer' ||
    v.includes('header') ||
    v.includes('footer')
  );
}

/**
 * Prepend HeaderFunky + append FooterFunky around body sections.
 * Replaces any existing Plumbing/Funky chrome so content sites stay on Funky.
 */
function ensureContentHeaderFooter(bodySections = [], blueprint = {}, chromeCtx = {}) {
  const middle = (Array.isArray(bodySections) ? bodySections : []).filter(
    (s) => !isChromeSection(s)
  );
  const header = buildDummySection('header', 'Header', 0, blueprint, 'global', chromeCtx);
  const footer = buildDummySection(
    'footer',
    'Footer',
    middle.length + 1,
    blueprint,
    'global',
    chromeCtx
  );
  return [header, ...middle.map((s, i) => ({ ...s, order: i + 1 })), { ...footer, order: middle.length + 1 }];
}

function toDesignSectionRows(sections) {
  return (sections || []).map((s, order) => ({
    sectionId: s.sectionId,
    order,
    variant_uniqueId: s.variant_uniqueId,
    componentId: null,
    sectionData: s.sectionData,
    uniqueId: String(s.variant_uniqueId || '').toLowerCase(),
    elementIds: [],
  }));
}

/**
 * Normalize selected pages from blueprint / request body.
 */
function normalizeSelectedPages(blueprint = {}, bodySelectedPages) {
  const raw =
    (Array.isArray(bodySelectedPages) && bodySelectedPages.length
      ? bodySelectedPages
      : null) ||
    (Array.isArray(blueprint.selectedPages) && blueprint.selectedPages.length
      ? blueprint.selectedPages
      : null);

  if (raw) {
    return raw
      .map((p) => ({
        id: String(p.id || p.name || '')
          .trim()
          .toLowerCase()
          .replace(/\s+/g, '_'),
        name: String(p.name || p.id || 'Page').trim(),
        description: String(p.description || '').trim(),
        templateOnly: Boolean(p.templateOnly),
        sections: Array.isArray(p.sections)
          ? p.sections
              .map((s) => ({
                id: String(s.id || s.name || '')
                  .trim()
                  .toLowerCase()
                  .replace(/\s+/g, '_'),
                name: String(s.name || s.id || 'Section').trim(),
              }))
              .filter((s) => s.id && s.id !== 'header' && s.id !== 'footer')
          : [],
      }))
      .filter((p) => p.id);
  }

  return FALLBACK_CONTENT_PAGES.map((p) => ({ ...p, sections: [...p.sections] }));
}

/**
 * Create WebsitePage docs + WebsiteDesignsData for a new content website project.
 * @returns {{ pagesCreated: number, designSaved: boolean, pageIds: Record<string,string> }}
 */
async function bootstrapContentWebsitePages({
  projectId,
  userId,
  blueprint = {},
  selectedPages: bodySelectedPages,
}) {
  const selectedPages = normalizeSelectedPages(blueprint, bodySelectedPages);
  if (!selectedPages.length) {
    return { pagesCreated: 0, designSaved: false, pageIds: {} };
  }

  const urlStructure = blueprint.urlStructure || {};
  const chromeCtx = {
    navLinks: buildNavLinks(selectedPages, urlStructure),
    legalLinks: buildLegalLinks(selectedPages, urlStructure),
  };

  const pageIds = {};
  const created = [];

  for (const page of selectedPages) {
    const name = page.id;
    const slug = resolveSlug(page.id, urlStructure);
    const pageType = CONTENT_PAGE_TYPE_BY_ID[String(page.id || '').toLowerCase()] || 'default';
    let doc = await WebsitePage.findOne({ projectId, name });
    if (!doc) {
      doc = await WebsitePage.create({
        projectId,
        name,
        slug,
        displayName: page.name || name,
        description: page.description || `${page.name} page`,
        pageType,
        isPublished: true,
        componentIds: [],
      });
      created.push(doc);
    } else {
      doc.displayName = page.name || doc.displayName;
      doc.slug = slug || doc.slug;
      doc.pageType = pageType || doc.pageType;
      doc.isPublished = true;
      await doc.save();
    }
    pageIds[page.id] = String(doc._id);
  }

  const designPages = selectedPages
    .map((page) => {
      const pageId = pageIds[page.id];
      if (!pageId) return null;
      const body = (page.sections || []).map((s, idx) =>
        buildDummySection(s.id, s.name, idx + 1, blueprint, page.id, chromeCtx)
      );
      const sections = ensureContentHeaderFooter(body, blueprint, chromeCtx);
      return {
        pageId,
        pageStyles: { renderer: 'geniebuild' },
        sections: toDesignSectionRows(sections),
        sectionLayout: sections.map((s, order) => ({
          order,
          sectionId: s.sectionId,
        })),
      };
    })
    .filter(Boolean);

  const colors = blueprint.colors || {};
  let design = await WebsiteDesignsData.findOne({ projectId });
  if (!design) {
    design = await WebsiteDesignsData.create({
      projectId,
      userId,
      schemaVersion: 2,
      colorScheme: colors.schemeName || 'content-funky',
      colorPrimary: colors.primary || '#FF4D6D',
      colorSecondary: colors.secondary || '#00E5C0',
      colorAccent: colors.accent || '#C8F542',
      pageStyles: { style: { renderer: 'geniebuild' } },
      pages: designPages,
    });
  } else {
    design.colorPrimary = colors.primary || design.colorPrimary;
    design.colorSecondary = colors.secondary || design.colorSecondary;
    design.colorAccent = colors.accent || design.colorAccent;
    design.pages = designPages;
    await design.save();
  }

  console.log('[contentWebsitePagesBootstrap] Done:', {
    projectId: String(projectId),
    pagesCreated: created.length,
    pagesTotal: selectedPages.length,
    designPages: designPages.length,
    chrome: 'HeaderFunky+FooterFunky',
  });

  return {
    pagesCreated: created.length,
    pagesTotal: selectedPages.length,
    designSaved: true,
    pageIds,
    chrome: { header: 'HeaderFunky', footer: 'FooterFunky' },
  };
}

/**
 * Repair chrome on an existing content-site design without wiping body sections.
 * Useful when older projects were bootstrapped without Header/Footer Funky.
 */
async function ensureContentChromeOnProject(projectId, blueprint = {}) {
  const design = await WebsiteDesignsData.findOne({ projectId });
  if (!design || !Array.isArray(design.pages) || !design.pages.length) {
    return { updated: false, reason: 'no_design' };
  }

  const pageDocs = await WebsitePage.find({ projectId }).lean();
  const selectedPages = pageDocs.map((p) => ({
    id: String(p.name || '').toLowerCase(),
    name: p.displayName || p.name,
    templateOnly: false,
  }));
  const urlStructure = blueprint.urlStructure || {};
  const chromeCtx = {
    navLinks: buildNavLinks(selectedPages, urlStructure),
    legalLinks: buildLegalLinks(selectedPages, urlStructure),
  };

  let changed = 0;
  design.pages = design.pages.map((page) => {
    const raw = Array.isArray(page.sections) ? page.sections : [];
    const hasFunkyHeader = raw.some((s) => {
      const t = String(s?.sectionData?.type || '').toLowerCase();
      const v = String(s?.variant_uniqueId || s?.sectionData?.styles?.variant || '');
      return (t === 'header' || t === 'navbar') && /Funky/i.test(v);
    });
    const hasFunkyFooter = raw.some((s) => {
      const t = String(s?.sectionData?.type || '').toLowerCase();
      const v = String(s?.variant_uniqueId || s?.sectionData?.styles?.variant || '');
      return t === 'footer' && /Funky/i.test(v);
    });
    if (hasFunkyHeader && hasFunkyFooter) return page;

    const body = raw
      .filter((s) => !isChromeSection(s))
      .map((s, idx) => ({
        variant_uniqueId: s.variant_uniqueId,
        componentId: s.componentId || null,
        sectionData: s.sectionData,
        order: idx + 1,
        sectionId:
          s.sectionId ||
          String(s?.sectionData?.type || s?.variant_uniqueId || `section_${idx}`).toLowerCase(),
      }));
    const sections = ensureContentHeaderFooter(body, blueprint, chromeCtx);
    changed += 1;
    return {
      ...page,
      sections: toDesignSectionRows(sections),
      sectionLayout: sections.map((s, order) => ({ order, sectionId: s.sectionId })),
    };
  });

  if (changed) await design.save();
  return { updated: changed > 0, pagesPatched: changed };
}

module.exports = {
  bootstrapContentWebsitePages,
  normalizeSelectedPages,
  ensureContentHeaderFooter,
  ensureContentChromeOnProject,
  CONTENT_SECTION_VARIANT_MAP,
  FALLBACK_CONTENT_PAGES,
};
