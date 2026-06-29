import React from 'react';
import {
  AccordionGroup, ColorInput, FontSizeInput, NumericUnitInput, SelectInput,
} from '../inputs';

interface IconStylesBlockProps {
  styles: any;
  onUpdate: (key: string, val: any) => void;
  onBatchUpdate?: (updates: Record<string, any>) => void;
  themeColors?: any;
}

type ShapePreset = 'none' | 'square' | 'rounded' | 'pill' | 'circle';

const SHAPE_PRESETS: Array<{ key: ShapePreset; label: string; icon: string; patch: Record<string, any> }> = [
  // "None" = no container at all (just the icon glyph)
  { key: 'none',    label: 'None',    icon: 'fa-xmark',
    patch: { iconBackgroundColor: '', iconContainerSize: '', iconBorderRadius: '' } },
  { key: 'square',  label: 'Square',  icon: 'fa-square',
    patch: { iconContainerSize: '3rem', iconBorderRadius: '0px' } },
  { key: 'rounded', label: 'Rounded', icon: 'fa-square-full',
    patch: { iconContainerSize: '3rem', iconBorderRadius: '12px' } },
  { key: 'pill',    label: 'Pill',    icon: 'fa-capsules',
    patch: { iconContainerSize: '3rem', iconBorderRadius: '9999px' } },
  { key: 'circle',  label: 'Circle',  icon: 'fa-circle',
    patch: { iconContainerSize: '3rem', iconBorderRadius: '50%' } },
];

const detectShape = (s: any): ShapePreset => {
  const hasContainer = !!(s?.iconBackgroundColor || s?.iconContainerSize);
  if (!hasContainer) return 'none';
  const r = String(s?.iconBorderRadius || '');
  if (r === '50%' || r === '9999px') return r === '50%' ? 'circle' : 'pill';
  if (r === '0px' || r === '0') return 'square';
  if (r) return 'rounded';
  return 'square';
};

/**
 * Dedicated Design-tab panel for the standalone `icon` element.
 * Replaces the icon-specific blob inside generic TypographyBlock.
 *
 * Sections:
 *   1. Shape       — none / square / rounded / pill / circle (one-click presets)
 *   2. Icon        — color, size, container size + bg
 *   3. Border      — style / width / color / per-corner radius
 *   4. Effects     — shadow preset, hover effect, entry animation
 *   5. Alignment
 */
