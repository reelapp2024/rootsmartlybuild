import React from 'react';
import { PRESET_FONTS, PRESET_THEMES } from '../../../constants';
import { AccordionGroup, ButtonGroup, ColorInput, FontSizeInput, NumericUnitInput, RangeInput, SelectInput } from '../inputs';

interface BadgeStylesBlockProps {
  styles: any;
  onUpdate: (key: string, val: any) => void;
  onBatchUpdate?: (updates: Record<string, any>) => void;
  /** Current global surface color — used to pick the right preset's badge fallback. */
  liveSurface: string;
  /** Fallback button bg/text if no preset matches (for constructing rgba fallback). */
  fallbackButtonBg?: string;
  fallbackButtonText?: string;
}

type BadgeVariant = 'solid' | 'soft' | 'outline' | 'gradient';
type BadgeSize    = 'xs' | 'sm' | 'md' | 'lg';

/** Detect which size preset the current style most closely matches (by fontSize). */
const detectSize = (s: any): BadgeSize => {
  const f = s?.fontSize;
  if (f === '0.625rem' || f === '10px') return 'xs';
  if (f === '0.875rem' || f === '14px') return 'md';
  if (f === '1rem' || f === '16px') return 'lg';
  return 'sm';
};

/** Detect which variant the current style most closely matches. */
const detectVariant = (s: any): BadgeVariant => {
  if (s?.backgroundImage && String(s.backgroundImage).startsWith('linear-gradient')) return 'gradient';
  if ((!s?.backgroundColor || s.backgroundColor === 'transparent') && s?.borderWidth) return 'outline';
  // "Solid" = background is a solid hex/rgb without alpha. "Soft" = rgba with alpha < 1.
  const bg: string = s?.backgroundColor || '';
  if (bg.startsWith('rgba') && /,\s*0?\.\d+\s*\)$/.test(bg)) return 'soft';
  if (bg && bg !== 'transparent') return 'solid';
  return 'soft'; // theme default looks "soft"
};

