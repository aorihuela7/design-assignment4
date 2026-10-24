"use client";

import { useEffect, useRef, useState } from "react";
import { BoardingPassCard, BoardingPassSkeleton } from "@/components/BoardingPassCard";
import { Button, ButtonLink } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { ErrorMessage } from "@/components/ErrorMessage";
import { LoadFailed } from "@/components/LoadFailed";
import { Notice } from "@/components/Notice";
import { Page } from "@/components/Page";
import { SectionHeading } from "@/components/SectionHeading";
import { tripCodes } from "@/lib/codes";
import { useFlash } from "@/lib/flash";
import { isUntouchedStarters } from "@/lib/starters";
import { addStarterTripsBack, useStorage } from "@/lib/storage";
import { tripTitleTransition, welcomeBackCount, type Trip } from "@/lib/trips";
import { useForecast } from "@/lib/useForecast";
import { useNow } from "@/lib/useNow";
import { placeLabel } from "@/lib/weather";

function newestFirst(a: Trip, b: Trip) {
  return Date.parse(b.updatedAt) - Date.parse(a.updatedAt);
}

// Same on the server and the first client render, so hydration matches. Shaped
// like the page: the status sits where the New trip row goes, then three tickets.
function Loading() {
  return (
    <>
      <p role="status" className="flex min-h-11 items-center text-muted">
        Loading your trips…
      </p>
      <ul aria-hidden="true" className="flex flex-col gap-8">
        {[0, 1, 2].map((i) => (
          <li key={i}>
            <BoardingPassSkeleton />
          </li>
        ))}
      </ul>
    </>
  );
}

export function MyTrips() {
  const storage = useStorage();
  const now = useNow();

  // A message from the page before, like "Deleted Beach weekend". It takes focus
  // once, so it's read out and keyboard focus isn't lost.
  const flash = useFlash();
  const flashRef = useRef<HTMLDivElement>(null);
  const ready = storage.status === "ready";
  useEffect(() => {
    if (ready && flash) flashRef.current?.focus();
  }, [ready, flash]);

  if (storage.status === "failed") {
    return (
      <Page title="My trips">
        <LoadFailed />
      </Page>
    );
  }

  // Also covers making the starter trips, on a first sign-in.
  if (storage.status === "loading") {
    return (
      <Page title="My trips">
        <Loading />
      </Page>
    );
  }

  const { trips } = storage;
  // Codes come from storage order, so they stay put when the sort changes.
  const codes = tripCodes(trips);
  // One line under the title at most: welcome back wins over the starter line.
  const readyAgain = now === null ? 0 : welcomeBackCount(trips, now);
  const intro =
    readyAgain > 0
      ? `Welcome back. ${readyAgain} ${readyAgain === 1 ? "trip" : "trips"} ready to pack again.`
      : isUntouchedStarters(trips)
        ? "Starter trips. Open one, make it yours."
        : null;

  return (
    <Page title="My trips">
      {flash && (
        <div ref={flashRef} tabIndex={-1} className="outline-none">
          <Notice>{flash}</Notice>
        </div>
      )}

      {trips.length === 0 ? (
        <NoTrips />
      ) : (
        <>
          {/* The primary action stays at the top, beside the intro on wide screens. */}
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
            {intro && <p className="text-muted">{intro}</p>}
            {/* Right of the intro when there is one; otherwise left, so no empty gap. */}
            <ButtonLink variant="primary" href="/trips/new" className={intro ? "sm:ml-auto" : ""}>
              New trip
            </ButtonLink>
          </div>

          {/* 32px: notches stick out 10px on each side, so they never meet. */}
          <ul className="flex flex-col gap-8">
            {[...trips].sort(newestFirst).map((trip) => (
              <li key={trip.id}>
                <TripCard trip={trip} code={codes.get(trip.id) ?? ""} />
              </li>
            ))}
          </ul>
        </>
      )}
    </Page>
  );
}

// A trip's ticket, with today's weather where it's going: the same forecast its page
// shows, so opening the trip asks Open-Meteo nothing more.
function TripCard({ trip, code }: { trip: Trip; code: string }) {
  const today = useForecast(trip.destination);
  return (
    <BoardingPassCard
      name={trip.name}
      code={code}
      place={trip.destination ? placeLabel(trip.destination) : null}
      today={today}
      packed={trip.items.filter((item) => item.packed).length}
      total={trip.items.length}
      lastPackedAt={trip.lastPackedAt}
      newCount={trip.items.filter((item) => item.isNew).length}
      href={`/trips/${trip.id}`}
      forgotHref={`/trips/${trip.id}?add=1`}
      titleTransition={tripTitleTransition(trip.id)}
    />
  );
}

// Only after the person deleted every list; starters never come back on their own.
function NoTrips() {
  const [failed, setFailed] = useState(false);
  const adding = useRef(false);

  async function addBack() {
    if (adding.current) return;
    adding.current = true;
    const ok = await addStarterTripsBack();
    adding.current = false;
    setFailed(!ok);
    // The button is gone now; move focus to the first list instead of losing it.
    if (ok) requestAnimationFrame(() => document.querySelector<HTMLElement>("[data-card-link]")?.focus());
  }

  return (
    <EmptyState plane>
      <div className="flex flex-col gap-1">
        <SectionHeading>No trips yet</SectionHeading>
        <p className="text-muted">Make a list once and it’s ready for every trip after.</p>
      </div>
      <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
        <ButtonLink variant="primary" href="/trips/new">
          New trip
        </ButtonLink>
        <Button onClick={addBack}>Add the starter trips back</Button>
      </div>
      {failed && <ErrorMessage role="alert">Not added. Check your connection and try again</ErrorMessage>}
    </EmptyState>
  );
}
