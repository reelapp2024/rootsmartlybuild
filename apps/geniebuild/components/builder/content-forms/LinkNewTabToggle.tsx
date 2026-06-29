import React from 'react';

interface LinkNewTabToggleProps {
  /** The current value (true/false/undefined). Undefined defaults to ON. */
  value: boolean | undefined;
  /** Called with the new boolean state. */
  onChange: (newTab: boolean) => void;
  /** When false, the toggle is hidden (e.g. when the link field is empty). */
  visible?: boolean;
  /** Optional override for the toggle row's title. */
  label?: string;
  /** Optional override for the helper text. */
  description?: string;
}

/**
 * Reusable "Open in New Tab" toggle for content-form link fields.
 *
 * Defaults to ON across the editor — the convention is that link fields open
 * in a new tab unless the user explicitly turns this off. Pass `value` from
 * the relevant content key (e.g. `content.linkNewTab`) — it normalizes
 * `undefined` → `true` so existing items without the flag also default to ON.
 */
export const LinkNewTabToggle: React.FC<LinkNewTabToggleProps> = ({
  value,
  onChange,
  visible = true,
  label = 'Open in New Tab',
  description = 'Default is ON. Turn off to open in the same tab.',
}) => {
  if (!visible) return null;
  const newTab = value === undefined ? true : !!value;
  return (
    <div className="flex items-center justify-between gap-3 p-3 bg-[#151515] border border-[#333] rounded">
      <div className="flex-1 min-w-0">
        <div className="text-xs font-bold text-white">{label}</div>
        <div className="text-[10px] text-white/40 mt-0.5">{description}</div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={newTab}
        onClick={() => onChange(!newTab)}
        className={`relative w-10 h-6 rounded-full transition-colors flex-shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${newTab ? 'bg-blue-500' : 'bg-[#333]'}`}
      >
        <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${newTab ? 'translate-x-4' : 'translate-x-0.5'}`} />
      </button>
    </div>
  );
};
