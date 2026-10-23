"use client";

import { reload } from "@/lib/storage";
import { Button } from "./Button";
import { PAGE_TITLE_ID } from "./Header";
import { Notice } from "./Notice";

// The trips couldn't be loaded: what happened, and Try again, so it's never a dead end.
export function LoadFailed() {
  const retry = () => {
    // The button goes while the trips load again; focus waits on the page title.
    document.getElementById(PAGE_TITLE_ID)?.focus();
    reload();
  };
  return (
    <Notice action={<Button onClick={retry}>Try again</Button>}>
      We couldn’t load your trips. Check your connection and try again.
    </Notice>
  );
}
