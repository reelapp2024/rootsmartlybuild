import React from 'react';
import { AccordionGroup, RangeInput, TextInput } from '../inputs';

interface SectionLayoutPresetsBlockProps {
  styles: any;
  onUpdate: (key: string, val: any) => void;
  onBatchUpdate?: (updates: Record<string, any>) => void;
}

/**
 * Section-level Advanced-tab block. Contains:
 *   • Spacing presets — Compact / Comfortable / Spacious / Hero
 *       Quick buttons that set paddingTop + paddingBottom atomically.
 *   • Container width preset — Narrow / Medium / Wide / Full + custom px
 *       Constrains the section's inner content width.
 *   • Responsive visibility — hide on desktop / tablet / mobile
 *   • Custom CSS class — power-user escape hatch
 *
 * Style keys written:
 *   paddingTop, paddingBottom    (spacing)
 *   maxWidth                     (width)
 *   hiddenOnDesktop, hiddenOnTablet, hiddenOnMobile  (visibility)
 *   customClass                  (extra className)
 */

const SPACING_PRESETS = [
  { key: 'compact',     label: 'Compact',     icon: 'fa-compress', top: '32px',  bottom: '32px' },
  { key: 'comfortable', label: 'Comfortable', icon: 'fa-grip-lines', top: '64px',  bottom: '64px' },
  { key: 'spacious',    label: 'Spacious',    icon: 'fa-expand',   top: '96px',  bottom: '96px' },
  { key: 'hero',        label: 'Hero',        icon: 'fa-mountain', top: '160px', bottom: '160px' },
];

const WIDTH_PRESETS = [
  { key: 'narrow', label: 'Narrow', value: '800px',  px: 800 },
  { key: 'medium', label: 'Medium', value: '1100px', px: 1100 },
  { key: 'wide',   label: 'Wide',   value: '1280px', px: 1280 },
  { key: 'full',   label: 'Full',   value: '100%',   px: 0 },
];

