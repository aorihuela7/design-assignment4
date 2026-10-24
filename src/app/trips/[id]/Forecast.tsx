import type { ReactNode } from "react";
import { Button } from "@/components/Button";
import { Notice } from "@/components/Notice";
import { WeatherIcon } from "@/components/WeatherIcon";
import type { ForecastState } from "@/lib/useForecast";
import { degrees, describeWeather, weekday, type Day } from "@/lib/weather";

type ForecastProps = {
  state: ForecastState;
  // Retry goes while the forecast loads again; the page says where focus waits.
  onRetry: () => void;
};

// The next 7 days as a departures board, the loading rows in its place, or a way to
// try again.
export function Forecast({ state, onRetry }: ForecastProps) {
  if (state.status === "failed") {
    return (
      <Notice action={<Button onClick={onRetry}>Retry</Button>}>
        Weather is unavailable right now. Your list still works.
      </Notice>
    );
  }
  if (state.status === "loading") {
    return (
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
    );
  }
  return (
    <Board>
      {state.days.map((day) => (
        <DayRow key={day.date} day={day} />
      ))}
    </Board>
  );
}

// Every cell is this tall whatever it shows (a weather name can take two lines in a
// narrow board), so the loading rows and the days take the same room. Sizes follow
// the board's own width, so it fits a phone and the side panel alike.
const cell = "h-12 px-1.5 first:pl-0 last:pr-0 @md:px-3";
// In a roomy board the numbers get even columns, rather than crowding at the right.
const number = "text-right whitespace-nowrap @md:w-24";

// Navy and amber, like the band at the top. A table: a caption, column headings, and
// each day as its row's heading.
function Board({ hidden = false, children }: { hidden?: boolean; children: ReactNode }) {
  return (
    // The outer box is what the sizes measure; an element can't size by its own width.
    <div data-surface="board" aria-hidden={hidden || undefined} className="@container rounded bg-board">
      <div className="px-3 pb-1 @md:px-5">
        <table className="w-full font-mono text-xs uppercase tracking-wider text-amber @md:text-sm">
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
    </div>
  );
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
