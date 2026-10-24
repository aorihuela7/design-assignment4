"use client";

import { useLayoutEffect, useRef } from "react";
import { prefersReducedMotion } from "@/lib/motion";

// A trip's 3-letter code, decorative (hidden from screen readers). When it changes, on
// screen or since it was last seen (a new destination), its letters flip over one after
// another like a departures board: 200ms in all, and not with reduced motion. Compared
// with the code last shown, so a card flips when My trips is shown again, not unseen.
export function FlipCode({ code }: { code: string }) {
  const letters = useRef<HTMLSpanElement>(null);
  const shown = useRef(code);
  useLayoutEffect(() => {
    if (shown.current === code) return;
    shown.current = code;
    if (prefersReducedMotion() || !letters.current) return;
    [...letters.current.children].forEach((letter, i) =>
      letter.animate([{ transform: "perspective(12em) rotateX(-90deg)", opacity: 0 }, {}], {
        duration: 160,
        delay: i * 20,
        easing: "ease-out",
        fill: "backwards",
      }),
    );
  }, [code]);
  return (
    <span ref={letters} aria-hidden="true" className="inline-flex">
      {[...code].map((letter, i) => (
        <span key={i} className="inline-block">
          {letter}
        </span>
      ))}
    </span>
  );
}
