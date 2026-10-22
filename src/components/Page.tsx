import type { ReactNode } from "react";
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
  children: ReactNode;
};

export function Page({ title, back, titleLoading = false, code, children }: PageProps) {
  return (
    <>
      {/* Only My trips has no back link: it's home. */}
      <Header title={title} isHome={!back} titleLoading={titleLoading} code={code} />
      <main className="mx-auto flex w-full max-w-225 flex-1 flex-col gap-6 px-4 py-6 sm:px-6">
        {back && (
          <div className="-mt-2">
            <BackLink href={back.href}>{back.label}</BackLink>
          </div>
        )}
        {children}
      </main>
    </>
  );
}
