import React from 'react';
import { Section, WebsiteElement } from '../../../../types';
import { ElementsSection } from '../ElementsSection';
import { motion } from 'motion/react';
import { getCtaPhoneSubText, mapCtaTrustItems } from './ctaTrustStrip';

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
 * CTAEditorial — part of the "Editorial" complete-homepage variant set.
 *
 * A bold dark banner inside a rounded panel: a two-column split with the copy
 * (badge + accent heading + subtitle + primary CTA button) on the left, and a
 * large clickable phone block on the right; a row of trust stats runs along the
 * bottom. Industry-neutral, dark section.
 *
 * Fully dynamic keys: badgeText, title, subtitle, ctaText/ctaHref (or
 * contactText/contactHref backend-injected), phoneNumber, phoneSubText,
 * items[]{label,icon} (trust stats, via mapCtaTrustItems). No images. Element
 * ids reuse the `c1-` prefix (`c1-title/phone/phone-sub/trust` + new
 * `c1-badge/desc/btn`) so content carries over on variant switch.
 */
export const CTAEditorial: React.FC<Props> = ({
  section, onTextEdit, buttonClass, onElementSelect, onElementUpdate,
  selectedElementId, readOnly = false, themeColors: tc,
}) => {
  const { content, styles } = section;
  const s = styles as any;
  const c = content as any;

  const bg         = s.backgroundColor || tc?.backgroundColor || '#0A0F14';
  const titleColor = tc?.titleColor || '#F8FAFC';
  const textColor  = tc?.textColor || '#C7CDD6';
  const accent     = tc?.iconColor || tc?.accentColor || '#E11D48';
  const btnBg      = tc?.buttonBackgroundColor || accent;
  const btnText    = tc?.buttonTextColor || '#FFFFFF';
  const line       = tc?.navBorderColor || 'rgba(255,255,255,0.12)';
  const panel      = tc?.surface || 'rgba(255,255,255,0.04)';
  const mutedColor = tc?.textColorMuted || tc?.muted || 'rgba(255,255,255,0.55)';

  const isCssValue = (v: any) => typeof v === 'string' && /(px|rem|em|%|vh|vw)$/.test(v.trim());
  const padT = s.paddingTop    ?? 'pt-16 lg:pt-24';
  const padB = s.paddingBottom ?? 'pb-16 lg:pb-24';
  const padX = s.paddingX      ?? 'px-6';
  const innerClass = `max-w-[1240px] mx-auto ${isCssValue(padX) ? '' : padX} ${isCssValue(padT) ? '' : padT} ${isCssValue(padB) ? '' : padB}`.trim();
  const innerStyle: React.CSSProperties = {
    ...(isCssValue(padX) ? { paddingLeft: padX, paddingRight: padX } : {}),
    ...(isCssValue(padT) ? { paddingTop: padT } : {}),
    ...(isCssValue(padB) ? { paddingBottom: padB } : {}),
  };

  const themeColors = {
    ...tc, titleColor, textColor, accentColor: accent, secondaryHeadingColor: titleColor,
    buttonBackgroundColor: btnBg, buttonTextColor: btnText,
  };

  const badgeEl: WebsiteElement = section.elements?.find(e => e.id === `${section.id}-c1-badge`) || {
    id: `${section.id}-c1-badge`, type: 'badge',
    content: { text: c.badgeText || 'Ready when you are', iconPosition: 'left' },
    style: { fontSize: '0.7rem', fontWeight: '700', letterSpacing: '0.24em', textTransform: 'uppercase' as any, padding: '6px 14px', borderRadius: '9999px', textAlign: 'center' as any, backgroundColor: line, color: mutedColor },
  };
  const badgeElResolved: WebsiteElement = { ...badgeEl, content: { ...(badgeEl.content || {}), text: c.badgeText || (badgeEl.content as any)?.text } };

  const titleEl: WebsiteElement = (() => {
    const id = `${section.id}-c1-title`;
    const existing = section.elements?.find(e => e.id === id);
    const cc = (existing?.content || {}) as any;
    const src = (cc.text || c.title || 'Need it sorted? Let’s talk today.').toString().replace(/<[^>]+>/g, '').trim();
    const base: WebsiteElement = existing || {
      id, type: 'heading',
      content: { text: src, htmlTag: 'h2' },
      style: { textAlign: 'left' as any, color: titleColor, fontWeight: '800', fontSize: 'clamp(2rem, 4vw, 3rem)', lineHeight: '1.1', letterSpacing: '-0.03em' },
    };
    if (existing) {
      return { ...existing, type: 'heading', content: { ...(existing.content || {}), htmlTag: (existing.content as any)?.htmlTag || 'h2' }, style: { ...(base.style as any), ...(existing.style as any) } } as WebsiteElement;
    }
    return { ...base, content: { ...(base.content || {}), text: src, htmlTag: 'h2' } };
  })();

  const descEl: WebsiteElement = section.elements?.find(e => e.id === `${section.id}-c1-desc`) || {
    id: `${section.id}-c1-desc`, type: 'text',
    content: { text: c.subtitle || c.description || 'Get a fast, friendly response and a fair quote before any work starts. No pressure, no surprises.', textSize: 'large' },
    style: { textAlign: 'left' as any, color: textColor, maxWidth: '480px', lineHeight: '1.7' },
  };
  const descElResolved: WebsiteElement = { ...descEl, content: { ...(descEl.content || {}), text: c.subtitle || c.description || (descEl.content as any)?.text } };

  const ctaText = String(c.ctaText || c.contactText || 'Get your free quote');
  const ctaHref = String(c.ctaHref || c.contactHref || '#');
  const btnEl: WebsiteElement = section.elements?.find(e => e.id === `${section.id}-c1-btn`) || {
    id: `${section.id}-c1-btn`, type: 'cta-button',
    content: { text: ctaText, link: ctaHref, buttonVariant: 'primary' },
    style: { buttonVariant: 'primary', backgroundColor: btnBg, color: btnText, padding: '0 2rem', height: '3.1rem', borderRadius: '0.6rem', fontWeight: '700', fontSize: '0.95rem' } as any,
  };
  const btnElResolved: WebsiteElement = { ...btnEl, content: { ...(btnEl.content || {}), text: ctaText, link: ctaHref } };

  const phoneEl: WebsiteElement = section.elements?.find(e => e.id === `${section.id}-c1-phone`) || {
    id: `${section.id}-c1-phone`, type: 'heading',
    content: { text: c.phoneNumber || '(555) 123-4567', htmlTag: 'div' as any },
    style: { color: accent, fontWeight: '900', fontSize: 'clamp(1.75rem, 5vw, 3rem)', letterSpacing: '-0.02em', textAlign: 'center' as any },
  };

  const phoneSubText = getCtaPhoneSubText(content as Record<string, unknown>);
  const existingPhoneSub = section.elements?.find(e => e.id === `${section.id}-c1-phone-sub`);
  const phoneSubEl: WebsiteElement = existingPhoneSub
    ? { ...existingPhoneSub, content: { ...(existingPhoneSub.content || {}), text: phoneSubText || (existingPhoneSub.content as any)?.text || '', textSize: 'small' } }
    : {
        id: `${section.id}-c1-phone-sub`, type: 'text',
        content: { text: phoneSubText || 'Call us direct', textSize: 'small' },
        style: { fontWeight: '600', textTransform: 'uppercase' as any, letterSpacing: '0.1em', textAlign: 'center' as any, fontSize: '0.72rem', color: textColor },
      };

  const trustItems = mapCtaTrustItems(content as Record<string, unknown>);
  const existingTrust = section.elements?.find(e => e.id === `${section.id}-c1-trust`);
  const trustStripStyle = { gap: '32px', iconColor: accent, iconBackgroundColor: `${accent}20`, titleColor, iconContainerSize: '28px', iconSize: '12px', justifyContent: 'center' } as any;
  const trustStripEl: WebsiteElement = existingTrust
    ? { ...existingTrust, content: { ...(existingTrust.content || {}), items: trustItems.length > 0 ? trustItems : (existingTrust.content as any)?.items || [] } as any, style: { ...(existingTrust.style || {}), ...trustStripStyle } }
    : { id: `${section.id}-c1-trust`, type: 'trust-strip', content: { items: trustItems } as any, style: trustStripStyle };
  const hasTrust = ((trustStripEl.content as any)?.items || []).length > 0;

  const pass = {
    onTextEdit, onElementUpdate: onElementUpdate || (() => {}), onElementSelect,
    selectedElementId, readOnly, isWrapped: false, buttonClass, themeColors,
  } as const;

  const uid = `ce-${String(section.id).replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const hasPhone = !!(c.phoneNumber);

  return (
    <div className={`relative w-full overflow-hidden ${uid}`} style={{ backgroundColor: bg }}>
      <div className={`${innerClass} relative z-10`} style={innerStyle}>
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}
          className="relative rounded-3xl overflow-hidden p-8 sm:p-12" style={{ border: `1px solid ${line}`, backgroundColor: panel }}>

          {/* ambient glow */}
          <div aria-hidden className="absolute inset-0 pointer-events-none" style={{ backgroundImage: `radial-gradient(60% 60% at 15% 10%, ${accent}14 0%, transparent 60%), radial-gradient(55% 55% at 90% 100%, ${accent}10 0%, transparent 65%)` }} />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-10 items-center">
            {/* Left copy */}
            <div>
              <div className="inline-flex mb-5"><ElementsSection section={{ ...section, elements: [badgeElResolved] }} {...pass} /></div>
              <ElementsSection section={{ ...section, elements: [titleEl] }} {...pass} />
              <div className="mt-4"><ElementsSection section={{ ...section, elements: [descElResolved] }} {...pass} /></div>
              <div className="mt-8" style={{ width: 'max-content' }}><ElementsSection section={{ ...section, elements: [btnElResolved] }} {...pass} /></div>
            </div>

            {/* Right phone block */}
            {hasPhone && (
              <div className="lg:border-l lg:pl-10 flex flex-col items-center lg:items-start justify-center" style={{ borderColor: line }}>
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl mb-4" style={{ backgroundColor: line, color: mutedColor }}><i className="fa-solid fa-phone text-lg" /></span>
                <ElementsSection section={{ ...section, elements: [phoneEl] }} {...pass} />
                <ElementsSection section={{ ...section, elements: [phoneSubEl] }} {...pass} />
              </div>
            )}
          </div>

          {/* Trust stats row */}
          {hasTrust && (
            <div className="relative z-10 mt-10 pt-8" style={{ borderTop: `1px solid ${line}` }}>
              <ElementsSection section={{ ...section, elements: [trustStripEl] }} {...pass} />
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default CTAEditorial;
