import type { MouseEvent } from "react";
import { Card } from "@/components/Card";
import { TextLink } from "@/components/TextLink";
import { suggestions } from "@/lib/suggestions";
import type { Destination, Item } from "@/lib/trips";
import { degrees } from "@/lib/weather";
import type { LoadedForecast } from "./Forecast";
import { WEATHER_HEADING_ID } from "./Weather";

type WeatherSummaryProps = {
  destination: Destination;
  // The Weather section's own forecast, so this needs no call of its own.
  forecast: LoadedForecast;
  items: Item[];
};

// The weather at a glance, near the top, since the Weather section comes after the
// list. Two lines whatever it says, so the list below never moves as the forecast
// arrives. "See weather" jumps to the section and puts focus on its heading.
export function WeatherSummary({ destination, forecast, items }: WeatherSummaryProps) {
  const today = forecast.status === "ready" ? forecast.days[0] : null;
  const hint =
    forecast.status === "ready"
      ? (suggestions(forecast.days, items)[0]?.reason ?? "Nothing extra to pack for the weather")
      : forecast.status === "failed"
        ? "Weather is unavailable right now"
        : null;

  const seeWeather = (event: MouseEvent<HTMLAnchorElement>) => {
    const heading = document.getElementById(WEATHER_HEADING_ID);
    if (!heading) return;
    event.preventDefault();
    heading.scrollIntoView({ block: "start" });
    heading.focus({ preventScroll: true });
  };

  const bar = "inline-block rounded bg-canvas align-middle";
  return (
    // On a phone the two lines take the full width and the link goes under them, its
    // 44px target reaching into the card's padding; wider, the link stands beside them.
    <Card className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4">
      <p className="col-span-2 row-start-1 h-4 truncate font-mono text-xs leading-4 uppercase tracking-wider text-ink sm:col-span-1">
        <span aria-hidden="true">
          {destination.name}
          {forecast.status !== "failed" && " · Today "}
          {today ? `${degrees(today.high)} / ${degrees(today.low)}` : forecast.status === "loading" && <span className={`${bar} h-2.5 w-24`} />}
        </span>
        <span className="sr-only">
          {today
            ? `Today in ${destination.name}: high ${degrees(today.high)}, low ${degrees(today.low)}.`
            : `${destination.name}.`}
        </span>
      </p>
      <p className="col-span-2 row-start-2 flex h-5 items-center text-sm text-muted sm:col-span-1">
        {hint ? <span className="min-w-0 truncate">{hint}</span> : <span aria-hidden="true" className={`${bar} h-3 w-48 max-w-full`} />}
      </p>
      <TextLink
        href={`#${WEATHER_HEADING_ID}`}
        onClick={seeWeather}
        className="col-start-1 row-start-3 -mb-3 justify-self-start sm:col-start-2 sm:row-span-2 sm:row-start-1 sm:mb-0"
      >
        See weather
      </TextLink>
    </Card>
  );
}
