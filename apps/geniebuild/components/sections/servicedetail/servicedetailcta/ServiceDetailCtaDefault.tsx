import React from 'react';
import { Section, WebsiteElement } from '../../../../types';
import { ElementsSection } from '../../homepage/ElementsSection';
import { motion } from 'motion/react';
import { getCtaPhoneSubText, mapCtaTrustItems } from '../../homepage/cta/ctaTrustStrip';

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

export const ServiceDetailCtaDefault: React.FC<Props> = ({
  section, onTextEdit, buttonClass, onElementSelect, onElementUpdate,
  selectedElementId, readOnly = false, themeColors: tc,
}) => {
  const { content, styles } = section;
  const s = styles as any;

  const bg         = s.backgroundColor || tc?.backgroundColor || '#0A0F14';
  const titleColor = tc?.titleColor || '#F8FAFC';
  const textColor  = tc?.textColor || '#C7CDD6';
  const accent     = tc?.iconColor || tc?.accentColor || '#E11D48';

  // Padding — compact vertical rhythm (badge + description removed → less air needed)
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

  // Highlighted heading
  const titleEl: WebsiteElement = (() => {
    const id = `${section.id}-sdc-title`;
    const existing = section.elements?.find(e => e.id === id);
    const c = (existing?.content || {}) as any;
    const sourceText: string = (c.text || content.title || "Ready to Book This Service?").toString().replace(/<[^>]+>/g, '').trim();
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

  const phoneEl: WebsiteElement = section.elements?.find(e => e.id === `${section.id}-sdc-phone`) || {
    id: `${section.id}-sdc-phone`, type: 'heading',
    content: { text: (content as any).phoneNumber || '(555) 123-4567', htmlTag: 'div' as any },
    style: { color: accent, fontWeight: '900', fontSize: 'clamp(1.75rem, 5vw, 3rem)', letterSpacing: '-0.02em', textAlign: 'center' as any },
  };

  const phoneSubText = getCtaPhoneSubText(content as Record<string, unknown>);
  const existingPhoneSub = section.elements?.find(e => e.id === `${section.id}-sdc-phone-sub`);
  const phoneSubEl: WebsiteElement = existingPhoneSub
    ? {
        ...existingPhoneSub,
        content: { ...(existingPhoneSub.content || {}), text: phoneSubText || (existingPhoneSub.content as any)?.text || '', textSize: 'small' },
      }
    : {
        id: `${section.id}-sdc-phone-sub`, type: 'text',
        content: { text: phoneSubText, textSize: 'small' },
        style: { fontWeight: '600', textTransform: 'uppercase' as any, letterSpacing: '0.1em', textAlign: 'center' as any, fontSize: '0.72rem' },
      };

  const trustItems = mapCtaTrustItems(content as Record<string, unknown>);
  const existingTrust = section.elements?.find(e => e.id === `${section.id}-sdc-trust`);
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
        id: `${section.id}-sdc-trust`, type: 'trust-strip',
        content: { items: trustItems } as any,
        style: trustStripStyle,
      };

  // Layered ambience built from theme tokens — no hex hardcoded.
  const ambientLayers: React.CSSProperties = {
    backgroundImage: [
      // Top-left soft glow
      `radial-gradient(60% 50% at 18% 12%, ${accent}22 0%, transparent 60%)`,
      // Bottom-right counter glow
      `radial-gradient(55% 45% at 82% 88%, ${accent}1A 0%, transparent 65%)`,
      // Center conic sweep — very low opacity
      `conic-gradient(from 220deg at 50% 50%, transparent 0deg, ${accent}10 90deg, transparent 180deg, ${accent}08 270deg, transparent 360deg)`,
      // Faint grid lines built from titleColor (works on dark + light bg)
      `linear-gradient(${titleColor}06 1px, transparent 1px)`,
      `linear-gradient(90deg, ${titleColor}06 1px, transparent 1px)`,
    ].join(', '),
    backgroundSize: 'auto, auto, auto, 56px 56px, 56px 56px',
    backgroundPosition: 'center, center, center, center, center',
  };

  return (
    <div className="relative w-full overflow-hidden" style={{ backgroundColor: bg }}>
      {/* Ambient layered background — theme-token-driven, non-interactive. */}
      <div className="absolute inset-0 pointer-events-none" style={ambientLayers} />
      {/* Vignette so the edges feel softer and the center reads cleaner. */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: `radial-gradient(ellipse at center, transparent 55%, ${bg} 100%)` }}
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

        {/* Phone number */}
        <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.25 }} className="mb-7">
          <ElementsSection section={{ ...section, elements: [phoneEl] }} onTextEdit={onTextEdit}
            onElementUpdate={onElementUpdate || (() => {})} onElementSelect={onElementSelect}
            selectedElementId={selectedElementId} readOnly={readOnly} isWrapped={false}
            buttonClass={buttonClass} themeColors={themeColors} />
          <ElementsSection section={{ ...section, elements: [phoneSubEl] }} onTextEdit={onTextEdit}
            onElementUpdate={onElementUpdate || (() => {})} onElementSelect={onElementSelect}
            selectedElementId={selectedElementId} readOnly={readOnly} isWrapped={false}
            buttonClass={buttonClass} themeColors={themeColors} />
        </motion.div>

        {/* Trust strip — single editable element */}
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

export default ServiceDetailCtaDefault;
