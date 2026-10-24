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
- `35-trip-from-add-destination`: a trip opened from a card's "Add a destination for weather tips", with focus in Destination (batch 3). Taken by arriving at each width, since resizing after arriving would hide the phone's zone.
- `36-trip-edit-item`: an item open for editing in its row (batch 4).
- `37-trip-packed-hidden`: packed items hidden from the packing bar (batch 4).
- `38-trip-departure-form`, `39-trip-departs-soon` and `40-my-trips-departure`: setting a departure date 3 days out, the trip with it (the band, and the board from that day), and My trips with its countdown, first (batch 4). The script removes the date again afterwards.

The test accounts have no first name in Clerk, so the greeting on My trips says "Good evening." with no name.

## Night flight

`after-dark/` has every screen in `after/` again, with the browser set to dark (Playwright's `colorScheme: "dark"`), so the dark theme from batch 5 shows. Same names, same starting point.

## Not captured

"Welcome back" and "Packing for a new trip?" only show for trips last changed or packed more than 2 days ago. They can't be reached without editing timestamps in the database.

## Found while taking them

After a trip is deleted, My trips doesn't say "Deleted …" (`before/29-my-trips-after-delete`). My trips was kept alive in the background from the earlier visit, so it never reads the message (Next.js keeps visited pages in React's `<Activity>`). Fixed in batch 2 (`after/29-my-trips-after-delete`), along with the takeoff bug and the others the same cause led to (see `docs/learning.md`).
