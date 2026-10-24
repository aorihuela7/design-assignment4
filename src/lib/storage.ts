import { useAuth } from "@clerk/nextjs";
import { PostgrestError, type SupabaseClient } from "@supabase/supabase-js";
import { useEffect, useSyncExternalStore } from "react";
import { starterTrips } from "./starters";
import { createSupabaseClient } from "./supabase";
import {
  fullPack,
  itemNamed,
  tripNameProblem,
  untickAll,
  type Destination,
  type Item,
  type Section,
  type Trip,
} from "./trips";

// Where trips are kept: Supabase, read and written from the browser as the signed-in
// person, so row-level security only ever returns or changes their own rows. The page
// keeps them in memory too, so moving between pages doesn't load them again.

export type StorageState =
  | { status: "loading" }
  // Loading failed: the page says so, with Try again.
  | { status: "failed" }
  | { status: "ready"; trips: Trip[] };

// What a form gets back. "duplicate": the name is taken, by a trip or item the page
// now shows. "failed": anything else. Either way the form keeps what was typed.
export type SaveResult = "saved" | "duplicate" | "failed";

// A new trip's or item's id, made here so the page can use it while the row saves.
// (randomUUID needs https or localhost, where the app and Clerk run.)
export function createId() {
  return crypto.randomUUID();
}

// Rows as Supabase returns them. Trips come in the order they were made (so their
// codes stay put), and items in the order they were added.
const ITEM_COLUMNS = "id, name, section, packed, is_new, created_at";
const TRIP_COLUMNS = `id, name, destination_name, destination_country, latitude, longitude, timezone, last_packed_at, prompt_dismissed_at, ticks_cleared_at, departs_on, updated_at, items (${ITEM_COLUMNS})`;

type ItemRow = { id: string; name: string; section: Section; packed: boolean; is_new: boolean; created_at: string };

type TripRow = {
  id: string;
  name: string;
  destination_name: string | null;
  destination_country: string | null;
  latitude: number | null;
  longitude: number | null;
  timezone: string | null;
  last_packed_at: string | null;
  prompt_dismissed_at: string | null;
  ticks_cleared_at: string | null;
  departs_on: string | null;
  updated_at: string;
  items: ItemRow[];
};

function toItem(row: ItemRow): Item {
  return {
    id: row.id,
    name: row.name,
    section: row.section,
    packed: row.packed,
    isNew: row.is_new,
    createdAt: row.created_at,
  };
}

function toTrip(row: TripRow): Trip {
  return {
    id: row.id,
    name: row.name,
    // All or nothing, as the database checks.
    destination:
      row.destination_name !== null && row.latitude !== null && row.longitude !== null
        ? {
            name: row.destination_name,
            country: row.destination_country,
            latitude: row.latitude,
            longitude: row.longitude,
            timezone: row.timezone,
          }
        : null,
    items: row.items.map(toItem),
    lastPackedAt: row.last_packed_at,
    promptDismissedAt: row.prompt_dismissed_at,
    ticksClearedAt: row.ticks_cleared_at,
    departsOn: row.departs_on,
    updatedAt: row.updated_at,
  };
}

async function fetchTrips(db: SupabaseClient) {
  const { data } = await db
    .from("trips")
    .select(TRIP_COLUMNS)
    .order("created_at")
    .order("created_at", { referencedTable: "items" })
    .throwOnError();
  return (data as TripRow[]).map(toTrip);
}

// The store: one signed-in person and their trips.

type Session = { userId: string; db: SupabaseClient };
type Change = (trips: Trip[]) => Trip[];

let session: Session | null = null;
let status: "loading" | "failed" | "ready" = "loading";
// As last loaded, plus every change saved since.
let saved: Trip[] = [];
// Changes already on screen and still saving, applied over the saved trips in order.
let pending: Change[] = [];
// Writes go one at a time, in the order they were made, so none overtakes another.
let queue: Promise<unknown> = Promise.resolve();

type Snapshot = { userId: string | null; state: StorageState };
const LOADING: StorageState = { status: "loading" };
const SERVER_SNAPSHOT: Snapshot = { userId: null, state: LOADING };
let snapshot = SERVER_SNAPSHOT;
const listeners = new Set<() => void>();

function shownTrips() {
  return pending.reduce((trips, change) => change(trips), saved);
}

function publish() {
  snapshot = {
    userId: session?.userId ?? null,
    state: status === "ready" ? { status, trips: shownTrips() } : { status },
  };
  listeners.forEach((listener) => listener());
}

// A new person signed in (or out): forget the last person's trips, then load theirs.
function connect(userId: string | null, getToken: () => Promise<string | null>) {
  if ((session?.userId ?? null) === userId) return;
  session = userId ? { userId, db: createSupabaseClient(getToken) } : null;
  status = "loading";
  saved = [];
  pending = [];
  publish();
  if (session) void load(session);
}

