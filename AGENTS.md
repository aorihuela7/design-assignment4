# Pack Again — packing lists for trips you repeat (Design, Build, Ship, Assignment 4)

## Rules
- Small commits, one per change, with specific messages.
- Never one-shot a feature: work in the steps I ask for.
- Remove anything unnecessary: steps, fields, interactions, words.

## Working rules
- Work on the `assignment-4` branch.
- Stay on free tiers.
- No package beyond Clerk, Supabase and Playwright without asking me first.
- When unsure, ask me (I get push notifications on my phone).

## Stack
Next.js (App Router) and Tailwind CSS. Clerk for sign-in (development keys only). Supabase for data. Open-Meteo for weather. Playwright for one end-to-end test. Deployed on Vercel's free Hobby plan.

## Security
- Keys live only in environment variables: never in code, commits or logs.
- Never read, write or print `.env` files.
- Every table holding someone's data has a `user_id` column and row-level security.
- A signed-out visitor sees no one's data.
- Never use the Supabase secret key in the browser.

## Data model
To fill in at step 2.

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
