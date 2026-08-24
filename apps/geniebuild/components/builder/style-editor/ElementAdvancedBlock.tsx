import React from 'react';
import { AccordionGroup, RangeInput, SelectInput, TextInput } from '../inputs';

interface ElementAdvancedBlockProps {
  styles: any;
  onUpdate: (key: string, val: any) => void;
  onBatchUpdate?: (updates: Record<string, any>) => void;
  elementId?: string;
}

/**
 * Element-level ADVANCED tab (Elementor parity). Every element gets:
 *   • Transform — rotate / scale / skew (composed into a single `transform` string)
 *   • Position — default / relative / absolute / fixed, with offsets + z-index
 *   • Entrance animation — fade / slide / zoom on scroll-in
 *   • Custom ID + Custom CSS classes
 *   • Raw Custom CSS (scoped to this element via `selector`)
 *
 * The render already spreads these style keys (transform, position, top/right/
 * bottom/left, zIndex) through getSafeStyle, so this block only needs to WRITE
 * them. Custom CSS / ID / classes are applied by the element wrapper.
 */

// Compose the three transform sub-values into one CSS transform string, and
// parse an existing string back out so the sliders stay in sync.
function parseTransform(t: string | undefined) {
  const s = String(t || '');
  const rot = /rotate\(\s*(-?\d+(?:\.\d+)?)deg\s*\)/.exec(s);
  const scl = /scale\(\s*(-?\d+(?:\.\d+)?)\s*\)/.exec(s);
  const skx = /skewX\(\s*(-?\d+(?:\.\d+)?)deg\s*\)/.exec(s);
  const sky = /skewY\(\s*(-?\d+(?:\.\d+)?)deg\s*\)/.exec(s);
  return {
    rotate: rot ? parseFloat(rot[1]) : 0,
    scale: scl ? parseFloat(scl[1]) : 1,
    skewX: skx ? parseFloat(skx[1]) : 0,
    skewY: sky ? parseFloat(sky[1]) : 0,
  };
}
function composeTransform(t: { rotate: number; scale: number; skewX: number; skewY: number }) {
  const parts: string[] = [];
  if (t.rotate) parts.push(`rotate(${t.rotate}deg)`);
  if (t.scale !== 1) parts.push(`scale(${t.scale})`);
  if (t.skewX) parts.push(`skewX(${t.skewX}deg)`);
  if (t.skewY) parts.push(`skewY(${t.skewY}deg)`);
  return parts.join(' ');
}

