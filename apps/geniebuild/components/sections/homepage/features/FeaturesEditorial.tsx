import React from 'react';
import { Section, WebsiteElement } from '../../../../types';
import { ElementsSection } from '../ElementsSection';
import { resolveSectionBackground, resolveSectionOverlay, sectionBgHasImage } from '../utils/sectionBackground';
import { motion } from 'motion/react';
import { resolveSectionElement, elementFromExistingOrDna } from '../../../../elements';

interface Props {
  section: Section;
  onTextEdit: (key: any, value: string) => void;
  buttonClass: string;
  onElementSelect?: (elementId: string, element?: WebsiteElement) => void;
  onElementUpdate?: (elementId: string, updates: any) => void;
  selectedElementId?: string | null;
  readOnly?: boolean;
  themeColors?: any;
  onAddItem?: () => void;
  onRemoveItem?: (id: string) => void;
  onSectionUpdate?: (sectionId: string, updates: any) => void;
  isSelected?: boolean;
}

/**
 * FeaturesEditorial — part of the "Editorial" complete-homepage variant set.
 *
 * A centered eyebrow + accent heading + intro, then a clean numbered grid of
 * feature cards: each card is a big index numeral, an icon tile and a
 * feature-box (title + description). Industry-neutral, light section.
 *
 * Fully dynamic keys: title, subtitle, badgeText, items[]{id,icon,title,
 * description}. No images. Each feature renders through a real `feature-box`
 * element on the shared `fp-<id>` id scheme (content carries over from other
 * feature variants); header via badge/heading/text elements. Add/remove wired.
 */
const DEFAULT_FEATURES = [
  { icon: 'fa-phone',         title: 'Fast, honest callbacks', desc: 'Ring us and you speak to a real person, not a queue. If we cannot answer straight away we call you back the same working day.' },
  { icon: 'fa-receipt',       title: 'Fixed price, up front',  desc: 'You get a written quote before any work starts. The price we agree is the price you pay, no surprises on the invoice.' },
  { icon: 'fa-shield-halved', title: 'Vetted, local, insured', desc: 'Every member of our team is background checked, fully qualified and covered by our insurance.' },
  { icon: 'fa-clock',         title: 'We turn up on time',     desc: 'You get a two-hour arrival window and a text when we set off, so you are not writing off a whole day.' },
  { icon: 'fa-circle-check',  title: 'Guaranteed work',        desc: 'We tidy up before we leave and stand behind every job in writing. If something is not right, we come back.' },
  { icon: 'fa-thumbs-up',     title: 'Loved by locals',        desc: 'Most of our work comes from repeat customers and referrals from people who trusted us the first time.' },
];

