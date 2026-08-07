import type React from 'react';

/** Element ids currently being edited — skip syncing innerHTML while focused. */
const inlineEditingIds = new Set<string>();

/** Live contentEditable nodes so we can force-sync (e.g. heading highlight). */
const editableNodesById = new Map<string, HTMLElement>();

/** Coalesce rapid onInput commits to one update per animation frame. */
const liveCommitRafById = new Map<string, number>();
const liveCommitPendingById = new Map<string, string>();
/** Caret plain-text offset captured on each input (before React can move it). */
const liveCaretOffsetById = new Map<string, number>();
/** Sticky: user just typed a trailing Space — do not rewrite DOM until next non-space char. */
const liveTrailingSpaceById = new Map<string, boolean>();
/** Pending caret-restore timers (cancel on newer input so stale rAFs don't steal focus). */
const caretRestoreTimersById = new Map<string, number[]>();

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

/** Plain-text caret offset inside a contentEditable (ZWSP ignored). */
export function getPlainTextCaretOffset(node: HTMLElement): number | null {
  try {
    const doc = node.ownerDocument || document;
    const win = doc.defaultView || window;
    const sel = win.getSelection?.();
    if (!sel || sel.rangeCount === 0) return null;
    const range = sel.getRangeAt(0);
    if (!node.contains(range.startContainer)) return null;
    const pre = range.cloneRange();
    pre.selectNodeContents(node);
    pre.setEnd(range.startContainer, range.startOffset);
    return String(pre.toString() || '').replace(/\u200b/g, '').length;
  } catch {
    return null;
  }
}

/** Place caret at a plain-text offset (matches getPlainTextCaretOffset). */
export function placeCaretAtPlainOffset(node: HTMLElement, offset: number): void {
  try {
    const doc = node.ownerDocument || document;
    const win = doc.defaultView || window;
    const target = Math.max(0, Math.floor(offset));
    const range = doc.createRange();

    if (target === 0) {
      const walk = doc.createTreeWalker(node, NodeFilter.SHOW_TEXT);
      if (walk.nextNode()) {
        range.setStart(walk.currentNode, 0);
        range.collapse(true);
      } else {
        range.selectNodeContents(node);
        range.collapse(true);
      }
    } else {
      let seen = 0;
      let placed = false;
      const walk = doc.createTreeWalker(node, NodeFilter.SHOW_TEXT);
      while (walk.nextNode()) {
        const current = walk.currentNode as Text;
        const raw = String(current.textContent || '');
        for (let i = 0; i < raw.length; i++) {
          if (raw[i] === '\u200b') continue;
          seen += 1;
          if (seen === target) {
            range.setStart(current, i + 1);
            range.collapse(true);
            placed = true;
            break;
          }
        }
        if (placed) break;
      }
      if (!placed) {
        range.selectNodeContents(node);
        range.collapse(false);
      }
    }

    const sel = win.getSelection?.();
    if (!sel) return;
    sel.removeAllRanges();
    sel.addRange(range);
  } catch {
    placeCaretAtEnd(node);
  }
}

/** Put caret inside the heading highlight <span> (end of highlighted word). */
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
  // Never clobber DOM while the user is typing — that resets the caret to end-of-line.
  if (inlineEditingIds.has(elementId)) return;
  if (node === (typeof document !== 'undefined' ? document.activeElement : null)) return;
  const next = String(html ?? '');
  if (node.innerHTML !== next) node.innerHTML = next;
}

/**
 * Rewrite contentEditable HTML even while focused (heading last-word highlight).
 * Use caret: 'preserve' + caretOffset while typing so Space / mid-line edits don't jump.
 */
export function forceSyncEditableHtml(
  elementId: string,
  html: string,
  opts?: {
    caret?: 'end' | 'highlight' | 'none' | 'preserve';
    /** Explicit plain-text offset (from input event). Preferred over reading selection. */
    caretOffset?: number | null;
  }
): void {
  const node = editableNodesById.get(elementId);
  if (!node) return;
  const next = String(html ?? '');
  const caret = opts?.caret ?? 'end';
  const preserved =
    caret === 'preserve'
      ? opts?.caretOffset !== null && opts?.caretOffset !== undefined
        ? opts.caretOffset
        : getPlainTextCaretOffset(node)
      : null;
  if (node.innerHTML !== next) {
    node.innerHTML = next;
  }
  if (caret === 'none') return;
  if (caret === 'preserve') {
    if (preserved !== null) placeCaretAtPlainOffset(node, preserved);
    return;
  }
  if (caret === 'highlight') placeCaretInHighlightSpan(node);
  else placeCaretAtEnd(node);
}

