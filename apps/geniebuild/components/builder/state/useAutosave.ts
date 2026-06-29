import { useEffect, useRef, useState } from 'react';

interface AutosaveOptions<T> {
  /** Current state to watch for changes. */
  value: T;
  /** Called debounced after `delayMs` of no changes. Should persist remotely. */
  onSave: () => void | Promise<void>;
  /** Debounce window before autosave fires (default 3s). */
  delayMs?: number;
  /** When true (e.g., during initial load), skip autosave and reset baseline. */
  pause?: boolean;
  /** Key used for localStorage backup. Set to null to disable. */
  localStorageKey?: string | null;
  /** When false, track dirty state only and never call remote save automatically. */
  autoSaveEnabled?: boolean;
}

type AutosaveStatus = 'clean' | 'dirty' | 'saving' | 'saved' | 'error';

interface AutosaveResult {
  /** Whether there are unsaved changes (state has diverged from last save). */
  isDirty: boolean;
  /** High-level status for UI indicators. */
  status: AutosaveStatus;
  /** Timestamp (ms) of last successful save, or null. */
  lastSavedAt: number | null;
  /** Call after a successful manual save to reset dirty state. */
  markClean: () => void;
  /** Call to force-save immediately (cancels pending debounce). */
  flush: () => void;
}

/**
 * Watches `value` for changes and:
 *   1. Marks state dirty
 *   2. Writes a JSON snapshot to localStorage (immediate, so crash-safe)
 *   3. Debounces an autosave call to `onSave` after `delayMs` of quiet
 *
 * Call `markClean()` after a successful manual save (via Save button) so
 * the dirty indicator clears.
 */
export function useAutosave<T>({
  value,
  onSave,
  delayMs = 3000,
  pause = false,
  localStorageKey = null,
  autoSaveEnabled = true,
}: AutosaveOptions<T>): AutosaveResult {
  const [status, setStatus] = useState<AutosaveStatus>('clean');
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);

  // Reference to the last value that was saved (or mounted with).
  const baselineRef = useRef<T>(value);
  // Debounce timer id
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Keep onSave in a ref so we don't re-bind the debounce on every render
  const onSaveRef = useRef(onSave);
  onSaveRef.current = onSave;

  const doSave = async () => {
    if (status === 'saving') return;
    setStatus('saving');
    try {
      await onSaveRef.current();
      setStatus('saved');
      setLastSavedAt(Date.now());
      baselineRef.current = value;
    } catch (e) {
      console.error('[Autosave] failed:', e);
      setStatus('error');
    }
  };

  const markClean = () => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    baselineRef.current = value;
    setStatus('clean');
    setLastSavedAt(Date.now());
  };

  const flush = () => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    doSave();
  };

  // When paused flips off (e.g., initial load complete), reset baseline.
  // This prevents the "initial load" from being treated as a dirty change.
  useEffect(() => {
    if (!pause) {
      baselineRef.current = value;
      setStatus('clean');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pause]);

  // Main change watcher: fires whenever `value` differs from baseline.
  useEffect(() => {
    if (pause) return;
    if (value === baselineRef.current) return;

    setStatus('dirty');

    // Write localStorage backup immediately (crash-safe)
    if (localStorageKey) {
      try {
        localStorage.setItem(localStorageKey, JSON.stringify({ value, savedAt: Date.now() }));
      } catch (e) {
        // Quota exceeded or disabled — not fatal
      }
    }

    if (!autoSaveEnabled) return;

    // Reset debounce timer
    if (timerRef.current !== null) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      doSave();
      timerRef.current = null;
    }, delayMs);

    return () => {
      // Don't clear timer on unmount during value changes — let it fire.
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, pause, delayMs, localStorageKey, autoSaveEnabled]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current);
    };
  }, []);

  return {
    isDirty: status === 'dirty' || status === 'saving',
    status,
    lastSavedAt,
    markClean,
    flush,
  };
}

/**
 * Read a localStorage backup written by useAutosave. Returns null if missing
 * or malformed. `maxAgeMs` filters out ancient backups (default 7 days).
 */
export function readLocalBackup<T>(
  key: string,
  maxAgeMs: number = 7 * 24 * 60 * 60 * 1000
): { value: T; savedAt: number } | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed.savedAt !== 'number') return null;
    if (Date.now() - parsed.savedAt > maxAgeMs) return null;
    return parsed as { value: T; savedAt: number };
  } catch {
    return null;
  }
}

/** Delete a localStorage backup (e.g., after successful save). */
export function clearLocalBackup(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {}
}
