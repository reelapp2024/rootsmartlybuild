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
 * CTAPlumbing3 — same structure as CTAPlumbing1 / CTAPlumbing2 (title + phone +
 * phoneSub + trust-strip, no buttons), but a distinct visual identity:
 *   • Dotted-grid background pattern (CTA1 = radial glows, CTA2 = diagonal stripes)
 *   • Underlined heading with accent stroke beneath the title
 *   • Phone number rendered with a left/right accent rule on each side
 */
export const CTAPlumbing3: React.FC<Props> = ({
  section, onTextEdit, buttonClass, onElementSelect, onElementUpdate,
  selectedElementId, readOnly = false, themeColors: tc,
}) => {
  const { content, styles } = section;
  const s = styles as any;

  const bg         = s.backgroundColor || tc?.backgroundColor || '#0A0F14';
  const titleColor = tc?.titleColor || '#F8FAFC';
  const textColor  = tc?.textColor || '#C7CDD6';
  const accent     = tc?.iconColor || tc?.accentColor || '#E11D48';

  const isCssValue = (v: any) => typeof v === 'string' && /(px|rem|em|%|vh|vw)$/.test(v.trim());
  const padT = s.paddingTop    ?? 'pt-10 sm:pt-12 lg:pt-16';
  const padB = s.paddingBottom ?? 'pb-10 sm:pb-12 lg:pb-16';
  const padX = s.paddingX      ?? 'px-4 sm:px-6';
  const innerClass = `max-w-3xl mx-auto text-center ${isCssValue(padX) ? '' : padX} ${isCssValue(padT) ? '' : padT} ${isCssValue(padB) ? '' : padB}`.trim();
  const innerStyle: React.CSSProperties = {
    ...(isCssValue(padX) ? { paddingLeft: padX, paddingRight: padX } : {}),
    ...(isCssValue(padT) ? { paddingTop: padT } : {}),
    ...(isCssValue(padB) ? { paddingBottom: padB } : {}),
  };

  const themeColors = { ...tc, titleColor, textColor, accentColor: accent, secondaryHeadingColor: accent };

  // Title — last word highlighted
  const titleEl: WebsiteElement = (() => {
    const id = `${section.id}-c3-title`;
    const existing = section.elements?.find(e => e.id === id);
    const c = (existing?.content || {}) as any;
    const sourceText: string = (c.text || content.title || 'Join 5,000+ Satisfied Customers').toString().replace(/<[^>]+>/g, '').trim();
    const base: WebsiteElement = existing || {
      id, type: 'heading',
      content: { text: sourceText, htmlTag: 'h2' },
      style: { textAlign: 'center' as any, fontWeight: '800', fontSize: 'clamp(1.75rem, 4vw, 2.75rem)', lineHeight: '1.15', letterSpacing: '-0.02em', titleColor },
    };
    if (existing) {
      return {
        ...existing,
        type: 'heading',
        content: {
          ...(existing.content || {}),
          htmlTag: (existing.content as any)?.htmlTag || 'h2',
        },
        style: { ...(base.style as any), ...(existing.style as any), titleColor },
      } as WebsiteElement;
    }
    return { ...base, content: { ...(base.content || {}), text: sourceText, htmlTag: base.content?.htmlTag || 'h2' } };
  })();

  const phoneEl: WebsiteElement = section.elements?.find(e => e.id === `${section.id}-c3-phone`) || {
    id: `${section.id}-c3-phone`, type: 'heading',
    content: { text: (content as any).phoneNumber || '(555) 123-4567', htmlTag: 'div' as any },
    style: { color: accent, fontWeight: '900', fontSize: 'clamp(1.75rem, 5vw, 3rem)', letterSpacing: '-0.02em', textAlign: 'center' as any },
  };

  const phoneSubText = getCtaPhoneSubText(content as Record<string, unknown>);
  const existingPhoneSub = section.elements?.find(e => e.id === `${section.id}-c3-phone-sub`);
  const phoneSubEl: WebsiteElement = existingPhoneSub
    ? {
        ...existingPhoneSub,
        content: { ...(existingPhoneSub.content || {}), text: phoneSubText || (existingPhoneSub.content as any)?.text || '', textSize: 'small' },
      }
    : {
        id: `${section.id}-c3-phone-sub`, type: 'text',
        content: { text: phoneSubText, textSize: 'small' },
        style: { fontWeight: '600', textTransform: 'uppercase' as any, letterSpacing: '0.1em', textAlign: 'center' as any, fontSize: '0.72rem' },
      };

  const trustItems = mapCtaTrustItems(content as Record<string, unknown>);
  const existingTrust = section.elements?.find(e => e.id === `${section.id}-c3-trust`);
  const trustStripStyle = {
    gap: '24px',
    iconColor: accent,
    iconBackgroundColor: `${accent}20`,
    titleColor,
    iconContainerSize: '28px',
    iconSize: '12px',
    justifyContent: 'center',
  } as any;
  const trustStripEl: WebsiteElement = existingTrust
    ? {
        ...existingTrust,
        content: {
          ...(existingTrust.content || {}),
          items: trustItems.length > 0 ? trustItems : (existingTrust.content as any)?.items || [],
        } as any,
        style: { ...(existingTrust.style || {}), ...trustStripStyle },
      }
    : {
        id: `${section.id}-c3-trust`, type: 'trust-strip',
        content: { items: trustItems } as any,
        style: trustStripStyle,
      };

  return (
    <div className="relative w-full overflow-hidden" style={{ backgroundColor: bg }}>
      {/* CTA3 background = "blueprint rings" —
          Concentric accent rings radiate from the center + a fine plus-mark grid
          underneath. Reads like a technical/blueprint sheet — completely different
          rhythm from CTA1 (ambient glows) and CTA2 (mesh orbs). */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: [
            // Three concentric rings centered (distance bands)
            `radial-gradient(circle at 50% 50%, transparent 0, transparent 140px, ${accent}25 141px, ${accent}25 142px, transparent 143px)`,
            `radial-gradient(circle at 50% 50%, transparent 0, transparent 240px, ${accent}1A 241px, ${accent}1A 242px, transparent 243px)`,
            `radial-gradient(circle at 50% 50%, transparent 0, transparent 360px, ${accent}10 361px, ${accent}10 362px, transparent 363px)`,
            // Plus-mark grid pattern (small + signs at intersections)
            `linear-gradient(${accent}12 1px, transparent 1px)`,
            `linear-gradient(90deg, ${accent}12 1px, transparent 1px)`,
          ].join(', '),
          backgroundSize: 'auto, auto, auto, 40px 40px, 40px 40px',
          backgroundPosition: 'center, center, center, 0 0, 0 0',
        }}
      />
      {/* Crosshair lines through the dead center — completes the blueprint feel */}
      <div
        className="absolute top-1/2 left-0 right-0 h-px pointer-events-none"
        style={{ background: `linear-gradient(90deg, transparent 0%, ${accent}30 30%, ${accent}30 70%, transparent 100%)` }}
      />
      <div
        className="absolute left-1/2 top-0 bottom-0 w-px pointer-events-none"
        style={{ background: `linear-gradient(180deg, transparent 0%, ${accent}30 30%, ${accent}30 70%, transparent 100%)` }}
      />
      {/* Edge vignette so the rings + grid fade at the edges instead of getting cut off */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at 50% 50%, transparent 35%, ${bg}CC 75%, ${bg} 100%)`,
        }}
      />

      <div className={`${innerClass} relative z-10`} style={innerStyle}>
        {/* Title with accent underscore */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }} className="mb-6">
          <ElementsSection section={{ ...section, elements: [titleEl] }} onTextEdit={onTextEdit}
            onElementUpdate={onElementUpdate || (() => {})} onElementSelect={onElementSelect}
            selectedElementId={selectedElementId} readOnly={readOnly} isWrapped={false}
            buttonClass={buttonClass} themeColors={themeColors} />
          {/* Decorative accent stroke beneath the heading */}
          <div className="flex justify-center mt-3">
            <div
              className="h-1 rounded-full"
              style={{
                width: '64px',
                background: `linear-gradient(90deg, transparent 0%, ${accent} 50%, transparent 100%)`,
              }}
            />
          </div>
        </motion.div>

        {/* Phone block — flanked by accent rules on each side, instead of a box. */}
        <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.25 }} className="mb-7">
          <div className="flex items-center gap-4 sm:gap-6 max-w-md mx-auto">
            <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg, transparent 0%, ${accent}80 100%)` }} />
            <div className="shrink-0">
              <ElementsSection section={{ ...section, elements: [phoneEl] }} onTextEdit={onTextEdit}
                onElementUpdate={onElementUpdate || (() => {})} onElementSelect={onElementSelect}
                selectedElementId={selectedElementId} readOnly={readOnly} isWrapped={false}
                buttonClass={buttonClass} themeColors={themeColors} />
            </div>
            <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg, ${accent}80 0%, transparent 100%)` }} />
          </div>
          <div className="mt-3">
            <ElementsSection section={{ ...section, elements: [phoneSubEl] }} onTextEdit={onTextEdit}
              onElementUpdate={onElementUpdate || (() => {})} onElementSelect={onElementSelect}
              selectedElementId={selectedElementId} readOnly={readOnly} isWrapped={false}
              buttonClass={buttonClass} themeColors={themeColors} />
          </div>
        </motion.div>

        {/* Trust strip */}
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.5 }} className="mt-7 sm:mt-8">
          <ElementsSection section={{ ...section, elements: [trustStripEl] }} onTextEdit={onTextEdit}
            onElementUpdate={onElementUpdate || (() => {})} onElementSelect={onElementSelect}
            selectedElementId={selectedElementId} readOnly={readOnly} isWrapped={false}
            buttonClass={buttonClass} themeColors={themeColors} />
        </motion.div>
      </div>
    </div>
  );
};
