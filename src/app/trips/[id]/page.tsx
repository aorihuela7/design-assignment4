import type { Metadata } from "next";
import { Suspense } from "react";
import { ListLoading } from "./ListLoading";
import { PackingList } from "./PackingList";

export const metadata: Metadata = { title: "Packing list" };

// The id is only known at request time, so the list reads it inside Suspense. It's
// handed down rather than read with useParams(): Next keeps visited trips in the
// background (React's Activity), and there useParams() gives the params of the page on
// screen, so a kept trip would look for the wrong one.
export default function PackingListPage({ params }: PageProps<"/trips/[id]">) {
  return (
    <Suspense fallback={<ListLoading />}>
      <PackingList params={params} />
    </Suspense>
  );
}
