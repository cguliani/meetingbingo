import { useCallback, useState, type Dispatch, type SetStateAction } from 'react';

function isStorageAvailable(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export function readLocalStorageValue<T>(key: string, fallback: T): T {
  if (!isStorageAvailable()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    // Corrupted or unparsable data — fail gracefully to the fallback.
    return fallback;
  }
}

export function writeLocalStorageValue<T>(key: string, value: T): void {
  if (!isStorageAvailable()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or unavailable (e.g. private browsing) — fail silently.
  }
}

export function removeLocalStorageValue(key: string): void {
  if (!isStorageAvailable()) return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

/**
 * Generic useState-like hook backed by localStorage. Each call owns its own
 * value — for state that's already managed by a reducer (like GameState),
 * persist via the read/write helpers above instead of this hook, so the
 * reducer remains the single source of truth.
 */
export function useLocalStorage<T>(key: string, initialValue: T): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => readLocalStorageValue(key, initialValue));

  const setPersistedValue: Dispatch<SetStateAction<T>> = useCallback(
    (next) => {
      setValue((prev) => {
        const resolved = typeof next === 'function' ? (next as (prev: T) => T)(prev) : next;
        writeLocalStorageValue(key, resolved);
        return resolved;
      });
    },
    [key],
  );

  return [value, setPersistedValue];
}
