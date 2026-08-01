/**
 * Content website funky sections — same folder pattern as components/sections:
 *   {pageScope}/{sectionType}/{Variant}Funky.tsx
 *
 * Difference vs business/bulk: funky visual chrome only.
 * Compatibility: Section props + ElementsSection (editable builder elements).
 */

export { FUNKY, funkyFromTheme } from './funkyTheme';
export {
  CONTENT_DISCOVERED_VARIANTS,
  getContentVariantsForSection,
  getContentDefaultVariant,
  loadContentSectionVariant,
} from './sectionDiscovery';

export { default as HeroFunky } from './homepage/hero/HeroFunky';
export { default as FeaturedPostsFunky } from './homepage/featuredposts/FeaturedPostsFunky';
export { default as CategoriesGridFunky } from './homepage/categoriesgrid/CategoriesGridFunky';
export { default as AboutTeaserFunky } from './homepage/aboutteaser/AboutTeaserFunky';
export { default as AuthorsFunky } from './homepage/authors/AuthorsFunky';
export { default as NewsletterFunky } from './homepage/newsletter/NewsletterFunky';
export { default as FaqFunky } from './homepage/faq/FaqFunky';
export { default as TrendingPinsFunky } from './homepage/trendingpins/TrendingPinsFunky';
export { default as PinBoardCtaFunky } from './homepage/pinboardcta/PinBoardCtaFunky';
export { default as SeasonalSpotlightFunky } from './homepage/seasonalspotlight/SeasonalSpotlightFunky';

export { default as BlogHeroFunky } from './blog/bloghero/BlogHeroFunky';
export { default as PostGridFunky } from './blog/postgrid/PostGridFunky';
export { default as CategoryFilterFunky } from './blog/categoryfilter/CategoryFilterFunky';
export { default as BlogNewsletterFunky } from './blog/newsletter/NewsletterFunky';
export { default as PopularPostsFunky } from './blog/popularposts/PopularPostsFunky';

export { default as CategoryHeroFunky } from './category/categoryhero/CategoryHeroFunky';
export { default as CategoryPostGridFunky } from './category/postgrid/PostGridFunky';
export { default as RelatedCategoriesFunky } from './category/relatedcategories/RelatedCategoriesFunky';

export { default as ArticleHeroFunky } from './article/articlehero/ArticleHeroFunky';
export { default as ArticleBodyFunky } from './article/articlebody/ArticleBodyFunky';
export { default as AuthorBoxFunky } from './article/authorbox/AuthorBoxFunky';
export { default as RelatedPostsFunky } from './article/relatedposts/RelatedPostsFunky';
export { default as PinCtaFunky } from './article/pincta/PinCtaFunky';
export { default as ArticleFaqFunky } from './article/faq/FaqFunky';
export { default as ShopTheLookFunky } from './article/shopthelook/ShopTheLookFunky';

export { default as AboutHeroFunky } from './about/abouthero/AboutHeroFunky';
export { default as BrandStoryFunky } from './about/brandstory/BrandStoryFunky';
export { default as AboutAuthorsFunky } from './about/authors/AuthorsFunky';
export { default as AboutCtaFunky } from './about/aboutcta/AboutCtaFunky';
export { default as BrandVoiceFunky } from './about/brandvoice/BrandVoiceFunky';

export { default as ContactHeroFunky } from './contact/contacthero/ContactHeroFunky';
export { default as ContactFormFunky } from './contact/contactform/ContactFormFunky';
export { default as ContactInfoFunky } from './contact/contactinfo/ContactInfoFunky';

export { default as PrivacyBodyFunky } from './legal/privacybody/PrivacyBodyFunky';
export { default as TermsBodyFunky } from './legal/termsbody/TermsBodyFunky';
export { default as DisclaimerBodyFunky } from './legal/disclaimerbody/DisclaimerBodyFunky';

export { default as AuthorHeroFunky } from './author/authorhero/AuthorHeroFunky';
export { default as AuthorBioFunky } from './author/authorbio/AuthorBioFunky';
export { default as AuthorPostsFunky } from './author/authorposts/AuthorPostsFunky';

export { default as HeaderFunky } from './headerfooter/header/HeaderFunky';
export { default as FooterFunky } from './headerfooter/footer/FooterFunky';
