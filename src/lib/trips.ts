// What a trip is, and the rules for packing it. Where trips are kept is storage.ts.

export const SECTIONS = [
  { value: "clothes", label: "Clothes" },
  { value: "toiletries", label: "Toiletries" },
  { value: "tech", label: "Tech" },
  { value: "documents", label: "Documents" },
  { value: "other", label: "Other" },
] as const;

export type Section = (typeof SECTIONS)[number]["value"];

export type Item = {
  id: string;
  name: string;
  section: Section;
  packed: boolean;
  isNew: boolean; // added after a full pack, cleared on the next full pack
  createdAt: string; // the order items were added in; Undo puts an item back with it
};

// Where a trip is going, from Open-Meteo's place search. Only the place is saved,
// never its forecast.
export type Destination = {
  name: string;
  country: string | null;
  latitude: number;
  longitude: number;
  timezone: string | null;
};

export type Trip = {
  id: string;
  name: string;
  destination: Destination | null;
  items: Item[]; // in the order they were added
  lastPackedAt: string | null; // set when every item is ticked
  promptDismissedAt: string | null; // "Packing for a new trip?" answered
  ticksClearedAt: string | null; // ticks cleared for a new trip
  departsOn: string | null; // "2026-10-30": the day it leaves, on the person's calendar
  updatedAt: string; // any change to the trip or its items; sorts My trips
};

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

// Whether a change to a trip's items is a full pack: the change that makes the list
// fully packed (never a page load). A full pack records lastPackedAt and, for a new
// trip, clears the New marks. Null when the change isn't one.
export function fullPack(trip: Trip, items: Item[]): { clearsNew: boolean } | null {
  if (isAllPacked(trip.items) || !isAllPacked(items)) return null;
  return { clearsNew: isNewTripPack(trip) };
}

export const MAX_ITEM_NAME = 60;

// Trims and collapses inner spaces: "  Phone   charger " → "Phone charger".
export function cleanName(name: string) {
  return name.trim().replace(/\s+/g, " ");
}

// The item already called this, ignoring case and extra spaces.
export function itemNamed(name: string, items: Item[]) {
  const clean = cleanName(name).toLowerCase();
  return items.find((item) => cleanName(item.name).toLowerCase() === clean);
}

// Returns what to do next, or null when the name can be added.
export function itemNameError(name: string, items: Item[]): string | null {
  const clean = cleanName(name);
  if (clean === "") return "Enter an item name";
  if (clean.length > MAX_ITEM_NAME) return `Keep it under ${MAX_ITEM_NAME} characters`;
  const existing = itemNamed(clean, items);
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
// A free name for a copy: "Beach weekend copy", then "Beach weekend copy 2" and so on.
// A name too long to take it loses its last words, not part of one.
export function copyName(name: string, trips: Trip[]) {
  const clean = cleanName(name);
  for (let n = 1; ; n++) {
    const suffix = n === 1 ? " copy" : ` copy ${n}`;
    const room = MAX_TRIP_NAME - suffix.length;
    const fits = clean.slice(0, room);
    const cut = clean.length <= room || clean[room] === " " ? fits : fits.replace(/\s+\S*$/, "") || fits;
    const candidate = `${cut.trimEnd()}${suffix}`;
    if (!tripNameProblem(candidate, trips)) return candidate;
  }
}

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
