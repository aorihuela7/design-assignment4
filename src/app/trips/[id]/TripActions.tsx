import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { ErrorMessage, NOT_SAVED } from "@/components/ErrorMessage";
import { TextField } from "@/components/Field";
import { TextButton } from "@/components/TextLink";
import { tripNameMessage } from "@/components/tripNameMessage";
import type { SaveResult } from "@/lib/storage";
import { cleanName, tripNameProblem, type Trip } from "@/lib/trips";

type TripActionsProps = {
  trip: Trip;
  otherTrips: Trip[];
  packed: number;
  onClearTicks: () => void;
  onRename: (name: string) => Promise<SaveResult>;
  // Resolves to whether the trip was deleted; if it was, the page leaves.
  onDelete: () => Promise<boolean>;
};

// The bottom of the list: Clear all ticks, Rename trip and Delete trip. Rename and
// Delete open in place (never a modal); Escape or Cancel closes them and focus
// goes back to the button that opened them.
export function TripActions({ trip, otherTrips, packed, onClearTicks, onRename, onDelete }: TripActionsProps) {
  const [mode, setMode] = useState<"idle" | "rename" | "delete">("idle");
  const renameButton = useRef<HTMLButtonElement>(null);
  const deleteButton = useRef<HTMLButtonElement>(null);

  const close = () => {
    const opener = mode === "rename" ? renameButton : deleteButton;
    setMode("idle");
    requestAnimationFrame(() => opener.current?.focus());
  };

  if (mode === "delete") {
    return <DeleteConfirm trip={trip} onDelete={onDelete} onCancel={close} />;
  }

  if (mode === "rename") {
    return (
      <RenameForm
        current={trip.name}
        otherTrips={otherTrips}
        onSave={async (name) => {
          const result = name === trip.name ? "saved" : await onRename(name);
          if (result === "saved") close();
          return result;
        }}
        onCancel={close}
      />
    );
  }

  // Clearing ticks is part of packing; renaming and deleting are rare, so they're
  // quieter text actions under a divider.
  return (
    <div className="flex flex-col items-start gap-4">
      {trip.items.length > 0 && (
        <Button onClick={onClearTicks} disabled={packed === 0}>
          Clear all ticks
        </Button>
      )}
      <div className="flex w-full flex-wrap gap-x-6 border-t border-line pt-2">
        <TextButton ref={renameButton} onClick={() => setMode("rename")}>
          Rename trip
        </TextButton>
        <TextButton ref={deleteButton} onClick={() => setMode("delete")}>
          Delete trip
        </TextButton>
      </div>
    </div>
  );
}

// The question takes focus, so a second Enter can't delete by accident; Tab
// reaches Delete trip, then Cancel.
type DeleteConfirmProps = { trip: Trip; onDelete: () => Promise<boolean>; onCancel: () => void };

function DeleteConfirm({ trip, onDelete, onCancel }: DeleteConfirmProps) {
  const items = trip.items.length;
  const question = useRef<HTMLParagraphElement>(null);
  const [failed, setFailed] = useState(false);
  const deleting = useRef(false);
  useEffect(() => {
    question.current?.focus();
  }, []);

  async function confirm() {
    if (deleting.current) return;
    deleting.current = true;
    const deleted = await onDelete();
    deleting.current = false;
    if (!deleted) setFailed(true);
  }

  return (
    <Card className="motion-safe:animate-reveal">
      <div
        role="group"
        aria-labelledby="delete-question"
        onKeyDown={(event) => event.key === "Escape" && onCancel()}
        className="flex flex-col gap-4"
      >
        <p
          id="delete-question"
          tabIndex={-1}
          ref={question}
          className="flex items-start gap-2 font-semibold text-ink outline-none"
        >
          <WarningIcon />
          <span>
            Delete {trip.name}
            {items > 0 && ` and its ${items} ${items === 1 ? "item" : "items"}`}? This can’t be undone.
          </span>
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button variant="danger" onClick={confirm}>
            Delete trip
          </Button>
          <Button onClick={onCancel}>Cancel</Button>
        </div>
        {failed && <ErrorMessage role="alert">Not deleted. Check your connection and try again</ErrorMessage>}
      </div>
    </Card>
  );
}

// A warning sign beside the question, so it never relies on the button alone.
function WarningIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" className="mt-0.5 size-5 shrink-0">
      <path d="M8 1.5L15 14.5H1z" fill="currentColor" strokeLinejoin="round" />
      <path d="M8 6v4" stroke="var(--color-surface)" strokeWidth="1.75" />
      <circle cx="8" cy="12.25" r="1" fill="var(--color-surface)" />
    </svg>
  );
}

type RenameFormProps = {
  current: string;
  otherTrips: Trip[];
  onSave: (name: string) => Promise<SaveResult>;
  onCancel: () => void;
};

function RenameForm({ current, otherTrips, onSave, onCancel }: RenameFormProps) {
  const [name, setName] = useState(current);
  // Same rules as New trip: no errors before the first save, then they follow what's typed.
  const [attempted, setAttempted] = useState(false);
  const [failed, setFailed] = useState(false);
  const saving = useRef(false);
  const problem = attempted ? tripNameProblem(name, otherTrips) : null;
  const inputRef = useRef<HTMLInputElement>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (saving.current) return;
    if (tripNameProblem(name, otherTrips)) {
      setAttempted(true); // keeps exactly what was typed
      inputRef.current?.focus();
      return;
    }
    saving.current = true;
    const result = await onSave(cleanName(name));
    saving.current = false;
    if (result === "saved") return;
    setFailed(true);
    inputRef.current?.focus();
  }

  function onKeyDown(event: KeyboardEvent) {
    if (event.key === "Escape") onCancel();
  }

  return (
    <Card className="motion-safe:animate-reveal">
      <form noValidate onSubmit={submit} onKeyDown={onKeyDown} aria-label="Rename trip" className="flex flex-col gap-4">
        <TextField
          ref={inputRef}
          label="Trip name"
          autoComplete="off"
          autoFocus
          onFocus={(event) => event.target.select()}
          value={name}
          onChange={(event) => {
            setName(event.target.value);
            setFailed(false);
          }}
          error={problem ? tripNameMessage(problem) : failed ? NOT_SAVED : undefined}
        />
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button type="submit">Save</Button>
          <Button onClick={onCancel}>Cancel</Button>
        </div>
      </form>
    </Card>
  );
}
