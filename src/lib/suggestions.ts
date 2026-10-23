import { itemNamed, type Item, type Section } from "./trips";
import { weekday, type Day } from "./weather";

export type Suggestion = { name: string; section: Section; reason: string };

type Rule = {
  name: string;
  section: Section;
  // The day's value that calls for the item, or null when the day doesn't.
  find: (day: Day) => number | null;
  // One line saying why: "Rain likely on Saturday, 70% chance".
  reason: (when: string, value: number) => string;
};

// One item per kind of weather, for the first day it's forecast. The thresholds are
// simple on purpose, so each reason can say exactly why. Units as Open-Meteo sends
// them: °C, % and km/h.
const RULES: Rule[] = [
  {
    // Rain likely: a 50% chance or more.
    name: "Umbrella",
    section: "other",
    find: (day) => (day.rain !== null && day.rain >= 50 ? day.rain : null),
    reason: (when, rain) => `Rain likely ${when}, ${Math.round(rain)}% chance`,
  },
  {
    // Hot: a high of 28°C or more.
    name: "Light clothes",
    section: "clothes",
    find: (day) => (day.high !== null && day.high >= 28 ? day.high : null),
    reason: (when, high) => `Hot ${when}, up to ${Math.round(high)}°C`,
  },
  {
    // Cold: a low of 5°C or less.
    name: "Warm jacket",
    section: "clothes",
    find: (day) => (day.low !== null && day.low <= 5 ? day.low : null),
    reason: (when, low) => `Cold ${when}, down to ${Math.round(low)}°C`,
  },
  {
    // High UV: an index of 6 or more, "high" on the WHO scale.
    name: "Sunscreen",
    section: "toiletries",
    find: (day) => (day.uv !== null && day.uv >= 6 ? day.uv : null),
    reason: (when, uv) => `High UV ${when}, index ${Math.round(uv)}`,
  },
  {
    // Strong wind: 40 km/h or more, a strong breeze on the Beaufort scale.
    name: "Windbreaker",
    section: "clothes",
    find: (day) => (day.wind !== null && day.wind >= 40 ? day.wind : null),
    reason: (when, wind) => `Strong wind ${when}, up to ${Math.round(wind)} km/h`,
  },
];

// The forecast starts today, at the destination.
function when(day: Day, index: number) {
  if (index === 0) return "today";
  if (index === 1) return "tomorrow";
  return `on ${weekday(day.date)}`;
}

// What the forecast suggests packing, in the order above. Anything already on the
// list (ignoring case) is never suggested.
export function suggestions(days: Day[], items: Item[]): Suggestion[] {
  return RULES.flatMap(({ name, section, find, reason }) => {
    if (itemNamed(name, items)) return [];
    for (const [index, day] of days.entries()) {
      const value = find(day);
      if (value !== null) return [{ name, section, reason: reason(when(day, index), value) }];
    }
    return [];
  });
}
