import React from 'react';
import { Section, WebsiteElement } from '../../../../types';
import { ElementsSection } from '../../homepage/ElementsSection';
import { PRESET_THEMES } from '../../../../constants';
import { motion } from 'motion/react';

interface Props {
  section: Section;
  onTextEdit: (key: any, value: string) => void;
  buttonClass: string;
  onElementSelect?: (elementId: string, element?: WebsiteElement) => void;
  onElementUpdate?: (elementId: string, updates: any) => void;
  selectedElementId?: string | null;
  readOnly?: boolean;
  themeColors?: any;
}

const USPS = [
  { icon: 'fa-tag',            title: 'Upfront Flat-Rate Pricing',    description: 'You approve the price before any work begins — no hourly surprises, no hidden fees, ever.' },
  { icon: 'fa-bolt',          title: 'Same-Day Availability',        description: 'Most jobs are handled the very same day you call, so problems never have time to get worse.' },
  { icon: 'fa-user-graduate', title: 'Master-Certified Technicians', description: 'Our team holds the highest industry certifications and trains continuously on the latest methods.' },
  { icon: 'fa-shield-halved', title: 'Lifetime Workmanship Warranty',description: 'We stand behind our work for life — if anything fails, we return and make it right at no cost.' },
  { icon: 'fa-location-dot',  title: 'Transparent Live Updates',     description: 'Track your technician in real time and get clear photo updates throughout every single job.' },
  { icon: 'fa-house-chimney', title: 'Locally Owned & Trusted',      description: 'A proud part of this community for years, with thousands of happy neighbours who recommend us.' },
];

/**
 * USPDefault — About page "What Makes Us Different" grid.
 * Follows the homepage WhyChoosePlumbing pattern: theme-driven light colors,
 * white surface lock, left-icon list cards, all editable via ElementsSection.
 */
