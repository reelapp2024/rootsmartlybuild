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

const DEFAULT_COMMENTS = [
  { name: 'Michael R.', avatar: 'https://i.pravatar.cc/80?img=12', date: '2 days ago', text: 'Really helpful article — the point about verifying insurance saved me from a bad decision. Thank you!' },
  { name: 'Sarah L.',   avatar: 'https://i.pravatar.cc/80?img=5',  date: '5 days ago', text: 'Great read. I always forget to ask for references. Bookmarking this for next time.' },
];

/**
 * BlogCommentsDefault — comment section (heading + existing comments + a comment
 * form). Light section (tc.light). Heading/subtitle + the submit button are
 * editable ElementsSection elements; the comment input is a theme-styled control.
 */
export const BlogCommentsDefault: React.FC<Props> = ({
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
  const textColor  = fb.textColor  || lc.textColor  || '#4B5563';
  const cardBg     = fb.background || lc.cardBackgroundColor || '#FFFFFF';
  const cardBorder = fb.border     || lc.cardBorderColor     || 'rgba(0,0,0,0.08)';
  const btnBg      = (lc.buttonBackgroundColor as string) || tc?.buttonBackgroundColor || accent;
  const btnText    = (lc.buttonTextColor as string)       || tc?.buttonTextColor       || '#FFFFFF';
  const inputBg    = (lc as any).inputBg || '#F9FAFB';

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
  const padT = s.paddingTop    ?? 'pt-10 sm:pt-12 lg:pt-16';
  const padB = s.paddingBottom ?? 'pb-14 sm:pb-16 lg:pb-20';
  const padX = s.paddingX      ?? 'px-4 sm:px-6';
  const innerClass = `max-w-3xl mx-auto ${isCssValue(padX) ? '' : padX} ${isCssValue(padT) ? '' : padT} ${isCssValue(padB) ? '' : padB}`.trim();
  const innerStyle: React.CSSProperties = {
    ...(isCssValue(padX) ? { paddingLeft: padX, paddingRight: padX } : {}),
    ...(isCssValue(padT) ? { paddingTop: padT } : {}),
    ...(isCssValue(padB) ? { paddingBottom: padB } : {}),
  };

  const comments = Array.isArray(c.comments) && c.comments.length ? c.comments : DEFAULT_COMMENTS;

  const themeColors = { ...tc, titleColor, textColor, accentColor: accent, secondaryHeadingColor: accent, buttonBackgroundColor: btnBg, buttonTextColor: btnText };
  const passThrough = {
    onTextEdit, onElementUpdate: onElementUpdate || (() => {}), onElementSelect,
    selectedElementId, readOnly, isWrapped: false, buttonClass, themeColors,
  } as const;

  const titleEl: WebsiteElement = (() => {
    const id = `${section.id}-cm-title`;
    const existing = section.elements?.find(e => e.id === id);
    const sourceText = String(c.commentSectionTitle || content.title || 'Join the Conversation').replace(/<[^>]+>/g, '').trim();
    const words = sourceText.split(/\s+/).filter(Boolean);
    let textBefore = '';
    let highlightedText = sourceText;
    if (words.length > 1) { highlightedText = words[words.length - 1]; textBefore = words.slice(0, -1).join(' '); }
    const base: WebsiteElement = existing || {
      id, type: 'heading',
      content: { text: sourceText, textBefore, highlightedText, textAfter: '', htmlTag: 'h2' },
      style: { fontWeight: '800', fontSize: 'clamp(1.5rem, 3vw, 2.25rem)', lineHeight: '1.15', textAlign: 'left' as any },
    };
    return { ...base, content: { ...(base.content || {}), text: sourceText, textBefore, highlightedText, textAfter: '', htmlTag: base.content?.htmlTag || 'h2' } };
  })();

  const subEl: WebsiteElement = section.elements?.find(e => e.id === `${section.id}-cm-sub`) || {
    id: `${section.id}-cm-sub`, type: 'text',
    content: { text: String(c.commentSectionSubtitle || 'Share your thoughts — we\'d love to hear from you.'), textSize: 'base' },
    style: { lineHeight: '1.6', textAlign: 'left' as any },
  };

  const btnEl: WebsiteElement = section.elements?.find(e => e.id === `${section.id}-cm-btn`) || {
    id: `${section.id}-cm-btn`, type: 'button',
    content: { text: content.ctaText || 'Post Comment', link: '#' },
    style: { backgroundColor: btnBg, color: btnText, padding: '0.75rem 1.75rem', borderRadius: '0.5rem', fontWeight: '700', fontSize: '0.9rem' } as any,
  };

  return (
    <div className="w-full" style={{ backgroundColor: bg }}>
      <div className={innerClass} style={innerStyle}>
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          transition={{ duration: 0.5 }} className="space-y-6">

          <div className="space-y-1">
            <ElementsSection section={{ ...section, elements: [titleEl] }} {...passThrough} />
            <ElementsSection section={{ ...section, elements: [subEl] }} {...passThrough} />
          </div>

          {/* Existing comments */}
          <div className="space-y-4">
            {comments.map((cm: any, i: number) => (
              <div key={i} className="flex gap-4 p-4 rounded-xl" style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}>
                <img src={cm.avatar} alt="" className="w-11 h-11 rounded-full object-cover flex-shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold" style={{ color: titleColor }}>{cm.name}</span>
                    <span className="text-xs" style={{ color: textColor }}>· {cm.date}</span>
                  </div>
                  <p className="text-sm" style={{ color: textColor, lineHeight: 1.6 }}>{cm.text}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Comment form */}
          <div className="rounded-xl p-5 space-y-3" style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}>
            <textarea rows={3} placeholder="Write a comment…" disabled={readOnly}
              style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '0.625rem', backgroundColor: inputBg, border: `1px solid ${cardBorder}`, color: titleColor, fontSize: '0.95rem', outline: 'none' }} />
            <div className="flex justify-end">
              <div style={{ width: 'max-content' }}>
                <ElementsSection section={{ ...section, elements: [btnEl] }} {...passThrough} />
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default BlogCommentsDefault;
