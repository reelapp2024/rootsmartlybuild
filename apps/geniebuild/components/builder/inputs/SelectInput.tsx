import React, { useId } from 'react';

interface SelectInputProps {
  label?: string;
  value: string | undefined;
  options: Array<string | { label: string; value: string }>;
  onChange: (val: string) => void;
  className?: string;
}

export const SelectInput: React.FC<SelectInputProps> = ({ label, value, options, onChange, className = '' }) => {
  const isFontSelect = label?.toLowerCase().includes('font');
  const selectId = useId();

  return (
    <div className={`flex flex-col space-y-2 ${className}`}>
      {label && <label htmlFor={selectId} className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</label>}
      <select
        id={selectId}
        aria-label={label}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none"
        style={isFontSelect && value ? { fontFamily: value } : {}}
      >
        {options.map((opt, i) => {
          const isObj = typeof opt === 'object' && opt !== null;
          const optValue: string = isObj ? (opt as { label: string; value: string }).value : (opt as string);
          const optLabel: string = isObj ? (opt as { label: string; value: string }).label : (opt as string);

          return (
            <option
              key={isObj ? `${optValue}-${i}` : String(opt)}
              value={optValue}
              className="bg-[#151515] text-white"
              style={isFontSelect && optValue ? { fontFamily: optValue } : {}}
            >
              {optLabel}
            </option>
          );
        })}
      </select>
    </div>
  );
};
