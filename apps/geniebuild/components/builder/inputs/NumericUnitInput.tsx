import React, { useState, useEffect } from 'react';

interface NumericUnitInputProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  /** Allowed units. First entry is the default for new values. Use `''` (empty string) for unitless. */
  units: string[];
  /** Step for +/- buttons and arrow keys. Defaults to 1 for px-like, 0.05 for unitless / em. */
  step?: number;
  /** Optional min/max clamp on the numeric value. */
  min?: number;
  max?: number;
}

/**
 * Generic numeric+unit input — used for line-height, letter-spacing, paragraph-spacing,
 * and anywhere a CSS value is "<number><unit>" with multiple unit choices.
 *
 * Keyboard:
 *  • Type a number → unit auto-appended
 *  • ArrowUp/Down → step ±1 (Shift = ±10× step)
 *  • Unit dropdown changes unit only, keeps number
 *  • +/- buttons step the value
 *  • Pasting "1.5em" or "1.5" both work
 */
export const NumericUnitInput: React.FC<NumericUnitInputProps> = ({
  label, value, onChange, placeholder, units, step, min, max,
}) => {
  const defaultUnit = units[0] ?? '';

  const parseValue = (val: string): { num: number; unit: string } => {
    if (!val) return { num: 0, unit: defaultUnit };
    const trimmed = val.trim();
    // Match number then optional unit (any of the allowed units, or %)
    const match = trimmed.match(/^(-?[\d.]+)\s*(px|rem|em|%|vw|vh)?$/i);
    if (!match) return { num: 0, unit: defaultUnit };
    const num = parseFloat(match[1]);
    const unit = (match[2] || defaultUnit).toLowerCase();
    return { num: Number.isFinite(num) ? num : 0, unit };
  };

  const initial = parseValue(value || placeholder || '');
  const [selectedUnit, setSelectedUnit] = useState<string>(
    units.includes(initial.unit) ? initial.unit : defaultUnit,
  );
  const [displayNum, setDisplayNum] = useState<string>(
    initial.num === 0 && !value ? '' : initial.num.toString(),
  );

  useEffect(() => {
    const p = parseValue(value || '');
    if (units.includes(p.unit)) setSelectedUnit(p.unit);
    setDisplayNum(p.num === 0 && !value ? '' : p.num.toString());
  }, [value]);  // eslint-disable-line react-hooks/exhaustive-deps

  const effStep = step ?? (selectedUnit === '' || selectedUnit === 'em' || selectedUnit === 'rem' ? 0.05 : 1);

  const clamp = (n: number) => {
    let v = n;
    if (typeof min === 'number') v = Math.max(min, v);
    if (typeof max === 'number') v = Math.min(max, v);
    return v;
  };

  const emit = (num: number, unit: string) => {
    const formatted = Number.isInteger(num) ? num.toString() : num.toFixed(3).replace(/\.?0+$/, '');
    setDisplayNum(formatted);
    onChange(unit ? `${formatted}${unit}` : formatted);
  };

  const handleStep = (dir: 1 | -1, big = false) => {
    const cur = parseFloat(displayNum) || 0;
    const factor = big ? 10 : 1;
    const next = clamp(parseFloat((cur + dir * effStep * factor).toFixed(3)));
    emit(next, selectedUnit);
  };

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setDisplayNum(raw);
    // Try to parse and emit
    const parsed = parseValue(raw);
    if (raw === '') {
      onChange('');
      return;
    }
    if (Number.isFinite(parsed.num)) {
      // If user typed a unit too, switch to that unit
      if (parsed.unit !== selectedUnit && units.includes(parsed.unit)) setSelectedUnit(parsed.unit);
      const finalUnit = units.includes(parsed.unit) ? parsed.unit : selectedUnit;
      onChange(finalUnit ? `${parsed.num}${finalUnit}` : `${parsed.num}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      handleStep(1, e.shiftKey);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      handleStep(-1, e.shiftKey);
    }
  };

  const handleUnitChange = (newUnit: string) => {
    setSelectedUnit(newUnit);
    const cur = parseFloat(displayNum) || 0;
    onChange(newUnit ? `${cur}${newUnit}` : `${cur}`);
  };

  return (
    <div className="flex flex-col gap-1.5 min-w-0">
      {label && <label className="text-[10px] font-bold text-white/40 capitalize ml-1">{label}</label>}
      <div className="flex gap-1 items-stretch min-w-0">
        <button
          type="button"
          onClick={() => handleStep(-1)}
          className="flex-shrink-0 w-6 flex items-center justify-center bg-[#222] border border-[#333] rounded hover:bg-[#333] transition-colors text-white text-xs font-bold"
          aria-label="Decrease"
        >
          −
        </button>
        <div className="flex-1 min-w-0 flex items-stretch bg-[#151515] border border-[#333] rounded overflow-hidden">
          <input
            type="text"
            inputMode="decimal"
            className="flex-1 min-w-0 w-full bg-transparent border-none text-white text-xs focus:outline-none text-center font-mono py-1 px-0.5"
            value={displayNum}
            onChange={handleValueChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
          />
          {units.length > 1 && (
            <select
              value={selectedUnit}
              onChange={(e) => handleUnitChange(e.target.value)}
              className="flex-shrink-0 bg-[#222] border-l border-[#333] px-1 py-1 text-white text-[9px] focus:outline-none cursor-pointer appearance-none"
              style={{ paddingRight: '1px' }}
            >
              {units.map(u => (
                <option key={u || 'unitless'} value={u}>{u || '—'}</option>
              ))}
            </select>
          )}
          {units.length === 1 && units[0] && (
            <span className="flex-shrink-0 text-[9px] text-white/40 px-1.5 py-1 self-center">{units[0]}</span>
          )}
        </div>
        <button
          type="button"
          onClick={() => handleStep(1)}
          className="flex-shrink-0 w-6 flex items-center justify-center bg-[#222] border border-[#333] rounded hover:bg-[#333] transition-colors text-white text-xs font-bold"
          aria-label="Increase"
        >
          +
        </button>
      </div>
    </div>
  );
};
