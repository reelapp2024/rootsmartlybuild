import React from 'react';
import { AccordionGroup, ColorInput, NumericUnitInput, SelectInput, TextInput, ButtonGroup } from '../inputs';

interface BlockProps {
  styles: any;
  onUpdate: (key: string, val: any) => void;
  onBatchUpdate?: (updates: Record<string, any>) => void;
  themeColors?: any;
}

const ResetRow: React.FC<{ onReset: () => void }> = ({ onReset }) => (
  <div className="mb-3">
    <button
      type="button"
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); onReset(); }}
      className="w-full px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-600/40 text-blue-400 rounded text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
    >
      <i className="fa-solid fa-rotate-left"></i> Reset to Theme
    </button>
  </div>
);

/**
 * Row layout controls — Elementor Section/Container parity for the multi-column
 * `row` element. Column count, column ratios (asymmetric 30/70 etc.), gap,
 * vertical align, stack-on-mobile, plus background/border/box-shadow of the row.
 */
export const RowStylesBlock: React.FC<BlockProps> = ({ styles, onUpdate, onBatchUpdate, themeColors }) => {
  const cols = Math.min(Math.max(parseInt(String(styles.columnCount), 10) || 2, 1), 4);

  const reset = () => {
    const patch: Record<string, any> = {
      columnCount: '', columnGap: '', columnRatios: '', verticalAlign: '', stackOnMobile: '',
      layoutMode: '', flexDirection: '', justifyContent: '', flexWrap: '',
      backgroundColor: '', borderColor: '', borderWidth: '', borderRadius: '', padding: '', boxShadow: '',
    };
    if (onBatchUpdate) onBatchUpdate(patch);
    else Object.entries(patch).forEach(([k, v]) => onUpdate(k, v));
  };

  return (
    <>
      <ResetRow onReset={reset} />

      <AccordionGroup title="Columns" defaultOpen={true}>
        <div className="space-y-3">
          {/* Layout mode: grid (equal/ratio columns) vs flex (Elementor Container) */}
          <SelectInput
            label="Layout Mode"
            value={styles.layoutMode === 'flex' ? 'flex' : 'grid'}
            options={[
              { label: 'Grid (equal / ratio columns)', value: 'grid' },
              { label: 'Flex (free direction / wrap)', value: 'flex' },
            ]}
            onChange={(v) => onUpdate('layoutMode', v === 'flex' ? 'flex' : '')}
          />
          {styles.layoutMode === 'flex' ? (
            <>
              <SelectInput
                label="Direction"
                value={styles.flexDirection || 'row'}
                options={[
                  { label: 'Row →', value: 'row' },
                  { label: 'Row Reverse ←', value: 'row-reverse' },
                  { label: 'Column ↓', value: 'column' },
                  { label: 'Column Reverse ↑', value: 'column-reverse' },
                ]}
                onChange={(v) => onUpdate('flexDirection', v)}
              />
              <SelectInput
                label="Justify (main axis)"
                value={styles.justifyContent || 'flex-start'}
                options={[
                  { label: 'Start', value: 'flex-start' },
                  { label: 'Center', value: 'center' },
                  { label: 'End', value: 'flex-end' },
                  { label: 'Space Between', value: 'space-between' },
                  { label: 'Space Around', value: 'space-around' },
                  { label: 'Space Evenly', value: 'space-evenly' },
                ]}
                onChange={(v) => onUpdate('justifyContent', v)}
              />
              <SelectInput
                label="Wrap"
                value={styles.flexWrap || 'wrap'}
                options={[
                  { label: 'Wrap', value: 'wrap' },
                  { label: 'No Wrap', value: 'nowrap' },
                ]}
                onChange={(v) => onUpdate('flexWrap', v)}
              />
            </>
          ) : (
            <>
              <div>
                <label className="block text-[10px] text-white/50 uppercase tracking-widest mb-1.5">Column Count</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[1, 2, 3, 4].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => onUpdate('columnCount', n)}
                      className={`py-2 text-xs font-bold rounded border transition-all ${cols === n ? 'bg-blue-500/20 border-blue-500 text-blue-400' : 'bg-[#151515] border-[#333] text-white/40 hover:border-[#444]'}`}
                    >{n}</button>
                  ))}
                </div>
              </div>
              <TextInput
                label="Column Ratios (optional)"
                value={Array.isArray(styles.columnRatios) ? styles.columnRatios.join(' / ') : (styles.columnRatios || '')}
                onChange={(v) => onUpdate('columnRatios', v)}
                placeholder="e.g. 30 / 70  or  1 / 2"
              />
              <p className="text-[9px] text-white/30 italic">Leave empty for equal columns. Use N values for N columns (asymmetric layouts).</p>
            </>
          )}
          <NumericUnitInput label="Gap" value={styles.columnGap || ''} onChange={(v) => onUpdate('columnGap', v)} placeholder="1.5rem" units={['rem', 'px', 'em']} step={0.25} min={0} max={8} />
          <SelectInput
            label="Vertical Align"
            value={styles.verticalAlign || 'stretch'}
            options={[
              { label: 'Stretch', value: 'stretch' },
              { label: 'Top', value: 'flex-start' },
              { label: 'Middle', value: 'center' },
              { label: 'Bottom', value: 'flex-end' },
            ]}
            onChange={(v) => onUpdate('verticalAlign', v)}
          />
          <SelectInput
            label="Stack on Mobile"
            value={styles.stackOnMobile === false ? 'no' : 'yes'}
            options={[{ label: 'Yes (1 column)', value: 'yes' }, { label: 'No (keep columns)', value: 'no' }]}
            onChange={(v) => onUpdate('stackOnMobile', v === 'yes')}
          />
        </div>
      </AccordionGroup>

      <AccordionGroup title="Row Background & Border" defaultOpen={false}>
        <div className="space-y-3">
          <ColorInput label={styles.backgroundColor ? 'Background' : 'Background (None)'} value={styles.backgroundColor || ''} onChange={(v) => onUpdate('backgroundColor', v)} onReset={() => onUpdate('backgroundColor', '')} />
          <ColorInput label={styles.borderColor ? 'Border Color' : 'Border Color (None)'} value={styles.borderColor || ''} onChange={(v) => onUpdate('borderColor', v)} onReset={() => onUpdate('borderColor', '')} />
          <NumericUnitInput label="Border Width" value={styles.borderWidth || ''} onChange={(v) => onUpdate('borderWidth', v)} placeholder="0px" units={['px', 'rem']} step={1} min={0} max={12} />
          <NumericUnitInput label="Corner Radius" value={styles.borderRadius || ''} onChange={(v) => onUpdate('borderRadius', v)} placeholder="0px" units={['px', 'rem', '%']} step={1} min={0} max={80} />
          <TextInput label="Padding" value={styles.padding || ''} onChange={(v) => onUpdate('padding', v)} placeholder="0" />
          <TextInput label="Box Shadow" value={styles.boxShadow || ''} onChange={(v) => onUpdate('boxShadow', v)} placeholder="0 10px 30px rgba(0,0,0,.15)" />
        </div>
      </AccordionGroup>
    </>
  );
};

