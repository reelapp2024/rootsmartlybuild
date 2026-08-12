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
 * ProcessDarkBold — Canvas "how it works" steps matching the html preview:
 * centered head + N numbered steps (amber number chip → title → description).
 *
 * DYNAMIC (API — backend `process`): badge, title, description,
 *   items[] ({ title, description, iconClass }).
 */

function buildProcess(section: Section, tc: any): WebsiteElement[] {
  const id = section.id;
  const c = (section.content || {}) as any;

  const accent = tc?.accentColor || tc?.light?.accentColor || '#FBBF24';
  const btnText = tc?.buttonTextColor || '#1A1206';
  const titleColor = tc?.titleColor || tc?.light?.titleColor || '#F1F5F9';
  const textColor = tc?.textColor || tc?.light?.textColor || '#94A3B8';

  const badgeText = String(c.badge || c.badgeText || 'How it works');
  const title = String(c.title || 'Booked and fixed in a few simple steps');
  const subtitle = String(c.description || c.subtitle || "From first call to final flush — here's exactly what to expect.");

  const steps: { title: string; desc: string }[] = (() => {
    const raw = c.items || c.steps;
    if (Array.isArray(raw) && raw.length) {
      return raw.slice(0, 4).map((it: any) => ({
        title: String(it?.title ?? it?.heading ?? '').trim(),
        desc: String(it?.description ?? it?.text ?? '').trim(),
      })).filter((it) => it.title);
    }
    return [
      { title: 'Tell us the problem', desc: 'Call or book online in under a minute — describe the issue and pick a time that suits you.' },
      { title: 'Get a fixed quote', desc: 'We assess the job and give you an upfront, written price before any work begins.' },
      { title: 'We fix it right', desc: 'A vetted local pro arrives on time and completes the work cleanly and carefully.' },
      { title: "Relax — you're covered", desc: 'Every job is backed by our guarantee, so you can forget about it for good.' },
    ];
  })();

  const head: WebsiteElement = {
    id: `pr-${id}-head`, type: 'column',
    content: {
      gap: '0.9rem',
      children: [
        { id: `pr-${id}-badge`, type: 'badge', content: { text: badgeText, iconPosition: 'left' }, style: { fontSize: '0.72rem', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase' as any, padding: '7px 14px', borderRadius: '9999px', textAlign: 'center' as any } as any, settings: {} },
        { id: `pr-${id}-title`, type: 'heading', content: { text: title, htmlTag: 'h2' }, style: { color: titleColor, fontWeight: '800', fontSize: 'clamp(2.1rem, 3.6vw, 3.1rem)', lineHeight: '1.1', letterSpacing: '-0.02em', textAlign: 'center' as any } as any, settings: {} },
        { id: `pr-${id}-subtitle`, type: 'text', content: { text: subtitle, textSize: 'large' }, style: { color: textColor, textAlign: 'center' as any, maxWidth: '640px', lineHeight: '1.7', fontSize: '1.06rem' } as any, settings: {} },
      ],
    } as any,
    style: { alignItems: 'center', marginBottom: '3.5rem' } as any,
    settings: {},
  };

  // Each step = a column: numbered chip (badge) → title (heading) → desc (text).
  const cols = Math.min(Math.max(steps.length, 1), 4);
  const stepsRow: WebsiteElement = {
    id: `pr-${id}-steps`, type: 'row',
    content: {
      columnCount: cols, gap: '1.75rem', verticalAlign: 'stretch',
      children: steps.map((st, i) => ({
        id: `pr-${id}-step-${i}`, type: 'column',
        content: {
          gap: '0.75rem',
          children: [
            {
              id: `pr-${id}-num-${i}`, type: 'badge',
              content: { text: String(i + 1) },
              style: { fontSize: '1.3rem', fontWeight: '800', fontFamily: 'Sora, sans-serif', width: '3.5rem', height: '3.5rem', minWidth: '3.5rem', borderRadius: '1rem', textAlign: 'center' as any, backgroundColor: accent, color: btnText, justifyContent: 'center', display: 'inline-flex' } as any,
              settings: {},
            },
            { id: `pr-${id}-steptitle-${i}`, type: 'heading', content: { text: st.title, htmlTag: 'h3' }, style: { color: titleColor, fontWeight: '700', fontSize: '1.2rem', textAlign: 'left' as any, marginTop: '0.75rem' } as any, settings: {} },
            { id: `pr-${id}-stepdesc-${i}`, type: 'text', content: { text: st.desc }, style: { color: textColor, fontSize: '0.95rem', lineHeight: '1.65', textAlign: 'left' as any } as any, settings: {} },
          ],
        } as any,
        style: { alignItems: 'flex-start' } as any,
        settings: {},
      })),
    } as any,
    style: {} as any,
    settings: {},
  };

  return [head, stepsRow];
}

function buildStyles(section: Section): any {
  const prev = (section.styles || {}) as any;
  return { ...prev, bgPattern: prev.bgPattern || 'none' };
}

export const ProcessDarkBold: React.FC<Props> = (props) => {
  const { section, themeColors: tc, onSectionUpdate, readOnly } = props;
  const seededSection = useCanvasVariantSeed(section, {
    prefix: `pr-${section.id}`,
    buildElements: (s) => buildProcess(s, tc),
    buildStyles: (s) => buildStyles(s),
    onSectionUpdate, readOnly,
  });
  return <CanvasFreeform {...props} section={seededSection} />;
};

export default ProcessDarkBold;
