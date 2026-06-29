import React from 'react';
import type { Section } from '../../../types';
import { AccordionGroup } from '../inputs';

interface SectionsListPanelProps {
  globalSections: Section[];
  pageSections: Section[];
  currentPageName?: string;
  selectedSectionId: string | null;
  onSelect: (sectionId: string) => void;
  onMove: (sectionId: string, direction: 'up' | 'down') => void;
  onDuplicate: (sectionId: string) => void;
  onDelete: (sectionId: string) => void;
}

/** Single row in the sections list. */
const Row: React.FC<{
  section: Section;
  index: number;
  total: number;
  isGlobal: boolean;
  isActive: boolean;
  onSelect: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}> = ({ section, index, total, isGlobal, isActive, onSelect, onMoveUp, onMoveDown, onDuplicate, onDelete }) => {
  const sectionTitle = (section.content as any)?.title
    || (section.content as any)?.badge
    || String(section.type).replace(/-/g, ' ');

  return (
    <div
      className={`group flex items-center gap-1 p-1.5 rounded border text-[11px] transition-all ${
        isActive
          ? 'bg-blue-500/10 border-blue-500/50'
          : 'bg-[#151515] border-[#2a2a2a] hover:border-[#444]'
      }`}
    >
      <button
        type="button"
        onClick={onSelect}
        className="flex-1 flex items-center gap-2 text-left min-w-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded px-1"
        aria-label={`Select ${section.type} section`}
      >
        <i
          className={`fa-solid ${isGlobal ? 'fa-globe' : 'fa-layer-group'} text-[9px] ${isActive ? 'text-blue-400' : 'text-white/40'}`}
          aria-hidden="true"
          title={isGlobal ? 'Global (all pages)' : 'Page section'}
        ></i>
        <div className="min-w-0 flex-1">
          <div className={`truncate font-medium capitalize ${isActive ? 'text-white' : 'text-white/80'}`}>
            {sectionTitle}
          </div>
          <div className="text-[9px] text-white/40 truncate font-mono lowercase">
            {section.type}
          </div>
        </div>
      </button>
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onMoveUp(); }}
          disabled={index === 0}
          title="Move up"
          aria-label="Move section up"
          className="w-5 h-5 flex items-center justify-center rounded hover:bg-white/10 text-white/40 disabled:opacity-30 focus:outline-none focus-visible:ring-1 focus-visible:ring-blue-500"
        >
          <i className="fa-solid fa-chevron-up text-[8px]" aria-hidden="true"></i>
        </button>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onMoveDown(); }}
          disabled={index === total - 1}
          title="Move down"
          aria-label="Move section down"
          className="w-5 h-5 flex items-center justify-center rounded hover:bg-white/10 text-white/40 disabled:opacity-30 focus:outline-none focus-visible:ring-1 focus-visible:ring-blue-500"
        >
          <i className="fa-solid fa-chevron-down text-[8px]" aria-hidden="true"></i>
        </button>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onDuplicate(); }}
          title="Duplicate section"
          aria-label="Duplicate section"
          className="w-5 h-5 flex items-center justify-center rounded hover:bg-white/10 text-white/40 hover:text-blue-400 focus:outline-none focus-visible:ring-1 focus-visible:ring-blue-500"
        >
          <i className="fa-solid fa-clone text-[8px]" aria-hidden="true"></i>
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (window.confirm(`Delete ${section.type} section?`)) onDelete();
          }}
          title="Delete section"
          aria-label="Delete section"
          className="w-5 h-5 flex items-center justify-center rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 focus:outline-none focus-visible:ring-1 focus-visible:ring-red-500"
        >
          <i className="fa-solid fa-xmark text-[8px]" aria-hidden="true"></i>
        </button>
      </div>
    </div>
  );
};

/**
 * Flat list of all sections on the current page (plus global sections
 * pinned at top). Click to jump + select; hover reveals reorder /
 * duplicate / delete actions.
 */
export const SectionsListPanel: React.FC<SectionsListPanelProps> = ({
  globalSections,
  pageSections,
  currentPageName,
  selectedSectionId,
  onSelect,
  onMove,
  onDuplicate,
  onDelete,
}) => {
  const hasGlobals = globalSections.length > 0;
  const hasPageSections = pageSections.length > 0;

  const handleSelectAndScroll = (sectionId: string) => {
    onSelect(sectionId);
    // Best-effort scroll the section into view inside the preview iframe.
    try {
      const iframe = document.querySelector('iframe[title="Site Preview"]') as HTMLIFrameElement | null;
      const target = iframe?.contentDocument?.querySelector(`[data-section-id="${sectionId}"]`);
      if (target && 'scrollIntoView' in target) {
        (target as Element & { scrollIntoView: (opts?: any) => void }).scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }
    } catch {}
  };

  return (
    <AccordionGroup title={`Sections on ${currentPageName || 'this page'}`} defaultOpen={true}>
      <div className="space-y-3">
        {hasGlobals && (
          <div>
            <div className="text-[9px] font-bold text-white/30 uppercase tracking-widest mb-1.5 px-1">
              Global (all pages)
            </div>
            <div className="space-y-1">
              {globalSections.map((s, idx) => (
                <Row
                  key={s.id}
                  section={s}
                  index={idx}
                  total={globalSections.length}
                  isGlobal={true}
                  isActive={selectedSectionId === s.id}
                  onSelect={() => handleSelectAndScroll(s.id)}
                  onMoveUp={() => onMove(s.id, 'up')}
                  onMoveDown={() => onMove(s.id, 'down')}
                  onDuplicate={() => onDuplicate(s.id)}
                  onDelete={() => onDelete(s.id)}
                />
              ))}
            </div>
          </div>
        )}

        <div>
          {hasGlobals && (
            <div className="text-[9px] font-bold text-white/30 uppercase tracking-widest mb-1.5 px-1">
              This page
            </div>
          )}
          <div className="space-y-1">
            {hasPageSections ? (
              pageSections.map((s, idx) => (
                <Row
                  key={s.id}
                  section={s}
                  index={idx}
                  total={pageSections.length}
                  isGlobal={false}
                  isActive={selectedSectionId === s.id}
                  onSelect={() => handleSelectAndScroll(s.id)}
                  onMoveUp={() => onMove(s.id, 'up')}
                  onMoveDown={() => onMove(s.id, 'down')}
                  onDuplicate={() => onDuplicate(s.id)}
                  onDelete={() => onDelete(s.id)}
                />
              ))
            ) : (
              <div className="text-[10px] text-white/40 italic text-center py-4 bg-[#151515] border border-dashed border-[#333] rounded">
                No sections yet. Add one from the top bar.
              </div>
            )}
          </div>
        </div>
      </div>
    </AccordionGroup>
  );
};
