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

const DEFAULT_BODY = `Choosing the right professional can feel overwhelming, but a few simple checks make all the difference. Start by verifying licenses and insurance — this protects you and signals a serious, accountable business.

Next, ask for references and read recent reviews. Look for consistent themes: punctuality, clear communication, and clean workmanship. A great provider will happily explain the scope of work and pricing before starting, so you never face surprise costs.

Finally, trust your instincts. The best providers make you feel informed and respected, not pressured. Take your time, compare a few options, and choose the team that treats your home like their own.`;

/**
 * BlogContentDefault — the article body. Light section (tc.light). The lead
 * paragraph text is an editable ElementsSection element; the rest of the body is
 * rendered from content.content (HTML or plain text) into styled prose.
 */
export const BlogContentDefault: React.FC<Props> = ({
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
  const padT = s.paddingTop    ?? 'pt-16 sm:pt-20 lg:pt-24';
  const padB = s.paddingBottom ?? 'pb-10 sm:pb-12 lg:pb-16';
  const padX = s.paddingX      ?? 'px-4 sm:px-6';
  const innerClass = `max-w-3xl mx-auto ${isCssValue(padX) ? '' : padX} ${isCssValue(padT) ? '' : padT} ${isCssValue(padB) ? '' : padB}`.trim();
  const innerStyle: React.CSSProperties = {
    ...(isCssValue(padX) ? { paddingLeft: padX, paddingRight: padX } : {}),
    ...(isCssValue(padT) ? { paddingTop: padT } : {}),
    ...(isCssValue(padB) ? { paddingBottom: padB } : {}),
  };

  const themeColors = { ...tc, titleColor, textColor, accentColor: accent, secondaryHeadingColor: accent };
  const passThrough = {
    onTextEdit, onElementUpdate: onElementUpdate || (() => {}), onElementSelect,
    selectedElementId, readOnly, isWrapped: false, buttonClass, themeColors,
  } as const;

  const rawBody = String(c.content || c.body || DEFAULT_BODY);
  const isHtml = /<[a-z][\s\S]*>/i.test(rawBody);
  const paragraphs = isHtml ? [] : rawBody.split(/\n{2,}/).map(p => p.trim()).filter(Boolean);

  // First paragraph is an editable lead element; rest render as prose.
  const leadEl: WebsiteElement = section.elements?.find(e => e.id === `${section.id}-bc-lead`) || {
    id: `${section.id}-bc-lead`, type: 'text',
    content: { text: paragraphs[0] || rawBody.replace(/<[^>]+>/g, ' ').slice(0, 220), textSize: 'large' },
    style: { lineHeight: '1.8', textAlign: 'left' as any, fontWeight: '500' },
  };

  return (
    <div className="w-full" style={{ backgroundColor: bg }}>
      <div className={innerClass} style={innerStyle}>
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          transition={{ duration: 0.5 }} className="space-y-5">

          <ElementsSection section={{ ...section, elements: [leadEl] }} {...passThrough} />

          {isHtml ? (
            <div
              className="blog-prose leading-relaxed"
              style={{ color: textColor, fontSize: '1.05rem', lineHeight: 1.8 }}
              dangerouslySetInnerHTML={{ __html: rawBody }}
            />
          ) : (
            paragraphs.slice(1).map((p, i) => (
              <p key={i} style={{ color: textColor, fontSize: '1.05rem', lineHeight: 1.8 }}>{p}</p>
            ))
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default BlogContentDefault;
