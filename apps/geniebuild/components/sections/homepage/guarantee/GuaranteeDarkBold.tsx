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
 * GuaranteeDarkBold — Canvas guarantee banner matching the html preview:
 *   Left  : seal icon → badge → heading → subtitle
 *   Right : metric cards (value → label → description) in a 2-up grid.
 *
 * DYNAMIC (API — backend `guarantee`): badgeText, title, subtitle,
 *   metrics[] ({ icon, label, value, description }).
 */

function buildGuarantee(section: Section, tc: any): WebsiteElement[] {
  const id = section.id;
  const c = (section.content || {}) as any;
  const accent = tc?.accentColor || tc?.light?.accentColor || '#FBBF24';
  const titleColor = tc?.titleColor || tc?.light?.titleColor || '#F1F5F9';
  const textColor = tc?.textColor || tc?.light?.textColor || '#94A3B8';
  const mutedColor = tc?.textColorMuted || tc?.muted || '#64748B';
  const surface = tc?.cardBackgroundColor || '#131A28';
  const line = tc?.cardBorderColor || tc?.borderColor || 'rgba(255,255,255,0.14)';

  const badgeText = String(c.badgeText || 'Our promise');
  const title = String(c.title || 'The workmanship guarantee');
  const subtitle = String(c.subtitle || c.description ||
    "If our workmanship ever lets you down, we'll come back and put it right — no arguments, no extra charge. That's our written promise to every customer.");

  const metrics: { value: string; label: string; desc: string; icon: string }[] = (() => {
    const raw = c.metrics || c.items || c.stats;
    if (Array.isArray(raw) && raw.length) {
      return raw.slice(0, 4).map((m: any, i: number) => ({
        value: String(m?.value ?? m?.number ?? '').trim(),
        label: String(m?.label ?? m?.title ?? '').trim(),
        desc: String(m?.description ?? m?.text ?? '').trim(),
        icon: String(m?.icon || ['fa-shield-halved', 'fa-thumbs-up', 'fa-file-invoice-dollar', 'fa-clock'][i % 4]).replace(/^fas?\s+/, ''),
      })).filter((m) => m.value || m.label);
    }
    return [
      { value: '10 yr', label: 'Workmanship', desc: 'In writing, on every job we complete.', icon: 'fa-shield-halved' },
      { value: '100%', label: 'Satisfaction', desc: "We're not done until you're happy.", icon: 'fa-thumbs-up' },
      { value: 'No fee', label: 'Call-out', desc: 'No charge to come and quote a booked job.', icon: 'fa-file-invoice-dollar' },
      { value: '24/7', label: 'Emergency', desc: 'Round-the-clock cover when it matters.', icon: 'fa-clock' },
    ];
  })();

  const leftChildren: WebsiteElement[] = [
    {
      id: `gt-${id}-seal`, type: 'icon',
      content: { icon: 'fa-award', iconSize: '3rem' },
      style: { color: accent, backgroundColor: `${accent}1f`, width: '5.5rem', height: '5.5rem', borderRadius: '9999px', display: 'inline-flex', justifyContent: 'center', alignItems: 'center', borderWidth: '1px', borderStyle: 'solid', borderColor: `${accent}40`, marginBottom: '1.5rem' } as any,
      settings: {},
    },
    { id: `gt-${id}-badge`, type: 'badge', content: { text: badgeText, iconPosition: 'left' }, style: { fontSize: '0.72rem', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase' as any, padding: '7px 14px', borderRadius: '9999px', textAlign: 'left' as any } as any, settings: {} },
    { id: `gt-${id}-title`, type: 'heading', content: { text: title, htmlTag: 'h2' }, style: { color: titleColor, fontWeight: '800', fontSize: 'clamp(1.9rem, 3.2vw, 2.7rem)', lineHeight: '1.1', letterSpacing: '-0.02em', textAlign: 'left' as any, marginTop: '0.75rem' } as any, settings: {} },
    { id: `gt-${id}-subtitle`, type: 'text', content: { text: subtitle, textSize: 'large' }, style: { color: textColor, textAlign: 'left' as any, maxWidth: '480px', lineHeight: '1.7', fontSize: '1.06rem', marginTop: '0.9rem' } as any, settings: {} },
  ];

  const metricCards: WebsiteElement = {
    id: `gt-${id}-metrics`, type: 'row',
    content: {
      columnCount: 2, gap: '1.1rem', verticalAlign: 'stretch',
      children: metrics.map((m, i) => ({
        id: `gt-${id}-metric-${i}`, type: 'stat-card',
        content: { value: m.value, text: m.label, icon: m.icon, subText: m.desc } as any,
        style: { padding: '1.5rem', borderRadius: '1.1rem', backgroundColor: surface, borderWidth: '1px', borderStyle: 'solid', borderColor: line, titleColor: accent, titleFontSize: '1.9rem', titleFontWeight: '800', descriptionColor: textColor, descriptionFontSize: '0.9rem', descriptionFontWeight: '600', iconColor: accent, textAlign: 'left' as any } as any,
        settings: {},
      })),
    } as any,
    style: {} as any,
    settings: {},
  };

  return [
    {
      id: `gt-${id}-row`, type: 'row',
      content: {
        columnCount: 2, gap: '3.5rem', verticalAlign: 'center',
        children: [
          { id: `gt-${id}-colL`, type: 'column', content: { gap: '0', children: leftChildren } as any, style: { alignItems: 'flex-start' } as any, settings: {} },
          { id: `gt-${id}-colR`, type: 'column', content: { gap: '0', children: [metricCards] } as any, style: { alignItems: 'stretch' } as any, settings: {} },
        ],
      } as any,
      style: {} as any,
      settings: {},
    },
  ];
}

function buildStyles(section: Section): any {
  const prev = (section.styles || {}) as any;
  return { ...prev, bgPattern: prev.bgPattern || 'none' };
}

export const GuaranteeDarkBold: React.FC<Props> = (props) => {
  const { section, themeColors: tc, onSectionUpdate, readOnly } = props;
  const seededSection = useCanvasVariantSeed(section, {
    prefix: `gt-${section.id}`,
    buildElements: (s) => buildGuarantee(s, tc),
    buildStyles: (s) => buildStyles(s),
    onSectionUpdate, readOnly,
  });
  return <CanvasFreeform {...props} section={seededSection} />;
};

export default GuaranteeDarkBold;