export const IconStylesBlock: React.FC<IconStylesBlockProps> = ({
  styles, onUpdate, onBatchUpdate, themeColors,
}) => {
  const accent = themeColors?.iconColor || themeColors?.accentColor || '#E11D48';
  const currentShape = detectShape(styles);

  const applyPatch = (patch: Record<string, any>) => {
    if (onBatchUpdate) onBatchUpdate(patch);
    else Object.entries(patch).forEach(([k, v]) => onUpdate(k, v));
  };

  const setShape = (preset: typeof SHAPE_PRESETS[number]) => {
    if (preset.key === 'none') {
      // Strip container styles entirely
      applyPatch({
        iconBackgroundColor: '', iconContainerSize: '', iconBorderRadius: '',
        iconBorderTopLeftRadius: '', iconBorderTopRightRadius: '',
        iconBorderBottomRightRadius: '', iconBorderBottomLeftRadius: '',
      });
      return;
    }
    // Default container bg = soft accent if user hasn't set one
    const bg = styles.iconBackgroundColor || `${accent}20`;
    applyPatch({ ...preset.patch, iconBackgroundColor: bg });
  };

  const reset = () => {
    applyPatch({
      iconColor: '', color: '',
      iconBackgroundColor: '', iconContainerSize: '',
      iconBorderRadius: '', iconBorderTopLeftRadius: '', iconBorderTopRightRadius: '',
      iconBorderBottomRightRadius: '', iconBorderBottomLeftRadius: '',
      iconBorderStyle: '', iconBorderWidth: '', iconBorderColor: '',
      iconShadow: '', fontSize: '',
      iconHoverEffect: '', iconEntryAnimation: '',
      textAlign: '',
    });
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

      {/* ── 1. SHAPE PRESETS ────────────────────────────────────────── */}
      <AccordionGroup title="Shape" defaultOpen={true}>
        <div className="grid grid-cols-5 gap-1.5">
          {SHAPE_PRESETS.map((p) => {
            const active = currentShape === p.key;
            return (
              <button
                key={p.key}
                type="button"
                onClick={() => setShape(p)}
                className={`py-2.5 text-[9px] font-bold uppercase tracking-widest rounded border transition-all flex flex-col items-center gap-1 ${
                  active
                    ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                    : 'bg-[#151515] border-[#333] text-white/40 hover:border-[#444]'
                }`}
              >
                <i className={`fa-solid ${p.icon} text-sm`} />
                <span>{p.label}</span>
              </button>
            );
          })}
        </div>
      </AccordionGroup>

      {/* ── 2. ICON ─────────────────────────────────────────────────── */}
      <AccordionGroup title="Icon" defaultOpen={true}>
        <div className="space-y-3">
          <ColorInput
            label="Icon Color"
            value={styles.iconColor || styles.color || accent}
            onChange={(v) => onUpdate('iconColor', v)}
            onReset={() => onUpdate('iconColor', '')}
          />
          <FontSizeInput
            label="Icon Size"
            value={styles.fontSize || ''}
            onChange={(v) => onUpdate('fontSize', v)}
            placeholder="2rem"
          />
          {currentShape !== 'none' && (
            <>
              <ColorInput
                label="Container Background"
                value={styles.iconBackgroundColor || ''}
                onChange={(v) => onUpdate('iconBackgroundColor', v)}
                onReset={() => onUpdate('iconBackgroundColor', '')}
              />
              <NumericUnitInput
                label="Container Size"
                value={styles.iconContainerSize || ''}
                onChange={(v) => onUpdate('iconContainerSize', v)}
                placeholder="3rem"
                units={['rem', 'px', 'em']}
                step={0.25}
                min={0}
                max={10}
              />
            </>
          )}
        </div>
      </AccordionGroup>

      {/* ── 3. BORDER ───────────────────────────────────────────────── */}
      {currentShape !== 'none' && (
        <AccordionGroup title="Border" defaultOpen={false}>
          <div className="space-y-3">
            <SelectInput
              label="Border Style"
              value={styles.iconBorderStyle || 'none'}
              options={[
                { label: 'None',   value: 'none' },
                { label: 'Solid',  value: 'solid' },
                { label: 'Dashed', value: 'dashed' },
                { label: 'Dotted', value: 'dotted' },
                { label: 'Double', value: 'double' },
              ]}
              onChange={(v) => onUpdate('iconBorderStyle', v === 'none' ? '' : v)}
            />
            {styles.iconBorderStyle && styles.iconBorderStyle !== 'none' && (
              <>
                <NumericUnitInput
                  label="Border Width"
                  value={styles.iconBorderWidth || ''}
                  onChange={(v) => onUpdate('iconBorderWidth', v)}
                  placeholder="1px"
                  units={['px', 'rem', 'em']}
                  step={1}
                  min={0}
                  max={20}
                />
                <ColorInput
                  label="Border Color"
                  value={styles.iconBorderColor || ''}
                  onChange={(v) => onUpdate('iconBorderColor', v)}
                  onReset={() => onUpdate('iconBorderColor', '')}
                />
              </>
            )}
            <NumericUnitInput
              label="Border Radius"
              value={styles.iconBorderRadius || ''}
              onChange={(v) => {
                onUpdate('iconBorderRadius', v);
                // Clear per-corner overrides when global radius is set
                onUpdate('iconBorderTopLeftRadius', '');
                onUpdate('iconBorderTopRightRadius', '');
                onUpdate('iconBorderBottomRightRadius', '');
                onUpdate('iconBorderBottomLeftRadius', '');
              }}
              placeholder="12px"
              units={['px', 'rem', '%']}
              step={2}
              min={0}
              max={100}
            />
          </div>
        </AccordionGroup>
      )}

      {/* ── 4. EFFECTS ──────────────────────────────────────────────── */}
      <AccordionGroup title="Effects" defaultOpen={false}>
        <div className="space-y-3">
          <SelectInput
            label="Shadow"
            value={styles.iconShadow || 'none'}
            options={[
              { label: 'None',     value: 'none' },
              { label: 'Small',    value: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' },
              { label: 'Medium',   value: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' },
              { label: 'Large',    value: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)' },
              { label: 'Glow',     value: `0 0 18px ${accent}99` },
              { label: 'Soft Halo', value: '0 0 24px rgba(255,255,255,0.25)' },
            ]}
            onChange={(v) => onUpdate('iconShadow', v === 'none' ? '' : v)}
          />
          <SelectInput
            label="Hover Effect"
            value={styles.iconHoverEffect || 'none'}
            options={[
              { label: 'None',          value: 'none' },
              { label: 'Scale Up',      value: 'scale' },
              { label: 'Rotate',        value: 'rotate' },
              { label: 'Bounce',        value: 'bounce' },
              { label: 'Pulse',         value: 'pulse' },
              { label: 'Lift (shadow)', value: 'lift' },
            ]}
            onChange={(v) => onUpdate('iconHoverEffect', v === 'none' ? '' : v)}
          />
          <SelectInput
            label="Entry Animation"
            value={styles.iconEntryAnimation || 'none'}
            options={[
              { label: 'None',     value: 'none' },
              { label: 'Fade In',  value: 'fade' },
              { label: 'Scale In', value: 'scale-in' },
              { label: 'Pop',      value: 'pop' },
              { label: 'Spin In',  value: 'spin-in' },
            ]}
            onChange={(v) => onUpdate('iconEntryAnimation', v === 'none' ? '' : v)}
          />
        </div>
      </AccordionGroup>

      {/* ── 5. ALIGNMENT ────────────────────────────────────────────── */}
      <AccordionGroup title="Alignment" defaultOpen={false}>
        <SelectInput
          label="Horizontal Alignment"
          value={styles.textAlign || 'left'}
          options={[
            { label: 'Left',   value: 'left' },
            { label: 'Center', value: 'center' },
            { label: 'Right',  value: 'right' },
          ]}
          onChange={(v) => onUpdate('textAlign', v)}
        />
      </AccordionGroup>
    </>
  );
};
