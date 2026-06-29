import React, { useId, useState } from 'react';

interface AccordionGroupProps {
  title: string;
  children?: React.ReactNode;
  defaultOpen?: boolean;
}

export const AccordionGroup: React.FC<AccordionGroupProps> = ({ title, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const panelId = useId();
  return (
    <div className="border-b border-white/5 last:border-0">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-controls={panelId}
        className="flex items-center justify-between w-full py-3 px-1 text-[10px] font-bold uppercase tracking-widest text-white/50 hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:rounded"
      >
        <span>{title}</span>
        <i className={`fa-solid fa-chevron-down transition-transform ${isOpen ? 'rotate-180' : ''}`} aria-hidden="true"></i>
      </button>
      {isOpen && (
        <div
          id={panelId}
          role="region"
          aria-label={title}
          className="pt-2 pb-5 px-1 space-y-4 animate-in slide-in-from-top-2 duration-200"
        >
          {children}
        </div>
      )}
    </div>
  );
};
