import { PlaneIcon } from "./PlaneIcon";

type RunwayProgressProps = {
  packed: number;
  total: number;
  // Opening a trip: the plane runs to the end of the runway and lifts its nose.
  departing?: boolean;
};

const PLANE_SIZE = 24;

export function RunwayProgress({ packed, total, departing = false }: RunwayProgressProps) {
  const percent = departing ? 100 : total > 0 ? Math.min(100, Math.max(0, (packed / total) * 100)) : 0;
  return (
    <div className="flex items-center gap-3">
      {/* Decorative: the count beside it carries the information. */}
      <div aria-hidden="true" className="relative h-6 min-w-12 flex-1">
        <div className="absolute inset-x-0 top-1/2 border-t-2 border-dashed border-muted" />
        <PlaneIcon
          className={`absolute top-1/2 size-6 text-ink motion-reduce:transition-none ${
            departing
              ? "-translate-y-[85%] -rotate-12 transition-[left,translate,rotate] duration-300 ease-in"
              : "-translate-y-1/2 transition-[left] duration-500 ease-out"
          }`}
          // Keeps the plane inside the runway at 0% and 100%.
          style={{ left: `calc(${percent}% - ${(percent / 100) * PLANE_SIZE}px)` }}
        />
      </div>
      <p className="font-mono text-xs whitespace-nowrap uppercase tracking-wider text-ink">
        {packed} of {total} packed
      </p>
    </div>
  );
}
