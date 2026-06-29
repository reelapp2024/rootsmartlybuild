import React from 'react';
import type { Section } from '../../../types';
import { getDefaultVariant, getVariantsForSection } from '../../SectionsAndVariantRegistry';
import { formatVariantName } from '../state/variantNameFormatter';
import { AccordionGroup } from '../inputs';

interface DirectEditingCardProps {
  selectedSection: Section | null;
  sectionContentSource: Record<string, 'api' | 'default' | 'loading'>;
}

/** Info card shown in the content tab that tells users to click-to-edit on the canvas,
 *  and displays an API/Default/Loading indicator for the section's content source. */
export const DirectEditingCard: React.FC<DirectEditingCardProps> = ({ selectedSection, sectionContentSource }) => {
  return (
    <div className="p-6 bg-white/5 border border-white/10 rounded-xl text-center space-y-3 mb-6">
      <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
        <i className="fa-solid fa-arrow-pointer text-blue-400 text-xl"></i>
      </div>
      <h3 className="text-sm font-bold text-white">Direct Editing</h3>
      <p className="text-xs text-white/60 leading-relaxed">
        Click on any element in the preview to edit its content.
      </p>
      <p className="text-[10px] text-white/40 italic">
        Headings, text, and images can be managed directly on the page.
      </p>
      {selectedSection && (
        <div className="pt-2 flex items-center justify-center gap-2">
          {sectionContentSource[selectedSection.id] === 'api' ? (
            <>
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_10px_2px_rgba(52,211,153,0.75)] animate-pulse" />
              <span className="text-[10px] font-semibold text-emerald-300">API</span>
            </>
          ) : sectionContentSource[selectedSection.id] === 'loading' ? (
            <>
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-blue-400 shadow-[0_0_10px_2px_rgba(96,165,250,0.75)] animate-pulse" />
              <span className="text-[10px] font-semibold text-blue-300">Checking...</span>
            </>
          ) : (
            <>
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-300 shadow-[0_0_10px_2px_rgba(252,211,77,0.75)] animate-pulse" />
              <span className="text-[10px] font-semibold text-amber-200">Default</span>
            </>
          )}
        </div>
      )}
    </div>
  );
};

interface VariantInfoCardProps {
  selectedSection: Section;
  onRefreshVariant: () => void;
}

/** Shows current variant name + refresh button (when section has >1 variant available). */
export const VariantInfoCard: React.FC<VariantInfoCardProps> = ({ selectedSection, onRefreshVariant }) => {
  const variant = selectedSection.styles?.variant || getDefaultVariant(selectedSection.type);
  const formattedVariant = formatVariantName(variant || undefined, selectedSection.type);
  const availableVariants = getVariantsForSection(selectedSection.type);
  const hasMultipleVariants = availableVariants.length > 1;

  return (
    <div className="space-y-4 pb-4 border-b border-white/10">
      <div className="flex items-center justify-between">
        <div>
          <label className="text-[10px] font-bold text-white/40 capitalize mb-1 block">Current Variant</label>
          <div className="text-sm font-bold text-white">
            {formattedVariant || variant || 'Default'}
          </div>
        </div>
        {hasMultipleVariants && (
          <button
            onClick={onRefreshVariant}
            className="px-3 py-1.5 text-[10px] font-medium rounded bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 hover:text-blue-300 border border-blue-600/30 hover:border-blue-600/50 transition-all flex items-center gap-1.5"
            title="Refresh Variant - Change to next available variant"
          >
            <i className="fa-solid fa-rotate text-[9px]"></i>
            <span>Refresh</span>
          </button>
        )}
      </div>
    </div>
  );
};

interface AdvancedActionsProps {
  onRestoreElements: () => void;
  onResetStyles: () => void;
}

/** "Restore missing elements" + "Reset section styles" buttons inside an Advanced Actions accordion. */
export const AdvancedActionsAccordion: React.FC<AdvancedActionsProps> = ({ onRestoreElements, onResetStyles }) => {
  return (
    <AccordionGroup title="Advanced Actions" defaultOpen={false}>
      <button
        onClick={onRestoreElements}
        className="w-full mb-3 px-3 py-2 bg-orange-600/20 hover:bg-orange-600/30 border border-orange-600/40 text-orange-400 rounded text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer"
        title="Restore missing elements from template"
      >
        <i className="fa-solid fa-window-restore"></i>
        Restore Missing Elements
      </button>
      <button
        onClick={onResetStyles}
        className="w-full px-3 py-2 bg-red-600/20 hover:bg-red-600/30 border border-red-600/40 text-red-400 rounded text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer"
        title="Reset all section and element styles to theme defaults"
      >
        <i className="fa-solid fa-rotate-left"></i>
        Reset Section Styles
      </button>
    </AccordionGroup>
  );
};
