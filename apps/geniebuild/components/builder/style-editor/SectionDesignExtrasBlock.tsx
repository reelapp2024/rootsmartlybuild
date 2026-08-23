import React from 'react';
import { AccordionGroup, RangeInput, SelectInput, TextInput } from '../inputs';
import { isCanvasRenderedVariant } from '../../sections/canvas/isCanvasVariant';

interface SectionDesignExtrasBlockProps {
  styles: any;
  onUpdate: (key: string, val: any) => void;
  onBatchUpdate?: (updates: Record<string, any>) => void;
}

/**
 * Section Design-tab extras:
 *   • Minimum Height — Auto / Half / Full screen / Custom
 *   • Reveal Animation — fade-in / slide-up / etc. on scroll into view
 *
 * Style keys written:
 *   minHeight                — '0' | '50vh' | '100vh' | 'XXXpx'
 *   revealAnimation          — 'none' | 'fade-up' | 'slide-left' | 'slide-right' | 'blur-in' | 'scale-in' | 'zoom'
 *   revealDelay              — number (seconds)
 */

const MIN_HEIGHT_PRESETS = [
  { key: 'auto', label: 'Auto',        value: '',       icon: 'fa-arrows-up-down-left-right' },
  { key: 'half', label: 'Half-screen', value: '50vh',   icon: 'fa-arrows-up-to-line' },
  { key: 'full', label: 'Full-screen', value: '100vh',  icon: 'fa-expand' },
];

