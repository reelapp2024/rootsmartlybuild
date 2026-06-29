import React from 'react';
import {
  AccordionGroup, ColorInput, FontSizeInput, NumericUnitInput, SelectInput,
} from '../inputs';
import { PRESET_FONTS } from '../../../constants';
import type { GlobalElementStyles, HeadingLevelStyle } from '../../../types';

const FONT_OPTIONS = [
  { label: 'Theme Default (no override)', value: '' },
  ...PRESET_FONTS.map(f => ({ label: f.name, value: f.value })),
];

/** Inline editor for a single heading level (h1..h6 OR `all`). */
const HeadingLevelEditor: React.FC<{
  value: HeadingLevelStyle;
  onPatch: (patch: Partial<HeadingLevelStyle>) => void;
  /** When true, skip the size input — the `all` group leaves sizing to the per-level rows. */
  hideSize?: boolean;
}> = ({ value, onPatch, hideSize }) => (
  <div className="space-y-3">
    <div className="space-y-2">
      <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Color — Dark Sections</label>
      <ColorInput
        label="Color (dark)"
        value={value.color || ''}
        onChange={(c) => onPatch({ color: c })}
        onReset={() => onPatch({ color: '' })}
      />
      <ColorInput
        label="Highlight (dark)"
        value={value.highlightColor || ''}
        onChange={(c) => onPatch({ highlightColor: c })}
        onReset={() => onPatch({ highlightColor: '' })}
      />
    </div>
    <div className="space-y-2 pt-2 border-t border-white/5">
      <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Color — Light Sections</label>
      <ColorInput
        label="Color (light)"
        value={value.colorLight || ''}
        onChange={(c) => onPatch({ colorLight: c })}
        onReset={() => onPatch({ colorLight: '' })}
      />
      <ColorInput
        label="Highlight (light)"
        value={value.highlightColorLight || ''}
        onChange={(c) => onPatch({ highlightColorLight: c })}
        onReset={() => onPatch({ highlightColorLight: '' })}
      />
    </div>
    <div className="space-y-2 pt-2 border-t border-white/5">
      <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Typography</label>
      {!hideSize && (
        <FontSizeInput
          label="Font Size"
          value={value.fontSize || ''}
          onChange={(val) => onPatch({ fontSize: val })}
          placeholder=""
        />
      )}
      <SelectInput
        label="Font Family"
        value={value.fontFamily || ''}
        options={FONT_OPTIONS}
        onChange={(val: string) => onPatch({ fontFamily: val })}
      />
      <SelectInput
        label="Font Weight"
        value={value.fontWeight || ''}
        options={[
          { label: 'Theme Default', value: '' },
          { label: 'Light (300)',    value: '300' },
          { label: 'Regular (400)',  value: '400' },
          { label: 'Medium (500)',   value: '500' },
          { label: 'Semibold (600)', value: '600' },
          { label: 'Bold (700)',     value: '700' },
          { label: 'Extra Bold (800)', value: '800' },
          { label: 'Black (900)',    value: '900' },
        ]}
        onChange={(val) => onPatch({ fontWeight: val })}
      />
      <NumericUnitInput
        label="Line Height"
        value={value.lineHeight || ''}
        onChange={(val) => onPatch({ lineHeight: val })}
        placeholder="1.2"
        units={['', 'px', 'rem', '%']}
        step={0.05}
        min={0.8}
        max={3}
      />
      <NumericUnitInput
        label="Letter Spacing"
        value={value.letterSpacing || ''}
        onChange={(val) => onPatch({ letterSpacing: val })}
        placeholder="0"
        units={['em', 'px', 'rem']}
        step={0.01}
        min={-0.5}
        max={1}
      />
    </div>
  </div>
);

interface GlobalElementStylesPanelProps {
  value: GlobalElementStyles | undefined;
  onChange: (next: GlobalElementStyles) => void;
}

/**
 * Site-wide default styles per element type. Sits between the active theme
 * and per-element overrides:
 *   element.style → bulk section style → globalElementStyles → theme tokens
 *
 * Every field optional — leaving a field blank falls back to theme.
 */
