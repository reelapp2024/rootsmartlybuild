import React from 'react';
import { Section, WebsiteElement } from '../../../../types';
import { ElementsSection } from '../ElementsSection';
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
  isSelected?: boolean;
  onSectionUpdate?: (sectionId: string, updates: any) => void;
}

/**
 * WhyChooseEditorial — part of the "Editorial" complete-homepage variant set.
 *
 * A two-column layout: a sticky left header (badge + accent heading + intro)
 * and, on the right, a clean stacked list of reason cards. Each reason is a
 * feature-box (icon-left, title, description) with an accent hairline.
 * Industry-neutral, light section.
 *
 * Fully dynamic keys: badgeText, title, subtitle, items[]{id,icon,title,
 * description}. No images. Element ids reuse the `wc-` prefix (`wc-card<i>`,
 * `wc-badge/title/desc`) so content carries over on variant switch. Add/remove
 * wired (the Plumbing variant lacks it — this one adds it).
 */
const REASONS = [
  { icon: 'fa-medal',               title: 'Years of experience',     description: 'A long track record of solving problems properly, for homes and businesses alike.' },
  { icon: 'fa-id-badge',            title: 'Licensed & certified',    description: 'Every member of the team is fully qualified, background-checked and insured.' },
  { icon: 'fa-bolt',                title: 'Fast response',           description: 'We move quickly when it matters and keep you updated from first call to finish.' },
  { icon: 'fa-hand-holding-dollar', title: 'Honest pricing',          description: "You'll always know the price before we start. No surprises, no hidden charges." },
  { icon: 'fa-broom',               title: 'Clean, respectful work',  description: 'We treat your space like our own and leave every work area spotless.' },
  { icon: 'fa-shield-halved',       title: 'Guaranteed workmanship',  description: 'Every job is backed in writing. If it is not right, we put it right.' },
];

