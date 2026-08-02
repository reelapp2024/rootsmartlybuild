import React from 'react';
import { Section, WebsiteElement } from '../../../types';
import { CanvasFreeform } from './CanvasFreeform';
import { PALETTE_ELEMENTS, createCanvasElement } from './canvasElementFactory';

interface Props {
  section: Section;
  onTextEdit: (key: any, value: string) => void;
  buttonClass: string;
  onElementSelect?: (elementId: string, element?: WebsiteElement) => void;
  onElementUpdate?: (elementId: string, updates: any) => void;
  selectedElementId?: string | null;
  readOnly?: boolean;
  themeColors?: any;
  isSelected?: boolean;
  onSectionUpdate?: (sectionId: string, updates: any) => void;
}

/**
 * CanvasShowcase — a Canvas section pre-filled with EVERY element type.
 *
 * Seeds one of each element from the Canvas palette (heading, text, image,
 * button, card, list, accordion, tabs, pricing, counter, row, …) as real,
 * individually-editable Canvas elements, then renders them through
 * CanvasFreeform. Every element can be edited / deleted / reordered /
 * duplicated / hidden — the whole section IS Canvas elements.
 *
 * Replaces the old AllElementsTest demo section. Nothing legacy is reused.
 */

/** Build one element of every palette type for this section. */
function buildShowcaseElements(section: Section): WebsiteElement[] {
  const seen = new Set<string>();
  const out: WebsiteElement[] = [];
  for (const p of PALETTE_ELEMENTS) {
    if (seen.has(p.type)) continue;
    seen.add(p.type);
    out.push(createCanvasElement(section.id, p.type));
  }
  return out;
}

export const CanvasShowcase: React.FC<Props> = (props) => {
  const { section, onSectionUpdate, readOnly } = props;

  const isEmpty = !section.elements || section.elements.length === 0;

  const seededElements = React.useMemo(
    () => (isEmpty ? buildShowcaseElements(section) : section.elements!),
    [isEmpty, section]
  );
  const seededSection: Section = isEmpty ? { ...section, elements: seededElements } : section;

  // Persist the seeded elements into the real section on first mount, so the
  // first edit/delete/reorder writes against the full list (not an empty one).
  React.useEffect(() => {
    if (isEmpty && !readOnly && onSectionUpdate) {
      onSectionUpdate(section.id, { elements: seededElements });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEmpty, section.id]);

  return <CanvasFreeform {...props} section={seededSection} />;
};

export default CanvasShowcase;
