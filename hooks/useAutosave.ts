"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Persists `value` to localStorage under `key` after `delayMs` of inactivity, and returns
 * the saved draft (if any existed on mount) plus a `saved` flag that briefly flips true
 * right after each write so the UI can show a "Draft saved" indicator.
 */
export function useAutosave<T>(key: string, value: T, delayMs = 800) {
  const [draft] = useState<T | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  });
  const [saved, setSaved] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      try {
        localStorage.setItem(key, JSON.stringify(value));
        setSaved(true);
        setTimeout(() => setSaved(false), 1500);
      } catch {
        // localStorage unavailable (private browsing, quota) — autosave is best-effort only.
      }
    }, delayMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, JSON.stringify(value), delayMs]);

  function clearDraft() {
    try {
      localStorage.removeItem(key);
    } catch {
      // ignore
    }
  }

  return { draft, saved, clearDraft };
}
