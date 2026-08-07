import React from 'react';
import type { Section, WebsiteElement } from '../../../types';
import { sanitizeSeedElements } from '../../../elements';

/**
 * useCanvasVariantSeed — shared seeding for Canvas-based section variants.
 *
 * Each Canvas variant (HeroCanvas, HeroCanvasSplit, HeroCanvasSpotlight, …) ships
 * a distinct design as a set of pre-built elements. The problem this solves: when
 * the user switches variants, the section already has the PREVIOUS variant's
 * elements, so a naive "seed only when empty" check never fires and every variant
 * looks the same as the first one.
 *
 * This hook gives each variant a unique `prefix` (e.g. 'hc-', 'hs-', 'sp-'). It
 * seeds the variant's design when the section has NO elements OR when the existing
 * elements belong to a DIFFERENT Canvas variant (their ids don't start with this
 * variant's prefix). A user's own edits to THIS variant are preserved, because
 * once this variant's elements are present the prefix matches and no re-seed runs.
 *
 * Seed styles are sanitized so theme color keys are not persisted as fake overrides.
 *
 * Returns the section to render (seeded or the real one).
 */

// A canvas element id looks like `${prefix}${section.id}-...`. We consider the
// section to "belong" to this variant if ANY top-level element id starts with the
// prefix. (Children live inside row/column elements, so top-level is enough.)
function belongsToVariant(elements: WebsiteElement[] | undefined, prefix: string): boolean {
  if (!Array.isArray(elements) || elements.length === 0) return false;
  return elements.some((e) => typeof e.id === 'string' && e.id.startsWith(prefix));
}

export interface CanvasVariantSeedOptions {
  /** Unique per-variant id prefix, e.g. 'hs-'. Must match the ids buildElements produces. */
  prefix: string;
  buildElements: (section: Section) => WebsiteElement[];
  /** Optional: seed section styles too (e.g. background image / min-height). Merged over existing. */
  buildStyles?: (section: Section) => any;
  onSectionUpdate?: (sectionId: string, updates: any) => void;
  readOnly?: boolean;
}

export function useCanvasVariantSeed(
  section: Section,
  { prefix, buildElements, buildStyles, onSectionUpdate, readOnly }: CanvasVariantSeedOptions
): Section {
  const needsSeed = !belongsToVariant(section.elements, prefix);

  const seeded = React.useMemo<Section>(() => {
    if (!needsSeed) return section;
    const next: Section = {
      ...section,
      elements: sanitizeSeedElements(buildElements(section)),
    };
    if (buildStyles) next.styles = buildStyles(section);
    return next;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needsSeed, section]);

  // Persist the seed into real app state once, so the first edit/delete/reorder
  // operates on the full element list (and the switch actually "sticks").
  React.useEffect(() => {
    if (needsSeed && !readOnly && onSectionUpdate) {
      const updates: any = { elements: seeded.elements };
      if (buildStyles) updates.styles = seeded.styles;
      onSectionUpdate(section.id, updates);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needsSeed, section.id]);

  return seeded;
}
