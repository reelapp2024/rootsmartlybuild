import React from 'react';
import { Section, WebsiteElement } from '../../../../types';
import { ElementsSection } from '../ElementsSection';
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
  isSelected?: boolean;
  onSectionUpdate?: (sectionId: string, updates: any) => void;
}

/**
 * ProcessEditorial — part of the "Editorial" complete-homepage variant set.
 *
 * A vertical timeline: a centered accent rail with numbered nodes and step
 * cards alternating left/right (single column on mobile). Each step card is a
 * feature-box (icon + title + desc); the node numeral is an editable text.
 * Industry-neutral, light section.
 *
 * Fully dynamic keys: badgeText, title, subtitle, items[]{id,icon,title,
 * description}. No images. Element ids reuse the `pp-` prefix (`pp-step<i>`,
 * `pp-step-num<i>`, `pp-badge/title/desc`) so content carries over on variant
 * switch. Add/remove wired.
 */
const STEPS = [
  { icon: 'fa-phone',            title: 'Call or book online', description: 'Reach us by phone or use our online booking. We confirm your appointment and agree a time that suits you.' },
  { icon: 'fa-magnifying-glass', title: 'On-site assessment',  description: 'We arrive on time, look at the job properly, and give you a clear, fixed quote before any work starts.' },
  { icon: 'fa-wrench',           title: 'The work gets done',  description: 'We do the job with quality materials and proven methods, keeping your space clean throughout.' },
  { icon: 'fa-circle-check',     title: 'Sign-off & guarantee', description: 'We walk you through the finished work. You are only happy when it is right, and it is backed in writing.' },
];