export const WhyChooseEditorial: React.FC<Props> = ({
  section, onTextEdit, buttonClass, onElementSelect, onElementUpdate,
  selectedElementId, readOnly = false, themeColors: tc,
  isSelected = false, onSectionUpdate,
}) => {
  const { content, styles } = section;
  const s = styles as any;

  const lc = tc?.light || {};
  const fb = lc.featureBox || {};
  const accent     = lc.accentColor || tc?.accentColor || '#E11D48';
  const titleColor = fb.titleColor || lc.titleColor || '#111827';
  const textColor  = fb.textColor  || lc.textColor  || '#4B5563';
  const iconColor  = fb.iconColor  || lc.iconColor  || accent;
  const iconBg     = fb.iconBg     || lc.iconBgColor || `${accent}15`;
  const cardBg     = fb.background  || lc.cardBackgroundColor || '#FFFFFF';
  const cardBorder = fb.border      || lc.cardBorderColor     || 'rgba(0,0,0,0.08)';
  const mutedColor = lc.textColorMuted || (lc as any).muted || '#6B7280';

  const defaultSurface = lc.surface || (lc as any).cardBackgroundColor || '#FFFFFF';
  const sectionBg = resolveSectionBackground(s, { defaultSurface });
  const bgOverlay = resolveSectionOverlay(s);
  const hasBgImage = sectionBgHasImage(s);

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
  const hideAllIcons = !!(content as any).hideIcons;

  const itemsAreMaterialized = Array.isArray(content.items) && content.items.length > 0;
  const rawReasons = itemsAreMaterialized
    ? (content.items as any[]).map((item: any, i: number) => ({
        id:          item.id || `wc-reason-${i}`,
        icon:        item.icon        || REASONS[i % REASONS.length].icon,
        title:       item.title       || REASONS[i % REASONS.length].title,
        description: item.description || REASONS[i % REASONS.length].description,
      }))
    : REASONS.map((r, i) => ({ id: `wc-reason-${i}`, ...r }));

  const materializeIfNeeded = (): any[] => {
    if (itemsAreMaterialized) return rawReasons;
    if (!onSectionUpdate) return rawReasons;
    const seeded = REASONS.map((r, i) => ({ id: `wc-reason-${i}`, icon: r.icon, title: r.title, description: r.description }));
    onSectionUpdate(section.id, { content: { ...content, items: seeded } });
    return seeded;
  };
  const handleAdd = () => {
    if (readOnly || !onSectionUpdate) return;
    const current = materializeIfNeeded();
    const fallback = REASONS[current.length % REASONS.length];
    const newItem = { id: `wc-reason-x${current.length}`, icon: fallback.icon, title: 'New reason', description: 'Describe this reason.' };
    onSectionUpdate(section.id, { content: { ...content, items: [...current, newItem] } });
  };
  const handleRemove = (rid: string, idx: number) => {
    if (readOnly || !onSectionUpdate) return;
    const current = materializeIfNeeded();
    const next = current.filter((it: any, i: number) => (it.id ? it.id !== rid : i !== idx));
    const nextElements = (section.elements || []).filter((e) => e.id !== `${section.id}-wc-card${idx}`);
    onSectionUpdate(section.id, { content: { ...content, items: next }, elements: nextElements });
  };

  const themeColors = {
    ...tc, titleColor, textColor, accentColor: accent, iconColor, iconBgColor: iconBg,
    featureBoxBackground: 'transparent', featureBoxBorder: 'transparent',
    featureBoxIconColor: iconColor, featureBoxIconBg: iconBg,
    featureBoxTitleColor: titleColor, featureBoxTextColor: textColor,
  };

  const badgeEl: WebsiteElement = section.elements?.find(e => e.id === `${section.id}-wc-badge`) || {
    id: `${section.id}-wc-badge`, type: 'badge',
    content: { text: content.badgeText || 'Why us', iconPosition: 'left' },
    style: { fontSize: '0.7rem', fontWeight: '700', letterSpacing: '0.24em', textTransform: 'uppercase' as any, padding: '0', borderRadius: '0', textAlign: 'left' as any, backgroundColor: 'transparent', color: mutedColor },
  };

  const titleEl: WebsiteElement = (() => {
    const id = `${section.id}-wc-title`;
    const existing = section.elements?.find(e => e.id === id);
    const c = (existing?.content || {}) as any;
    const src = (c.text || content.title || 'Why people choose us').toString().replace(/<[^>]+>/g, '').trim();
    const base: WebsiteElement = existing || {
      id, type: 'heading',
      content: { text: src, htmlTag: 'h2' },
      style: { color: titleColor, fontWeight: '800', fontSize: 'clamp(2rem, 4vw, 3rem)', lineHeight: '1.1', letterSpacing: '-0.03em', textAlign: 'left' as any },
    };
    if (existing) {
      return { ...existing, type: 'heading', content: { ...(existing.content || {}), htmlTag: (existing.content as any)?.htmlTag || 'h2' }, style: { ...(base.style as any), ...(existing.style as any) } } as WebsiteElement;
    }
    return { ...base, content: { ...(base.content || {}), text: src, htmlTag: 'h2' } };
  })();

  const descEl: WebsiteElement = section.elements?.find(e => e.id === `${section.id}-wc-desc`) || {
    id: `${section.id}-wc-desc`, type: 'text',
    content: { text: content.subtitle || "The little things that add up to a job done properly, and a business you'll want to call again.", textSize: 'large' },
    style: { color: textColor, textAlign: 'left' as any, maxWidth: '420px', lineHeight: '1.7' },
  };

  const getReasonEl = (feat: any, i: number): WebsiteElement => {
    const id = `${section.id}-wc-card${i}`;
    const existing = section.elements?.find(e => e.id === id);
    if (existing) {
      return hideAllIcons ? { ...existing, content: { ...(existing.content || {}), icon: 'none' } } : existing;
    }
    return {
      id, type: 'feature-box',
      content: { icon: hideAllIcons ? 'none' : feat.icon, text: feat.title, subText: feat.description, iconPosition: 'left' },
      style: {
        iconContainerSize: '2.75rem', iconBorderRadius: '0.625rem',
        titleFontSize: '1.05rem', titleFontWeight: '700', descriptionFontSize: '0.875rem',
        borderWidth: '0', padding: '0', backgroundColor: 'transparent',
        textAlign: 'left' as any, titleAlign: 'left' as any, descriptionAlign: 'left' as any, gap: '1rem',
      } as any,
    };
  };

  const pass = {
    onTextEdit, onElementUpdate: onElementUpdate || (() => {}), onElementSelect,
    selectedElementId, readOnly, isWrapped: false, buttonClass, themeColors,
  } as const;

  const uid = `wce-${String(section.id).replace(/[^a-zA-Z0-9_-]/g, '')}`;

  return (
    <div className={`w-full relative ${uid}`} style={{ ...sectionBg }}>
      <style>{`
        .${uid} .wce-row { transition:border-color .3s, background-color .3s; }
        .${uid} .wce-row:hover { border-color:rgba(0,0,0,0.18) !important; background-color:${cardBg} !important; }
      `}</style>
      {hasBgImage && bgOverlay && <div aria-hidden className="absolute inset-0 pointer-events-none" style={bgOverlay} />}
      <div className={`relative z-10 ${innerClass}`} style={innerStyle}>
        <div className="grid grid-cols-1 lg:grid-cols-[0.85fr_1.15fr] gap-12 lg:gap-16">

          {/* Left header (sticky on desktop) */}
          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="lg:sticky lg:top-24 self-start">
            <div className="inline-flex items-center gap-2.5">
              <span aria-hidden className="h-px w-8" style={{ backgroundColor: cardBorder }} />
              <ElementsSection section={{ ...section, elements: [badgeEl] }} {...pass} />
            </div>
            <div className="mt-5"><ElementsSection section={{ ...section, elements: [titleEl] }} {...pass} /></div>
            <div className="mt-5"><ElementsSection section={{ ...section, elements: [descEl] }} {...pass} /></div>
          </motion.div>

          {/* Right: reason list */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {rawReasons.map((feat: any, i: number) => (
              <motion.div key={feat.id}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45, delay: (i % 2) * 0.06 }}
                className="wce-row group relative rounded-2xl p-5" style={{ border: `1px solid ${cardBorder}`, backgroundColor: cardBg }}>
                <ElementsSection section={{ ...section, elements: [getReasonEl(feat, i)] }} {...pass} />
                {isSelected && !readOnly && onSectionUpdate && rawReasons.length > 1 && (
                  <button onClick={(e) => { e.stopPropagation(); handleRemove(feat.id, i); }}
                    className="absolute -top-2.5 -right-2.5 bg-red-500 hover:bg-red-600 text-white w-7 h-7 rounded-full opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center text-xs z-20 shadow-lg hover:scale-110"
                    title="Remove reason" aria-label="Remove reason"><i className="fa-solid fa-xmark" /></button>
                )}
              </motion.div>
            ))}
            {isSelected && !readOnly && onSectionUpdate && (
              <button type="button" onClick={(e) => { e.stopPropagation(); handleAdd(); }}
                className="min-h-[110px] rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center gap-2"
                style={{ borderColor: `${accent}55`, backgroundColor: `${accent}05`, color: accent }} title="Add a reason">
                <i className="fa-solid fa-plus text-lg" />
                <span className="text-[11px] font-bold uppercase tracking-widest">Add Reason</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhyChooseEditorial;
