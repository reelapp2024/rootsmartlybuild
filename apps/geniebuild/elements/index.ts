/**
 * Element SSOT registry — GenieBuild.
 *
 * Each element type owns DNA (defaults) here. Canvas factory, section variants,
 * and resolveSectionElement all share this. Theme colors are NEVER in DNA.
 */
export {
  INHERITED_COLOR_KEYS,
  isInheritedColorKey,
  stripInheritedColorKeys,
} from './inheritedColorKeys';

export {
  resolveSectionElement,
  elementFromExistingOrDna,
  sanitizeSeedElements,
  type ResolveSectionElementOptions,
} from './resolveSectionElement';

export {
  HEADING_DNA_STYLE,
  HEADING_DNA_CONTENT,
  headingDna,
} from './heading/dna';

export {
  TEXT_DNA_STYLE,
  TEXT_DNA_CONTENT,
  textDna,
} from './text/dna';

export {
  BUTTON_DNA_STYLE,
  BUTTON_DNA_CONTENT,
  CTA_BUTTON_DNA_STYLE,
  CTA_BUTTON_DNA_CONTENT,
  buttonDna,
  ctaButtonDna,
} from './button/dna';

export {
  BADGE_DNA_STYLE,
  BADGE_DNA_CONTENT,
  badgeDna,
} from './badge/dna';

import type { WebsiteElement } from '../types';
import { HEADING_DNA_CONTENT, HEADING_DNA_STYLE } from './heading/dna';
import { TEXT_DNA_CONTENT, TEXT_DNA_STYLE } from './text/dna';
import {
  BUTTON_DNA_CONTENT,
  BUTTON_DNA_STYLE,
  CTA_BUTTON_DNA_CONTENT,
  CTA_BUTTON_DNA_STYLE,
} from './button/dna';
import { BADGE_DNA_CONTENT, BADGE_DNA_STYLE } from './badge/dna';

/** Registry: type → structural DNA (content + style, no theme colors). */
export const ELEMENT_DNA: Record<
  string,
  { content: Record<string, any>; style: Record<string, any> }
> = {
  heading: { content: HEADING_DNA_CONTENT, style: HEADING_DNA_STYLE },
  text: { content: TEXT_DNA_CONTENT, style: TEXT_DNA_STYLE },
  button: { content: BUTTON_DNA_CONTENT, style: BUTTON_DNA_STYLE },
  'cta-button': { content: CTA_BUTTON_DNA_CONTENT, style: CTA_BUTTON_DNA_STYLE },
  badge: { content: BADGE_DNA_CONTENT, style: BADGE_DNA_STYLE },
};

export function getElementDna(
  type: WebsiteElement['type'] | string
): { content: Record<string, any>; style: Record<string, any> } | null {
  return ELEMENT_DNA[type] || null;
}
