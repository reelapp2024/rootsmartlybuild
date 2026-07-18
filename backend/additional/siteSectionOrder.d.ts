export const CANONICAL_HOME_SECTION_ORDER: readonly string[];
export const CANONICAL_AREAS_SECTION_ORDER: readonly string[];
export const CANONICAL_SERVICES_SECTION_ORDER: readonly string[];
export const CANONICAL_ABOUT_SECTION_ORDER: readonly string[];
export const CANONICAL_CONTACT_SECTION_ORDER: readonly string[];
export const CANONICAL_LEGAL_SECTION_ORDER: readonly string[];
export const CANONICAL_BLOG_SECTION_ORDER: readonly string[];
export const CANONICAL_BLOGDETAIL_SECTION_ORDER: readonly string[];
export const CANONICAL_SERVICE_SECTION_ORDER: readonly string[];
export const MINIMAL_SERVICE_SECTION_FALLBACK: readonly string[];
export const SHELL_SECTION_TYPES: ReadonlySet<string>;
export const SERVICE_TEMPLATE_EXCLUSIVE_SECTIONS: ReadonlySet<string>;

export function canonicalSectionId(raw?: string): string;
export function resolveCanonicalPageKey(pageKeyOrMeta?: string | Record<string, unknown>): string;
export function getCanonicalOrderList(pageKey?: string): readonly string[];
export function sortSectionIdsByCanonicalOrder(pageKey: string, ids?: string[]): string[];
export function sortSectionObjectsByCanonicalOrder<T>(
  pageKey: string,
  items?: T[],
  getId?: (item: T) => string
): T[];
export function applyCanonicalSectionOrderToPageSections<T>(
  pageKeyOrMeta: string | Record<string, unknown>,
  sections?: T[]
): T[];
export function isServiceTemplateExclusiveSection(sectionId?: string): boolean;
export function getPageSectionsFromDesign(page?: Record<string, unknown>): unknown[];
export function extractSectionTypesFromDesignPage(page?: Record<string, unknown>): string[];
export function findServiceTemplateWebsitePage(websitePages?: Record<string, unknown>[]): Record<string, unknown> | null;
export function findServiceTemplateDesignPage(
  designData?: Record<string, unknown>,
  websitePages?: Record<string, unknown>[]
): Record<string, unknown> | null;
export function getServiceTemplateSectionTypes(
  designData?: Record<string, unknown>,
  websitePages?: Record<string, unknown>[]
): string[];
export function buildServiceRenderSections(opts: Record<string, unknown>): unknown[];
export function reorderHomeSectionsInConfig<T extends { id: string }>(sections?: T[]): T[];
