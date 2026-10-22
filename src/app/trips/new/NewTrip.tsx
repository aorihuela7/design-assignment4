"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Button, ButtonLink } from "@/components/Button";
import { Card } from "@/components/Card";
import { TextField } from "@/components/Field";
import { Page } from "@/components/Page";
import { StorageNotice } from "@/components/StorageNotice";
import { tripNameMessage } from "@/components/tripNameMessage";
import { createStarterTrips } from "@/lib/starters";
import { createId, createIfMissing, updateData, useStorage } from "@/lib/storage";
import { cleanName, tripNameProblem } from "@/lib/trips";

export function NewTrip() {
  const router = useRouter();
  const storage = useStorage();
  const [name, setName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  // No errors before the first submit; after it, the error follows what's typed.
  const [attempted, setAttempted] = useState(false);

  // Arriving here first still counts as a first visit: the starter lists come too.
  useEffect(() => {
    createIfMissing(createStarterTrips);
  }, []);

  const problem = storage.status === "ready" ? storage.problem : null;
  const trips = storage.status === "ready" ? (storage.data?.trips ?? []) : [];
  const nameProblem = attempted ? tripNameProblem(name, trips) : null;

  function submit(event: FormEvent) {
    event.preventDefault();
    if (storage.status !== "ready" || !storage.data) return;
    if (tripNameProblem(name, storage.data.trips)) {
      setAttempted(true); // keeps exactly what was typed
      inputRef.current?.focus();
      return;
    }
    const clean = cleanName(name);
    const id = createId();
    const trip = { id, name: clean, items: [], lastPackedAt: null, promptDismissedAt: null, ticksClearedAt: null, updatedAt: new Date().toISOString() };
    updateData((data) => ({ ...data, trips: [...data.trips, trip] }));
    // The empty list focuses its Add item field.
    router.push(`/trips/${id}`);
  }

  return (
    <Page title="New trip" back={{ href: "/", label: "Back to My trips" }}>
      <StorageNotice problem={problem} />
      {/* Data from a newer version must not be written over. */}
      {/* One short field: a readable width, not the full page. */}
      {problem !== "newer" && (
        <Card className="w-full max-w-xl">
          <form noValidate onSubmit={submit} className="flex flex-col gap-4">
            <TextField
              ref={inputRef}
              label="Trip name"
              error={nameProblem ? tripNameMessage(nameProblem) : undefined}
              placeholder="e.g. Beach weekend"
              autoComplete="off"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button type="submit" variant="primary">
                Create trip
              </Button>
              <ButtonLink href="/">Cancel</ButtonLink>
            </div>
          </form>
        </Card>
      )}
    </Page>
  );
}
