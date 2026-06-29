import React, { useState } from 'react';
import { FontSizeInput } from './FontSizeInput';
import { NumericUnitInput } from './NumericUnitInput';

interface ResponsiveFontSizeInputProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}

/**
 * Font size input that supports BOTH a simple value (e.g. `1rem`, `40px`)
 * AND a responsive `clamp()` expression — without ever showing the raw clamp
 * string to the user.
 *
 * UX:
 *  • "Simple" mode (default) → single FontSizeInput (px / rem / em + keyboard).
 *  • "Responsive" toggle → 3 inputs (Min / Preferred / Max). We assemble these
 *    into a `clamp(min, preferred, max)` string on every change.
 *
 *  Detects clamp on first render: if the saved value is a clamp(), we open
 *  responsive mode and pre-fill the 3 inputs by parsing it. If it's a simple
 *  value we stay in simple mode.
 */

const parseClamp = (val: string): { min: string; preferred: string; max: string } | null => {
  const m = val.match(/^\s*clamp\(\s*([^,]+)\s*,\s*([^,]+)\s*,\s*([^)]+)\s*\)\s*$/i);
  if (!m) return null;
  return { min: m[1].trim(), preferred: m[2].trim(), max: m[3].trim() };
};

export const ResponsiveFontSizeInput: React.FC<ResponsiveFontSizeInputProps> = ({
  label, value, onChange, placeholder,
}) => {
  const initialClamp = parseClamp(value || '');
  const [responsive, setResponsive] = useState<boolean>(!!initialClamp);

  // Keep local state for the 3 clamp parts — flush as combined clamp() on every change.
  const [minVal, setMinVal] = useState<string>(initialClamp?.min || '1rem');
  const [prefVal, setPrefVal] = useState<string>(initialClamp?.preferred || '3vw');
  const [maxVal, setMaxVal] = useState<string>(initialClamp?.max || '2rem');

  const updateClamp = (next: { min?: string; preferred?: string; max?: string }) => {
    const newMin  = next.min       ?? minVal;
    const newPref = next.preferred ?? prefVal;
    const newMax  = next.max       ?? maxVal;
    if (next.min       !== undefined) setMinVal(newMin);
    if (next.preferred !== undefined) setPrefVal(newPref);
    if (next.max       !== undefined) setMaxVal(newMax);
    onChange(`clamp(${newMin}, ${newPref}, ${newMax})`);
  };

  const toggleMode = () => {
    if (responsive) {
      // Switching responsive → simple: keep the *preferred* fallback as the simple value.
      // If preferred is a vw value (no px equivalent), fall back to min.
      const next = /[\d.]+(px|rem|em)$/i.test(prefVal) ? prefVal : minVal;
      onChange(next);
      setResponsive(false);
    } else {
      // Simple → responsive: seed clamp using current value as the preferred middle.
      const seed = value || placeholder || '1rem';
      setMinVal(seed);
      setPrefVal(seed);
      setMaxVal(seed);
      onChange(`clamp(${seed}, ${seed}, ${seed})`);
      setResponsive(true);
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-bold text-white/40 capitalize ml-1">{label}</label>
        <button
          type="button"
          onClick={toggleMode}
          className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border transition-all ${
            responsive
              ? 'bg-blue-500/20 border-blue-500 text-blue-400'
              : 'bg-[#151515] border-[#333] text-white/50 hover:border-[#444]'
          }`}
          title={responsive ? 'Disable responsive scaling' : 'Enable responsive scaling (min / preferred / max)'}
        >
          <i className="fa-solid fa-mobile-screen mr-1 text-[8px]" />
          Responsive
        </button>
      </div>

      {!responsive ? (
        <FontSizeInput
          label=""
          value={value || ''}
          onChange={onChange}
          placeholder={placeholder}
        />
      ) : (
        <div className="space-y-2 p-1.5 rounded border border-[#333] bg-[#0F0F0F] min-w-0">
          <p className="text-[9px] text-white/30 leading-snug px-0.5">
            Text auto-scales between <b>Min</b> (small screens) and <b>Max</b> (large screens).
            <b>Scale</b> controls how fast it grows — <code>vw</code> = % of screen width.
          </p>
          <div className="flex flex-col gap-2.5 min-w-0">
            <div className="min-w-0">
              <span className="text-[9px] font-bold text-white/40 uppercase block mb-1 ml-0.5">Min (smallest)</span>
              <FontSizeInput label="" value={minVal} onChange={(v) => updateClamp({ min: v })} placeholder="1rem" />
            </div>
            <div className="min-w-0">
              <span className="text-[9px] font-bold text-white/40 uppercase block mb-1 ml-0.5">Scale (fluid)</span>
              <NumericUnitInput
                label=""
                value={prefVal}
                onChange={(v) => updateClamp({ preferred: v })}
                placeholder="3vw"
                units={['vw', 'vh', 'px', 'rem']}
                step={0.5}
                min={0}
                max={20}
              />
            </div>
            <div className="min-w-0">
              <span className="text-[9px] font-bold text-white/40 uppercase block mb-1 ml-0.5">Max (largest)</span>
              <FontSizeInput label="" value={maxVal} onChange={(v) => updateClamp({ max: v })} placeholder="3rem" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
