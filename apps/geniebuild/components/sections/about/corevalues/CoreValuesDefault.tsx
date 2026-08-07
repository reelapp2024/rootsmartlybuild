import React from 'react';
import { Section, WebsiteElement } from '../../../../types';
import { ElementsSection } from '../../homepage/ElementsSection';
import { PRESET_THEMES } from '../../../../constants';
import { motion } from 'motion/react';
import { resolveSectionBackground } from '../../../../utils/sectionBackground';
import { resolveSectionElement, elementFromExistingOrDna } from '../../../../elements';

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

const VALUES = [
  { icon: 'fa-user-check',    title: 'Customer First',    description: 'Every decision we make starts with what is best for the customers and community we serve.' },
  { icon: 'fa-user-tie',      title: 'Professional Team', description: 'Skilled, certified professionals who take genuine pride in delivering exceptional workmanship.' },
  { icon: 'fa-leaf',          title: 'Eco-Friendly',      description: 'We use sustainable practices and products that protect both your home and the environment.' },
  { icon: 'fa-award',         title: 'Quality Standards', description: 'We never cut corners — only the highest standards of quality and durability on every job.' },
  { icon: 'fa-clock',         title: 'Reliability',       description: 'On time, every time. You can count on us to show up and get the job done right.' },
  { icon: 'fa-shield-halved', title: 'Trust & Safety',    description: 'Fully licensed, insured and background-checked for your complete peace of mind.' },
];

/**
 * CoreValuesDefault — About page "Our Core Values" grid.
 * Follows the homepage WhyChoosePlumbing pattern exactly: theme-driven light
 * colors (tc.light + featureBox), white surface lock, and every element rendered
 * through ElementsSection so it is fully editable in the builder.
 */
export const CoreValuesDefault: React.FC<Props> = ({
  section, onTextEdit, buttonClass, onElementSelect, onElementUpdate,
  selectedElementId, readOnly = false, themeColors: tc,
}) => {
  const { content, styles } = section;
  const s = styles as any;

  // Colors from the LIGHT palette (tc.light) — exactly like the homepage
  // WhyChoosePlumbing section. SectionRenderer builds tc.light from the active
  // theme and updates it on theme-switch, so these stay theme-consistent.
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
  const bgStyle = resolveSectionBackground(s, { defaultSurface: bg });

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

  // Backend `corevalues` schema: { intro, items: [{ title, iconClass, description }] }
  const rawValues = (content.items && content.items.length > 0)
    ? content.items.map((item: any, i: number) => {
        const iconFallback = VALUES[i % 6].icon;
        return {
          icon: String(item.iconClass || item.icon || iconFallback).replace(/^fas?\s+/, '').trim() || iconFallback,
          title: String(item.title || '').trim() || `Value ${i + 1}`,
          description: String(item.description || item.subText || '').trim(),
        };
      }).filter((it: any) => it.title && it.description)
    : (readOnly ? [] : VALUES);

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

  const badgeEl: WebsiteElement = resolveSectionElement(section, {
    id: `${section.id}-cv-badge`, type: 'badge',
    content: { text: content.badgeText || 'Our Values', icon: 'fa-heart', iconPosition: 'left', iconSize: '0.65rem' },
    style: { fontSize: '0.72rem', fontWeight: '700', letterSpacing: '0.12em',
      textTransform: 'uppercase' as any, padding: '6px 14px', borderRadius: '9999px',
      textAlign: 'center' as any,
    },
  });

  const titleEl: WebsiteElement = (() => {
    const id = `${section.id}-cv-title`;
    const existing = section.elements?.find(e => e.id === id);
    const cc = (existing?.content || {}) as any;
    const sourceText: string = (cc.text || content.title || 'Our Core Values').toString().replace(/<[^>]+>/g, '').trim();
    const words = sourceText.split(/\s+/).filter(Boolean);
    let textBefore = '';
    let highlightedText = sourceText;
    if (words.length > 1) { highlightedText = words[words.length - 1]; textBefore = words.slice(0, -1).join(' '); }
    const base: WebsiteElement = elementFromExistingOrDna(existing, {
      id, type: 'heading',
      content: { text: sourceText, textBefore, highlightedText, textAfter: '', htmlTag: 'h2' },
      style: { fontWeight: '800', fontSize: 'clamp(1.75rem, 3.5vw, 2.75rem)', lineHeight: '1.15', letterSpacing: '-0.02em' },
    });
    if (existing) {
      return {
        ...existing,
        type: 'heading',
        content: {
          ...(existing.content || {}),
          htmlTag: (existing.content as any)?.htmlTag || 'h2',
        },
        style: { ...(base.style as any), ...(existing.style as any) },
      } as WebsiteElement;
    }
    return { ...base, content: { ...(base.content || {}), text: sourceText, textBefore, highlightedText, textAfter: '', htmlTag: base.content?.htmlTag || 'h2' } };
  })();

  const descEl: WebsiteElement = resolveSectionElement(section, {
    id: `${section.id}-cv-desc`, type: 'text',
    content: { text: String((content as any).intro || content.subtitle || 'The principles that guide everything we do and define who we are.'), textSize: 'large' },
    style: { textAlign: 'center' as any, maxWidth: '580px', margin: '0 auto', lineHeight: '1.65' },
  });

  const getValueEl = (i: number): WebsiteElement => {
    const id = `${section.id}-cv-card${i}`;
    const existing = section.elements?.find(e => e.id === id);
    if (existing) {
      return hideAllIcons
        ? { ...existing, content: { ...(existing.content || {}), icon: 'none' } }
        : existing;
    }
    return {
      id, type: 'feature-box',
      content: {
        icon: hideAllIcons ? 'none' : rawValues[i].icon,
        text: rawValues[i].title,
        subText: rawValues[i].description,
        iconPosition: 'top',
      },
      style: { iconContainerSize: '3rem',
        iconBorderRadius:  '0.75rem',
        titleFontSize:     '1.0625rem',
        titleFontWeight:   '700',
        descriptionFontSize: '0.875rem',
        borderWidth:       '1px',
        borderStyle:       'solid',
        borderRadius:      '1rem',
        padding:           '1.5rem',
        
        textAlign:         'center' as any,
        titleAlign:        'center' as any,
        descriptionAlign:  'center' as any} as any,
    };
  };

  return (
    <div className={`w-full ${textAlignClass}`} style={{ ...bgStyle }}>
      <div className={innerClass} style={innerStyle}>

        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          transition={{ duration: 0.6 }} className="text-center mb-4">
          <div className="flex justify-center mb-4">
            <ElementsSection section={{ ...section, elements: [badgeEl] }} {...passThrough} />
          </div>
          <ElementsSection section={{ ...section, elements: [titleEl] }} {...passThrough} />
        </motion.div>

        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }} className="flex justify-center mb-10 sm:mb-14">
          <ElementsSection section={{ ...section, elements: [descEl] }} {...passThrough} />
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {rawValues.map((_v: any, i: number) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.5, delay: (i % 3) * 0.08 }}
            >
              <ElementsSection section={{ ...section, elements: [getValueEl(i)] }} {...passThrough} />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};
