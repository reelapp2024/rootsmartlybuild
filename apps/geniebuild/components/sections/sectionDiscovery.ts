/**
 * File-based discovery of section variants (Vite import.meta.glob).
 * Supports:
 * - ./sectionType/Variant.tsx
 * - ./homepage/sectionType/Variant.tsx
 * - ./RootSection.tsx
 */
import type { ComponentType } from 'react';

type GlobModuleMap = Record<string, () => Promise<{ default: ComponentType<unknown> }>>;

function safeGlob(pattern: string): GlobModuleMap {
  try {
    const globFn = (import.meta as any)?.glob;
    if (typeof globFn === 'function') {
      return globFn(pattern) as GlobModuleMap;
    }
  } catch (_error) {
    // Non-Vite runtimes (e.g. Next.js webpack) don't support import.meta.glob.
  }
  return {};
}

const pageScopedModules = safeGlob('./*/*/*.tsx');
const nestedModules = safeGlob('./*/*.tsx');
const rootModules = safeGlob('./*.tsx');

const fallbackModules: GlobModuleMap = {
  './ElementsSection.tsx': () => import('./ElementsSection'),
  './StatCardValue.tsx': () => import('./StatCardValue'),
  './allelementsTest/AllElementsTest.tsx': () => import('./allelementsTest/AllElementsTest'),
  './homepage/about/AboutPlumbing.tsx': () => import('./homepage/about/AboutPlumbing'),
  './about/abouthero/AboutHeroDefault.tsx': () => import('./about/abouthero/AboutHeroDefault'),
  './about/missionvision/MissionVisionDefault.tsx': () => import('./about/missionvision/MissionVisionDefault'),
  './about/corevalues/CoreValuesDefault.tsx': () => import('./about/corevalues/CoreValuesDefault'),
  './about/usp/USPDefault.tsx': () => import('./about/usp/USPDefault'),
  './homepage/areas/AreasPlumbing.tsx': () => import('./homepage/areas/AreasPlumbing'),
  './homepage/cta/CTAPlumbing1.tsx': () => import('./homepage/cta/CTAPlumbing1'),
  './homepage/cta/CTAPlumbing2.tsx': () => import('./homepage/cta/CTAPlumbing2'),
  './homepage/cta/CTAPlumbing3.tsx': () => import('./homepage/cta/CTAPlumbing3'),
  './homepage/faq/FAQPlumbing.tsx': () => import('./homepage/faq/FAQPlumbing'),
  './homepage/features/FeaturesPlumbing.tsx': () => import('./homepage/features/FeaturesPlumbing'),
  './headerfooter/footer/FooterPlumbing.tsx': () => import('./headerfooter/footer/FooterPlumbing'),
  './homepage/guarantee/GuaranteePlumbing.tsx': () => import('./homepage/guarantee/GuaranteePlumbing'),
  './headerfooter/header/HeaderPlumbing.tsx': () => import('./headerfooter/header/HeaderPlumbing'),
  './homepage/hero/HeroPlumbing4.tsx': () => import('./homepage/hero/HeroPlumbing4'),
  './homepage/process/ProcessPlumbing.tsx': () => import('./homepage/process/ProcessPlumbing'),
  './homepage/services/ServicesPlumbing2.tsx': () => import('./homepage/services/ServicesPlumbing2'),
  './service/aboutservice/AboutServiceDefault.tsx': () => import('./service/aboutservice/AboutServiceDefault'),
  './service/aboutservice/AboutServiceStacked.tsx': () => import('./service/aboutservice/AboutServiceStacked'),
  './contact/contacthero/ContactHeroDefault.tsx': () => import('./contact/contacthero/ContactHeroDefault'),
  './contact/contactinfo/ContactInfoDefault.tsx': () => import('./contact/contactinfo/ContactInfoDefault'),
  './contact/contactform/ContactFormDefault.tsx': () => import('./contact/contactform/ContactFormDefault'),
  './blog/blogshero/BlogsHeroDefault.tsx': () => import('./blog/blogshero/BlogsHeroDefault'),
  './blog/blogssearch/BlogsSearchDefault.tsx': () => import('./blog/blogssearch/BlogsSearchDefault'),
  './blog/blogslist/BlogsListDefault.tsx': () => import('./blog/blogslist/BlogsListDefault'),
  './blog/blogarticlehero/BlogArticleHeroDefault.tsx': () => import('./blog/blogarticlehero/BlogArticleHeroDefault'),
  './blog/blogcontent/BlogContentDefault.tsx': () => import('./blog/blogcontent/BlogContentDefault'),
  './blog/blogauthor/BlogAuthorDefault.tsx': () => import('./blog/blogauthor/BlogAuthorDefault'),
  './blog/blogcomments/BlogCommentsDefault.tsx': () => import('./blog/blogcomments/BlogCommentsDefault'),
  './blog/blogrelated/BlogRelatedDefault.tsx': () => import('./blog/blogrelated/BlogRelatedDefault'),
  './legal/legalhero/LegalHeroDefault.tsx': () => import('./legal/legalhero/LegalHeroDefault'),
  './legal/legalcontent/LegalContentDefault.tsx': () => import('./legal/legalcontent/LegalContentDefault'),
  './location/sublocations/SubLocationsDefault.tsx': () => import('./location/sublocations/SubLocationsDefault'),
  './location/locationmap/LocationMapDefault.tsx': () => import('./location/locationmap/LocationMapDefault'),
  './service/servicehero/ServiceHeroDefault.tsx': () => import('./service/servicehero/ServiceHeroDefault'),
  './service/servicehero/ServiceHeroConsistent.tsx': () => import('./service/servicehero/ServiceHeroConsistent'),
  './service/aboutservice/AboutServiceConsistent.tsx': () => import('./service/aboutservice/AboutServiceConsistent'),
  './service/promise/PromiseDefault.tsx': () => import('./service/promise/PromiseDefault'),
  './service/relatedservices/RelatedServicesDefault.tsx': () => import('./service/relatedservices/RelatedServicesDefault'),
  './homepage/testimonials/TestimonialsPlumbing.tsx': () => import('./homepage/testimonials/TestimonialsPlumbing'),
  './homepage/why-choose-us/WhyChoosePlumbing.tsx': () => import('./homepage/why-choose-us/WhyChoosePlumbing'),
};