export const SectionDesignExtrasBlock: React.FC<SectionDesignExtrasBlockProps> = ({
  styles, onUpdate,
}) => {
  // Grid Columns only makes sense for card-grid sections. Freeform Canvas (and
  // any Canvas-based variant, e.g. HeroCanvas) stacks its elements, so hide it.
  const _variantName = String((styles as any)?.variant || '');
  const _isCanvasSection = isCanvasRenderedVariant(_variantName);
  const currentMinHeight = String(styles.minHeight || '').trim();
  const activeMinHeightPreset = MIN_HEIGHT_PRESETS.find(p => p.value === currentMinHeight)?.key
    || (currentMinHeight && currentMinHeight !== '' ? 'custom' : 'auto');

  const customMinHeightPx = (() => {
    const m = currentMinHeight.match(/^(\d+)\s*px$/);
    return m ? parseInt(m[1], 10) : 400;
  })();

  const animation = styles.revealAnimation || 'none';
  const animationDelay = Number(styles.revealDelay) || 0;

  return (
    <>
      {/* ─────────── MINIMUM HEIGHT ─────────── */}
      <AccordionGroup title="Minimum Height" defaultOpen={false}>
        <div className="space-y-3">
          <p className="text-[10px] text-white/40 leading-relaxed">
            Forces the section to be at least this tall. Useful for hero sections.
          </p>
          <div className="grid grid-cols-3 gap-1.5">
            {MIN_HEIGHT_PRESETS.map(p => {
              const active = activeMinHeightPreset === p.key;
              return (
                <button
                  key={p.key}
                  type="button"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); onUpdate('minHeight', p.value); }}
                  className={`py-2.5 text-[9px] font-bold uppercase tracking-widest rounded border transition-all flex flex-col items-center gap-1 ${
                    active
                      ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                      : 'bg-[#151515] border-[#333] text-white/40 hover:border-[#444]'
                  }`}
                >
                  <i className={`fa-solid ${p.icon} text-sm`} />
                  {p.label}
                </button>
              );
            })}
          </div>
          <RangeInput
            label="Custom Height (px)"
            value={customMinHeightPx}
            min={100}
            max={1200}
            step={20}
            unit="px"
            onChange={(v) => onUpdate('minHeight', `${v}px`)}
          />

          {/* Content vertical alignment — where the content sits when the
              section is taller than its content (works with Minimum Height). */}
          <div className="pt-2">
            <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Content Position</label>
            <p className="text-[10px] text-white/30 leading-relaxed mt-1 mb-2">
              When the section is taller than its content, place it at the top, middle or bottom.
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              {([
                { key: 'flex-start', label: 'Top', icon: 'fa-arrow-up' },
                { key: 'center', label: 'Center', icon: 'fa-arrows-up-down' },
                { key: 'flex-end', label: 'Bottom', icon: 'fa-arrow-down' },
              ] as const).map(a => {
                const active = (String(styles.contentAlign || 'flex-start') === a.key);
                return (
                  <button
                    key={a.key}
                    type="button"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); onUpdate('contentAlign', a.key); }}
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
        </div>
      </AccordionGroup>

      {/* ─────────── GRID COLUMNS ─────────── (hidden for freeform Canvas) */}
      {!_isCanvasSection && (
      <AccordionGroup title="Grid Columns" defaultOpen={false}>
        <div className="space-y-3">
          <p className="text-[10px] text-white/40 leading-relaxed">
            How many cards per row on desktop. Mobile is always 1 col, tablet caps at 2.
            Only sections with a card grid (Services, Features, etc.) honor this.
          </p>
          <div className="grid grid-cols-4 gap-1.5">
            {[1, 2, 3, 4].map(n => {
              const active = (parseInt(String(styles.columns), 10) || 3) === n;
              return (
                <button
                  key={n}
                  type="button"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); onUpdate('columns', n); }}
                  className={`py-2.5 text-xs font-bold rounded border transition-all ${
                    active
                      ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                      : 'bg-[#151515] border-[#333] text-white/40 hover:border-[#444]'
                  }`}
                >
                  {n}
                </button>
              );
            })}
          </div>
        </div>
      </AccordionGroup>
      )}

      {/* ─────────── REVEAL ANIMATION ─────────── */}
      <AccordionGroup title="Reveal Animation" defaultOpen={false}>
        <div className="space-y-3">
          <p className="text-[10px] text-white/40 leading-relaxed">
            Animates the section in when it scrolls into view. Subtle by default.
          </p>
          <SelectInput
            label="Preset"
            value={animation}
            options={[
              { label: 'None',          value: 'none' },
              { label: 'Fade Up',       value: 'fade-up' },
              { label: 'Slide Left',    value: 'slide-left' },
              { label: 'Slide Right',   value: 'slide-right' },
              { label: 'Blur In',       value: 'blur-in' },
              { label: 'Scale In',      value: 'scale-in' },
              { label: 'Zoom',          value: 'zoom' },
            ]}
            onChange={(v) => onUpdate('revealAnimation', v === 'none' ? '' : v)}
          />
          {animation && animation !== 'none' && (
            <RangeInput
              label="Delay (seconds)"
              value={animationDelay}
              min={0} max={2} step={0.1}
              unit="s"
              onChange={(v) => onUpdate('revealDelay', v)}
            />
          )}
        </div>
      </AccordionGroup>

      {/* ─────────── ADVANCED (Elementor Advanced tab parity) ─────────── */}
      <AccordionGroup title="Advanced" defaultOpen={false}>
        <div className="space-y-3">
          <TextInput
            label="Box Shadow"
            value={styles.boxShadow || ''}
            onChange={(v) => onUpdate('boxShadow', v)}
            placeholder="0 10px 30px rgba(0,0,0,.15)"
          />
          <div>
            <label className="block text-[10px] text-white/50 uppercase tracking-widest mb-1.5">Z-Index</label>
            <input
              type="number"
              value={styles.zIndex ?? ''}
              onChange={(e) => onUpdate('zIndex', e.target.value === '' ? '' : e.target.value)}
              placeholder="auto"
              className="w-full bg-[#151515] border border-[#333] rounded px-2 py-1.5 text-xs text-white/80 outline-none focus:border-blue-500"
            />
          </div>
          <SelectInput
            label="Overflow"
            value={styles.overflow || ''}
            options={[
              { label: 'Default', value: '' },
              { label: 'Hidden', value: 'hidden' },
              { label: 'Auto (scroll)', value: 'auto' },
              { label: 'Visible', value: 'visible' },
            ]}
            onChange={(v) => onUpdate('overflow', v)}
          />
        </div>
      </AccordionGroup>
    </>
  );
};
