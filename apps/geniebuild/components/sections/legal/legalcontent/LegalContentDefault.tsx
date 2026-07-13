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

const DEFAULT_SECTIONS = [
  { heading: '1. Information We Collect', bodyHtml: 'We collect information you provide directly to us, such as your name, email address and phone number when you contact us or request a service. We also collect limited technical data (like your browser type) to keep our site secure and functional.' },
  { heading: '2. How We Use Your Information', bodyHtml: 'Your information is used solely to respond to enquiries, schedule and deliver services, and improve your experience. We never sell your personal data to third parties.' },
  { heading: '3. Cookies & Tracking', bodyHtml: 'We use essential cookies to run the site and optional analytics cookies to understand how visitors use it. You can disable non-essential cookies in your browser settings at any time.' },
  { heading: '4. Data Security', bodyHtml: 'We apply reasonable technical and organisational measures to protect your data against unauthorised access, loss or misuse. No method of transmission is 100% secure, but we work hard to safeguard your information.' },
  { heading: '5. Your Rights', bodyHtml: 'You may request access to, correction of, or deletion of your personal data at any time. To exercise these rights, simply reach out to us through our contact page.' },
  { heading: '6. Changes to This Policy', bodyHtml: 'We may update this policy from time to time. Any changes will be posted on this page with an updated revision date above.' },
];

/**
 * LegalContentDefault — renders the legal document body: a list of
 * heading + rich-text sections (schema `sections: [{ heading, bodyHtml }]`).
 * Light section (tc.light). Each section heading is an editable ElementsSection
 * element; body is rendered as themed prose.
 */
export const LegalContentDefault: React.FC<Props> = ({
  section, onTextEdit, buttonClass, onElementSelect, onElementUpdate,
  selectedElementId, readOnly = false, themeColors: tc,
}) => {
  const { content, styles } = section;
  const s = styles as any;
  const c = content as any;

  const lc = tc?.light || {};
  const fb = lc.featureBox || {};
  const accent     = lc.accentColor || tc?.accentColor || '#E11D48';
  const titleColor = fb.titleColor || lc.titleColor || '#111827';
  const textColor  = fb.textColor  || lc.textColor  || '#374151';

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
  const padT = s.paddingTop    ?? 'pt-14 sm:pt-16 lg:pt-20';
  const padB = s.paddingBottom ?? 'pb-16 sm:pb-20 lg:pb-24';
  const padX = s.paddingX      ?? 'px-4 sm:px-6';
  const innerClass = `max-w-3xl mx-auto ${isCssValue(padX) ? '' : padX} ${isCssValue(padT) ? '' : padT} ${isCssValue(padB) ? '' : padB}`.trim();
  const innerStyle: React.CSSProperties = {
    ...(isCssValue(padX) ? { paddingLeft: padX, paddingRight: padX } : {}),
    ...(isCssValue(padT) ? { paddingTop: padT } : {}),
    ...(isCssValue(padB) ? { paddingBottom: padB } : {}),
  };

  const docSections: Array<{ heading: string; bodyHtml: string }> =
    Array.isArray(c.sections) && c.sections.length
      ? c.sections.map((x: any) => ({ heading: String(x?.heading || ''), bodyHtml: String(x?.bodyHtml || x?.body || '') }))
      : DEFAULT_SECTIONS;

  const themeColors = { ...tc, titleColor, textColor, accentColor: accent, secondaryHeadingColor: accent };
  const passThrough = {
    onTextEdit, onElementUpdate: onElementUpdate || (() => {}), onElementSelect,
    selectedElementId, readOnly, isWrapped: false, buttonClass, themeColors,
  } as const;

  const getHeadingEl = (i: number, heading: string): WebsiteElement => {
    const id = `${section.id}-lc-h${i}`;
    const existing = section.elements?.find(e => e.id === id);
    const base: WebsiteElement = existing || {
      id, type: 'heading',
      content: { text: heading, htmlTag: 'h2' },
      style: { fontWeight: '800', fontSize: '1.375rem', lineHeight: '1.3', textAlign: 'left' as any },
    };
    return { ...base, content: { ...(base.content || {}), text: (existing?.content as any)?.text || heading } };
  };

  return (
    <div className="w-full" style={{ backgroundColor: bg }}>
      <div className={innerClass} style={innerStyle}>
        <div className="space-y-9">
          {docSections.map((sec, i) => {
            const isHtml = /<[a-z][\s\S]*>/i.test(sec.bodyHtml);
            return (
              <motion.div key={i}
                initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ duration: 0.45, delay: (i % 4) * 0.05 }}
                className="space-y-3"
              >
                <ElementsSection section={{ ...section, elements: [getHeadingEl(i, sec.heading)] }} {...passThrough} />
                {isHtml ? (
                  <div className="legal-prose" style={{ color: textColor, fontSize: '1rem', lineHeight: 1.75 }}
                    dangerouslySetInnerHTML={{ __html: sec.bodyHtml }} />
                ) : (
                  <p style={{ color: textColor, fontSize: '1rem', lineHeight: 1.75 }}>{sec.bodyHtml}</p>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default LegalContentDefault;