export const USPDefault: React.FC<Props> = ({
  section, onTextEdit, buttonClass, onElementSelect, onElementUpdate,
  selectedElementId, readOnly = false, themeColors: tc,
}) => {
  const { content, styles } = section;
  const s = styles as any;

  // Theme tokens from the LIGHT palette (tc.light) — same as homepage
  // WhyChoosePlumbing, so colors track the active theme on theme-switch.
  const lc = tc?.light || {};
  const fb = lc.featureBox || {};
  const accent     = lc.accentColor || tc?.accentColor || '#E11D48';
  const titleColor = fb.titleColor || lc.titleColor || '#111827';
  const textColor  = fb.textColor  || lc.textColor  || '#4B5563';
  const iconColor  = fb.iconColor  || lc.iconColor  || accent;
  const iconBg     = fb.iconBg     || lc.iconBgColor || `${accent}15`;
  const cardBg     = fb.background || lc.cardBackgroundColor || '#FFFFFF';
  const cardBorder = fb.border     || lc.cardBorderColor     || 'rgba(0,0,0,0.08)';

  const savedBg = s.backgroundColor;
  const isThemeSurface = (() => {
    if (!savedBg || typeof savedBg !== 'string') return true;
    const norm = savedBg.trim().toLowerCase();
    return PRESET_THEMES.some(t => {
      const dark  = (t.elements?.surface || '').toLowerCase();
      const light = ((t.elements as any)?.light?.surface || '').toLowerCase();
      return norm === dark || norm === light;
    });
  })();
  const bg = isThemeSurface ? '#FFFFFF' : savedBg;

  const isCssValue = (v: any) => typeof v === 'string' && /(px|rem|em|%|vh|vw)$/.test(v.trim());
  const padT = s.paddingTop    ?? 'pt-10 sm:pt-12 lg:pt-16';
  const padB = s.paddingBottom ?? 'pb-10 sm:pb-12 lg:pb-16';
  const padX = s.paddingX      ?? 'px-4 sm:px-6';
  const innerClass = `max-w-7xl mx-auto ${isCssValue(padX) ? '' : padX} ${isCssValue(padT) ? '' : padT} ${isCssValue(padB) ? '' : padB}`.trim();
  const innerStyle: React.CSSProperties = {
    ...(isCssValue(padX) ? { paddingLeft: padX, paddingRight: padX } : {}),
    ...(isCssValue(padT) ? { paddingTop: padT } : {}),
    ...(isCssValue(padB) ? { paddingBottom: padB } : {}),
  };
  const textAlignClass = s.textAlign === 'left' ? 'text-left' : s.textAlign === 'right' ? 'text-right' : 'text-center';
  const hideAllIcons = !!(content as any).hideIcons;

  // Backend `difference` schema: array (or items) of { title, description, iconClass }
  const source = Array.isArray(content.items) && content.items.length > 0 ? content.items
    : Array.isArray(content.difference) && content.difference.length > 0 ? content.difference
    : null;
  const rawUsps = source
    ? source.map((item: any, i: number) => {
        const iconFallback = USPS[i % 6].icon;
        return {
          icon: String(item.iconClass || item.icon || iconFallback).replace(/^fas?\s+/, '').trim() || iconFallback,
          title: String(item.title || '').trim() || `Differentiator ${i + 1}`,
          description: String(item.description || item.subText || '').trim(),
        };
      }).filter((it: any) => it.title && it.description)
    : (readOnly ? [] : USPS);

  const themeColors = {
    ...tc,
    titleColor, textColor, accentColor: accent,
    iconColor, iconBgColor: iconBg,
    secondaryHeadingColor: accent,
    featureBoxBackground: cardBg,
    featureBoxBorder:     cardBorder,
    featureBoxIconColor:  iconColor,
    featureBoxIconBg:     iconBg,
    featureBoxTitleColor: titleColor,
    featureBoxTextColor:  textColor,
  };

  const passThrough = {
    onTextEdit,
    onElementUpdate: onElementUpdate || (() => {}),
    onElementSelect,
    selectedElementId,
    readOnly,
    isWrapped: false,
    buttonClass,
    themeColors,
  } as const;

  const apiBadgeText = String(content.badgeText || '').trim();
  const apiTitleText = String(content.title || content.heading || '').trim();
  const apiIntroText = String((content as any).intro || content.subtitle || content.description || '').trim();

  const badgeEl: WebsiteElement = section.elements?.find(e => e.id === `${section.id}-usp-badge`) || {
    id: `${section.id}-usp-badge`, type: 'badge',
    content: { text: content.badgeText || 'Why We\'re Different', icon: 'fa-wand-magic-sparkles', iconPosition: 'left', iconSize: '0.65rem' },
    style: {
      fontSize: '0.72rem', fontWeight: '700', letterSpacing: '0.12em',
      textTransform: 'uppercase' as any, padding: '6px 14px', borderRadius: '9999px',
      textAlign: 'center' as any,
    },
  };
  const badgeElResolved: WebsiteElement = {
    ...badgeEl,
    content: {
      ...(badgeEl.content || {}),
      text: apiBadgeText || String((badgeEl.content as any)?.text || '').trim() || "Why We're Different",
    },
  };

  const titleEl: WebsiteElement = (() => {
    const id = `${section.id}-usp-title`;
    const existing = section.elements?.find(e => e.id === id);
    const cc = (existing?.content || {}) as any;
    const sourceText: string = (
      (readOnly ? apiTitleText : '') ||
      cc.text ||
      content.title ||
      'What Makes Us Different'
    ).toString().replace(/<[^>]+>/g, '').trim();
    const words = sourceText.split(/\s+/).filter(Boolean);
    let textBefore = '';
    let highlightedText = sourceText;
    if (words.length > 1) { highlightedText = words[words.length - 1]; textBefore = words.slice(0, -1).join(' '); }
    const base: WebsiteElement = existing || {
      id, type: 'heading',
      content: { text: sourceText, textBefore, highlightedText, textAfter: '', htmlTag: 'h2' },
      style: { fontWeight: '800', fontSize: 'clamp(1.75rem, 3.5vw, 2.75rem)', lineHeight: '1.15', letterSpacing: '-0.02em' },
    };
    return { ...base, content: { ...(base.content || {}), text: sourceText, textBefore, highlightedText, textAfter: '', htmlTag: base.content?.htmlTag || 'h2' } };
  })();

  const descEl: WebsiteElement = section.elements?.find(e => e.id === `${section.id}-usp-desc`) || {
    id: `${section.id}-usp-desc`, type: 'text',
    content: { text: String((content as any).intro || content.subtitle || 'The advantages that set us apart from everyone else in the industry.'), textSize: 'large' },
    style: { textAlign: 'center' as any, maxWidth: '580px', margin: '0 auto', lineHeight: '1.65' },
  };
  const descElResolved: WebsiteElement = {
    ...descEl,
    content: {
      ...(descEl.content || {}),
      text:
        (readOnly ? apiIntroText : '') ||
        String((descEl.content as any)?.text || '').trim() ||
        'The advantages that set us apart from everyone else in the industry.',
    },
  };

  // Left-icon list card (same style as WhyChoose): accent left-stripe + tint bg.
  const getUspEl = (i: number): WebsiteElement => {
    const id = `${section.id}-usp-card${i}`;
    const existing = section.elements?.find(e => e.id === id);
    if (existing) {
      return hideAllIcons
        ? { ...existing, content: { ...(existing.content || {}), icon: 'none' } }
        : existing;
    }
    return {
      id, type: 'feature-box',
      content: {
        icon: hideAllIcons ? 'none' : rawUsps[i].icon,
        text: rawUsps[i].title,
        subText: rawUsps[i].description,
        iconPosition: 'left',
      },
      style: {
        iconContainerSize: '2.75rem',
        iconBorderRadius:  '0.625rem',
        titleFontSize:     '1.05rem',
        titleFontWeight:   '700',
        descriptionFontSize: '0.875rem',
        borderWidth:       '0',
        borderLeftWidth:   '4px',
        borderLeftStyle:   'solid',
        borderLeftColor:   accent,
        borderRadius:      '0',
        borderTopRightRadius:    '0.625rem',
        borderBottomRightRadius: '0.625rem',
        padding: '1.25rem 1.5rem',
        backgroundColor: `${accent}08`,
        textAlign: 'left' as any,
        descriptionAlign: 'left' as any,
        titleAlign: 'left' as any,
        gap: '1rem',
      } as any,
    };
  };

  return (
    <div className={`w-full ${textAlignClass}`} style={{ backgroundColor: bg }}>
      <div className={innerClass} style={innerStyle}>

        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          transition={{ duration: 0.6 }} className="text-center mb-4">
          <div className="flex justify-center mb-4">
            <ElementsSection section={{ ...section, elements: [badgeElResolved] }} {...passThrough} />
          </div>
          <ElementsSection section={{ ...section, elements: [titleEl] }} {...passThrough} />
        </motion.div>

        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }} className="flex justify-center mb-10 sm:mb-14">
          <ElementsSection section={{ ...section, elements: [descElResolved] }} {...passThrough} />
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
          {rawUsps.map((_u: any, i: number) => (
            <motion.div key={i}
              initial={{ opacity: 0, x: i % 2 === 0 ? -24 : 24 }} whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.07 }}
              className="transition-all duration-300 hover:translate-x-1"
            >
              <ElementsSection section={{ ...section, elements: [getUspEl(i)] }} {...passThrough} />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};
