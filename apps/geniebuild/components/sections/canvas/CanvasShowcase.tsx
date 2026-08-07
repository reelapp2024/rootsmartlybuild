import React from 'react';
import { Section, WebsiteElement } from '../../../types';
import { CanvasFreeform } from './CanvasFreeform';
import { PALETTE_ELEMENTS, createCanvasElement } from './canvasElementFactory';
import { useCanvasVariantSeed } from './useCanvasVariantSeed';

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
 * CanvasShowcase — Canvas section pre-filled with every palette element type.
 * Seeds via useCanvasVariantSeed (sanitizeSeedElements / SSOT).
 */

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
  const seededSection = useCanvasVariantSeed(section, {
    prefix: 'canvas-',
    buildElements: buildShowcaseElements,
    onSectionUpdate,
    readOnly,
  });
  return <CanvasFreeform {...props} section={seededSection} />;
};

export default CanvasShowcase;
