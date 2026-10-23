import type { ReactNode } from "react";

// What went wrong and what to do next, right under the field or button it's about.
// Icon plus text, never color alone.
export function ErrorMessage({ id, role, children }: { id?: string; role?: "alert"; children: ReactNode }) {
  return (
    <p id={id} role={role} className="flex items-start gap-1.5 text-sm text-ink">
      <ErrorIcon />
      {children}
    </p>
  );
}

export function ErrorIcon({ className = "mt-0.5" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" className={`size-4 shrink-0 ${className}`}>
      <rect x="1" y="1" width="14" height="14" rx="2" fill="currentColor" />
      <path d="M8 4v5" stroke="var(--color-surface)" strokeWidth="2" />
      <circle cx="8" cy="11.75" r="1.1" fill="var(--color-surface)" />
    </svg>
  );
}

// A form's save failed for a reason other than the name. What was typed stays.
export const NOT_SAVED = "Not saved. Check your connection and try again";
