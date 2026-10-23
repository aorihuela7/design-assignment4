"use client";

import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Page } from "@/components/Page";

// Shown if a page breaks unexpectedly: the Departures header, a way to try again,
// and a way back. Saved trips aren't touched by a page error.
export default function ErrorPage({ retry }: { error: unknown; retry: () => void }) {
  return (
    <Page title="Something went wrong" back={{ href: "/", label: "Back to My trips" }}>
      {/* Error pages can't export metadata; React puts this title in the head. */}
      <title>Something went wrong · Pack Again</title>
      <Card className="flex flex-col gap-4">
        <p>This page hit a problem. Your trips are still saved.</p>
        <div>
          <Button onClick={() => retry()}>Try again</Button>
        </div>
      </Card>
    </Page>
  );
}
