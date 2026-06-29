import type { Section, WebsiteData } from './types';
import { INITIAL_TEMPLATE, SECTION_TEMPLATES } from './constants';

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

function cloneDeep<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function sectionFromTemplate(type: 'servicehero' | 'aboutservice', id: string): Section {
  const t = SECTION_TEMPLATES[type];
  return {
    ...cloneDeep(t),
    id,
    type: t.type || type,
    elements: Array.isArray(t.elements) ? cloneDeep(t.elements) : [],
  } as Section;
}

/** Initial canvas when opening GenieBuild without `projectId` (dummy / local preview). */
export function getStandaloneInitialWebsiteData(): WebsiteData {
  if (typeof window === 'undefined') return INITIAL_TEMPLATE;
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get('projectId')) return INITIAL_TEMPLATE;
    if (isLocalServiceDemoPath(window.location.pathname)) {
      return buildLocalServiceDemoWebsiteData();
    }
  } catch {
    /* ignore */
  }
  return INITIAL_TEMPLATE;
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
