# Pack Again — packing lists for trips you repeat (Design, Build, Ship, Assignment 4)

## Rules
- Small commits, one per change, with specific messages.
- Never one-shot a feature: work in the steps I ask for.
- Remove anything unnecessary: steps, fields, interactions, words.

## Working rules
- Work on the `assignment-4` branch.
- Stay on free tiers.
- No package beyond Clerk, Supabase and Playwright without asking me first.
- Never kill or reuse processes or ports you didn’t start in this session; pick a free port and clean up only your own processes.
- When unsure, ask me (I get push notifications on my phone).
- When you finish a task, or when you need a decision from me, send me a push notification with a one-line summary of what you did or what you need.

## Stack
Next.js (App Router) and Tailwind CSS. Clerk for sign-in (development keys only). Supabase for data. Open-Meteo for weather. Playwright for one end-to-end test. Deployed on Vercel's free Hobby plan.

## Security
- Keys live only in environment variables: never in code, commits or logs.
- Never read, write or print `.env` files.
- Every table holding someone's data has a `user_id` column and row-level security.
- A signed-out visitor sees no one's data.
- Never use the Supabase secret key in the browser.

## Data model
Supabase Postgres, migrations in `supabase/migrations/`, diagram in `docs/data-model.md`.
- Every row belongs to one person: `user_id text not null default auth.jwt()->>'sub'`, the Clerk user id from the session token. Text, not uuid; never `auth.uid()`.
- Row-level security on every table. Separate select, insert, update and delete policies for `authenticated`, each checking `(select auth.jwt()->>'sub') = user_id`. `anon` has no grants.
- `trips`: `id`, `user_id`, `name` (1–40 characters, unique per person ignoring case), an optional destination (`destination_name`, `destination_country`, `latitude`, `longitude`, `timezone`; all or nothing, and no forecast saved), `last_packed_at`, `prompt_dismissed_at`, `ticks_cleared_at`, `created_at` (the order trips were made in) and `updated_at` (set by triggers on any change to the trip or its items).
- `items`: `id`, `user_id`, `trip_id` (deleting a trip deletes its items), `name` (1–60 characters, unique per trip ignoring case), `section` (clothes, toiletries, tech, documents or other), `packed`, `is_new` and `created_at` (the order items were added in). The insert and update policies also check that the trip belongs to the same person.
- `profiles`: `user_id` (primary key) and `starters_added_at`. Select and insert only. `add_starter_trips(starters jsonb)` makes the profile and the starter trips in one transaction, and does nothing if the profile already exists.
- Trips saved in a browser before accounts (localStorage) are ignored: everyone starts fresh.

## Weather
Open-Meteo (no key) is called from the browser, not from our server. Decided 23 Oct, step 6, because:
- There's no key to hide, which is the main reason to go through a server.
- Each person's own IP gets Open-Meteo's per-IP limit (10,000 calls a day). Vercel's IPs are shared with other apps, so calls from our server could be refused because of traffic that isn't ours.
- On Vercel's serverless functions an in-memory cache rarely survives between requests, and a shared cache costs extra. So the server wouldn't cache much better than the browser.
- It uses no function calls or CPU time on the Hobby plan.
- The trade-off: Open-Meteo sees each person's IP with the destination, and the input checks and the timeout live in browser code.

Only the destination is saved, never the forecast. "Weather data by Open-Meteo.com" links to open-meteo.com next to the weather.

## Design
The Departures theme: boarding passes, airport signage, the navy band, amber, B612 and Barlow Condensed. The accent color is for the primary action only.

## Flows
First visit (useful right away, never an empty dead end) → main task (build and tick off a packing list) → coming back (it remembers me, with a reason to return).

## Forms
One column. A visible label on every field. Errors sit next to the field and say what to do next ("Enter an item name", not "Invalid input"). Keep what the person typed when there is an error.

## Components
Shared components for buttons, inputs, fields (label + error), cards, and navigation, used consistently everywhere.

## Navigation
The person always knows where they are and how to go back.

## Accessibility
Everything works with a keyboard, visible focus ring, real labels, text contrast at least 4.5:1, checked by script. Never use color alone to convey state.

## Motion
Purposeful and quick (150 to 300ms) and never blocking input, using CSS, the Web Animations API or view transitions. With prefers-reduced-motion: no movement, instant state changes.

## Docs
README.md must show the flows diagram and the first-run usability check.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
