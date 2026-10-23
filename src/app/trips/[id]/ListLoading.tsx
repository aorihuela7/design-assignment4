import { Card } from "@/components/Card";
import { Page } from "@/components/Page";

export const BACK_TO_MY_TRIPS = { href: "/", label: "Back to My trips" };

// Used as the Suspense fallback on the server and as the first client render,
// so both are identical and hydration matches. Shaped like the list: the bar
// (with the status where messages go), the Add item form and a section, so
// nothing jumps when the trip arrives.
export function ListLoading() {
  return (
    <Page title="Packing list" back={BACK_TO_MY_TRIPS} titleLoading wide>
      <div className="border-b border-line pt-2">
        <div aria-hidden="true" className="flex min-h-7 items-center gap-3">
          <span className="flex-1 border-t-2 border-dashed border-line" />
          <span className="h-3 w-28 rounded bg-line/60" />
        </div>
        <p role="status" className="flex min-h-11 items-center text-muted">
          Loading your trip…
        </p>
      </div>
      <div aria-hidden="true" className="flex flex-col gap-6">
        <Card className="flex flex-col gap-4">
          {[0, 1].map((i) => (
            <div key={i} className="flex flex-col gap-1.5">
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
            <span className="h-5 w-28 rounded bg-line/60" />
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
    </Page>
  );
}