export const ElementAdvancedBlock: React.FC<ElementAdvancedBlockProps> = ({
  styles, onUpdate, elementId,
}) => {
  const tf = parseTransform(styles.transform);
  const setTf = (patch: Partial<typeof tf>) => {
    onUpdate('transform', composeTransform({ ...tf, ...patch }));
  };
  const position = styles.position || 'static';
  const isPositioned = position === 'absolute' || position === 'fixed' || position === 'relative';

  const animation = styles.entranceAnimation || styles.revealAnimation || 'none';

  // Custom-CSS scope: prefer a set customId, else the element id.
  const scopeId = String(styles.customId || elementId || '').replace(/[^A-Za-z0-9_-]/g, '') || 'this-element';

  return (
    <>
      {/* ── TRANSFORM ─────────────────────────────────────────────── */}
      <AccordionGroup title="Transform" defaultOpen={false}>
        <div className="space-y-3">
          <RangeInput label="Rotate (deg)" value={tf.rotate} min={-180} max={180} step={1} unit="°" onChange={(v) => setTf({ rotate: v })} />
          <RangeInput label="Scale" value={Math.round(tf.scale * 100)} min={20} max={200} step={5} unit="%" onChange={(v) => setTf({ scale: v / 100 })} />
          <RangeInput label="Skew X (deg)" value={tf.skewX} min={-60} max={60} step={1} unit="°" onChange={(v) => setTf({ skewX: v })} />
          <RangeInput label="Skew Y (deg)" value={tf.skewY} min={-60} max={60} step={1} unit="°" onChange={(v) => setTf({ skewY: v })} />
          {(tf.rotate || tf.scale !== 1 || tf.skewX || tf.skewY) ? (
            <button
              type="button"
              onClick={() => onUpdate('transform', '')}
              className="text-[9px] text-white/40 hover:text-white/70 underline"
            >Reset transform</button>
          ) : null}
        </div>
      </AccordionGroup>

      {/* ── POSITION ──────────────────────────────────────────────── */}
      <AccordionGroup title="Position" defaultOpen={false}>
        <div className="space-y-3">
          <SelectInput
            label="Position"
            value={position}
            options={[
              { label: 'Default', value: 'static' },
              { label: 'Relative', value: 'relative' },
              { label: 'Absolute', value: 'absolute' },
              { label: 'Fixed', value: 'fixed' },
            ]}
            onChange={(v) => onUpdate('position', v === 'static' ? '' : v)}
          />
          {isPositioned && (
            <div className="grid grid-cols-2 gap-x-3 gap-y-2">
              <TextInput label="Top" value={styles.top || ''} onChange={(v) => onUpdate('top', v)} placeholder="auto" />
              <TextInput label="Right" value={styles.right || ''} onChange={(v) => onUpdate('right', v)} placeholder="auto" />
              <TextInput label="Bottom" value={styles.bottom || ''} onChange={(v) => onUpdate('bottom', v)} placeholder="auto" />
              <TextInput label="Left" value={styles.left || ''} onChange={(v) => onUpdate('left', v)} placeholder="auto" />
            </div>
          )}
          <div>
            <label className="block text-[10px] text-white/50 uppercase tracking-widest mb-1.5">Z-Index</label>
            <input
              type="number"
              value={styles.zIndex ?? ''}
              onChange={(e) => onUpdate('zIndex', e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="auto"
              className="w-full bg-[#151515] border border-[#333] rounded px-2 py-1.5 text-xs text-white/80 outline-none focus:border-blue-500"
            />
          </div>
        </div>
      </AccordionGroup>

      {/* ── ENTRANCE ANIMATION ────────────────────────────────────── */}
      <AccordionGroup title="Entrance Animation" defaultOpen={false}>
        <div className="space-y-3">
          <p className="text-[10px] text-white/40 leading-relaxed">Animates this element in when it scrolls into view.</p>
          <SelectInput
            label="Preset"
            value={animation}
            options={[
              { label: 'None', value: 'none' },
              { label: 'Fade Up', value: 'fade-up' },
              { label: 'Fade In', value: 'fade-in' },
              { label: 'Slide Left', value: 'slide-left' },
              { label: 'Slide Right', value: 'slide-right' },
              { label: 'Zoom In', value: 'zoom-in' },
            ]}
            onChange={(v) => onUpdate('entranceAnimation', v === 'none' ? '' : v)}
          />
        </div>
      </AccordionGroup>

      {/* ── IDENTIFIERS + CUSTOM CSS ──────────────────────────────── */}
      <AccordionGroup title="Custom CSS & Identifiers" defaultOpen={false}>
        <div className="space-y-3">
          <TextInput
            label="CSS ID"
            value={styles.customId || ''}
            onChange={(v) => onUpdate('customId', String(v).replace(/[^A-Za-z0-9_-]/g, '-').replace(/-+/g, '-'))}
            placeholder="my-element"
          />
          <TextInput
            label="CSS Classes"
            value={styles.customClasses || ''}
            onChange={(v) => onUpdate('customClasses', v)}
            placeholder="class-a class-b"
          />
          <div className="space-y-1.5">
            <label className="block text-[10px] text-white/50 uppercase tracking-widest">Custom CSS</label>
            <textarea
              value={styles.customCss || ''}
              onChange={(e) => onUpdate('customCss', e.target.value)}
              placeholder={'selector {\n  transition: .2s;\n}\nselector:hover {\n  opacity: .85;\n}'}
              rows={5}
              spellCheck={false}
              className="w-full bg-[#151515] border border-[#333] rounded px-2 py-2 text-[11px] font-mono text-white/80 outline-none focus:border-blue-500 resize-y"
            />
            <p className="text-[9px] text-white/30 italic leading-relaxed">
              <code className="text-white/50">selector</code> targets this element — like Elementor.
            </p>
          </div>
        </div>
      </AccordionGroup>
    </>
  );
};
