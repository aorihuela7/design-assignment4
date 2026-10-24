import { useEffect, useState } from "react";
import { cachedForecast, fetchForecast, forecastKey, type Day, type ForecastPlace } from "@/lib/weather";

export type ForecastState = { status: "loading" } | { status: "failed" } | { status: "ready"; days: Day[] };

export type LoadedForecast = ForecastState & { retry: () => void };

// A destination's forecast: loading, then the days or failed. Retry loads it again.
// Null when there's no destination. Everything showing one place's weather (a card on
// My trips, the trip page) shares one forecast, so Open-Meteo is asked once.
export function useForecast(place: ForecastPlace | null): LoadedForecast | null {
  const latitude = place?.latitude ?? null;
  const longitude = place?.longitude ?? null;
  const timezone = place?.timezone ?? null;
  const key = latitude === null || longitude === null ? null : forecastKey({ latitude, longitude, timezone });
  const [attempt, setAttempt] = useState(0);
  const [loaded, setLoaded] = useState<{ key: string; attempt: number; days: Day[] | null } | null>(null);
  useEffect(() => {
    if (key === null || latitude === null || longitude === null) return;
    let current = true;
    fetchForecast({ latitude, longitude, timezone }).then(
      (days) => current && setLoaded({ key, attempt, days }),
      () => current && setLoaded({ key, attempt, days: null }),
    );
    return () => {
      current = false;
    };
  }, [key, attempt, latitude, longitude, timezone]);

  if (key === null || latitude === null || longitude === null) return null;
  const fresh = loaded?.key === key && loaded.attempt === attempt ? loaded : null;
  // A forecast already in this tab shows straight away, with no loading rows.
  const days = fresh ? fresh.days : cachedForecast({ latitude, longitude, timezone });
  const state: ForecastState = days ? { status: "ready", days } : fresh ? { status: "failed" } : { status: "loading" };
  return { ...state, retry: () => setAttempt((n) => n + 1) };
}
