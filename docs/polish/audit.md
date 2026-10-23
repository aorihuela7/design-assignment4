# Polish audit (22 Oct 2026)

Every screen and state at 390px (2x) and 1440px, from a production build, in [before/](before/). The files are named `NN-state.WIDTH.png`; the same names go in `after/` once each batch is built.

Not captured: the unexpected-error page (it can't be triggered without changing code) and live motion (stills only).

Value: **H** high, **M** medium, **L** low. Effort: **S** under an hour, **M** a few hours, **L** a day or more.

## Visual polish

| # | Finding (screenshot) | Proposal | Value | Effort |
|---|---|---|---|---|
| V1 | Ticking the last item, adding or removing makes the sticky bar one or two lines taller, so the whole list jumps down under the finger (21, 24, 25). In 25 the jump left the pointer on "Add it for next time". | Keep the bar one height: the message replaces part of the bar instead of adding lines. | H | M |
| V2 | The "Removed X · Undo" row is taller than an item row (bordered 44px button plus padding), so the rows below shift (24). | Same height as an item row, with Undo styled like Remove. | H | S |
| V3 | The loading states don't look like what loads. My trips shows plain cards, not boarding passes (01). The list shows four rows with no bar or form, and the header says "Packing list" before switching to the trip name (16). | Skeletons with the same shapes: stub, notches, bar, form, a section. A blank title line instead of "Packing list". | M | S |
| V4 | The boarding pass stubs don't line up. The runway gets shorter when the count is longer ("17 of 17"), so planes can't be compared across cards (05). An empty trip says "0 of 0 packed". A fully packed trip looks like any other. The code (WEP) is 10px and hard to read. The NEW box and the Forgot link are spaced unevenly. | A fixed-width count so runways match. "No items yet". "All packed" with the plane at the end. A slightly larger code. Even spacing. | H | M |
| V5 | Text actions use three styles: mono caps (Back, Forgot on the card), sans underlined (Rename, Delete, Forgot in the bar), and bold sans for "All packed" (05, 18, 25). | One style for text actions and one for status lines, matching the Departures labels. Write down the type scale (display, section, body, label) and use only those sizes. | M | S |
| V6 | "REMOVE" in mono caps on all 15 rows is the loudest thing in the list, louder than the item names (18). | A quieter Remove (see the question below). | H | S |
| V7 | Hovering a row tints a rounded box that stops short of Remove, so it looks misaligned (20). | Tint the full row edge to edge, on hover and when anything in the row has focus. | M | S |
| V8 | When a list comes back for a new trip, three blocks stack above the items: the prompt, "All packed", and the Forgot form (27). The prompt gives no reason it's asking. | Add "Last packed 19 Oct." to the prompt so it explains itself. Tighten the spacing between the blocks. | M | S |
| V9 | The Delete trip confirmation's button looks exactly like Cancel, and the question is plain bold text (30). | A warning icon like the notices, and a distinct but non-accent Delete button (see the question below). | M | S |
| V10 | The empty states are a bare heading or a sentence in a card ("No trips yet", "Nothing here yet") (07, 31). | A dashed boarding pass outline with one line and the action. No new words beyond one line. | M | S |
| V11 | On New trip at 1440px, the form card stretches 900px for one short field (12). | Cap the form at a readable width. | L | S |
| V12 | The favicon is still Next.js's default "N". | The Departures plane as `app/icon.svg`. | M | S |
| V13 | The Header band is the same on every page. Nothing ties a trip page to the card you opened. | Show the trip's code on its page header, as on the card. Decorative, hidden from screen readers. | M | S |
| V14 | When the sticky bar is stuck, it's the same color as the page with a 1px line, so the list seems to slide under nothing (19). | A clearer edge when stuck: a full-width rule, or a navy strip that matches the Header band. | L | S |

## Motion and microinteractions

All of these use CSS or the Web Animations API, run 150 to 300ms, never block input, and become instant state changes under `prefers-reduced-motion`.

| # | Moment | Proposal | Value | Effort |
|---|---|---|---|---|
| M1 | "All packed" | Ticking the last item flies the bar's plane off the end of the runway, nose up (the same takeoff as the card), and the "All packed" line fades in. | H | S |
| M2 | Plane on the runway | It moves now, but over 500ms. Bring it to 250ms ease-out on the bar and the cards. | L | S |
| M3 | Ticking | The check and strike-through already draw. Add a 150ms press on the box (scale 0.9 to 1). | L | S |
| M4 | Adding a row | The new row grows in (height and opacity, 200ms) before the existing tint fades. Restoring with Undo does the same. | M | S |
| M5 | Removing a row | The row crossfades into "Removed X · Undo" in 150ms instead of swapping. | L | S |
| M6 | NEW stamp | When an item is added after "All packed", or when a card first shows "N added", the badge stamps in: scale 1.15 to 1 with a slight rotation that settles straight, 200ms. | M | S |
| M7 | Page transitions | React 19.3's built-in `<ViewTransition>`, which uses the browser's View Transitions API and needs no package: the card's trip name morphs into the Header's title when a trip opens, and back. Other pages crossfade in 200ms. Browsers without support just navigate. | H | M |
| M8 | Opening a card | The takeoff holds navigation for 350ms. With M7, cut it to about 200ms and let the morph do the rest. | M | S |
| M9 | Rename and Delete panels | They open in place with a 200ms height reveal instead of appearing at once. | L | S |

## New features

### (a) UI only: no new saved fields, buildable now

| # | Feature | Value | Effort |
|---|---|---|---|
| F1 | Section progress in each heading: "Clothes · 2 of 5". When a section is done, a small "Done" in text, not color. | H | S |
| F2 | Start a new trip from an existing one ("Copy items from: Beach weekend"). It creates a normal trip with the usual fields. | H | M |
| F3 | Undo for Clear all ticks, like Remove (held in memory only). | M | S |
| F4 | Packed items move to the end of their section, or a "Hide packed" switch that isn't saved. | M | S |
| F5 | Copy the list as text, to paste into a message (Clipboard API). | M | S |
| F6 | Live boarding pass preview on New trip: the code and card update as you type. | M | S |
| F7 | Rename an item, or move it to another section, in place (uses the existing name and section fields). | M | M |
| F8 | On phones, collapse the Add item form behind an "Add item" button so the list comes first. | M | M |
| F9 | Print stylesheet: a clean one-page checklist. | L | S |

### (b) Needs new saved fields (for the database step only)

These go into `docs/plan.md` under "Later (needs new data)": quantities ("Socks × 5"); notes per item; custom sections and section order; manual item order across sections; trip dates with "Departs in 3 days" and reminders; archive or pin a trip; packing history ("forgotten 3 times"); a base list per trip vs. per-trip extras; which bag an item goes in; who packs what; a remembered section per trip; sync across devices and sharing (the database itself).

## Outcome

Built: V1–V14, M1–M9 and F6 (chosen 22 Oct 2026). Where the build differs from the plan above:

- **V1:** the bar's second line is always there (44px), blank when there's nothing to say, so nothing moves when a message appears.
- **V14:** the full-width rule shows only while the bar is stuck; at the top of the page it stays at the content width.
- **M6:** a card's badge stamps in the first time this tab shows its count. What was seen is kept in memory, so a reload stamps it once more; remembering across visits would need saved data.
- **M7:** the title morph needs the trip page to render in the same step as the navigation, which it does once the route is prefetched (always, in the production build). Otherwise the page just fades.
- **M9:** a clip-path reveal hid the panel from clicks for 200ms, so it became a fade with a 4px drop, usable from the first frame.
- **Kept as is:** the 1.8s tint on a just-added or restored row. It fades a highlight and doesn't move anything, so it stays longer than the 150 to 300ms used for motion.
- **F6:** the preview's title also morphs into the new trip's page title on Create trip.

Unchanged: the storage key (`pack-again:v1`) and the shape of saved data.
