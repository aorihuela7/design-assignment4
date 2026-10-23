import { useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { Button } from "@/components/Button";
import { ErrorIcon, ErrorMessage } from "@/components/ErrorMessage";
import { TextField } from "@/components/Field";
import { Notice } from "@/components/Notice";
import { cleanName } from "@/lib/trips";
import { placeLabel, placeQueryError, searchPlaces, type Place } from "@/lib/weather";

type DestinationSearchProps = {
  // Changing a destination starts from the current one, selected, ready to type over.
  initialQuery?: string;
  autoFocus?: boolean;
  // Resolves to whether the place was saved.
  onChoose: (place: Place) => Promise<boolean>;
  // Only when changing a destination: back to it, as Escape does.
  onCancel?: () => void;
};

type Results =
  | { status: "idle" }
  | { status: "searching" | "none" | "unavailable"; query: string }
  | { status: "found"; query: string; places: Place[] };

// One column: the Destination field, Find, then the places found as a list of buttons.
// What the search found is read out politely; the field keeps what was typed.
export function DestinationSearch({ initialQuery = "", autoFocus = false, onChoose, onCancel }: DestinationSearchProps) {
  const [query, setQuery] = useState(initialQuery);
  // No errors before the first Find; after it, the error follows what's typed.
  const [attempted, setAttempted] = useState(false);
  const [results, setResults] = useState<Results>({ status: "idle" });
  const [saveFailed, setSaveFailed] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  // Only the latest search shows, whatever order the answers come back in.
  const latest = useRef(0);
  const choosing = useRef(false);
  const error = attempted ? placeQueryError(query) : null;

  async function search(text: string) {
    const request = ++latest.current;
    setResults({ status: "searching", query: text });
    setSaveFailed(false);
    try {
      const places = await searchPlaces(text);
      if (request !== latest.current) return;
      setResults(places.length > 0 ? { status: "found", query: text, places } : { status: "none", query: text });
    } catch {
      if (request === latest.current) setResults({ status: "unavailable", query: text });
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    if (placeQueryError(query)) {
      setAttempted(true); // keeps exactly what was typed
      inputRef.current?.focus();
      return;
    }
    void search(cleanName(query));
  }

  function retry(text: string) {
    // Retry goes while the search runs again; focus waits in the field.
    inputRef.current?.focus();
    void search(text);
  }

  async function choose(place: Place) {
    if (choosing.current) return;
    choosing.current = true;
    const saved = await onChoose(place);
    choosing.current = false;
    if (!saved) setSaveFailed(true);
  }

  function onKeyDown(event: KeyboardEvent) {
    if (event.key === "Escape") onCancel?.();
  }

  const count = results.status === "found" ? results.places.length : 0;
  const status =
    results.status === "searching"
      ? "Searching…"
      : results.status === "found"
        ? `${count} ${count === 1 ? "place" : "places"} found`
        : results.status === "none"
          ? `No places match ‘${results.query}’. Check the spelling or try a nearby city.`
          : "";

  return (
    <div onKeyDown={onKeyDown} className="flex flex-col">
      <form role="search" noValidate onSubmit={submit} className="flex flex-col gap-4">
        <TextField
          ref={inputRef}
          label="Destination"
          placeholder="e.g. Lisbon"
          autoComplete="off"
          autoFocus={autoFocus}
          onFocus={initialQuery ? (event) => event.target.select() : undefined}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          error={error ?? undefined}
        />
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button type="submit">Find</Button>
          {onCancel && <Button onClick={onCancel}>Cancel</Button>}
        </div>
      </form>

      {/* Always in the page, so each new search is read out. Empty, it takes no room. */}
      <p
        role="status"
        className={
          results.status === "none"
            ? "mt-4 flex items-start gap-1.5 text-sm text-ink"
            : status
              ? "mt-4 font-mono text-xs uppercase tracking-wider text-muted"
              : ""
        }
      >
        {results.status === "none" && <ErrorIcon />}
        {status}
      </p>

      {results.status === "unavailable" && (
        <div className="mt-4">
          <Notice action={<Button onClick={() => retry(results.query)}>Retry</Button>}>
            Weather is unavailable right now. Your list still works.
          </Notice>
        </div>
      )}

      {results.status === "found" && (
        <ul className="mt-2 flex flex-col gap-2">
          {results.places.map((place) => (
            <li key={place.id}>
              {/* Full width, the place's words from the left. */}
              <Button className="w-full" onClick={() => choose(place)}>
                <span className="flex-1 text-left">{placeLabel(place)}</span>
              </Button>
            </li>
          ))}
        </ul>
      )}

      {saveFailed && (
        <div className="mt-4">
          <ErrorMessage role="alert">Not saved. Check your connection and try again</ErrorMessage>
        </div>
      )}
    </div>
  );
}
