import React from 'react';
import { Section, WebsiteElement } from '../../../../types';
import { ElementsSection } from '../ElementsSection';
import { resolveSectionImageUrl, toDisplayImageUrl, SECTION_IMAGE_PLACEHOLDER } from '../utils/sectionImageResolve';
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

/**
 * AboutModern — alternate `about` variant (2026 editorial / bento style).
 *
 * SAME content, theme colors and editable elements as AboutPlumbing (badge,
 * title, description, two feature boxes, CTA button, image). LAYOUT differs:
 * a centered heading block on top, then an asymmetric bento row — a large image
 * tile beside a stacked pair of feature cards + CTA — for a modern look.
 *
 * Element ids reuse the `about-` prefix so content carries over on variant switch.
 */
export const AboutModern: React.FC<Props> = ({
  section, onTextEdit, buttonClass, onElementSelect, onElementUpdate,
  selectedElementId, readOnly = false, themeColors: tc,
}) => {
  const { content, styles } = section;
  const s = styles as any;

  // Light-section theme tokens (same as AboutPlumbing).
  const lc = tc?.light || {};
  const fb = lc.featureBox || {};
  const accent     = lc.accentColor || tc?.accentColor || '#E11D48';
  const titleColor = fb.titleColor || lc.titleColor || '#111827';
  const textColor  = fb.textColor  || lc.textColor  || '#4B5563';
  const iconColor  = fb.iconColor  || lc.iconColor  || accent;
  const iconBg     = fb.iconBg     || lc.iconBgColor || `${accent}15`;
  const cardBg     = fb.background  || lc.cardBackgroundColor || '#FFFFFF';
  const cardBorder = fb.border      || lc.cardBorderColor     || 'rgba(0,0,0,0.08)';

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
  const padT = s.paddingTop    ?? 'pt-16 lg:pt-24';
  const padB = s.paddingBottom ?? 'pb-16 lg:pb-24';
  const padX = s.paddingX      ?? 'px-4 sm:px-6';
  const innerClass = `max-w-7xl mx-auto ${isCssValue(padX) ? '' : padX} ${isCssValue(padT) ? '' : padT} ${isCssValue(padB) ? '' : padB}`.trim();
  const innerStyle: React.CSSProperties = {
    ...(isCssValue(padX) ? { paddingLeft: padX, paddingRight: padX } : {}),
    ...(isCssValue(padT) ? { paddingTop: padT } : {}),
    ...(isCssValue(padB) ? { paddingBottom: padB } : {}),
  };

  const apiBadgeText = String((content as any).badgeText || 'About Our Company');
  const apiTitleText = String((content as any).title || 'Who We Are');
  const apiDescriptionText = String(
    (content as any).subtitle || (content as any).description ||
    'We are a family-owned business dedicated to top-quality service. With 25+ years of experience, our licensed professionals handle everything with precision and care.'
  );
  const apiCtaText = String((content as any).ctaText || 'Meet Our Team');
  const apiCtaHref = String((content as any).ctaHref || '#');
  const hideAllIcons = !!(content as any).hideIcons;

  const image = (() => {
    const url = resolveSectionImageUrl(section, { elementId: `${section.id}-about-image`, elementImageUrl: (content as any).imageUrl });
    if (url && url !== SECTION_IMAGE_PLACEHOLDER) return toDisplayImageUrl(url);
    return 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=900&q=80';
  })();

  const themeColors = {
    ...tc, titleColor, textColor, accentColor: accent, iconColor, iconBgColor: iconBg,
    secondaryHeadingColor: accent,
    buttonBackgroundColor: lc.buttonBackgroundColor || tc?.buttonBackgroundColor || accent,
    buttonTextColor: lc.buttonTextColor || tc?.buttonTextColor || '#FFFFFF',
    featureBoxBackground: cardBg, featureBoxBorder: cardBorder,
    featureBoxIconColor: iconColor, featureBoxIconBg: iconBg,
    featureBoxTitleColor: titleColor, featureBoxTextColor: textColor,
  };

  const passThrough = {
    onTextEdit, onElementUpdate: onElementUpdate || (() => {}), onElementSelect,
    selectedElementId, readOnly, isWrapped: false, buttonClass, themeColors,
  } as const;

  const badgeEl: WebsiteElement = section.elements?.find(e => e.id === `${section.id}-about-badge`) || {
    id: `${section.id}-about-badge`, type: 'badge',
    content: { text: apiBadgeText, icon: 'fa-user-tie', iconPosition: 'left', iconSize: '0.65rem' },
    style: { fontSize: '0.72rem', fontWeight: '700', letterSpacing: '0.12em', textTransform: 'uppercase' as any, padding: '6px 14px', borderRadius: '9999px', textAlign: 'center' as any, backgroundColor: `${accent}1A`, color: accent },
  };
  const badgeElResolved: WebsiteElement = { ...badgeEl, content: { ...(badgeEl.content || {}), text: apiBadgeText } };

  const titleEl: WebsiteElement = (() => {
    const id = `${section.id}-about-title`;
    const existing = section.elements?.find(e => e.id === id);
    const sourceText = apiTitleText.toString().replace(/<[^>]+>/g, '').trim();
    const words = sourceText.split(/\s+/).filter(Boolean);
    let textBefore = ''; let highlightedText = sourceText;
    if (words.length > 1) { highlightedText = words[words.length - 1]; textBefore = words.slice(0, -1).join(' '); }
    const base: WebsiteElement = existing || {
      id, type: 'heading',
      content: { text: sourceText, textBefore, highlightedText, textAfter: '', htmlTag: 'h2' },
      style: { fontWeight: '800', fontSize: 'clamp(1.75rem, 3.5vw, 2.75rem)', lineHeight: '1.15', letterSpacing: '-0.02em', textAlign: 'center' as any },
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

  const descEl: WebsiteElement = section.elements?.find(e => e.id === `${section.id}-about-desc`) || {
    id: `${section.id}-about-desc`, type: 'text',
    content: { text: apiDescriptionText, textSize: 'base' },
    style: { lineHeight: '1.75', textAlign: 'center' as any, maxWidth: '640px', marginLeft: 'auto', marginRight: 'auto' },
  };
  const descElResolved: WebsiteElement = { ...descEl, content: { ...(descEl.content || {}), text: apiDescriptionText } };

  const sourceFeatureBoxes = (
    Array.isArray((content as any).featureBoxes) && (content as any).featureBoxes.length > 0
      ? (content as any).featureBoxes
      : [
          { icon: 'fa-shield-halved', heading: 'Licensed & Insured', description: 'Fully certified professionals you can trust in your home.' },
          { icon: 'fa-clock', heading: '24/7 Emergency Service', description: "We're available day or night for your urgent needs." },
        ]
  ).slice(0, 2);

  const getFeatureBoxEl = (i: number): WebsiteElement => {
    const id = `${section.id}-about-f${i + 1}`;
    const from = sourceFeatureBoxes[i] || sourceFeatureBoxes[sourceFeatureBoxes.length - 1] || {};
    const desired = {
      icon: hideAllIcons ? 'none' : String((from as any).icon || 'fa-shield-halved'),
      text: String((from as any).heading || (from as any).title || 'Feature'),
      subText: String((from as any).description || (from as any).subtitle || ''),
      iconPosition: 'left',
    };
    const existing = section.elements?.find(e => e.id === id);
    if (existing) return { ...existing, content: { ...(existing.content || {}), ...desired } };
    return {
      id, type: 'feature-box', content: desired,
      style: { iconContainerSize: '2.75rem', iconBorderRadius: '0.625rem', titleFontSize: '0.95rem', titleFontWeight: '700', descriptionFontSize: '0.8125rem', borderWidth: '1px', borderStyle: 'solid', borderRadius: '1rem', padding: '1.25rem', backgroundColor: cardBg } as any,
    };
  };

  const ctaBtnEl: WebsiteElement = section.elements?.find(e => e.id === `${section.id}-about-cta`) || {
    id: `${section.id}-about-cta`, type: 'cta-button',
    content: { text: apiCtaText, link: apiCtaHref, buttonVariant: 'primary' },
    style: { padding: '0.875rem 1.75rem', borderRadius: '0.625rem', fontWeight: '700', fontSize: '0.95rem' },
  };
  const ctaBtnElResolved: WebsiteElement = { ...ctaBtnEl, content: { ...(ctaBtnEl.content || {}), text: apiCtaText, link: apiCtaHref } };

  return (
    <div className="relative w-full overflow-hidden" style={{ backgroundColor: bg }}>
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[40rem] h-[40rem] rounded-full blur-[140px]" style={{ backgroundColor: `${accent}0D` }} />
      </div>

      <div className={`${innerClass} relative z-10`} style={innerStyle}>
        {/* Centered heading block */}
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          transition={{ duration: 0.6 }} className="text-center flex flex-col items-center gap-4 mb-10 sm:mb-14">
          <ElementsSection section={{ ...section, elements: [badgeElResolved] }} {...passThrough} />
          <ElementsSection section={{ ...section, elements: [titleEl] }} {...passThrough} />
          <ElementsSection section={{ ...section, elements: [descElResolved] }} {...passThrough} />
        </motion.div>

        {/* Bento row: large image + stacked feature cards / CTA */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-5 sm:gap-6">
          {/* Image tile */}
          <motion.div initial={{ opacity: 0, x: -24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative rounded-3xl overflow-hidden border min-h-[320px]"
            style={{ borderColor: `${accent}22`, boxShadow: `0 30px 60px -34px ${accent}44` }}>
            <img src={image} alt="" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0" style={{ background: `linear-gradient(to top, ${accent}22, transparent 55%)` }} />
          </motion.div>

          {/* Right column: features + CTA */}
          <motion.div initial={{ opacity: 0, x: 24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }} className="flex flex-col gap-4">
            {[0, 1].map(i => (
              <ElementsSection key={i} section={{ ...section, elements: [getFeatureBoxEl(i)] }} {...passThrough} />
            ))}
            <div className="mt-auto pt-1" style={{ width: 'max-content' }}>
              <ElementsSection section={{ ...section, elements: [ctaBtnElResolved] }} {...passThrough} />
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default AboutModern;
