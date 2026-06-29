import React, { useState, useEffect } from 'react';

interface SpacingInputGroupProps {
  label: string;
  values: { top?: string; right?: string; bottom?: string; left?: string };
  onChange: (newValues: { top?: string; right?: string; bottom?: string; left?: string }) => void;
  /** Small leading icon to visually distinguish padding vs margin (optional) */
  icon?: string;
}

/**
 * Compact single-line spacing input.
 * Default view: [icon] [LABEL] [linked value] [unit] [↔ expand toggle]
 * Expanded: shows 4-side grid below the line for granular per-side control.
 * Stays collapsed whenever all 4 sides are equal; auto-expands if they aren't.
 */
export const SpacingInputGroup: React.FC<SpacingInputGroupProps> = ({ label, values, onChange, icon }) => {
  const extractNum = (v?: string): string => {
    if (!v) return '0';
    const m = String(v).trim().match(/^(-?\d+(\.\d+)?)/);
    return m ? m[1] : '0';
  };

  const extractUnit = (v?: string): string | null => {
    if (!v) return null;
    const trimmed = String(v).trim();
    const m = trimmed.match(/(px|pt|mm|rem|em)$/i);
    if (m) return m[1].toLowerCase();
    const m2 = trimmed.match(/^[a-z]+-\d+(\.\d+)?$/i);
    return m2 ? 'px' : null;
  };

  const inferUnit = (): string => {
    const candidate =
      extractUnit(values.top) ||
      extractUnit(values.right) ||
      extractUnit(values.bottom) ||
      extractUnit(values.left);
    return candidate || 'px';
  };

  const [unit, setUnit] = useState<string>(inferUnit);
  const [allValue, setAllValue] = useState<string>('');
  const [expanded, setExpanded] = useState<boolean>(false);

  useEffect(() => {
    const nextUnit = inferUnit();
    setUnit(nextUnit);
    const nums = [extractNum(values.top), extractNum(values.right), extractNum(values.bottom), extractNum(values.left)];
    const allSame = nums.every((n) => n === nums[0]);
    setAllValue(allSame ? nums[0] : '');
    if (!allSame) setExpanded(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values.top, values.right, values.bottom, values.left]);

  const toCssValue = (rawNum: string): string => {
    if (rawNum === '' || rawNum === '-' || rawNum === '.' || isNaN(Number(rawNum))) return '0px';
    return `${rawNum}${unit}`;
  };

  const updateAll = (val: string) => {
    setAllValue(val);
    const next = toCssValue(val);
    onChange({ top: next, right: next, bottom: next, left: next });
  };

  const updateSide = (side: keyof typeof values, val: string) => {
    onChange({ ...values, [side]: toCssValue(val) });
  };

  const stepSide = (side: keyof typeof values, dir: 1 | -1, big: boolean) => {
    const cur = parseFloat(extractNum(values[side])) || 0;
    const next = Math.max(0, cur + dir * (big ? 10 : 1));
    onChange({ ...values, [side]: `${next}${unit}` });
  };

  const stepAll = (dir: 1 | -1, big: boolean) => {
    const cur = parseFloat(allValue) || 0;
    const next = Math.max(0, cur + dir * (big ? 10 : 1));
    const val = String(next);
    setAllValue(val);
    const css = `${next}${unit}`;
    onChange({ top: css, right: css, bottom: css, left: css });
  };

  const display = {
    top: extractNum(values.top),
    right: extractNum(values.right),
    bottom: extractNum(values.bottom),
    left: extractNum(values.left),
  };

  const sideInput = (side: 'top' | 'right' | 'bottom' | 'left', tip: string) => (
    <div className="flex flex-col items-center gap-1">
      <label className="text-[9px] font-bold text-white/40 uppercase tracking-wider">{tip}</label>
      <input
        type="text"
        className="w-full bg-[#151515] border border-[#333] rounded p-1.5 text-white text-[11px] focus:border-blue-500 focus:outline-none transition-colors text-center"
        value={display[side]}
        onChange={(e) => updateSide(side, e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowUp') { e.preventDefault(); stepSide(side, 1, e.shiftKey); }
          if (e.key === 'ArrowDown') { e.preventDefault(); stepSide(side, -1, e.shiftKey); }
        }}
        onBlur={(e) => updateSide(side, e.target.value)}
        placeholder="0"
      />
    </div>
  );

  const perSideLinked = allValue !== '';
  const mixedPlaceholder = !perSideLinked ? 'mixed' : '0';

  return (
    <div className="flex flex-col gap-2">
      {/* Single-line summary row */}
      <div className="flex items-center gap-2">
        {icon && (
          <i className={`${icon} text-white/30 text-[11px] w-3 text-center flex-shrink-0`} aria-hidden />
        )}
        <label className="text-[10px] font-bold text-white/60 uppercase tracking-widest flex-shrink-0 w-[58px]">
          {label}
        </label>
        <input
          className="flex-1 min-w-0 bg-[#151515] border border-[#333] rounded p-1.5 text-white text-xs focus:border-blue-500 focus:outline-none text-center"
          placeholder={mixedPlaceholder}
          value={allValue}
          onChange={(e) => updateAll(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowUp') { e.preventDefault(); stepAll(1, e.shiftKey); }
            if (e.key === 'ArrowDown') { e.preventDefault(); stepAll(-1, e.shiftKey); }
          }}
          onBlur={(e) => updateAll(e.target.value)}
          title={perSideLinked ? 'Applies to all 4 sides' : 'Sides differ — expand below to edit individually'}
        />
        <select
          value={unit}
          onChange={(e) => {
            const nextUnit = e.target.value;
            setUnit(nextUnit);
            onChange({
              top: `${display.top}${nextUnit}`,
              right: `${display.right}${nextUnit}`,
              bottom: `${display.bottom}${nextUnit}`,
              left: `${display.left}${nextUnit}`,
            });
          }}
          className="bg-[#151515] border border-[#333] rounded px-1.5 py-1.5 text-white text-[10px] focus:outline-none cursor-pointer flex-shrink-0"
          aria-label={`${label} unit`}
        >
          <option value="px">px</option>
          <option value="pt">pt</option>
          <option value="mm">mm</option>
          <option value="rem">rem</option>
          <option value="em">em</option>
        </select>
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); setExpanded(v => !v); }}
          className={`flex-shrink-0 w-7 h-7 rounded border text-[10px] transition-all ${
            expanded
              ? 'bg-blue-500/20 border-blue-500 text-blue-400'
              : 'bg-[#151515] border-[#333] text-white/40 hover:border-[#444] hover:text-white/70'
          }`}
          title={expanded ? 'Collapse per-side editor' : 'Edit each side individually'}
          aria-label={expanded ? 'Collapse' : 'Expand per-side'}
          aria-expanded={expanded}
        >
          <i className={`fa-solid ${expanded ? 'fa-chevron-up' : 'fa-sliders'}`} />
        </button>
      </div>

      {/* Expanded per-side editor — only shown when user opts in or sides differ */}
      {expanded && (
        <div className="grid grid-cols-4 gap-1.5 pl-1">
          {sideInput('top', 'T')}
          {sideInput('right', 'R')}
          {sideInput('bottom', 'B')}
          {sideInput('left', 'L')}
        </div>
      )}
    </div>
  );
};
