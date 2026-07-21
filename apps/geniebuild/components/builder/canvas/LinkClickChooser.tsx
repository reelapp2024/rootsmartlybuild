import React, { useEffect, useRef } from 'react';

export type LinkClickChooserProps = {
  x: number;
  y: number;
  href: string;
  onOpen: () => void;
  onSelect: () => void;
  onDismiss: () => void;
};

/**
 * Compact Open | Select chooser shown when a linked element is clicked in the builder.
 */
export const LinkClickChooser: React.FC<LinkClickChooserProps> = ({
  x,
  y,
  href,
  onOpen,
  onSelect,
  onDismiss,
}) => {
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const doc = rootRef.current?.ownerDocument || document;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onDismiss();
    };
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node | null;
      if (rootRef.current && t && !rootRef.current.contains(t)) onDismiss();
    };
    // Defer so the opening click doesn't immediately dismiss.
    const timer = window.setTimeout(() => {
      doc.addEventListener('mousedown', onDoc, true);
      doc.addEventListener('keydown', onKey, true);
    }, 0);
    return () => {
      window.clearTimeout(timer);
      doc.removeEventListener('mousedown', onDoc, true);
      doc.removeEventListener('keydown', onKey, true);
    };
  }, [onDismiss]);

  const label = (() => {
    const s = String(href || '').trim();
    if (s.length <= 42) return s;
    return `${s.slice(0, 39)}…`;
  })();

  return (
    <div
      ref={rootRef}
      role="menu"
      aria-label="Link actions"
      className="fixed z-[9999] min-w-[180px] rounded-lg border border-white/15 bg-slate-950/95 shadow-2xl shadow-black/50 backdrop-blur-md overflow-hidden"
      style={{
        left: Math.max(8, Math.min(x, (typeof window !== 'undefined' ? window.innerWidth : x) - 200)),
        top: Math.max(8, y + 8),
      }}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500 border-b border-white/10 truncate" title={href}>
        {label || 'Link'}
      </div>
      <button
        type="button"
        role="menuitem"
        className="w-full flex items-center gap-2 px-3 py-2.5 text-left text-sm text-slate-100 hover:bg-white/10 transition-colors"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onOpen();
        }}
      >
        <i className="fa-solid fa-arrow-up-right-from-square text-[11px] text-blue-400 w-4 text-center" aria-hidden />
        Open page
      </button>
      <button
        type="button"
        role="menuitem"
        className="w-full flex items-center gap-2 px-3 py-2.5 text-left text-sm text-slate-100 hover:bg-white/10 transition-colors border-t border-white/10"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onSelect();
        }}
      >
        <i className="fa-solid fa-arrow-pointer text-[11px] text-emerald-400 w-4 text-center" aria-hidden />
        Select to edit
      </button>
    </div>
  );
};
