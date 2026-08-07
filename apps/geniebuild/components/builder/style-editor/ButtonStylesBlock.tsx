import React from 'react';
import { AccordionGroup, ColorInput, RangeInput, SelectInput, TextInput } from '../inputs';
import { TypographyControls } from './TypographyControls';

interface ButtonStylesBlockProps {
  styles: any;
  onUpdate: (key: string, val: any) => void;
  onBatchUpdate?: (updates: Record<string, any>) => void;
}

const SHADOW_PRESETS = [
  { label: 'None',         value: 'none' },
  { label: 'Subtle',       value: '0 1px 2px rgba(0, 0, 0, 0.06)' },
  { label: 'Soft',         value: '0 4px 12px -4px rgba(0, 0, 0, 0.12)' },
  { label: 'Lifted',       value: '0 10px 25px -10px rgba(0, 0, 0, 0.2)' },
  { label: 'Pressed',      value: 'inset 0 2px 4px rgba(0, 0, 0, 0.1)' },
  { label: 'Accent Glow',  value: '0 0 20px rgba(225, 29, 72, 0.45)' },
];

export const ButtonStylesBlock: React.FC<ButtonStylesBlockProps> = ({ styles, onUpdate, onBatchUpdate }) => {
  return (
    <>
      <AccordionGroup title="Button Style" defaultOpen={true}>
        <div className="space-y-3">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (onBatchUpdate) {
                onBatchUpdate({ backgroundColor: '', color: '', padding: undefined, buttonVariant: undefined });
              } else {
                onUpdate('backgroundColor', '');
                onUpdate('color', '');
                onUpdate('padding', undefined);
                onUpdate('buttonVariant', undefined);
              }
            }}
            className="w-full px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-600/40 text-blue-400 rounded text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer"
            title="Reset to default theme button styles"
          >
            <i className="fa-solid fa-rotate-left"></i>
            Default Theme Button
          </button>
          <SelectInput
            label="Variant"
            value={styles.buttonVariant || 'primary'}
            options={[
              { label: 'Primary (Filled)',         value: 'primary' },
              { label: 'Secondary (Outline)',      value: 'secondary' },
              { label: 'Outline (Accent Border)',  value: 'outline' },
              { label: 'Ghost (Text Only)',        value: 'ghost' },
            ]}
            onChange={(v: string) => {
              // Atomic variant switch: write the variant explicitly AND clear stale
              // color overrides from the previous variant so the new one's defaults apply.
              // Without this clear, e.g. Secondary's transparent bg would leak into Primary.
              const patch: Record<string, any> = {
                buttonVariant: v,
                backgroundColor: '',
                color: '',
                borderColor: '',
                borderWidth: undefined,
                borderStyle: undefined,
              };
              if (onBatchUpdate) onBatchUpdate(patch);
              else Object.entries(patch).forEach(([k, val]) => onUpdate(k, val));
            }}
          />
          {/* Button DESIGN preset — modern reusable looks. All colors/fonts stay
              dynamic (derived from the theme accent), so every preset works with
              any theme and remains fully overridable by the color controls. */}
          <SelectInput
            label="Button Design"
            value={styles.buttonDesign || 'classic'}
            options={[
              { label: 'Classic',            value: 'classic' },
              { label: 'Pill',               value: 'pill' },
              { label: 'Sharp (Square)',     value: 'sharp' },
              { label: 'Soft Rounded',       value: 'soft' },
              { label: 'Glow',               value: 'glow' },
              { label: 'Neon Border',        value: 'neon' },
              { label: 'Glass',              value: 'glass' },
              { label: 'Gradient',           value: 'gradient' },
              { label: 'Gradient Sheen',     value: 'gradient-sheen' },
              { label: 'Shine Sweep',        value: 'shine' },
              { label: '3D Push',            value: '3d' },
              { label: 'Elevated Shadow',    value: 'elevated' },
              { label: 'Underline Slide',    value: 'underline' },
              { label: 'Bracket',            value: 'bracket' },
              { label: 'Dashed Outline',     value: 'dashed' },
              { label: 'Double Border',      value: 'double' },
              { label: 'Icon Circle',        value: 'icon-circle' },
              { label: 'Minimal Link',       value: 'link' },
              { label: 'Frosted Accent',     value: 'frosted' },
              { label: 'Retro Offset',       value: 'retro' },
            ]}
            onChange={(v: string) => onUpdate('buttonDesign', v)}
          />
          <p className="text-[10px] text-white/40 leading-relaxed -mt-1">
            Designs use the theme accent automatically. Override colors below anytime.
          </p>
          <ColorInput label={styles.backgroundColor ? 'Background Color' : 'Background Color (Inherited)'} value={styles.backgroundColor || ''} onChange={(v) => onUpdate('backgroundColor', v)} onReset={() => onUpdate('backgroundColor', '')} />
          <ColorInput label={styles.color ? 'Text Color' : 'Text Color (Inherited)'} value={styles.color || ''} onChange={(v) => onUpdate('color', v)} onReset={() => onUpdate('color', '')} />
        </div>
      </AccordionGroup>

      {/* ─────────── HOVER COLORS ─────────── */}
      <AccordionGroup title="Hover Colors" defaultOpen={false}>
        <div className="space-y-3">
          <p className="text-[10px] text-white/40 leading-relaxed">
            Override colors only on mouse hover. Empty = automatic dim/brighten of the base color.
          </p>
          <ColorInput
            label="Hover Background"
            value={styles.hoverBackgroundColor || ''}
            onChange={(v) => onUpdate('hoverBackgroundColor', v)}
            onReset={() => onUpdate('hoverBackgroundColor', '')}
          />
          <ColorInput
            label="Hover Text Color"
            value={styles.hoverColor || ''}
            onChange={(v) => onUpdate('hoverColor', v)}
            onReset={() => onUpdate('hoverColor', '')}
          />
          <ColorInput
            label="Hover Border"
            value={styles.hoverBorderColor || ''}
            onChange={(v) => onUpdate('hoverBorderColor', v)}
            onReset={() => onUpdate('hoverBorderColor', '')}
          />
        </div>
      </AccordionGroup>

      {/* ─────────── TYPOGRAPHY ─────────── */}
      <AccordionGroup title="Typography" defaultOpen={false}>
        <TypographyControls
          styles={styles}
          onUpdate={onUpdate}
          showAlignment={false}
          fontSizePlaceholder="1rem"
        />
      </AccordionGroup>

      {/* ─────────── ICON ─────────── */}
      <AccordionGroup title="Icon" defaultOpen={false}>
        <div className="space-y-3">
          <p className="text-[10px] text-white/40 leading-relaxed">
            Set the icon + position in the Content tab. Below controls its visual.
          </p>
          <TextInput
            label="Icon Size"
            value={styles.iconSize || ''}
            onChange={(v) => onUpdate('iconSize', v)}
            placeholder="1em · 16px"
          />
          <RangeInput
            label="Icon Rotation"
            value={parseInt(String(styles.iconRotation || 0)) || 0}
            min={0} max={360} step={15}
            unit="°"
            onChange={(v) => onUpdate('iconRotation', v)}
          />
        </div>
      </AccordionGroup>

      {/* ─────────── BORDER ─────────── */}
      <AccordionGroup title="Border" defaultOpen={false}>
        <div className="space-y-3">
          <ColorInput label="Border Color" value={styles.borderColor || styles.secondaryButtonBorderColor || ''} onChange={(v) => onUpdate('borderColor', v)} onReset={() => onUpdate('borderColor', '')} />
          <div className="grid grid-cols-2 gap-3">
            <RangeInput
              label="Border Width"
              value={parseInt(styles.borderWidth) || 0}
              min={0} max={10} step={1} unit="px"
              onChange={(v) => onUpdate('borderWidth', `${v}px`)}
            />
            <SelectInput
              label="Border Style"
              value={styles.borderStyle || 'none'}
              options={[
                { label: 'None', value: 'none' },
                { label: 'Solid', value: 'solid' },
                { label: 'Dashed', value: 'dashed' },
                { label: 'Dotted', value: 'dotted' },
              ]}
              onChange={(v: any) => onUpdate('borderStyle', v)}
            />
          </div>
          <RangeInput
            label="Border Radius"
            value={parseInt(styles.borderRadius) || 0}
            min={0} max={50} step={1} unit="px"
            onChange={(v) => onUpdate('borderRadius', `${v}px`)}
          />
        </div>
      </AccordionGroup>

      {/* ─────────── SHADOW ─────────── */}
      <AccordionGroup title="Shadow" defaultOpen={false}>
        <div className="space-y-3">
          <SelectInput
            label="Preset"
            value={styles.boxShadow || 'none'}
            options={SHADOW_PRESETS}
            onChange={(v) => onUpdate('boxShadow', v === 'none' ? '' : v)}
          />
          <TextInput
            label="Custom Shadow"
            value={styles.boxShadow || ''}
            onChange={(v) => onUpdate('boxShadow', v)}
            placeholder="0 4px 12px rgba(0,0,0,0.15)"
          />
        </div>
      </AccordionGroup>

      {/* ─────────── PADDING ─────────── */}
      <AccordionGroup title="Padding" defaultOpen={false}>
        <div className="space-y-3">
          <p className="text-[10px] text-white/40 leading-relaxed">
            Size preset (Content tab → Size) auto-sets padding. Override here if needed.
          </p>
          <TextInput
            label="Padding"
            value={typeof styles.padding === 'string' ? styles.padding : ''}
            onChange={(v) => onUpdate('padding', v)}
            placeholder="12px 24px"
          />
        </div>
      </AccordionGroup>
    </>
  );
};
