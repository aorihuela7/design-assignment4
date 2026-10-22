"use client";

import { useRouter } from "next/navigation";
import { useState, type MouseEvent } from "react";
import { Card, CardLink } from "./Card";
import { NewBadge } from "./NewBadge";
import { RunwayProgress } from "./RunwayProgress";
import { TextLink } from "./TextLink";

type BoardingPassCardProps = {
  name: string;
  code: string; // from uniqueCodes(), so it's unique among the person's lists
  packed: number;
  total: number;
  lastPackedAt: string | null;
  newCount?: number;
  // The list name links here; the link's hit area covers the whole card.
  href: string;
  // Second link, shown with new items: opens the list ready to add one.
  forgotHref?: string;
};

// How long the plane takes to run to the end of the runway before the trip opens.
const TAKEOFF_MS = 350;

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// "12 Oct". Only called after mount, so the user's time zone is safe to use.
function formatDay(iso: string) {
  const date = new Date(iso);
  return `${date.getDate()} ${MONTHS[date.getMonth()]}`;
}

// Half-circle notches: a circle in the page color with two border sides colored,
// rotated 45° so the colored half faces into the card. Sides swap at @md, when the
// tear line turns vertical.
const notch = "absolute size-5 rotate-45 rounded-full border border-transparent bg-canvas";
const notchStart =
  "-left-px top-0 -translate-x-1/2 -translate-y-1/2 border-t-current border-r-current @md:left-0 @md:-top-px @md:border-t-transparent @md:border-b-current";
const notchEnd =
  "-right-px top-0 translate-x-1/2 -translate-y-1/2 border-b-current border-l-current @md:right-auto @md:left-0 @md:top-auto @md:-bottom-px @md:-translate-x-1/2 @md:translate-y-1/2 @md:border-b-transparent @md:border-t-current";

export function BoardingPassCard({
  name,
  code,
  packed,
  total,
  lastPackedAt,
  newCount = 0,
  href,
  forgotHref,
}: BoardingPassCardProps) {
  const router = useRouter();
  const [departing, setDeparting] = useState(false);

  // "Despegue": a plain click runs the plane down the runway, then opens the trip.
  // Clicks for a new tab or window, and reduced motion, open straight away.
  const takeOff = (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    event.preventDefault();
    if (departing) return;
    setDeparting(true);
    setTimeout(() => router.push(href), TAKEOFF_MS);
  };

  return (
    <Card interactive padded={false} className="@container">
      <div className="relative flex flex-col @md:flex-row">
        <div className="flex min-w-0 flex-1 flex-col gap-1 p-4 @md:p-5">
          {/* Decorative ticket detail; the list name is the text that matters. */}
          <span aria-hidden="true" className="font-mono text-[0.625rem] leading-none tracking-widest text-muted">
            {code}
          </span>
          <h2 className="font-display text-3xl leading-tight font-semibold uppercase tracking-wide break-words text-ink @md:text-4xl">
            <CardLink href={href} onClick={takeOff}>
              {name}
            </CardLink>
          </h2>
          {newCount > 0 && (
            <span>
              <NewBadge>{`${newCount} added for next trip`}</NewBadge>
            </span>
          )}
          {newCount > 0 && forgotHref && (
            // A sibling of the main link, never inside it; z-20 lifts it above the card-wide hit area.
            <TextLink href={forgotHref} className="relative z-20 self-start">
              Forgot something? Add it<span className="sr-only"> to {name}</span>
            </TextLink>
          )}
        </div>

        <div
          aria-hidden="true"
          className="pointer-events-none relative h-0 text-line group-hover:text-ink @md:h-auto @md:w-0"
        >
          <div className="absolute inset-x-5 top-0 border-t border-dashed border-line @md:inset-x-auto @md:inset-y-5 @md:left-0 @md:border-t-0 @md:border-l" />
          <span className={`${notch} ${notchStart}`} />
          <span className={`${notch} ${notchEnd}`} />
        </div>

        <div className="flex flex-col justify-center gap-2 rounded-b-[3px] bg-canvas/60 p-4 @md:w-64 @md:rounded-r-[3px] @md:rounded-bl-none @md:p-5">
          <RunwayProgress packed={packed} total={total} departing={departing} />
          {lastPackedAt && (
            <p className="font-mono text-xs uppercase tracking-wider text-muted">
              Last packed {formatDay(lastPackedAt)}
            </p>
          )}
          {/* Visual cue only; the list name is the link's accessible name. */}
          <span aria-hidden="true" className="self-end font-mono text-xs uppercase tracking-wider text-ink">
            Open →
          </span>
        </div>
      </div>
    </Card>
  );
}
