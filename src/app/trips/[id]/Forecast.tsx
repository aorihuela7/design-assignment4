import { useEffect, useState, type ReactNode } from "react";
import { Button } from "@/components/Button";
import { Notice } from "@/components/Notice";
import { TextLink } from "@/components/TextLink";
import {
  cachedForecast,
  describeWeather,
  fetchForecast,
  forecastKey,
  weekday,
  type Day,
  type ForecastPlace,
  type Sky,
} from "@/lib/weather";

type ForecastState = { status: "loading" } | { status: "failed" } | { status: "ready"; days: Day[] };

// The destination's forecast: loading, then the days or failed. Retry loads it again.
export function useForecast({ latitude, longitude, timezone }: ForecastPlace) {
  const key = forecastKey({ latitude, longitude, timezone });
  const [attempt, setAttempt] = useState(0);
  // A forecast already in this tab shows straight away, with no loading rows.
  const [loaded, setLoaded] = useState<{ key: string; attempt: number; days: Day[] | null } | null>(() => {
    const days = cachedForecast({ latitude, longitude, timezone });
    return days ? { key, attempt: 0, days } : null;
  });
  useEffect(() => {
    let current = true;
    fetchForecast({ latitude, longitude, timezone }).then(
      (days) => current && setLoaded({ key, attempt, days }),
      () => current && setLoaded({ key, attempt, days: null }),
    );
    return () => {
      current = false;
    };
  }, [key, attempt, latitude, longitude, timezone]);

  const state: ForecastState =
    loaded?.key !== key || loaded.attempt !== attempt
      ? { status: "loading" }
      : loaded.days
        ? { status: "ready", days: loaded.days }
        : { status: "failed" };
  return { ...state, retry: () => setAttempt((n) => n + 1) };
}

type ForecastProps = {
  state: ForecastState;
  // Retry goes while the forecast loads again; the page says where focus waits.
  onRetry: () => void;
};

// The next 7 days as a departures board, the loading rows in its place, or a way to
// try again. Credit to Open-Meteo sits under the board, as its licence asks.
export function Forecast({ state, onRetry }: ForecastProps) {
  if (state.status === "failed") {
    return (
      <Notice action={<Button onClick={onRetry}>Retry</Button>}>
        Weather is unavailable right now. Your list still works.
      </Notice>
    );
  }
  return (
    <div className="flex flex-col gap-2">
      {state.status === "loading" ? (
        <>
          <p role="status" className="sr-only">
            Loading the forecast…
          </p>
          <Board hidden>
            {[0, 1, 2, 3, 4, 5, 6].map((i) => (
              <LoadingRow key={i} />
            ))}
          </Board>
        </>
      ) : (
        <Board>
          {state.days.map((day) => (
            <DayRow key={day.date} day={day} />
          ))}
        </Board>
      )}
      <p className="text-sm text-muted">
        Weather data by{" "}
        <TextLink href="https://open-meteo.com/" inline>
          Open-Meteo.com
        </TextLink>
      </p>
    </div>
  );
}

// Every cell is this tall whatever it shows (a weather name can take two lines at
// 390px), so the loading rows and the days take the same room.
const cell = "h-12 px-1.5 first:pl-0 last:pr-0 sm:px-3";
// On wider screens the numbers get even columns, rather than crowding at the right.
const number = "text-right whitespace-nowrap sm:w-24";

// Navy and amber, like the band at the top. A table: a caption, column headings, and
// each day as its row's heading.
function Board({ hidden = false, children }: { hidden?: boolean; children: ReactNode }) {
  return (
    <div data-surface="board" aria-hidden={hidden || undefined} className="rounded bg-board px-3 pb-1 sm:px-5">
      <table className="w-full font-mono text-xs uppercase tracking-wider text-amber sm:text-sm">
        <caption className="pt-3 pb-1 text-left text-xs text-white">Next 7 days</caption>
        <thead className="text-xs text-white">
          <tr className="border-b border-white/25">
            <th scope="col" className={`${cell} text-left font-normal`}>
              Day
            </th>
            <th scope="col" className={`${cell} w-full text-left font-normal`}>
              Weather
            </th>
            <th scope="col" className={`${cell} ${number} font-normal`}>
              High
            </th>
            <th scope="col" className={`${cell} ${number} font-normal`}>
              Low
            </th>
            <th scope="col" className={`${cell} ${number} font-normal`}>
              Rain
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/15">{children}</tbody>
      </table>
    </div>
  );
}

