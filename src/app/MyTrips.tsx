"use client";

import { useEffect, useRef, useState } from "react";
import { BoardingPassCard, BoardingPassSkeleton } from "@/components/BoardingPassCard";
import { Button, ButtonLink } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { Notice } from "@/components/Notice";
import { Page } from "@/components/Page";
import { StorageNotice } from "@/components/StorageNotice";
import { SectionHeading } from "@/components/SectionHeading";
import { uniqueCodes } from "@/lib/codes";
import { clearFlash, peekFlash } from "@/lib/flash";
import { createStarterTrips, isUntouchedStarters } from "@/lib/starters";
import { createIfMissing, updateData, useStorage, type Trip } from "@/lib/storage";
import { welcomeBackCount } from "@/lib/trips";
import { useNow } from "@/lib/useNow";

function newestFirst(a: Trip, b: Trip) {
  return Date.parse(b.updatedAt) - Date.parse(a.updatedAt);
}

function addStartersBack() {
  updateData((data) => ({ ...data, trips: [...data.trips, ...createStarterTrips()] }));
  // The button is gone now; move focus to the first list instead of losing it.
  requestAnimationFrame(() => document.querySelector<HTMLElement>("[data-card-link]")?.focus());
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
  const [flash] = useState(peekFlash);
  const flashRef = useRef<HTMLDivElement>(null);
  const ready = storage.status === "ready" && storage.data !== null;
  useEffect(() => {
    clearFlash();
  }, []);
  useEffect(() => {
    if (ready) flashRef.current?.focus();
  }, [ready]);

  // First visit: the lists are there right away, nothing asked first.
  useEffect(() => {
    createIfMissing(createStarterTrips);
  }, []);

  // Saved by a newer version of the app: show nothing that could write over it.
  if (storage.status === "ready" && storage.problem === "newer") {
    return (
      <Page title="My trips">
        <StorageNotice problem="newer" />
      </Page>
    );
  }

  // Also covers the moment before the starter lists are created.
  if (storage.status === "loading" || storage.data === null) {
    return (
      <Page title="My trips">
        <Loading />
      </Page>
    );
  }

  const { data } = storage;
  const { trips } = data;
  // Codes come from storage order, so they stay put when the sort changes.
  const codes = uniqueCodes(trips);
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
      <StorageNotice problem={storage.problem} />

      {trips.length === 0 ? (
        // Only after the person deleted every list; starters never come back on their own.
        <EmptyState plane>
          <div className="flex flex-col gap-1">
            <SectionHeading>No trips yet</SectionHeading>
            <p className="text-muted">Make a list once and it’s ready for every trip after.</p>
          </div>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <ButtonLink variant="primary" href="/trips/new">
              New trip
            </ButtonLink>
            <Button onClick={addStartersBack}>Add the starter trips back</Button>
          </div>
        </EmptyState>
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
                <BoardingPassCard
                  name={trip.name}
                  code={codes.get(trip.id) ?? ""}
                  packed={trip.items.filter((item) => item.packed).length}
                  total={trip.items.length}
                  lastPackedAt={trip.lastPackedAt}
                  newCount={trip.items.filter((item) => item.isNew).length}
                  href={`/trips/${trip.id}`}
                  forgotHref={`/trips/${trip.id}?add=1`}
                />
              </li>
            ))}
          </ul>
        </>
      )}

      {storage.problem !== "blocked" && <p className="mt-auto text-sm text-muted">Saved on this device.</p>}
    </Page>
  );
}