// No trips: a first sign-in, or every trip deleted. Only the profile tells them apart.
async function hasProfile(db: SupabaseClient) {
  const { data } = await db.from("profiles").select("user_id").maybeSingle().throwOnError();
  return data !== null;
}

async function load(owner: Session) {
  try {
    let trips = await fetchTrips(owner.db);
    // First sign-in: the starter trips, made with the profile in one transaction. It's
    // safe to call twice (two tabs at once): the second call does nothing.
    if (trips.length === 0 && !(await hasProfile(owner.db))) {
      await owner.db.rpc("add_starter_trips", { starters: starterTrips() }).throwOnError();
      trips = await fetchTrips(owner.db);
    }
    if (session !== owner) return;
    saved = trips;
    status = "ready";
  } catch (error) {
    if (session !== owner) return;
    console.error(error);
    status = "failed";
  }
  publish();
}

// Try again, after loading failed.
export function reload() {
  if (!session || status !== "failed") return;
  status = "loading";
  publish();
  void load(session);
}

// Runs a write after the ones before it. Skipped if someone else signed in meanwhile.
function enqueue<T>(write: (owner: Session) => Promise<T>, skipped: T): Promise<T> {
  const owner = session;
  const run = queue.then(() => (owner && session === owner ? write(owner) : skipped));
  queue = run.catch(() => undefined);
  return run;
}

