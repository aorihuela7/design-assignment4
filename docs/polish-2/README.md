# Polish pass 2: screenshots

Every screen before and after the second polish pass (branch `polish`), at 390 px and 1440 px wide, as full pages. File names match between `before/` and `after/`.

## How they were taken

- **Setup:** the project's own Playwright drove the installed Google Chrome against a local dev server.
- **Accounts:** test user A was signed in with Clerk's `clerk.signIn`. Test user B was used for "no trips", and their starter trips were added back afterwards.
- **Demo states,** set up through the app on top of A's fresh starter trips:
  - Conference trip: partly packed, going to Singapore.
  - Beach weekend: going to Málaga.
  - Weekend at parents': all packed, plus one forgotten item.
- **Loading and weather states:** loading states were held open by delaying requests in the browser. "Nothing found" and "unavailable" used the development-only `?weather=none` and `?weather=down`.
- **The phone's weather block (after batch 1):** on a phone, the trip page's weather is one block that opens and closes. The weather screens (07–09, 12, 15–18) show it open; the rest show it closed, as it is when a trip page opens.
- **Retaken after each batch** into `after/`, from the same starting point: A's trips reset to the untouched starter trips first.

## New in `after/`

- `34-trip-options-menu`: the Trip options menu, open (batch 1).

## Not captured

"Welcome back" and "Packing for a new trip?" only show for trips last changed or packed more than 2 days ago. They can't be reached without editing timestamps in the database.

## Found while taking them

After a trip is deleted, My trips doesn't say "Deleted …" (`before/29-my-trips-after-delete`). My trips was kept alive in the background from the earlier visit, so it never reads the message (Next.js keeps visited pages in React's `<Activity>`). Batch 2 fixes it, along with the takeoff bug.
