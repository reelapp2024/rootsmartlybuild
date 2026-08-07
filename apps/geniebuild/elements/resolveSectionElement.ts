import type { Section, WebsiteElement } from '../types';
import { stripInheritedColorKeys } from './inheritedColorKeys';

function mergeContent(
  dnaContent: Record<string, any> | undefined,
  apiContent: Record<string, any> | undefined
): Record<string, any> {
  const base = { ...(dnaContent || {}) };
  if (!apiContent) return base;
  for (const [k, v] of Object.entries(apiContent)) {
    if (v === undefined || v === null) continue;
    // Empty string must not wipe DNA/live section copy (sidebar/canvas desync).
    if (typeof v === 'string' && v.trim() === '') continue;
    base[k] = v;
  }
  return base;
}

function findElement(
  section: Section | null | undefined,
  id: string
): WebsiteElement | undefined {
  return section?.elements?.find((e) => e && e.id === id);
}

export type ResolveSectionElementOptions = {
  /**
   * When true (default), DNA style color keys are stripped so theme owns them
   * until the user sets an explicit override on the API element.
   */
  stripDnaColors?: boolean;
};

/**
 * Single source of truth for section element resolution.
 *
 * Priority:
 *   1. API/DB element (`section.elements` by id) — content + style overrides win
 *   2. DNA fallback (variant default) — structural style only; no theme colors
 *
 * Theme colors are applied at render time in ElementsSection — never baked into
 * DNA style objects (that caused sidebar Inherited ≠ canvas color).
 *
 * Usage:
 *   const titleEl = resolveSectionElement(section, {
 *     id: `${section.id}-title`,
 *     type: 'heading',
 *     content: { text: content.title || 'Default title', htmlTag: 'h2' },
 *     style: { fontWeight: '900', fontSize: 'clamp(...)', textAlign: 'center' },
 *   });
 */
export function resolveSectionElement(
  section: Section | null | undefined,
  dna: WebsiteElement,
  opts: ResolveSectionElementOptions = {}
): WebsiteElement {
  const stripDnaColors = opts.stripDnaColors !== false;
  const dnaStyle = stripDnaColors
    ? stripInheritedColorKeys(dna.style as Record<string, any>)
    : { ...(dna.style || {}) };

  const found = findElement(section, dna.id);

  if (!found) {
    return {
      ...dna,
      id: dna.id,
      type: dna.type,
      content: { ...(dna.content || {}) },
      style: dnaStyle as any,
      settings: dna.settings || {},
    };
  }

  const content = mergeContent(
    dna.content as Record<string, any>,
    found.content as Record<string, any>
  );

  // Structural DNA first, then explicit API/DB overrides (including colors).
  // Empty-string values are intentional clears (e.g. fontSize: '' after picking a
  // textSize preset) — they must remove the DNA key, not fall through to DNA.
  const apiStyle = (found.style || {}) as Record<string, any>;
  const clearedStyleKeys = new Set(
    Object.entries(apiStyle)
      .filter(([, v]) => v === '')
      .map(([k]) => k)
  );
  const style: Record<string, any> = {
    ...dnaStyle,
    ...Object.fromEntries(
      Object.entries(apiStyle).filter(
        ([, v]) => v !== undefined && v !== null && v !== ''
      )
    ),
  };
  clearedStyleKeys.forEach((k) => {
    delete style[k];
  });

  return {
    ...dna,
    ...found,
    id: dna.id,
    type: (found.type || dna.type) as WebsiteElement['type'],
    content,
    style: style as any,
    settings: { ...(dna.settings || {}), ...(found.settings || {}) },
    tabletStyle: found.tabletStyle,
    mobileStyle: found.mobileStyle,
  };
}

/**
 * Coalesce API element or DNA — same rules as resolveSectionElement without a full section.
 * Use when code already did `const existing = section.elements?.find(...)`.
 */
export function elementFromExistingOrDna(
  existing: WebsiteElement | null | undefined,
  dna: WebsiteElement
): WebsiteElement {
  return resolveSectionElement(
    { elements: existing ? [existing] : [] } as Section,
    dna
  );
}

function sanitizeSeedElement(el: WebsiteElement): WebsiteElement {
  const style = stripInheritedColorKeys(el.style as Record<string, any>);
  const content: any = { ...(el.content || {}) };
  // Nested row children
  if (Array.isArray(content.children)) {
    content.children = content.children.map((child: WebsiteElement) =>
      sanitizeSeedElement(child)
    );
  }
  return {
    ...el,
    content,
    style: style as any,
  };
}

/** Sanitize Canvas variant seed trees so theme colors are not persisted as overrides. */
export function sanitizeSeedElements(elements: WebsiteElement[]): WebsiteElement[] {
  return elements.map((el) => sanitizeSeedElement(el));
}
