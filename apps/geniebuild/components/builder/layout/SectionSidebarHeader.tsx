import React from 'react';
import type { Section, WebsiteElement } from '../../../types';
import { getDefaultVariant, getVariantsForSection } from '../../SectionsAndVariantRegistry';
import { formatVariantName } from '../state/variantNameFormatter';

type EditTab = 'content' | 'design' | 'advanced';

interface Props {
  selectedSection: Section;
  selectedElement: WebsiteElement | null;
  selectedElementId: string | null;
  editTab: EditTab;
  onEditTabChange: (tab: EditTab) => void;
  onBack: () => void;
  onClearElementSelection: () => void;
  onRefreshVariant: () => void;
}

export const SectionSidebarHeader: React.FC<Props> = ({
  selectedSection,
  selectedElement,
  selectedElementId,
  editTab,
  onEditTabChange,
  onBack,
  onClearElementSelection,
  onRefreshVariant,
}) => {
  const variant = selectedSection?.styles?.variant || (selectedSection?.type ? getDefaultVariant(selectedSection.type) : null);
  const formattedVariant = formatVariantName(variant || undefined, selectedSection?.type);
  const availableVariants = selectedSection?.type ? getVariantsForSection(selectedSection.type) : [];
  const hasMultipleVariants = availableVariants.length > 1;

  return (
    <div className="p-4 border-b border-white/10">
      <div className="flex items-center gap-2 mb-3">
        <button
          type="button"
          onClick={onBack}
          aria-label={selectedElementId ? 'Back to section' : 'Back to section list'}
          className="w-5 h-5 flex items-center justify-center rounded hover:bg-white/10 text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <i className="fa-solid fa-arrow-left text-[10px]" aria-hidden="true"></i>
        </button>
        <div className="flex items-center text-xs font-bold capitalize truncate flex-1">
          <span
            className={selectedElementId ? 'text-slate-500 cursor-pointer hover:text-white transition-colors' : 'text-white'}
            onClick={selectedElementId ? onClearElementSelection : undefined}
            role={selectedElementId ? 'button' : undefined}
            tabIndex={selectedElementId ? 0 : undefined}
            onKeyDown={selectedElementId ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClearElementSelection(); } } : undefined}
          >
            {selectedSection?.type}
          </span>
          {formattedVariant && !selectedElementId && (
            <>
              <i className="fa-solid fa-chevron-right text-[8px] mx-1.5 text-slate-600" aria-hidden="true"></i>
              <span className="text-slate-400 text-[10px] font-normal">{formattedVariant}</span>
            </>
          )}
          {selectedElementId && (
            <>
              <i className="fa-solid fa-chevron-right text-[8px] mx-1.5 text-slate-600" aria-hidden="true"></i>
              <span className="text-white">{selectedElement?.type}</span>
            </>
          )}
        </div>
        {hasMultipleVariants && !selectedElementId && (
          <button
            type="button"
            onClick={onRefreshVariant}
            className="px-2 py-1 text-[10px] font-medium rounded bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 hover:text-blue-300 border border-blue-600/30 hover:border-blue-600/50 transition-all flex items-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            title="Refresh Variant - Change to next available variant"
            aria-label="Switch to next available variant"
          >
            <i className="fa-solid fa-rotate text-[9px]" aria-hidden="true"></i>
            <span>Refresh</span>
          </button>
        )}
      </div>
      <div role="tablist" aria-label="Editor tabs" className="flex gap-1 bg-[#151515] rounded p-1">
        <button
          type="button"
          role="tab"
          aria-selected={editTab === 'content'}
          onClick={() => onEditTabChange('content')}
          className={`flex-1 py-1 text-[10px] font-bold rounded transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${editTab === 'content' ? 'bg-[#222] text-white shadow' : 'text-slate-400 hover:text-white'}`}
        >CONTENT</button>
        <button
          type="button"
          role="tab"
          aria-selected={editTab === 'design'}
          onClick={() => onEditTabChange('design')}
          className={`flex-1 py-1 text-[10px] font-bold rounded transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${editTab === 'design' ? 'bg-[#222] text-white shadow' : 'text-slate-400 hover:text-white'}`}
        >DESIGN</button>
        <button
          type="button"
          role="tab"
          aria-selected={editTab === 'advanced'}
          onClick={() => onEditTabChange('advanced')}
          className={`flex-1 py-1 text-[10px] font-bold rounded transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${editTab === 'advanced' ? 'bg-[#222] text-white shadow' : 'text-slate-400 hover:text-white'}`}
        >ADVANCED</button>
      </div>
    </div>
  );
};
