import { ButtonLink } from "@/components/Button";
import { Card } from "@/components/Card";
import { Page } from "@/components/Page";

// Home for a signed-out visitor: what Pack Again is and how to start. No trips here.
export function Landing() {
  return (
    <Page title="Packing lists for trips you repeat" signedOut>
      <Card className="flex flex-col gap-4">
        <p>Make a packing list once, tick it off as you pack, and it’s ready for the next trip.</p>
        <p className="text-muted">Start from a weekend at your parents’, a conference or a beach weekend.</p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <ButtonLink variant="primary" href="/sign-up">
            Sign up
          </ButtonLink>
          <ButtonLink href="/sign-in">Sign in</ButtonLink>
        </div>
      </Card>
    </Page>
  );
}
