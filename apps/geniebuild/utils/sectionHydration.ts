/**
 * Shared API → canvas hydration (GenieBuild + SiteNextJS).
 * Ensures variant overrides, backgrounds, overlays, and padding match the builder.
 */

import type { Section, WebsiteElement, ElementType } from '../types';
import { migrateSection } from '../components/builder/state/sectionMigrator';
import { resolveSectionStyles } from '../components/builder/state/styleResolvers';
import { normalizeSectionContent } from '../components/builder/state/sectionContentNormalizer';
import { getDefaultVariant } from '../components/SectionsAndVariantRegistry';
import {
  resolveSiteTheme,
  stripPresetThemeColorOverrides,
  type ThemeSettingsInput,
} from './themeResolver';
import { normalizeSectionStyles } from './normalizeSectionStyles';

export const DEFAULT_SECTION_VARIANTS: Record<string, string> = {
  navbar: 'HeaderPlumbing',
  header: 'HeaderPlumbing',
  hero: 'HeroPlumbing4',
  features: 'FeaturesPlumbing',
  about: 'AboutPlumbing',
  services: 'ServicesPlumbing2',
  cta: 'CTAPlumbing3',
  process: 'ProcessPlumbing',
  'why-choose-us': 'WhyChoosePlumbing',
  guarantee: 'GuaranteePlumbing',
  testimonials: 'TestimonialsPlumbing',
  faq: 'FAQPlumbing',
  areas: 'AreasPlumbing',
  footer: 'FooterPlumbing',
};

export function normalizeSectionType(type?: string): string {
  const value = String(type || '').toLowerCase().trim();
  if (value === 'whychooseus') return 'why-choose-us';
  return value;
}

const PLUMBING_FAQ_PLACEHOLDER_FIRST =
  'Do you offer 24/7 emergency plumbing services?';

function isPlumbingFaqPlaceholderItems(items: unknown[]): boolean {
  if (!Array.isArray(items) || items.length === 0) return false;
  const first = String((items[0] as any)?.question || (items[0] as any)?.title || '').trim();
  return first === PLUMBING_FAQ_PLACEHOLDER_FIRST;
}

function mapAccordionItemsToFaqRows(items: unknown[]) {
  return items.map((it: any, idx: number) => ({
    id: it?.id || `faq-${idx + 1}`,
    question: String(it?.question || it?.title || '').trim(),
    answer: String(it?.answer || it?.description || it?.content || '').trim(),
  }));
}

