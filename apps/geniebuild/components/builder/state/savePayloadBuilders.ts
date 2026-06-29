import type { WebsiteData, Section } from '../../../types';
import { SECTION_TEMPLATES, ELEMENT_DEFAULTS } from '../../../constants';
import { buildThemeSavePayload } from '../../../utils/themeResolver';
import { getDefaultVariant } from '../../SectionsAndVariantRegistry';

function isPlainObject(value: any): boolean {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function deepEqual(a: any, b: any): boolean {
  if (a === b) return true;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) return false;
    }
    return true;
  }
  if (isPlainObject(a) && isPlainObject(b)) {
    const aKeys = Object.keys(a);
    const bKeys = Object.keys(b);
    if (aKeys.length !== bKeys.length) return false;
    for (const key of aKeys) {
      if (!deepEqual(a[key], b[key])) return false;
    }
    return true;
  }
  return false;
}

function pruneWithDefaults(actual: any, defaults: any): any {
  if (actual === undefined) return undefined;
  if (Array.isArray(actual)) {
    return deepEqual(actual, defaults) ? undefined : actual;
  }
  if (isPlainObject(actual)) {
    const out: Record<string, any> = {};
    for (const [key, value] of Object.entries(actual)) {
      const pruned = pruneWithDefaults(value, defaults?.[key]);
      if (pruned !== undefined) out[key] = pruned;
    }
    return Object.keys(out).length ? out : undefined;
  }
  return deepEqual(actual, defaults) ? undefined : actual;
}

function buildDefaultSectionStyles(section: Section): Record<string, any> {
  const template: any = SECTION_TEMPLATES[section.type] || {};
  const templateStyles = (template?.styles && typeof template.styles === 'object') ? template.styles : {};
  const activeVariant = String(section?.styles?.variant || templateStyles?.variant || getDefaultVariant(section.type) || '').trim();
  const variantDefaults = (template?.variantOverrides?.[activeVariant] && typeof template.variantOverrides[activeVariant] === 'object')
    ? template.variantOverrides[activeVariant]
    : {};
  const defaults = { ...templateStyles, ...variantDefaults };
  if (activeVariant) defaults.variant = activeVariant;
  return defaults;
}

function compactSectionForPersistence(section: Section): Section {
  const sectionDefaults = buildDefaultSectionStyles(section);
  const styleOverrides = pruneWithDefaults(section.styles || {}, sectionDefaults) || {};
  const activeVariant = String(section?.styles?.variant || sectionDefaults?.variant || '').trim();
  if (activeVariant && !('variant' in styleOverrides) && activeVariant !== String(getDefaultVariant(section.type) || '').trim()) {
    styleOverrides.variant = activeVariant;
  }

  const template: any = SECTION_TEMPLATES[section.type] || {};
  const compactElements = (section.elements || []).map((el: any) => {
    const sectionElDefault = (template?.elements || []).find((t: any) => t?.type === el?.type)?.style || {};
    const defaultElStyle = { ...(ELEMENT_DEFAULTS as any)[el?.type] || {}, ...sectionElDefault };
    const elStyleOverrides = pruneWithDefaults(el?.style || {}, defaultElStyle) || {};
    return { ...el, style: elStyleOverrides };
  });

  return {
    ...section,
    styles: styleOverrides,
    elements: compactElements as any
  } as Section;
}

/**
 * Build componentIds from current sections for save payload.
 * If existing componentIds are provided, preserve component references where possible.
 */
export function buildUpdatedComponentIds(
  existingComponentIds: any[],
  sections: Section[]
): any[] {
  const compactedSections = (sections || []).map((s) => compactSectionForPersistence(s));
  const mapped = (existingComponentIds || []).map((compData: any) => {
    const matchingSection = compactedSections.find((s) => {
      const sectionId = String((s as any)?.id || '');
      const compSectionId = String(compData?.sectionData?.id || '');
      if (sectionId && compSectionId) return sectionId === compSectionId;
      return s.type === compData.sectionData?.type;
    });
    if (matchingSection) {
      return { ...compData, sectionData: matchingSection };
    }
    return compData;
  });

  const existingTypes = new Set(
    (mapped || [])
      .map((c: any) => String(c?.sectionData?.type || '').toLowerCase().trim())
      .filter(Boolean)
  );

  const appended = compactedSections
    .filter((section) => {
      const sectionId = String((section as any)?.id || '').trim();
      const sectionType = String(section.type || '').toLowerCase().trim();
      if (!sectionId) return !existingTypes.has(sectionType);
      const hasExact = (mapped || []).some((c: any) => String(c?.sectionData?.id || '').trim() === sectionId);
      return !hasExact;
    })
    .map((section) => {
      const variant = String((section as any)?.styles?.variant || 'default').trim();
      const variantUniqueId = `${String(section.type).toLowerCase()}${variant.charAt(0).toUpperCase()}${variant.slice(1)}`;
      return {
        variant_uniqueId: variantUniqueId,
        uniqueId: variantUniqueId,
        componentId: null,
        sectionData: section,
      };
    });

  return [...mapped, ...appended];
}

