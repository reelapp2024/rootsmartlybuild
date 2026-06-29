import React, { useEffect, useRef, useState } from 'react';
import { PRESET_THEMES } from '../../../constants';

interface ThemeDropdownProps {
  selectedPresetId: string | null;
  isCustomTheme?: boolean;
  onPresetSelect: (theme: typeof PRESET_THEMES[0], presetIdx: number) => void;
}

/**
 * Toolbar dropdown for quick theme selection.
 * Shows preset themes (Crimson Jet, Ocean Mist, etc.)
 * 
 * Note: Site-wide element styles (headings, buttons, links) are now managed
 * from the Admin Panel Design page, not from GenieBuild.
 */
export const ThemeDropdown: React.FC<ThemeDropdownProps> = ({
  selectedPresetId,
  isCustomTheme = false,
  onPresetSelect,
}) => {
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

  const activePreset = selectedPresetId !== null
    ? PRESET_THEMES[parseInt(selectedPresetId)]
    : null;

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-3 py-1.5 rounded text-xs transition-colors text-slate-400 hover:text-white hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label="Theme preset"
        title="Theme preset"
      >
        <i className="fa-solid fa-palette" aria-hidden="true"></i>
        <span>{isCustomTheme ? 'Custom theme' : activePreset?.name || 'Theme'}</span>
        {isCustomTheme && (
          <div className="flex gap-0.5" aria-hidden="true">
            <div className="w-3 h-3 rounded-full border border-white/10 bg-gradient-to-br from-violet-500 to-fuchsia-500" />
          </div>
        )}
        {!isCustomTheme && activePreset && (
          <div className="flex gap-0.5" aria-hidden="true">
            <div className="w-3 h-3 rounded-full border border-white/10" style={{ backgroundColor: activePreset.elements.surface }} />
            <div className="w-3 h-3 rounded-full border border-white/10" style={{ backgroundColor: activePreset.elements.primaryButton.bg }} />
          </div>
        )}
        <i className={`fa-solid fa-chevron-down text-[8px] text-white/50 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true"></i>
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Theme preset"
          className="absolute right-0 top-full mt-1 bg-[#0f0f0f] border border-white/10 rounded-lg shadow-2xl w-[360px] max-w-[90vw] z-50 duration-150 origin-top-right overflow-hidden"
        >
          <div className="p-3 max-h-[560px] overflow-y-auto custom-scrollbar">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {isCustomTheme && (
                <div className="col-span-2 sm:col-span-3 p-3 rounded-lg border-2 border-violet-500/60 bg-violet-500/10 text-center">
                  <p className="text-xs font-semibold text-violet-200">Custom theme active</p>
                  <p className="text-[10px] text-white/40 mt-1">Saved custom colors are applied. Pick a preset below to switch, then Save.</p>
                </div>
              )}
              {PRESET_THEMES.map((theme, idx) => {
                const isActive = !isCustomTheme && selectedPresetId === idx.toString();
                const primary = theme.elements.primaryButton?.bg || theme.elements.accent || '#E11D48';
                const surface = theme.elements.surface || '#0E1214';
                const heading = theme.elements.heading || '#F8FAFC';
                const description = theme.elements.description || theme.elements.muted || '';

                return (
                  <div
                    key={idx}
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      onPresetSelect(theme as any, idx);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') onPresetSelect(theme as any, idx);
                    }}
                    aria-label={`Apply ${theme.name} theme`}
                    className={`relative p-3 rounded-lg border-2 cursor-pointer transition-all select-none aspect-square flex flex-col ${
                      isActive
                        ? 'border-blue-500 bg-blue-500/10 shadow-md'
                        : 'border-white/10 bg-[#111] hover:border-white/30 hover:bg-[#1a1a1a]'
                    }`}
                  >
                    <div className="flex flex-col gap-2 mb-2">
                      <div className="flex gap-1.5 items-center">
                        <div
                          className="w-5 h-5 rounded border border-white/10"
                          style={{ backgroundColor: primary }}
                          aria-hidden="true"
                        />
                        <div
                          className="flex-1 h-5 rounded border border-white/10"
                          style={{ backgroundColor: surface }}
                          aria-hidden="true"
                        />
                      </div>
                      <div className="w-full h-1 rounded" style={{ backgroundColor: heading }} aria-hidden="true" />
                    </div>

                    <div className="space-y-1">
                      <p className={`text-xs font-semibold ${isActive ? 'text-blue-200' : 'text-white/90'}`}>
                        {theme.name}
                      </p>
                      <p className="text-[10px] text-white/40 line-clamp-1">{description}</p>
                    </div>

                    {isActive && (
                      <div className="absolute top-2 right-2">
                        <i className="fa-solid fa-check text-[10px] text-blue-300" aria-hidden="true" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
