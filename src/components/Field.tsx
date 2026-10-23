"use client";

import { useId, type ComponentProps, type ReactNode } from "react";
import { ErrorMessage } from "./ErrorMessage";

type FieldProps = {
  id: string;
  label: string;
  // Usually a sentence; can hold a link, e.g. to an existing list.
  error?: ReactNode;
  children: ReactNode;
};

// Label above, error directly below the control. One column.
export function Field({ id, label, error, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="font-mono text-xs uppercase tracking-wider text-ink">
        {label}
      </label>
      {children}
      {error && <ErrorMessage id={`${id}-error`}>{error}</ErrorMessage>}
    </div>
  );
}

// Invalid fields get a 2px border; padding shrinks by 1px so text doesn't shift.
const controlClass =
  "min-h-11 w-full rounded border border-muted bg-surface px-3 py-2 text-ink placeholder:text-muted enabled:hover:border-ink aria-invalid:border-2 aria-invalid:border-ink aria-invalid:px-[11px] aria-invalid:py-[7px] disabled:cursor-not-allowed disabled:border-line disabled:bg-canvas disabled:text-muted";

function describedBy(id: string, error: ReactNode, own: string | undefined) {
  return [own, error ? `${id}-error` : undefined].filter(Boolean).join(" ") || undefined;
}

// ComponentProps includes ref, which React 19 passes through like any prop.
type TextFieldProps = Omit<ComponentProps<"input">, "id"> & {
  label: string;
  error?: ReactNode;
};

export function TextField({ label, error, type = "text", className = "", ...props }: TextFieldProps) {
  const id = useId();
  return (
    <Field id={id} label={label} error={error}>
      <input
        {...props}
        id={id}
        type={type}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, error, props["aria-describedby"])}
        className={`${controlClass} ${className}`}
      />
    </Field>
  );
}

type SelectFieldProps = Omit<ComponentProps<"select">, "id"> & {
  label: string;
  error?: ReactNode;
  options: { value: string; label: string }[];
};

export function SelectField({ label, error, options, className = "", ...props }: SelectFieldProps) {
  const id = useId();
  return (
    <Field id={id} label={label} error={error}>
      <div className="relative">
        <select
          {...props}
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(id, error, props["aria-describedby"])}
          className={`${controlClass} cursor-pointer appearance-none pr-10 aria-invalid:pr-10 ${className}`}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <svg
          aria-hidden="true"
          viewBox="0 0 16 16"
          className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-ink"
        >
          <path d="M3 6l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="2" />
        </svg>
      </div>
    </Field>
  );
}
