import type { WebsiteData, ElementStyle } from '../../../types';

/**
 * camelCase -> kebab-case for CSS property names.
 * Known camelCase values ("linearGradient", etc.) come from object style
 * properties — we only transform CSS property NAMES, not values.
 */
function toKebab(prop: string): string {
  return prop.replace(/([A-Z])/g, '-$1').toLowerCase();
}

/**
 * A conservative subset of ElementStyle keys we know are valid CSS.
 * Skip structured fields like `background` (object), `backgroundGradient`,
 * `padding` when it's an object, etc. — those need dedicated serializers.
 */
const CSS_SKIP_KEYS = new Set<string>([
  'background',
  'backgroundGradient',
  'backgroundOverlay',
  'hiddenOnDesktop',
  'hiddenOnTablet',
  'hiddenOnMobile',
  // Icon-specific fields — not real CSS, consumed by renderers directly
  'iconSize',
  'iconColor',
  'iconBackgroundColor',
  'iconContainerSize',
  'iconBorderRadius',
  'iconBorderColor',
  'iconBorderStyle',
  'iconBorderWidth',
  'iconBorderTopLeftRadius',
  'iconBorderTopRightRadius',
  'iconBorderBottomLeftRadius',
  'iconBorderBottomRightRadius',
  'iconShadow',
  'iconBgColor',
  // Button/section meta keys
  'buttonVariant',
  'accentColor',
  'subheadingColor',
  'secondaryHeadingColor',
  'secondaryButtonBorderColor',
]);

/**
 * Serialize an ElementStyle partial to a CSS declaration list.
 * Returns '' if nothing valid to emit.
 */
function styleToCssDecls(style: Partial<ElementStyle>): string {
  const parts: string[] = [];
  for (const key of Object.keys(style)) {
    if (CSS_SKIP_KEYS.has(key)) continue;
    const value = (style as Record<string, unknown>)[key];
    if (value === undefined || value === null || value === '') continue;

    // Handle padding/margin object-form: { top, right, bottom, left }
    if ((key === 'padding' || key === 'margin') && typeof value === 'object' && value !== null) {
      const v = value as { top?: string; right?: string; bottom?: string; left?: string };
      const t = v.top || '0';
      const r = v.right || '0';
      const b = v.bottom || '0';
      const l = v.left || '0';
      parts.push(`${key}: ${t} ${r} ${b} ${l} !important`);
      continue;
    }

    if (typeof value !== 'string' && typeof value !== 'number') continue;
    parts.push(`${toKebab(key)}: ${value} !important`);
  }
  return parts.join('; ');
}

/** Browser breakpoints the builder's device toolbar uses. */
const TABLET_MAX = 1023; // mobile + tablet ≤ 1023px
const MOBILE_MAX = 767;  // mobile ≤ 767px

/**
 * Generate CSS that applies per-element `tabletStyle` / `mobileStyle` overrides
 * via media queries, targeted by `[data-element-id="..."]`.
 * Section renderers need to set `data-element-id={el.id}` on the element root
 * for this to take effect — if they don't yet, the override is simply a no-op.
 *
 * Returns '' when no overrides exist.
 */
/** Keys that belong on the section wrapper (background, overlays, borders). */
const WRAPPER_KEYS = new Set<string>([
  'backgroundColor',
  'backgroundImage',
  'backgroundPosition',
  'backgroundSize',
  'backgroundRepeat',
  'backgroundAttachment',
  'border',
  'borderColor',
  'borderWidth',
  'borderStyle',
  'borderRadius',
  'borderTopLeftRadius',
  'borderTopRightRadius',
  'borderBottomLeftRadius',
  'borderBottomRightRadius',
  'minHeight',
  'height',
  'opacity',
  'filter',
  'boxShadow',
]);

/** Split styles into wrapper-targeted vs inner-container-targeted groups. */
function splitSectionStylesByTarget(styles: Record<string, unknown>): { wrapper: Record<string, unknown>; inner: Record<string, unknown> } {
  const wrapper: Record<string, unknown> = {};
  const inner: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(styles)) {
    if (WRAPPER_KEYS.has(k)) wrapper[k] = v;
    else inner[k] = v;
  }
  return { wrapper, inner };
}

