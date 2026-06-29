import React, { useEffect } from 'react';

interface KeyboardShortcutsModalProps {
  open: boolean;
  onClose: () => void;
}

interface ShortcutItem {
  keys: string[];
  description: string;
}

interface ShortcutGroup {
  title: string;
  shortcuts: ShortcutItem[];
}

const SHORTCUTS: ShortcutGroup[] = [
  {
    title: 'History',
    shortcuts: [
      { keys: ['Ctrl', 'Z'], description: 'Undo last change' },
      { keys: ['Ctrl', 'Shift', 'Z'], description: 'Redo' },
      { keys: ['Ctrl', 'Y'], description: 'Redo (alternative)' },
    ],
  },
  {
    title: 'Save',
    shortcuts: [
      { keys: ['Ctrl', 'S'], description: 'Save page manually' },
    ],
  },
  {
    title: 'Help',
    shortcuts: [
      { keys: ['?'], description: 'Show this shortcuts panel' },
      { keys: ['Esc'], description: 'Close modal / deselect section' },
    ],
  },
];

const Kbd: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <kbd className="inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 rounded bg-[#1f1f1f] border border-[#333] text-[10px] font-mono font-semibold text-white/80 shadow-[inset_0_-1px_0_rgba(0,0,0,0.3)]">
    {children}
  </kbd>
);

/**
 * Modal listing all keyboard shortcuts. Opens via `?` key or toolbar button.
 * Closes on Esc or backdrop click. Focus returns to the opener.
 */
export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({ open, onClose }) => {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Keyboard shortcuts"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg max-h-[80vh] overflow-y-auto bg-[#0f0f0f] border border-white/10 rounded-xl shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-[#0f0f0f] border-b border-white/10 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <i className="fa-solid fa-keyboard text-blue-400" aria-hidden="true"></i>
            <h2 className="text-sm font-bold text-white">Keyboard Shortcuts</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close keyboard shortcuts"
            className="w-7 h-7 flex items-center justify-center rounded-md bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <i className="fa-solid fa-xmark text-[11px]" aria-hidden="true"></i>
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-6">
          {SHORTCUTS.map((group) => (
            <div key={group.title}>
              <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-3">
                {group.title}
              </h3>
              <div className="space-y-2">
                {group.shortcuts.map((sc, i) => (
                  <div key={i} className="flex items-center justify-between gap-4 py-1.5">
                    <span className="text-xs text-white/80 flex-1">{sc.description}</span>
                    <div className="flex items-center gap-1 shrink-0">
                      {sc.keys.map((k, ki) => (
                        <React.Fragment key={ki}>
                          {ki > 0 && <span className="text-white/30 text-[10px] mx-0.5">+</span>}
                          <Kbd>{k}</Kbd>
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="pt-4 border-t border-white/5 text-[10px] text-white/40 leading-relaxed">
            <i className="fa-solid fa-circle-info mr-1" aria-hidden="true"></i>
            Shortcuts are disabled while typing in text inputs — the browser's native undo/redo works there instead.
          </div>
        </div>
      </div>
    </div>
  );
};