/** Map getGenieBuildPageData / getWebsiteDesignData section → canvas Section. */
export function mapApiSectionToCanvas(sec: any, index: number): Section | null {
  const type = normalizeSectionType(sec?.type);
  if (!type) return null;

  const id = String(sec?.id || `${type}-${index + 1}`);
  const elementsById =
    sec?.elementsById && typeof sec.elementsById === 'object' ? sec.elementsById : {};
  const layoutArr = Array.isArray(sec?.layout) ? sec.layout : [];
  const orderedElementIds = layoutArr
    .slice()
    .sort((a: any, b: any) => Number(a?.order || 0) - Number(b?.order || 0))
    .map((l: any) => String(l?.elementId || '').trim())
    .filter(Boolean);
  const elementIds = orderedElementIds.length > 0 ? orderedElementIds : Object.keys(elementsById);

  const elementsFromById = elementIds
    .map((elId) => {
      const el = (elementsById as any)[elId];
      if (!el || typeof el !== 'object') return null;
      return {
        id: elId,
        type: String(el.type || 'unknown') as ElementType,
        content: el.content && typeof el.content === 'object' ? el.content : {},
        style: el.style && typeof el.style === 'object' ? el.style : {},
      } as WebsiteElement;
    })
    .filter((el: WebsiteElement | null): el is WebsiteElement => !!el);

  const mergedContent: Record<string, unknown> = {
    // Stored / AI SectionContent
    ...(sec?.data && typeof sec.data === 'object' && !Array.isArray(sec.data) ? sec.data : {}),
    // Live overlays (content taxonomy, dynamics) MUST win over static stored items
    ...(sec?.content && typeof sec.content === 'object' && !Array.isArray(sec.content)
      ? sec.content
      : {}),
  };
  if (type === 'faq' && Array.isArray(sec?.data) && !Array.isArray(mergedContent.items)) {
    mergedContent.items = sec.data;
  }
  if (!mergedContent.items && Array.isArray(sec?.data?.data)) {
    mergedContent.items = sec.data.data;
  }
  // Prefer explicit live content.items when present (grids / FAQ)
  if (
    sec?.content &&
    typeof sec.content === 'object' &&
    Array.isArray((sec.content as any).items) &&
    (sec.content as any).items.length > 0
  ) {
    mergedContent.items = (sec.content as any).items;
  }

  if (
    (type === 'services' || type === 'servicesgrid') &&
    (mergedContent as any).heading &&
    !String((mergedContent as any).title || '').trim()
  ) {
    (mergedContent as any).title = (mergedContent as any).heading;
  }

  const apiEls = Array.isArray(sec?.elements) ? sec.elements : [];
  const hasDynamicNav = apiEls.some(
    (e: any) =>
      ['nav-menu', 'navigation'].includes(String(e?.type || '').toLowerCase()) &&
      Array.isArray(e?.content?.items) &&
      e.content.items.length > 0
  );
  const hasDynamicFooterLists = apiEls.some(
    (e: any) =>
      (String(e?.id || '').includes('-fp-quick') || String(e?.id || '').includes('-fp-services')) &&
      Array.isArray(e?.content?.items) &&
      e.content.items.length > 0
  );
  const elements =
    hasDynamicNav || hasDynamicFooterLists
      ? apiEls
      : elementsFromById.length > 0
        ? elementsFromById
        : apiEls;

  if (
    type === 'faq' &&
    (!Array.isArray(mergedContent.items) || !(mergedContent.items as unknown[]).length)
  ) {
    const accordionEl = elements.find(
      (e) =>
        e.type === 'accordion' &&
        String(e.id || '').includes('-fqp-accordion')
    );
    const fromAccordion = (accordionEl?.content as { items?: unknown[] })?.items;
    if (
      Array.isArray(fromAccordion) &&
      fromAccordion.length > 0 &&
      !isPlumbingFaqPlaceholderItems(fromAccordion)
    ) {
      mergedContent.items = mapAccordionItemsToFaqRows(fromAccordion);
    }
  }

  const baseStyles =
    sec?.styles && typeof sec.styles === 'object' ? { ...(sec.styles as Record<string, unknown>) } : {};
  // Prefer explicit API fields: styles.variant → top-level variant → variant_uniqueId.
  const topVariant = String(
    sec?.variant || sec?.variant_uniqueId || sec?.uniqueId || ''
  ).trim();
  const styleVariant = String((baseStyles as any).variant || '').trim();
  const chosenVariant = styleVariant || topVariant;
  if (chosenVariant) {
    (baseStyles as any).variant = chosenVariant;
  }

  const existingVariant = String((baseStyles as any).variant || '').trim();
  // Plumbing defaults when the API omitted a variant (business sites).
  // Content-only types (featuredposts, etc.) fall through to discovery (*Funky).
  const fallbackVariant =
    DEFAULT_SECTION_VARIANTS[type] || getDefaultVariant(type as Section['type']) || '';
  const normalizedContent = normalizeSectionContent(type, mergedContent);

  // Older content-site chrome saved `navigation`; treat as `nav-menu`.
  const normalizedElements = (elements || []).map((el: any) => {
    if (String(el?.type || '').toLowerCase() !== 'navigation') return el;
    const items = Array.isArray(el?.content?.items)
      ? el.content.items.map((item: any) => ({
          ...item,
          link: item?.link || item?.href || item?.url || '#',
        }))
      : el?.content?.items;
    return {
      ...el,
      type: 'nav-menu',
      content: { ...(el.content || {}), items },
    };
  });

  return {
    id,
    type: type as Section['type'],
    status: sec?.status || 'ready',
    styles: {
      ...(baseStyles as any),
      variant: existingVariant || fallbackVariant,
    },
    content: normalizedContent as Section['content'],
    elements: normalizedElements,
  } as Section;
}

export type HydrateSectionsOptions = {
  themeSettings?: ThemeSettingsInput;
  stripPresetColors?: boolean;
  variantDefaults?: Record<string, string>;
};

/**
 * Full pipeline used in GenieBuild after page load — must run on SiteNextJS too.
 */
export function hydrateSectionsForDisplay(
  incomingSections: any[],
  options: HydrateSectionsOptions = {}
): Section[] {
  const themeElements = resolveSiteTheme(options.themeSettings ?? null).elements;
  const variantDefaults = options.variantDefaults || DEFAULT_SECTION_VARIANTS;

  const mapped = (Array.isArray(incomingSections) ? incomingSections : [])
    .map((sec, index) => {
      const base = mapApiSectionToCanvas(sec, index);
      if (!base) return null;
      const sectionType = normalizeSectionType(base.type);
      const hasChosenVariant = Boolean(String(base.styles?.variant || '').trim());
      if (!hasChosenVariant) {
        const fallback = variantDefaults[sectionType] || getDefaultVariant(base.type);
        if (fallback) {
          base.styles = { ...base.styles, variant: fallback };
        }
      }
      return base;
    })
    .filter((s): s is Section => !!s);

  const migrated = mapped.map((section) => migrateSection(section, themeElements as any));

  const resolved = migrated.map((section) => ({
    ...section,
    styles: normalizeSectionStyles(resolveSectionStyles(section)),
  }));

  if (options.stripPresetColors) {
    return stripPresetThemeColorOverrides(resolved) as Section[];
  }

  return resolved;
}
