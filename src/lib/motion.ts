// True when the person asked for less motion: animations are skipped, not shortened,
// and anything that waits for one happens straight away.
export function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