function degrees(value: number | null) {
  return value === null ? "–" : `${Math.round(value)}°C`;
}

function DayRow({ day }: { day: Day }) {
  const weather = describeWeather(day.code);
  return (
    <tr>
      <th scope="row" className={`${cell} text-left font-normal whitespace-nowrap`}>
        <time dateTime={day.date}>
          {weekday(day.date).slice(0, 3)} {Number(day.date.slice(8))}
        </time>
      </th>
      <td className={cell}>
        {/* The icon is drawn for the eye; the words say the weather. */}
        <span className="flex items-center gap-2">
          {weather && <WeatherIcon sky={weather.sky} />}
          <span>{weather?.label ?? "–"}</span>
        </span>
      </td>
      <td className={`${cell} ${number}`}>{degrees(day.high)}</td>
      <td className={`${cell} ${number}`}>{degrees(day.low)}</td>
      <td className={`${cell} ${number}`}>{day.rain === null ? "–" : `${Math.round(day.rain)}%`}</td>
    </tr>
  );
}

function LoadingRow() {
  const bar = "inline-block h-3 rounded bg-white/10 align-middle";
  return (
    <tr>
      <td className={cell}>
        <span className={`${bar} w-12`} />
      </td>
      <td className={cell}>
        <span className={`${bar} w-24`} />
      </td>
      {[0, 1, 2].map((i) => (
        <td key={i} className={`${cell} ${number}`}>
          <span className={`${bar} w-9`} />
        </td>
      ))}
    </tr>
  );
}

// Line icons on the board's grid of 24, in its amber. The rain, drizzle and snow
// icons share a cloud raised to make room for what falls from it.
const CLOUD = "M7 19h10.5a4.5 4.5 0 0 0 .4-8.98A6.5 6.5 0 0 0 5.6 11.6 3.75 3.75 0 0 0 7 19z";
const RAISED = "translate(0 -4)";

function WeatherIcon({ sky }: { sky: Sky }) {
  const shapes: Record<Sky, ReactNode> = {
    clear: (
      <>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2.5V5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.75 1.75M16.95 16.95l1.75 1.75M5.3 18.7l1.75-1.75M16.95 7.05l1.75-1.75" />
      </>
    ),
    partly: (
      <>
        <circle cx="8.5" cy="8.5" r="3" />
        <path d="M8.5 2.5v1.5M2.5 8.5H4M4.25 4.25l1.05 1.05M12.75 4.25 11.7 5.3" />
        <path d={CLOUD} transform="translate(2 1) scale(0.9)" fill="var(--color-board)" />
      </>
    ),
    cloudy: <path d={CLOUD} />,
    fog: <path d="M3 8h18M5 12h14M3 16h18M7 20h10" />,
    drizzle: (
      <>
        <path d={CLOUD} transform={RAISED} />
        <path d="M8 18v1.5M12 19.5V21M16 18v1.5" />
      </>
    ),
    rain: (
      <>
        <path d={CLOUD} transform={RAISED} />
        <path d="M8.5 17 7 21M12.5 17 11 21M16.5 17 15 21" />
      </>
    ),
    snow: (
      <>
        <path d={CLOUD} transform={RAISED} />
        <circle cx="8" cy="18.5" r="1" fill="currentColor" />
        <circle cx="12" cy="20.5" r="1" fill="currentColor" />
        <circle cx="16" cy="18.5" r="1" fill="currentColor" />
      </>
    ),
    storm: (
      <>
        <path d={CLOUD} transform={RAISED} />
        <path d="M12.5 15.5 10 19.5h3l-2 3.5" />
      </>
    ),
  };
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-5 shrink-0"
    >
      {shapes[sky]}
    </svg>
  );
}
