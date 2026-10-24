import Link from "next/link";
import type { ComponentProps } from "react";

type Variant = "primary" | "secondary" | "danger" | "quiet" | "subtle";

const base =
  "inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded border py-2 font-mono uppercase tracking-wider";

const variants = {
  // Accent is reserved for the primary action.
  primary:
    "border-accent bg-accent px-4 text-sm text-white enabled:hover:border-accent-hover enabled:hover:bg-accent-hover enabled:active:border-accent-pressed enabled:active:bg-accent-pressed",
  secondary: "border-ink bg-surface px-4 text-sm text-ink enabled:hover:bg-canvas enabled:active:bg-line",
  // Confirms something that can't be undone: solid ink, distinct from Cancel without the
  // accent. Its text is the card's color, so it reads at night too, when ink is light.
  danger:
    "border-ink bg-ink px-4 text-sm text-surface enabled:hover:border-muted enabled:hover:bg-muted enabled:active:border-board enabled:active:bg-board enabled:active:text-white",
  // In-place actions inside a row, like Undo: no border until hovered.
  quiet: "border-transparent bg-transparent px-4 text-sm text-ink enabled:hover:border-ink enabled:active:bg-line",
  // Repeated on every row, like Edit and Remove: small, muted until hovered or focused,
  // and narrow, so the item names lead and wrap less. Still a 44px target.
  subtle:
    "border-transparent bg-transparent px-2 text-xs text-muted enabled:hover:border-ink enabled:hover:text-ink focus-visible:text-ink enabled:active:bg-line",
};

// Links can't be disabled, so they only need hover and pressed.
const linkVariants = {
  primary:
    "border-accent bg-accent px-4 text-sm text-white hover:border-accent-hover hover:bg-accent-hover active:border-accent-pressed active:bg-accent-pressed",
  secondary: "border-ink bg-surface px-4 text-sm text-ink hover:bg-canvas active:bg-line",
};

// ComponentProps includes ref, which React 19 passes through like any prop.
type ButtonProps = ComponentProps<"button"> & { variant?: Variant };

export function Button({ variant = "secondary", type = "button", className = "", ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={`${base} disabled:cursor-not-allowed disabled:border-line disabled:bg-canvas disabled:text-muted ${variants[variant]} ${className}`}
      {...props}
    />
  );
}

// A link that looks like a button, for actions that go to another page.
type ButtonLinkProps = ComponentProps<typeof Link> & { variant?: keyof typeof linkVariants };

export function ButtonLink({ variant = "secondary", className = "", ...props }: ButtonLinkProps) {
  return <Link className={`${base} ${linkVariants[variant]} ${className}`} {...props} />;
}
