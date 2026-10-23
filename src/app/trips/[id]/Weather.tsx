import { useRef, useState } from "react";
import { Card } from "@/components/Card";
import { ErrorMessage } from "@/components/ErrorMessage";
import { SectionHeading } from "@/components/SectionHeading";
import { TextButton } from "@/components/TextLink";
import type { Destination, Trip } from "@/lib/trips";
import { placeLabel, type Place } from "@/lib/weather";
import { DestinationSearch } from "./DestinationSearch";

type WeatherProps = {
  trip: Trip;
  // Resolves to whether it saved.
  onSetDestination: (destination: Destination | null) => Promise<boolean>;
};

const HEADING_ID = "weather-heading";

// Where the trip is going and its weather. Without a destination, an invitation to add
// one; with one, Change destination and Remove destination.
export function Weather({ trip, onSetDestination }: WeatherProps) {
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
    <section aria-labelledby={HEADING_ID} className="flex flex-col gap-2">
      {/* tabIndex -1: focus can wait here; no ring, since it isn't a control. */}
      <SectionHeading id={HEADING_ID} ref={heading} tabIndex={-1} className="outline-none">
        {destination ? `Weather in ${placeLabel(destination)}` : "Weather"}
      </SectionHeading>

      {!destination || changing ? (
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
