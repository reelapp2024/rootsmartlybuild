import React from 'react';
import { Section, WebsiteElement } from '../../../../types';
import { ElementsSection } from '../ElementsSection';
import { resolveSectionImageUrl } from '../utils/sectionImageResolve';
import { PRESET_THEMES } from '../../../../constants';
import { motion } from 'motion/react';

interface AboutProps {
  section: Section;
  onTextEdit: (key: any, value: string) => void;
  buttonClass: string;
  onElementSelect?: (elementId: string, element?: WebsiteElement) => void;
  onElementUpdate?: (elementId: string, updates: Partial<WebsiteElement>) => void;
  selectedElementId?: string | null;
  readOnly?: boolean;
  themeColors?: any;
}

export const AboutPlumbing: React.FC<AboutProps> = ({
  section, onTextEdit, buttonClass, onElementSelect, onElementUpdate,
  selectedElementId, readOnly = false, themeColors: tc,
}) => {
  const { content, styles } = section;
  const s = styles as any;

  // ── Theme tokens (always-light section) ─────────────────────────
  const lc = tc?.light || {};
  const fb = lc.featureBox || {};
  const accent     = lc.accentColor || tc?.accentColor || '#E11D48';
  const titleColor = fb.titleColor || lc.titleColor || '#111827';
  const textColor  = fb.textColor  || lc.textColor  || '#4B5563';
  const iconColor  = fb.iconColor  || lc.iconColor  || accent;
  const iconBg     = fb.iconBg     || lc.iconBgColor || `${accent}15`;

  // Background: always white on theme switch; user custom (non-theme-surface) wins
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

  // Padding: Tailwind classes OR raw CSS values
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
  // Default alignment is left; user can override via sidebar to center/right.
  const effectiveAlign = s.textAlign === 'center' ? 'center' : s.textAlign === 'right' ? 'right' : 'left';
  const textAlignClass = effectiveAlign === 'center' ? 'text-center' : effectiveAlign === 'right' ? 'text-right' : 'text-left';

  const hideAllIcons = !!(content as any).hideIcons;
  const apiBadgeText = String((content as any).badgeText || 'About Our Company');
  const apiTitleText = String((content as any).title || 'Who We Are');
  const apiDescriptionText = String(
    (content as any).subtitle ||
    (content as any).description ||
    'We are a family-owned plumbing business dedicated to providing top-quality service to our community. With over 25 years of experience, our licensed professionals handle everything from minor leaks to major installations with precision and care.'
  );
  const apiCtaText = String((content as any).ctaText || 'Meet Our Team');
  const apiCtaHref = String((content as any).ctaHref || '#');

  // Theme colors forwarded to ElementsSection
  const themeColors = {
    ...tc,
    titleColor,
    textColor,
    accentColor: accent,
    iconColor,
    iconBgColor: iconBg,
    secondaryHeadingColor: accent,
    buttonBackgroundColor: lc.buttonBackgroundColor || tc?.buttonBackgroundColor || accent,
    buttonTextColor: lc.buttonTextColor || tc?.buttonTextColor || '#FFFFFF',
    secondaryButtonBg: 'transparent',
    secondaryButtonText: titleColor,
    secondaryButtonBorder: accent,
    featureBoxBackground: fb.background || lc.cardBackgroundColor || '#FFFFFF',
    featureBoxBorder:     fb.border     || lc.cardBorderColor     || 'rgba(0,0,0,0.08)',
    featureBoxIconColor:  iconColor,
    featureBoxIconBg:     iconBg,
    featureBoxTitleColor: titleColor,
    featureBoxTextColor:  textColor,
  };

  // ── Elements ────────────────────────────────────────────────────

  const badgeEl: WebsiteElement = section.elements?.find(e => e.id === `${section.id}-about-badge`) || {
    id: `${section.id}-about-badge`, type: 'badge',
    content: { text: content.badgeText || 'About Our Company', icon: 'fa-user-tie', iconPosition: 'left', iconSize: '0.65rem' },
    style: {
      fontSize: '0.72rem',
      fontWeight: '700',
      letterSpacing: '0.12em',
      textTransform: 'uppercase' as any,
      padding: '6px 14px',
      borderRadius: '9999px',
      textAlign: 'left' as any,  // matches About's left-aligned column
      // Explicit tinted accent bg + accent text so badge is visible on white
      backgroundColor: `${accent}1A`,
      color: accent,
    },
  };
  const badgeElResolved: WebsiteElement = {
    ...badgeEl,
    content: { ...(badgeEl.content || {}), text: apiBadgeText },
  };

  const titleEl: WebsiteElement = (() => {
    const id = `${section.id}-about-title`;
    const existing = section.elements?.find(e => e.id === id);
    // Render the heading as plain neutral text (no accent-highlighted last word).
    const sourceText: string = apiTitleText.toString().replace(/<[^>]+>/g, '').trim();
    const base: WebsiteElement = existing || {
      id, type: 'heading',
      content: { text: sourceText, htmlTag: 'h2' },
      style: { fontWeight: '800', fontSize: 'clamp(1.75rem, 3.5vw, 2.75rem)', lineHeight: '1.15', letterSpacing: '-0.02em', textAlign: 'left' as any, color: titleColor },
    };
    if (existing) {
      return {
        ...existing,
        type: 'heading',
        content: {
          ...(existing.content || {}),
          text: sourceText,
          htmlTag: (existing.content as any)?.htmlTag || 'h2',
        },
        style: { ...(base.style as any), ...(existing.style as any), color: titleColor },
      } as WebsiteElement;
    }
    return {
      ...base,
      content: { text: sourceText, htmlTag: base.content?.htmlTag || 'h2' },
    };
  })();

  const descEl: WebsiteElement = section.elements?.find(e => e.id === `${section.id}-about-desc`) || {
    id: `${section.id}-about-desc`, type: 'text',
    content: {
      text: apiDescriptionText,
      textSize: 'base',
    },
    style: { lineHeight: '1.75' },
  };
  const descElResolved: WebsiteElement = {
    ...descEl,
    content: { ...(descEl.content || {}), text: apiDescriptionText },
  };

  // Feature-boxes (2) — prefer API content.featureBoxes, fallback to static defaults.
  // We intentionally let hydrated content override stale persisted element text/icon so
  // about section always reflects latest SectionContent values.
  const sourceFeatureBoxes = (
    Array.isArray((content as any).featureBoxes) && (content as any).featureBoxes.length > 0
      ? (content as any).featureBoxes
      : [
          { icon: 'fa-shield-halved', heading: 'Licensed & Insured', description: 'Fully certified professionals you can trust in your home.' },
          { icon: 'fa-clock', heading: '24/7 Emergency Service', description: "We're available day or night for your urgent plumbing needs." },
        ]
  ).slice(0, 2);

  const getFeatureBoxEl = (i: number): WebsiteElement => {
    const id = `${section.id}-about-f${i + 1}`;
    const fromContent = sourceFeatureBoxes[i] || sourceFeatureBoxes[sourceFeatureBoxes.length - 1] || {};
    const desiredContent = {
      icon: hideAllIcons ? 'none' : String((fromContent as any).icon || 'fa-shield-halved'),
      text: String((fromContent as any).heading || (fromContent as any).title || 'Feature'),
      subText: String((fromContent as any).description || (fromContent as any).subtitle || ''),
      iconPosition: 'left',
    };
    const existing = section.elements?.find(e => e.id === id);
    if (existing) {
      return {
        ...existing,
        content: {
          ...(existing.content || {}),
          ...desiredContent,
        },
      };
    }
    return {
      id,
      type: 'feature-box',
      content: desiredContent,
      style: {
        iconContainerSize: '2.75rem',
        iconBorderRadius:  '0.625rem',
        titleFontSize:     '0.95rem',
        titleFontWeight:   '700',
        descriptionFontSize: '0.8125rem',
        borderWidth: '1px',
        borderStyle: 'solid',
        borderRadius: '0.875rem',
        padding: '1rem 1.125rem',
      } as any,
    };
  };

  const ctaBtnEl: WebsiteElement = section.elements?.find(e => e.id === `${section.id}-about-cta`) || {
    id: `${section.id}-about-cta`, type: 'cta-button',
    content: {
      text: apiCtaText,
      link: apiCtaHref,
      buttonVariant: 'primary',
    },
    style: { padding: '0.875rem 1.75rem', borderRadius: '0.5rem', fontWeight: '700', fontSize: '0.95rem' },
  };
  const ctaBtnElResolved: WebsiteElement = {
    ...ctaBtnEl,
    content: {
      ...(ctaBtnEl.content || {}),
      text: apiCtaText,
      link: apiCtaHref,
    },
  };

  const imageEl: WebsiteElement = section.elements?.find(e => e.id === `${section.id}-about-image`) || {
    id: `${section.id}-about-image`, type: 'image',
    content: {
      imageUrl: resolveSectionImageUrl(section, {
        elementId: `${section.id}-about-image`,
        elementImageUrl: content.imageUrl,
      }),
      imageAlt: 'Our Team',
    },
    style: { borderRadius: '1rem', aspectRatio: '4/5', objectFit: 'cover' as any, width: '100%', height: '100%' },
  };
  const imageElResolved: WebsiteElement = {
    ...imageEl,
    content: {
      ...(imageEl.content || {}),
      imageUrl: resolveSectionImageUrl(section, {
        elementId: `${section.id}-about-image`,
        elementImageUrl: (content as any).imageUrl,
      }),
    },
  };

  return (
    <div className={`relative w-full overflow-hidden ${textAlignClass}`} style={{ backgroundColor: bg }}>
      {/* Subtle background accents */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full opacity-[0.04]"
          style={{ backgroundImage: `radial-gradient(${textColor} 1px, transparent 1px)`, backgroundSize: '40px 40px' }} />
        <div className="absolute top-0 right-0 w-1/2 h-full opacity-20"
          style={{ background: `linear-gradient(to left, ${accent}20, transparent)` }} />
        <div className="absolute -bottom-48 -right-48 w-96 h-96 rounded-full blur-[120px]"
          style={{ backgroundColor: `${accent}1A` }} />
      </div>

      <div className={`${innerClass} relative z-10`} style={innerStyle}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 sm:gap-14 lg:gap-20 items-center">

          {/* LEFT — content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="space-y-5 sm:space-y-7 order-2 lg:order-1"
          >
            {/* Badge — alignment controlled via badge's own style.textAlign (sidebar editable).
                ElementsSection renders the badge in its own flex wrapper using that textAlign,
                so we don't add another layer here. */}
            <ElementsSection section={{ ...section, elements: [badgeElResolved] }} onTextEdit={onTextEdit}
              onElementUpdate={onElementUpdate || (() => {})} onElementSelect={onElementSelect}
              selectedElementId={selectedElementId} readOnly={readOnly} isWrapped={false}
              buttonClass={buttonClass} themeColors={themeColors} />

            {/* Title (highlighted heading: before + accent + after) */}
            <ElementsSection section={{ ...section, elements: [titleEl] }} onTextEdit={onTextEdit}
              onElementUpdate={onElementUpdate || (() => {})} onElementSelect={onElementSelect}
              selectedElementId={selectedElementId} readOnly={readOnly} isWrapped={false}
              buttonClass={buttonClass} themeColors={themeColors} />

            {/* Description */}
            <ElementsSection section={{ ...section, elements: [descElResolved] }} onTextEdit={onTextEdit}
              onElementUpdate={onElementUpdate || (() => {})} onElementSelect={onElementSelect}
              selectedElementId={selectedElementId} readOnly={readOnly} isWrapped={false}
              buttonClass={buttonClass} themeColors={themeColors} />

            {/* Feature boxes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-1">
              {[0, 1].map(i => (
                <ElementsSection key={i} section={{ ...section, elements: [getFeatureBoxEl(i)] }}
                  onTextEdit={onTextEdit} onElementUpdate={onElementUpdate || (() => {})}
                  onElementSelect={onElementSelect} selectedElementId={selectedElementId}
                  readOnly={readOnly} isWrapped={false} buttonClass={buttonClass}
                  themeColors={themeColors} />
              ))}
            </div>

            {/* CTA button */}
            <div className={`pt-2 flex ${effectiveAlign === 'left' ? '' : effectiveAlign === 'right' ? 'justify-end' : 'justify-center'}`}>
              <div style={{ width: 'max-content' }}>
                <ElementsSection section={{ ...section, elements: [ctaBtnElResolved] }} onTextEdit={onTextEdit}
                  onElementUpdate={onElementUpdate || (() => {})} onElementSelect={onElementSelect}
                  selectedElementId={selectedElementId} readOnly={readOnly} isWrapped={false}
                  buttonClass={buttonClass} themeColors={themeColors} />
              </div>
            </div>

          </motion.div>

          {/* RIGHT — visuals */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="relative order-1 lg:order-2 max-w-md sm:max-w-lg mx-auto w-full"
          >
            <div className="relative z-10 rounded-2xl overflow-hidden border" style={{ borderColor: `${accent}22` }}>
              <ElementsSection section={{ ...section, elements: [imageElResolved] }} onTextEdit={onTextEdit}
                onElementUpdate={onElementUpdate || (() => {})} onElementSelect={onElementSelect}
                selectedElementId={selectedElementId} readOnly={readOnly} isWrapped={false}
                buttonClass={buttonClass} themeColors={themeColors} />
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