export const SectionLayoutPresetsBlock: React.FC<SectionLayoutPresetsBlockProps> = ({
  styles, onUpdate, onBatchUpdate,
}) => {
  // Detect active spacing preset by exact pT/pB match
  const activeSpacingPreset = SPACING_PRESETS.find(p =>
    styles.paddingTop === p.top && styles.paddingBottom === p.bottom
  )?.key;

  const applySpacingPreset = (preset: typeof SPACING_PRESETS[number]) => {
    if (onBatchUpdate) {
      onBatchUpdate({ paddingTop: preset.top, paddingBottom: preset.bottom });
    } else {
      onUpdate('paddingTop', preset.top);
      onUpdate('paddingBottom', preset.bottom);
    }
  };

  // Width preset detection
  const currentMaxWidth = String(styles.maxWidth || '').trim();
  const activeWidthPreset = WIDTH_PRESETS.find(p => p.value === currentMaxWidth)?.key;

  const customMaxWidthPx = (() => {
    const m = currentMaxWidth.match(/^(\d+)\s*px$/);
    return m ? parseInt(m[1], 10) : 1200;
  })();

  // Visibility toggles
  const hiddenOnDesktop = !!styles.hiddenOnDesktop;
  const hiddenOnTablet  = !!styles.hiddenOnTablet;
  const hiddenOnMobile  = !!styles.hiddenOnMobile;

  return (
    <>
      {/* ─────────── SPACING PRESETS ─────────── */}
      <AccordionGroup title="Spacing Preset" defaultOpen={true}>
        <div className="space-y-3">
          <p className="text-[10px] text-white/40 leading-relaxed">
            One-click section padding. Tweak finer in Layout & Spacing below.
          </p>
          <div className="grid grid-cols-2 gap-2">
            {SPACING_PRESETS.map(p => {
              const active = activeSpacingPreset === p.key;
              return (
                <button
                  key={p.key}
                  type="button"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); applySpacingPreset(p); }}
                  className={`py-2.5 px-3 text-[10px] font-bold uppercase tracking-widest rounded border transition-all flex items-center justify-center gap-2 ${
                    active
                      ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                      : 'bg-[#151515] border-[#333] text-white/40 hover:border-[#444]'
                  }`}
                >
                  <i className={`fa-solid ${p.icon} text-xs`} />
                  <span>{p.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </AccordionGroup>

      {/* ─────────── CONTAINER WIDTH ─────────── */}
      <AccordionGroup title="Container Width" defaultOpen={false}>
        <div className="space-y-3">
          <p className="text-[10px] text-white/40 leading-relaxed">
            How wide the section's inner content can grow. Full means edge-to-edge.
          </p>
          <div className="grid grid-cols-4 gap-1.5">
            {WIDTH_PRESETS.map(p => {
              const active = activeWidthPreset === p.key;
              return (
                <button
                  key={p.key}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault(); e.stopPropagation();
                    onUpdate('maxWidth', p.value);
                  }}
                  className={`py-2 text-[9px] font-bold uppercase tracking-widest rounded border transition-all ${
                    active
                      ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                      : 'bg-[#151515] border-[#333] text-white/40 hover:border-[#444]'
                  }`}
                  title={p.value}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
          {/* Custom slider — only when a preset isn't selected (or user wants pixel-precise) */}
          <RangeInput
            label="Custom Max-Width (px)"
            value={customMaxWidthPx}
            min={400}
            max={1920}
            step={20}
            unit="px"
            onChange={(v) => onUpdate('maxWidth', `${v}px`)}
          />
        </div>
      </AccordionGroup>

      {/* ─────────── CONTENT ALIGNMENT ─────────── (Elementor "content position") */}
      <AccordionGroup title="Content Alignment" defaultOpen={true}>
        <div className="space-y-2">
          <p className="text-[10px] text-white/40 leading-relaxed">
            Where the section's content sits horizontally — left, centered, or right.
          </p>
          <div className="grid grid-cols-3 gap-1.5">
            {([
              { key: 'left',   label: 'Left',   icon: 'fa-align-left' },
              { key: 'center', label: 'Center', icon: 'fa-align-center' },
              { key: 'right',  label: 'Right',  icon: 'fa-align-right' },
            ] as const).map(a => {
              const active = String((styles as any).contentAlignH || 'center') === a.key;
              return (
                <button
                  key={a.key}
                  type="button"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); onUpdate('contentAlignH', a.key); }}
                  className={`py-2.5 text-[9px] font-bold uppercase tracking-widest rounded border transition-all flex flex-col items-center gap-1 ${
                    active
                      ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                      : 'bg-[#151515] border-[#333] text-white/40 hover:border-[#444]'
                  }`}
                >
                  <i className={`fa-solid ${a.icon} text-sm`} />
                  {a.label}
                </button>
              );
            })}
          </div>
        </div>
      </AccordionGroup>

      {/* ─────────── RESPONSIVE VISIBILITY ─────────── */}
      <AccordionGroup title="Responsive Visibility" defaultOpen={false}>
        <div className="space-y-3">
          <p className="text-[10px] text-white/40 leading-relaxed">
            Hide this section at specific screen sizes. The toggled state hides the section in preview / on the live site.
          </p>
          <div className="grid grid-cols-3 gap-2">
            {([
              { key: 'hiddenOnDesktop', label: 'Desktop', icon: 'fa-desktop',       active: hiddenOnDesktop },
              { key: 'hiddenOnTablet',  label: 'Tablet',  icon: 'fa-tablet-screen-button', active: hiddenOnTablet  },
              { key: 'hiddenOnMobile',  label: 'Mobile',  icon: 'fa-mobile-screen', active: hiddenOnMobile  },
            ] as const).map(opt => (
              <button
                key={opt.key}
                type="button"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onUpdate(opt.key, !opt.active); }}
                className={`py-2.5 text-[10px] font-bold uppercase tracking-widest rounded border transition-all flex flex-col items-center gap-1 ${
                  opt.active
                    ? 'bg-red-500/20 border-red-500 text-red-400'
                    : 'bg-[#151515] border-[#333] text-white/40 hover:border-[#444]'
                }`}
                title={opt.active ? `Hidden on ${opt.label.toLowerCase()}` : `Visible on ${opt.label.toLowerCase()}`}
              >
                <i className={`fa-solid ${opt.active ? 'fa-eye-slash' : 'fa-eye'}`} />
                {opt.label}
              </button>
            ))}
          </div>
          <p className="text-[9px] text-white/30 italic">
            Highlighted (red) means HIDDEN at that breakpoint.
          </p>
        </div>
      </AccordionGroup>

      {/* ─────────── CUSTOM CLASS / ANCHOR ─────────── */}
      <AccordionGroup title="Advanced Identifiers" defaultOpen={false}>
        <div className="space-y-3">
          <TextInput
            label="Anchor ID (for scroll links)"
            value={styles.anchorId || ''}
            onChange={(v) => {
              // Sanitize: lowercase, no spaces, no special chars
              const cleaned = String(v).toLowerCase().replace(/[^a-z0-9_-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
              onUpdate('anchorId', cleaned);
            }}
            placeholder="features · pricing · about"
          />
          <p className="text-[9px] text-white/30 italic">
            Lets you link to this section with #yourID (e.g. /page#pricing).
          </p>
          <TextInput
            label="Custom CSS Class"
            value={styles.customClass || ''}
            onChange={(v) => onUpdate('customClass', v)}
            placeholder="my-custom-class another-class"
          />
          <p className="text-[9px] text-white/30 italic">
            Power-user only. Multiple classes separated by spaces.
          </p>
          <TextInput
            label="Custom CSS ID"
            value={styles.customId || ''}
            onChange={(v) => {
              const cleaned = String(v).replace(/[^A-Za-z0-9_-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
              onUpdate('customId', cleaned);
            }}
            placeholder="hero-main"
          />
          <p className="text-[9px] text-white/30 italic">
            A CSS id on the section wrapper (for custom CSS / JS targeting).
          </p>
        </div>
      </AccordionGroup>

      {/* Custom CSS — Elementor Advanced › Custom CSS. Use `selector` to target this section. */}
      <AccordionGroup title="Custom CSS" defaultOpen={false}>
        <div className="space-y-2">
          <textarea
            value={styles.customCss || ''}
            onChange={(e) => onUpdate('customCss', e.target.value)}
            placeholder={"selector {\n  border-radius: 24px;\n}\nselector:hover {\n  transform: translateY(-4px);\n}"}
            rows={6}
            spellCheck={false}
            className="w-full bg-[#151515] border border-[#333] rounded px-2 py-2 text-[11px] font-mono text-white/80 outline-none focus:border-blue-500 resize-y"
          />
          <p className="text-[9px] text-white/30 italic leading-relaxed">
            Write CSS for this section. <code className="text-white/50">selector</code> maps to this section's wrapper — exactly like Elementor.
          </p>
        </div>
      </AccordionGroup>
    </>
  );
};
