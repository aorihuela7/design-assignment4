// 3-letter airport-style codes for trips: from the destination when there is one,
// else from the trip's name.

const FILLER_WORDS = new Set(["A", "AN", "AND", "AT", "FOR", "IN", "OF", "ON", "THE", "TO"]);
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
// Letters NFD doesn't split into a plain letter and an accent.
const OTHER_LETTERS: Record<string, string> = { Æ: "AE", Ð: "D", Đ: "D", Ħ: "H", Ł: "L", Ø: "O", Œ: "OE", Þ: "TH" };

// The city's first 3 letters, without accents; spaces and punctuation don't count.
// "Madrid" → "MAD", "Málaga" → "MAL", "São Paulo" → "SAO", "New York" → "NEW".
// Null when the name has no letters to make one from.
export function destinationCode(city: string) {
  const letters = city
    .normalize("NFD")
    .toUpperCase()
    .replace(/[ÆÐĐĦŁØŒÞ]/g, (letter) => OTHER_LETTERS[letter])
    .replace(/[^A-Z]/g, "");
  return letters ? letters.slice(0, 3).padEnd(3, "X") : null;
}

type CodedTrip = { id: string; name: string; destination: { name: string } | null };

// Every trip's code: its destination's, so two trips to one city share it, or else
// the one from its name. Name codes are worked out among all the trips, so setting
// or removing one trip's destination never changes another trip's code.
export function tripCodes(trips: CodedTrip[]) {
  const byName = uniqueCodes(trips);
  return new Map(
    trips.map((trip) => [
      trip.id,
      (trip.destination && destinationCode(trip.destination.name)) ?? byName.get(trip.id) ?? "",
    ]),
  );
}

function words(name: string) {
  const all = name
    .normalize("NFD")
    .toUpperCase()
    .replace(/[^A-Z\s]/g, "")
    .split(/\s+/)
    .filter(Boolean);
  const kept = all.filter((word) => !FILLER_WORDS.has(word));
  return kept.length > 0 ? kept : all;
}

// "Beach weekend" → "BEW", "Weekend at parents'" → "WEP", "Lisbon" → "LIS". Always 3 letters.
export function tripCode(name: string) {
  const w = words(name);
  const code =
    w.length >= 3
      ? w.slice(0, 3).map((word) => word[0]).join("")
      : w.length === 2
        ? w[0].slice(0, 2) + w[1][0]
        : (w[0] ?? "").slice(0, 3);
  return code.padEnd(3, "X");
}

// Name codes unique among the given trips. Pass trips in a stable order (as stored),
// so a list keeps its code when the display order changes. On a clash the last
// letter changes: first to later letters of the name's last word, then A–Z.
function uniqueCodes(trips: { id: string; name: string }[]) {
  const used = new Set<string>();
  const codes = new Map<string, string>();
  for (const trip of trips) {
    const base = tripCode(trip.name);
    let code = base;
    if (used.has(code)) {
      const lastWord = words(trip.name).at(-1) ?? "";
      const letters = new Set(lastWord.slice(1) + ALPHABET);
      code =
        [...letters].map((letter) => base.slice(0, 2) + letter).find((c) => !used.has(c)) ??
        // 26 clashes on the same two letters: change the middle letter too.
        [...ALPHABET].flatMap((a) => [...ALPHABET].map((b) => base[0] + a + b)).find((c) => !used.has(c)) ??
        base;
    }
    used.add(code);
    codes.set(trip.id, code);
  }
  return codes;
}