/** Build the /saveWebsiteDesignData payload (sections only; SEO uses updateWebsitePageSeo). */
export function buildWebsitePayload(
  siteData: WebsiteData,
  projectId: string,
  pageId: string,
  updatedComponentIds: any[]
) {
  const page: any = {
    pageId,
    pageStyles: {},
    sections: updatedComponentIds,
  };
  // If the builder has a multi-page structure, include it alongside the
  // single-page payload so the backend can persist all pages + shared
  // navbar/footer. Backends that only understand the legacy `pages`
  // structure can safely ignore the extra fields.
  if (siteData.pages && siteData.pages.length > 0) {
    (page as any).siteStructure = {
      pages: siteData.pages,
      globalSections: siteData.globalSections || [],
      currentPageId: siteData.currentPageId,
    };
  }
  return {
    projectId,
    colorPrimary: siteData.globalStyles.colors.buttonBackgroundColor || '#E11D48',
    colorSecondary: siteData.globalStyles.colors.backgroundColor || '#0E1214',
    colorAccent: siteData.globalStyles.colors.titleColor || '#F8FAFC',
    pages: [page],
  };
}

/**
 * Extract non-empty section content entries for /upsertSectionContentFromBuilder.
 * Skips sections with missing or empty-object content to avoid overwriting AI content.
 */
function enrichFaqSectionContent(sectionData: any): Record<string, unknown> | null {
  const type = String(sectionData?.type || '').toLowerCase();
  if (type !== 'faq') return sectionData?.content ?? null;
  const content = { ...(sectionData?.content || {}) };
  const hasItems = Array.isArray(content.items) && content.items.length > 0;
  if (hasItems) return content;
  const accordionEl = (sectionData?.elements || []).find(
    (e: any) =>
      String(e?.type || '').toLowerCase() === 'accordion' &&
      String(e?.id || '').includes('-fqp-accordion')
  );
  const accItems = accordionEl?.content?.items;
  if (!Array.isArray(accItems) || accItems.length === 0) return content;
  content.items = accItems.map((it: any, idx: number) => ({
    id: it?.id || `faq-${idx + 1}`,
    question: String(it?.question || it?.title || '').trim(),
    answer: String(it?.answer || it?.description || it?.content || '').trim(),
  })).filter((it: any) => it.question && it.answer);
  return content;
}

export function buildSectionContentEntries(
  updatedComponentIds: any[]
): Array<{ sectionId: string; content: any }> {
  const sectionMapByType = new Map<string, any>();
  (updatedComponentIds || []).forEach((comp: any) => {
    const type = comp?.sectionData?.type;
    if (!type) return;
    const content =
      String(type).toLowerCase() === 'faq'
        ? enrichFaqSectionContent(comp?.sectionData)
        : comp?.sectionData?.content;
    if (!content) return;
    if (typeof content === 'object' && !Array.isArray(content) && Object.keys(content).length === 0) return;
    sectionMapByType.set(String(type).toLowerCase(), content);
  });

  return Array.from(sectionMapByType.entries()).map(([sectionId, content]) => ({
    sectionId,
    content,
  }));
}

/** @deprecated Use buildThemeSavePayload from utils/themeResolver */
export function buildThemePayload(
  siteData: WebsiteData,
  projectId: string,
  selectedPresetId: string | null,
  defaultSizes: Record<string, string>,
  defaultTypography: any
) {
  return buildThemeSavePayload(projectId, selectedPresetId, siteData, defaultSizes, defaultTypography);
}
