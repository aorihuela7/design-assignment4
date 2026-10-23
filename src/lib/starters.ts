import type { Section, Trip } from "./trips";

// Made again by "Add the starter trips back" on My trips, after every trip is deleted.
const STARTERS: { name: string; items: [Section, string][] }[] = [
  {
    name: "Weekend at parents'",
    items: [
      ["clothes", "Pyjamas"],
      ["clothes", "Underwear and socks"],
      ["clothes", "Change of clothes"],
      ["clothes", "Slippers"],
      ["toiletries", "Toothbrush and toothpaste"],
      ["toiletries", "Deodorant"],
      ["toiletries", "Medication"],
      ["toiletries", "Glasses or contacts"],
      ["tech", "Phone charger"],
      ["tech", "Headphones"],
      ["documents", "ID card"],
      ["other", "House keys"],
      ["other", "Containers to give back"],
      ["other", "Book"],
    ],
  },
  {
    name: "Conference trip",
    items: [
      ["clothes", "Smart outfits"],
      ["clothes", "Comfortable shoes"],
      ["clothes", "Underwear and socks"],
      ["clothes", "Light jacket"],
      ["toiletries", "Toothbrush and toothpaste"],
      ["toiletries", "Deodorant"],
      ["toiletries", "Medication"],
      ["tech", "Laptop and charger"],
      ["tech", "Phone charger"],
      ["tech", "Travel adapter"],
      ["tech", "Headphones"],
      ["documents", "Passport or ID"],
      ["documents", "Conference ticket"],
      ["other", "Notebook and pen"],
      ["other", "Water bottle"],
    ],
  },
  {
    name: "Beach weekend",
    items: [
      ["clothes", "Swimsuit"],
      ["clothes", "Flip-flops"],
      ["clothes", "Sun hat"],
      ["clothes", "Light clothes"],
      ["clothes", "Sweater for the evening"],
      ["toiletries", "Sunscreen"],
      ["toiletries", "After-sun"],
      ["toiletries", "Toothbrush and toothpaste"],
      ["tech", "Phone charger"],
      ["tech", "Power bank"],
      ["documents", "ID card"],
      ["other", "Beach towel"],
      ["other", "Sunglasses"],
      ["other", "Water bottle"],
      ["other", "Book"],
    ],
  },
];

// The starter trips as Supabase takes them: [{ name, items: [{ name, section }] }].
export function starterTrips() {
  return STARTERS.map((starter) => ({
    name: starter.name,
    items: starter.items.map(([section, name]) => ({ name, section })),
  }));
}

// True while the lists are exactly the starters: nothing ticked, added, removed or renamed.
export function isUntouchedStarters(trips: Trip[]) {
  return (
    trips.length === STARTERS.length &&
    STARTERS.every((starter) =>
      trips.some(
        (trip) =>
          trip.name === starter.name &&
          trip.lastPackedAt === null &&
          trip.promptDismissedAt === null &&
          trip.items.length === starter.items.length &&
          trip.items.every(
            (item, i) =>
              item.section === starter.items[i][0] &&
              item.name === starter.items[i][1] &&
              !item.packed &&
              !item.isNew,
          ),
      ),
    )
  );
}
