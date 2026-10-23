import type { Metadata } from "next";
import { Show } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { Suspense } from "react";
import { Page } from "@/components/Page";
import { Landing } from "./Landing";
import { MyTrips } from "./MyTrips";

// The title template only applies below the root layout.
export async function generateMetadata(): Promise<Metadata> {
  const { userId } = await auth();
  return { title: { absolute: userId ? "My trips · Pack Again" : "Pack Again" } };
}

// Home is My trips when signed in, and the landing page when not. Who's signed in is
// only known at request time, so the page streams in; until then, just the band.
export default function HomePage() {
  return (
    <Suspense fallback={<Page title="Pack Again" titleLoading>{null}</Page>}>
      <Show when="signed-in" fallback={<Landing />}>
        <MyTrips />
      </Show>
    </Suspense>
  );
}