async function succeeds(write: () => PromiseLike<unknown>) {
  try {
    await write();
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
}

// Why a form's save failed. A name that's taken (unique_violation) gets the form's own
// message, once the trip or item holding it is on screen: it may have been made in
// another tab or on another device, so the trips are loaded again first.
async function whyNotSaved(owner: Session, error: unknown, isTaken: (trips: Trip[]) => boolean) {
  console.error(error);
  if (!(error instanceof PostgrestError && error.code === "23505")) return "failed";
  try {
    const trips = await fetchTrips(owner.db);
    commit(owner, () => trips);
  } catch {
    return "failed";
  }
  return session === owner && isTaken(shownTrips()) ? "duplicate" : "failed";
}

// A change that has saved goes on screen, unless someone else signed in meanwhile.
function commit(owner: Session, change: Change) {
  if (session !== owner) return;
  saved = change(saved);
  publish();
}

// Shows a change straight away and saves it in the background. If saving fails, the
// change comes off the screen again. Resolves to whether it saved.
function saveInBackground(change: Change, write: (db: SupabaseClient) => Promise<unknown>) {
  if (!session) return Promise.resolve(false);
  pending = [...pending, change];
  publish();
  return enqueue(async (owner) => {
    const ok = await succeeds(() => write(owner.db));
    pending = pending.filter((other) => other !== change);
    commit(owner, ok ? change : (trips) => trips);
    return ok;
  }, false);
}

// Changes one trip, and counts as a change to it (updatedAt), as the database's
// triggers do. It applies to whatever the trip holds when it runs, so a change that
// fails to save can come off the screen without taking later ones with it.
function onTrip(
  tripId: string,
  fields: Partial<Omit<Trip, "id" | "items">>,
  items: (items: Item[]) => Item[] = (current) => current,
): Change {
  const updatedAt = new Date().toISOString();
  return (trips) =>
    trips.map((trip) => (trip.id === tripId ? { ...trip, ...fields, items: items(trip.items), updatedAt } : trip));
}

type TripFields = Partial<Pick<Trip, "lastPackedAt" | "promptDismissedAt" | "ticksClearedAt">>;

// A change to a trip's items, shown straight away: the items' write, then what it
// changes on the trip. A full pack also records when, and may clear the New marks.
function changeItems(
  tripId: string,
  update: (items: Item[]) => Item[],
  writeItems: ((db: SupabaseClient) => PromiseLike<unknown>) | null,
  fields: TripFields = {},
) {
  const trip = shownTrips().find((t) => t.id === tripId);
  if (!trip) return Promise.resolve(false);
  const pack = fullPack({ ...trip, ...fields }, update(trip.items));
  const tripFields = pack ? { ...fields, lastPackedAt: new Date().toISOString() } : fields;
  const clearsNew = pack?.clearsNew ?? false;
  const change = onTrip(tripId, tripFields, (items) =>
    clearsNew ? update(items).map((item) => ({ ...item, isNew: false })) : update(items),
  );
  return saveInBackground(change, async (db) => {
    if (writeItems) await writeItems(db);
    if (Object.keys(tripFields).length > 0) {
      // Fields left undefined aren't sent.
      await db
        .from("trips")
        .update({
          last_packed_at: tripFields.lastPackedAt,
          prompt_dismissed_at: tripFields.promptDismissedAt,
          ticks_cleared_at: tripFields.ticksClearedAt,
        })
        .eq("id", tripId)
        .throwOnError();
    }
    if (clearsNew) {
      await db.from("items").update({ is_new: false }).eq("trip_id", tripId).eq("is_new", true).throwOnError();
    }
  });
}

// Trips

export function createTrip(id: string, name: string) {
  return enqueue<SaveResult>(async (owner) => {
    try {
      const { data } = await owner.db.from("trips").insert({ id, name }).select(TRIP_COLUMNS).single().throwOnError();
      const trip = toTrip(data as TripRow);
      commit(owner, (trips) => [...trips, trip]);
      return "saved";
    } catch (error) {
      return whyNotSaved(owner, error, (trips) => tripNameProblem(name, trips)?.kind === "duplicate");
    }
  }, "failed");
}

export function renameTrip(tripId: string, name: string) {
  return enqueue<SaveResult>(async (owner) => {
    try {
      await owner.db.from("trips").update({ name }).eq("id", tripId).throwOnError();
      commit(owner, onTrip(tripId, { name }));
      return "saved";
    } catch (error) {
      const others = (trips: Trip[]) => trips.filter((trip) => trip.id !== tripId);
      return whyNotSaved(owner, error, (trips) => tripNameProblem(name, others(trips))?.kind === "duplicate");
    }
  }, "failed");
}

// Saves where a trip is going, or removes it with null.
export function setDestination(tripId: string, destination: Destination | null) {
  return enqueue(async (owner) => {
    const ok = await succeeds(() =>
      owner.db
        .from("trips")
        .update({
          destination_name: destination?.name ?? null,
          destination_country: destination?.country ?? null,
          latitude: destination?.latitude ?? null,
          longitude: destination?.longitude ?? null,
          timezone: destination?.timezone ?? null,
        })
        .eq("id", tripId)
        .throwOnError(),
    );
    if (ok) commit(owner, onTrip(tripId, { destination }));
    return ok;
  }, false);
}

// A copy of a trip to pack from again: the name given, the same destination (not its
// departure date: a copy is for another time), and every item unticked and no longer
// New, in the same order. Two writes, the trip and
// then its items; if the items don't save, the copy is deleted again, so no empty
// trip is left behind.
export function duplicateTrip(sourceId: string, id: string, name: string) {
  return enqueue<SaveResult>(async (owner) => {
    const source = shownTrips().find((trip) => trip.id === sourceId);
    if (!source) return "failed";
    const { destination } = source;
    try {
      await owner.db
        .from("trips")
        .insert({
          id,
          name,
          destination_name: destination?.name ?? null,
          destination_country: destination?.country ?? null,
          latitude: destination?.latitude ?? null,
          longitude: destination?.longitude ?? null,
          timezone: destination?.timezone ?? null,
        })
        .throwOnError();
    } catch (error) {
      return whyNotSaved(owner, error, (trips) => tripNameProblem(name, trips)?.kind === "duplicate");
    }
    try {
      if (source.items.length > 0) {
        // Times 1 ms apart keep the items in the order they're listed in.
        const start = Date.now();
        await owner.db
          .from("items")
          .insert(
            source.items.map((item, i) => ({
              trip_id: id,
              name: item.name,
              section: item.section,
              packed: false,
              is_new: false,
              created_at: new Date(start + i).toISOString(),
            })),
          )
          .throwOnError();
      }
      const trips = await fetchTrips(owner.db);
      commit(owner, () => trips);
      return "saved";
    } catch (error) {
      console.error(error);
      await owner.db.from("trips").delete().eq("id", id);
      return "failed";
    }
  }, "failed");
}

// Sets the day a trip leaves ("2026-10-30"), or clears it with null.
export function setDeparture(tripId: string, departsOn: string | null) {
  return enqueue(async (owner) => {
    const ok = await succeeds(() => owner.db.from("trips").update({ departs_on: departsOn }).eq("id", tripId).throwOnError());
    if (ok) commit(owner, onTrip(tripId, { departsOn }));
    return ok;
  }, false);
}

// Its items go with it (on delete cascade).
export function deleteTrip(tripId: string) {
  return enqueue(async (owner) => {
    const ok = await succeeds(() => owner.db.from("trips").delete().eq("id", tripId).throwOnError());
    if (ok) commit(owner, (trips) => trips.filter((trip) => trip.id !== tripId));
    return ok;
  }, false);
}

// "Add the starter trips back", after every trip was deleted. Times 1 ms apart keep the
// trips, and the items in each, in the order they're listed in.
export function addStarterTripsBack() {
  return enqueue(async (owner) => {
    let trips: Trip[] = [];
    const ok = await succeeds(async () => {
      const starters = starterTrips();
      const start = Date.now();
      const at = (ms: number) => new Date(start + ms).toISOString();
      const { data } = await owner.db
        .from("trips")
        .insert(starters.map((starter, i) => ({ name: starter.name, created_at: at(i) })))
        .select("id, name")
        .throwOnError();
      const ids = new Map((data as { id: string; name: string }[]).map((trip) => [trip.name, trip.id]));
      await owner.db
        .from("items")
        .insert(
          starters.flatMap((starter) =>
            starter.items.map((item, i) => ({ ...item, trip_id: ids.get(starter.name), created_at: at(i) })),
          ),
        )
        .throwOnError();
      trips = await fetchTrips(owner.db);
    });
    if (ok) commit(owner, () => trips);
    return ok;
  }, false);
}

// Items

// Saved first, then shown with the time Supabase gave it, which Undo keeps.
export function addItem(tripId: string, item: Omit<Item, "createdAt">) {
  return enqueue<SaveResult>(async (owner) => {
    try {
      const { data } = await owner.db
        .from("items")
        .insert({
          id: item.id,
          trip_id: tripId,
          name: item.name,
          section: item.section,
          packed: item.packed,
          is_new: item.isNew,
        })
        .select(ITEM_COLUMNS)
        .single()
        .throwOnError();
      const added = toItem(data as ItemRow);
      commit(owner, onTrip(tripId, {}, (items) => [...items, added]));
      return "saved";
    } catch (error) {
      const items = (trips: Trip[]) => trips.find((trip) => trip.id === tripId)?.items ?? [];
      return whyNotSaved(owner, error, (trips) => itemNamed(item.name, items(trips)) !== undefined);
    }
  }, "failed");
}

export function setPacked(tripId: string, itemId: string, packed: boolean) {
  return changeItems(
    tripId,
    (items) => items.map((item) => (item.id === itemId ? { ...item, packed } : item)),
    (db) => db.from("items").update({ packed }).eq("id", itemId).throwOnError(),
  );
}

export function removeItem(tripId: string, itemId: string) {
  return changeItems(
    tripId,
    (items) => items.filter((item) => item.id !== itemId),
    (db) => db.from("items").delete().eq("id", itemId).throwOnError(),
  );
}

// Renames an item or moves it to another section. Saved first, then shown, like
// adding one, so the form keeps what was typed if it fails. A name another item has
// (in another tab, say) comes back as a duplicate.
export function editItem(tripId: string, itemId: string, change: { name: string; section: Section }) {
  return enqueue<SaveResult>(async (owner) => {
    try {
      await owner.db
        .from("items")
        .update({ name: change.name, section: change.section })
        .eq("id", itemId)
        .throwOnError();
      commit(owner, onTrip(tripId, {}, (items) => items.map((item) => (item.id === itemId ? { ...item, ...change } : item))));
      return "saved";
    } catch (error) {
      const others = (trips: Trip[]) => trips.find((trip) => trip.id === tripId)?.items.filter((item) => item.id !== itemId) ?? [];
      return whyNotSaved(owner, error, (trips) => itemNamed(change.name, others(trips)) !== undefined);
    }
  }, "failed");
}

// Undo: puts a removed item back with its id and the time it was first added, so it
// keeps its place in the list.
export function restoreItem(tripId: string, item: Item, index: number) {
  return changeItems(
    tripId,
    (items) => (items.some((i) => i.id === item.id) ? items : [...items.slice(0, index), item, ...items.slice(index)]),
    (db) =>
      db
        .from("items")
        .insert({
          id: item.id,
          trip_id: tripId,
          name: item.name,
          section: item.section,
          packed: item.packed,
          is_new: item.isNew,
          created_at: item.createdAt,
        })
        .throwOnError(),
  );
}

function untick(tripId: string) {
  return (db: SupabaseClient) => db.from("items").update({ packed: false }).eq("trip_id", tripId).eq("packed", true).throwOnError();
}

export function clearTicks(tripId: string) {
  return changeItems(tripId, untickAll, untick(tripId), { ticksClearedAt: new Date().toISOString() });
}

export function answerNewTrip(tripId: string, clear: boolean) {
  const now = new Date().toISOString();
  return clear
    ? changeItems(tripId, untickAll, untick(tripId), { promptDismissedAt: now, ticksClearedAt: now })
    : changeItems(tripId, (items) => items, null, { promptDismissedAt: now });
}

// React binding. The server and the first client render both see "loading", so
// there is no hydration mismatch; trips load only after mount.

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useStorage(): StorageState {
  const { userId, getToken } = useAuth();
  useEffect(() => {
    connect(userId ?? null, getToken);
  }, [userId, getToken]);
  const current = useSyncExternalStore(
    subscribe,
    () => snapshot,
    () => SERVER_SNAPSHOT,
  );
  // Until connect() has run, the trips in memory may be someone else's: never show them.
  return current.userId === userId ? current.state : LOADING;
}
