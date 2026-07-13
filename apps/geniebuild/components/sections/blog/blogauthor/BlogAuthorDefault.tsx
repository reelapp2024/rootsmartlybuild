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

const DEFAULT_LINKS = [
  { label: 'Twitter', icon: 'fa-x-twitter', url: '#' },
  { label: 'LinkedIn', icon: 'fa-linkedin-in', url: '#' },
];

/**
 * BlogAuthorDefault — author bio card (avatar + name + role + bio + socials).
 * Light section (tc.light). Name, role and bio are editable ElementsSection
 * elements; avatar + social icons are theme-styled.
 */
export const BlogAuthorDefault: React.FC<Props> = ({
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
  const bg = isThemeSurface ? '#F8FAFC' : savedBg;

  const isCssValue = (v: any) => typeof v === 'string' && /(px|rem|em|%|vh|vw)$/.test(v.trim());
  const padT = s.paddingTop    ?? 'pt-8 sm:pt-10';
  const padB = s.paddingBottom ?? 'pb-8 sm:pb-10';
  const padX = s.paddingX      ?? 'px-4 sm:px-6';
  const innerClass = `max-w-3xl mx-auto ${isCssValue(padX) ? '' : padX} ${isCssValue(padT) ? '' : padT} ${isCssValue(padB) ? '' : padB}`.trim();
  const innerStyle: React.CSSProperties = {
    ...(isCssValue(padX) ? { paddingLeft: padX, paddingRight: padX } : {}),
    ...(isCssValue(padT) ? { paddingTop: padT } : {}),
    ...(isCssValue(padB) ? { paddingBottom: padB } : {}),
  };

  const name    = String(c.name || c.authorName || 'Jane Doe');
  const role    = String(c.jobTitle || c.role || 'Senior Content Writer');
  const bio     = String(c.bio || 'Jane has over 10 years of hands-on industry experience and loves sharing practical tips that help homeowners make confident decisions.');
  const avatar  = String(c.image || c.avatar || 'https://i.pravatar.cc/160?img=47');
  const links: Array<{ label: string; icon?: string; url: string }> = Array.isArray(c.links) && c.links.length
    ? c.links.map((l: any, i: number) => ({ label: String(l?.label || 'Link'), icon: l?.icon || DEFAULT_LINKS[i % 2].icon, url: String(l?.url || '#') }))
    : DEFAULT_LINKS;

  const themeColors = { ...tc, titleColor, textColor, accentColor: accent, secondaryHeadingColor: accent };
  const passThrough = {
    onTextEdit, onElementUpdate: onElementUpdate || (() => {}), onElementSelect,
    selectedElementId, readOnly, isWrapped: false, buttonClass, themeColors,
  } as const;

  const nameEl: WebsiteElement = section.elements?.find(e => e.id === `${section.id}-au-name`) || {
    id: `${section.id}-au-name`, type: 'heading',
    content: { text: name, htmlTag: 'h3' },
    style: { fontWeight: '800', fontSize: '1.25rem', textAlign: 'left' as any },
  };
  const nameElResolved: WebsiteElement = { ...nameEl, content: { ...(nameEl.content || {}), text: (nameEl.content as any)?.text || name } };

  const roleEl: WebsiteElement = section.elements?.find(e => e.id === `${section.id}-au-role`) || {
    id: `${section.id}-au-role`, type: 'text',
    content: { text: role, textSize: 'base' },
    style: { color: accent, fontWeight: '600', fontSize: '0.85rem', textAlign: 'left' as any },
  };

  const bioEl: WebsiteElement = section.elements?.find(e => e.id === `${section.id}-au-bio`) || {
    id: `${section.id}-au-bio`, type: 'text',
    content: { text: bio, textSize: 'base' },
    style: { lineHeight: '1.6', textAlign: 'left' as any },
  };
  const bioElResolved: WebsiteElement = { ...bioEl, content: { ...(bioEl.content || {}), text: (bioEl.content as any)?.text || bio } };

  return (
    <div className="w-full" style={{ backgroundColor: bg }}>
      <div className={innerClass} style={innerStyle}>
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="rounded-2xl p-6 sm:p-7 flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left"
          style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}`, boxShadow: `0 10px 30px -20px ${accent}30` }}
        >
          <img src={avatar} alt="" className="w-20 h-20 rounded-full object-cover flex-shrink-0" style={{ border: `2px solid ${accent}33` }} />
          <div className="flex-1 space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: accent }}>Written by</span>
            <ElementsSection section={{ ...section, elements: [nameElResolved] }} {...passThrough} />
            <ElementsSection section={{ ...section, elements: [roleEl] }} {...passThrough} />
            <ElementsSection section={{ ...section, elements: [bioElResolved] }} {...passThrough} />
            <div className="flex items-center gap-2 justify-center sm:justify-start pt-1">
              {links.map((l, i) => (
                <span key={i}
                  className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-colors"
                  style={{ backgroundColor: `${accent}12`, color: accent }}
                  title={l.label}
                >
                  <i className={`fab ${l.icon}`} aria-hidden="true" />
                </span>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default BlogAuthorDefault;
