import { useId, useRef, useState, type FormEvent, type RefObject } from "react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { NOT_SAVED } from "@/components/ErrorMessage";
import { SelectField, TextField } from "@/components/Field";
import { SectionHeading } from "@/components/SectionHeading";
import type { SaveResult } from "@/lib/storage";
import { cleanName, itemNameError, SECTIONS, type Item, type Section } from "@/lib/trips";

type AddItemFormProps = {
  items: Item[];
  onAdd: (name: string, section: Section) => Promise<SaveResult>;
  // A new error replaces whatever the progress bar was saying.
  onError: () => void;
  inputRef: RefObject<HTMLInputElement | null>;
  // The list is fully packed: what's added now is for next time.
  forgotMode: boolean;
};

const sectionOptions = SECTIONS.map(({ value, label }) => ({ value, label }));

export function AddItemForm({ items, onAdd, onError, inputRef, forgotMode }: AddItemFormProps) {
  const headingId = useId();
  const [name, setName] = useState("");
  // Last section picked on this page; Clothes on arrival. Not saved.
  const [section, setSection] = useState<Section>("clothes");
  // No errors before the first submit; after it, the error follows what's typed. It
  // belongs to the mode it was made in, so switching to "Forgot something?" clears it.
  const [attemptedIn, setAttemptedIn] = useState<boolean | null>(null);
  // Not saved, for a reason other than the name: said under the field until it changes.
  const [failed, setFailed] = useState(false);
  const saving = useRef(false);
  const error = (attemptedIn === forgotMode ? itemNameError(name, items) : null) ?? (failed ? NOT_SAVED : null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    inputRef.current?.focus();
    if (saving.current) return;
    if (itemNameError(name, items)) {
      setAttemptedIn(forgotMode); // keeps exactly what was typed
      onError();
      return;
    }
    // The name is fine; once saved, the item mustn't clash with itself.
    setAttemptedIn(null);
    saving.current = true;
    const result = await onAdd(cleanName(name), section);
    saving.current = false;
    if (result === "saved") {
      // Emptied once it's saved, unless something else was typed meanwhile.
      setName((current) => (current === name ? "" : current));
      return;
    }
    // A name taken in another tab or on another device shows like any other duplicate.
    setAttemptedIn(forgotMode);
    setFailed(result === "failed");
    onError();
  }

  return (
    <Card>
      <form noValidate onSubmit={submit} aria-labelledby={headingId} className="flex flex-col gap-4">
        {/* "Add an item" only repeats the button, so it's for screen readers; the
            Forgot something? heading changes what the form does, so it shows. */}
        <SectionHeading id={headingId} className={forgotMode ? "" : "sr-only"}>
          {forgotMode ? "Forgot something?" : "Add an item"}
        </SectionHeading>
        <TextField
          ref={inputRef}
          label="Item name"
          autoComplete="off"
          value={name}
          onChange={(event) => {
            setName(event.target.value);
            setFailed(false);
          }}
          // Leaving an empty field drops its error; nothing is left to fix.
          onBlur={() => {
            if (cleanName(name) === "") setAttemptedIn(null);
          }}
          error={error ?? undefined}
        />
        <SelectField
          label="Section"
          options={sectionOptions}
          value={section}
          onChange={(event) => setSection(event.target.value as Section)}
        />
        <div>
          <Button type="submit" variant="primary">
            {forgotMode ? "Add it for next time" : "Add item"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
