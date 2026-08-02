import React from 'react';
import { Section, WebsiteElement } from '../../../../types';
import { ElementsSection } from '../ElementsSection';
import { resolveSectionImageUrl, toDisplayImageUrl, SECTION_IMAGE_PLACEHOLDER } from '../utils/sectionImageResolve';
import { resolveSectionBackground, resolveSectionOverlay, sectionBgHasImage } from '../utils/sectionBackground';
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
 * AboutEditorial — "Editorial" homepage variant set. Light section.
 *
 * Image on the left inside a neutral frame; copy on the right: badge, title,
 * description, two feature boxes, and a CTA. Restrained palette: accent is
 * reserved for the feature icons and the CTA button only. Industry-neutral.
 *
 * Fully dynamic keys: badgeText, title, subtitle/description, ctaText/ctaHref,
 * featureBoxes[]{icon,heading,description} (exactly 2), image via
 * content.data.images[] or content.imageUrl. Colours from theme `tc.light`.
 * Every piece renders through real editable elements. Element ids reuse the
 * `about-` prefix so content carries over on variant switch.
 */
export const AboutEditorial: React.FC<Props> = ({
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
  const cardBg     = fb.background  || lc.cardBackgroundColor || '#FFFFFF';
  const cardBorder = fb.border      || lc.cardBorderColor     || 'rgba(0,0,0,0.08)';
  const mutedColor = lc.textColorMuted || (lc as any).muted || '#6B7280';

  // Section background: honor the user's color / gradient / image choice (with
  // image-only overlay) via the shared resolver. Default surface = theme light
  // surface (white fallback) when nothing explicit is set.
  const defaultSurface = lc.surface || (lc as any).cardBackgroundColor || '#FFFFFF';
  const sectionBg = resolveSectionBackground(s, { defaultSurface });
  const bgOverlay = resolveSectionOverlay(s);
  const hasBgImage = sectionBgHasImage(s);

  const isCssValue = (v: any) => typeof v === 'string' && /(px|rem|em|%|vh|vw)$/.test(v.trim());
  const padT = s.paddingTop  ?? 'pt-16 lg:pt-24';
  const padB = s.paddingBottom ?? 'pb-16 lg:pb-24';
  const padX = s.paddingX      ?? 'px-6';
  const innerClass = `max-w-[1240px] mx-auto ${isCssValue(padX) ? '' : padX} ${isCssValue(padT) ? '' : padT} ${isCssValue(padB) ? '' : padB}`.trim();
  const innerStyle: React.CSSProperties = {
    ...(isCssValue(padX) ? { paddingLeft: padX, paddingRight: padX } : {}),
    ...(isCssValue(padT) ? { paddingTop: padT } : {}),
    ...(isCssValue(padB) ? { paddingBottom: padB } : {}),
  };

  // ── content ──
  const apiBadge = String((content as any).badgeText || 'About us');
  const apiTitle = String((content as any).title || 'A team you can actually get hold of.');
  const apiDesc  = String((content as any).subtitle || (content as any).description ||
    'We are a local, independently run business built on repeat customers and word of mouth. You speak to the same people who do the work.');
  const apiCta   = String((content as any).ctaText || 'Get your free quote');
  const apiCtaHref = String((content as any).ctaHref || '#');

  const featureBoxes = (() => {
    const raw = (content as any).featureBoxes;
    if (Array.isArray(raw) && raw.length) {
      return raw.slice(0, 2).map((r: any, i: number) => ({
        icon: String(r?.icon || (i === 0 ? 'fa-shield-halved' : 'fa-clock')),
        heading: String(r?.heading || r?.title || (i === 0 ? 'Licensed & insured' : 'On-time, every time')),
        description: String(r?.description || r?.subtitle || 'Dependable service you can count on.'),
      }));
    }
    return [
      { icon: 'fa-shield-halved', heading: 'Licensed & insured', description: 'Fully certified professionals you can trust in your space.' },
      { icon: 'fa-clock', heading: 'On-time, every time', description: 'We turn up in the agreed window and keep you updated.' },
    ];
  })();

  // The left photo is its OWN content image — kept independent of any section
  // BACKGROUND image the user sets (excludeBackground). Prefer the saved
  // `about-image` element's own URL, then the section content image[].
  const aboutImageEl = section.elements?.find(e => e.id === `${section.id}-about-image`);
  const image = (() => {
    const elUrl = String((aboutImageEl?.content as any)?.imageUrl || (aboutImageEl?.content as any)?.src || (content as any).imageUrl || '').trim();
    if (elUrl) return toDisplayImageUrl(elUrl);
    const imgs = (content as any)?.data?.images;
    const fromData = Array.isArray(imgs) && imgs.length ? (imgs[0]?.url || imgs[0]?.src) : '';
    if (fromData) return toDisplayImageUrl(String(fromData));
    const resolved = resolveSectionImageUrl(section, { elementId: `${section.id}-about-image`, excludeBackground: true });
    if (resolved && resolved !== SECTION_IMAGE_PLACEHOLDER) return toDisplayImageUrl(resolved);
    return 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=900&q=80';
  })();

  // ── editable elements (about- ids) ──
  const badgeEl: WebsiteElement = section.elements?.find(e => e.id === `${section.id}-about-badge`) || {
    id: `${section.id}-about-badge`, type: 'badge',
    content: { text: apiBadge, iconPosition: 'left' },
    style: { fontSize: '0.7rem', fontWeight: '700', letterSpacing: '0.2em', textTransform: 'uppercase' as any, padding: '6px 14px', borderRadius: '9999px', textAlign: 'center' as any, backgroundColor: cardBorder, color: mutedColor },
  };
  const badgeElResolved: WebsiteElement = { ...badgeEl, content: { ...(badgeEl.content || {}), text: apiBadge } };

  const titleEl: WebsiteElement = (() => {
    const id = `${section.id}-about-title`;
    const existing = section.elements?.find(e => e.id === id);
    const src = (existing?.content as any)?.text || apiTitle;
    const base: WebsiteElement = existing || {
      id, type: 'heading',
      content: { text: src, htmlTag: 'h2' },
      style: { color: titleColor, fontWeight: '800', fontSize: 'clamp(2rem, 4vw, 2.875rem)', lineHeight: '1.1', letterSpacing: '-0.035em', textAlign: 'left' as any },
    };
    if (existing) {
      return { ...existing, type: 'heading', content: { ...(existing.content || {}), htmlTag: (existing.content as any)?.htmlTag || 'h2' }, style: { ...(base.style as any), ...(existing.style as any) } } as WebsiteElement;
    }
    return { ...base, content: { ...(base.content || {}), text: src, htmlTag: 'h2' } };
  })();

  const descEl: WebsiteElement = section.elements?.find(e => e.id === `${section.id}-about-desc`) || {
    id: `${section.id}-about-desc`, type: 'text',
    content: { text: apiDesc, textSize: 'large' },
    style: { color: textColor, textAlign: 'left' as any, maxWidth: '560px', lineHeight: '1.75' },
  };
  const descElResolved: WebsiteElement = { ...descEl, content: { ...(descEl.content || {}), text: apiDesc } };

  const getFeatureBoxEl = (i: number, def: { icon: string; heading: string; description: string }): WebsiteElement => {
    const id = `${section.id}-about-f${i + 1}`;
    const existing = section.elements?.find(e => e.id === id);
    const defaultContent: any = { icon: def.icon, text: def.heading, subText: def.description, iconPosition: 'left' };
    const defaultStyle: any = {
      iconContainerSize: '2.5rem', iconBorderRadius: '0.6rem',
      titleFontSize: '1rem', titleFontWeight: '700', descriptionFontSize: '0.85rem',
      borderWidth: '1px', borderStyle: 'solid', borderRadius: '1rem', padding: '1.1rem',
      backgroundColor: cardBg, textAlign: 'left' as any, titleAlign: 'left' as any, descriptionAlign: 'left' as any,
    };
    if (existing) {
      return { ...existing, content: { ...defaultContent, ...(existing.content || {}) }, style: { ...defaultStyle, ...(existing.style as any) } };
    }
    return { id, type: 'feature-box', content: defaultContent, style: defaultStyle };
  };

  const ctaEl: WebsiteElement = section.elements?.find(e => e.id === `${section.id}-about-cta`) || {
    id: `${section.id}-about-cta`, type: 'cta-button',
    content: { text: apiCta, link: apiCtaHref, buttonVariant: 'primary' },
    style: { buttonVariant: 'primary', padding: '0 1.75rem', height: '3rem', borderRadius: '0.7rem', fontWeight: '600', fontSize: '0.92rem' } as any,
  };
  const ctaElResolved: WebsiteElement = { ...ctaEl, content: { ...(ctaEl.content || {}), text: apiCta, link: apiCtaHref } };

  const themeColors = {
    ...tc, titleColor, textColor, accentColor: accent,
    iconColor: accent, iconBgColor: `${accent}15`,
    featureBoxBackground: cardBg, featureBoxBorder: cardBorder,
    featureBoxTitleColor: titleColor, featureBoxTextColor: textColor,
    featureBoxIconColor: accent, featureBoxIconBg: `${accent}15`,
    buttonBackgroundColor: lc.buttonBackgroundColor || tc?.buttonBackgroundColor || accent,
    buttonTextColor: lc.buttonTextColor || tc?.buttonTextColor || '#FFFFFF',
  };
  const pass = {
    onTextEdit, onElementUpdate: onElementUpdate || (() => {}), onElementSelect,
    selectedElementId, readOnly, isWrapped: false, buttonClass, themeColors,
  } as const;

  return (
    <div className="w-full relative" style={{ ...sectionBg }}>
      {hasBgImage && bgOverlay && <div aria-hidden className="absolute inset-0 pointer-events-none" style={bgOverlay} />}
      <div className={`relative z-10 ${innerClass}`} style={innerStyle}>
        <div className="grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-12 lg:gap-16 items-center">

          {/* Image left */}
          <motion.div initial={{ opacity: 0, x: -24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="relative">
            <div aria-hidden className="absolute -inset-3 rounded-[24px]" style={{ border: `1px solid ${cardBorder}` }} />
            <div className="relative aspect-[5/6] rounded-3xl overflow-hidden" style={{ border: `1px solid ${cardBorder}`, backgroundColor: cardBg }}>
              <img src={image} alt="" className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 hover:scale-[1.03]" />
            </div>
          </motion.div>

          {/* Copy right */}
          <motion.div initial={{ opacity: 0, x: 24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.1 }}>
            <div className="inline-flex mb-5"><ElementsSection section={{ ...section, elements: [badgeElResolved] }} {...pass} /></div>
            <div className="mb-5"><ElementsSection section={{ ...section, elements: [titleEl] }} {...pass} /></div>
            <div className="mb-8"><ElementsSection section={{ ...section, elements: [descElResolved] }} {...pass} /></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-9">
              {featureBoxes.map((f, i) => (
                <ElementsSection key={i} section={{ ...section, elements: [getFeatureBoxEl(i, f)] }} {...pass} />
              ))}
            </div>
            <div style={{ width: 'max-content' }}><ElementsSection section={{ ...section, elements: [ctaElResolved] }} {...pass} /></div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default AboutEditorial;
