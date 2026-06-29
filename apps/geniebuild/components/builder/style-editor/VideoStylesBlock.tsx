import React from 'react';
import {
  AccordionGroup, ButtonGroup, ColorInput, NumericUnitInput, SelectInput,
} from '../inputs';

interface VideoStylesBlockProps {
  styles: any;
  onUpdate: (key: string, val: any) => void;
  onBatchUpdate?: (updates: Record<string, any>) => void;
  themeColors?: any;
}

/**
 * Dedicated Design-tab panel for the `video` element.
 * Sections: Frame / Object Fit / Width.
 *
 * Note: video URL, autoplay/loop/muted/controls/poster all live in the Content tab.
 */
export const VideoStylesBlock: React.FC<VideoStylesBlockProps> = ({
  styles, onUpdate, onBatchUpdate,
}) => {
  const aspect: string = styles.videoAspectRatio || '16 / 9';
  const objectFit: string = styles.videoObjectFit || 'contain';

  const reset = () => {
    const patch: Record<string, any> = {
      videoAspectRatio: '', videoObjectFit: '',
      borderRadius: '', videoBg: '', backgroundColor: '',
      width: '', maxWidth: '', textAlign: '',
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

      {/* ── 1. FRAME ────────────────────────────────────────────────── */}
      <AccordionGroup title="Frame" defaultOpen={true}>
        <div className="space-y-3">
          <SelectInput
            label="Aspect Ratio"
            value={aspect}
            options={[
              { label: '16:9 (Widescreen)',  value: '16 / 9' },
              { label: '4:3 (Classic)',      value: '4 / 3' },
              { label: '1:1 (Square)',       value: '1 / 1' },
              { label: '9:16 (Vertical)',    value: '9 / 16' },
              { label: '21:9 (Cinematic)',   value: '21 / 9' },
              { label: 'Auto (free height)', value: 'auto' },
            ]}
            onChange={(v) => onUpdate('videoAspectRatio', v)}
          />
          <ColorInput
            label="Background (letterbox)"
            value={styles.videoBg || ''}
            onChange={(v) => onUpdate('videoBg', v)}
            onReset={() => onUpdate('videoBg', '')}
          />
          <NumericUnitInput
            label="Border Radius"
            value={styles.borderRadius || ''}
            onChange={(v) => onUpdate('borderRadius', v)}
            placeholder="0.5rem"
            units={['rem', 'px', '%']}
            step={0.125}
            min={0}
            max={4}
          />
        </div>
      </AccordionGroup>

      {/* ── 2. FIT (self-hosted only — YouTube ignores) ─────────────── */}
      <AccordionGroup title="Object Fit" defaultOpen={false}>
        <div className="space-y-3">
          <p className="text-[10px] text-white/40 leading-relaxed">
            Controls how a self-hosted video fills its frame. Has no effect on YouTube embeds.
          </p>
          <SelectInput
            label="Fit"
            value={objectFit}
            options={[
              { label: 'Contain (full video, may letterbox)', value: 'contain' },
              { label: 'Cover (fill frame, may crop)',        value: 'cover' },
              { label: 'Fill (stretch to frame)',             value: 'fill' },
              { label: 'None (original size)',                value: 'none' },
            ]}
            onChange={(v) => onUpdate('videoObjectFit', v)}
          />
        </div>
      </AccordionGroup>

      {/* ── 3. WIDTH & ALIGNMENT ────────────────────────────────────── */}
      <AccordionGroup title="Width & Alignment" defaultOpen={false}>
        <div className="space-y-3">
          <NumericUnitInput
            label="Max Width"
            value={styles.maxWidth || ''}
            onChange={(v) => onUpdate('maxWidth', v)}
            placeholder="100%"
            units={['%', 'px', 'rem']}
            step={50}
            min={100}
            max={2000}
          />
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-white/40 uppercase">Alignment (when Max Width set)</label>
            <ButtonGroup
              value={styles.textAlign || 'center'}
              options={[
                { icon: 'fa-align-left',   value: 'left',   label: 'Left' },
                { icon: 'fa-align-center', value: 'center', label: 'Center' },
                { icon: 'fa-align-right',  value: 'right',  label: 'Right' },
              ]}
              onChange={(v) => onUpdate('textAlign', v)}
            />
          </div>
        </div>
      </AccordionGroup>
    </>
  );
};