/** After React re-renders from a live edit, put the caret back where the user was. */
export function restoreCaretAfterReactUpdate(
  elementId: string,
  offset: number | null
): void {
  if (offset === null || offset === undefined) return;
  cancelCaretRestore(elementId);
  const run = () => {
    caretRestoreTimersById.delete(elementId);
    const node = editableNodesById.get(elementId);
    if (!node || !inlineEditingIds.has(elementId)) return;
    placeCaretAtPlainOffset(node, offset);
  };
  if (typeof requestAnimationFrame === 'function') {
    const t1 = requestAnimationFrame(() => {
      const t2 = requestAnimationFrame(run);
      const list = caretRestoreTimersById.get(elementId) || [];
      list.push(t2);
      caretRestoreTimersById.set(elementId, list);
    });
    caretRestoreTimersById.set(elementId, [t1]);
  } else {
    const t = window.setTimeout(run, 0) as unknown as number;
    caretRestoreTimersById.set(elementId, [t]);
  }
}

export function cancelCaretRestore(elementId: string): void {
  const timers = caretRestoreTimersById.get(elementId);
  if (!timers?.length) return;
  timers.forEach((t) => {
    if (typeof cancelAnimationFrame === 'function') cancelAnimationFrame(t);
    try {
      clearTimeout(t);
    } catch {
      /* ignore */
    }
  });
  caretRestoreTimersById.delete(elementId);
}

