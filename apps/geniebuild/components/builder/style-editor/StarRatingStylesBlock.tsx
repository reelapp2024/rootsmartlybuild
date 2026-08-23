import React from 'react';
import { AccordionGroup, ColorInput, FontSizeInput, NumericUnitInput, ButtonGroup } from '../inputs';

interface StarRatingStylesBlockProps {
  styles: any;
  onUpdate: (key: string, val: any) => void;
  onBatchUpdate?: (updates: Record<string, any>) => void;
  themeColors?: any;
}

/**
 * Dedicated Design-tab panel for the `star-rating` element — Elementor-parity.
 * Elementor's Rating widget exposes: star size (`size`), spacing between stars
 * (`spacing`), marked/filled colour (`stars_color`), unmarked/empty colour
 * (`unmarked_color`), and unmarked style solid/outline (`unmarked_style`).
 * Alignment lives on the shared layout controls.
 */
export const StarRatingStylesBlock: React.FC<StarRatingStylesBlockProps> = ({
  styles, onUpdate, onBatchUpdate, themeColors,
}) => {
  const themeAccent = themeColors?.accentColor || '#F59E0B';

  const reset = () => {
    const patch = {
      starSize: '', starSpacing: '', color: '',
      unmarkedColor: '', emptyStarColor: '', inactiveColor: '', unmarkedStyle: '',
    };
    if (onBatchUpdate) onBatchUpdate(patch);
    else Object.entries(patch).forEach(([k, v]) => onUpdate(k, v));
  };

  return (
    <>
      <div className="mb-3">
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); reset(); }}
          className="w-full px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-600/40 text-blue-400 rounded text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
        >
          <i className="fa-solid fa-rotate-left"></i> Reset to Theme
        </button>
      </div>

      <AccordionGroup title="Stars" defaultOpen={true}>
        <div className="space-y-3">
          <FontSizeInput
            label="Star Size"
            value={styles.starSize || ''}
            onChange={(v) => onUpdate('starSize', v)}
            placeholder="1rem"
          />
          <NumericUnitInput
            label="Spacing (between stars)"
            value={styles.starSpacing || ''}
            onChange={(v) => onUpdate('starSpacing', v)}
            placeholder="0.25rem"
            units={['px', 'rem', 'em']}
            step={1}
            min={0}
            max={40}
          />
          <ColorInput
            label={styles.color ? 'Star Color (filled)' : 'Star Color (Inherited)'}
            value={styles.color || themeAccent}
            onChange={(v) => onUpdate('color', v)}
            onReset={() => onUpdate('color', '')}
          />
          <ColorInput
            label={styles.unmarkedColor || styles.emptyStarColor ? 'Empty Star Color' : 'Empty Star Color (Auto)'}
            value={styles.unmarkedColor || styles.emptyStarColor || `${themeAccent}33`}
            onChange={(v) => onUpdate('unmarkedColor', v)}
            onReset={() => onUpdate('unmarkedColor', '')}
          />
          <div>
            <label className="block text-[10px] text-white/50 uppercase tracking-widest mb-1.5">Empty Star Style</label>
            <ButtonGroup
              value={styles.unmarkedStyle || 'solid'}
              onChange={(v: string) => onUpdate('unmarkedStyle', v)}
              options={[
                { value: 'solid', label: 'Solid' },
                { value: 'outline', label: 'Outline' },
              ]}
            />
          </div>
        </div>
      </AccordionGroup>
    </>
  );
};
