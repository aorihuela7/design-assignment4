import { SECTIONS, type Item, type Section, type StoredData, type Trip } from "./storage";

export type SectionGroup = { section: Section; label: string; items: Item[] };

// Sections in their fixed order, empty ones left out. New items come first in
// each section, otherwise items keep the order they were added in.
export function groupBySection(items: Item[]): SectionGroup[] {
  return SECTIONS.map(({ value, label }) => {
    const inSection = items.filter((item) => item.section === value);
    return {
      section: value,
      label,
      items: [...inSection.filter((item) => item.isNew), ...inSection.filter((item) => !item.isNew)],
    };
  }).filter((group) => group.items.length > 0);
}

export function isAllPacked(items: Item[]) {
  return items.length > 0 && items.every((item) => item.packed);
}

// A full pack after the ticks were cleared is a new trip's: only then do the New
// marks (things forgotten last time) clear. Re-ticking within the same trip keeps them.
function isNewTripPack(trip: Trip) {
  if (!trip.ticksClearedAt) return false;
  return !trip.lastPackedAt || Date.parse(trip.ticksClearedAt) > Date.parse(trip.lastPackedAt);
}

// Replaces one trip's items and stamps updatedAt, ready to save. On the change that
// makes the list fully packed (not on page loads), it also records lastPackedAt and,
// for a new trip, clears the New marks.
export function withItems(
  data: StoredData,
  tripId: string,
  items: Item[],
  changes: Partial<Pick<Trip, "promptDismissedAt" | "ticksClearedAt">> = {},
): StoredData {
  const now = new Date().toISOString();
  return {
    ...data,
    trips: data.trips.map((t) => {
      if (t.id !== tripId) return t;
      const trip = { ...t, ...changes };
      if (!isAllPacked(trip.items) && isAllPacked(items)) {
        return {
          ...trip,
          items: isNewTripPack(trip) ? items.map((item) => ({ ...item, isNew: false })) : items,
          lastPackedAt: now,
          updatedAt: now,
        };
      }
      return { ...trip, items, updatedAt: now };
    }),
  };
}

export const MAX_ITEM_NAME = 60;

// Trims and collapses inner spaces: "  Phone   charger " → "Phone charger".
export function cleanName(name: string) {
  return name.trim().replace(/\s+/g, " ");
}

// Returns what to do next, or null when the name can be added.
export function itemNameError(name: string, items: Item[]): string | null {
  const clean = cleanName(name);
  if (clean === "") return "Enter an item name";
  if (clean.length > MAX_ITEM_NAME) return `Keep it under ${MAX_ITEM_NAME} characters`;
  const existing = items.find((item) => cleanName(item.name).toLowerCase() === clean.toLowerCase());
  if (existing) {
    const section = SECTIONS.find((s) => s.value === existing.section)?.label ?? "Other";
    return `${existing.name} is already in ${section}. Tick it there or use another name`;
  }
  return null;
}

// Unticks everything for the next trip; New marks and lastPackedAt stay.
export function untickAll(items: Item[]): Item[] {
  return items.map((item) => ({ ...item, packed: false }));
}

export const TWO_DAYS = 2 * 24 * 60 * 60 * 1000;

// "Packing for a new trip?": packed over 2 days ago, some ticks still on, and not
// answered since that pack.
export function shouldAskNewTrip(trip: Trip, now: number) {
  if (!trip.lastPackedAt) return false;
  const lastPacked = Date.parse(trip.lastPackedAt);
  if (now - lastPacked <= TWO_DAYS) return false;
  if (!trip.items.some((item) => item.packed)) return false;
  return !trip.promptDismissedAt || Date.parse(trip.promptDismissedAt) < lastPacked;
}

// "Welcome back": lists packed before, when nothing changed for over 2 days.
// Returns how many lists are ready to pack again, or 0 when the line shouldn't show.
export function welcomeBackCount(trips: Trip[], now: number) {
  const packedBefore = trips.filter((trip) => trip.lastPackedAt).length;
  if (packedBefore === 0) return 0;
  const lastActivity = Math.max(...trips.map((trip) => Date.parse(trip.updatedAt)));
  return now - lastActivity > TWO_DAYS ? packedBefore : 0;
}

export const MAX_TRIP_NAME = 40;

export type TripNameProblem = { kind: "empty" } | { kind: "long" } | { kind: "duplicate"; trip: Trip };

// Why a trip name can't be used, or null when it can.
export function tripNameProblem(name: string, trips: Trip[]): TripNameProblem | null {
  const clean = cleanName(name);
  if (clean === "") return { kind: "empty" };
  if (clean.length > MAX_TRIP_NAME) return { kind: "long" };
  const existing = trips.find((trip) => cleanName(trip.name).toLowerCase() === clean.toLowerCase());
  return existing ? { kind: "duplicate", trip: existing } : null;
}

// The view transition name shared by a trip's card title and its page title, so
// opening a trip morphs one into the other.
export function tripTitleTransition(tripId: string) {
  return `trip-title-${tripId}`;
}
