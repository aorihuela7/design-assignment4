import type { ReactNode } from "react";

// A banner about the page as a whole, e.g. trips that couldn’t load. Icon plus text, never color alone.
// An optional action (like Try again) sits under the text, so the banner is never a dead end.
export function Notice({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div role="status" className="flex items-start gap-3 rounded border border-ink bg-surface p-4 text-ink">
      <svg aria-hidden="true" viewBox="0 0 16 16" className="mt-0.5 size-5 shrink-0">
        <rect x="1" y="1" width="14" height="14" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <path d="M8 7v5" stroke="currentColor" strokeWidth="1.75" />
        <circle cx="8" cy="4.6" r="1" fill="currentColor" />
      </svg>
      <div className="flex flex-col items-start gap-3">
        <p>{children}</p>
        {action}
      </div>
    </div>
  );
}
