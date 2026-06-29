import React, { useId } from 'react';

interface ColorInputProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  onReset?: () => void;
}

export const ColorInput: React.FC<ColorInputProps> = ({ label, value, onChange, onReset }) => {
  const pickerValue = value && value.startsWith('#') && (value.length === 4 || value.length === 7) ? value : '#000000';
  const swatchId = useId();
  const textId = useId();
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={textId} className="text-[10px] font-bold text-white/40 capitalize ml-1">{label}</label>
      <div className="flex gap-2 items-center bg-[#151515] p-1 rounded border border-[#333] hover:border-[#444] focus-within:border-blue-500 transition-colors">
        <div className="relative w-5 h-5 rounded overflow-hidden flex-shrink-0 shadow-sm">
          <input
            id={swatchId}
            type="color"
            aria-label={`${label} color picker`}
            className="absolute inset-[-4px] w-[150%] h-[150%] p-0 border-none cursor-pointer"
            value={pickerValue}
            onChange={(e) => onChange(e.target.value)}
          />
        </div>
        <input
          id={textId}
          type="text"
          aria-label={`${label} hex value`}
          className="bg-transparent border-none text-white text-[10px] focus:outline-none flex-1 uppercase w-full font-mono"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="NONE"
        />
        {onReset && (
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onReset(); }}
            title="Reset to default"
            aria-label={`Reset ${label} to default`}
            className="w-5 h-5 flex items-center justify-center rounded hover:bg-white/10 text-white/40 hover:text-white/80 flex-shrink-0 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <i className="fa-solid fa-rotate-left text-[9px]" aria-hidden="true"></i>
          </button>
        )}
      </div>
    </div>
  );
};
