import Link from "next/link";
import type { MouseEvent, ReactNode } from "react";

type CardProps = {
  // Interactive cards contain a CardLink covering the whole card; hover, focus
  // and pressed states show on the card itself.
  interactive?: boolean;
  padded?: boolean;
  className?: string;
  children: ReactNode;
};

// Hover doubles the border with an inset line (no layout shift, no drop shadow), and
// hover or keyboard focus lifts the card 2px (not with reduced motion).
const interactiveClass =
  "group relative hover:border-ink hover:shadow-[inset_0_0_0_1px_var(--color-ink)] has-[[data-card-link]:focus-visible]:outline-2 has-[[data-card-link]:focus-visible]:outline-offset-2 has-[[data-card-link]:focus-visible]:outline-board has-[[data-card-link]:active]:bg-canvas motion-safe:transition-transform motion-safe:duration-150 motion-safe:ease-out motion-safe:hover:-translate-y-0.5 motion-safe:has-[[data-card-link]:focus-visible]:-translate-y-0.5";

export function Card({ interactive = false, padded = true, className = "", children }: CardProps) {
  return (
    <div
      className={`rounded border border-line bg-surface ${padded ? "p-4" : ""} ${interactive ? interactiveClass : ""} ${className}`}
    >
      {children}
    </div>
  );
}

// The card's main link. Its ::after stretches over the whole card, so the card is
// one big hit area without wrapping it in a link. A second link inside the card
// needs "relative z-20" to sit above this one.
type CardLinkProps = { href: string; onClick?: (event: MouseEvent<HTMLAnchorElement>) => void; children: ReactNode };

export function CardLink({ href, onClick, children }: CardLinkProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      data-card-link
      className="decoration-2 underline-offset-4 group-hover:underline focus-visible:outline-none after:absolute after:inset-0 after:z-10 after:content-['']"
    >
      {children}
    </Link>
  );
}
