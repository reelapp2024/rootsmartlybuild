import React from 'react';
import {
  AccordionGroup, ButtonGroup, ColorInput, NumericUnitInput,
} from '../inputs';
import { TypographyControls } from './TypographyControls';

interface TabsStylesBlockProps {
  styles: any;
  onUpdate: (key: string, val: any) => void;
  onBatchUpdate?: (updates: Record<string, any>) => void;
  themeColors?: any;
}

/**
 * Dedicated Design-tab panel for the `tabs` element.
 * Sections: Style / Tab Colors / Panel / Layout.
 */
export const TabsStylesBlock: React.FC<TabsStylesBlockProps> = ({
  styles, onUpdate, onBatchUpdate, themeColors,
}) => {
  const accent = themeColors?.accentColor || '#3b82f6';
  const titleCol = themeColors?.titleColor || '#FFFFFF';
  const tabStyle: string = styles.tabStyle || 'underline';

  const reset = () => {
    const patch: Record<string, any> = {
      tabStyle: '',
      activeColor: '', inactiveColor: '', activeTextColor: '', accentColor: '',
      panelBackground: '', panelBorder: '', panelPadding: '',
      segmentedBg: '',
      textAlign: '', color: '',
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

      {/* ── 1. TAB STYLE ────────────────────────────────────────────── */}
      <AccordionGroup title="Tab Style" defaultOpen={true}>
        <div className="grid grid-cols-2 gap-1.5">
          {[
            { value: 'underline', label: 'Underline', icon: 'fa-underline' },
            { value: 'pills',     label: 'Pills',     icon: 'fa-capsules' },
            { value: 'box',       label: 'Box',       icon: 'fa-folder' },
            { value: 'segmented', label: 'Segmented', icon: 'fa-grip-lines-vertical' },
          ].map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onUpdate('tabStyle', opt.value)}
              className={`py-2.5 px-3 text-[10px] font-bold uppercase tracking-widest rounded border transition-all flex items-center justify-center gap-2 ${
                tabStyle === opt.value
                  ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                  : 'bg-[#151515] border-[#333] text-white/40 hover:border-[#444]'
              }`}
            >
              <i className={`fa-solid ${opt.icon} text-xs`} />
              <span>{opt.label}</span>
            </button>
          ))}
        </div>
      </AccordionGroup>

      {/* ── 2. TAB COLORS ───────────────────────────────────────────── */}
      <AccordionGroup title="Tab Colors" defaultOpen={true}>
        <div className="space-y-3">
          <ColorInput
            label={styles.activeColor ? "Active Color (accent)" : "Active Color (accent) (Inherited)"}
            value={styles.activeColor || accent}
            onChange={(v) => onUpdate('activeColor', v)}
            onReset={() => onUpdate('activeColor', '')}
          />
          <ColorInput
            label={styles.activeTextColor ? "Active Text Color" : "Active Text Color (Inherited)"}
            value={styles.activeTextColor || titleCol}
            onChange={(v) => onUpdate('activeTextColor', v)}
            onReset={() => onUpdate('activeTextColor', '')}
          />
          <ColorInput
            label={styles.inactiveColor ? "Inactive Tab Color" : "Inactive Tab Color (Inherited)"}
            value={styles.inactiveColor || ''}
            onChange={(v) => onUpdate('inactiveColor', v)}
            onReset={() => onUpdate('inactiveColor', '')}
          />
          {tabStyle === 'segmented' && (
            <ColorInput
              label={styles.segmentedBg ? "Segmented Background" : "Segmented Background (Inherited)"}
              value={styles.segmentedBg || ''}
              onChange={(v) => onUpdate('segmentedBg', v)}
              onReset={() => onUpdate('segmentedBg', '')}
            />
          )}
        </div>
      </AccordionGroup>

      {/* ── 3. PANEL ────────────────────────────────────────────────── */}
      <AccordionGroup title="Content Panel" defaultOpen={false}>
        <div className="space-y-3">
          <p className="text-[10px] text-white/40 leading-relaxed">
            Toggle <b>Show Panel</b> in the Content tab to hide the panel border / background.
          </p>
          <ColorInput
            label={styles.panelBackground ? "Panel Background" : "Panel Background (Inherited)"}
            value={styles.panelBackground || ''}
            onChange={(v) => onUpdate('panelBackground', v)}
            onReset={() => onUpdate('panelBackground', '')}
          />
          <ColorInput
            label={styles.panelBorder ? "Panel Border" : "Panel Border (Inherited)"}
            value={styles.panelBorder || ''}
            onChange={(v) => onUpdate('panelBorder', v)}
            onReset={() => onUpdate('panelBorder', '')}
          />
          <NumericUnitInput
            label="Panel Padding"
            value={styles.panelPadding || ''}
            onChange={(v) => onUpdate('panelPadding', v)}
            placeholder="1rem"
            units={['rem', 'px', 'em']}
            step={0.125}
            min={0}
            max={4}
          />
        </div>
      </AccordionGroup>

      {/* ── 3.5 TYPOGRAPHY ──────────────────────────────────────────── */}
      <AccordionGroup title="Typography" defaultOpen={false}>
        <TypographyControls
          styles={styles}
          onUpdate={onUpdate}
          showAlignment={false}
          fontSizePlaceholder="0.875rem"
        />
      </AccordionGroup>

      {/* ── 4. LAYOUT ───────────────────────────────────────────────── */}
      <AccordionGroup title="Layout" defaultOpen={false}>
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-white/40 uppercase">Tab Bar Alignment</label>
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
      </AccordionGroup>
    </>
  );
};
