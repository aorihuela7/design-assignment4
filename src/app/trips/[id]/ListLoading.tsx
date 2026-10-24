import { Card } from "@/components/Card";
import { Page } from "@/components/Page";

export const BACK_TO_MY_TRIPS = { href: "/", label: "Back to My trips" };

// Used as the Suspense fallback on the server and as the first client render,
// so both are identical and hydration matches. Shaped like the trip page, so
// nothing jumps when the trip arrives: a place for Trip options on the band, the
// weather (the closed block on a phone, the panel's heading wider), the bar (with
// the status where messages go), the Add item form and a section.
export function ListLoading() {
  const bar = "rounded bg-line/60";
  return (
    <Page
      title="Packing list"
      back={BACK_TO_MY_TRIPS}
      titleLoading
      wide
      // The same words as Trip options, unseen, so the band lines up the same way.
      titleAction={
        <span
          aria-hidden="true"
          className="invisible inline-flex min-h-11 items-center px-1 font-mono text-xs uppercase tracking-widest"
        >
          Trip options
        </span>
      }
    >
      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-start lg:gap-x-10">
        <div aria-hidden="true" className="lg:col-start-2 lg:row-start-1">
          <div className="flex rounded border border-line bg-surface px-4 py-3 lg:hidden">
            <span className="flex flex-col">
              <span className="flex h-4 items-center">
                <span className={`h-3 w-40 ${bar}`} />
              </span>
              <span className="flex h-5 items-center">
                <span className={`h-3 w-52 max-w-full ${bar}`} />
              </span>
            </span>
          </div>
          <span className="hidden h-8 items-center lg:flex">
            <span className={`h-5 w-48 ${bar}`} />
          </span>
        </div>

        <div className="flex min-w-0 flex-col gap-6 lg:col-start-1 lg:row-start-1">
          <div className="border-b border-line pt-2 pb-1">
            <div aria-hidden="true" className="flex min-h-7 items-center gap-3">
              <span className="flex-1 border-t-2 border-dashed border-line" />
              <span className={`h-3 w-28 ${bar}`} />
            </div>
            <p role="status" className="flex min-h-6 items-center text-muted">
              Loading your trip…
            </p>
          </div>
          <div aria-hidden="true" className="flex flex-col gap-6">
            {/* Stacked on a phone; one row wider, like the form. */}
            <Card className="flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-x-3">
              {["sm:flex-1", "sm:w-40"].map((width) => (
                <div key={width} className={`flex flex-col gap-1.5 ${width}`}>
                  <span className="flex h-4 items-center">
                    <span className="h-3 w-24 rounded bg-canvas" />
                  </span>
                  <span className="min-h-11 rounded border border-line" />
                </div>
              ))}
              <span className="h-11 w-32 rounded bg-canvas" />
            </Card>
            <div className="flex flex-col gap-2">
              <span className="flex h-8 items-center">
                <span className={`h-5 w-28 ${bar}`} />
              </span>
              <Card padded={false}>
                <ul className="divide-y divide-line">
                  {[0, 1, 2, 3].map((i) => (
                    <li key={i} className="flex min-h-11 items-center gap-3 px-4 py-2">
                      <span className="size-6 rounded border-2 border-line" />
                      <span className="h-4 w-40 max-w-full rounded bg-canvas" />
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </Page>
  );
}
