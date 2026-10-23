import { cleanName, type Destination } from "./trips";

// Open-Meteo, called from the browser (see AGENTS.md › Weather): the place search, to
// find a trip's destination, and the next 7 days' forecast there. No key.

export type Place = Destination & { id: number; region: string | null };

export type Day = {
  date: string; // "2026-10-24", in the destination's time zone
  code: number | null; // WMO weather code
  high: number | null; // °C
  low: number | null; // °C
  rain: number | null; // the day's highest chance of rain, %
  uv: number | null; // the day's highest UV index
  wind: number | null; // the day's strongest wind, km/h
};

// Open-Meteo couldn't be reached, took too long or answered with an error. The page
// says the weather is unavailable, with Retry; the list keeps working.
export class WeatherUnavailable extends Error {}

const TIMEOUT_MS = 8000;
// Forecasts change through the day, so one is kept for 30 minutes in this tab.
const FORECAST_TTL_MS = 30 * 60 * 1000;

// Development only: add ?weather=down or ?weather=none to a list page's address to see
// Open-Meteo down (both calls fail) or finding no places. Production builds replace
// process.env.NODE_ENV with "production", so this is always null there, and the
// code that reads the address is left out of the build.
function simulated(): "down" | "none" | null {
  if (process.env.NODE_ENV !== "development") return null;
  const value = new URLSearchParams(window.location.search).get("weather");
  return value === "down" || value === "none" ? value : null;
}

