"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { PAGE_TITLE_ID } from "@/components/Header";
import { Page } from "@/components/Page";
import { StorageNotice } from "@/components/StorageNotice";
import { SectionHeading } from "@/components/SectionHeading";
import { formatDay } from "@/lib/dates";
import { setFlash } from "@/lib/flash";
import { createId, SECTIONS, updateData, useStorage, type Item, type Section, type Trip } from "@/lib/storage";
import { groupBySection, isAllPacked, shouldAskNewTrip, untickAll, withItems } from "@/lib/trips";
import { useNow } from "@/lib/useNow";
import { AddItemForm } from "./AddItemForm";
import { BACK_TO_MY_TRIPS, ListLoading } from "./ListLoading";
import { ItemRow, RemovedRow, UNDO_ROW_ID, undoHoldProps, type UndoHold } from "./ItemRow";
import { ProgressBar } from "./ProgressBar";
import { TripActions } from "./TripActions";

const COUNT_ID = "packed-count";
const UNDO_BAR_ID = "undo-bar";
// How long Undo stays after you move away from it.
const UNDO_MS = 3000;

// When Undo times out while focused, focus moves to the next item on screen
// (or the previous one, or the Add item field), so it's never lost.
function moveFocusOffUndo() {
  const row = document.getElementById(UNDO_ROW_ID)?.closest("li");
  const active = document.activeElement;
  if (!row || !(row.contains(active) || active?.id === UNDO_BAR_ID)) return null;
  const boxes = [...document.querySelectorAll<HTMLElement>("main input[type=checkbox]")];
  return (
    boxes.find((box) => row.compareDocumentPosition(box) & Node.DOCUMENT_POSITION_FOLLOWING) ??
    boxes.at(-1) ??
    document.querySelector<HTMLElement>("main form input")
  );
}

