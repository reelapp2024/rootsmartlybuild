import React from 'react';
import { Section, WebsiteElement } from '../../../../types';
import { ElementsSection } from '../../homepage/ElementsSection';
import { PRESET_THEMES } from '../../../../constants';
import { motion } from 'motion/react';
import { resolveSectionBackground } from '../../../../utils/sectionBackground';
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
  /** Whether the section is selected — drives "Add step" / "Remove" tile visibility. */
  isSelected?: boolean;
  /** Section-level patch applied through the parent reducer; used to
   *  materialize defaults to `content.items` and to add/remove steps. */
  onSectionUpdate?: (sectionId: string, updates: any) => void;
}

const STEPS = [
  { icon: 'fa-phone',            title: 'Call or Book Online', description: 'Reach us 24/7 by phone or use our online booking. We confirm your appointment instantly.' },
  { icon: 'fa-magnifying-glass', title: 'Fast Diagnosis',      description: 'Our licensed plumber arrives on time, assesses the issue and provides a clear upfront quote.' },
  { icon: 'fa-wrench',           title: 'Expert Repair',       description: 'We fix the problem using premium materials and proven techniques, right the first time.' },
  { icon: 'fa-circle-check',     title: 'Satisfaction Check',  description: "We review the work with you before leaving — you're 100% satisfied or we come back free." },
];

