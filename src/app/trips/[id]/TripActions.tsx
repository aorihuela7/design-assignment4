import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
  type RefObject,
} from "react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { ErrorMessage, NOT_SAVED } from "@/components/ErrorMessage";
import { TextField } from "@/components/Field";
import { TextButton } from "@/components/TextLink";
import { tripNameMessage } from "@/components/tripNameMessage";
import type { SaveResult } from "@/lib/storage";
import { cleanName, tripNameProblem, type Trip } from "@/lib/trips";

type TripOptionsProps = {
  // Where focus goes back to when the menu, or what it opened, closes.
  buttonRef: RefObject<HTMLButtonElement | null>;
  onRename: () => void;
  onDelete: () => void;
};

// "Trip options" beside the trip's title on the band: Rename trip and Delete trip, both
// rare, so tucked away. A button that opens a short list of buttons (not a modal):
// Escape closes it and puts focus back on the button; leaving it with Tab, or clicking
// anywhere else, closes it too.
export function TripOptions({ buttonRef, onRename, onDelete }: TripOptionsProps) {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const box = useRef<HTMLDivElement>(null);

  // A menu is a passing thing: closed again when Next keeps the page in the background.
  useLayoutEffect(() => () => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!box.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  const choose = (action: () => void) => {
    setOpen(false);
    action();
  };

  return (
    <div
      ref={box}
      className="relative"
      onKeyDown={(event) => {
        if (event.key !== "Escape" || !open) return;
        setOpen(false);
        buttonRef.current?.focus();
      }}
      onBlur={(event) => {
        if (!box.current?.contains(event.relatedTarget as Node)) setOpen(false);
      }}
    >
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((isOpen) => !isOpen)}
        className="-mx-1 inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded px-1 font-mono text-xs uppercase tracking-widest text-amber underline underline-offset-4 hover:decoration-2 active:bg-amber active:text-board"
      >
        Trip options
        <svg
          aria-hidden="true"
          viewBox="0 0 16 16"
          className={`size-3.5 transition-transform duration-150 ease-out motion-reduce:transition-none ${open ? "rotate-180" : ""}`}
        >
          <path d="M3 6l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="2" />
        </svg>
      </button>
      {open && (
        // A light card on the band: data-surface gives its buttons the navy focus ring.
        <div
          id={menuId}
          data-surface="light"
          className="absolute top-full left-0 z-40 mt-1 flex w-52 flex-col rounded border border-ink bg-surface px-3 py-1 motion-safe:animate-reveal"
        >
          <TextButton onClick={() => choose(onRename)}>Rename trip</TextButton>
          <TextButton onClick={() => choose(onDelete)}>Delete trip</TextButton>
        </div>
      )}
    </div>
  );
}

// The question takes focus, so a second Enter can't delete by accident; Tab
// reaches Delete trip, then Cancel.
type DeleteConfirmProps = { trip: Trip; onDelete: () => Promise<boolean>; onCancel: () => void };

export function DeleteConfirm({ trip, onDelete, onCancel }: DeleteConfirmProps) {
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

export function RenameForm({ current, otherTrips, onSave, onCancel }: RenameFormProps) {
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
    // A name taken in another tab or on another device shows like any other duplicate.
    if (result === "duplicate") setAttempted(true);
    else setFailed(true);
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
