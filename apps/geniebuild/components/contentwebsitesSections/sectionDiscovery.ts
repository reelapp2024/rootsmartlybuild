/**
 * File-based discovery for content-website funky variants.
 * Same glob rules as components/sections/sectionDiscovery.ts:
 *   ./{pageScope}/{sectionType}/{Variant}.tsx
 */
import type { ComponentType } from 'react';

type GlobModuleMap = Record<string, () => Promise<{ default: ComponentType<unknown> }>>;

function safeGlob(pattern: string): GlobModuleMap {
  try {
    const globFn = (import.meta as any)?.glob;
    if (typeof globFn === 'function') {
      return globFn(pattern) as GlobModuleMap;
    }
  } catch {
    // non-Vite
  }
  return {};
}

const pageScopedModules = safeGlob('./*/*/*.tsx');

const fallbackModules: GlobModuleMap = {
  './homepage/hero/HeroFunky.tsx': () => import('./homepage/hero/HeroFunky'),
  './homepage/featuredposts/FeaturedPostsFunky.tsx': () => import('./homepage/featuredposts/FeaturedPostsFunky'),
  './homepage/categoriesgrid/CategoriesGridFunky.tsx': () => import('./homepage/categoriesgrid/CategoriesGridFunky'),
  './homepage/aboutteaser/AboutTeaserFunky.tsx': () => import('./homepage/aboutteaser/AboutTeaserFunky'),
  './homepage/authors/AuthorsFunky.tsx': () => import('./homepage/authors/AuthorsFunky'),
  './homepage/newsletter/NewsletterFunky.tsx': () => import('./homepage/newsletter/NewsletterFunky'),
  './homepage/faq/FaqFunky.tsx': () => import('./homepage/faq/FaqFunky'),
  './homepage/trendingpins/TrendingPinsFunky.tsx': () => import('./homepage/trendingpins/TrendingPinsFunky'),
  './homepage/pinboardcta/PinBoardCtaFunky.tsx': () => import('./homepage/pinboardcta/PinBoardCtaFunky'),
  './homepage/seasonalspotlight/SeasonalSpotlightFunky.tsx': () => import('./homepage/seasonalspotlight/SeasonalSpotlightFunky'),
  './blog/bloghero/BlogHeroFunky.tsx': () => import('./blog/bloghero/BlogHeroFunky'),
  './blog/postgrid/PostGridFunky.tsx': () => import('./blog/postgrid/PostGridFunky'),
  './blog/categoryfilter/CategoryFilterFunky.tsx': () => import('./blog/categoryfilter/CategoryFilterFunky'),
  './blog/newsletter/NewsletterFunky.tsx': () => import('./blog/newsletter/NewsletterFunky'),
  './blog/popularposts/PopularPostsFunky.tsx': () => import('./blog/popularposts/PopularPostsFunky'),
  './category/categoryhero/CategoryHeroFunky.tsx': () => import('./category/categoryhero/CategoryHeroFunky'),
  './category/postgrid/PostGridFunky.tsx': () => import('./category/postgrid/PostGridFunky'),
  './category/relatedcategories/RelatedCategoriesFunky.tsx': () => import('./category/relatedcategories/RelatedCategoriesFunky'),
  './article/articlehero/ArticleHeroFunky.tsx': () => import('./article/articlehero/ArticleHeroFunky'),
  './article/articlebody/ArticleBodyFunky.tsx': () => import('./article/articlebody/ArticleBodyFunky'),
  './article/authorbox/AuthorBoxFunky.tsx': () => import('./article/authorbox/AuthorBoxFunky'),
  './article/relatedposts/RelatedPostsFunky.tsx': () => import('./article/relatedposts/RelatedPostsFunky'),
  './article/pincta/PinCtaFunky.tsx': () => import('./article/pincta/PinCtaFunky'),
  './article/faq/FaqFunky.tsx': () => import('./article/faq/FaqFunky'),
  './article/shopthelook/ShopTheLookFunky.tsx': () => import('./article/shopthelook/ShopTheLookFunky'),
  './about/abouthero/AboutHeroFunky.tsx': () => import('./about/abouthero/AboutHeroFunky'),
  './about/brandstory/BrandStoryFunky.tsx': () => import('./about/brandstory/BrandStoryFunky'),
  './about/authors/AuthorsFunky.tsx': () => import('./about/authors/AuthorsFunky'),
  './about/aboutcta/AboutCtaFunky.tsx': () => import('./about/aboutcta/AboutCtaFunky'),
  './about/brandvoice/BrandVoiceFunky.tsx': () => import('./about/brandvoice/BrandVoiceFunky'),
  './contact/contacthero/ContactHeroFunky.tsx': () => import('./contact/contacthero/ContactHeroFunky'),
  './contact/contactform/ContactFormFunky.tsx': () => import('./contact/contactform/ContactFormFunky'),
  './contact/contactinfo/ContactInfoFunky.tsx': () => import('./contact/contactinfo/ContactInfoFunky'),
  './legal/privacybody/PrivacyBodyFunky.tsx': () => import('./legal/privacybody/PrivacyBodyFunky'),
  './legal/termsbody/TermsBodyFunky.tsx': () => import('./legal/termsbody/TermsBodyFunky'),
  './legal/disclaimerbody/DisclaimerBodyFunky.tsx': () => import('./legal/disclaimerbody/DisclaimerBodyFunky'),
  './author/authorhero/AuthorHeroFunky.tsx': () => import('./author/authorhero/AuthorHeroFunky'),
  './author/authorbio/AuthorBioFunky.tsx': () => import('./author/authorbio/AuthorBioFunky'),
  './author/authorposts/AuthorPostsFunky.tsx': () => import('./author/authorposts/AuthorPostsFunky'),
  './headerfooter/header/HeaderFunky.tsx': () => import('./headerfooter/header/HeaderFunky'),
  './headerfooter/footer/FooterFunky.tsx': () => import('./headerfooter/footer/FooterFunky'),
};

