/**
 * SectionRouter — file-driven lazy loading (import.meta.glob).
 * Variants: sections/{sectionType}/{VariantFile}.tsx (+ root ElementsSection.tsx).
 */

import React, { Suspense, lazy, useMemo, useEffect } from 'react';
import { Section, WebsiteElement } from '../../types';
import { getDefaultVariant } from '../SectionsAndVariantRegistry';
import { resolveVariantGlobPath, getVariantModuleLoader } from './sectionDiscovery';
import { ElementsSection } from './homepage/ElementsSection';

// Module-level cache: resolved lazy components survive re-renders.
// Key: "<sectionType>::<variant>" (lowercased).
const lazyCache = new Map<string, React.LazyExoticComponent<React.ComponentType<unknown>>>();

// Module-level cache of in-flight / settled module loads — so preloading
// the same variant twice is free, and component-mount never re-fetches.
const modulePromiseCache = new Map<string, Promise<unknown>>();

/**
 * Kick off a module load for a section variant without rendering it.
 * Safe to call repeatedly; identical requests share one promise.
 */
export function preloadVariant(sectionType: string, variant: string): Promise<unknown> | null {
  const key = `${sectionType}::${(variant || '').toLowerCase()}`;
  const cached = modulePromiseCache.get(key);
  if (cached) return cached;
  const p = resolveVariantGlobPath(sectionType, variant);
  const loader = getVariantModuleLoader(p);
  if (!loader) return null;
  const promise = loader();
  modulePromiseCache.set(key, promise);
  return promise;
}

interface SectionRouterProps {
  section: Section;
  onTextEdit: (key: any, value: string) => void;
  onImageClick?: () => void;
  onLinkEdit?: (index: number, value: string) => void;
  onLogoClick?: () => void;
  onItemEdit?: (itemId: string, updates: any) => void;
  onAddItem?: () => void;
  onRemoveItem?: (id: string) => void;
  /** Full section patch — used by sections that need to materialize defaults (e.g. content.items) before add/remove */
  onSectionUpdate?: (sectionId: string, updates: any) => void;
  onUpload?: (sectionId: string, field: string) => void;
  onElementUpdate?: (elementId: string, updates: any) => void;
  onElementSelect?: (elementId: string, element?: WebsiteElement) => void;
  onOpenInternalLink?: (href: string) => void;
  selectedElementId?: string | null;
  buttonClass: string;
  isSelected?: boolean;
  titleClass?: string;
  titleStyle?: React.CSSProperties;
  subtitleStyle?: React.CSSProperties;
  descriptionStyle?: React.CSSProperties;
  buttonStyle?: React.CSSProperties;
  readOnly?: boolean;
  themeColors?: any;
  sitePathname?: string;
  sitePageType?: string;
  projectId?: string;
}

/**
 * Section modules use named exports (e.g. `export const HeroCenter`).
 * React.lazy() requires a default export — wrap the dynamic import.
 */
function exportNameFromGlobPath(globPath: string): string {
  const tail = globPath.split('/').pop() || '';
  return tail.replace(/\.tsx$/i, '');
}

function loadVariant(sectionType: string, variant: string) {
  const cacheKey = `${sectionType}::${(variant || '').toLowerCase()}`;
  const cached = lazyCache.get(cacheKey);
  if (cached) return cached;

  const p = resolveVariantGlobPath(sectionType, variant);
  const loader = getVariantModuleLoader(p);
  if (!loader || !p) return null;

  const exportName = exportNameFromGlobPath(p);

  const LazyComp = lazy(async () => {
    // Reuse an in-flight/settled promise from preload if one exists —
    // otherwise start (and cache) a fresh load here.
    let promise = modulePromiseCache.get(cacheKey);
    if (!promise) {
      promise = loader();
      modulePromiseCache.set(cacheKey, promise);
    }
    const mod = (await promise) as Record<string, unknown>;
    const Comp =
      (mod[exportName] as React.ComponentType<unknown>) ||
      (mod.default as React.ComponentType<unknown>);
    if (!Comp || typeof Comp !== 'function') {
      const keys = Object.keys(mod).filter((k) => k !== '__esModule');
      throw new Error(
        `No component export "${exportName}" in ${p} (found: ${keys.join(', ') || 'none'})`
      );
    }
    return { default: Comp };
  });
  lazyCache.set(cacheKey, LazyComp);
  return LazyComp;
}

