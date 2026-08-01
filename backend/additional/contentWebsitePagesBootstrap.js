/**
 * Bootstrap WebsitePage rows + WebsiteDesignsData for content websites (projectType 2).
 * Mirrors business/bulk design-step persistence so /dashboard/pages lists selected pages.
 * Content generation is skipped — sections get dummy GenieBuild structure (Funky variants).
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

/** Legal page id → section type folder + Funky variant file */
const LEGAL_BY_PAGE = {
  privacy: { type: 'privacybody', variant: 'PrivacyBodyFunky' },
  terms: { type: 'termsbody', variant: 'TermsBodyFunky' },
  disclaimer: { type: 'disclaimerbody', variant: 'DisclaimerBodyFunky' },
};

function resolveSlug(pageId, urlStructure = {}) {
  const fromBp = urlStructure?.[pageId];
  if (typeof fromBp === 'string' && fromBp.trim()) {
    return fromBp.replace(/^\//, '').replace(/\{[^}]+\}/g, 'sample').replace(/\/+/g, '-') || pageId;
  }
  return DEFAULT_PAGE_SLUGS[pageId] || String(pageId).toLowerCase();
}

function dummyContentForSection(sectionId, blueprint = {}, pageId = '') {
  const brand = blueprint.websiteName || 'Content Site';
  const tagline = blueprint.tagline || 'Pin-worthy ideas for curious readers.';
  const hero = blueprint.pages?.homepage || {};

  switch (sectionId) {
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
    default:
      return {
        title: String(sectionId).replace(/_/g, ' '),
        subtitle: tagline,
        description: `Dummy ${sectionId} content for ${brand}.`,
      };
  }
}

function buildDummySection(sectionId, sectionName, index, blueprint, pageId) {
  const key = String(sectionId || '').toLowerCase();
  let mapping = CONTENT_SECTION_VARIANT_MAP[key] || {
    type: key.replace(/_/g, ''),
    variant: 'HeroFunky',
  };

  if (key === 'legal_body' && LEGAL_BY_PAGE[pageId]) {
    mapping = LEGAL_BY_PAGE[pageId];
  }

  const colors = blueprint.colors || {};
  const content = dummyContentForSection(key, blueprint, pageId);

  const sectionData = {
    id: `sec-${key}-${index}`,
    type: mapping.type,
    content,
    styles: {
      variant: mapping.variant,
      backgroundColor: colors.background || '#FFF8F0',
      textColor: colors.text || '#1A1025',
      titleColor: colors.text || '#1A1025',
      themeMode: 'light',
      buttonBackgroundColor: colors.primary || '#FF4D6D',
      buttonTextColor: '#FFFFFF',
      subtitleColor: '#6B6178',
      paddingTop: 'pt-12 sm:pt-16',
      paddingBottom: 'pb-12 sm:pb-16',
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
              .filter((s) => s.id)
          : [],
      }))
      .filter((p) => p.id);
  }

  // Fallback defaults if blueprint has no selectedPages
  return [
    {
      id: 'home',
      name: 'Home',
      description: 'Main landing',
      sections: [
        { id: 'hero', name: 'Hero' },
        { id: 'featured_posts', name: 'Featured Posts' },
        { id: 'newsletter', name: 'Newsletter' },
      ],
    },
    { id: 'blog', name: 'Blog', description: 'Articles', sections: [{ id: 'blog_hero', name: 'Blog Hero' }, { id: 'post_grid', name: 'Post Grid' }] },
    { id: 'about', name: 'About', description: 'About', sections: [{ id: 'about_hero', name: 'About Hero' }, { id: 'brand_story', name: 'Brand Story' }] },
    { id: 'contact', name: 'Contact', description: 'Contact', sections: [{ id: 'contact_hero', name: 'Contact Hero' }, { id: 'contact_form', name: 'Contact Form' }] },
    { id: 'privacy', name: 'Privacy Policy', description: 'Legal', sections: [{ id: 'legal_body', name: 'Policy Body' }] },
    { id: 'terms', name: 'Terms of Use', description: 'Legal', sections: [{ id: 'legal_body', name: 'Terms Body' }] },
    { id: 'disclaimer', name: 'Disclaimer', description: 'Legal', sections: [{ id: 'legal_body', name: 'Disclaimer Body' }] },
  ];
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
  const pageIds = {};
  const created = [];

  for (const page of selectedPages) {
    const name = page.id;
    const slug = resolveSlug(page.id, urlStructure);
    let doc = await WebsitePage.findOne({ projectId, name });
    if (!doc) {
      doc = await WebsitePage.create({
        projectId,
        name,
        slug,
        displayName: page.name || name,
        description: page.description || `${page.name} page`,
        pageType: 'default',
        isPublished: true,
        componentIds: [],
      });
      created.push(doc);
    } else {
      doc.displayName = page.name || doc.displayName;
      doc.slug = slug || doc.slug;
      doc.isPublished = true;
      await doc.save();
    }
    pageIds[page.id] = String(doc._id);
  }

  const designPages = selectedPages
    .map((page) => {
      const pageId = pageIds[page.id];
      if (!pageId) return null;
      const sections = (page.sections || []).map((s, idx) =>
        buildDummySection(s.id, s.name, idx, blueprint, page.id)
      );
      return {
        pageId,
        pageStyles: { renderer: 'geniebuild' },
        sections: sections.map((s, order) => ({
          sectionId: s.sectionId,
          order,
          variant_uniqueId: s.variant_uniqueId,
          componentId: null,
          sectionData: s.sectionData,
          uniqueId: String(s.variant_uniqueId || '').toLowerCase(),
          elementIds: [],
        })),
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
  });

  return {
    pagesCreated: created.length,
    pagesTotal: selectedPages.length,
    designSaved: true,
    pageIds,
  };
}

module.exports = {
  bootstrapContentWebsitePages,
  normalizeSelectedPages,
  CONTENT_SECTION_VARIANT_MAP,
};
