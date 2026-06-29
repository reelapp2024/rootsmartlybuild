import React, { useState, useEffect } from 'react';

interface FontSizeInputProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}

export const FontSizeInput: React.FC<FontSizeInputProps> = ({ label, value, onChange, placeholder }) => {
  const parseValue = (val: string) => {
    const match = val.match(/^([\d.]+)(px|rem|em)$/);
    if (match) {
      return { num: parseFloat(match[1]), unit: match[2] };
    }
    return { num: 0, unit: 'rem' };
  };

  const currentValue = value || placeholder || '1rem';
  const parsed = parseValue(currentValue);
  const [selectedUnit, setSelectedUnit] = useState<'px' | 'rem' | 'em'>(parsed.unit as 'px' | 'rem' | 'em' || 'rem');
  const [displayNum, setDisplayNum] = useState<string>(parsed.num.toString());

  useEffect(() => {
    const p = parseValue(value || placeholder || '1rem');
    setDisplayNum(p.num.toString());
    setSelectedUnit(p.unit as 'px' | 'rem' | 'em' || 'rem');
  }, [value, placeholder]);

  const handleIncrement = () => {
    const step = selectedUnit === 'px' ? 1 : 0.125;
    const currentNum = parseFloat(displayNum) || 0;
    const newNum = currentNum + step;
    const newValue = `${newNum}${selectedUnit}`;
    setDisplayNum(newNum.toString());
    onChange(newValue);
  };

  const handleDecrement = () => {
    const step = selectedUnit === 'px' ? 1 : 0.125;
    const currentNum = parseFloat(displayNum) || 0;
    const newNum = Math.max(0.125, currentNum - step);
    const newValue = `${newNum}${selectedUnit}`;
    setDisplayNum(newNum.toString());
    onChange(newValue);
  };

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputVal = e.target.value;
    setDisplayNum(inputVal);

    if (/^\d+\.?\d*$/.test(inputVal)) {
      onChange(`${inputVal}${selectedUnit}`);
    } else if (/^\d+\.?\d*(px|rem|em)$/.test(inputVal)) {
      onChange(inputVal);
      const match = inputVal.match(/(px|rem|em)$/);
      if (match) setSelectedUnit(match[1] as 'px' | 'rem' | 'em');
    } else {
      onChange(inputVal);
    }
  };

  const handleUnitChange = (newUnit: 'px' | 'rem' | 'em') => {
    setSelectedUnit(newUnit);
    const currentNum = parseFloat(displayNum) || 0;
    onChange(`${currentNum}${newUnit}`);
  };

  return (
    <div className="flex flex-col gap-1.5 min-w-0">
      {label && <label className="text-[10px] font-bold text-white/40 capitalize ml-1">{label}</label>}
      <div className="flex gap-1 items-stretch min-w-0">
        <button
          type="button"
          onClick={handleDecrement}
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
            placeholder={parsed.num.toString()}
          />
          <select
            value={selectedUnit}
            onChange={(e) => handleUnitChange(e.target.value as 'px' | 'rem' | 'em')}
            className="flex-shrink-0 bg-[#222] border-l border-[#333] px-1 py-1 text-white text-[9px] focus:outline-none cursor-pointer appearance-none"
            style={{ paddingRight: '1px' }}
          >
            <option value="px">px</option>
            <option value="rem">rem</option>
            <option value="em">em</option>
          </select>
        </div>
        <button
          type="button"
          onClick={handleIncrement}
          className="flex-shrink-0 w-6 flex items-center justify-center bg-[#222] border border-[#333] rounded hover:bg-[#333] transition-colors text-white text-xs font-bold"
          aria-label="Increase"
        >
          +
        </button>
      </div>
    </div>
  );
};