export const SectionRouter: React.FC<SectionRouterProps> = (props) => {
  const { section } = props;

  const safeSection: Section = {
    ...(section as any),
    content: (section as any)?.content || {},
    styles: (section as any)?.styles || {},
  };
  const normalizeSectionType = (value: string) => {
    const raw = String(value || '').toLowerCase().trim();
    // Legacy location* twins → homepage (area detail = home). Listing stays locationmap/sublocations.
    const aliases: Record<string, string> = {
      whychooseus: 'why-choose-us',
      servicesgrid: 'services',
      navbar: 'header',
      locationhero: 'hero',
      locationabout: 'about',
      locationservices: 'services',
      locationwhychoose: 'why-choose-us',
      locationprocess: 'process',
      locationcta: 'cta',
      locationguarantee: 'guarantee',
      locationtestimonials: 'testimonials',
      locationareas: 'areas',
      locationfaq: 'faq',
      locationpromise: 'promise',
    };
    return aliases[raw] || raw;
  };

  const sectionType = normalizeSectionType(safeSection.type as string);
  const rawVariant = (safeSection.styles as any)?.variant;
  // Prefer saved variant when it resolves to a real module (business or content Funky).
  // Otherwise fall through to the discovered default.
  const variant =
    rawVariant && resolveVariantGlobPath(sectionType, String(rawVariant))
      ? rawVariant
      : getDefaultVariant(sectionType);

  const forceCommonVariants = new Set([
    // Legacy navbar variants
    'navbarsimple',
    'navbarminimal',
    'navbarcentered',
    'navbarapi',
    // Legacy footer variants
    'footerminimal',
    'footercolumns',
    'footercentered',
    'footerapi',
    // Legacy pricing variants
    'pricingcards',
    'pricingminimal',
    // Legacy image-banner variants
    'bannercenter',
    'bannersplit',
    'bannerbottomleft',
  ]);
  const variantKey = String(rawVariant || variant || '').toLowerCase().replace(/[\s_-]+/g, '');
  const shouldForceCommonRenderer =
    forceCommonVariants.has(variantKey) &&
    Array.isArray((safeSection as any)?.elements) &&
    (safeSection as any).elements.length > 0;

  const LazyComp = useMemo(
    () => loadVariant(sectionType, variant),
    [sectionType, variant]
  );

  // Ensure this variant's module is requested as soon as the router mounts,
  // even if React hasn't committed the <LazyComp> tree yet — avoids the
  // Suspense fallback on fast refreshes.
  useEffect(() => {
    preloadVariant(sectionType, variant);
  }, [sectionType, variant]);

  const baseProps: Record<string, any> = {
    section: { ...safeSection, type: sectionType },
    onTextEdit: props.onTextEdit,
    buttonClass: props.buttonClass,
    readOnly: props.readOnly,
    isSelected: props.isSelected,
    titleClass: props.titleClass,
    titleStyle: props.titleStyle,
    subtitleStyle: props.subtitleStyle,
    descriptionStyle: props.descriptionStyle,
    buttonStyle: props.buttonStyle,
    onElementSelect: props.onElementSelect,
    onOpenInternalLink: props.onOpenInternalLink,
    selectedElementId: props.selectedElementId,
    onElementUpdate: props.onElementUpdate,
    themeColors: props.themeColors,
    fontThemeColors: props.themeColors,
    onImageClick: props.onImageClick,
    onLinkEdit: props.onLinkEdit,
    onLogoClick: props.onLogoClick,
    onItemEdit: props.onItemEdit,
    onAddItem: props.onAddItem,
    onRemoveItem: props.onRemoveItem,
    onSectionUpdate: props.onSectionUpdate,
    onUpload: props.onUpload,
    sitePathname: props.sitePathname,
    sitePageType: props.sitePageType,
    projectId: props.projectId,
  };

  if (!LazyComp) {
    return (
      <div className="p-10 text-center text-slate-500">
        Unsupported section or variant: {sectionType} / {String(variant)}
      </div>
    );
  }

  if (shouldForceCommonRenderer) {
    return (
      <ElementsSection
        section={safeSection}
        onTextEdit={props.onTextEdit}
        onElementUpdate={props.onElementUpdate}
        onElementSelect={props.onElementSelect}
        onOpenInternalLink={props.onOpenInternalLink}
        selectedElementId={props.selectedElementId}
        buttonClass={props.buttonClass}
        readOnly={props.readOnly}
        isWrapped={true}
        themeColors={props.themeColors}
      />
    );
  }

  // Silent skeleton: reserves a little vertical space so the page doesn't
  // collapse while the chunk loads, but shows no text — the chunks resolve
  // in milliseconds once cached.
  return (
    <Suspense fallback={<div aria-hidden className="min-h-[120px]" />}>
      <LazyComp {...baseProps} />
    </Suspense>
  );
};
