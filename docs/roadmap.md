# Assignment 4 roadmap

**Brief:** "Full Stack App", MPCS 51238, due **Tue 27 Oct 2026, 5:30 PM**. Source: `~/Downloads/assignment4.pdf` (not in the repo).
**Goal:** classmates can make an account in Pack Again and use it, and each person sees only their own trips. Clerk for sign-in, Supabase with row-level security, Open-Meteo for weather, one Playwright test, deployed on Vercel Hobby.

## How we work

- Branch `assignment-4`, one commit per change. Nothing is merged into `main`, pushed or deployed to production without your explicit OK.
- One step at a time. At the end of each step: run its Ask Your Agent prompt and save the answer in `docs/learning.md`, update this file (status and decisions), send a push with a summary and the files changed, then **wait for "continue"**.
- Any decision about design, data, security or cost: one short question, 2–4 options, with my recommendation.
- I ask before creating or changing any migration or RLS policy, and before touching any Clerk, Supabase or Vercel setting.
- Keys: I never read, write or print `.env` files or key values. You create `.env.local` and paste the keys; I only name the variables.
- Packages: Clerk, Supabase and Playwright only. Anything else I ask about first.

## Status

| Step | Status |
|---|---|
| 0 Context and free tiers | In progress |
| 1 Tool and API | In progress |
| 2 Data model | Not started |
| 3 Protect keys | Deny rule committed early; rest not started |
| 4 Clerk sign-in | Code done (`502ee83`–`b96478e`); waiting for keys to check it running |
| 5 Supabase + Clerk | App reads and writes Supabase (`7038317`–`24fc194`). Migrations applied to `fmitwpdmqajkvxczutwd` and RLS checked with two simulated users; waiting for your two-account check |
| 6 Where the API call happens | Built in the browser (`3b2cd35`–`9cd9f4e`), plus a summary at the top (`ce3f9c3`, `08608d7`); Ask answers written; waiting for your check of each state |
| 7 Playwright test, failing first | Done: seen passing, failing with RLS broken, then passing again (`36bbd39`, `b24cbea`) |
| 8 Review and deploy | Done: `/security-review` findings handled, merged into `main` (PR #1) and live at https://design-assignment4.vercel.app |
| Polish pass 2 | In progress on `polish` (below): batches 1 to 3 done; batch 4 done but the departure date |

**Next action:** run the departure date's migration in Supabase › SQL Editor (`supabase/migrations/20261024005807_add_trip_departure.sql`); then I check the column, test the feature on its branch, run the security advisors and push it.

## Step 0: Context, branch and free tiers

- **I do:** update AGENTS.md (done: `057bfcf`, `b35baa3`). Check for a CLAUDE.md (none) and that `.gitignore` covers `.env*` (it does). Write this roadmap and `docs/learning.md`. Answer the free-tier prompt for Clerk, Supabase, Vercel, Open-Meteo and GitHub, including where to set usage limits and alerts.
- **You do:** run `/context` and confirm AGENTS.md is loaded. Set limits and alerts as each account is created (steps 4, 5, 8).
- **Decisions:** whether the brief PDF goes into `docs/`. **Decided: no**, it stays at `~/Downloads/assignment4.pdf`.
- **Ask Your Agent:** "Walk me through the free tier limits for each service my app uses, and how to set usage limits and spending alerts for each one."
- **Done when:** `/context` shows AGENTS.md, the roadmap is approved and committed, and the free-tier answer is in `docs/learning.md`.

## Step 1: Tool and API

- **Tool:** Pack Again (extends Assignment 3). **API:** Open-Meteo (geocoding and forecast), no key.
- **I do:** done so far: called the search for "Valparaíso" and "zzqxv", a 7-day forecast and invalid requests, and summarized the terms (non-commercial, 10,000 calls a day, attribution link required). Still to do: save the Ask answer, and propose how weather makes the tool more useful. Proposal: search for a trip's destination, save it with the trip, see the 7-day forecast and packing hints (rain → umbrella, high UV → sunscreen), and find it again next time.
- **You do:** nothing by hand.
- **Decisions:** what the weather feature does. Units: °C or °F.
- **Ask Your Agent:** "Explain this response: what each field means, and which ones my tool needs." (answered in chat; to be saved)
- **Done when:** the feature scope is decided and written here, and the answer is in `docs/learning.md`.

## Step 2: Plan the data

- **I do:** propose two or three tables, likely `trips` (with the destination columns) and `items`. Each gets `user_id`: the Clerk user id, filled in from the signed-in token. Write the model in AGENTS.md › Data model. No SQL yet.
- **You do:** nothing by hand.
- **Decisions:**
  - The tables and columns.
  - What happens to trips already saved in a browser: import them once after sign-in, or start fresh.
  - Whether new accounts get the three starter trips.
  - What deleting a trip does to its items.
- **Ask Your Agent:** "Draw a diagram of my tables: what each one holds, and how each row belongs to one person."
- **Done when:** you've approved the data model in AGENTS.md and the diagram is in `docs/learning.md`.

## Step 3: Protect the keys

- **I do (with your OK):** add `.claude/settings.json` with the deny rule from the brief, `Read(./.env)` and `Read(./.env.*)`, and commit it. Then try to read `.env.local` and show you the refusal.
- **You do:** create an empty `.env.local` in the project root yourself, and check that `/permissions` lists the deny rules.
- **Decisions:** the rule exactly as in the brief, or also deny writing and editing `.env` files (recommended: also deny).
- **Ask Your Agent:** "Explain why this deny rule protects my keys. Then explain the difference between my publishable and secret keys, and where each one is allowed to go."
- **Done when:** the rule is committed, my read attempt is blocked, and `.env.local` exists and is git-ignored.
- **Progress:** at your request, the deny rule was committed early, exactly as in the brief (`009664b`), and `.clerk/` is now git-ignored (`f5b4dd4`). Still to do in step 3: the decision on also denying writes, the blocked read test, your `.env.local`, and the Ask answer.

## Step 4: Sign-in with Clerk

- **I do:** after you run `clerk init`, explain what it added, file by file. Then:
  - Protect pages in `proxy.ts` (Next 16 renamed middleware to proxy).
  - Add sign-in and sign-up in the Departures style, plus a user menu with Sign out in the header.
  - Make every page that shows trips require sign-in.
  - Check signed out, with a browser script, that no trip data is reachable.
- **You do:**
  1. Create a free Clerk account and an application (development instance).
  2. Pick the sign-in methods in the Clerk dashboard.
  3. Run `npx -y clerk@latest init` in your own terminal. It may link the app and write the keys itself. If it doesn't, put `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` in `.env.local`.
  4. Tell me when you're done.
- **Decisions:** sign-in methods (email and password, email code, Google). What a signed-out visitor sees (a short landing page with sign-in, or straight to sign-in). Clerk's own pages, or embedded components styled to the theme.
- **Ask Your Agent:** "Show me how the Clerk CLI works: what clerk init added to my project, file by file."
- **Done when:** sign-up, sign-in and sign-out work locally. Signed out, every trip page redirects to sign-in, checked by script. Build and lint pass.

## Step 5: Supabase, connected to Clerk

- **I do (each migration and policy shown to you first):**
  - Through the Supabase MCP server, create the step 2 tables as migrations, also saved in `supabase/migrations/`. RLS is on for every table, and the select, insert, update and delete policies all check `user_id = auth.jwt()->>'sub'`.
  - Add `@supabase/supabase-js` and replace the localStorage layer (`src/lib/storage.ts`) with Supabase, using the Clerk session token. Keep the loading and error states.
  - Check with two accounts that each sees only their own trips, and that trips are still there after signing out and in on another browser.
- **You do:**
  1. Create a free Supabase account and project, and pick its region.
  2. In Clerk: Integrations › Supabase › Activate, then copy the Clerk domain it shows.
  3. In Supabase: Authentication › Sign In / Providers › Third-party auth › Clerk, and paste that domain.
  4. Connect the MCP server: `claude mcp add --transport http supabase "https://mcp.supabase.com/mcp?project_ref=<your project ref>"`, then `/mcp` to authenticate.
  5. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` to `.env.local`. **Never the secret key.**
- **Decisions:**
  - Whether the MCP server is read-only or can write (recommended: write, scoped to this project).
  - Where data calls run: server actions, or the browser with the Clerk token.
  - Approving each migration and policy.
- **Ask Your Agent:** "Explain each row-level security policy in plain words, then show me a query that one of them would block."
- **Done when:**
  - The migrations are in the repo, with RLS on every table.
  - The app reads and writes Supabase.
  - Two accounts are isolated (checked).
  - Data survives signing out and back in on another browser.

## Step 6: Where the API call happens

- **I do:** build the step 1 feature with the call where you decide. Design the states:
  - Loading: a skeleton forecast.
  - Nothing found: "No place called zzqxv. Check the spelling."
  - API down: "Weather isn't available right now. Your list still works." with Try again.

  Also add the "Weather data by Open-Meteo.com" link, and show each state, the down one by blocking the request in a test browser.
- **You do:** nothing by hand.
- **Decisions:** browser or server. There are no keys involved; the trade-offs are rate limits (Vercel's IPs are shared), caching and privacy. Also how long to cache a forecast, and the wording of the states.
- **Ask Your Agent:** "Draw a diagram of one request, from the click to the screen: the browser, my server, Clerk, Supabase, and the API."
- **Done when:** you can search for a destination, save it and see its forecast. The three states are designed and screenshotted. Build, lint and contrast pass.

## Step 7: Playwright test, failing first

- **I do:**
  1. Add `@playwright/test`, and `@clerk/testing` (Clerk's package) for signing in during tests.
  2. Write one test: users A and B sign in, each saves a trip, and neither can see the other's.
  3. With your OK, break RLS on this branch with a migration (for example a select policy of `using (true)`), run the test and show you the failing output.
  4. Fix it with a second migration, run the test and show you the passing output.

  Each change is its own commit, and both outputs are saved in `docs/learning.md`.
- **You do:** create two test users in Clerk (Users › Create user, with email and password). Put their credentials in `.env.local` as `E2E_USER_A_EMAIL`, `E2E_USER_A_PASSWORD`, `E2E_USER_B_EMAIL` and `E2E_USER_B_PASSWORD`. Approve both migrations.
- **Decisions:** which policy to break.
- **Ask Your Agent:** "Explain why the test failed when I broke row-level security, in one sentence I could say in class."
- **Done when:** the test is committed, it was seen failing and then passing (outputs saved), and RLS is restored and checked.
- **Note:** this touches the only Supabase project, so it happens before deploying and the broken window stays short.

## Step 8: Review and deploy

- **I do:**
  - Update the README (the flows diagram with sign-in and weather, and the first-run check).
  - Handle each `/security-review` finding, one commit per fix.
  - List the environment variables Vercel needs.
  - Check the preview deployment end to end.
  - Tick the requirements checklist below.
- **You do:**
  1. Run `/security-review` on `assignment-4` and read my changes (`git diff main...assignment-4`).
  2. OK pushing the branch to GitHub.
  3. Create a Vercel Hobby account and import the repo. Set `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
  4. Approve merging into `main` and the production deploy.
  5. Have a classmate make an account and use it.
- **Decisions:** how to handle each finding, the merge, and the production deploy.
- **Ask Your Agent:** "Quiz me on how my app works, one question at a time, and tell me what I got wrong. Start with the questions in Be Ready to Explain."
- **Done when:** the live URL shows nothing signed out and works signed in, a classmate has used it, every requirement below is ticked, and the Vercel and GitHub URLs are ready to submit.

## Polish pass 2 (branch `polish`)

Production on `main` stays as it is; the work happens on `polish`, pushed for a Vercel preview, and is never merged by me. Screenshots of every screen before and after are in `docs/polish-2/`.

| Batch | Status |
|---|---|
| 1 The trip page in two zones: the list, the weather, Trip options | Done |
| 2 The destination code, and the takeoff bug | Done, with three more bugs of the same cause |
| 3 A more delightful My trips | Done, with the flip from my two ideas |
| 4 Features | Done: progress per section, Hide packed, Edit an item, Duplicate a trip. The departure date is coded on the local branch `departure`, waiting for its migration |
| 5 Night flight dark theme | Optional, asked once the departure date is in |

After each batch: build, lint, the contrast check and the end-to-end test, then the after screenshots, a push and a summary with the preview link.

## Requirements checklist

- [ ] Accounts: sign up, sign in and sign out with Clerk; nothing visible signed out (step 4)
- [ ] Data in Supabase, with RLS on every table (step 5)
- [ ] API data with loading, nothing-found and unavailable states (step 6)
- [ ] Saved data still there after signing out and in, on another device (step 5)
- [ ] Keys in environment variables only, with a deny rule for `.env` files (step 3)
- [ ] One Playwright test, seen failing before it passed (step 7)
- [ ] `/security-review` run on a branch, with its findings handled (step 8)
- [ ] Live on Vercel, used by a classmate (step 8)
- [ ] GitHub repo with README and a history that shows progress (all steps)

## Decisions log

(Filled in as you decide: date, step, decision.)

- 22 Oct, step 0: roadmap approved.
- 22 Oct, step 0: the brief PDF stays out of the repo.
- 22 Oct, step 4: signed out, `/` is a landing page with Sign in and Sign up; every other page redirects to sign-in.
- 22 Oct, step 4: sign-in and sign-up are pages in the app (`/sign-in`, `/sign-up`) with Clerk's components in the Departures colors, not Clerk's hosted pages.
- 23 Oct, step 5: data calls run in the browser, with the Supabase client's `accessToken` option set to Clerk's `getToken`. Never the secret key.
- 23 Oct, step 5: trips saved in a browser before accounts are ignored; everyone starts fresh.
- 23 Oct, step 5: a new account gets the starter trips once, from `add_starter_trips` on its first sign-in.
- 23 Oct, step 5: the destination columns stay unused until step 6.
- 23 Oct, step 5: you asked me to apply the four migrations to the MCP's project, `fmitwpdmqajkvxczutwd`.
- 23 Oct, step 6: Open-Meteo is called from the browser, not our server (reasons in AGENTS.md › Weather).
- 23 Oct, step 6: a forecast is kept for 30 minutes in the tab; place searches are cached by the browser for a day, as Open-Meteo asks.
- 23 Oct, step 6: the weather section sits after the list, so the list comes first and nothing loading there moves it.
- 23 Oct, step 6: a compact weather summary near the top of each list page with a destination (place, today's high and low, the first suggestion's reason, See weather), from the same forecast.
- 23 Oct, step 7: two test users with `+clerk_test` emails and no passwords, created through Clerk's Backend API at your request; the test signs them in with `clerk.signIn({ emailAddress })`. Their emails are in `E2E_USER_A_EMAIL` and `E2E_USER_B_EMAIL`.
- 23 Oct, step 7: RLS broken with a temporary permissive select policy on trips (`using (true)`), then restored. The restore was run by hand in the SQL Editor, because the MCP's confirmation for a drop couldn't reach you. Both migration files are committed.
- 23 Oct, step 8: `/security-review` found no vulnerabilities. Fixed: the restore migration is idempotent (`drop policy if exists`) and explained in the README, and the Supabase MCP server is read-only. Not fixed, with reasons in `docs/learning.md`: Playwright failure traces, and Clerk's deprecated `createRouteMatcher`.
- 23 Oct, polish pass 2: the screenshots are taken with the project's own Playwright, signed in as a test user, on a dev server started for them.
- 23 Oct, polish pass 2, batch 1: Clear all ticks is hidden until something is ticked.
- 23 Oct, polish pass 2, batch 1: only the trip page gets the wider page (two columns); the other pages keep their 900 px column.
- 23 Oct, polish pass 2, batch 1: on a phone, the weather block starts closed every time.
- 23 Oct, polish pass 2, batch 2: codes are worked out among all the trips, so setting or removing one trip's destination never changes another trip's code; a city with no letters to use falls back to the name's code.
- 23 Oct, polish pass 2, batch 2: a page kept in the background starts fresh on every visit, as before: forms empty, no old messages, focus placed on arrival. Unsent text isn't kept between visits (production never kept it either).
- 23 Oct, polish pass 2, batch 3: the greeting and one summary line replace the intro line; "Welcome back" and the starter trips' invitation become that summary.
- 23 Oct, polish pass 2, batch 3: forecasts stay in the tab's memory for 30 minutes, as before; nothing about the weather is stored.
- 23 Oct, polish pass 2, batch 3: of my two ideas, the code's flip like a departures board, not the barcode.
- 23 Oct, polish pass 2, batch 4: on a phone, "All packed." alone, so the packing bar keeps one line beside Clear all ticks.
- 23 Oct, polish pass 2, batch 4: all four features without database changes (progress per section, Hide packed, Edit an item, Duplicate a trip), and the departure date as the one database change.
- 24 Oct, polish pass 2, batch 4: you run the departure date's migration in the SQL Editor; until then, the other four features are pushed and the departure date waits on its own branch.
