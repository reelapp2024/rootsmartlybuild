import React, { useEffect, useRef, useState } from 'react';
import type { PRESET_THEMES } from '../../../constants';
import { ThemeDropdown } from './ThemeDropdown';

type ViewMode = 'desktop' | 'tablet' | 'mobile';
type AutosaveStatus = 'clean' | 'dirty' | 'saving' | 'saved' | 'error';

const VIEW_MODE_CONFIG: Record<ViewMode, { label: string; icon: string; width: string }> = {
  desktop: { label: 'Desktop', icon: 'fa-desktop', width: '1440px' },
  tablet: { label: 'Tablet', icon: 'fa-tablet-screen-button', width: '1024px' },
  mobile: { label: 'Mobile', icon: 'fa-mobile-screen', width: '375px' },
};

/** Compact dropdown for device preview. Closes on outside click, Esc, or option select. */
const ViewModeDropdown: React.FC<{ viewMode: ViewMode; onChange: (mode: ViewMode) => void }> = ({ viewMode, onChange }) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const current = VIEW_MODE_CONFIG[viewMode];

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 bg-[#151515] rounded px-3 py-1.5 border border-[#333] text-white text-xs hover:bg-[#1a1a1a] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Preview device: ${current.label} ${current.width}`}
        title={`${current.label} (${current.width})`}
      >
        <i className={`fa-solid ${current.icon} text-xs`} aria-hidden="true"></i>
        <span className="text-[10px] font-medium">{current.width}</span>
        <i className={`fa-solid fa-chevron-down text-[8px] text-white/50 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true"></i>
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Preview device"
          className="absolute right-0 top-full mt-1 bg-[#0f0f0f] border border-white/10 rounded-md shadow-xl py-1 min-w-[150px] z-50 animate-in fade-in slide-in-from-top-1 duration-150"
        >
          {(Object.keys(VIEW_MODE_CONFIG) as ViewMode[]).map((mode) => {
            const cfg = VIEW_MODE_CONFIG[mode];
            const isActive = mode === viewMode;
            return (
              <button
                key={mode}
                type="button"
                role="option"
                aria-selected={isActive}
                onClick={() => { onChange(mode); setOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-3 py-1.5 text-left text-xs transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-inset ${
                  isActive ? 'bg-blue-500/10 text-white' : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <i className={`fa-solid ${cfg.icon} text-xs w-4 ${isActive ? 'text-blue-400' : 'text-white/50'}`} aria-hidden="true"></i>
                <span className="flex-1 font-medium">{cfg.label}</span>
                <span className="text-[9px] text-white/40 font-mono">{cfg.width}</span>
                {isActive && <i className="fa-solid fa-check text-[9px] text-blue-400" aria-hidden="true"></i>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

interface BuilderHeaderProps {
  selectedSectionId: string | null;
  isSidebarOpen: boolean;
  viewMode: ViewMode;
  zoomLevel: number;
  isPreviewMode: boolean;
  savingPageData: boolean;
  canUndo: boolean;
  canRedo: boolean;
  autosaveStatus?: AutosaveStatus;
  lastSavedAt?: number | null;
  onUndo: () => void;
  onRedo: () => void;
  onOpenThemes: () => void;
  onAddTestSection: () => void;
  onAddCanvasSection?: () => void;
  onViewModeChange: (mode: ViewMode) => void;
  onZoomChange: (zoom: number) => void;
  onTogglePreview: () => void;
  onSave: () => void;
  onShowShortcuts?: () => void;
  // Theme dropdown
  selectedPresetId?: string | null;
  isCustomTheme?: boolean;
  onPresetSelect?: (theme: (typeof PRESET_THEMES)[0], presetIdx: number) => void;
}

function formatLastSaved(ts: number | null | undefined): string {
  if (!ts) return '';
  const diff = Date.now() - ts;
  if (diff < 5_000) return 'just now';
  if (diff < 60_000) return `${Math.floor(diff / 1000)}s ago`;
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

const AutosaveIndicator: React.FC<{ status: AutosaveStatus; lastSavedAt: number | null | undefined }> = ({ status, lastSavedAt }) => {
  if (status === 'saving') {
    return (
      <div role="status" aria-live="polite" className="flex items-center gap-1.5 text-[10px] text-slate-400">
        <div className="animate-spin rounded-full h-2.5 w-2.5 border-b-2 border-slate-400" aria-hidden="true"></div>
        <span>Saving…</span>
      </div>
    );
  }
  if (status === 'dirty') {
    return (
      <div role="status" aria-live="polite" className="flex items-center gap-1.5 text-[10px] text-amber-400" title="Unsaved changes">
        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" aria-hidden="true"></span>
        <span>Unsaved changes</span>
      </div>
    );
  }
  if (status === 'error') {
    return (
      <div role="alert" className="flex items-center gap-1.5 text-[10px] text-red-400" title="Autosave failed — try the Save button">
        <i className="fa-solid fa-triangle-exclamation" aria-hidden="true"></i>
        <span>Save failed</span>
      </div>
    );
  }
  if (status === 'saved' && lastSavedAt) {
    return (
      <div role="status" aria-live="polite" className="flex items-center gap-1.5 text-[10px] text-emerald-400/70" title={`Saved at ${new Date(lastSavedAt).toLocaleString()}`}>
        <i className="fa-solid fa-check" aria-hidden="true"></i>
        <span>Saved {formatLastSaved(lastSavedAt)}</span>
      </div>
    );
  }
  return null;
};

export const BuilderHeader: React.FC<BuilderHeaderProps> = ({
  selectedSectionId,
  isSidebarOpen,
  viewMode,
  zoomLevel,
  isPreviewMode,
  savingPageData,
  canUndo,
  canRedo,
  autosaveStatus = 'clean',
  lastSavedAt = null,
  onUndo,
  onRedo,
  onOpenThemes,
  onAddTestSection,
  onAddCanvasSection,
  onViewModeChange,
  onZoomChange,
  onTogglePreview,
  onSave,
  onShowShortcuts,
  selectedPresetId,
  isCustomTheme,
  onPresetSelect,
}) => {
  return (
    <header role="banner" aria-label="Builder toolbar" className="h-14 border-b border-white/10 bg-[#050505] flex items-center justify-between px-4 shrink-0 z-50">
      <div className="flex items-center gap-4">
        <button
          onClick={onOpenThemes}
          className={`px-3 py-1.5 rounded text-xs transition-colors flex items-center gap-2 ${!selectedSectionId && isSidebarOpen ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
          title="Global Settings — pages, typography, SEO"
          aria-label="Open global settings"
        >
          <i className="fa-solid fa-sliders" aria-hidden="true"></i>Global Settings
        </button>
        {onPresetSelect && (
          <ThemeDropdown
            selectedPresetId={selectedPresetId ?? null}
            isCustomTheme={isCustomTheme}
            onPresetSelect={onPresetSelect}
          />
        )}
        <button
          onClick={onAddTestSection}
          className="w-8 h-8 rounded flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          title="Add All Elements Test Section"
          aria-label="Add test section with all element types"
        >
          <i className="fa-solid fa-vial text-xs" aria-hidden="true"></i>
        </button>
        {onAddCanvasSection && (
          <button
            onClick={onAddCanvasSection}
            className="h-8 px-3 rounded flex items-center gap-1.5 text-[11px] font-bold text-blue-300 bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/30 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            title="Add a blank section — start from scratch with any elements"
            aria-label="Add a blank canvas section you can fill with any elements"
          >
            <i className="fa-solid fa-plus text-[10px]" aria-hidden="true"></i>
            <span>Add Blank Section</span>
          </button>
        )}
        <div className="h-4 w-px bg-white/10 mx-1" aria-hidden="true"></div>
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className={`w-8 h-8 rounded flex items-center justify-center transition-colors ${canUndo ? 'text-slate-300 hover:text-white hover:bg-white/10' : 'text-slate-600 cursor-not-allowed'}`}
          title="Undo (Ctrl+Z)"
          aria-label="Undo last change"
        >
          <i className="fa-solid fa-rotate-left text-xs" aria-hidden="true"></i>
        </button>
        <button
          onClick={onRedo}
          disabled={!canRedo}
          className={`w-8 h-8 rounded flex items-center justify-center transition-colors ${canRedo ? 'text-slate-300 hover:text-white hover:bg-white/10' : 'text-slate-600 cursor-not-allowed'}`}
          title="Redo (Ctrl+Shift+Z)"
          aria-label="Redo last undone change"
        >
          <i className="fa-solid fa-rotate-right text-xs" aria-hidden="true"></i>
        </button>
        {onShowShortcuts && (
          <button
            onClick={onShowShortcuts}
            className="w-8 h-8 rounded flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
            title="Keyboard shortcuts (?)"
            aria-label="Show keyboard shortcuts"
          >
            <i className="fa-solid fa-keyboard text-xs" aria-hidden="true"></i>
          </button>
        )}
      </div>
      <div className="flex items-center gap-2">
        <ViewModeDropdown viewMode={viewMode} onChange={onViewModeChange} />

        <div className="flex items-center gap-2 bg-[#151515] rounded px-2 py-1 border border-[#333] mr-2">
          <i className="fa-solid fa-magnifying-glass text-slate-400 text-[10px]" aria-hidden="true"></i>
          <input
            type="range"
            min="25"
            max="200"
            step="5"
            value={zoomLevel}
            onChange={(e) => onZoomChange(Number(e.target.value))}
            className="zoom-slider w-16 h-1 bg-[#333] rounded-lg appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(zoomLevel - 25) / 175 * 100}%, #333 ${(zoomLevel - 25) / 175 * 100}%, #333 100%)`
            }}
            title={`Zoom: ${zoomLevel}%`}
            aria-label={`Canvas zoom level: ${zoomLevel}%`}
            aria-valuemin={25}
            aria-valuemax={200}
            aria-valuenow={zoomLevel}
          />
          <span className="text-[10px] text-white font-medium min-w-[2.25rem] text-right tabular-nums" aria-hidden="true">{zoomLevel}%</span>
          <button
            onClick={() => onZoomChange(100)}
            className="px-1 py-0.5 rounded text-[10px] text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
            title="Reset to 100%"
            aria-label="Reset zoom to 100%"
          >
            <i className="fa-solid fa-rotate-left text-[10px]" aria-hidden="true"></i>
          </button>
        </div>

        <button
          onClick={onTogglePreview}
          className={`px-3 py-1.5 rounded text-xs font-bold border transition-all ${isPreviewMode ? 'bg-blue-600 border-blue-600 text-white' : 'border-white/20 hover:bg-white/10'}`}
          aria-pressed={isPreviewMode}
          aria-label={isPreviewMode ? 'Exit preview mode' : 'Enter preview mode'}
        >
          {isPreviewMode ? (<><i className="fa-solid fa-eye-slash mr-2" aria-hidden="true"></i>Edit</>) : (<><i className="fa-solid fa-eye mr-2" aria-hidden="true"></i>Preview</>)}
        </button>
        <AutosaveIndicator status={autosaveStatus} lastSavedAt={lastSavedAt} />
        <button
          onClick={onSave}
          disabled={savingPageData}
          aria-label={savingPageData ? 'Saving, please wait' : 'Save page'}
          className={`px-3 py-1.5 rounded text-xs font-bold border transition-all flex items-center gap-2 ${
            savingPageData
              ? 'bg-gray-600 border-gray-600 text-white cursor-not-allowed'
              : 'bg-green-600 border-green-600 text-white hover:bg-green-700'
          }`}
        >
          {savingPageData ? (
            <>
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white" role="status" aria-hidden="true"></div>
              Saving...
            </>
          ) : (
            <>
              <i className="fa-solid fa-save" aria-hidden="true"></i>
              Save
            </>
          )}
        </button>
      </div>
    </header>
  );
};
