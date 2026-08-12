import React from 'react';
import { Section, WebsiteElement } from '../../../../types';
import { CanvasFreeform } from '../../canvas/CanvasFreeform';
import { useCanvasVariantSeed } from '../../canvas/useCanvasVariantSeed';

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
 * StatsDarkBold — the dark "proof numbers" band from the html preview: one dark
 * rounded card holding N big stat numbers (value + label), accent on the suffix.
 *
 * DYNAMIC (API — backend `stats`): items[] ({ value, label }).
 */

function buildStats(section: Section, tc: any): WebsiteElement[] {
  const id = section.id;
  const c = (section.content || {}) as any;
  const accent = tc?.accentColor || tc?.light?.accentColor || '#FBBF24';

  // The band itself is always dark (like the html), regardless of section theme.
  const bandBg = '#0F1626';
  const numColor = '#FFFFFF';
  const labelColor = '#94A3B8';

  const items: { value: string; label: string }[] = (() => {
    const raw = Array.isArray(c) ? c : (c.items || c.stats);
    if (Array.isArray(raw) && raw.length) {
      return raw.slice(0, 4).map((it: any) => ({
        value: String(it?.value ?? it?.number ?? '').trim(),
        label: String(it?.label ?? it?.text ?? '').trim(),
      })).filter((it) => it.value);
    }
    return [
      { value: '12,000+', label: 'Jobs completed' },
      { value: '4.9 / 5', label: 'Average rating' },
      { value: '15+', label: 'Years serving the area' },
      { value: '60s', label: 'Average booking time' },
    ];
  })();

  const cols = Math.min(Math.max(items.length, 1), 4);
  const numbersRow: WebsiteElement = {
    id: `st-${id}-row`, type: 'row',
    content: {
      columnCount: cols, gap: '1.5rem', verticalAlign: 'center',
      children: items.map((it, i) => ({
        id: `st-${id}-item-${i}`, type: 'column',
        content: {
          gap: '0.35rem',
          children: [
            { id: `st-${id}-val-${i}`, type: 'heading', content: { text: it.value, htmlTag: 'div' }, style: { color: numColor, fontWeight: '800', fontFamily: 'Sora, sans-serif', fontSize: 'clamp(2.2rem, 3.4vw, 3rem)', lineHeight: '1', textAlign: 'center' as any, highlightColor: accent } as any, settings: {} },
            { id: `st-${id}-lbl-${i}`, type: 'text', content: { text: it.label }, style: { color: labelColor, fontSize: '0.94rem', fontWeight: '500', textAlign: 'center' as any } as any, settings: {} },
          ],
        } as any,
        style: { alignItems: 'center' } as any,
        settings: {},
      })),
    } as any,
    style: {
      backgroundColor: bandBg, borderRadius: '2rem', padding: '3rem 2.5rem',
      borderWidth: '1px', borderStyle: 'solid', borderColor: 'rgba(255,255,255,0.08)',
    } as any,
    settings: {},
  };

  return [numbersRow];
}

function buildStyles(section: Section): any {
  const prev = (section.styles || {}) as any;
  return { ...prev, bgPattern: prev.bgPattern || 'none' };
}

export const StatsDarkBold: React.FC<Props> = (props) => {
  const { section, themeColors: tc, onSectionUpdate, readOnly } = props;
  const seededSection = useCanvasVariantSeed(section, {
    prefix: `st-${section.id}`,
    buildElements: (s) => buildStats(s, tc),
    buildStyles: (s) => buildStyles(s),
    onSectionUpdate, readOnly,
  });
  return <CanvasFreeform {...props} section={seededSection} />;
};

export default StatsDarkBold;
