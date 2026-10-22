"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, ViewTransition, type MouseEvent, type ReactNode } from "react";
import { formatDay } from "@/lib/dates";
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
  // Shared with the trip page's title, which this name morphs into on opening.
  titleTransition: string;
};

// "N added" counts already shown in this tab, by card link, so a badge stamps in only
// the first time a card shows its count. Memory only: never saved, reset on reload.
const shownNewCounts = new Map<string, number>();

// How long the plane takes to run to the end of the runway before the trip opens.
const TAKEOFF_MS = 350;

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
  titleTransition,
}: BoardingPassCardProps) {
  const router = useRouter();
  const [departing, setDeparting] = useState(false);
  const stampBadge = newCount > 0 && shownNewCounts.get(href) !== newCount;
  useEffect(() => {
    shownNewCounts.set(href, newCount);
  }, [href, newCount]);

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
    <Ticket
      interactive
      main={
        <>
          {/* Decorative ticket detail; the list name is the text that matters. */}
          <span aria-hidden="true" className="font-mono text-xs leading-none tracking-widest text-muted">
            {code}
          </span>
          <ViewTransition name={titleTransition} share="morph" default="none">
            <h2 className={nameClass}>
              <CardLink href={href} onClick={takeOff}>
                {name}
              </CardLink>
            </h2>
          </ViewTransition>
          {newCount > 0 && (
            <div className="mt-1 flex flex-col items-start">
              <NewBadge stamp={stampBadge}>{`${newCount} added for next trip`}</NewBadge>
              {forgotHref && (
                // A sibling of the main link, never inside it; z-20 lifts it above the card-wide
                // hit area. Its 44px target reaches into the card's padding, so the spacing stays even.
                <TextLink href={forgotHref} className="relative z-20 mt-1 -mb-3">
                  Forgot something? Add it<span className="sr-only"> to {name}</span>
                </TextLink>
              )}
            </div>
          )}
        </>
      }
      stub={
        <>
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
        </>
      }
    />
  );
}

// As wide as its text, so the morph into the page title scales it evenly.
const nameClass =
  "w-fit font-display text-3xl leading-tight font-semibold uppercase tracking-wide break-words text-ink @md:text-4xl";

// The ticket shape: the main part, the tear line with its notches, and the stub.
function Ticket({ interactive = false, main, stub }: { interactive?: boolean; main: ReactNode; stub: ReactNode }) {
  return (
    <Card interactive={interactive} padded={false} className="@container">
      <div className="relative flex flex-col @md:flex-row">
        <div className="flex min-w-0 flex-1 flex-col gap-1 p-4 @md:p-5">{main}</div>

        <div
          aria-hidden="true"
          className="pointer-events-none relative h-0 text-line group-hover:text-ink @md:h-auto @md:w-0"
        >
          <div className="absolute inset-x-5 top-0 border-t border-dashed border-line @md:inset-x-auto @md:inset-y-5 @md:left-0 @md:border-t-0 @md:border-l" />
          <span className={`${notch} ${notchStart}`} />
          <span className={`${notch} ${notchEnd}`} />
        </div>

        <div className="flex flex-col justify-center gap-2 rounded-b-[3px] bg-canvas/60 p-4 @md:w-64 @md:rounded-r-[3px] @md:rounded-bl-none @md:p-5">
          {stub}
        </div>
      </div>
    </Card>
  );
}

// Shown while trips load: the same ticket, with blank bars where the text goes.
// Each bar sits in a box with the real text's line height, so nothing moves when
// the trips arrive.
export function BoardingPassSkeleton() {
  return (
    <Ticket
      main={
        <>
          <span className="h-3 w-8 rounded bg-canvas" />
          <span className={`${nameClass} flex h-[1.25em] items-center`}>
            <span className="h-[0.6em] w-[7em] max-w-full rounded bg-canvas" />
          </span>
        </>
      }
      stub={
        <>
          <div className="flex h-6 items-center gap-3">
            <span className="flex-1 border-t-2 border-dashed border-line" />
            <span className="h-3 w-28 rounded bg-line/60" />
          </div>
          <span className="flex h-4 items-center self-end">
            <span className="h-3 w-14 rounded bg-line/60" />
          </span>
        </>
      }
    />
  );
}
