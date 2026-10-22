import { PlaneIcon } from "./PlaneIcon";

type RunwayProgressProps = {
  packed: number;
  total: number;
  // Opening a trip: the plane runs to the end of the runway and lifts its nose.
  departing?: boolean;
};

const PLANE_SIZE = 24;

// "6 of 15 packed", "All packed" or "No items yet".
function countText(packed: number, total: number) {
  if (total === 0) return "No items yet";
  if (packed >= total) return "All packed";
  return `${packed} of ${total} packed`;
}

export function RunwayProgress({ packed, total, departing = false }: RunwayProgressProps) {
  const allPacked = total > 0 && packed >= total;
  const percent = departing ? 100 : total > 0 ? Math.min(100, Math.max(0, (packed / total) * 100)) : 0;
  // Airborne: nose up past the end of the runway, while leaving or once all packed.
  const airborne = departing || allPacked;
  return (
    <div className="flex items-center gap-3">
      {/* Decorative: the count beside it carries the information. */}
      <div aria-hidden="true" className="relative h-6 min-w-12 flex-1">
        <div className="absolute inset-x-0 top-1/2 border-t-2 border-dashed border-muted" />
        <PlaneIcon
          className={`absolute top-1/2 size-6 text-ink motion-reduce:transition-none ${
            airborne ? "-translate-y-[85%] -rotate-12" : "-translate-y-1/2"
          } ${
            departing
              ? "transition-[left,translate,rotate] duration-300 ease-in"
              : "transition-[left,translate,rotate] duration-500 ease-out"
          }`}
          // Keeps the plane inside the runway at 0% and 100%.
          style={{ left: `calc(${percent}% - ${(percent / 100) * PLANE_SIZE}px)` }}
        />
      </div>
      {/* As wide as "00 of 00 packed" whatever it says, so runways line up from card to card. */}
      <p className="min-w-[calc(15ch+0.75em)] text-right font-mono text-xs whitespace-nowrap uppercase tracking-wider text-ink">
        {countText(packed, total)}
      </p>
    </div>
  );
}
