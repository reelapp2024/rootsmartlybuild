import React from 'react';
import { Section, WebsiteElement } from '../../../../types';
import { ElementsSection } from '../../homepage/ElementsSection';
import { PRESET_THEMES } from '../../../../constants';
import { motion } from 'motion/react';
import { resolveSectionBackground } from '../../../../utils/sectionBackground';
import { elementFromExistingOrDna } from '../../../../elements';

interface MissionVisionProps {
  section: Section;
  onTextEdit: (key: any, value: string) => void;
  buttonClass: string;
  onElementSelect?: (elementId: string, element?: WebsiteElement) => void;
  onElementUpdate?: (elementId: string, updates: any) => void;
  selectedElementId?: string | null;
  readOnly?: boolean;
  themeColors?: any;
}

/**
 * MissionVisionDefault — two-column Mission | Vision block for the About page.
 * Follows the homepage light-section pattern (WhyChoosePlumbing): theme-driven
 * colors via tc.light + featureBox tokens, white surface lock, and every element
 * (badge, heading, line, sub-heading rows) rendered through ElementsSection so it
 * is fully editable in the builder.
 */
export const MissionVisionDefault: React.FC<MissionVisionProps> = ({
  section, onTextEdit, buttonClass, onElementSelect, onElementUpdate,
  selectedElementId, readOnly = false, themeColors: tc,
}) => {
  const { content, styles } = section;
  const s = styles as any;
  const c = content as any;

  // ── Theme tokens from the LIGHT palette (tc.light) — same as homepage
  // WhyChoosePlumbing, so colors track the active theme on theme-switch. ──────
  const lc = tc?.light || {};
  const fb = lc.featureBox || {};
  const accent     = lc.accentColor || tc?.accentColor || '#E11D48';
  const titleColor = fb.titleColor || lc.titleColor || '#111827';
  const textColor  = fb.textColor  || lc.textColor  || '#4B5563';
  const iconColor  = fb.iconColor  || lc.iconColor  || accent;
  const iconBg     = fb.iconBg     || lc.iconBgColor || `${accent}15`;
  const cardBg     = fb.background || lc.cardBackgroundColor || '#FFFFFF';
  const cardBorder = fb.border     || lc.cardBorderColor     || 'rgba(0,0,0,0.08)';

  // Background: white-lock on theme switch; user custom (non-theme-surface) wins
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

  // Padding
  const isCssValue = (v: any) => typeof v === 'string' && /(px|rem|em|%|vh|vw)$/.test(v.trim());
  const padT = s.paddingTop    ?? 'pt-10 sm:pt-12 lg:pt-16';
  const padB = s.paddingBottom ?? 'pb-10 sm:pb-12 lg:pb-16';
  const padX = s.paddingX      ?? 'px-4 sm:px-6';
  const innerClass = `max-w-6xl mx-auto ${isCssValue(padX) ? '' : padX} ${isCssValue(padT) ? '' : padT} ${isCssValue(padB) ? '' : padB}`.trim();
  const innerStyle: React.CSSProperties = {
    ...(isCssValue(padX) ? { paddingLeft: padX, paddingRight: padX } : {}),
    ...(isCssValue(padT) ? { paddingTop: padT } : {}),
    ...(isCssValue(padB) ? { paddingBottom: padB } : {}),
  };

  // themeColors forwarded to ElementsSection — keeps every element on-theme + editable
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

  // Backend `mission` / `vision` schema: { line, subHeadings: string[] }
  const hasMission = Boolean(c.mission?.line || c.missionLine);
  const hasVision = Boolean(c.vision?.line || c.visionLine);
  const missionLine = String(
    c.mission?.line ||
      c.missionLine ||
      (!readOnly ? 'Quality service, every time.' : '')
  ).trim();
  const visionLine = String(
    c.vision?.line ||
      c.visionLine ||
      (!readOnly ? 'Setting the industry standard.' : '')
  ).trim();
  const missionSubs: string[] = Array.isArray(c.mission?.subHeadings) && c.mission.subHeadings.length
    ? c.mission.subHeadings
    : Array.isArray(c.missionSubHeadings) && c.missionSubHeadings.length
      ? c.missionSubHeadings
      : (readOnly || hasMission ? [] : ['Customer-focused solutions', 'Reliable expert workmanship', 'Honest transparent pricing']);
  const visionSubs: string[] = Array.isArray(c.vision?.subHeadings) && c.vision.subHeadings.length
    ? c.vision.subHeadings
    : Array.isArray(c.visionSubHeadings) && c.visionSubHeadings.length
      ? c.visionSubHeadings
      : (readOnly || hasVision ? [] : ['Innovating for tomorrow', 'Building lasting community trust', 'Sustainable responsible growth']);

  // Heading element (highlighted last word) — matches homepage sections
  const headingEl = (key: string, text: string): WebsiteElement => {
    const id = `${section.id}-${key}`;
    const existing = section.elements?.find(e => e.id === id);
    const cc = (existing?.content || {}) as any;
    const sourceText: string = ((readOnly ? text : '') || cc.text || text).toString().replace(/<[^>]+>/g, '').trim();
    const words = sourceText.split(/\s+/).filter(Boolean);
    let textBefore = '';
    let highlightedText = sourceText;
    if (words.length > 1) {
      highlightedText = words[words.length - 1];
      textBefore = words.slice(0, -1).join(' ');
    }
    const base: WebsiteElement = elementFromExistingOrDna(existing, {
      id, type: 'heading',
      content: { text: sourceText, textBefore, highlightedText, textAfter: '', htmlTag: 'h2' },
      style: { fontWeight: '800', fontSize: 'clamp(1.5rem, 3vw, 2.25rem)', lineHeight: '1.2', letterSpacing: '-0.02em', textAlign: 'left' as any },
    });
    return {
      ...base,
      content: {
        ...(base.content || {}),
        text: sourceText,
        textBefore,
        highlightedText,
        textAfter: '',
        htmlTag: base.content?.htmlTag || 'h2',
      },
    };
  };

  // Line (lead paragraph) element
  const lineEl = (key: string, text: string): WebsiteElement => {
    const id = `${section.id}-${key}`;
    const existing = section.elements?.find(e => e.id === id);
    const base: WebsiteElement = elementFromExistingOrDna(existing, {
      id, type: 'text',
      content: { text, textSize: 'large' },
      style: { lineHeight: '1.6', fontWeight: '600', fontSize: '1.125rem', textAlign: 'left' as any },
    });
    return {
      ...base,
      content: {
        ...(base.content || {}),
        text: (readOnly ? text : '') || String((existing?.content as any)?.text || '').trim() || text,
      },
    };
  };

  // Sub-heading row — a real feature-box element (icon + text) so it is editable
  const subEl = (key: string, i: number, text: string): WebsiteElement => {
    const id = `${section.id}-${key}-${i}`;
    const existing = section.elements?.find(e => e.id === id);
    if (existing) return existing;
    return {
      id, type: 'feature-box',
      content: { icon: 'fa-check', text, subText: '', iconPosition: 'left' },
      style: { iconContainerSize: '1.75rem',
        iconBorderRadius:  '9999px',
        titleFontSize:     '0.95rem',
        titleFontWeight:   '600',
        borderWidth:       '0',
        borderRadius:      '0',
        padding:           '0.35rem 0',
        
        textAlign:         'left' as any,
        titleAlign:        'left' as any,
        gap:               '0.75rem'} as any,
    };
  };

  const renderPillar = (
    key: 'mission' | 'vision', label: string, icon: string, line: string, subs: string[], delay: number,
  ) => (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay }}
      className="relative rounded-2xl border p-7 sm:p-9 h-full"
      style={{ backgroundColor: cardBg, borderColor: cardBorder }}
    >
      <div className="flex items-center justify-center w-12 h-12 rounded-xl mb-5"
        style={{ backgroundColor: iconBg, color: iconColor }}>
        <i className={`fas ${icon} text-xl`} aria-hidden="true" />
      </div>

      <div className="mb-3">
        <ElementsSection section={{ ...section, elements: [headingEl(`${key}-title`, label)] }} {...passThrough} />
      </div>

      <div className="mb-5">
        <ElementsSection section={{ ...section, elements: [lineEl(`${key}-line`, line)] }} {...passThrough} />
      </div>

      <div className="space-y-1">
        {subs.slice(0, 3).map((sh, i) => (
          <ElementsSection key={i} section={{ ...section, elements: [subEl(key, i, sh)] }} {...passThrough} />
        ))}
      </div>
    </motion.div>
  );

  return (
    <div className="w-full" style={{ ...bgStyle }}>
      <div className={innerClass} style={innerStyle}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          {renderPillar('mission', 'Our Mission', 'fa-bullseye', missionLine, missionSubs, 0)}
          {renderPillar('vision', 'Our Vision', 'fa-eye', visionLine, visionSubs, 0.12)}
        </div>
      </div>
    </div>
  );
};
