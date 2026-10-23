type NewBadgeProps = {
  children?: string;
  // Just appeared: stamps in once (not with reduced motion).
  stamp?: boolean;
};

export function NewBadge({ children = "New", stamp = false }: NewBadgeProps) {
  return (
    <span
      className={`inline-block border border-ink px-1.5 py-0.5 font-mono text-xs leading-none uppercase tracking-wider text-ink ${
        stamp ? "motion-safe:animate-stamp" : ""
      }`}
    >
      {children}
    </span>
  );
}