// Long enough to see the loading state before the simulated answer.
function pause(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getJson(url: URL): Promise<unknown> {
  if (simulated() === "down") {
    await pause(2000);
    throw new WeatherUnavailable();
  }
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
    // A refused request answers { error: true, reason }, in words for developers.
    if (!response.ok) throw new WeatherUnavailable();
    return await response.json();
  } catch {
    throw new WeatherUnavailable();
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function text(value: unknown) {
  return typeof value === "string" && value.trim() !== "" ? value : null;
}

function numberIn(value: unknown, min: number, max: number) {
  return typeof value === "number" && value >= min && value <= max ? value : null;
}

// Place search

export const MAX_PLACE_QUERY = 100;

// What to do next, or null when the search can run.
export function placeQueryError(query: string): string | null {
  const clean = cleanName(query);
  if (clean === "") return "Enter a place, like ‘Lisbon’";
  // Open-Meteo finds nothing for a single letter.
  if (clean.length < 2) return "Enter at least 2 letters";
  if (clean.length > MAX_PLACE_QUERY) return `Keep it under ${MAX_PLACE_QUERY} characters`;
  return null;
}

function toPlace(value: unknown): Place[] {
  if (!isRecord(value)) return [];
  const name = text(value.name);
  const latitude = numberIn(value.latitude, -90, 90);
  const longitude = numberIn(value.longitude, -180, 180);
  if (typeof value.id !== "number" || !name || latitude === null || longitude === null) return [];
  return [
    {
      id: value.id,
      name,
      region: text(value.admin1),
      country: text(value.country),
      latitude,
      longitude,
      timezone: text(value.timezone),
    },
  ];
}

// "Lisbon, Lisbon District, Portugal" for a place found; "Lisbon, Portugal" for a saved
// destination, which keeps no region. A part already said isn't repeated: "Singapore".
export function placeLabel(place: Pick<Place, "name" | "country"> & { region?: string | null }) {
  const parts = [place.name, place.region, place.country];
  return parts.filter((part, i) => part && parts.indexOf(part) === i).join(", ");
}

// Up to 5 places, most likely first. The browser keeps each search for a day, as
// Open-Meteo asks.
export async function searchPlaces(query: string): Promise<Place[]> {
  if (simulated() === "none") {
    await pause(500);
    return [];
  }
  const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
  url.search = new URLSearchParams({ name: cleanName(query), count: "5", language: "en", format: "json" }).toString();
  const data = await getJson(url);
  // No match comes back without results.
  const places = isRecord(data) && Array.isArray(data.results) ? data.results.flatMap(toPlace) : [];
  // Two places that read the same couldn't be told apart: the first is kept.
  return places.filter((place, i) => places.findIndex((other) => placeLabel(other) === placeLabel(place)) === i);
}

// Forecast

const DAILY = [
  "weather_code",
  "temperature_2m_max",
  "temperature_2m_min",
  "precipitation_probability_max",
  "uv_index_max",
  "wind_speed_10m_max",
];

const forecasts = new Map<string, { expires: number; days: Day[] }>();

// Where a forecast is for: the coordinates, and the time zone its days are dated in.
export type ForecastPlace = Pick<Destination, "latitude" | "longitude" | "timezone">;

export function forecastKey({ latitude, longitude, timezone }: ForecastPlace) {
  return `${latitude},${longitude},${timezone}`;
}

// A forecast already loaded in this tab and still fresh, so the board shows at once.
export function cachedForecast(destination: ForecastPlace): Day[] | null {
  // A forecast already loaded mustn't hide a simulated outage.
  if (simulated() === "down") return null;
  const hit = forecasts.get(forecastKey(destination));
  return hit && hit.expires > Date.now() ? hit.days : null;
}

function toDays(data: unknown): Day[] {
  const daily = isRecord(data) && isRecord(data.daily) ? data.daily : null;
  if (!daily || !Array.isArray(daily.time) || daily.time.length === 0) throw new WeatherUnavailable();
  const column = (name: string) => (Array.isArray(daily[name]) ? (daily[name] as unknown[]) : []);
  const [code, high, low, rain, uv, wind] = DAILY.map(column);
  return daily.time.map((date, i) => {
    if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new WeatherUnavailable();
    // A missing value shows as "–" rather than hiding the day.
    return {
      date,
      code: numberIn(code[i], 0, 99),
      high: numberIn(high[i], -100, 100),
      low: numberIn(low[i], -100, 100),
      rain: numberIn(rain[i], 0, 100),
      uv: numberIn(uv[i], 0, 30),
      wind: numberIn(wind[i], 0, 500),
    };
  });
}

// Today and the next 6 days, dated in the destination's time zone.
export async function fetchForecast(destination: ForecastPlace): Promise<Day[]> {
  const cached = cachedForecast(destination);
  if (cached) return cached;
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.search = new URLSearchParams({
    latitude: String(destination.latitude),
    longitude: String(destination.longitude),
    daily: DAILY.join(","),
    // Open-Meteo works out the time zone from the coordinates when none was saved.
    timezone: destination.timezone ?? "auto",
    forecast_days: "7",
  }).toString();
  const days = toDays(await getJson(url));
  forecasts.set(forecastKey(destination), { expires: Date.now() + FORECAST_TTL_MS, days });
  return days;
}

// How a day's weather is drawn and said. Every WMO code Open-Meteo sends maps to one of
// these; each label's words are short enough for the board at 390px.
export type Sky = "clear" | "partly" | "cloudy" | "fog" | "drizzle" | "rain" | "snow" | "storm";

export function describeWeather(code: number | null): { sky: Sky; label: string } | null {
  if (code === null) return null;
  if (code === 0) return { sky: "clear", label: "Clear" };
  if (code === 1) return { sky: "partly", label: "Mostly clear" };
  if (code === 2) return { sky: "partly", label: "Partly cloudy" };
  if (code === 3) return { sky: "cloudy", label: "Cloudy" };
  if (code === 45 || code === 48) return { sky: "fog", label: "Fog" };
  if (code >= 51 && code <= 55) return { sky: "drizzle", label: "Drizzle" };
  if (code === 56 || code === 57) return { sky: "drizzle", label: "Freezing drizzle" };
  if (code === 61 || code === 63) return { sky: "rain", label: "Rain" };
  if (code === 65) return { sky: "rain", label: "Heavy rain" };
  if (code === 66 || code === 67) return { sky: "rain", label: "Freezing rain" };
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return { sky: "snow", label: "Snow" };
  if (code === 80 || code === 81) return { sky: "rain", label: "Showers" };
  if (code === 82) return { sky: "rain", label: "Heavy showers" };
  if (code >= 95) return { sky: "storm", label: "Thunder" };
  return null;
}

// "21°C", or "–" when Open-Meteo sent no value.
export function degrees(value: number | null) {
  return value === null ? "–" : `${Math.round(value)}°C`;
}

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// "Saturday", for a forecast date. Read from the date itself, so it's the destination's
// day whatever the person's own time zone.
export function weekday(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  return WEEKDAYS[new Date(Date.UTC(year, month - 1, day)).getUTCDay()];
}