const allModules: GlobModuleMap = {
  ...fallbackModules,
  ...pageScopedModules,
};

export type ContentDiscoveredVariant = {
  pageScope: string;
  sectionType: string;
  variantFile: string;
  load: () => Promise<{ default: ComponentType<unknown> }>;
};

function parsePath(key: string): ContentDiscoveredVariant | null {
  // ./homepage/hero/HeroFunky.tsx
  const m = key.match(/^\.\/([^/]+)\/([^/]+)\/([^/]+)\.tsx$/);
  if (!m) return null;
  const [, pageScope, sectionType, variantFile] = m;
  if (sectionType === 'ElementsSection' || variantFile === 'ElementsSection') return null;
  const load = allModules[key];
  if (!load) return null;
  return { pageScope, sectionType, variantFile, load };
}

export const CONTENT_DISCOVERED_VARIANTS: ContentDiscoveredVariant[] = Object.keys(allModules)
  .map(parsePath)
  .filter(Boolean) as ContentDiscoveredVariant[];

export function getContentVariantsForSection(sectionType: string) {
  return CONTENT_DISCOVERED_VARIANTS.filter((v) => v.sectionType === sectionType);
}

export function getContentDefaultVariant(sectionType: string): string {
  const variants = getContentVariantsForSection(sectionType);
  const funky = variants.find((v) => /Funky$/i.test(v.variantFile));
  return funky?.variantFile || variants[0]?.variantFile || '';
}

export async function loadContentSectionVariant(sectionType: string, variantFile: string) {
  const hit = CONTENT_DISCOVERED_VARIANTS.find(
    (v) => v.sectionType === sectionType && v.variantFile === variantFile
  );
  if (!hit) return null;
  const mod = await hit.load();
  return mod.default;
}
