import { ViewTransition, type ReactNode } from "react";
import { BackLink } from "./BackLink";
import { Header } from "./Header";

type PageProps = {
  title: string;
  // Every page except My trips says where "back" goes.
  back?: { href: string; label: string };
  // The title isn't known yet (a trip's name is still loading).
  titleLoading?: boolean;
  // A trip's code, shown on the board like on its card.
  code?: string;
  // A trip's page: its title morphs from the card that opened it.
  titleTransition?: string;
  // The landing, sign-in and sign-up pages: Sign in and Sign up instead of the account menu.
  signedOut?: boolean;
  // A trip's page: wider, so its list and its weather can sit side by side.
  wide?: boolean;
  // Shown on the band beside the title, like a trip's options menu.
  titleAction?: ReactNode;
  // A line on the band under the title, like a trip's departure.
  detail?: string;
  children: ReactNode;
};

export function Page({
  title,
  back,
  titleLoading = false,
  code,
  titleTransition,
  signedOut,
  wide = false,
  titleAction,
  detail,
  children,
}: PageProps) {
  return (
    <>
      {/* Only home (My trips, or the landing page) has no back link. */}
      <Header
        title={title}
        isHome={!back}
        titleLoading={titleLoading}
        code={code}
        titleTransition={titleTransition}
        signedOut={signedOut}
        wide={wide}
        titleAction={titleAction}
        detail={detail}
      />
      {/* Moving to another page fades the content out and the new content in. */}
      <ViewTransition enter="page-in" exit="page-out" default="none">
        <main
          className={`mx-auto flex w-full ${wide ? "max-w-288" : "max-w-225"} flex-1 flex-col gap-6 px-4 py-6 sm:px-6`}
        >
          {back && (
            <div className="-mt-2">
              <BackLink href={back.href}>{back.label}</BackLink>
            </div>
          )}
          {children}
        </main>
      </ViewTransition>
    </>
  );
}
