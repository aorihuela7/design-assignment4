import { useRef, useState } from "react";
import { Card } from "@/components/Card";
import { ErrorMessage } from "@/components/ErrorMessage";
import { SectionHeading } from "@/components/SectionHeading";
import { TextButton } from "@/components/TextLink";
import type { SaveResult } from "@/lib/storage";
import type { Destination, Item, Section, Trip } from "@/lib/trips";
import { placeLabel, type Place } from "@/lib/weather";
import { DestinationSearch } from "./DestinationSearch";
import { Forecast, type LoadedForecast } from "./Forecast";
import { Suggestions } from "./Suggestions";

type WeatherProps = {
  trip: Trip;
  // The destination's forecast, loaded by the page; null without a destination.
  forecast: LoadedForecast | null;
  // Resolves to whether it saved.
  onSetDestination: (destination: Destination | null) => Promise<boolean>;
  // Adds a suggestion the way the Add item form adds an item.
  onAdd: (name: string, section: Section) => Promise<SaveResult>;
};

export const WEATHER_HEADING_ID = "weather-heading";

// Where the trip is going and its weather. Without a destination, an invitation to add
// one; with one, its forecast and what to pack for it, then Change destination and
// Remove destination.
export function Weather({ trip, forecast, onSetDestination, onAdd }: WeatherProps) {
  const { destination } = trip;
  const [changing, setChanging] = useState(false);
  // Once the person asks for the search (Change, Remove), its field takes focus.
  const [focusSearch, setFocusSearch] = useState(false);
  const [removeFailed, setRemoveFailed] = useState(false);
  const removing = useRef(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const changeButton = useRef<HTMLButtonElement>(null);

  const choose = async (place: Place) => {
    const { name, country, latitude, longitude, timezone } = place;
    if (!(await onSetDestination({ name, country, latitude, longitude, timezone }))) return false;
    setChanging(false);
    // The search is gone: focus waits on the heading, which now names the place.
    requestAnimationFrame(() => heading.current?.focus());
    return true;
  };
  const change = () => {
    setFocusSearch(true);
    setChanging(true);
    setRemoveFailed(false);
  };
  const cancel = () => {
    setChanging(false);
    requestAnimationFrame(() => changeButton.current?.focus());
  };
  const remove = async () => {
    if (removing.current) return;
    removing.current = true;
    setFocusSearch(true);
    const removed = await onSetDestination(null);
    removing.current = false;
    setRemoveFailed(!removed);
  };

  return (
    <section aria-labelledby={WEATHER_HEADING_ID} className="flex flex-col gap-2">
      {/* tabIndex -1: focus can wait here; no ring, since it isn't a control. Scrolled to,
          it stops below the sticky packing bar. */}
      <SectionHeading id={WEATHER_HEADING_ID} ref={heading} tabIndex={-1} className="scroll-mt-24 outline-none">
        {destination ? `Weather in ${placeLabel(destination)}` : "Weather"}
      </SectionHeading>

      {!destination || !forecast || changing ? (
        <Card className="flex flex-col gap-4">
          {!destination && <p>Add where you’re going to see its weather for the next 7 days.</p>}
          <DestinationSearch
            initialQuery={changing ? destination?.name : undefined}
            autoFocus={focusSearch}
            onChoose={choose}
            onCancel={destination ? cancel : undefined}
          />
        </Card>
      ) : (
        <>
          <DestinationForecast
            forecast={forecast}
            items={trip.items}
            onAdd={onAdd}
            focusHeading={() => heading.current?.focus()}
          />
          {/* Rare, so quiet text actions, like Rename trip and Delete trip. */}
          <div className="flex flex-wrap gap-x-6">
            <TextButton ref={changeButton} onClick={change}>
              Change destination
            </TextButton>
            <TextButton onClick={remove}>Remove destination</TextButton>
          </div>
          {removeFailed && <ErrorMessage role="alert">Not removed. Check your connection and try again</ErrorMessage>}
        </>
      )}
    </section>
  );
}

type DestinationForecastProps = {
  forecast: LoadedForecast;
  items: Item[];
  onAdd: (name: string, section: Section) => Promise<SaveResult>;
  // Where focus waits when what had it goes (Retry, the last suggestion).
  focusHeading: () => void;
};

function DestinationForecast({ forecast, items, onAdd, focusHeading }: DestinationForecastProps) {
  return (
    <>
      <Forecast
        state={forecast}
        onRetry={() => {
          focusHeading();
          forecast.retry();
        }}
      />
      {forecast.status === "ready" && (
        <Suggestions days={forecast.days} items={items} onAdd={onAdd} onNoneLeft={focusHeading} />
      )}
    </>
  );
}