export function PackingList() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const storage = useStorage();
  const now = useNow();
  // Set while leaving a just-deleted trip, so the page doesn't flash "not found".
  const [deletedName, setDeletedName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  // The latest change, shown in the progress bar and read out politely. After a
  // removal it carries what's needed to undo it, until the next change.
  const [feedback, setFeedback] = useState<{ text: string | null; undo?: { item: Item; index: number } } | null>(
    null,
  );
  const setAnnouncement = (text: string) => setFeedback({ text });

  // Undo disappears UNDO_MS after a removal, counting again from when the pointer
  // or keyboard focus leaves it.
  const pendingId = feedback?.undo?.item.id ?? null;
  const [hold, setHold] = useState({ id: null as string | null, pointer: false, focus: false });
  const holdUndo: UndoHold = (reason, held) =>
    setHold((current) => ({
      ...(current.id === pendingId ? current : { pointer: false, focus: false }),
      id: pendingId,
      [reason]: held,
    }));
  const undoHeld = pendingId !== null && hold.id === pendingId && (hold.pointer || hold.focus);
  useEffect(() => {
    if (pendingId === null || undoHeld) return;
    const timer = setTimeout(() => {
      const next = moveFocusOffUndo();
      setFeedback((current) => (current?.undo?.item.id === pendingId ? null : current));
      if (next) requestAnimationFrame(() => next.focus());
    }, UNDO_MS);
    return () => clearTimeout(timer);
  }, [pendingId, undoHeld]);
  // The row just added or restored, so it can be highlighted where it lands.
  const [arrivedId, setArrivedId] = useState<string | null>(null);
  // The item the person just ticked, so only it plays the tick animation.
  const [justPackedId, setJustPackedId] = useState<string | null>(null);

  const trip = storage.status === "ready" ? storage.data?.trips.find((t) => t.id === id) : undefined;

  // The tab title names the list too, so the person knows where they are.
  const tabTitle =
    trip?.name ?? (storage.status === "ready" && storage.problem !== "newer" ? "Trip not found" : null);
  useEffect(() => {
    if (tabTitle) document.title = `${tabTitle} · Pack Again`;
  }, [tabTitle]);

  // Opens ready to type when the list is empty, or when asked with ?add=1
  // ("Forgot something? Add it" on My trips).
  const wantsAdd = useSearchParams().get("add") === "1";
  const isEmpty = trip?.items.length === 0;
  const hasTrip = Boolean(trip);
  // Otherwise focus starts on the list name, so the next Tab reaches "Back to My trips".
  // Only on arrival: later changes (like removing the last item) manage focus themselves.
  const arrived = useRef(false);
  useEffect(() => {
    if (!hasTrip || arrived.current) return;
    arrived.current = true;
    if (isEmpty || wantsAdd) inputRef.current?.focus();
    else document.getElementById(PAGE_TITLE_ID)?.focus({ preventScroll: true });
  }, [hasTrip, isEmpty, wantsAdd]);

  if (storage.status === "loading") return <ListLoading />;

  if (deletedName) {
    return <Page title={deletedName} back={BACK_TO_MY_TRIPS}>{null}</Page>;
  }

  // Saved by a newer version: nothing here can be shown or changed safely.
  if (storage.problem === "newer") {
    return (
      <Page title="Packing list" back={BACK_TO_MY_TRIPS}>
        <StorageNotice problem="newer" />
      </Page>
    );
  }

  // Unknown id: an old bookmark, a deleted list, or nothing saved yet.
  if (!storage.data || !trip) {
    return (
      <Page title="Trip not found" back={BACK_TO_MY_TRIPS}>
        <StorageNotice problem={storage.problem} />
        <Card>
          <p>This trip doesn’t exist anymore.</p>
        </Card>
      </Page>
    );
  }

  const tripId = trip.id;
  // Every change is saved straight away, applied to the latest saved items, so
  // quick successive changes or another open tab never get overwritten.
  type TripChanges = Partial<Pick<Trip, "promptDismissedAt" | "ticksClearedAt">>;
  const change = (update: (items: Item[]) => Item[], changes: TripChanges = {}) =>
    updateData((data) => {
      const latest = data.trips.find((t) => t.id === tripId);
      return latest ? withItems(data, tripId, update(latest.items), changes) : data;
    });
  const toggle = (id: string) => {
    const wasPacked = trip.items.find((item) => item.id === id)?.packed;
    change((items) => items.map((item) => (item.id === id ? { ...item, packed: !item.packed } : item)));
    setJustPackedId(wasPacked ? null : id);
    setFeedback(null);
    setArrivedId(null);
  };
  const allPacked = isAllPacked(trip.items);
  const add = (itemName: string, section: Section) => {
    // Added after a full pack ("Forgot something?"): saved as packed and New, so the
    // list stays All packed and the item stands out next trip.
    const id = createId();
    change((items) => {
      const forgot = isAllPacked(items);
      return [...items, { id, name: itemName, section, packed: forgot, isNew: forgot }];
    });
    setArrivedId(id);
    setJustPackedId(null);
    // Visible too: the new row may be far down the page.
    setAnnouncement(`Added ${itemName} to ${SECTIONS.find((s) => s.value === section)?.label ?? "Other"}`);
  };
  // A placeholder row with Undo takes the item's place (and focus) for a few seconds.
  const remove = (removed: Item) => {
    let index = trip.items.indexOf(removed);
    change((items) => {
      index = items.findIndex((item) => item.id === removed.id);
      return items.filter((item) => item.id !== removed.id);
    });
    setFeedback({ text: `Removed ${removed.name}`, undo: { item: removed, index } });
    setArrivedId(null);
    setJustPackedId(null);
    requestAnimationFrame(() => document.getElementById(UNDO_ROW_ID)?.focus());
  };
  // Puts the item back where it was and moves focus to it.
  const undoRemove = ({ item, index }: { item: Item; index: number }) => {
    change((items) =>
      items.some((i) => i.id === item.id) ? items : [...items.slice(0, index), item, ...items.slice(index)],
    );
    setAnnouncement(`Restored ${item.name}`);
    setArrivedId(item.id);
    requestAnimationFrame(() => document.getElementById(`item-${item.id}`)?.focus());
  };
  const focusCount = () => requestAnimationFrame(() => document.getElementById(COUNT_ID)?.focus());
  const clearTicks = () => {
    change(untickAll, { ticksClearedAt: new Date().toISOString() });
    setAnnouncement("Ticks cleared");
    focusCount();
  };
  // Both answers to "Packing for a new trip?" record the answer, so it isn't asked again
  // until the next full pack.
  const answerNewTrip = (clear: boolean) => {
    const now = new Date().toISOString();
    if (clear) change(untickAll, { promptDismissedAt: now, ticksClearedAt: now });
    else change((items) => items, { promptDismissedAt: now });
    if (clear) setAnnouncement("Ticks cleared");
    focusCount();
  };
  const rename = (name: string) => {
    const updatedAt = new Date().toISOString();
    updateData((data) => ({
      ...data,
      trips: data.trips.map((t) => (t.id === tripId ? { ...t, name, updatedAt } : t)),
    }));
    setAnnouncement(`Renamed to ${name}`);
  };
  // Back to My trips, which says what was deleted and puts focus on that message.
  const deleteTrip = () => {
    setDeletedName(trip.name);
    setFlash(`Deleted ${trip.name}`);
    updateData((data) => ({ ...data, trips: data.trips.filter((t) => t.id !== tripId) }));
    router.replace("/");
  };
  const packed = trip.items.filter((item) => item.packed).length;
  // The removed item stays on screen as a placeholder, in its old position.
  const pending = feedback?.undo;
  const rows = pending
    ? [...trip.items.slice(0, pending.index), pending.item, ...trip.items.slice(pending.index)]
    : trip.items;

  return (
    <Page title={trip.name} back={BACK_TO_MY_TRIPS}>
      <ProgressBar
        packed={packed}
        total={trip.items.length}
        countId={COUNT_ID}
        allPacked={allPacked}
        onForgot={() => {
          // Centered, so the sticky bar doesn't cover the field.
          inputRef.current?.scrollIntoView({ block: "center" });
          inputRef.current?.focus({ preventScroll: true });
        }}
        message={
          feedback?.text && (
            <>
              {/* One line, so the bar keeps its height; the full text is still read out. */}
              <p className="min-w-0 truncate">{feedback.text}</p>
              {feedback.undo && (
                <Button
                  id={UNDO_BAR_ID}
                  {...undoHoldProps(holdUndo)}
                  aria-label={`Undo removing ${feedback.undo.item.name}`}
                  onClick={() => feedback.undo && undoRemove(feedback.undo)}
                  className="shrink-0"
                >
                  Undo
                </Button>
              )}
            </>
          )
        }
      />
      <StorageNotice problem={storage.problem} />

      {/* In the page, not a modal, and it never takes focus on load. */}
      {now !== null && trip.lastPackedAt && shouldAskNewTrip(trip, now) && (
        <section role="region" aria-labelledby="new-trip-heading">
          <Card className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <SectionHeading id="new-trip-heading">Packing for a new trip?</SectionHeading>
              {/* Why it's asking. Only after mount, so the date can use the person's time zone. */}
              <p className="text-muted">Last packed {formatDay(trip.lastPackedAt)}.</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button onClick={() => answerNewTrip(true)}>Clear all ticks</Button>
              <Button onClick={() => answerNewTrip(false)}>Keep them</Button>
            </div>
          </Card>
        </section>
      )}

      <AddItemForm
        items={trip.items}
        onAdd={add}
        // Clears the bar's message; a pending Undo row stays, since nothing in the list changed.
        onError={() => setFeedback((current) => (current?.undo ? { ...current, text: null } : null))}
        inputRef={inputRef}
        forgotMode={allPacked}
      />

      {trip.items.length === 0 && !pending && (
        <Card>
          <p>Nothing here yet. Add your first item.</p>
        </Card>
      )}

      {groupBySection(rows).map((group) => (
        <section key={group.section} aria-labelledby={`section-${group.section}`} className="flex flex-col gap-2">
          <SectionHeading id={`section-${group.section}`}>
            {group.label}
          </SectionHeading>
          <Card padded={false}>
            <ul className="divide-y divide-line">
              {group.items.map((item) =>
                item.id === pending?.item.id ? (
                  <RemovedRow
                    key={`removed-${item.id}`}
                    name={item.name}
                    onUndo={() => undoRemove(pending)}
                    onHold={holdUndo}
                  />
                ) : (
                  <ItemRow
                    key={item.id}
                    item={item}
                    arrived={item.id === arrivedId}
                    justPacked={item.id === justPackedId}
                    onToggle={() => toggle(item.id)}
                    onRemove={() => remove(item)}
                  />
                ),
              )}
            </ul>
          </Card>
        </section>
      ))}

      <TripActions
        trip={trip}
        otherTrips={storage.data.trips.filter((t) => t.id !== tripId)}
        packed={packed}
        onClearTicks={clearTicks}
        onRename={rename}
        onDelete={deleteTrip}
      />
    </Page>
  );
}
