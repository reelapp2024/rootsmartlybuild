/**
 * Explicit loaders for content-website Funky variants.
 * Needed for Next.js (no import.meta.glob) and as Vite fallback.
 * Paths are relative to components/sections/sectionDiscovery.ts.
 */
import type { ComponentType } from 'react';

type GlobModuleMap = Record<string, () => Promise<{ default: ComponentType<unknown> }>>;

export const CONTENT_WEBSITE_MODULE_PREFIX = '../contentwebsitesSections';

/** Keys match Vite-style paths from sections/ → contentwebsitesSections/ */
export const CONTENT_WEBSITE_FALLBACK_MODULES: GlobModuleMap = {
  '../contentwebsitesSections/homepage/hero/HeroFunky.tsx': () =>
    import('../contentwebsitesSections/homepage/hero/HeroFunky'),
  '../contentwebsitesSections/homepage/featuredposts/FeaturedPostsFunky.tsx': () =>
    import('../contentwebsitesSections/homepage/featuredposts/FeaturedPostsFunky'),
  '../contentwebsitesSections/homepage/categoriesgrid/CategoriesGridFunky.tsx': () =>
    import('../contentwebsitesSections/homepage/categoriesgrid/CategoriesGridFunky'),
  '../contentwebsitesSections/homepage/aboutteaser/AboutTeaserFunky.tsx': () =>
    import('../contentwebsitesSections/homepage/aboutteaser/AboutTeaserFunky'),
  '../contentwebsitesSections/homepage/authors/AuthorsFunky.tsx': () =>
    import('../contentwebsitesSections/homepage/authors/AuthorsFunky'),
  '../contentwebsitesSections/homepage/newsletter/NewsletterFunky.tsx': () =>
    import('../contentwebsitesSections/homepage/newsletter/NewsletterFunky'),
  '../contentwebsitesSections/homepage/faq/FaqFunky.tsx': () =>
    import('../contentwebsitesSections/homepage/faq/FaqFunky'),
  '../contentwebsitesSections/homepage/trendingpins/TrendingPinsFunky.tsx': () =>
    import('../contentwebsitesSections/homepage/trendingpins/TrendingPinsFunky'),
  '../contentwebsitesSections/homepage/pinboardcta/PinBoardCtaFunky.tsx': () =>
    import('../contentwebsitesSections/homepage/pinboardcta/PinBoardCtaFunky'),
  '../contentwebsitesSections/homepage/seasonalspotlight/SeasonalSpotlightFunky.tsx': () =>
    import('../contentwebsitesSections/homepage/seasonalspotlight/SeasonalSpotlightFunky'),

  '../contentwebsitesSections/blog/bloghero/BlogHeroFunky.tsx': () =>
    import('../contentwebsitesSections/blog/bloghero/BlogHeroFunky'),
  '../contentwebsitesSections/blog/postgrid/PostGridFunky.tsx': () =>
    import('../contentwebsitesSections/blog/postgrid/PostGridFunky'),
  '../contentwebsitesSections/blog/categoryfilter/CategoryFilterFunky.tsx': () =>
    import('../contentwebsitesSections/blog/categoryfilter/CategoryFilterFunky'),
  '../contentwebsitesSections/blog/newsletter/NewsletterFunky.tsx': () =>
    import('../contentwebsitesSections/blog/newsletter/NewsletterFunky'),
  '../contentwebsitesSections/blog/popularposts/PopularPostsFunky.tsx': () =>
    import('../contentwebsitesSections/blog/popularposts/PopularPostsFunky'),

  '../contentwebsitesSections/category/categoryhero/CategoryHeroFunky.tsx': () =>
    import('../contentwebsitesSections/category/categoryhero/CategoryHeroFunky'),
  '../contentwebsitesSections/category/postgrid/PostGridFunky.tsx': () =>
    import('../contentwebsitesSections/category/postgrid/PostGridFunky'),
  '../contentwebsitesSections/category/relatedcategories/RelatedCategoriesFunky.tsx': () =>
    import('../contentwebsitesSections/category/relatedcategories/RelatedCategoriesFunky'),

  '../contentwebsitesSections/article/articlehero/ArticleHeroFunky.tsx': () =>
    import('../contentwebsitesSections/article/articlehero/ArticleHeroFunky'),
  '../contentwebsitesSections/article/articlebody/ArticleBodyFunky.tsx': () =>
    import('../contentwebsitesSections/article/articlebody/ArticleBodyFunky'),
  '../contentwebsitesSections/article/authorbox/AuthorBoxFunky.tsx': () =>
    import('../contentwebsitesSections/article/authorbox/AuthorBoxFunky'),
  '../contentwebsitesSections/article/relatedposts/RelatedPostsFunky.tsx': () =>
    import('../contentwebsitesSections/article/relatedposts/RelatedPostsFunky'),
  '../contentwebsitesSections/article/pincta/PinCtaFunky.tsx': () =>
    import('../contentwebsitesSections/article/pincta/PinCtaFunky'),
  '../contentwebsitesSections/article/faq/FaqFunky.tsx': () =>
    import('../contentwebsitesSections/article/faq/FaqFunky'),
  '../contentwebsitesSections/article/shopthelook/ShopTheLookFunky.tsx': () =>
    import('../contentwebsitesSections/article/shopthelook/ShopTheLookFunky'),

  '../contentwebsitesSections/about/abouthero/AboutHeroFunky.tsx': () =>
    import('../contentwebsitesSections/about/abouthero/AboutHeroFunky'),
  '../contentwebsitesSections/about/brandstory/BrandStoryFunky.tsx': () =>
    import('../contentwebsitesSections/about/brandstory/BrandStoryFunky'),
  '../contentwebsitesSections/about/authors/AuthorsFunky.tsx': () =>
    import('../contentwebsitesSections/about/authors/AuthorsFunky'),
  '../contentwebsitesSections/about/aboutcta/AboutCtaFunky.tsx': () =>
    import('../contentwebsitesSections/about/aboutcta/AboutCtaFunky'),
  '../contentwebsitesSections/about/brandvoice/BrandVoiceFunky.tsx': () =>
    import('../contentwebsitesSections/about/brandvoice/BrandVoiceFunky'),

  '../contentwebsitesSections/contact/contacthero/ContactHeroFunky.tsx': () =>
    import('../contentwebsitesSections/contact/contacthero/ContactHeroFunky'),
  '../contentwebsitesSections/contact/contactform/ContactFormFunky.tsx': () =>
    import('../contentwebsitesSections/contact/contactform/ContactFormFunky'),
  '../contentwebsitesSections/contact/contactinfo/ContactInfoFunky.tsx': () =>
    import('../contentwebsitesSections/contact/contactinfo/ContactInfoFunky'),

  '../contentwebsitesSections/legal/privacybody/PrivacyBodyFunky.tsx': () =>
    import('../contentwebsitesSections/legal/privacybody/PrivacyBodyFunky'),
  '../contentwebsitesSections/legal/termsbody/TermsBodyFunky.tsx': () =>
    import('../contentwebsitesSections/legal/termsbody/TermsBodyFunky'),
  '../contentwebsitesSections/legal/disclaimerbody/DisclaimerBodyFunky.tsx': () =>
    import('../contentwebsitesSections/legal/disclaimerbody/DisclaimerBodyFunky'),

  '../contentwebsitesSections/author/authorhero/AuthorHeroFunky.tsx': () =>
    import('../contentwebsitesSections/author/authorhero/AuthorHeroFunky'),
  '../contentwebsitesSections/author/authorbio/AuthorBioFunky.tsx': () =>
    import('../contentwebsitesSections/author/authorbio/AuthorBioFunky'),
  '../contentwebsitesSections/author/authorposts/AuthorPostsFunky.tsx': () =>
    import('../contentwebsitesSections/author/authorposts/AuthorPostsFunky'),

  '../contentwebsitesSections/headerfooter/header/HeaderFunky.tsx': () =>
    import('../contentwebsitesSections/headerfooter/header/HeaderFunky'),
  '../contentwebsitesSections/headerfooter/footer/FooterFunky.tsx': () =>
    import('../contentwebsitesSections/headerfooter/footer/FooterFunky'),
};

export function isContentWebsiteModulePath(key: string): boolean {
  return key.includes('contentwebsitesSections/');
}

/** Parse ./scope/section/Variant.tsx OR ../contentwebsitesSections/scope/section/Variant.tsx */
export function parseScopedSectionPath(
  key: string
): { pageScope: string; sectionFolder: string; variantFile: string } | null {
  const content = key.match(
    /^\.\.\/contentwebsitesSections\/([^/]+)\/([^/]+)\/([^/]+)\.tsx$/i
  );
  if (content) {
    return { pageScope: content[1], sectionFolder: content[2], variantFile: content[3] };
  }
  const local = key.match(/^\.\/([^/]+)\/([^/]+)\/([^/]+)\.tsx$/i);
  if (local) {
    return { pageScope: local[1], sectionFolder: local[2], variantFile: local[3] };
  }
  return null;
}
