import type { ReactNode } from "react";
import type { Sky } from "@/lib/weather";

// Line icons on a grid of 24, in the text color around them. The rain, drizzle and
// snow icons share a cloud raised to make room for what falls from it. The partly
// cloudy one hides its sun behind the cloud with the background color: the board's
// navy unless it's on something else, like a card.
const CLOUD = "M7 19h10.5a4.5 4.5 0 0 0 .4-8.98A6.5 6.5 0 0 0 5.6 11.6 3.75 3.75 0 0 0 7 19z";
const RAISED = "translate(0 -4)";

type WeatherIconProps = { sky: Sky; background?: string; className?: string };

export function WeatherIcon({ sky, background = "var(--color-board)", className = "size-5" }: WeatherIconProps) {
  const shapes: Record<Sky, ReactNode> = {
    clear: (
      <>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2.5V5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.75 1.75M16.95 16.95l1.75 1.75M5.3 18.7l1.75-1.75M16.95 7.05l1.75-1.75" />
      </>
    ),
    partly: (
      <>
        <circle cx="8.5" cy="8.5" r="3" />
        <path d="M8.5 2.5v1.5M2.5 8.5H4M4.25 4.25l1.05 1.05M12.75 4.25 11.7 5.3" />
        <path d={CLOUD} transform="translate(2 1) scale(0.9)" fill={background} />
      </>
    ),
    cloudy: <path d={CLOUD} />,
    fog: <path d="M3 8h18M5 12h14M3 16h18M7 20h10" />,
    drizzle: (
      <>
        <path d={CLOUD} transform={RAISED} />
        <path d="M8 18v1.5M12 19.5V21M16 18v1.5" />
      </>
    ),
    rain: (
      <>
        <path d={CLOUD} transform={RAISED} />
        <path d="M8.5 17 7 21M12.5 17 11 21M16.5 17 15 21" />
      </>
    ),
    snow: (
      <>
        <path d={CLOUD} transform={RAISED} />
        <circle cx="8" cy="18.5" r="1" fill="currentColor" />
        <circle cx="12" cy="20.5" r="1" fill="currentColor" />
        <circle cx="16" cy="18.5" r="1" fill="currentColor" />
      </>
    ),
    storm: (
      <>
        <path d={CLOUD} transform={RAISED} />
        <path d="M12.5 15.5 10 19.5h3l-2 3.5" />
      </>
    ),
  };
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 ${className}`}
    >
      {shapes[sky]}
    </svg>
  );
}
