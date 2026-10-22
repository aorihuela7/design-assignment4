import type { ReactNode } from "react";
import { PlaneIcon } from "@/components/PlaneIcon";
import { RunwayProgress } from "@/components/RunwayProgress";
import { TextButton } from "@/components/TextLink";

type ProgressBarProps = {
  packed: number;
  total: number;
  // Lets the page move focus to the progress line, e.g. after clearing ticks.
  countId: string;
  allPacked: boolean;
  // "Forgot something? Add it": takes the person to the Add item field.
  onForgot: () => void;
  // Latest change ("Added Hat to Clothes"), shown on screen and read politely.
  message: ReactNode;
};

// Sticks to the top while the list scrolls, so the count and the All packed message
// are on screen when the last item is ticked, wherever it is. Both lines keep their
// height whatever they show, so the list never moves under the pointer.
export function ProgressBar({ packed, total, countId, allPacked, onForgot, message }: ProgressBarProps) {
  return (
    <div className="sticky top-0 z-30 border-b border-line bg-canvas pt-2">
      {/* Progress, or All packed in its place. */}
      <div id={countId} tabIndex={-1} className="flex min-h-7 flex-col justify-center rounded">
        {!allPacked && <RunwayProgress packed={packed} total={total} />}
        {/* Always rendered, so All packed is announced when it appears. In the page, not a modal. */}
        <div role="status">
          {allPacked && (
            <p className="flex items-center gap-2 font-display text-xl leading-7 font-semibold uppercase tracking-wide text-ink">
              {/* The plane, not a tick: a filled tick box read like a checkbox. */}
              <PlaneIcon className="size-5 shrink-0" />
              All packed. Have a good trip.
            </p>
          )}
        </div>
      </div>
      {/* The latest change; once all packed and nothing new to say, the way to add what was forgotten. */}
      <div className="flex min-h-11 items-center">
        <div aria-live="polite" className="flex min-w-0 items-center gap-x-3 text-ink">
          {message}
        </div>
        {/* A button, since it moves focus within the page rather than going anywhere. */}
        {allPacked && !message && <TextButton onClick={onForgot}>Forgot something? Add it</TextButton>}
      </div>
    </div>
  );
}