export function buildResponsiveOverrideCss(siteData: WebsiteData): string {
  const tabletDecls: string[] = [];
  const mobileDecls: string[] = [];

  siteData.sections.forEach((section) => {
    // Section-level overrides — padding/typography go to the max-w-* inner container
    // (which is the first div child in every plumbing section), while bg/borders
    // stay on the wrapper. This mirrors the section components' own DOM layering.
    const pushSectionOverride = (src: Record<string, unknown> | undefined, bucket: string[]) => {
      if (!src || !Object.keys(src).length) return;
      const { wrapper, inner } = splitSectionStylesByTarget(src);
      const wrapperCss = styleToCssDecls(wrapper as Partial<ElementStyle>);
      const innerCss = styleToCssDecls(inner as Partial<ElementStyle>);
      if (wrapperCss) bucket.push(`[data-section-id="${section.id}"]{${wrapperCss}}`);
      // Inner overrides apply to:
      //   1. The content wrapper (data-section-content) — top-level padding/bg
      //   2. Its max-w-* first-level container — where plumbing sections place
      //      their padding via Tailwind classes (pt-16 lg:pt-28 etc.)
      // We use [class*="max-w-"] to match any max-w variant without hard-coding.
      if (innerCss) bucket.push(
        `[data-section-content="${section.id}"], ` +
        `[data-section-content="${section.id}"] [class*="max-w-"]{${innerCss}}`
      );
    };
    pushSectionOverride(section.tabletStyles as Record<string, unknown> | undefined, tabletDecls);
    pushSectionOverride(section.mobileStyles as Record<string, unknown> | undefined, mobileDecls);

    // Element-level overrides
    section.elements?.forEach((el) => {
      if (el.tabletStyle && Object.keys(el.tabletStyle).length) {
        const css = styleToCssDecls(el.tabletStyle);
        if (css) tabletDecls.push(`[data-element-id="${el.id}"]{${css}}`);
      }
      if (el.mobileStyle && Object.keys(el.mobileStyle).length) {
        const css = styleToCssDecls(el.mobileStyle);
        if (css) mobileDecls.push(`[data-element-id="${el.id}"]{${css}}`);
      }
    });
  });

  let out = '';
  if (tabletDecls.length) {
    out += `@media (max-width: ${TABLET_MAX}px) { ${tabletDecls.join(' ')} }\n`;
  }
  if (mobileDecls.length) {
    out += `@media (max-width: ${MOBILE_MAX}px) { ${mobileDecls.join(' ')} }\n`;
  }
  return out;
}

export type EditBreakpoint = 'desktop' | 'tablet' | 'mobile';

/**
 * Given the current edit breakpoint, return which field on WebsiteElement
 * to read/write styles from.
 */
export function styleFieldForBreakpoint(bp: EditBreakpoint): 'style' | 'tabletStyle' | 'mobileStyle' {
  if (bp === 'mobile') return 'mobileStyle';
  if (bp === 'tablet') return 'tabletStyle';
  return 'style';
}

/**
 * Same as `styleFieldForBreakpoint` but for Section-level fields.
 */
export function sectionStylesFieldForBreakpoint(bp: EditBreakpoint): 'styles' | 'tabletStyles' | 'mobileStyles' {
  if (bp === 'mobile') return 'mobileStyles';
  if (bp === 'tablet') return 'tabletStyles';
  return 'styles';
}

/**
 * Given a section, return a NEW section whose `styles` and each element's
 * `style` has the active breakpoint's overrides merged on top — for DISPLAY
 * ONLY. Don't pass the returned section back to update handlers, because
 * writing its merged `styles` would corrupt the base styles (which are
 * desktop-only).
 *
 * For tablet view, tablet overrides are merged.
 * For mobile view, BOTH tablet AND mobile overrides are merged (mobile wins)
 * because mobile ⊂ tablet breakpoint (≤767 also matches ≤1023).
 *
 * The merged elements keep their original base `style` PLUS overrides — so
 * section children see the effective style for current viewport.
 */
export function resolveSectionForBreakpoint<T extends {
  styles: any;
  tabletStyles?: any;
  mobileStyles?: any;
  elements?: Array<{ style?: any; tabletStyle?: any; mobileStyle?: any; [k: string]: any }>;
  [k: string]: any;
}>(section: T, bp: EditBreakpoint): T {
  if (bp === 'desktop') return section;

  const stylesMerged = {
    ...section.styles,
    ...(section.tabletStyles || {}),
    ...(bp === 'mobile' ? (section.mobileStyles || {}) : {}),
  };

  const elementsMerged = section.elements?.map((el) => {
    if (!el) return el;
    const styleMerged = {
      ...(el.style || {}),
      ...(el.tabletStyle || {}),
      ...(bp === 'mobile' ? (el.mobileStyle || {}) : {}),
    };
    return { ...el, style: styleMerged };
  });

  return { ...section, styles: stylesMerged, elements: elementsMerged };
}