export const ProcessEditorial: React.FC<Props> = ({
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
  const btnText    = lc.buttonTextColor || tc?.buttonTextColor || '#FFFFFF';
  const mutedColor = lc.textColorMuted || (lc as any).muted || '#6B7280';

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
  const padT = s.paddingTop    ?? 'pt-16 lg:pt-24';
  const padB = s.paddingBottom ?? 'pb-16 lg:pb-24';
  const padX = s.paddingX      ?? 'px-6';
  const innerClass = `max-w-[1080px] mx-auto ${isCssValue(padX) ? '' : padX} ${isCssValue(padT) ? '' : padT} ${isCssValue(padB) ? '' : padB}`.trim();
  const innerStyle: React.CSSProperties = {
    ...(isCssValue(padX) ? { paddingLeft: padX, paddingRight: padX } : {}),
    ...(isCssValue(padT) ? { paddingTop: padT } : {}),
    ...(isCssValue(padB) ? { paddingBottom: padB } : {}),
  };
  const hideAllIcons = !!(content as any).hideIcons;

  const itemsAreMaterialized = Array.isArray(content.items) && content.items.length > 0;
  const rawSteps = itemsAreMaterialized
    ? (content.items as any[]).map((item: any, i: number) => ({
        id:          item.id || `pp-step-${i}`,
        icon:        item.icon        || STEPS[i % STEPS.length].icon,
        title:       item.title       || STEPS[i % STEPS.length].title,
        description: item.description || STEPS[i % STEPS.length].description,
      }))
    : STEPS.map((st, i) => ({ id: `pp-step-${i}`, ...st }));

  const materializeIfNeeded = (): any[] => {
    if (itemsAreMaterialized) return rawSteps;
    if (!onSectionUpdate) return rawSteps;
    const seeded = STEPS.map((st, i) => ({ id: `pp-step-${i}`, icon: st.icon, title: st.title, description: st.description }));
    onSectionUpdate(section.id, { content: { ...content, items: seeded } });
    return seeded;
  };
  const handleAddStep = () => {
    if (readOnly || !onSectionUpdate) return;
    const current = materializeIfNeeded();
    const fallback = STEPS[current.length % STEPS.length];
    const newItem = { id: `pp-step-x${current.length}`, icon: fallback.icon, title: 'New Step', description: 'Describe this step.' };
    onSectionUpdate(section.id, { content: { ...content, items: [...current, newItem] } });
  };
  const handleRemoveStep = (stepId: string, idx: number) => {
    if (readOnly || !onSectionUpdate) return;
    const current = materializeIfNeeded();
    const next = current.filter((it: any, i: number) => (it.id ? it.id !== stepId : i !== idx));
    const ids = new Set([`${section.id}-pp-step${idx}`, `${section.id}-pp-step-num${idx}`]);
    const nextElements = (section.elements || []).filter((e) => !ids.has(e.id));
    onSectionUpdate(section.id, { content: { ...content, items: next }, elements: nextElements });
  };

  const themeColors = {
    ...tc, titleColor, textColor, accentColor: accent, iconColor, iconBgColor: iconBg,
    featureBoxBackground: 'transparent', featureBoxBorder: 'transparent',
    featureBoxIconColor: iconColor, featureBoxIconBg: iconBg,
    featureBoxTitleColor: titleColor, featureBoxTextColor: textColor,
  };

  const badgeEl: WebsiteElement = section.elements?.find(e => e.id === `${section.id}-pp-badge`) || {
    id: `${section.id}-pp-badge`, type: 'badge',
    content: { text: content.badgeText || 'Our process', icon: 'fa-list-ol', iconPosition: 'left', iconSize: '0.65rem' },
    style: { fontSize: '0.72rem', fontWeight: '700', letterSpacing: '0.12em', textTransform: 'uppercase' as any, padding: '6px 14px', borderRadius: '9999px', textAlign: 'center' as any, backgroundColor: cardBorder, color: mutedColor },
  };

  // Professional/restrained: heading stays fully neutral (no accent-coloured
  // last word). Colour is reserved for buttons + the timeline rail/nodes only.
  const titleEl: WebsiteElement = (() => {
    const id = `${section.id}-pp-title`;
    const existing = section.elements?.find(e => e.id === id);
    const c = (existing?.content || {}) as any;
    const src = (c.text || content.title || 'How our service works').toString().replace(/<[^>]+>/g, '').trim();
    const base: WebsiteElement = existing || {
      id, type: 'heading',
      content: { text: src, htmlTag: 'h2' },
      style: { color: titleColor, fontWeight: '800', fontSize: 'clamp(2rem, 4vw, 3rem)', lineHeight: '1.1', letterSpacing: '-0.03em', textAlign: 'center' as any },
    };
    if (existing) {
      return { ...existing, type: 'heading', content: { ...(existing.content || {}), htmlTag: (existing.content as any)?.htmlTag || 'h2' }, style: { ...(base.style as any), ...(existing.style as any) } } as WebsiteElement;
    }
    return { ...base, content: { ...(base.content || {}), text: src, htmlTag: 'h2' } };
  })();

  const descEl: WebsiteElement = section.elements?.find(e => e.id === `${section.id}-pp-desc`) || {
    id: `${section.id}-pp-desc`, type: 'text',
    content: { text: content.subtitle || 'A simple, transparent path from your first call to a finished job you are happy with.', textSize: 'large' },
    style: { color: textColor, textAlign: 'center' as any, maxWidth: '600px', margin: '0 auto', lineHeight: '1.7' },
  };

  const getStepNumberEl = (i: number): WebsiteElement => {
    const id = `${section.id}-pp-step-num${i}`;
    const existing = section.elements?.find(e => e.id === id);
    if (existing) return existing;
    return {
      id, type: 'text',
      content: { text: String(i + 1), textSize: 'small' } as any,
      style: { fontSize: '0.9rem', fontWeight: '900', color: btnText, textAlign: 'center' as any, lineHeight: '1', margin: 0 } as any,
    };
  };

  const getStepEl = (i: number): WebsiteElement => {
    const id = `${section.id}-pp-step${i}`;
    const existing = section.elements?.find(e => e.id === id);
    if (existing) {
      return hideAllIcons ? { ...existing, content: { ...(existing.content || {}), icon: 'none' } } : existing;
    }
    return {
      id, type: 'feature-box',
      content: { icon: hideAllIcons ? 'none' : rawSteps[i].icon, text: rawSteps[i].title, subText: rawSteps[i].description, iconPosition: 'left' },
      style: {
        iconContainerSize: '2.75rem', iconBorderRadius: '0.75rem',
        titleFontSize: '1.15rem', titleFontWeight: '700', descriptionFontSize: '0.9rem',
        padding: '0', borderWidth: '0', backgroundColor: 'transparent',
        textAlign: 'left' as any, titleAlign: 'left' as any, descriptionAlign: 'left' as any,
      } as any,
    };
  };

  const pass = {
    onTextEdit, onElementUpdate: onElementUpdate || (() => {}), onElementSelect,
    selectedElementId, readOnly, isWrapped: false, buttonClass, themeColors,
  } as const;

  const uid = `pe-${String(section.id).replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const stepCount = rawSteps.length;

  return (
    <div className={`w-full ${uid}`} style={{ backgroundColor: bg }}>
      <div className={innerClass} style={innerStyle}>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="text-center">
          <div className="flex justify-center mb-5"><ElementsSection section={{ ...section, elements: [badgeEl] }} {...pass} /></div>
          <ElementsSection section={{ ...section, elements: [titleEl] }} {...pass} />
          <div className="mt-5"><ElementsSection section={{ ...section, elements: [descEl] }} {...pass} /></div>
        </motion.div>

        {/* Timeline */}
        <div className="relative mt-16">
          {/* center rail (desktop) / left rail (mobile) */}
          <div aria-hidden className="absolute top-0 bottom-0 w-px md:left-1/2 left-[19px] -translate-x-1/2" style={{ backgroundColor: `${accent}30` }} />

          <div className="space-y-10 md:space-y-14">
            {rawSteps.map((step: any, i: number) => {
              const stepId = step.id || `pp-step-${i}`;
              const rightSide = i % 2 === 1;
              return (
                <motion.div key={stepId}
                  initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.55, delay: 0.05 }}
                  className="relative group/step md:grid md:grid-cols-2 md:gap-12 items-center">

                  {/* node */}
                  <div className="absolute md:left-1/2 left-[19px] -translate-x-1/2 top-0 md:top-1/2 md:-translate-y-1/2 z-20">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full shadow-md ring-4" style={{ backgroundColor: accent, ...( { ['--tw-ring-color' as any]: bg } ) }}>
                      <ElementsSection section={{ ...section, elements: [getStepNumberEl(i)] }} {...pass} />
                    </span>
                  </div>

                  {/* card — alternating column on desktop; always right of rail on mobile */}
                  <div className={`pl-14 md:pl-0 ${rightSide ? 'md:col-start-2' : 'md:col-start-1'}`}>
                    <div className={`rounded-2xl p-6 transition-[border-color,transform] duration-300 group-hover/step:-translate-y-1 ${rightSide ? '' : 'md:text-left'}`}
                      style={{ border: `1px solid ${cardBorder}`, backgroundColor: cardBg }}>
                      <ElementsSection section={{ ...section, elements: [getStepEl(i)] }} {...pass} />
                    </div>
                  </div>

                  {isSelected && !readOnly && onSectionUpdate && stepCount > 1 && (
                    <button onClick={(e) => { e.stopPropagation(); handleRemoveStep(stepId, i); }}
                      className="absolute -top-2.5 right-2 md:right-[calc(0%+8px)] bg-red-500 hover:bg-red-600 text-white w-7 h-7 rounded-full opacity-0 group-hover/step:opacity-100 transition-all flex items-center justify-center text-xs z-30 shadow-lg hover:scale-110"
                      title="Remove step" aria-label="Remove step"><i className="fa-solid fa-xmark" /></button>
                  )}
                </motion.div>
              );
            })}
          </div>

          {isSelected && !readOnly && onSectionUpdate && (
            <button type="button" onClick={(e) => { e.stopPropagation(); handleAddStep(); }}
              className="mt-10 ml-14 md:ml-0 md:mx-auto flex w-[calc(100%-3.5rem)] md:w-auto items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-4 transition-all"
              style={{ borderColor: `${accent}55`, backgroundColor: `${accent}05`, color: accent }} title="Add a step">
              <i className="fa-solid fa-plus text-xl" />
              <span className="text-xs font-bold uppercase tracking-widest">Add Step</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProcessEditorial;