/**
 * Column layout controls — vertical group. Gap between items, horizontal align,
 * vertical distribution, plus background/border/box-shadow.
 */
export const ColumnStylesBlock: React.FC<BlockProps> = ({ styles, onUpdate, onBatchUpdate }) => {
  const reset = () => {
    const patch: Record<string, any> = {
      columnGap: '', alignItems: '', justifyContent: '',
      backgroundColor: '', borderColor: '', borderWidth: '', borderRadius: '', padding: '', boxShadow: '',
    };
    if (onBatchUpdate) onBatchUpdate(patch);
    else Object.entries(patch).forEach(([k, v]) => onUpdate(k, v));
  };

  return (
    <>
      <ResetRow onReset={reset} />

      <AccordionGroup title="Column Layout" defaultOpen={true}>
        <div className="space-y-3">
          <NumericUnitInput label="Item Gap" value={styles.columnGap || ''} onChange={(v) => onUpdate('columnGap', v)} placeholder="1rem" units={['rem', 'px', 'em']} step={0.25} min={0} max={8} />
          <div>
            <label className="block text-[10px] text-white/50 uppercase tracking-widest mb-1.5">Horizontal Align</label>
            <ButtonGroup
              value={styles.alignItems || 'flex-start'}
              options={[
                { value: 'flex-start', label: 'Left', icon: 'fa-align-left' },
                { value: 'center', label: 'Center', icon: 'fa-align-center' },
                { value: 'flex-end', label: 'Right', icon: 'fa-align-right' },
                { value: 'stretch', label: 'Stretch', icon: 'fa-arrows-left-right' },
              ]}
              onChange={(v) => onUpdate('alignItems', v)}
            />
          </div>
          <SelectInput
            label="Vertical Distribution"
            value={styles.justifyContent || 'flex-start'}
            options={[
              { label: 'Top', value: 'flex-start' },
              { label: 'Center', value: 'center' },
              { label: 'Bottom', value: 'flex-end' },
              { label: 'Space Between', value: 'space-between' },
              { label: 'Space Around', value: 'space-around' },
            ]}
            onChange={(v) => onUpdate('justifyContent', v)}
          />
        </div>
      </AccordionGroup>

      <AccordionGroup title="Column Background & Border" defaultOpen={false}>
        <div className="space-y-3">
          <ColorInput label={styles.backgroundColor ? 'Background' : 'Background (None)'} value={styles.backgroundColor || ''} onChange={(v) => onUpdate('backgroundColor', v)} onReset={() => onUpdate('backgroundColor', '')} />
          <ColorInput label={styles.borderColor ? 'Border Color' : 'Border Color (None)'} value={styles.borderColor || ''} onChange={(v) => onUpdate('borderColor', v)} onReset={() => onUpdate('borderColor', '')} />
          <NumericUnitInput label="Border Width" value={styles.borderWidth || ''} onChange={(v) => onUpdate('borderWidth', v)} placeholder="0px" units={['px', 'rem']} step={1} min={0} max={12} />
          <NumericUnitInput label="Corner Radius" value={styles.borderRadius || ''} onChange={(v) => onUpdate('borderRadius', v)} placeholder="0px" units={['px', 'rem', '%']} step={1} min={0} max={80} />
          <TextInput label="Padding" value={styles.padding || ''} onChange={(v) => onUpdate('padding', v)} placeholder="0" />
          <TextInput label="Box Shadow" value={styles.boxShadow || ''} onChange={(v) => onUpdate('boxShadow', v)} placeholder="0 10px 30px rgba(0,0,0,.15)" />
        </div>
      </AccordionGroup>
    </>
  );
};
