import type React from 'react';

/** Element ids currently being edited — skip syncing innerHTML while focused. */
const inlineEditingIds = new Set<string>();

/** Live contentEditable nodes so we can force-sync (e.g. heading highlight). */
const editableNodesById = new Map<string, HTMLElement>();

/** Coalesce rapid onInput commits to one update per animation frame. */
const liveCommitRafById = new Map<string, number>();
const liveCommitPendingById = new Map<string, string>();

export function getEditableNode(elementId: string): HTMLElement | null {
  return editableNodesById.get(elementId) || null;
}

export function placeCaretAtEnd(node: HTMLElement): void {
  try {
    const doc = node.ownerDocument || document;
    const win = doc.defaultView || window;
    const range = doc.createRange();
    range.selectNodeContents(node);
    range.collapse(false);
    const sel = win.getSelection?.();
    if (!sel) return;
    sel.removeAllRanges();
    sel.addRange(range);
  } catch {
    /* ignore */
  }
}

/** Put caret inside the heading highlight <span> (for the next word after Space). */
export function placeCaretInHighlightSpan(node: HTMLElement): void {
  try {
    const doc = node.ownerDocument || document;
    const win = doc.defaultView || window;
    const span = node.querySelector('span');
    if (!span) {
      placeCaretAtEnd(node);
      return;
    }
    if (!span.firstChild) {
      span.appendChild(doc.createTextNode('\u200b'));
    }
    const textNode = span.firstChild;
    const raw = textNode && textNode.nodeType === Node.TEXT_NODE ? String(textNode.textContent || '') : '';
    const onlyZwsp = raw.replace(/\u200b/g, '') === '';
    const range = doc.createRange();
    if (textNode && onlyZwsp) {
      // Select placeholder so the first typed character replaces it cleanly.
      range.selectNodeContents(span);
    } else if (textNode) {
      range.setStart(textNode, raw.length);
      range.collapse(true);
    } else {
      range.selectNodeContents(span);
      range.collapse(false);
    }
    const sel = win.getSelection?.();
    if (!sel) return;
    sel.removeAllRanges();
    sel.addRange(range);
  } catch {
    placeCaretAtEnd(node);
  }
}

export function bindEditableHtml(node: HTMLElement | null, elementId: string, html: string) {
  if (!node) {
    editableNodesById.delete(elementId);
    return;
  }
  editableNodesById.set(elementId, node);
  if (inlineEditingIds.has(elementId)) return;
  const next = String(html ?? '');
  if (node.innerHTML !== next) node.innerHTML = next;
}

/**
 * Rewrite contentEditable HTML even while focused (heading last-word highlight).
 */
export function forceSyncEditableHtml(
  elementId: string,
  html: string,
  opts?: { caret?: 'end' | 'highlight' | 'none' }
): void {
  const node = editableNodesById.get(elementId);
  if (!node) return;
  const next = String(html ?? '');
  const caret = opts?.caret ?? 'end';
  if (node.innerHTML !== next) {
    node.innerHTML = next;
  }
  if (caret === 'none') return;
  if (caret === 'highlight') placeCaretInHighlightSpan(node);
  else placeCaretAtEnd(node);
}

export function clearLiveCommit(elementId: string): void {
  const raf = liveCommitRafById.get(elementId);
  if (raf && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(raf);
  liveCommitRafById.delete(elementId);
  liveCommitPendingById.delete(elementId);
}

function scheduleLiveCommit(elementId: string, html: string, onCommit: (html: string) => void) {
  liveCommitPendingById.set(elementId, html);
  if (liveCommitRafById.has(elementId)) return;
  const raf =
    typeof requestAnimationFrame === 'function'
      ? requestAnimationFrame(() => {
          liveCommitRafById.delete(elementId);
          const pending = liveCommitPendingById.get(elementId);
          liveCommitPendingById.delete(elementId);
          if (pending !== undefined) onCommit(pending);
        })
      : 0;
  if (raf) liveCommitRafById.set(elementId, raf);
  else onCommit(html);
}

export function editableFocusBlur(
  elementId: string,
  readOnly: boolean,
  onCommit: (html: string) => void,
  /**
   * When true (default), onInput pushes live updates while focused so the
   * left sidebar content fields mirror canvas typing in realtime.
   * innerHTML sync is skipped while focused via `inlineEditingIds`.
   */
  liveCommit = true
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
      clearLiveCommit(elementId);
      inlineEditingIds.delete(elementId);
      onCommit(e.currentTarget.innerHTML);
    },
    ...(liveCommit
      ? {
          onInput: (e) => {
            scheduleLiveCommit(elementId, e.currentTarget.innerHTML, onCommit);
          },
        }
      : {}),
  };
}

/** Blur any active contentEditable so pending inline edits commit before save. */
export function flushInlineEdits(): void {
  if (typeof document === 'undefined') return;
  liveCommitPendingById.forEach((_html, elementId) => {
    clearLiveCommit(elementId);
  });
  const active = document.activeElement;
  if (active instanceof HTMLElement && active.isContentEditable) {
    active.blur();
  }
}

export function createEditableHtmlProps(
  elementId: string,
  html: string,
  readOnly: boolean,
  onCommit: (html: string) => void,
  liveCommit = true
): {
  ref: (node: HTMLElement | null) => void;
  suppressContentEditableWarning?: boolean;
  onFocus?: React.FocusEventHandler<HTMLElement>;
  onBlur?: React.FocusEventHandler<HTMLElement>;
  onInput?: React.FormEventHandler<HTMLElement>;
} {
  return {
    ref: (node) => bindEditableHtml(node, elementId, html),
    ...editableFocusBlur(elementId, readOnly, onCommit, liveCommit),
  };
}
