import { useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/Button";
import { NOT_SAVED } from "@/components/ErrorMessage";
import { SelectField, TextField } from "@/components/Field";
import type { SaveResult } from "@/lib/storage";
import { cleanName, itemNameError, SECTIONS, type Item, type Section } from "@/lib/trips";

type EditItemProps = {
  item: Item;
  // The trip's other items, which its new name mustn't repeat.
  otherItems: Item[];
  onSave: (name: string, section: Section) => Promise<SaveResult>;
  onCancel: () => void;
};

const sectionOptions = SECTIONS.map(({ value, label }) => ({ value, label }));

// An item's row while it's being changed: its name and its section, with Save and
// Cancel. The same checks and messages as Add item, and what was typed stays if it
// doesn't save. Escape or Cancel leaves the item as it was.
export function EditItem({ item, otherItems, onSave, onCancel }: EditItemProps) {
  const [name, setName] = useState(item.name);
  const [section, setSection] = useState<Section>(item.section);
  // No errors before the first Save; after it, the error follows what's typed.
  const [attempted, setAttempted] = useState(false);
  const [failed, setFailed] = useState(false);
  const saving = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const error = (attempted ? itemNameError(name, otherItems) : null) ?? (failed ? NOT_SAVED : null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (saving.current) return;
    if (itemNameError(name, otherItems)) {
      setAttempted(true); // keeps exactly what was typed
      inputRef.current?.focus();
      return;
    }
    saving.current = true;
    const result = await onSave(cleanName(name), section);
    saving.current = false;
    if (result === "saved") return;
    // A name taken in another tab or on another device shows like any other duplicate.
    if (result === "duplicate") setAttempted(true);
    else setFailed(true);
    inputRef.current?.focus();
  }

  return (
    <li className="px-4 py-3">
      <form
        noValidate
        onSubmit={submit}
        onKeyDown={(event) => event.key === "Escape" && onCancel()}
        aria-label={`Edit ${item.name}`}
        // Stacked on a phone; wider, on one row like Add item.
        className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-start sm:gap-x-3"
      >
        <div className="min-w-0 sm:min-w-48 sm:flex-1">
          <TextField
            ref={inputRef}
            label="Item name"
            autoComplete="off"
            autoFocus
            onFocus={(event) => event.target.select()}
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              setFailed(false);
            }}
            error={error ?? undefined}
          />
        </div>
        <div className="sm:w-40">
          <SelectField
            label="Section"
            options={sectionOptions}
            value={section}
            onChange={(event) => setSection(event.target.value as Section)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          {/* As tall as a field's label, so the buttons line up with the fields. */}
          <span aria-hidden="true" className="hidden h-4 sm:block" />
          <div className="flex gap-3">
            <Button type="submit">Save</Button>
            <Button onClick={onCancel}>Cancel</Button>
          </div>
        </div>
      </form>
    </li>
  );
}
