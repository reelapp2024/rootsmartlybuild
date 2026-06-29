import React from 'react';
import { AccordionGroup, ColorInput, RangeInput, SelectInput, SpacingInputGroup } from '../inputs';

interface LayoutSpacingBlockProps {
  paddingValues: { top?: string; right?: string; bottom?: string; left?: string };
  marginValues: { top?: string; right?: string; bottom?: string; left?: string };
  onPaddingChange: (newValues: any) => void;
  onMarginChange: (newValues: any) => void;
  onUpdate: (key: string, val: any) => void;
  onBatchUpdate?: (updates: Record<string, any>) => void;
}

export const LayoutSpacingBlock: React.FC<LayoutSpacingBlockProps> = ({
  paddingValues,
  marginValues,
  onPaddingChange,
  onMarginChange,
  onUpdate,
  onBatchUpdate,
}) => {
  return (
    <AccordionGroup title="Layout & Spacing" defaultOpen={true}>
      <div className="space-y-3">
        <SpacingInputGroup
          label="Padding"
          icon="fa-solid fa-arrows-to-dot"
          values={paddingValues}
          onChange={onPaddingChange}
        />
        <SpacingInputGroup
          label="Margin"
          icon="fa-solid fa-arrows-from-dot"
          values={marginValues}
          onChange={onMarginChange}
        />
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault(); e.stopPropagation();
            const resetPatch = {
              padding: undefined, paddingTop: undefined, paddingBottom: undefined, paddingLeft: undefined, paddingRight: undefined, paddingX: undefined, paddingY: undefined,
              margin: undefined, marginTop: undefined, marginBottom: undefined, marginLeft: undefined, marginRight: undefined,
            };
            if (onBatchUpdate) onBatchUpdate(resetPatch);
            else Object.entries(resetPatch).forEach(([k, v]) => onUpdate(k, v));
          }}
          className="w-full mt-1 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white/80 rounded text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
        >
          <i className="fa-solid fa-rotate-left text-[9px]"></i> Reset
        </button>
      </div>
    </AccordionGroup>
  );
};

interface BorderBlockProps {
  styles: any;
  onUpdate: (key: string, val: any) => void;
  onBatchUpdate?: (updates: Record<string, any>) => void;
}

export const BorderBlock: React.FC<BorderBlockProps> = ({ styles, onUpdate, onBatchUpdate }) => {
  return (
    <AccordionGroup title="Border" defaultOpen={false}>
      <div className="space-y-4">
        <div>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault(); e.stopPropagation();
              const resetPatch = {
                borderColor: undefined, borderWidth: undefined, borderStyle: undefined, borderRadius: undefined,
              };
              if (onBatchUpdate) onBatchUpdate(resetPatch);
              else Object.entries(resetPatch).forEach(([k, v]) => onUpdate(k, v));
            }}
            className="w-full px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-600/40 text-blue-400 rounded text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
          >
            <i className="fa-solid fa-rotate-left"></i> Reset Border
          </button>
        </div>
        <ColorInput
          label="Border Color"
          value={styles.borderColor || ''}
          onChange={(v) => onUpdate('borderColor', v)}
          onReset={() => onUpdate('borderColor', '')}
        />
        <RangeInput
          label="Border Width"
          value={parseInt(styles.borderWidth) || 0}
          min={0} max={20} step={1} unit="px"
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
            { label: 'Double', value: 'double' },
          ]}
          onChange={(v: any) => onUpdate('borderStyle', v)}
        />
        <RangeInput
          label="Corner Radius"
          value={parseInt(styles.borderRadius) || 0}
          min={0} max={100} step={1} unit="px"
          onChange={(v) => onUpdate('borderRadius', `${v}px`)}
        />
      </div>
    </AccordionGroup>
  );
};
