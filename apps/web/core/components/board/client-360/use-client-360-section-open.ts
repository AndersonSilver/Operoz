import { useCallback, useEffect, useState } from "react";

const STORAGE_PREFIX = "client360-detail-section:";

function readStored(key: string): boolean | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${key}`);
    if (raw === "1") return true;
    if (raw === "0") return false;
    return null;
  } catch {
    return null;
  }
}

export function useClient360SectionOpen(storageKey: string | undefined, defaultOpen: boolean) {
  const [open, setOpenState] = useState(defaultOpen);

  useEffect(() => {
    if (!storageKey) {
      setOpenState(defaultOpen);
      return;
    }
    const stored = readStored(storageKey);
    setOpenState(stored ?? defaultOpen);
  }, [defaultOpen, storageKey]);

  const setOpen = useCallback(
    (next: boolean) => {
      setOpenState(next);
      if (!storageKey) return;
      try {
        localStorage.setItem(`${STORAGE_PREFIX}${storageKey}`, next ? "1" : "0");
      } catch {
        /* ignore quota */
      }
    },
    [storageKey]
  );

  const toggle = useCallback(() => {
    setOpen(!open);
  }, [open, setOpen]);

  return { open, setOpen, toggle };
}
