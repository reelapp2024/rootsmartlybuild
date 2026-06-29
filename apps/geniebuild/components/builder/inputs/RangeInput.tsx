import React, { useId } from 'react';

interface RangeInputProps {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (val: number) => void;
  unit?: string;
}

export const RangeInput: React.FC<RangeInputProps> = ({ label, value, min = 0, max = 100, step = 1, onChange, unit = '' }) => {
  const inputId = useId();
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between items-center ml-1">
        <label htmlFor={inputId} className="text-[10px] font-bold text-white/40 capitalize">{label}</label>
        <span className="text-[10px] text-white/60 font-mono" aria-hidden="true">{value}{unit}</span>
      </div>
      <input
        id={inputId}
        type="range" min={min} max={max} step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={`${value}${unit}`}
        className="w-full h-1.5 bg-[#333] rounded-lg appearance-none cursor-pointer accent-blue-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      />
    </div>
  );
};
