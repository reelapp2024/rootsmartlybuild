import type { Section, WebsiteElement } from '../../../types';
import { SECTION_TEMPLATES, ELEMENT_DEFAULTS } from '../../../constants';

/**
 * Quick content-presence heuristic used to classify a section as
 * "api" (has data) vs "default" (empty placeholder).
 */
export function hasMeaningfulSectionContent(section: Section | null | undefined): boolean {
  if (!section) return false;
  const content: any = section.content || {};

  const hasNonEmptyString = Object.values(content).some(
    (v) => typeof v === 'string' && v.trim().length > 0
  );
  if (hasNonEmptyString) return true;

  if (Array.isArray(content.items) && content.items.length > 0) return true;
  if (Array.isArray(content.links) && content.links.length > 0) return true;
  if (Array.isArray(content.listItems) && content.listItems.length > 0) return true;

  return false;
}

/**
 * Cascade: Base template styles -> variant overrides -> DB state.
 * Filters out undefined DB values so variant overrides aren't erased
 * and resolves background-type conflicts in favor of variant overrides.
 */
export function resolveSectionStyles(section: Section | null | undefined): any {
  if (!section) return {};

  const activeTemplate = SECTION_TEMPLATES[section.type] || null;
  const currentVariant = section.styles?.variant || activeTemplate?.styles?.variant || 'center';
  const variantOverrides: any = activeTemplate?.variantOverrides?.[currentVariant] || {};

  const sectionStylesClean = Object.fromEntries(
    Object.entries(section.styles || {}).filter(([, v]) => v !== undefined)
  );

  return {
    ...(activeTemplate?.styles || {}),
    ...variantOverrides,
    ...sectionStylesClean,
    background: (() => {
      const saved = (section.styles as any)?.background;
      const fromVariant = (variantOverrides as any)?.background;
      if (!saved) return fromVariant ?? (activeTemplate?.styles as any)?.background;
      if (fromVariant && saved.type !== fromVariant.type && saved.type === 'color' && !saved.color) {
        return { ...fromVariant, overlay: saved.overlay || fromVariant.overlay };
      }
      return saved;
    })(),
  };
}

/**
 * Cascade: Global element defaults -> section's element template defaults -> DB state.
 * Empty-string overrides are treated as cleared (inherit), not as a literal "".
 */
export function resolveElementStyle(
  element: WebsiteElement | null,
  section: Section | null | undefined
): any {
  if (!element) return {};
  const activeTemplate = section ? (SECTION_TEMPLATES[section.type] || null) : null;
  const baseElementDefault = ELEMENT_DEFAULTS[element.type] || {};
  const sectionElementDefault = activeTemplate
    ? activeTemplate.elements?.find((e) => e.type === element.type)?.style
    : {};
  const raw = {
    ...baseElementDefault,
    ...sectionElementDefault,
    ...element.style,
  };
  // Drop empty-string keys so reset-to-inherit works (sidebar onReset writes '').
  return Object.fromEntries(
    Object.entries(raw).filter(([, v]) => v !== '' && v !== undefined)
  );
}

/** True when the element has an explicit (non-empty) override for `key`. */
export function hasElementStyleOverride(
  element: WebsiteElement | null | undefined,
  key: string
): boolean {
  if (!element?.style) return false;
  const v = (element.style as any)[key];
  return v !== undefined && v !== null && v !== '';
}

/**
 * Resolve a single style key with inherit metadata for sidebar ColorInputs.
 * displayValue = override || inheritedFallback (for the picker swatch).
 */
export function resolveElementStyleField(
  element: WebsiteElement | null | undefined,
  key: string,
  inheritedFallback: string,
  section?: Section | null
): { value: string; source: 'override' | 'inherited' } {
  const override = element?.style ? (element.style as any)[key] : undefined;
  if (override !== undefined && override !== null && String(override).trim() !== '') {
    return { value: String(override), source: 'override' };
  }
  const cascaded = resolveElementStyle(element || null, section);
  const fromCascade = cascaded?.[key];
  if (fromCascade !== undefined && fromCascade !== null && String(fromCascade).trim() !== '') {
    // Cascade may still be DNA default — treat as inherited for UI unless it was on element.style
    return { value: String(fromCascade), source: 'inherited' };
  }
  return { value: inheritedFallback || '', source: 'inherited' };
}