export function clearLiveCommit(elementId: string): void {
  const raf = liveCommitRafById.get(elementId);
  if (raf && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(raf);
  liveCommitRafById.delete(elementId);
  liveCommitPendingById.delete(elementId);
}

/** Caret offset captured on the latest input event for this element. */
export function getLiveCaretOffset(elementId: string): number | null {
  return liveCaretOffsetById.has(elementId)
    ? (liveCaretOffsetById.get(elementId) as number)
    : null;
}

/** True when the last input was a trailing Space that must not be rewritten away. */
export function hasLiveTrailingSpace(elementId: string): boolean {
  return liveTrailingSpaceById.get(elementId) === true;
}

export function setLiveTrailingSpace(elementId: string, value: boolean): void {
  if (value) liveTrailingSpaceById.set(elementId, true);
  else liveTrailingSpaceById.delete(elementId);
}

/**
 * At end of the highlight <span>, browsers often fail to insert a real Space.
 * Insert a text-node space AFTER the span and park the caret after it.
 * Returns true when Space was handled (caller should preventDefault).
 */
export function insertSpaceAfterHighlightIfAtEnd(node: HTMLElement): boolean {
  try {
    const doc = node.ownerDocument || document;
    const win = doc.defaultView || window;
    const sel = win.getSelection?.();
    if (!sel || sel.rangeCount === 0) return false;
    const range = sel.getRangeAt(0);
    if (!range.collapsed) return false;

    const span = node.querySelector('span');
    if (!span || !span.contains(range.startContainer)) return false;

    // Caret is at end of span when nothing countable remains after it inside the span.
    const afterRange = range.cloneRange();
    try {
      afterRange.selectNodeContents(span);
      afterRange.setStart(range.startContainer, range.startOffset);
    } catch {
      return false;
    }
    const afterText = String(afterRange.toString() || '').replace(/\u200b/g, '');
    if (afterText !== '') return false;

    // Reuse an existing trailing space text node after the span when present.
    let spaceNode = span.nextSibling;
    if (
      spaceNode &&
      spaceNode.nodeType === Node.TEXT_NODE &&
      /^\s/.test(String(spaceNode.textContent || ''))
    ) {
      const tn = spaceNode as Text;
      const nextRange = doc.createRange();
      nextRange.setStart(tn, Math.min(1, Math.max(1, tn.textContent?.length || 1)));
      nextRange.collapse(true);
      sel.removeAllRanges();
      sel.addRange(nextRange);
      return true;
    }

    spaceNode = doc.createTextNode(' ');
    if (span.nextSibling) {
      span.parentNode?.insertBefore(spaceNode, span.nextSibling);
    } else {
      span.parentNode?.appendChild(spaceNode);
    }
    const nextRange = doc.createRange();
    nextRange.setStart(spaceNode, 1);
    nextRange.collapse(true);
    sel.removeAllRanges();
    sel.addRange(nextRange);
    return true;
  } catch {
    return false;
  }
}

/** True while the contentEditable for this id is focused (live typing). */
export function isInlineEditing(elementId: string): boolean {
  return inlineEditingIds.has(elementId);
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
      cancelCaretRestore(elementId);
      liveCaretOffsetById.delete(elementId);
      liveTrailingSpaceById.delete(elementId);
      inlineEditingIds.delete(elementId);
      onCommit(e.currentTarget.innerHTML);
    },
    ...(liveCommit
      ? {
          onInput: (e) => {
            const node = e.currentTarget as HTMLElement;
            const native = e.nativeEvent as InputEvent;
            // Space at end: sticky flag so highlight rewrite cannot eat it (→ "youman").
            if (native && native.inputType === 'insertText' && native.data === ' ') {
              liveTrailingSpaceById.set(elementId, true);
            } else if (
              native &&
              (native.inputType === 'insertText' ||
                native.inputType === 'insertCompositionText') &&
              native.data &&
              native.data !== ' '
            ) {
              liveTrailingSpaceById.delete(elementId);
            } else if (
              native &&
              (native.inputType === 'deleteContentBackward' ||
                native.inputType === 'deleteContentForward')
            ) {
              const plain = String(node.textContent || '').replace(/\u200b/g, '');
              if (!/\s$/.test(plain)) liveTrailingSpaceById.delete(elementId);
            }
            const offset = getPlainTextCaretOffset(node);
            if (offset !== null) liveCaretOffsetById.set(elementId, offset);
            scheduleLiveCommit(elementId, node.innerHTML, onCommit);
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

/**
 * Synchronously collect the latest HTML from every in-progress editable
 * (pending rAF commits + currently focused nodes). Clears pending timers.
 * Used by save so we don't persist stale React state.
 */
export function collectPendingEditableHtml(): Map<string, string> {
  const out = new Map<string, string>();

  liveCommitPendingById.forEach((html, elementId) => {
    out.set(elementId, html);
  });

  // Cancel scheduled commits — we're taking over synchronously.
  Array.from(liveCommitRafById.keys()).forEach((elementId) => {
    clearLiveCommit(elementId);
  });

  editableNodesById.forEach((node, elementId) => {
    if (!inlineEditingIds.has(elementId) && !out.has(elementId)) return;
    try {
      out.set(elementId, node.innerHTML);
    } catch {
      /* ignore */
    }
  });

  // Also catch focused contentEditable that may not be in our map yet.
  if (typeof document !== 'undefined') {
    const active = document.activeElement;
    if (active instanceof HTMLElement && active.isContentEditable) {
      const headingId = active.getAttribute('data-gb-heading-id');
      const id = headingId || active.getAttribute('data-gb-editable-id');
      if (id) out.set(id, active.innerHTML);
    }
  }

  return out;
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

/**
 * Browsers collapse trailing spaces in contentEditable. Convert trailing ASCII
 * spaces to NBSP so caret/space after the last letter works (badges, short labels).
 */
export function htmlPreserveTrailingSpaces(htmlOrText: string): string {
  const raw = String(htmlOrText ?? '');
  if (!raw) return '';
  if (/<[a-z][\s\S]*>/i.test(raw)) {
    return raw.replace(/(?: |&nbsp;|\u00a0)+$/i, (m) => {
      const normalized = m.replace(/&nbsp;/gi, ' ').replace(/\u00a0/g, ' ');
      return '\u00a0'.repeat(Math.max(1, normalized.length));
    });
  }
  const escaped = raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  const trail = escaped.match(/ +$/);
  if (!trail) return escaped;
  return escaped.slice(0, -trail[0].length) + '\u00a0'.repeat(trail[0].length);
}
