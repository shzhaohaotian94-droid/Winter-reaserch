import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";

import { storageGet, storageRemove, storageSet } from "@/lib/storage";

const PREFIX = "vibe.finance.page-state.v1:";
const values = new Map<string, unknown>();
const listeners = new Map<string, Set<() => void>>();

function storageKey(key: string): string {
  return `${PREFIX}${key}`;
}

function initialValue<T>(key: string, fallback: T | (() => T)): T {
  if (values.has(key)) return values.get(key) as T;
  const raw = storageGet(storageKey(key));
  if (raw !== null) {
    try {
      const parsed = JSON.parse(raw) as T;
      values.set(key, parsed);
      return parsed;
    } catch {
      storageRemove(storageKey(key));
    }
  }
  const value = typeof fallback === "function" ? (fallback as () => T)() : fallback;
  values.set(key, value);
  return value;
}

function publish<T>(key: string, next: SetStateAction<T>, fallback: T | (() => T)): void {
  const current = initialValue(key, fallback);
  const value = typeof next === "function" ? (next as (previous: T) => T)(current) : next;
  values.set(key, value);
  try {
    storageSet(storageKey(key), JSON.stringify(value));
  } catch {
    // Non-serializable data still stays alive while this tab is open.
  }
  for (const listener of listeners.get(key) ?? []) listener();
}

/**
 * Page state that survives route unmounts and browser restarts.
 *
 * The module cache is also a tiny same-tab event bus: an async task started by
 * an unmounted page can keep publishing progress to a newly mounted instance.
 */
export function usePersistentState<T>(key: string, fallback: T | (() => T)): [T, Dispatch<SetStateAction<T>>] {
  const fallbackRef = useRef(fallback);
  const [value, setValue] = useState<T>(() => initialValue(key, fallbackRef.current));

  useEffect(() => {
    setValue(initialValue(key, fallbackRef.current));
    const bucket = listeners.get(key) ?? new Set<() => void>();
    const sync = () => setValue(initialValue(key, fallbackRef.current));
    bucket.add(sync);
    listeners.set(key, bucket);
    return () => {
      bucket.delete(sync);
      if (bucket.size === 0) listeners.delete(key);
    };
  }, [key]);

  const update = useCallback<Dispatch<SetStateAction<T>>>((next) => {
    publish(key, next, fallbackRef.current);
  }, [key]);

  return [value, update];
}

export function clearPersistentState(key: string): void {
  values.delete(key);
  storageRemove(storageKey(key));
  for (const listener of listeners.get(key) ?? []) listener();
}

export const persistentStateStorageKey = storageKey;