export const BadgeStylesBlock: React.FC<BadgeStylesBlockProps> = ({
  styles,
  onUpdate,
  onBatchUpdate,
  liveSurface,
  fallbackButtonBg = '#3b82f6',
  fallbackButtonText = '#FFFFFF',
}) => {
  const preset = PRESET_THEMES.find(t => t.elements.surface.toLowerCase() === liveSurface.toLowerCase());

  const parsePaddingPx = (value: unknown): number => {
    if (typeof value !== 'string') return 6;
    const firstToken = value.trim().split(/\s+/)[0] || '';
    const match = firstToken.match(/([\d.]+)(px|rem|%|em)?/);
    if (!match) return 6;
    const num = parseFloat(match[1]);
    if (!Number.isFinite(num)) return 6;
    const unit = match[2] || 'px';
    if (unit === 'rem' || unit === 'em') return Math.round(num * 16);
    if (unit === '%') return Math.round(num);
    return Math.round(num);
  };

  let fallbackBg = preset?.elements.badge.background;
  let fallbackText = preset?.elements.badge.text;
  // Accent for gradient/outline variants
  const accent = preset?.elements.accent || (preset?.elements.primaryButton?.bg) || fallbackButtonBg;

  if (!fallbackBg) {
    const hex = fallbackButtonBg;
    let r = 59, g = 130, b = 246;
    if (hex.startsWith('#') && hex.length === 7) {
      r = parseInt(hex.slice(1, 3), 16); g = parseInt(hex.slice(3, 5), 16); b = parseInt(hex.slice(5, 7), 16);
    }
    fallbackBg = `rgba(${r}, ${g}, ${b}, 0.15)`;
    fallbackText = fallbackButtonText;
  }

  const parseBorderRadius = (val: string | undefined): number => {
    if (!val) return 50;
    if (val === '9999px' || val === '50%') return 50;
    const match = val.match(/([\d.]+)(px|%|rem)/);
    if (match) {
      const num = parseFloat(match[1]);
      if (match[2] === '%') return Math.min(100, Math.max(0, num));
      if (match[2] === 'px') return Math.min(100, Math.max(0, num));
      if (match[2] === 'rem') return Math.min(100, Math.max(0, num * 16));
    }
    return 50;
  };
  const formatBorderRadius = (val: number): string => val >= 50 ? '9999px' : `${val}px`;

  // ── Helpers for variant application ─────────────────────────────────────
  const applyPatch = (patch: Record<string, any>) => {
    if (onBatchUpdate) onBatchUpdate(patch);
    else Object.entries(patch).forEach(([k, v]) => onUpdate(k, v));
  };

  /** Build a "soft" rgba (~15% alpha) from a hex color. */
  const softify = (hex: string): string => {
    if (!hex.startsWith('#') || hex.length !== 7) return hex;
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, 0.15)`;
  };

  const setVariant = (variant: BadgeVariant) => {
    if (variant === 'solid') {
      applyPatch({
        backgroundColor: accent,
        backgroundImage: '',
        color: '#FFFFFF',
        borderWidth: '0px',
        borderStyle: 'none',
        borderColor: 'transparent',
      });
    } else if (variant === 'soft') {
      applyPatch({
        backgroundColor: softify(accent),
        backgroundImage: '',
        color: accent,
        borderWidth: '0px',
        borderStyle: 'none',
        borderColor: 'transparent',
      });
    } else if (variant === 'outline') {
      applyPatch({
        backgroundColor: 'transparent',
        backgroundImage: '',
        color: accent,
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: accent,
      });
    } else if (variant === 'gradient') {
      // Use accent → soft accent gradient. Looks premium, works on dark backgrounds.
      applyPatch({
        backgroundColor: 'transparent',
        backgroundImage: `linear-gradient(135deg, ${accent} 0%, ${accent}80 100%)`,
        color: '#FFFFFF',
        borderWidth: '0px',
        borderStyle: 'none',
        borderColor: 'transparent',
      });
    }
  };

  const setSize = (size: BadgeSize) => {
    const map: Record<BadgeSize, { fontSize: string; padding: string; borderRadius: string }> = {
      xs: { fontSize: '0.625rem', padding: '2px 8px',  borderRadius: '9999px' },
      sm: { fontSize: '0.75rem',  padding: '4px 12px', borderRadius: '9999px' },
      md: { fontSize: '0.875rem', padding: '6px 14px', borderRadius: '9999px' },
      lg: { fontSize: '1rem',     padding: '8px 18px', borderRadius: '9999px' },
    };
    applyPatch(map[size]);
  };

  const currentVariant = detectVariant(styles);
  const currentSize = detectSize(styles);
  const currentEntry: string = (styles?.entryAnimation as string) || 'none';

  // Tab pill helper
  const Pill = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded transition-all border ${
        active ? 'bg-blue-500/20 border-blue-500 text-blue-400' : 'bg-[#151515] border-[#333] text-white/40 hover:border-[#444]'
      }`}
    >
      {children}
    </button>
  );

  return (
    <AccordionGroup title="Badge Styles" defaultOpen={true}>
      {/* ── Reset ──────────────────────────────────────────────────── */}
      <div className="mb-3">
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault(); e.stopPropagation();
            applyPatch({
              backgroundColor: '', color: '', borderColor: '',
              backgroundImage: '', borderWidth: undefined, borderStyle: undefined,
              padding: undefined, borderRadius: undefined,
              fontSize: undefined, entryAnimation: undefined,
            });
          }}
          className="w-full px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-600/40 text-blue-400 rounded text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer"
        >
          <i className="fa-solid fa-rotate-left"></i> Default Theme Badge
        </button>
      </div>

      {/* ── 1. VARIANT ─────────────────────────────────────────────── */}
      <div className="space-y-1.5 mb-3">
        <label className="text-[10px] font-bold text-white/40 uppercase">Variant</label>
        <div className="grid grid-cols-4 gap-1.5">
          <Pill active={currentVariant === 'solid'}    onClick={() => setVariant('solid')}>Solid</Pill>
          <Pill active={currentVariant === 'soft'}     onClick={() => setVariant('soft')}>Soft</Pill>
          <Pill active={currentVariant === 'outline'}  onClick={() => setVariant('outline')}>Outline</Pill>
          <Pill active={currentVariant === 'gradient'} onClick={() => setVariant('gradient')}>Gradient</Pill>
        </div>
      </div>

      {/* ── 2. SIZE PRESET ─────────────────────────────────────────── */}
      <div className="space-y-1.5 mb-3">
        <label className="text-[10px] font-bold text-white/40 uppercase">Size Preset</label>
        <div className="grid grid-cols-4 gap-1.5">
          <Pill active={currentSize === 'xs'} onClick={() => setSize('xs')}>XS</Pill>
          <Pill active={currentSize === 'sm'} onClick={() => setSize('sm')}>SM</Pill>
          <Pill active={currentSize === 'md'} onClick={() => setSize('md')}>MD</Pill>
          <Pill active={currentSize === 'lg'} onClick={() => setSize('lg')}>LG</Pill>
        </div>
      </div>

      {/* ── 3. COLORS ──────────────────────────────────────────────── */}
      <ColorInput label={styles.backgroundColor ? 'Background Color' : 'Background Color (Inherited)'} value={styles.backgroundColor || fallbackBg} onChange={(v) => onUpdate('backgroundColor', v)} onReset={() => onUpdate('backgroundColor', '')} />
      <ColorInput label={styles.color ? 'Text Color' : 'Text Color (Inherited)'}       value={styles.color           || fallbackText || ''} onChange={(v) => onUpdate('color', v)}            onReset={() => onUpdate('color', '')} />
      {currentVariant === 'outline' && (
        <ColorInput label="Border Color" value={styles.borderColor || accent} onChange={(v) => onUpdate('borderColor', v)} onReset={() => onUpdate('borderColor', '')} />
      )}

      {/* ── 4. FINE-TUNE (padding + radius) ────────────────────────── */}
      <RangeInput
        label="Padding (All)"
        value={Math.min(64, Math.max(0, parsePaddingPx(styles.padding)))}
        min={0} max={64} step={1} unit="px"
        onChange={(v) => onUpdate('padding', `${v}px`)}
      />
      <RangeInput
        label="Border Radius"
        value={parseBorderRadius(styles.borderRadius)}
        min={0} max={50} step={1} unit="px"
        onChange={(v) => onUpdate('borderRadius', formatBorderRadius(v))}
      />

      {/* ── 5. TYPOGRAPHY ──────────────────────────────────────────── */}
      <div className="pt-3 mt-3 border-t border-white/5 space-y-3">
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Typography</h4>
        <SelectInput
          label="Font Family"
          value={styles.fontFamily || ''}
          options={[
            { label: 'Theme Default', value: '' },
            ...PRESET_FONTS.map((f) => ({ label: f.name, value: f.value })),
          ]}
          onChange={(v: string) => onUpdate('fontFamily', v === '' ? undefined : v)}
        />
        <FontSizeInput
          label="Font Size"
          value={styles.fontSize || ''}
          onChange={(v) => onUpdate('fontSize', v)}
          placeholder="0.75rem"
        />
        <SelectInput
          label="Font Weight"
          value={String(styles.fontWeight || '600')}
          options={[
            { label: 'Light',    value: '300' },
            { label: 'Regular',  value: '400' },
            { label: 'Medium',   value: '500' },
            { label: 'Semibold', value: '600' },
            { label: 'Bold',     value: '700' },
            { label: 'Black',    value: '900' },
          ]}
          onChange={(v) => onUpdate('fontWeight', v)}
        />
        <SelectInput
          label="Font Style"
          value={styles.fontStyle || 'normal'}
          options={[
            { label: 'Normal', value: 'normal' },
            { label: 'Italic', value: 'italic' },
          ]}
          onChange={(v) => onUpdate('fontStyle', v === 'normal' ? '' : v)}
        />
        <NumericUnitInput
          label="Line Height"
          value={styles.lineHeight || ''}
          onChange={(v) => onUpdate('lineHeight', v)}
          placeholder="1.4"
          units={['', 'px', 'rem', 'em', '%']}
          step={0.05}
          min={0.8}
          max={3}
        />
        <NumericUnitInput
          label="Letter Spacing"
          value={styles.letterSpacing || ''}
          onChange={(v) => onUpdate('letterSpacing', v)}
          placeholder="0.12em"
          units={['em', 'px', 'rem']}
          step={0.01}
          min={-0.5}
          max={1}
        />
        <SelectInput
          label="Text Transform"
          value={styles.textTransform || ''}
          options={[
            { label: 'None',       value: '' },
            { label: 'Uppercase',  value: 'uppercase' },
            { label: 'Lowercase',  value: 'lowercase' },
            { label: 'Capitalize', value: 'capitalize' },
          ]}
          onChange={(v: string) => onUpdate('textTransform', v)}
        />
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-white/40 uppercase">Alignment</label>
          <ButtonGroup
            value={styles.textAlign || 'left'}
            options={[
              { icon: 'fa-align-left',   value: 'left',   label: 'Left' },
              { icon: 'fa-align-center', value: 'center', label: 'Center' },
              { icon: 'fa-align-right',  value: 'right',  label: 'Right' },
            ]}
            onChange={(v) => onUpdate('textAlign', v)}
          />
        </div>
      </div>

      {/* ── 6. ENTRY ANIMATION ─────────────────────────────────────── */}
      <div className="pt-3 mt-3 border-t border-white/5">
        <SelectInput
          label="Entry Animation"
          value={currentEntry}
          options={[
            { label: 'None',      value: 'none' },
            { label: 'Fade In',   value: 'fade' },
            { label: 'Slide Up',  value: 'slide-up' },
            { label: 'Scale In',  value: 'scale-in' },
            { label: 'Pop',       value: 'pop' },
          ]}
          onChange={(v) => onUpdate('entryAnimation', v === 'none' ? '' : v)}
        />
      </div>
    </AccordionGroup>
  );
};
