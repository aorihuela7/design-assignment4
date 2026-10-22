import type { FocusEvent } from "react";
import { Button } from "@/components/Button";
import { NewBadge } from "@/components/NewBadge";
import type { Item } from "@/lib/storage";

type ItemRowProps = {
  item: Item;
  onToggle: () => void;
  onRemove: () => void;
  // Just added or restored: plays the arrive highlight once.
  arrived?: boolean;
  // Just ticked by the person: the check and the strike-through draw in once.
  justPacked?: boolean;
};

// The strike-through is a 1.5px line drawn as a background on the name's text, so
// it can grow from left to right; each wrapped line gets its own. In forced-colors
// mode backgrounds are dropped, so it falls back to a real line-through.
const strike =
  "bg-[linear-gradient(currentColor,currentColor)] bg-no-repeat bg-[length:100%_1.5px] bg-[position:0_58%] [box-decoration-break:clone] forced-colors:bg-none forced-colors:line-through";

// The whole row is the checkbox's label, so the hit area is at least 44px high.
// Hovering the row, or keyboard focus anywhere in it, tints it edge to edge; the
// end rows round their corners to fit the card.
export function ItemRow({ item, onToggle, onRemove, arrived = false, justPacked = false }: ItemRowProps) {
  const draw = justPacked ? "motion-safe:animate-draw" : "";
  return (
    <li
      className={`flex items-center gap-2 px-2 first:rounded-t-[3px] last:rounded-b-[3px] hover:bg-canvas has-focus-visible:bg-canvas ${arrived ? "motion-safe:animate-arrive" : ""}`}
    >
      <label className="flex min-h-11 min-w-0 flex-1 cursor-pointer items-center gap-3 px-2 py-2">
        <span className="relative flex size-6 shrink-0">
          <input
            id={`item-${item.id}`}
            type="checkbox"
            checked={item.packed}
            onChange={onToggle}
            className="peer size-6 cursor-pointer appearance-none rounded border-2 border-ink bg-surface checked:bg-ink"
          />
          <svg
            aria-hidden="true"
            viewBox="0 0 16 16"
            className="pointer-events-none absolute inset-0 m-auto hidden size-4 text-surface peer-checked:block"
          >
            <path
              d="M3 8.5l3 3 7-7"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              pathLength={1}
              strokeDasharray={1}
              className={draw}
            />
          </svg>
        </span>
        {/* Packed: checkmark, strike-through and hidden text, never color alone. */}
        <span className={`min-w-0 flex-1 wrap-anywhere ${item.packed ? "text-muted" : "text-ink"}`}>
          <span className={item.packed ? `${strike} ${justPacked ? "motion-safe:animate-strike" : ""}` : ""}>
            {item.name}
          </span>
          {item.packed && <span className="sr-only"> Packed</span>}
        </span>
        {item.isNew && <NewBadge />}
      </label>
      {/* Always visible, never only on hover. Removing is immediate. */}
      <Button variant="subtle" aria-label={`Remove ${item.name}`} onClick={onRemove} className="shrink-0">
        Remove
      </Button>
    </li>
  );
}

export const UNDO_ROW_ID = "undo-removed-item";

export type UndoHold = (reason: "pointer" | "focus", held: boolean) => void;

// Pointer over it, or keyboard focus on it, holds the Undo; leaving lets it time out.
export function undoHoldProps(onHold: UndoHold) {
  return {
    onPointerEnter: () => onHold("pointer", true),
    onPointerLeave: () => onHold("pointer", false),
    // Only keyboard focus holds it: after a mouse click, focus lands here too.
    onFocus: (event: FocusEvent<HTMLElement>) => onHold("focus", (event.target as HTMLElement).matches(":focus-visible")),
    onBlur: () => onHold("focus", false),
  };
}

// Takes the removed item's place for a few seconds, so Undo is right where the
// item was, for pointer and keyboard alike. Same height as an item row, so the
// rows below don't move.
export function RemovedRow({ name, onUndo, onHold }: { name: string; onUndo: () => void; onHold: UndoHold }) {
  return (
    <li className="flex min-h-11 flex-wrap items-center gap-x-3 px-4 text-muted" {...undoHoldProps(onHold)}>
      <span className="min-w-0 wrap-anywhere">Removed {name}</span>
      <span aria-hidden="true">·</span>
      <Button id={UNDO_ROW_ID} variant="quiet" aria-label={`Undo removing ${name}`} onClick={onUndo}>
        Undo
      </Button>
    </li>
  );
}
