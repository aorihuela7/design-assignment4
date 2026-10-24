import { useLayoutEffect, useSyncExternalStore } from "react";

// A one-off message carried to the next page in this tab, like "Deleted Beach
// weekend" after leaving a deleted trip. Memory only: never stored, gone on reload.
let message: string | null = null;
const listeners = new Set<() => void>();
let clearing: ReturnType<typeof setTimeout> | undefined;

export function setFlash(text: string | null) {
  message = text;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

// The message, while the page showing it is on screen. Read from here rather than
// kept in the page's state: Next keeps visited pages in the background (React's
// Activity) and shows them again as they were. Leaving or hiding the page clears it,
// so it's said once. The clear waits a moment, because in development React mounts
// everything twice and the second mount has to cancel it.
export function useFlash() {
  useLayoutEffect(() => {
    clearTimeout(clearing);
    return () => {
      clearing = setTimeout(() => setFlash(null));
    };
  }, []);
  return useSyncExternalStore(subscribe, () => message, () => null);
}
