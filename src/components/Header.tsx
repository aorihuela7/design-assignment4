import Link from "next/link";

export const PAGE_TITLE_ID = "page-title";

type HeaderProps = {
  // Current page name, shown large on the board and used as the page's h1.
  title: string;
  // On My trips the home link is the current page.
  isHome?: boolean;
  // While the page's own name is loading: a blank bar on screen, the title for screen readers.
  titleLoading?: boolean;
};

export function Header({ title, isHome = false, titleLoading = false }: HeaderProps) {
  return (
    <header data-surface="board" className="bg-board text-amber">
      <div className="mx-auto w-full max-w-225 px-4 pt-3 pb-5 sm:px-6">
        <div className="flex items-center font-mono text-xs uppercase tracking-widest">
          <Link
            href="/"
            aria-current={isHome ? "page" : undefined}
            className="-mx-1 inline-flex min-h-11 shrink-0 items-center rounded px-1 underline-offset-4 hover:underline active:bg-amber active:text-board"
          >
            Pack Again
          </Link>
        </div>
        {/* tabIndex -1: pages can move focus here on arrival; no ring, since it isn't a control. */}
        <h1
          id={PAGE_TITLE_ID}
          tabIndex={-1}
          className="mt-1 font-display text-4xl font-semibold uppercase tracking-wide wrap-anywhere outline-none sm:text-5xl"
        >
          {titleLoading ? (
            <>
              <span className="sr-only">{title}</span>
              <span aria-hidden="true" className="inline-block h-[0.7em] w-[6em] max-w-full rounded bg-white/10" />
            </>
          ) : (
            title
          )}
        </h1>
      </div>
    </header>
  );
}
