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

const REASONS = [
  { icon: 'fa-location-dot',       title: 'Local & Nearby',        description: 'Based right in your community — we know the area and get to you fast when you need us.' },
  { icon: 'fa-bolt',               title: 'Same-Day Service',      description: 'Book in the morning, fixed by evening. We keep local schedules tight so you wait less.' },
  { icon: 'fa-id-badge',           title: 'Licensed & Insured',    description: 'Every technician is fully licensed, background-checked and covered — total peace of mind.' },
  { icon: 'fa-hand-holding-dollar',title: 'Honest Pricing',        description: "You'll always know the price before we start. No surprises, no hidden charges." },
  { icon: 'fa-star',               title: '5-Star Rated Locally',  description: 'Hundreds of 5-star reviews from your neighbors who trust us with their homes.' },
  { icon: 'fa-people-group',       title: 'Community Trusted',     description: 'We live and work here too — proud to serve the families and businesses in our area.' },
];

export const LocationWhyChooseDefault: React.FC<Props> = ({
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

  // bg white-lock
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

  // Padding
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

  const rawReasons = (content.items && content.items.length > 0)
    ? content.items.map((item: any, i: number) => ({
        icon:        item.icon        || REASONS[i % 6].icon,
        title:       item.title       || REASONS[i % 6].title,
        description: item.description || REASONS[i % 6].description,
      }))
    : REASONS;

  const themeColors = {
    ...tc,
    titleColor, textColor, accentColor: accent,
    iconColor, iconBgColor: iconBg,
    featureBoxBackground: cardBg,
    featureBoxBorder:     cardBorder,
    featureBoxIconColor:  iconColor,
    featureBoxIconBg:     iconBg,
    featureBoxTitleColor: titleColor,
    featureBoxTextColor:  textColor,
  };

  const badgeEl: WebsiteElement = section.elements?.find(e => e.id === `${section.id}-lwc-badge`) || {
    id: `${section.id}-lwc-badge`, type: 'badge',
    content: { text: content.badgeText || 'Why Us', icon: 'fa-star', iconPosition: 'left', iconSize: '0.65rem' },
    style: {
      fontSize: '0.72rem', fontWeight: '700', letterSpacing: '0.12em',
      textTransform: 'uppercase' as any, padding: '6px 14px', borderRadius: '9999px',
      textAlign: 'center' as any,
      backgroundColor: `${accent}1A`,
      color: accent,
    },
  };

  const titleEl: WebsiteElement = (() => {
    const id = `${section.id}-lwc-title`;
    const existing = section.elements?.find(e => e.id === id);
    const c = (existing?.content || {}) as any;
    const sourceText: string = (c.text || content.title || 'Why Locals Choose Us').toString().replace(/<[^>]+>/g, '').trim();
    const words = sourceText.split(/\s+/).filter(Boolean);
    let textBefore = '';
    let highlightedText = sourceText;
    if (words.length > 1) {
      highlightedText = words[words.length - 1];
      textBefore = words.slice(0, -1).join(' ');
    }
    const base: WebsiteElement = existing || {
      id, type: 'heading',
      content: { text: sourceText, textBefore, highlightedText, textAfter: '', htmlTag: 'h2' },
      style: { fontWeight: '800', fontSize: 'clamp(1.75rem, 3.5vw, 2.75rem)', lineHeight: '1.15', letterSpacing: '-0.02em' },
    };
    return { ...base, content: { ...(base.content || {}), text: sourceText, textBefore, highlightedText, textAfter: '', htmlTag: base.content?.htmlTag || 'h2' } };
  })();

  const descEl: WebsiteElement = section.elements?.find(e => e.id === `${section.id}-lwc-desc`) || {
    id: `${section.id}-lwc-desc`, type: 'text',
    content: { text: content.subtitle || "Your neighbors keep calling us back — here's why we're the local team homeowners trust.", textSize: 'large' },
    style: { textAlign: 'center' as any, maxWidth: '580px', margin: '0 auto', lineHeight: '1.65' },
  };

  const getReasonEl = (i: number): WebsiteElement => {
    const id = `${section.id}-lwc-card${i}`;
    const existing = section.elements?.find(e => e.id === id);
    if (existing) {
      return hideAllIcons
        ? { ...existing, content: { ...(existing.content || {}), icon: 'none' } }
        : existing;
    }
    return {
      id, type: 'feature-box',
      content: {
        icon: hideAllIcons ? 'none' : rawReasons[i].icon,
        text: rawReasons[i].title,
        subText: rawReasons[i].description,
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
            <ElementsSection section={{ ...section, elements: [badgeEl] }} onTextEdit={onTextEdit}
              onElementUpdate={onElementUpdate || (() => {})} onElementSelect={onElementSelect}
              selectedElementId={selectedElementId} readOnly={readOnly} isWrapped={false}
              buttonClass={buttonClass} themeColors={themeColors} />
          </div>
          <ElementsSection section={{ ...section, elements: [titleEl] }} onTextEdit={onTextEdit}
            onElementUpdate={onElementUpdate || (() => {})} onElementSelect={onElementSelect}
            selectedElementId={selectedElementId} readOnly={readOnly} isWrapped={false}
            buttonClass={buttonClass} themeColors={themeColors} />
        </motion.div>

        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }} className="flex justify-center mb-10 sm:mb-14">
          <ElementsSection section={{ ...section, elements: [descEl] }} onTextEdit={onTextEdit}
            onElementUpdate={onElementUpdate || (() => {})} onElementSelect={onElementSelect}
            selectedElementId={selectedElementId} readOnly={readOnly} isWrapped={false}
            buttonClass={buttonClass} themeColors={themeColors} />
        </motion.div>

        {/* Reasons grid — 2 columns on tablet+, slide-right-on-hover. */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
          {rawReasons.map((_r: any, i: number) => (
            <motion.div key={i}
              initial={{ opacity: 0, x: i % 2 === 0 ? -24 : 24 }} whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.07 }}
              className="transition-all duration-300 hover:translate-x-1"
            >
              <ElementsSection section={{ ...section, elements: [getReasonEl(i)] }} onTextEdit={onTextEdit}
                onElementUpdate={onElementUpdate || (() => {})} onElementSelect={onElementSelect}
                selectedElementId={selectedElementId} readOnly={readOnly} isWrapped={false}
                buttonClass={buttonClass} themeColors={themeColors} />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LocationWhyChooseDefault;
