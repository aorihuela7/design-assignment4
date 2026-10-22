import type { ReactNode } from "react";
import { PlaneIcon } from "./PlaneIcon";

type EmptyStateProps = {
  // A plane waiting at the start of a runway, for pages without the packing bar.
  plane?: boolean;
  children: ReactNode;
};

// Nothing here yet: a dashed outline, like a ticket still to be filled in.
export function EmptyState({ plane = false, children }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-start gap-4 rounded border-2 border-dashed border-line p-5">
      {plane && (
        <div aria-hidden="true" className="relative h-6 w-40 max-w-full">
          <div className="absolute inset-x-0 top-1/2 border-t-2 border-dashed border-muted" />
          <PlaneIcon className="absolute top-1/2 left-0 size-6 -translate-y-1/2 text-ink" />
        </div>
      )}
      {children}
    </div>
  );
}
