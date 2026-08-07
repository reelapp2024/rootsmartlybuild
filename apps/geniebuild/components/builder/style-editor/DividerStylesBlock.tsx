import React from 'react';
import { AccordionGroup, ColorInput, FontSizeInput, NumericUnitInput } from '../inputs';

interface DividerStylesBlockProps {
  styles: any;
  onUpdate: (key: string, val: any) => void;
  onBatchUpdate?: (updates: Record<string, any>) => void;
  themeColors?: any;
}

/**
 * Dedicated Design-tab panel for the `divider` element.
 * Style + center icon live in the Content tab; here we control:
 *   • Color
 *   • Thickness    (stored on style.dividerThickness)
 *   • Vertical Spacing (stored on style.dividerMarginY)
 *   • Icon Size    (only shown for divider style = "icon")
 */
export const DividerStylesBlock: React.FC<DividerStylesBlockProps> = ({
  styles, onUpdate, onBatchUpdate, themeColors,
}) => {
  const themeBorder = themeColors?.borderColor || 'rgba(255,255,255,0.15)';
  const themeAccent = themeColors?.accentColor || '#E11D48';

  const reset = () => {
    const patch = {
      borderColor: '',
      dividerThickness: '',
      dividerMarginY: '',
      color: '',
      fontSize: '',
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

      {/* ── LINE ────────────────────────────────────────────────────── */}
      <AccordionGroup title="Line" defaultOpen={true}>
        <div className="space-y-3">
          <ColorInput
            label={styles.borderColor ? "Line Color" : "Line Color (Inherited)"}
            value={styles.borderColor || themeBorder}
            onChange={(v) => onUpdate('borderColor', v)}
            onReset={() => onUpdate('borderColor', '')}
          />
          <NumericUnitInput
            label="Thickness"
            value={styles.dividerThickness || ''}
            onChange={(v) => onUpdate('dividerThickness', v)}
            placeholder="1px"
            units={['px', 'rem', 'em']}
            step={1}
            min={1}
            max={20}
          />
          <NumericUnitInput
            label="Vertical Spacing"
            value={styles.dividerMarginY || ''}
            onChange={(v) => onUpdate('dividerMarginY', v)}
            placeholder="24px"
            units={['px', 'rem', 'em']}
            step={2}
            min={0}
            max={120}
          />
        </div>
      </AccordionGroup>

      {/* ── CENTER ICON (only meaningful when divider style = icon) ── */}
      <AccordionGroup title="Center Icon" defaultOpen={false}>
        <div className="space-y-3">
          <p className="text-[10px] text-white/40 leading-relaxed">
            Only applies when "Divider Style" in the Content tab is set to <b>Icon Centered</b>.
            The icon takes the line color by default — override below.
          </p>
          <ColorInput
            label={styles.color ? "Icon Color" : "Icon Color (Inherited)"}
            value={styles.color || themeAccent}
            onChange={(v) => onUpdate('color', v)}
            onReset={() => onUpdate('color', '')}
          />
          <FontSizeInput
            label="Icon Size"
            value={styles.fontSize || ''}
            onChange={(v) => onUpdate('fontSize', v)}
            placeholder="1.25rem"
          />
        </div>
      </AccordionGroup>
    </>
  );
};
