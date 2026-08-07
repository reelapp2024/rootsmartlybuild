import React from 'react';
import {
  AccordionGroup, ButtonGroup, ColorInput, FontSizeInput, NumericUnitInput,
} from '../inputs';
import { TypographyControls } from './TypographyControls';

interface UserAvatarsStylesBlockProps {
  styles: any;
  onUpdate: (key: string, val: any) => void;
  onBatchUpdate?: (updates: Record<string, any>) => void;
  themeColors?: any;
}

/**
 * Dedicated Design-tab panel for the `user-avatars` element.
 * Sections: Avatars / Ring / Label.
 *
 * Avatars list, Show Count toggle, label text live in the Content tab.
 */
export const UserAvatarsStylesBlock: React.FC<UserAvatarsStylesBlockProps> = ({
  styles, onUpdate, onBatchUpdate, themeColors,
}) => {
  const accent = themeColors?.accentColor || '#60A5FA';
  const textCol = themeColors?.textColor || '#D1D5DB';
  const cardBg = themeColors?.cardBackgroundColor || '#0F172A';
  const justify: string = styles.justifyContent || 'flex-start';

  const reset = () => {
    const patch: Record<string, any> = {
      avatarSize: '', avatarOverlap: '',
      ringColor: '', ringWidth: '',
      labelColor: '', numberColor: '', labelFontSize: '',
      justifyContent: '', color: '',
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

      {/* ── 1. AVATARS ──────────────────────────────────────────────── */}
      <AccordionGroup title="Avatars" defaultOpen={true}>
        <div className="space-y-3">
          <NumericUnitInput
            label="Avatar Size"
            value={styles.avatarSize || ''}
            onChange={(v) => onUpdate('avatarSize', v)}
            placeholder="40px"
            units={['px', 'rem', 'em']}
            step={2}
            min={16}
            max={120}
          />
          <NumericUnitInput
            label="Overlap (negative spacing)"
            value={styles.avatarOverlap || ''}
            onChange={(v) => onUpdate('avatarOverlap', v)}
            placeholder="12px"
            units={['px', 'rem', 'em']}
            step={1}
            min={0}
            max={40}
          />
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-white/40 uppercase">Alignment</label>
            <ButtonGroup
              value={justify}
              options={[
                { icon: 'fa-align-left',   value: 'flex-start', label: 'Left' },
                { icon: 'fa-align-center', value: 'center',     label: 'Center' },
                { icon: 'fa-align-right',  value: 'flex-end',   label: 'Right' },
              ]}
              onChange={(v) => onUpdate('justifyContent', v)}
            />
          </div>
        </div>
      </AccordionGroup>

      {/* ── 2. RING ─────────────────────────────────────────────────── */}
      <AccordionGroup title="Avatar Ring" defaultOpen={false}>
        <div className="space-y-3">
          <p className="text-[10px] text-white/40 leading-relaxed">
            The thin ring around each avatar — usually matches the section background to "punch out" the overlap.
          </p>
          <ColorInput
            label={styles.ringColor ? "Ring Color" : "Ring Color (Inherited)"}
            value={styles.ringColor || cardBg}
            onChange={(v) => onUpdate('ringColor', v)}
            onReset={() => onUpdate('ringColor', '')}
          />
          <NumericUnitInput
            label="Ring Width"
            value={styles.ringWidth || ''}
            onChange={(v) => onUpdate('ringWidth', v)}
            placeholder="2px"
            units={['px', 'rem']}
            step={1}
            min={0}
            max={8}
          />
        </div>
      </AccordionGroup>

      {/* ── 3. LABEL ────────────────────────────────────────────────── */}
      <AccordionGroup title="Label (Join X others)" defaultOpen={false}>
        <div className="space-y-3">
          <p className="text-[10px] text-white/40 leading-relaxed">
            "Join" / "others" wording &amp; the count number are in the Content tab. Toggle off there to hide the label entirely.
          </p>
          <ColorInput
            label={styles.labelColor ? "Label Color" : "Label Color (Inherited)"}
            value={styles.labelColor || textCol}
            onChange={(v) => onUpdate('labelColor', v)}
            onReset={() => onUpdate('labelColor', '')}
          />
          <ColorInput
            label={styles.numberColor ? "Number Color (e.g. 5,000+)" : "Number Color (e.g. 5,000+) (Inherited)"}
            value={styles.numberColor || accent}
            onChange={(v) => onUpdate('numberColor', v)}
            onReset={() => onUpdate('numberColor', '')}
          />
          <FontSizeInput
            label="Label Font Size"
            value={styles.labelFontSize || ''}
            onChange={(v) => onUpdate('labelFontSize', v)}
            placeholder="0.875rem"
          />
          <div className="pt-2 mt-2 border-t border-white/5">
            <TypographyControls
              styles={styles}
              onUpdate={onUpdate}
              showFontSize={false}
              showAlignment={false}
            />
          </div>
        </div>
      </AccordionGroup>
    </>
  );
};
