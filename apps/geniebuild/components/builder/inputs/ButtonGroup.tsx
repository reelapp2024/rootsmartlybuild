import React from 'react';

interface ButtonGroupOption {
  icon: string;
  value: string;
  label: string;
}

interface ButtonGroupProps {
  options: ButtonGroupOption[];
  value: string | undefined;
  onChange: (val: string) => void;
}

export const ButtonGroup: React.FC<ButtonGroupProps> = ({ options, value, onChange }) => {
  const currentValue = value || 'left';
  return (
    <div className="flex bg-[#151515] p-1 rounded border border-[#333]">
      {options.map(opt => (
        <button
          key={opt.value}
          className={`flex-1 py-1.5 rounded text-xs transition-all ${currentValue === opt.value ? 'bg-[#333] text-white shadow-sm' : 'text-white/40 hover:text-white'}`}
          onClick={() => onChange(opt.value)}
          title={opt.label}
        >
          <i className={`fa-solid ${opt.icon}`}></i>
        </button>
      ))}
    </div>
  );
};
