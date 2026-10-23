import type { Metadata } from "next";
import { SignUp } from "@clerk/nextjs";
import { Suspense } from "react";
import { Page } from "@/components/Page";

export const metadata: Metadata = { title: "Sign up" };

// Clerk's form reads the address and loads in the browser; until then, say what's coming.
const loading = <p role="status" className="text-muted">Loading sign-up…</p>;

// A catch-all route, so Clerk's later steps (like verifying the email) stay on this page.
export default function SignUpPage() {
  return (
    <Page title="Sign up" back={{ href: "/", label: "Back to Pack Again" }}>
      <Suspense fallback={loading}>
        <SignUp fallback={loading} />
      </Suspense>
    </Page>
  );
}
