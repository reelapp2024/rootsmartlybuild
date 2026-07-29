import React from 'react';
import { Section, WebsiteElement } from '../../../../types';
import { ElementsSection } from '../ElementsSection';
import { resolveSectionImageUrl, toDisplayImageUrl, SECTION_IMAGE_PLACEHOLDER } from '../utils/sectionImageResolve';
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
 * HeroEditorial — part of the "Editorial" complete-homepage variant set.
 *
 * Industry-neutral (categories are free-text) editorial hero: an asymmetric
 * split — a large editorial headline block on the left (badge, title with
 * accent last-word, subhead, two CTAs, trust strip) and a framed hero image on
 * the right with a soft accent glow + a floating stat chip.
 *
 * Fully dynamic keys (from the backend hero generator): title, subtitle,
 * badgeText, ctaText, secondaryCtaText, trustStripItems[]{icon,label}, and the
 * hero image via content.data.images[] / content.imageUrl. All colours come
 * from the theme (`tc`); everything renders through real editable elements.
 * Element ids reuse the `h4-` prefix so content carries over on variant switch.
 */
export const HeroEditorial: React.FC<Props> = ({
  section, onTextEdit, buttonClass, onElementSelect, onElementUpdate,
  selectedElementId, readOnly = false, themeColors: tc,
}) => {
  const { content, styles } = section;
  const s = styles as any;

  const titleColor = tc?.titleColor || '#F8FAFC';
  const textColor  = tc?.textColor  || '#9AA4B2';
  const accent     = tc?.iconColor || tc?.accentColor || '#E11D48';
  const btnBg      = tc?.buttonBackgroundColor || accent;
  const btnText    = tc?.buttonTextColor || '#FFFFFF';
  const bg         = s.backgroundColor || tc?.backgroundColor || '#0A0C10';
  const line       = tc?.navBorderColor || 'rgba(255,255,255,0.10)';
  const surface    = tc?.surface || 'rgba(255,255,255,0.03)';
  const mutedColor = tc?.textColorMuted || (tc as any)?.muted || 'rgba(255,255,255,0.55)';

  const uid = `he-${String(section.id).replace(/[^a-zA-Z0-9_-]/g, '')}`;

  // ── content ──
  const badgeText = String((content as any).badgeText || 'Trusted local experts');
  const headlineText = String((content as any).title || 'Quality work, done right the first time.');
  const subheadText = String((content as any).subtitle ||
    'Friendly, fully-licensed and fairly priced. We turn up on time, quote before we start, and stand behind every job.');
  const primaryText = String((content as any).ctaText || 'Get a free quote');
  const primaryHref = String((content as any).ctaHref || '#');
  const secondaryText = String((content as any).secondaryCtaText || 'See our work');
  const secondaryHref = String((content as any).secondaryCtaHref || '#');

  // Hero image (content.data.images[] → content.imageUrl → resolve helper → fallback)
  const image = (() => {
    const imgs = (content as any)?.data?.images;
    const fromData = Array.isArray(imgs) && imgs.length ? (imgs[0]?.url || imgs[0]?.src) : '';
    if (fromData) return toDisplayImageUrl(String(fromData));
    const resolved = resolveSectionImageUrl(section, { elementId: `${section.id}-h4-image`, elementImageUrl: (content as any).imageUrl });
    if (resolved && resolved !== SECTION_IMAGE_PLACEHOLDER) return toDisplayImageUrl(resolved);
    return 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=1000&q=80';
  })();

  const trustItems: string[] = (() => {
    const raw = (content as any).trustStripItems;
    if (Array.isArray(raw) && raw.length) {
      return raw.map((it: any) => String(it?.label ?? it?.text ?? it ?? '').trim()).filter(Boolean).slice(0, 4);
    }
    return ['Fully insured', 'Licensed & certified', 'Free estimates', 'No call-out fee'];
  })();

  // ── editable elements (h4- ids → carry across hero variants) ──
  const badgeEl: WebsiteElement = section.elements?.find(e => e.id === `${section.id}-h4-badge`) || {
    id: `${section.id}-h4-badge`, type: 'badge',
    content: { text: badgeText, icon: 'fa-star', iconPosition: 'left', iconSize: '0.65rem' },
    style: { fontSize: '0.72rem', fontWeight: '700', letterSpacing: '0.14em', textTransform: 'uppercase' as any, padding: '6px 14px', borderRadius: '9999px', textAlign: 'center' as any, backgroundColor: surface, color: mutedColor },
  };
  const badgeElResolved: WebsiteElement = { ...badgeEl, content: { ...(badgeEl.content || {}), text: badgeText } };

  const titleEl: WebsiteElement = (() => {
    const id = `${section.id}-h4-title`;
    const existing = section.elements?.find(e => e.id === id);
    const src = (existing?.content as any)?.text || headlineText;
    const base: WebsiteElement = existing || {
      id, type: 'heading',
      content: { text: src, htmlTag: 'h1' },
      style: { color: titleColor, fontWeight: '800', fontSize: 'clamp(2.5rem, 5vw, 4.25rem)', lineHeight: '1.05', letterSpacing: '-0.03em', textAlign: 'left' as any },
    };
    return { ...base, content: { ...(base.content || {}), text: src, htmlTag: (base.content as any)?.htmlTag || 'h1' } };
  })();

  const descEl: WebsiteElement = section.elements?.find(e => e.id === `${section.id}-h4-desc`) || {
    id: `${section.id}-h4-desc`, type: 'text',
    content: { text: subheadText, textSize: 'large' },
    style: { color: textColor, textAlign: 'left' as any, maxWidth: '520px', lineHeight: '1.7' },
  };
  const descElResolved: WebsiteElement = { ...descEl, content: { ...(descEl.content || {}), text: subheadText } };

  const btn1El: WebsiteElement = section.elements?.find(e => e.id === `${section.id}-h4-btn1`) || {
    id: `${section.id}-h4-btn1`, type: 'cta-button',
    content: { text: primaryText, link: primaryHref, buttonVariant: 'primary' },
    style: { buttonVariant: 'primary', padding: '0 1.9rem', height: '3.1rem', borderRadius: '0.7rem', fontWeight: '600', fontSize: '0.95rem' } as any,
  };
  const btn1ElResolved: WebsiteElement = { ...btn1El, content: { ...(btn1El.content || {}), text: primaryText, link: primaryHref } };

  const btn2El: WebsiteElement = section.elements?.find(e => e.id === `${section.id}-h4-btn2`) || {
    id: `${section.id}-h4-btn2`, type: 'cta-button',
    content: { text: secondaryText, link: secondaryHref, buttonVariant: 'secondary' },
    style: { buttonVariant: 'secondary', padding: '0 1.9rem', height: '3.1rem', borderRadius: '0.7rem', fontWeight: '500', fontSize: '0.95rem' } as any,
  };
  const btn2ElResolved: WebsiteElement = { ...btn2El, content: { ...(btn2El.content || {}), text: secondaryText, link: secondaryHref } };

  const trustStripItems = trustItems.map((label) => ({ icon: 'fa-check', label }));
  const trustStripEl: WebsiteElement = section.elements?.find(e => e.id === `${section.id}-h4-trust`) || ({
    id: `${section.id}-h4-trust`, type: 'trust-strip',
    content: { items: trustStripItems } as any,
    style: {
      iconColor: accent, iconBackgroundColor: `${accent}1F`, iconContainerSize: '24px',
      iconSize: '11px', iconBorderRadius: '9999px', titleColor: `${textColor}`,
      titleFontSize: '13px', titleFontWeight: '500', gap: '20px', padding: '0',
      justifyContent: 'flex-start',
    } as any,
  } as WebsiteElement);
  const trustStripElResolved: WebsiteElement = {
    ...trustStripEl,
    content: { ...(trustStripEl.content || {}), items: (trustStripEl.content as any)?.items?.length ? (trustStripEl.content as any).items : trustStripItems },
  };

  const themeColors = {
    ...tc, titleColor, textColor, accentColor: accent, secondaryHeadingColor: titleColor,
    buttonBackgroundColor: btnBg, buttonTextColor: btnText,
    secondaryButtonBg: 'transparent', secondaryButtonText: titleColor, secondaryButtonBorder: line,
  };
  const pass = {
    onTextEdit, onElementUpdate: onElementUpdate || (() => {}), onElementSelect,
    selectedElementId, readOnly, isWrapped: false, buttonClass, themeColors,
  } as const;

  const isCssValue = (v: any) => typeof v === 'string' && /(px|rem|em|%|vh|vw)$/.test(v.trim());
  const padTraw = s.paddingTop ?? 'pt-24 lg:pt-28';
  const padBraw = s.paddingBottom ?? 'pb-20 lg:pb-24';
  const padXraw = s.paddingX ?? 'px-6';
  const padT = isCssValue(padTraw) ? '' : padTraw;
  const padB = isCssValue(padBraw) ? '' : padBraw;
  const padX = isCssValue(padXraw) ? '' : padXraw;
  const innerPad: React.CSSProperties = {
    ...(isCssValue(padTraw) ? { paddingTop: padTraw } : {}),
    ...(isCssValue(padBraw) ? { paddingBottom: padBraw } : {}),
    ...(isCssValue(padXraw) ? { paddingLeft: padXraw, paddingRight: padXraw } : {}),
  };

  return (
    <header className={`${uid} relative isolate overflow-hidden w-full`} style={{ backgroundColor: bg, borderBottom: `1px solid ${line}` }}>
      <style>{`
        .${uid} .he-glow { position:absolute; border-radius:9999px; filter:blur(120px); pointer-events:none; }
        .${uid} .he-grid { background-image:linear-gradient(to right, ${textColor}0A 1px, transparent 1px), linear-gradient(to bottom, ${textColor}0A 1px, transparent 1px); background-size:56px 56px; -webkit-mask-image:radial-gradient(ellipse 70% 60% at 30% 30%, #000 20%, transparent 75%); mask-image:radial-gradient(ellipse 70% 60% at 30% 30%, #000 20%, transparent 75%); }
      `}</style>

      {/* Ambient decoration */}
      <div aria-hidden className="absolute inset-0 -z-10">
        <div className="he-glow" style={{ top: '-10%', left: '-5%', width: '38rem', height: '38rem', backgroundColor: `${accent}22` }} />
        <div className="he-grid absolute inset-0" />
      </div>

      <div className={`relative mx-auto max-w-[1240px] ${padX} ${padT} ${padB}`} style={innerPad}>
        <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-12 lg:gap-16 items-center">

          {/* Left: editorial copy */}
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="max-w-[600px]">
            <div className="inline-flex mb-6">
              <ElementsSection section={{ ...section, elements: [badgeElResolved] }} {...pass} />
            </div>
            <div className="mb-6">
              <ElementsSection section={{ ...section, elements: [titleEl] }} {...pass} />
            </div>
            <div className="mb-9">
              <ElementsSection section={{ ...section, elements: [descElResolved] }} {...pass} />
            </div>
            <div className="flex flex-wrap items-center gap-3 mb-10">
              <div style={{ width: 'max-content' }}><ElementsSection section={{ ...section, elements: [btn1ElResolved] }} {...pass} /></div>
              <div style={{ width: 'max-content' }}><ElementsSection section={{ ...section, elements: [btn2ElResolved] }} {...pass} /></div>
            </div>
            <div className="pt-7" style={{ borderTop: `1px solid ${line}` }}>
              <ElementsSection section={{ ...section, elements: [trustStripElResolved] }} {...pass} />
            </div>
          </motion.div>

          {/* Right: framed hero image */}
          <motion.div initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, delay: 0.1 }} className="relative">
            <div aria-hidden className="absolute -inset-4 rounded-[28px]" style={{ border: `1px solid ${line}` }} />
            <div className="relative aspect-[4/5] sm:aspect-[5/6] rounded-3xl overflow-hidden" style={{ border: `1px solid ${line}`, boxShadow: `0 40px 80px -40px ${bg}` }}>
              <img src={image} alt="" className="absolute inset-0 w-full h-full object-cover" />
              <div aria-hidden className="absolute inset-0" style={{ background: `linear-gradient(to top, ${bg}CC, transparent 55%)` }} />
            </div>
            {/* Floating accent chip (static polish — see doc) */}
            <div className="absolute -bottom-5 -left-5 rounded-2xl px-5 py-4 backdrop-blur-md" style={{ backgroundColor: surface, border: `1px solid ${line}`, boxShadow: `0 20px 40px -20px ${bg}` }}>
              <div className="text-2xl font-extrabold leading-none" style={{ color: titleColor }}>100%</div>
              <div className="text-[11px] uppercase tracking-widest mt-1" style={{ color: mutedColor }}>Satisfaction</div>
            </div>
          </motion.div>
        </div>
      </div>
    </header>
  );
};

export default HeroEditorial;