export const FeaturesEditorial: React.FC<Props> = ({
  section, onTextEdit, buttonClass, onElementSelect, onElementUpdate,
  selectedElementId, readOnly = false, themeColors: tc,
  onSectionUpdate, isSelected = false,
}) => {
  const { content, styles } = section;
  const s = styles as any;

  const lc = tc?.light || {};
  const fb = lc.featureBox || {};
  const accent     = lc.accentColor || tc?.accentColor || '#E11D48';
  const titleColor = fb.titleColor || lc.titleColor || '#111827';
  const textColor  = fb.textColor  || lc.textColor  || '#4B5563';
  const cardBg     = fb.background  || lc.cardBackgroundColor || '#FFFFFF';
  const cardBorder = fb.border      || lc.cardBorderColor     || 'rgba(0,0,0,0.08)';
  const mutedColor = lc.textColorMuted || (lc as any).muted || '#6B7280';

  const defaultSurface = lc.surface || (lc as any).cardBackgroundColor || '#FFFFFF';
  const sectionBg = resolveSectionBackground(s, { defaultSurface });
  const bgOverlay = resolveSectionOverlay(s);
  const hasBgImage = sectionBgHasImage(s);

  const isCssValue = (v: any) => typeof v === 'string' && /(px|rem|em|%|vh|vw)$/.test(v.trim());
  const padT = s.paddingTop  ?? 'pt-16 lg:pt-24';
  const padB = s.paddingBottom ?? 'pb-16 lg:pb-24';
  const padX = s.paddingX      ?? 'px-6';
  const innerClass = `max-w-[1240px] mx-auto ${isCssValue(padX) ? '' : padX} ${isCssValue(padT) ? '' : padT} ${isCssValue(padB) ? '' : padB}`.trim();
  const innerStyle: React.CSSProperties = {
    ...(isCssValue(padX) ? { paddingLeft: padX, paddingRight: padX } : {}),
    ...(isCssValue(padT) ? { paddingTop: padT } : {}),
    ...(isCssValue(padB) ? { paddingBottom: padB } : {}),
  };
  const sectionOuterStyle: React.CSSProperties = {
    ...sectionBg, position: 'relative',
    ...(s.marginTop ? { marginTop: s.marginTop } : {}),
    ...(s.marginBottom ? { marginBottom: s.marginBottom } : {}),
  };

  const sourceItems: any[] = (content.items && content.items.length > 0) ? content.items : [];
  const itemsAreMaterialized = sourceItems.length > 0;
  const hideAllIcons = !!(content as any).hideIcons;
  const rawFeatures = (sourceItems.length > 0 ? sourceItems : DEFAULT_FEATURES).map((item: any, i: number) => {
    const d = DEFAULT_FEATURES[i % DEFAULT_FEATURES.length];
    const fid = item?.id || `fp-feat-${i}`;
    const fbEl = section.elements?.find(e => e.id === `${section.id}-fp-${fid}`);
    const fbc = (fbEl?.content || {}) as any;
    return {
      id:    fid,
      icon:  item?.icon  || fbc.icon || d.icon,
      title: item?.title || fbc.text || fbc.title || d.title,
      desc:  item?.description || fbc.subText || fbc.description || d.desc,
    };
  });

  // Professional/restrained: badge is neutral muted grey (not accent), so the
  // eyebrow reads as a quiet label rather than another spot of colour.
  const badgeEl: WebsiteElement = resolveSectionElement(section, {
    id: `${section.id}-fp-badge`, type: 'badge',
    content: { text: content.badgeText || 'Why choose us', iconPosition: 'left' },
    style: { fontSize: '0.7rem', fontWeight: '700', letterSpacing: '0.24em', textTransform: 'uppercase' as any, padding: '0', borderRadius: '0', textAlign: 'center' as any},
  });

  // Professional/restrained: heading stays fully neutral (no accent-coloured
  // last word). Colour is reserved for buttons + a couple of key spots only.
  const titleEl: WebsiteElement = (() => {
    const id = `${section.id}-fp-title`;
    const existing = section.elements?.find(e => e.id === id);
    const src = (existing?.content as any)?.text || content.title || "Everything you'd want from a local team.";
    const base: WebsiteElement = elementFromExistingOrDna(existing, {
      id, type: 'heading',
      content: { text: src, htmlTag: 'h2' },
      style: { fontWeight: '800', fontSize: 'clamp(2rem, 4vw, 3rem)', lineHeight: '1.08', letterSpacing: '-0.035em', textAlign: 'center' as any },
    });
    if (existing) {
      return { ...existing, type: 'heading', content: { ...(existing.content || {}), htmlTag: (existing.content as any)?.htmlTag || 'h2' }, style: { ...(base.style as any), ...(existing.style as any) } } as WebsiteElement;
    }
    return { ...base, content: { ...(base.content || {}), text: src, htmlTag: 'h2' } };
  })();

  const descEl: WebsiteElement = resolveSectionElement(section, {
    id: `${section.id}-fp-desc`, type: 'text',
    content: { text: content.subtitle || 'No call centres, no surprise invoices and no waiting around all day. Here is exactly what you get when you book with us.', textSize: 'large' },
    style: { textAlign: 'center' as any, maxWidth: '640px', lineHeight: '1.75', margin: '0 auto' },
  });

  const themeColors = {
    ...tc, titleColor, textColor, accentColor: accent, iconColor: accent,
    featureBoxBackground: 'transparent', featureBoxBorder: 'transparent',
    featureBoxTitleColor: titleColor, featureBoxTextColor: textColor,
    featureBoxIconColor: accent, featureBoxIconBg: `${accent}15`,
  };

  const materializeIfNeeded = (): any[] => {
    if (itemsAreMaterialized) return sourceItems;
    if (!onSectionUpdate) return rawFeatures;
    const seeded = rawFeatures.map((f) => ({ id: f.id, icon: f.icon, title: f.title, description: f.desc }));
    onSectionUpdate(section.id, { content: { ...content, items: seeded } });
    return seeded;
  };
  const handleAddFeature = () => {
    if (readOnly || !onSectionUpdate) return;
    const current = materializeIfNeeded();
    const fallback = DEFAULT_FEATURES[current.length % DEFAULT_FEATURES.length];
    const newItem = { id: `fp-feat-x${current.length}`, icon: fallback.icon, title: 'New Feature', description: 'Add a description here.' };
    onSectionUpdate(section.id, { content: { ...content, items: [...current, newItem] } });
  };
  const handleRemoveFeature = (featId: string) => {
    if (readOnly || !onSectionUpdate) return;
    const current = materializeIfNeeded();
    onSectionUpdate(section.id, { content: { ...content, items: current.filter((it: any) => it.id !== featId) } });
  };

  const getFeatureBoxEl = (feat: any): WebsiteElement => {
    const id = `${section.id}-fp-${feat.id}`;
    const existing = section.elements?.find(e => e.id === id);
    const defaultContent: any = { icon: hideAllIcons ? 'none' : feat.icon, text: feat.title, subText: feat.desc, iconPosition: 'top' };
    const defaultStyle: any = {
      iconContainerSize: '2.75rem', iconBorderRadius: '0.75rem',
      titleFontSize: '1.2rem', titleFontWeight: '700', descriptionFontSize: '0.9rem',
      borderWidth: '0',  padding: '0',
      textAlign: 'left' as any, titleAlign: 'left' as any, descriptionAlign: 'left' as any};
    if (existing) {
      return { ...existing, content: { ...defaultContent, ...(existing.content || {}), ...(hideAllIcons ? { icon: 'none' } : {}) }, style: { ...defaultStyle, ...(existing.style as any) } };
    }
    return { id, type: 'feature-box', content: defaultContent, style: defaultStyle };
  };

  const pass = {
    onTextEdit, onElementUpdate: onElementUpdate || (() => {}), onElementSelect,
    selectedElementId, readOnly, isWrapped: false, buttonClass, themeColors,
  } as const;

  const uid = `fe-${String(section.id).replace(/[^a-zA-Z0-9_-]/g, '')}`;

  return (
    <div className={`w-full ${uid}`} style={sectionOuterStyle}>
      {hasBgImage && bgOverlay && <div aria-hidden className="absolute inset-0 pointer-events-none" style={bgOverlay} />}
      {/* Restrained palette: neutral card hover + neutral outline numeral. The
          only accent left in this section is the feature icons (and buttons). */}
      <style>{`
        .${uid} .fe-card { position:relative; transition:border-color .3s, transform .3s; }
        .${uid} .fe-card:hover { border-color:rgba(0,0,0,0.18) !important; transform:translateY(-4px); }
        .${uid} .fe-num { -webkit-text-stroke:1.5px rgba(0,0,0,0.12); color:transparent; }
      `}</style>
      <div className={`relative z-10 ${innerClass}`} style={innerStyle}>

        {/* Header — centered */}
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="text-center">
          <div className="inline-flex items-center gap-2.5 justify-center">
            <span aria-hidden className="h-px w-8" style={{ backgroundColor: cardBorder }} />
            <ElementsSection section={{ ...section, elements: [badgeEl] }} {...pass} />
            <span aria-hidden className="h-px w-8" style={{ backgroundColor: cardBorder }} />
          </div>
          <div className="mt-5"><ElementsSection section={{ ...section, elements: [titleEl] }} {...pass} /></div>
          <div className="mt-5"><ElementsSection section={{ ...section, elements: [descEl] }} {...pass} /></div>
        </motion.div>

        {/* Numbered grid */}
        <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {rawFeatures.map((feat, i) => (
            <motion.div key={feat.id}
              initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: (i % 3) * 0.09 }}
              className="fe-card group relative flex flex-col rounded-2xl p-6"
              style={{ border: `1px solid ${cardBorder}`, backgroundColor: cardBg }}>
              <div className="flex items-start justify-between">
                <div className="relative z-10 flex-1"><ElementsSection section={{ ...section, elements: [getFeatureBoxEl(feat)] }} {...pass} /></div>
                <span aria-hidden className="fe-num text-4xl font-extrabold leading-none select-none ml-3">{String(i + 1).padStart(2, '0')}</span>
              </div>
              {isSelected && !readOnly && onSectionUpdate && rawFeatures.length > 1 && (
                <button onClick={(e) => { e.stopPropagation(); handleRemoveFeature(feat.id); }}
                  className="absolute -top-2.5 -right-2.5 bg-red-500 hover:bg-red-600 text-white w-7 h-7 rounded-full opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center text-xs z-20 shadow-lg hover:scale-110"
                  title="Remove feature" aria-label="Remove feature"><i className="fa-solid fa-xmark" /></button>
              )}
            </motion.div>
          ))}
          {isSelected && !readOnly && onSectionUpdate && (
            <button type="button" onClick={(e) => { e.stopPropagation(); handleAddFeature(); }}
              className="min-h-[140px] rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center gap-3"
              style={{ borderColor: `${accent}55`, backgroundColor: `${accent}05`, color: accent }} title="Add a feature">
              <i className="fa-solid fa-plus text-xl" />
              <span className="text-xs font-bold uppercase tracking-widest">Add Feature</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default FeaturesEditorial;
