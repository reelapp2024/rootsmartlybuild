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
          className="absolute left-0 top-full mt-2 bg-[#0f0f0f] border border-white/10 rounded-xl shadow-2xl w-[min(420px,calc(100vw-2rem))] z-50 duration-150 origin-top-left overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <i className="fa-solid fa-palette text-[11px] text-white/50" aria-hidden="true" />
              <span className="text-xs font-semibold text-white/90 tracking-wide">Choose a theme</span>
            </div>
            <span className="text-[10px] text-white/40">{PRESET_THEMES.length} presets</span>
          </div>

          <div className="p-3 max-h-[min(60vh,520px)] overflow-y-auto custom-scrollbar">
            {isCustomTheme && (
              <div className="mb-3 p-3 rounded-lg border border-violet-500/50 bg-violet-500/10">
                <p className="text-xs font-semibold text-violet-200">Custom theme active</p>
                <p className="text-[10px] text-white/40 mt-0.5 leading-relaxed">Saved custom colors are applied. Pick a preset below to switch, then Save.</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-2.5">
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
                    className={`group relative p-2.5 rounded-lg border cursor-pointer transition-all select-none flex flex-col gap-2.5 ${
                      isActive
                        ? 'border-blue-500 bg-blue-500/10 ring-1 ring-blue-500/40'
                        : 'border-white/10 bg-[#141414] hover:border-white/25 hover:bg-[#1c1c1c]'
                    }`}
                  >
                    {/* Color preview swatch */}
                    <div className="relative h-16 rounded-md overflow-hidden border border-white/10" style={{ backgroundColor: surface }}>
                      {/* big primary block */}
                      <div className="absolute inset-x-0 bottom-0 h-1/2 flex items-end gap-1.5 p-1.5">
                        <div className="w-8 h-6 rounded" style={{ backgroundColor: primary }} aria-hidden="true" />
                        <div className="flex-1 space-y-1">
                          <div className="h-1.5 w-3/4 rounded" style={{ backgroundColor: heading }} aria-hidden="true" />
                          <div className="h-1.5 w-1/2 rounded opacity-60" style={{ backgroundColor: heading }} aria-hidden="true" />
                        </div>
                      </div>
                    </div>

                    <div className="min-w-0">
                      <p className={`text-xs font-semibold truncate ${isActive ? 'text-blue-200' : 'text-white/90'}`}>
                        {theme.name}
                      </p>
                      {description && (
                        <p className="text-[10px] text-white/40 line-clamp-1 mt-0.5">{description}</p>
                      )}
                    </div>

                    {isActive && (
                      <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
                        <i className="fa-solid fa-check text-[8px] text-white" aria-hidden="true" />
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
