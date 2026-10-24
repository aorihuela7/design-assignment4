import { useEffect, useRef, useState, type ReactNode } from "react";
import { PlaneIcon } from "@/components/PlaneIcon";
import { RunwayProgress } from "@/components/RunwayProgress";
import { TextButton } from "@/components/TextLink";

type ProgressBarProps = {
  packed: number;
  total: number;
  // Lets the page move focus to the progress line, e.g. after clearing ticks.
  countId: string;
  allPacked: boolean;
  // The last item was just ticked: "flying" while the plane takes off, then "landed"
  // as All packed fades in.
  takeoff: "flying" | "landed" | null;
  // "Forgot something? Add it": takes the person to the Add item field.
  onForgot: () => void;
  // Shown beside the runway once something is ticked.
  onClearTicks: () => void;
  // Latest change ("Added Hat to Clothes"), shown on screen and read politely.
  message: ReactNode;
};

// Sticks to the top while the list scrolls, so the count and the All packed message
// are on screen when the last item is ticked, wherever it is. Two short lines that keep
// their height whatever they show, so the list never moves under the pointer: the
// runway (or All packed) with Clear all ticks, then the latest change.
export function ProgressBar({
  packed,
  total,
  countId,
  allPacked,
  takeoff,
  onForgot,
  onClearTicks,
  message,
}: ProgressBarProps) {
  // Stuck to the top while the list scrolls under it: then its background and rule
  // run the full window width, so the list clearly passes underneath. Beside the
  // weather panel (wide screens) they stay in the list's column.
  const bar = useRef<HTMLDivElement>(null);
  const [stuck, setStuck] = useState(false);
  useEffect(() => {
    if (!bar.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => setStuck(entry.intersectionRatio < 1 && entry.boundingClientRect.top < 1),
      { rootMargin: "-1px 0px 0px 0px", threshold: [1] },
    );
    observer.observe(bar.current);
    return () => observer.disconnect();
  }, []);
  const flying = allPacked && takeoff === "flying";

  return (
    <div
      ref={bar}
      data-stuck={stuck || undefined}
      className="sticky top-0 z-30 border-b border-line bg-canvas pt-2 pb-1 data-stuck:bleed lg:data-stuck:[border-image-source:none]"
    >
      <div className="flex min-h-7 items-center gap-x-4">
        {/* Progress, or All packed in its place once the plane has taken off. */}
        <div id={countId} tabIndex={-1} className="flex min-w-0 flex-1 flex-col justify-center rounded">
          {(!allPacked || flying) && <RunwayProgress packed={packed} total={total} departing={flying} />}
          {/* Always rendered, so All packed is announced when it appears. In the page, not a modal. */}
          <div role="status">
            {allPacked && !flying && (
              <p
                className={`flex items-center gap-2 font-display text-xl leading-7 font-semibold uppercase tracking-wide text-ink ${
                  takeoff === "landed" ? "motion-safe:animate-fade-in" : ""
                }`}
              >
                {/* The plane, not a tick: a filled tick box read like a checkbox. */}
                <PlaneIcon className="size-5 shrink-0" />
                {/* On one line beside Clear all ticks, so the bar keeps its height: on a
                    phone it says only "All packed." (the rest is still read out). */}
                <span>
                  All packed.<span className="sr-only sm:not-sr-only"> Have a good trip.</span>
                </span>
              </p>
            )}
          </div>
        </div>
        {/* Nothing to clear until something is ticked. */}
        {packed > 0 && (
          <TextButton inline onClick={onClearTicks} className="shrink-0 font-mono text-xs uppercase tracking-wider">
            Clear all ticks
          </TextButton>
        )}
      </div>
      {/* The latest change; once all packed and nothing new to say, the way to add what was forgotten. */}
      <div className="flex min-h-6 items-center">
        <div aria-live="polite" className="flex min-w-0 items-center gap-x-3 text-ink">
          {message}
        </div>
        {/* A button, since it moves focus within the page rather than going anywhere. */}
        {allPacked && !message && (
          <TextButton inline onClick={onForgot}>
            Forgot something? Add it
          </TextButton>
        )}
      </div>
    </div>
  );
}
