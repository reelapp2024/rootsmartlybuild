import { useCallback, useEffect, useRef, useState } from 'react';

interface HistoryOptions {
  /** Coalesce rapid updates within this window into a single history entry (ms). */
  debounceMs?: number;
  /** Maximum history entries to keep. Older ones drop off. */
  maxSize?: number;
}

interface HistoryState<T> {
  past: T[];
  future: T[];
}

/**
 * Drop-in replacement for `useState<T>` that also tracks an undo/redo history
 * stack. Coalesces rapid updates (default 400ms) into one history entry so
 * typing in a text input doesn't spam 20 snapshots.
 *
 * Returns `[state, setState, undo, redo, canUndo, canRedo, resetHistory]`.
 * `setState` accepts a value or an updater function, identical to useState.
 * `resetHistory(newState)` replaces the value AND clears past/future
 * (use when loading fresh data from the server).
 */
export function useHistory<T>(
  initial: T,
  options: HistoryOptions = {}
): [
  T,
  (next: T | ((prev: T) => T)) => void,
  () => void,
  () => void,
  boolean,
  boolean,
  (newState: T) => void,
] {
  const { debounceMs = 400, maxSize = 100 } = options;

  const [state, setState] = useState<T>(initial);
  const [history, setHistory] = useState<HistoryState<T>>({ past: [], future: [] });

  // Ref to track pending coalesce window
  const coalesceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Snapshot of state when the current coalesce window started — this is
  // what gets pushed to `past` when the window closes.
  const coalesceBaseRef = useRef<T | null>(null);
  // Most recent state (kept in a ref so coalesce callbacks see latest)
  const stateRef = useRef<T>(initial);
  stateRef.current = state;

  const flushCoalesced = useCallback(() => {
    if (coalesceBaseRef.current === null) return;
    const base = coalesceBaseRef.current;
    coalesceBaseRef.current = null;
    setHistory((h) => {
      const nextPast = [...h.past, base];
      return {
        past: nextPast.length > maxSize ? nextPast.slice(nextPast.length - maxSize) : nextPast,
        future: [],
      };
    });
  }, [maxSize]);

  const setter = useCallback(
    (next: T | ((prev: T) => T)) => {
      setState((prev) => {
        // Start a new coalesce window if none is active
        if (coalesceBaseRef.current === null) {
          coalesceBaseRef.current = prev;
        }

        // Reset the coalesce timer
        if (coalesceTimerRef.current !== null) {
          clearTimeout(coalesceTimerRef.current);
        }
        coalesceTimerRef.current = setTimeout(() => {
          flushCoalesced();
          coalesceTimerRef.current = null;
        }, debounceMs);

        return typeof next === 'function' ? (next as (p: T) => T)(prev) : next;
      });
    },
    [debounceMs, flushCoalesced]
  );

  const undo = useCallback(() => {
    // Flush any pending coalesce window first so the current edit is undoable
    if (coalesceTimerRef.current !== null) {
      clearTimeout(coalesceTimerRef.current);
      coalesceTimerRef.current = null;
      flushCoalesced();
    }
    setHistory((h) => {
      if (h.past.length === 0) return h;
      const previous = h.past[h.past.length - 1];
      const newPast = h.past.slice(0, -1);
      const current = stateRef.current;
      setState(previous);
      return { past: newPast, future: [current, ...h.future] };
    });
  }, [flushCoalesced]);

  const redo = useCallback(() => {
    if (coalesceTimerRef.current !== null) {
      clearTimeout(coalesceTimerRef.current);
      coalesceTimerRef.current = null;
      flushCoalesced();
    }
    setHistory((h) => {
      if (h.future.length === 0) return h;
      const next = h.future[0];
      const newFuture = h.future.slice(1);
      const current = stateRef.current;
      setState(next);
      return { past: [...h.past, current], future: newFuture };
    });
  }, [flushCoalesced]);

  const resetHistory = useCallback((newState: T) => {
    if (coalesceTimerRef.current !== null) {
      clearTimeout(coalesceTimerRef.current);
      coalesceTimerRef.current = null;
    }
    coalesceBaseRef.current = null;
    setState(newState);
    setHistory({ past: [], future: [] });
  }, []);

  // Cleanup pending timer on unmount
  useEffect(() => {
    return () => {
      if (coalesceTimerRef.current !== null) clearTimeout(coalesceTimerRef.current);
    };
  }, []);

  return [state, setter, undo, redo, history.past.length > 0, history.future.length > 0, resetHistory];
}

/**
 * Bind Ctrl/Cmd+Z / Ctrl/Cmd+Shift+Z (and Ctrl+Y) to undo/redo.
 * Skips events originating from input/textarea/contenteditable elements.
 */
export function useUndoRedoShortcuts(undo: () => void, redo: () => void) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target) {
        const tag = target.tagName;
        const isEditable = target.isContentEditable;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || isEditable) {
          // Allow browser's native undo/redo inside form fields
          return;
        }
      }
      const isCtrl = e.ctrlKey || e.metaKey;
      if (!isCtrl) return;
      if (e.key === 'z' || e.key === 'Z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      } else if (e.key === 'y' || e.key === 'Y') {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [undo, redo]);
}
