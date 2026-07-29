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

const METHOD_META = [
  { kind: 'phone', icon: 'fa-phone', title: 'Call Us' },
  { kind: 'email', icon: 'fa-envelope', title: 'Email Us' },
  { kind: 'address', icon: 'fa-location-dot', title: 'Visit Us' },
  { kind: 'hours', icon: 'fa-clock', title: 'Office Hours' },
];

/**
 * ContactInfoDefault — "how to reach us" cards grid. Follows the homepage
 * WhyChoosePlumbing light pattern: theme colors from tc.light + featureBox, white
 * surface lock, every element rendered through ElementsSection (fully editable).
 *
 * Phone / email / address / hours come from AboutUs (live + generation enrich).
 * Badge / title / subtitle are AI-generated marketing copy.
 */
export const ContactInfoDefault: React.FC<Props> = ({
  section, onTextEdit, buttonClass, onElementSelect, onElementUpdate,
  selectedElementId, readOnly = false, themeColors: tc,
}) => {
  const { content, styles } = section;
  const s = styles as any;

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

  const contentItems = Array.isArray(content.items) ? content.items : [];
  const displayItems = METHOD_META.map((meta, i) => {
    const item = contentItems.find((it: any) => String(it?.kind || '').toLowerCase() === meta.kind)
      || contentItems[i]
      || {};
    const description = String(item.description || item.value || item.helperText || '').trim();
    return {
      kind: meta.kind,
      icon: String(item.icon || item.iconClass || meta.icon).replace(/^fas?\s+/, '').trim() || meta.icon,
      title: String(item.title || meta.title).trim() || meta.title,
      description,
    };
  });

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

  const badgeEl: WebsiteElement = section.elements?.find(e => e.id === `${section.id}-ci-badge`) || {
    id: `${section.id}-ci-badge`, type: 'badge',
    content: { text: content.badgeText || 'Get In Touch', icon: 'fa-headset', iconPosition: 'left', iconSize: '0.65rem' },
    style: {
      fontSize: '0.72rem', fontWeight: '700', letterSpacing: '0.12em',
      textTransform: 'uppercase' as any, padding: '6px 14px', borderRadius: '9999px',
      textAlign: 'center' as any,
    },
  };

  const titleEl: WebsiteElement = (() => {
    const id = `${section.id}-ci-title`;
    const existing = section.elements?.find(e => e.id === id);
    const cc = (existing?.content || {}) as any;
    const sourceText: string = (cc.text || content.title || 'Ways to Reach Us').toString().replace(/<[^>]+>/g, '').trim();
    const words = sourceText.split(/\s+/).filter(Boolean);
    let textBefore = '';
    let highlightedText = sourceText;
    if (words.length > 1) { highlightedText = words[words.length - 1]; textBefore = words.slice(0, -1).join(' '); }
    const base: WebsiteElement = existing || {
      id, type: 'heading',
      content: { text: sourceText, textBefore, highlightedText, textAfter: '', htmlTag: 'h2' },
      style: { fontWeight: '800', fontSize: 'clamp(1.75rem, 3.5vw, 2.75rem)', lineHeight: '1.15', letterSpacing: '-0.02em' },
    };
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

  const descEl: WebsiteElement = (() => {
    const id = `${section.id}-ci-desc`;
    const existing = section.elements?.find(e => e.id === id);
    const apiText = String(content.subtitle || (content as any).intro || '').trim();
    const existingText = String((existing?.content as any)?.text || '').trim();
    const text = (readOnly ? (apiText || existingText) : (existingText || apiText))
      || 'Choose whatever way works best for you — we\'re always happy to help.';
    const base: WebsiteElement = existing || {
      id, type: 'text',
      content: { text, textSize: 'large' },
      style: { textAlign: 'center' as any, maxWidth: '580px', margin: '0 auto', lineHeight: '1.65' },
    };
    return { ...base, content: { ...(base.content as any), text, textSize: (base.content as any)?.textSize || 'large' } };
  })();

  const getMethodEl = (i: number): WebsiteElement => {
    const id = `${section.id}-ci-card${i}`;
    const item = displayItems[i];
    const existing = section.elements?.find(e => e.id === id);
    if (existing) {
      const ec = (existing.content || {}) as any;
      // Live / published: always prefer AboutUs-enriched content.items descriptions
      const titleOut = readOnly
        ? (item.title || ec.text || '')
        : (String(ec.text || item.title || '').trim() || item.title);
      const descOut = readOnly
        ? (item.description || ec.subText || '')
        : (String(ec.subText || item.description || '').trim() || item.description);
      return {
        ...existing,
        content: {
          ...ec,
          icon: hideAllIcons ? 'none' : (ec.icon === 'none' ? 'none' : (item.icon || ec.icon)),
          text: titleOut,
          subText: descOut,
          iconPosition: ec.iconPosition || 'top',
        },
      };
    }
    return {
      id, type: 'feature-box',
      content: {
        icon: hideAllIcons ? 'none' : item.icon,
        text: item.title,
        subText: item.description,
        iconPosition: 'top',
      },
      style: {
        iconContainerSize: '3rem',
        iconBorderRadius:  '0.75rem',
        titleFontSize:     '1.0625rem',
        titleFontWeight:   '700',
        descriptionFontSize: '0.875rem',
        borderWidth:       '1px',
        borderStyle:       'solid',
        borderRadius:      '1rem',
        padding:           '1.5rem',
        backgroundColor:   cardBg,
        textAlign:         'center' as any,
        titleAlign:        'center' as any,
        descriptionAlign:  'center' as any,
      } as any,
    };
  };

  return (
    <div className={`w-full ${textAlignClass}`} style={{ backgroundColor: bg }}>
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
          {displayItems.map((_it, i) => (
            <motion.div key={_it.kind || i}
              initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.5, delay: (i % 4) * 0.08 }}
            >
              <ElementsSection section={{ ...section, elements: [getMethodEl(i)] }} {...passThrough} />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ContactInfoDefault;