export const GlobalElementStylesPanel: React.FC<GlobalElementStylesPanelProps> = ({
  value, onChange,
}) => {
  const v: GlobalElementStyles = value || {};

  const updateGroup = <K extends keyof GlobalElementStyles>(
    group: K,
    patch: Partial<NonNullable<GlobalElementStyles[K]>>,
  ) => {
    onChange({
      ...v,
      [group]: { ...(v[group] || {}), ...patch },
    });
  };

  const resetAll = () => onChange({});

  const fontOptions = [
    { label: 'Theme Default (no override)', value: '' },
    ...PRESET_FONTS.map(f => ({ label: f.name, value: f.value })),
  ];

  return (
    <div className="space-y-4">
      <div className="bg-blue-500/5 border border-blue-500/20 rounded p-3 text-[11px] text-white/60 leading-relaxed">
        Set site-wide defaults for each element type. These apply <b>everywhere</b> on the site
        unless an element has its own override. Persists across theme switches.
      </div>

      <button
        type="button"
        onClick={resetAll}
        className="w-full px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 rounded text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
      >
        <i className="fa-solid fa-rotate-left"></i> Reset All Globals
      </button>

      {/* ── HEADINGS — per-level + dark/light colors ────────────────── */}
      {(() => {
        const headings = v.headings || {};
        const patchHeading = (level: 'all' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6', patch: Partial<HeadingLevelStyle>) => {
          onChange({
            ...v,
            headings: {
              ...headings,
              [level]: { ...((headings as any)[level] || {}), ...patch },
            },
          });
        };
        const levels: Array<{ key: 'all' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'; title: string; sub: string; defaultOpen?: boolean; hideSize?: boolean }> = [
          { key: 'all', title: 'All Headings (defaults)', sub: 'Applies to every heading unless a specific level overrides it.', defaultOpen: true, hideSize: true },
          { key: 'h1',  title: 'H1',                       sub: 'Largest heading — usually one per page (hero title).' },
          { key: 'h2',  title: 'H2',                       sub: 'Section titles.' },
          { key: 'h3',  title: 'H3',                       sub: 'Sub-section / card titles.' },
          { key: 'h4',  title: 'H4',                       sub: 'Smaller card / list-group titles.' },
          { key: 'h5',  title: 'H5',                       sub: 'Detail-level headings.' },
          { key: 'h6',  title: 'H6',                       sub: 'Smallest heading.' },
        ];
        return (
          <AccordionGroup title="Headings (h1 – h6)" defaultOpen={true}>
            <div className="space-y-2">
              <p className="text-[10px] text-white/40 leading-relaxed">
                Each level (h1–h6) is configurable independently with separate color slots for <b>dark</b> and <b>light</b> sections. Set <b>All Headings</b> first for shared defaults, then tweak per-level as needed.
              </p>
              {levels.map(lvl => (
                <details key={lvl.key} className="bg-[#0E0E0E] border border-[#222] rounded group/lvl open:bg-[#121212]" open={lvl.defaultOpen}>
                  <summary className="flex items-center justify-between px-3 py-2.5 cursor-pointer list-none select-none">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <i className="fa-solid fa-chevron-right text-[9px] text-white/40 transition-transform group-open/lvl:rotate-90" />
                      <span className="text-[11px] font-bold text-white/80 uppercase tracking-widest">{lvl.title}</span>
                    </div>
                  </summary>
                  <div className="px-3 pb-3 pt-1 border-t border-white/5">
                    <p className="text-[10px] text-white/40 italic mb-2.5">{lvl.sub}</p>
                    <HeadingLevelEditor
                      value={(headings as any)[lvl.key] || {}}
                      onPatch={(patch) => patchHeading(lvl.key, patch)}
                      hideSize={lvl.hideSize}
                    />
                  </div>
                </details>
              ))}
            </div>
          </AccordionGroup>
        );
      })()}

      {/* ── BODY TEXT ───────────────────────────────────────────────── */}
      <AccordionGroup title="Body Text" defaultOpen={false}>
        <div className="space-y-3">
          <ColorInput
            label="Color (Dark Sections)"
            value={v.text?.color || ''}
            onChange={(c) => updateGroup('text', { color: c })}
            onReset={() => updateGroup('text', { color: '' })}
          />
          <ColorInput
            label="Color (Light Sections)"
            value={v.text?.colorLight || ''}
            onChange={(c) => updateGroup('text', { colorLight: c })}
            onReset={() => updateGroup('text', { colorLight: '' })}
          />
          <SelectInput
            label="Font Family"
            value={v.text?.fontFamily || ''}
            options={fontOptions}
            onChange={(val: string) => updateGroup('text', { fontFamily: val })}
          />
          <FontSizeInput
            label="Font Size"
            value={v.text?.fontSize || ''}
            onChange={(val) => updateGroup('text', { fontSize: val })}
            placeholder="1rem"
          />
          <NumericUnitInput
            label="Line Height"
            value={v.text?.lineHeight || ''}
            onChange={(val) => updateGroup('text', { lineHeight: val })}
            placeholder="1.6"
            units={['', 'px', 'rem', '%']}
            step={0.05}
            min={1}
            max={3}
          />
        </div>
      </AccordionGroup>

      {/* ── BUTTONS ─────────────────────────────────────────────────── */}
      <AccordionGroup title="Buttons" defaultOpen={false}>
        <div className="space-y-3">
          <ColorInput
            label="Background"
            value={v.button?.backgroundColor || ''}
            onChange={(c) => updateGroup('button', { backgroundColor: c })}
            onReset={() => updateGroup('button', { backgroundColor: '' })}
          />
          <ColorInput
            label="Text Color"
            value={v.button?.color || ''}
            onChange={(c) => updateGroup('button', { color: c })}
            onReset={() => updateGroup('button', { color: '' })}
          />
          <ColorInput
            label="Hover Background"
            value={v.button?.hoverBackgroundColor || ''}
            onChange={(c) => updateGroup('button', { hoverBackgroundColor: c })}
            onReset={() => updateGroup('button', { hoverBackgroundColor: '' })}
          />
          <ColorInput
            label="Hover Text"
            value={v.button?.hoverColor || ''}
            onChange={(c) => updateGroup('button', { hoverColor: c })}
            onReset={() => updateGroup('button', { hoverColor: '' })}
          />
          <NumericUnitInput
            label="Border Radius"
            value={v.button?.borderRadius || ''}
            onChange={(val) => updateGroup('button', { borderRadius: val })}
            placeholder="0.5rem"
            units={['rem', 'px', '%']}
            step={0.125}
            min={0}
            max={4}
          />
          <NumericUnitInput
            label="Padding"
            value={v.button?.padding || ''}
            onChange={(val) => updateGroup('button', { padding: val })}
            placeholder="0.625rem 1.25rem"
            units={['rem', 'px', 'em']}
            step={0.125}
            min={0}
            max={3}
          />
          <SelectInput
            label="Font Weight"
            value={v.button?.fontWeight || ''}
            options={[
              { label: 'Theme Default', value: '' },
              { label: 'Medium (500)',   value: '500' },
              { label: 'Semibold (600)', value: '600' },
              { label: 'Bold (700)',     value: '700' },
            ]}
            onChange={(val) => updateGroup('button', { fontWeight: val })}
          />
        </div>
      </AccordionGroup>

      {/* ── LINKS ───────────────────────────────────────────────────── */}
      <AccordionGroup title="Links" defaultOpen={false}>
        <div className="space-y-3">
          <ColorInput
            label="Link Color"
            value={v.link?.color || ''}
            onChange={(c) => updateGroup('link', { color: c })}
            onReset={() => updateGroup('link', { color: '' })}
          />
          <ColorInput
            label="Hover Color"
            value={v.link?.hoverColor || ''}
            onChange={(c) => updateGroup('link', { hoverColor: c })}
            onReset={() => updateGroup('link', { hoverColor: '' })}
          />
          <SelectInput
            label="Underline"
            value={v.link?.underline || ''}
            options={[
              { label: 'Theme Default', value: '' },
              { label: 'Always',  value: 'always' },
              { label: 'On Hover', value: 'hover' },
              { label: 'Never',    value: 'none' },
            ]}
            onChange={(val) => updateGroup('link', { underline: val as any })}
          />
        </div>
      </AccordionGroup>

      {/* ── ICONS ───────────────────────────────────────────────────── */}
      <AccordionGroup title="Icons" defaultOpen={false}>
        <div className="space-y-3">
          <ColorInput
            label="Color"
            value={v.icon?.color || ''}
            onChange={(c) => updateGroup('icon', { color: c })}
            onReset={() => updateGroup('icon', { color: '' })}
          />
          <ColorInput
            label="Background (chip)"
            value={v.icon?.backgroundColor || ''}
            onChange={(c) => updateGroup('icon', { backgroundColor: c })}
            onReset={() => updateGroup('icon', { backgroundColor: '' })}
          />
          <NumericUnitInput
            label="Size"
            value={v.icon?.size || ''}
            onChange={(val) => updateGroup('icon', { size: val })}
            placeholder="1.25rem"
            units={['rem', 'px', 'em']}
            step={0.0625}
            min={0.5}
            max={4}
          />
        </div>
      </AccordionGroup>

      {/* ── LISTS ───────────────────────────────────────────────────── */}
      <AccordionGroup title="Lists" defaultOpen={false}>
        <div className="space-y-3">
          <ColorInput
            label="Text Color"
            value={v.list?.color || ''}
            onChange={(c) => updateGroup('list', { color: c })}
            onReset={() => updateGroup('list', { color: '' })}
          />
          <ColorInput
            label="Marker Color"
            value={v.list?.markerColor || ''}
            onChange={(c) => updateGroup('list', { markerColor: c })}
            onReset={() => updateGroup('list', { markerColor: '' })}
          />
          <NumericUnitInput
            label="Item Gap"
            value={v.list?.itemGap || ''}
            onChange={(val) => updateGroup('list', { itemGap: val })}
            placeholder="0.5rem"
            units={['rem', 'px', 'em']}
            step={0.125}
            min={0}
            max={4}
          />
        </div>
      </AccordionGroup>

      {/* ── BADGES ──────────────────────────────────────────────────── */}
      <AccordionGroup title="Badges" defaultOpen={false}>
        <div className="space-y-3">
          <ColorInput
            label="Background"
            value={v.badge?.backgroundColor || ''}
            onChange={(c) => updateGroup('badge', { backgroundColor: c })}
            onReset={() => updateGroup('badge', { backgroundColor: '' })}
          />
          <ColorInput
            label="Text Color"
            value={v.badge?.color || ''}
            onChange={(c) => updateGroup('badge', { color: c })}
            onReset={() => updateGroup('badge', { color: '' })}
          />
          <NumericUnitInput
            label="Border Radius"
            value={v.badge?.borderRadius || ''}
            onChange={(val) => updateGroup('badge', { borderRadius: val })}
            placeholder="9999px"
            units={['rem', 'px', '%']}
            step={1}
            min={0}
            max={48}
          />
        </div>
      </AccordionGroup>
    </div>
  );
};
