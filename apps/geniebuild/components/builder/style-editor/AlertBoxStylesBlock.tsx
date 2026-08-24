import React from 'react';
import { AccordionGroup, ColorInput, FontSizeInput, NumericUnitInput } from '../inputs';
import { TypographyControls } from './TypographyControls';

interface AlertBoxStylesBlockProps {
  styles: any;
  onUpdate: (key: string, val: any) => void;
  onBatchUpdate?: (updates: Record<string, any>) => void;
  themeColors?: any;
}

/**
 * Dedicated Design-tab panel for the `alert-box` element.
 * Skips the generic Typography block (App.tsx exclusion).
 *
 * NOTE: Variant + icon + dismissible live on `content` (Content tab).
 *       Style preset / colors / spacing / icon size live here on `style`.
 *
 * Sections:
 *   1. Style Preset  — bar-left / bar-top / full / soft
 *   2. Colors        — bg, border, text, icon (each with reset to theme palette)
 *   3. Icon          — size + container
 *   4. Layout        — padding + radius
 */
export const AlertBoxStylesBlock: React.FC<AlertBoxStylesBlockProps> = ({
  styles, onUpdate, onBatchUpdate,
}) => {
  const stylePreset: string = styles.alertStyle || 'bar-left';

  const reset = () => {
    const patch: Record<string, any> = {
      alertStyle: '',
      backgroundColor: '', borderColor: '', color: '', iconColor: '',
      borderWidth: '', borderStyle: '', borderRadius: '',
      borderLeftWidth: '', borderLeftStyle: '', borderLeftColor: '',
      borderTopWidth: '', borderTopStyle: '', borderTopColor: '',
      iconSize: '', padding: '', titleBottomSpace: '',
    };
    if (onBatchUpdate) onBatchUpdate(patch);
    else Object.entries(patch).forEach(([k, v]) => onUpdate(k, v));
  };

  return (
    <>
      {/* ── RESET ───────────────────────────────────────────────────── */}
      <div className="mb-3">
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); reset(); }}
          className="w-full px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-600/40 text-blue-400 rounded text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
        >
          <i className="fa-solid fa-rotate-left"></i> Reset to Theme
        </button>
      </div>

      {/* ── 1. STYLE PRESET ─────────────────────────────────────────── */}
      <AccordionGroup title="Style Preset" defaultOpen={true}>
        <div className="space-y-3">
          <p className="text-[10px] text-white/40 leading-relaxed">
            Border placement / treatment. Variant (info / success / warning / error) is set in the Content tab.
          </p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: 'bar-left', label: 'Bar Left',  icon: 'fa-bars-staggered' },
              { value: 'bar-top',  label: 'Bar Top',   icon: 'fa-window-maximize' },
              { value: 'full',     label: 'Full Border', icon: 'fa-vector-square' },
              { value: 'soft',     label: 'Soft (no border)', icon: 'fa-square' },
            ].map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => onUpdate('alertStyle', opt.value)}
                className={`py-2.5 px-3 text-[10px] font-bold uppercase tracking-widest rounded border transition-all flex items-center justify-center gap-2 ${
                  stylePreset === opt.value
                    ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                    : 'bg-[#151515] border-[#333] text-white/40 hover:border-[#444]'
                }`}
              >
                <i className={`fa-solid ${opt.icon} text-xs`} />
                <span>{opt.label}</span>
              </button>
            ))}
          </div>
        </div>
      </AccordionGroup>

      {/* ── 2. COLORS ───────────────────────────────────────────────── */}
      <AccordionGroup title="Colors" defaultOpen={true}>
        <div className="space-y-3">
          <p className="text-[10px] text-white/40 leading-relaxed">
            Reset any field to fall back to the variant's default palette.
          </p>
          <ColorInput
            label={styles.backgroundColor ? "Background" : "Background (Inherited)"}
            value={styles.backgroundColor || ''}
            onChange={(v) => onUpdate('backgroundColor', v)}
            onReset={() => onUpdate('backgroundColor', '')}
          />
          {stylePreset !== 'soft' && (
            <ColorInput
              label={styles.borderColor ? "Border / Bar Color" : "Border / Bar Color (Inherited)"}
              value={styles.borderColor || ''}
              onChange={(v) => onUpdate('borderColor', v)}
              onReset={() => onUpdate('borderColor', '')}
            />
          )}
          <ColorInput
            label={styles.color ? "Text Color" : "Text Color (Inherited)"}
            value={styles.color || ''}
            onChange={(v) => onUpdate('color', v)}
            onReset={() => onUpdate('color', '')}
          />
          <ColorInput
            label={styles.iconColor ? "Icon Color" : "Icon Color (Inherited)"}
            value={styles.iconColor || ''}
            onChange={(v) => onUpdate('iconColor', v)}
            onReset={() => onUpdate('iconColor', '')}
          />
        </div>
      </AccordionGroup>

      {/* ── 3. ICON ─────────────────────────────────────────────────── */}
      <AccordionGroup title="Icon" defaultOpen={false}>
        <div className="space-y-3">
          <p className="text-[10px] text-white/40 leading-relaxed">
            Pick the icon + position in the Content tab. Its size is controlled here.
          </p>
          <FontSizeInput
            label="Icon Size"
            value={styles.iconSize || ''}
            onChange={(v) => onUpdate('iconSize', v)}
            placeholder="1.25rem"
          />
        </div>
      </AccordionGroup>

      {/* ── 3.5 TYPOGRAPHY ──────────────────────────────────────────── */}
      <AccordionGroup title="Typography" defaultOpen={false}>
        <TypographyControls styles={styles} onUpdate={onUpdate} fontSizePlaceholder="0.875rem" />
      </AccordionGroup>

      {/* ── 4. LAYOUT ───────────────────────────────────────────────── */}
      <AccordionGroup title="Layout" defaultOpen={false}>
        <div className="space-y-3">
          <NumericUnitInput
            label="Padding (all sides)"
            value={styles.padding || ''}
            onChange={(v) => onUpdate('padding', v)}
            placeholder="1rem"
            units={['rem', 'px', 'em']}
            step={0.125}
            min={0}
            max={4}
          />
          <NumericUnitInput
            label="Border Radius"
            value={styles.borderRadius || ''}
            onChange={(v) => onUpdate('borderRadius', v)}
            placeholder="0.5rem"
            units={['rem', 'px', 'em', '%']}
            step={0.125}
            min={0}
            max={4}
          />
          <NumericUnitInput
            label="Title ↔ Description Gap"
            value={styles.titleBottomSpace || ''}
            onChange={(v) => onUpdate('titleBottomSpace', v)}
            placeholder="0.25rem"
            units={['rem', 'px', 'em']}
            step={0.125}
            min={0}
            max={4}
          />
        </div>
      </AccordionGroup>

    </>
  );
};
