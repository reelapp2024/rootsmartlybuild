import type React from 'react';

/** Element ids currently being edited — skip syncing innerHTML while focused. */
const inlineEditingIds = new Set<string>();

export function bindEditableHtml(node: HTMLElement | null, elementId: string, html: string) {
  if (!node) return;
  if (inlineEditingIds.has(elementId)) return;
  const next = String(html ?? '');
  if (node.innerHTML !== next) node.innerHTML = next;
}

export function editableFocusBlur(
  elementId: string,
  readOnly: boolean,
  onCommit: (html: string) => void,
  /** When true, onInput pushes live updates while focused (innerHTML sync is skipped). */
  liveCommit = false
): {
  suppressContentEditableWarning?: boolean;
  onFocus?: React.FocusEventHandler<HTMLElement>;
  onBlur?: React.FocusEventHandler<HTMLElement>;
  onInput?: React.FormEventHandler<HTMLElement>;
} {
  if (readOnly) return { suppressContentEditableWarning: true };
  return {
    suppressContentEditableWarning: true,
    onFocus: () => {
      inlineEditingIds.add(elementId);
    },
    onBlur: (e) => {
      inlineEditingIds.delete(elementId);
      onCommit(e.currentTarget.innerHTML);
    },
    ...(liveCommit
      ? {
          onInput: (e) => {
            onCommit(e.currentTarget.innerHTML);
          },
        }
      : {}),
  };
}

/** Blur any active contentEditable so pending inline edits commit before save. */
export function flushInlineEdits(): void {
  if (typeof document === 'undefined') return;
  const active = document.activeElement;
  if (active instanceof HTMLElement && active.isContentEditable) {
    active.blur();
  }
}

export function createEditableHtmlProps(
  elementId: string,
  html: string,
  readOnly: boolean,
  onCommit: (html: string) => void
): {
  ref: (node: HTMLElement | null) => void;
  suppressContentEditableWarning?: boolean;
  onFocus?: React.FocusEventHandler<HTMLElement>;
  onBlur?: React.FocusEventHandler<HTMLElement>;
} {
  return {
    ref: (node) => bindEditableHtml(node, elementId, html),
    ...editableFocusBlur(elementId, readOnly, onCommit),
  };
}
