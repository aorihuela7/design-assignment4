import { useLayoutEffect, useRef, useState } from "react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { ErrorMessage } from "@/components/ErrorMessage";
import type { SaveResult } from "@/lib/storage";
import { suggestions } from "@/lib/suggestions";
import { itemNameError, SECTIONS, type Item, type Section } from "@/lib/trips";
import type { Day } from "@/lib/weather";

type SuggestionsProps = {
  days: Day[];
  items: Item[];
  // The Add item form's own add, so a suggestion is added exactly like a typed item.
  onAdd: (name: string, section: Section) => Promise<SaveResult>;
  // The last suggestion was added and the list is gone: where focus goes instead.
  onNoneLeft: () => void;
};

// What the forecast suggests packing, each with why and Add. Nothing on the list is
// suggested, so an added one disappears.
export function Suggestions({ days, items, onAdd, onNoneLeft }: SuggestionsProps) {
  const list = useRef<HTMLUListElement>(null);
  const adding = useRef(false);
  // The suggestion that couldn't be added, and what to do next.
  const [problem, setProblem] = useState<{ name: string; text: string } | null>(null);
  // Gone when the trip is next shown (Next keeps it in the background, React's Activity).
  useLayoutEffect(() => () => setProblem(null), []);
  const shown = suggestions(days, items);
  if (shown.length === 0) return null;

  async function add(name: string, section: Section, index: number) {
    if (adding.current) return;
    // The same check as the Add item form.
    const error = itemNameError(name, items);
    if (error) {
      setProblem({ name, text: error });
      return;
    }
    adding.current = true;
    setProblem(null);
    const result = await onAdd(name, section);
    adding.current = false;
    if (result === "failed") {
      setProblem({ name, text: "Not added. Check your connection and try again" });
      return;
    }
    // Its row is gone: focus moves to the Add that took its place, or the one before.
    requestAnimationFrame(() => {
      const buttons = list.current?.querySelectorAll("button");
      const next = buttons?.[Math.min(index, buttons.length - 1)];
      if (next) next.focus();
      else onNoneLeft();
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <h3 id="suggestions-heading" className="font-mono text-xs uppercase tracking-wider text-ink">
        Pack for this weather
      </h3>
      <Card padded={false}>
        <ul ref={list} aria-labelledby="suggestions-heading" className="divide-y divide-line">
          {shown.map(({ name, section, reason }, index) => {
            const sectionLabel = SECTIONS.find((s) => s.value === section)?.label ?? "Other";
            return (
              <li key={name} className="flex flex-col gap-2 px-4 py-2">
                <div className="flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-ink">{name}</p>
                    <p className="text-sm text-muted">{reason}</p>
                  </div>
                  <Button
                    aria-label={`Add ${name} to ${sectionLabel}`}
                    onClick={() => add(name, section, index)}
                    className="shrink-0"
                  >
                    Add
                  </Button>
                </div>
                {problem?.name === name && <ErrorMessage role="alert">{problem.text}</ErrorMessage>}
              </li>
            );
          })}
        </ul>
      </Card>
    </div>
  );
}
