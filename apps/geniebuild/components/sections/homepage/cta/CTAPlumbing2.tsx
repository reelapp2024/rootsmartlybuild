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
 * CTAPlumbing2 — same structure as CTAPlumbing1 (title + phone + phoneSub + trust-strip,
 * no buttons), but a distinct visual identity:
 *   • Diagonal accent stripes background (CTA1 uses radial glows)
 *   • Center pill-card surrounding the phone number — anchors the design
 *   • No vignette overlay
 */
export const CTAPlumbing2: React.FC<Props> = ({
  section, onTextEdit, buttonClass, onElementSelect, onElementUpdate,
  selectedElementId, readOnly = false, themeColors: tc,
}) => {
  const { content, styles } = section;
  const s = styles as any;

  const bg         = s.backgroundColor || tc?.backgroundColor || '#0C1015';
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
    const id = `${section.id}-c2-title`;
    const existing = section.elements?.find(e => e.id === id);
    const c = (existing?.content || {}) as any;
    const sourceText: string = (c.text || content.title || 'Ready to Fix Your Plumbing Issues?').toString().replace(/<[^>]+>/g, '').trim();
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
      style: { textAlign: 'center' as any, fontWeight: '800', fontSize: 'clamp(1.75rem, 4vw, 2.75rem)', lineHeight: '1.15', letterSpacing: '-0.02em' },
    };
    return { ...base, content: { ...(base.content || {}), text: sourceText, textBefore, highlightedText, textAfter: '', htmlTag: base.content?.htmlTag || 'h2' } };
  })();

  const phoneEl: WebsiteElement = section.elements?.find(e => e.id === `${section.id}-c2-phone`) || {
    id: `${section.id}-c2-phone`, type: 'heading',
    content: { text: (content as any).phoneNumber || '(555) 123-4567', htmlTag: 'div' as any },
    style: { color: accent, fontWeight: '900', fontSize: 'clamp(1.75rem, 5vw, 3rem)', letterSpacing: '-0.02em', textAlign: 'center' as any },
  };

  const phoneSubText = getCtaPhoneSubText(content as Record<string, unknown>);
  const existingPhoneSub = section.elements?.find(e => e.id === `${section.id}-c2-phone-sub`);
  const phoneSubEl: WebsiteElement = existingPhoneSub
    ? {
        ...existingPhoneSub,
        content: { ...(existingPhoneSub.content || {}), text: phoneSubText || (existingPhoneSub.content as any)?.text || '', textSize: 'small' },
      }
    : {
        id: `${section.id}-c2-phone-sub`, type: 'text',
        content: { text: phoneSubText, textSize: 'small' },
        style: { fontWeight: '600', textTransform: 'uppercase' as any, letterSpacing: '0.1em', textAlign: 'center' as any, fontSize: '0.72rem' },
      };

  const trustItems = mapCtaTrustItems(content as Record<string, unknown>);
  const existingTrust = section.elements?.find(e => e.id === `${section.id}-c2-trust`);
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
        id: `${section.id}-c2-trust`, type: 'trust-strip',
        content: { items: trustItems } as any,
        style: trustStripStyle,
      };

  return (
    <div className="relative w-full overflow-hidden" style={{ backgroundColor: bg }}>
      {/* CTA2 background = "Mesh gradient" —
          Smooth multi-stop gradient with off-axis blurred orbs. Modern and clean. */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `linear-gradient(135deg, ${accent}14 0%, transparent 40%, ${accent}08 100%)`,
        }}
      />
      {/* Top-left blurred orb */}
      <div
        className="absolute -top-32 -left-32 w-[520px] h-[520px] pointer-events-none rounded-full"
        style={{
          background: `${accent}25`,
          filter: 'blur(80px)',
          opacity: 0.85,
        }}
      />
      {/* Bottom-right blurred orb */}
      <div
        className="absolute -bottom-40 -right-40 w-[560px] h-[560px] pointer-events-none rounded-full"
        style={{
          background: `${accent}1F`,
          filter: 'blur(90px)',
          opacity: 0.75,
        }}
      />

      <div className={`${innerClass} relative z-10`} style={innerStyle}>
        {/* Title */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }} className="mb-5">
          <ElementsSection section={{ ...section, elements: [titleEl] }} onTextEdit={onTextEdit}
            onElementUpdate={onElementUpdate || (() => {})} onElementSelect={onElementSelect}
            selectedElementId={selectedElementId} readOnly={readOnly} isWrapped={false}
            buttonClass={buttonClass} themeColors={themeColors} />
        </motion.div>

        {/* Phone block — wrapped in a center pill card to differentiate from CTA1. */}
        <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.25 }} className="mb-7">
          <div
            className="inline-block px-8 py-5 rounded-2xl mx-auto"
            style={{
              backgroundColor: `${accent}10`,
              border: `1px solid ${accent}30`,
              backdropFilter: 'blur(8px)',
            }}
          >
            <ElementsSection section={{ ...section, elements: [phoneEl] }} onTextEdit={onTextEdit}
              onElementUpdate={onElementUpdate || (() => {})} onElementSelect={onElementSelect}
              selectedElementId={selectedElementId} readOnly={readOnly} isWrapped={false}
              buttonClass={buttonClass} themeColors={themeColors} />
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