const hasViteGlobModules =
  Object.keys(pageScopedModules).length > 0 ||
  Object.keys(nestedModules).length > 0 ||
  Object.keys(rootModules).length > 0;

const allModules = hasViteGlobModules
  ? { ...pageScopedModules, ...nestedModules, ...rootModules }
  : fallbackModules;

const runtimePageScopedModules: GlobModuleMap = {};
const runtimeNestedModules: GlobModuleMap = {};
const runtimeRootModules: GlobModuleMap = {};

Object.entries(allModules).forEach(([key, loader]) => {
  const segments = key.replace(/^\.\//, '').split('/');
  if (segments.length === 3) runtimePageScopedModules[key] = loader;
  else if (segments.length === 2) runtimeNestedModules[key] = loader;
  else if (segments.length === 1) runtimeRootModules[key] = loader;
});

const IGNORE_ROOT = new Set(['SectionRouter.tsx', 'SectionRouterGenerator.tsx']);
const IGNORED_SECTION_FOLDERS = new Set(['utils']);

function normalizeSectionType(sectionType: string): string {
  const raw = String(sectionType || '').toLowerCase().trim();
  const aliases: Record<string, string> = {
    whychooseus: 'why-choose-us',
    servicesgrid: 'services',
    navbar: 'header',
  };
  return aliases[raw] || raw;
}

export type SectionVariantEntry = {
  sectionType: string;
  /** PascalCase file base — use in section.styles.variant */
  variantFile: string;
  uniqueId: string;
};

function pushUnique(
  map: Map<string, SectionVariantEntry[]>,
  sectionType: string,
  variantFile: string
) {
  if (IGNORED_SECTION_FOLDERS.has(sectionType.toLowerCase())) return;
  const uniqueId = variantFile.toLowerCase();
  const list = map.get(sectionType) || [];
  if (list.some((e) => e.uniqueId === uniqueId)) return;
  list.push({ sectionType, variantFile, uniqueId });
  map.set(sectionType, list);
}

function buildVariantMap(): Map<string, SectionVariantEntry[]> {
  const map = new Map<string, SectionVariantEntry[]>();

  for (const key of Object.keys(runtimePageScopedModules)) {
    const m = key.match(/^\.\/([^/]+)\/([^/]+)\/([^/]+)\.tsx$/i);
    if (!m) continue;
    const sectionFolder = m[2];
    const variantFile = m[3];
    if (IGNORED_SECTION_FOLDERS.has(sectionFolder.toLowerCase())) continue;
    pushUnique(map, sectionFolder.toLowerCase(), variantFile);
  }

  for (const key of Object.keys(runtimeNestedModules)) {
    const m = key.match(/^\.\/([^/]+)\/([^/]+)\.tsx$/i);
    if (!m) continue;
    const sectionFolder = m[1];
    const variantFile = m[2];
    if (IGNORED_SECTION_FOLDERS.has(sectionFolder.toLowerCase())) continue;
    const sectionType = sectionFolder.toLowerCase();
    pushUnique(map, sectionType, variantFile);
  }

  for (const key of Object.keys(runtimeRootModules)) {
    const base = key.replace(/^\.\//, '');
    if (IGNORE_ROOT.has(base)) continue;
    const m = key.match(/^\.\/([^/]+)\.tsx$/i);
    if (!m) continue;
    const variantFile = m[1].replace(/\.tsx$/i, '');
    let sectionType = variantFile.replace(/Section$/i, '').toLowerCase();
    if (!sectionType) sectionType = variantFile.toLowerCase();
    pushUnique(map, sectionType, variantFile);
  }

  return map;
}

const variantMap = buildVariantMap();

/** All section types that have at least one variant file */
export const DISCOVERED_SECTION_TYPES: string[] = Array.from(variantMap.keys()).sort();

export function getDiscoveredVariants(sectionType: string): SectionVariantEntry[] {
  return variantMap.get(normalizeSectionType(sectionType)) || [];
}

export function getDefaultVariantForSection(sectionType: string): string {
  const list = getDiscoveredVariants(sectionType);
  if (!list.length) return '';
  const sorted = [...list].sort((a, b) => a.variantFile.localeCompare(b.variantFile));
  return sorted[0].variantFile;
}

export function isDiscoveredVariant(sectionType: string, variant: string): boolean {
  if (!variant) return false;
  const slug = variant.toLowerCase();
  return getDiscoveredVariants(sectionType).some(
    (e) => e.uniqueId === slug || e.variantFile === variant
  );
}

/**
 * Resolve Vite glob path for lazy import (case-insensitive on basename).
 */
export function resolveVariantGlobPath(sectionType: string, variant: string): string | null {
  const sec = normalizeSectionType(sectionType);
  const slug = (variant || '').toString().replace(/\.tsx$/i, '').toLowerCase();

  for (const key of Object.keys(runtimePageScopedModules)) {
    const m = key.match(/^\.\/([^/]+)\/([^/]+)\/([^/]+)\.tsx$/i);
    if (!m) continue;
    if (m[2].toLowerCase() !== sec) continue;
    if (IGNORED_SECTION_FOLDERS.has(m[2].toLowerCase())) continue;
    if (m[3].toLowerCase().replace(/\.tsx$/i, '') === slug) return key;
  }

  for (const key of Object.keys(runtimeNestedModules)) {
    const m = key.match(/^\.\/([^/]+)\/([^/]+)\.tsx$/i);
    if (!m) continue;
    if (m[1].toLowerCase() !== sec) continue;
    if (IGNORED_SECTION_FOLDERS.has(m[1].toLowerCase())) continue;
    if (m[2].toLowerCase().replace(/\.tsx$/i, '') === slug) return key;
  }

  for (const key of Object.keys(runtimeRootModules)) {
    const base = key.replace(/^\.\//, '');
    if (IGNORE_ROOT.has(base)) continue;
    const m = key.match(/^\.\/([^/]+)\.tsx$/i);
    if (!m) continue;
    const fileBase = m[1].replace(/\.tsx$/i, '');
    const inferredSection = fileBase.replace(/Section$/i, '').toLowerCase();
    if (inferredSection !== sec && fileBase.toLowerCase() !== sec) continue;
    if (fileBase.toLowerCase() === slug) return key;
  }

  return null;
}

export function getVariantModuleLoader(
  resolvedPath: string | null
): (() => Promise<{ default: ComponentType<unknown> }>) | null {
  if (!resolvedPath) return null;
  const pageScoped = runtimePageScopedModules as Record<string, () => Promise<{ default: ComponentType<unknown> }>>;
  const nested = runtimeNestedModules as Record<string, () => Promise<{ default: ComponentType<unknown> }>>;
  const root = runtimeRootModules as Record<string, () => Promise<{ default: ComponentType<unknown> }>>;
  return pageScoped[resolvedPath] || nested[resolvedPath] || root[resolvedPath] || null;
}