export const ServiceDetailProcessDefault: React.FC<Props> = ({
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

  // Section bg stays white on theme switch
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
  const bgStyle = resolveSectionBackground(s, { defaultSurface: bg });

  // Padding
  const isCssValue = (v: any) => typeof v === 'string' && /(px|rem|em|%|vh|vw)$/.test(v.trim());
  const padT = s.paddingTop    ?? 'pt-10 sm:pt-12 lg:pt-16';
  const padB = s.paddingBottom ?? 'pb-10 sm:pb-12 lg:pb-16';
  const padX = s.paddingX      ?? 'px-4 sm:px-6';
  const innerClass = `max-w-7xl mx-auto ${isCssValue(padX) ? '' : padX} ${isCssValue(padT) ? '' : padT} ${isCssValue(padB) ? '' : padB}`.trim();
  const innerStyle: React.CSSProperties = {
    ...(isCssValue(padX) ? { paddingLeft: padX, paddingRight: padX } : {}),
    ...(isCssValue(padT) ? { paddingTop: padT } : {}),
    ...(isCssValue(padB) ? { paddingBottom: padB } : {}),
  };
  const textAlignClass = s.textAlign === 'left' ? 'text-left' : s.textAlign === 'right' ? 'text-right' : 'text-center';
  const hideAllIcons = !!(content as any).hideIcons;

  const btnText = lc.buttonTextColor || tc?.buttonTextColor || '#FFFFFF';

  // Steps list — read from content.items, fallback to defaults
  const itemsAreMaterialized = Array.isArray(content.items) && content.items.length > 0;
  const rawSteps = itemsAreMaterialized
    ? (content.items as any[]).map((item: any, i: number) => ({
        id:          item.id,
        icon:        item.icon        || STEPS[i % STEPS.length].icon,
        title:       item.title       || STEPS[i % STEPS.length].title,
        description: item.description || STEPS[i % STEPS.length].description,
      }))
    : STEPS.map((st, i) => ({ id: `sdp-step-${i}`, ...st }));

  // Materialize defaults to content.items on first edit so add/remove operate on real data.
  const materializeIfNeeded = (): any[] => {
    if (itemsAreMaterialized) return rawSteps;
    if (!onSectionUpdate) return rawSteps;
    const seeded = STEPS.map((st, i) => ({
      id: `sdp-step-${i}`,
      icon: st.icon,
      title: st.title,
      description: st.description,
    }));
    onSectionUpdate(section.id, { content: { ...content, items: seeded } });
    return seeded;
  };

  const handleAddStep = () => {
    if (readOnly || !onSectionUpdate) return;
    const current = materializeIfNeeded();
    const fallback = STEPS[current.length % STEPS.length];
    const newItem = {
      id: `sdp-step-${Date.now()}`,
      icon: fallback.icon,
      title: 'New Step',
      description: 'Describe this step.',
    };
    onSectionUpdate(section.id, { content: { ...content, items: [...current, newItem] } });
  };

  const handleRemoveStep = (stepId: string, idx: number) => {
    if (readOnly || !onSectionUpdate) return;
    const current = materializeIfNeeded();
    const next = current.filter((it: any, i: number) => (it.id ? it.id !== stepId : i !== idx));
    // Drop any per-step element overrides (feature-box card + step-number text) tied to this idx
    const ids = new Set([
      `${section.id}-sdp-step${idx}`,
      `${section.id}-sdp-step-num${idx}`,
    ]);
    const nextElements = (section.elements || []).filter((e) => !ids.has(e.id));
    onSectionUpdate(section.id, {
      content: { ...content, items: next },
      elements: nextElements,
    });
  };

  const themeColors = {
    ...tc,
    titleColor, textColor, accentColor: accent,
    iconColor, iconBgColor: iconBg,
    featureBoxBackground: fb.background || lc.cardBackgroundColor || '#FFFFFF',
    featureBoxBorder:     fb.border     || lc.cardBorderColor     || 'rgba(0,0,0,0.08)',
    featureBoxIconColor:  iconColor,
    featureBoxIconBg:     iconBg,
    featureBoxTitleColor: titleColor,
    featureBoxTextColor:  textColor,
  };

  // Badge — uses theme accent color so it picks up palette changes.
  const badgeEl: WebsiteElement = resolveSectionElement(section, {
    id: `${section.id}-sdp-badge`, type: 'badge',
    content: { text: content.badgeText || 'Our Process', icon: 'fa-list-ol', iconPosition: 'left', iconSize: '0.65rem' },
    style: { fontSize: '0.72rem', fontWeight: '700', letterSpacing: '0.12em',
      textTransform: 'uppercase' as any, padding: '6px 14px', borderRadius: '9999px',
      textAlign: 'center' as any},
  });

  // Highlighted heading — last word in accent
  const titleEl: WebsiteElement = (() => {
    const id = `${section.id}-sdp-title`;
    const existing = section.elements?.find(e => e.id === id);
    const c = (existing?.content || {}) as any;
    const sourceText: string = (c.text || content.title || 'How This Service Works').toString().replace(/<[^>]+>/g, '').trim();
    const words = sourceText.split(/\s+/).filter(Boolean);
    let textBefore = '';
    let highlightedText = sourceText;
    if (words.length > 1) {
      highlightedText = words[words.length - 1];
      textBefore = words.slice(0, -1).join(' ');
    }
    const base: WebsiteElement = elementFromExistingOrDna(existing, {
      id, type: 'heading',
      content: { text: sourceText, textBefore, highlightedText, textAfter: '', htmlTag: 'h2' },
      style: { fontWeight: '800', fontSize: 'clamp(1.75rem, 3.5vw, 2.75rem)', lineHeight: '1.15', letterSpacing: '-0.02em' },
    });
    if (existing) {
      return {
        ...existing,
        type: 'heading',
        content: {
          ...(existing.content || {}),
          htmlTag: (existing.content as any)?.htmlTag || 'h2',
        },
        style: { ...(base.style as any), ...(existing.style as any) },
      } as WebsiteElement;
    }
    return { ...base, content: { ...(base.content || {}), text: sourceText, textBefore, highlightedText, textAfter: '', htmlTag: base.content?.htmlTag || 'h2' } };
  })();

  const descEl: WebsiteElement = resolveSectionElement(section, {
    id: `${section.id}-sdp-desc`, type: 'text',
    content: { text: content.subtitle || 'Four simple steps from your call to a fully fixed plumbing system — fast, clean and professional.', textSize: 'large' },
    style: { textAlign: 'center' as any, maxWidth: '560px', margin: '0 auto', lineHeight: '1.65' },
  });

  // Step number — editable text element. The circular wrapper around it lives
  // in the JSX below (visual chrome); the text itself is sidebar-editable so
  // users can change "1" to "01", "Step 1", etc.
  const getStepNumberEl = (i: number): WebsiteElement => {
    const id = `${section.id}-sdp-step-num${i}`;
    const existing = section.elements?.find(e => e.id === id);
    if (existing) return existing;
    return {
      id, type: 'text',
      content: { text: String(i + 1), textSize: 'small' } as any,
      style: { fontSize: '0.75rem',
        fontWeight: '900',
        
        textAlign: 'center' as any,
        lineHeight: '1',
        margin: 0} as any,
    };
  };

  // Step card as single feature-box element (icon + title + desc)
  const getStepEl = (i: number): WebsiteElement => {
    const id = `${section.id}-sdp-step${i}`;
    const existing = section.elements?.find(e => e.id === id);
    if (existing) {
      return hideAllIcons
        ? { ...existing, content: { ...(existing.content || {}), icon: 'none' } }
        : existing;
    }
    return {
      id, type: 'feature-box',
      content: {
        icon: hideAllIcons ? 'none' : rawSteps[i].icon,
        text: rawSteps[i].title,
        subText: rawSteps[i].description,
        iconPosition: 'top',
      },
      style: { iconContainerSize: '4rem',
        iconBorderRadius:  '1rem',
        titleFontSize:     '1.1rem',
        titleFontWeight:   '700',
        descriptionFontSize: '0.9rem',
        padding: '1.25rem',
        borderWidth: '0'} as any,
    };
  };

  return (
    <div className={`w-full ${textAlignClass}`} style={{ ...bgStyle }}>
      <div className={innerClass} style={innerStyle}>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          transition={{ duration: 0.6 }} className="text-center mb-4">
          <div className="flex justify-center mb-4">
            <ElementsSection section={{ ...section, elements: [badgeEl] }} onTextEdit={onTextEdit}
              onElementUpdate={onElementUpdate || (() => {})} onElementSelect={onElementSelect}
              selectedElementId={selectedElementId} readOnly={readOnly} isWrapped={false}
              buttonClass={buttonClass} themeColors={themeColors} />
          </div>
          <ElementsSection section={{ ...section, elements: [titleEl] }} onTextEdit={onTextEdit}
            onElementUpdate={onElementUpdate || (() => {})} onElementSelect={onElementSelect}
            selectedElementId={selectedElementId} readOnly={readOnly} isWrapped={false}
            buttonClass={buttonClass} themeColors={themeColors} />
        </motion.div>

        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }} className="flex justify-center mb-12 sm:mb-16">
          <ElementsSection section={{ ...section, elements: [descEl] }} onTextEdit={onTextEdit}
            onElementUpdate={onElementUpdate || (() => {})} onElementSelect={onElementSelect}
            selectedElementId={selectedElementId} readOnly={readOnly} isWrapped={false}
            buttonClass={buttonClass} themeColors={themeColors} />
        </motion.div>

        {/* Steps grid — desktop column count tracks the number of steps (capped at 4).
            Mobile: 1 col. Tablet: 2 cols. Desktop: min(steps, 4).
            Connector line: drawn as a per-step ::after pseudo so it appears on
            every row when steps wrap (5+ steps). Hidden on the last cell of
            each row via `:nth-child(Nn)` where N = column count. */}
        {(() => {
          const stepCount = rawSteps.length;
          const desktopCols = Math.min(Math.max(stepCount, 1), 4);
          const gridId = `sdp-grid-${section.id.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
          // Use accent color at ~19% (~#30 hex) for the dashed line, theme-aware.
          const lineColor = `${accent}30`;
          return (
            <div className="relative">
              <style>{`
                #${gridId} { grid-template-columns: repeat(1, minmax(0, 1fr)); }
                #${gridId} > .pp-step-cell::after { content: none; }
                @media (min-width: 640px) {
                  #${gridId} { grid-template-columns: repeat(2, minmax(0, 1fr)); }
                  #${gridId} > .pp-step-cell::after {
                    content: '';
                    position: absolute;
                    top: 1.25rem;
                    left: calc(50% + 1.75rem);
                    right: calc(-50% + 1.75rem);
                    border-top: 2px dashed ${lineColor};
                    pointer-events: none;
                  }
                  #${gridId} > .pp-step-cell:nth-child(2n)::after,
                  #${gridId} > .pp-step-cell:last-of-type::after { content: none; }
                }
                @media (min-width: 1024px) {
                  #${gridId} { grid-template-columns: repeat(${desktopCols}, minmax(0, 1fr)); }
                  #${gridId} > .pp-step-cell::after {
                    content: '';
                    position: absolute;
                    top: 1.25rem;
                    left: calc(50% + 1.75rem);
                    right: calc(-50% + 1.75rem);
                    border-top: 2px dashed ${lineColor};
                    pointer-events: none;
                  }
                  #${gridId} > .pp-step-cell:nth-child(2n)::after { content: ''; }
                  #${gridId} > .pp-step-cell:nth-child(${desktopCols}n)::after,
                  #${gridId} > .pp-step-cell:last-of-type::after { content: none; }
                }
              `}</style>
              <div id={gridId} className="grid gap-6 sm:gap-8">
                {rawSteps.map((step: any, i: number) => {
                  const stepId = step.id || `sdp-step-${i}`;
                  return (
                    <motion.div key={stepId}
                      initial={{ opacity: 0, y: 32 }} whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.1 }}
                      className="pp-step-cell relative text-center group/step"
                    >
                      {/* Step number — circular accent badge wraps an editable text element.
                          Click the number to edit the value (e.g. "1" → "01" / "Step 1"). */}
                      <div className="absolute top-0 right-[calc(50%-2.5rem)] w-7 h-7 rounded-full flex items-center justify-center z-20 shadow-sm"
                        style={{ backgroundColor: accent }}>
                        <ElementsSection section={{ ...section, elements: [getStepNumberEl(i)] }} onTextEdit={onTextEdit}
                          onElementUpdate={onElementUpdate || (() => {})} onElementSelect={onElementSelect}
                          selectedElementId={selectedElementId} readOnly={readOnly} isWrapped={false}
                          buttonClass={buttonClass} themeColors={themeColors} />
                      </div>
                      <ElementsSection section={{ ...section, elements: [getStepEl(i)] }} onTextEdit={onTextEdit}
                        onElementUpdate={onElementUpdate || (() => {})} onElementSelect={onElementSelect}
                        selectedElementId={selectedElementId} readOnly={readOnly} isWrapped={false}
                        buttonClass={buttonClass} themeColors={themeColors} />
                      {isSelected && !readOnly && onSectionUpdate && stepCount > 1 && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleRemoveStep(stepId, i); }}
                          className="absolute -top-2.5 -right-2.5 bg-red-500 hover:bg-red-600 text-white w-7 h-7 rounded-full opacity-0 group-hover/step:opacity-100 transition-all flex items-center justify-center text-xs z-30 shadow-lg hover:scale-110"
                          title="Remove step"
                          aria-label="Remove step"
                        >
                          <i className="fa-solid fa-xmark" />
                        </button>
                      )}
                    </motion.div>
                  );
                })}

                {/* Add-step tile — only when section is selected */}
                {isSelected && !readOnly && onSectionUpdate && (
                  <motion.button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleAddStep(); }}
                    initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }} transition={{ duration: 0.5 }}
                    className="min-h-[180px] rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center gap-3 hover:scale-[1.02]"
                    style={{
                    }}
                    title="Add a new step"
                  >
                    <i className="fa-solid fa-plus text-2xl" />
                    <span className="text-xs font-bold uppercase tracking-widest">Add Step</span>
                  </motion.button>
                )}
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
};

export default ServiceDetailProcessDefault;
