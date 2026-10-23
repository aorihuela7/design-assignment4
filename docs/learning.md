# Learning journal

The "Ask Your Agent" prompt from each step of Assignment 4, and the answer, in step order.

## Step 0: Free tiers

> "Walk me through the free tier limits for each service my app uses, and how to set usage limits and spending alerts for each one."

Researched 22 Oct 2026 from each service's official pages. A few Clerk facts come from search excerpts of its pricing and docs pages, which couldn't be fetched in full; they are marked *(excerpt)*. Anything that couldn't be confirmed says so.

**In short:** none of these needs a payment method for what Pack Again uses, and none can charge you on its free plan. The risk is being *stopped*, not billed: Vercel pauses the site, Supabase pauses the project after a week without use, and Clerk and Open-Meteo refuse requests. Only GitHub has real budget alerts; elsewhere you watch a usage page.

### Clerk (free plan, development keys)
- **Users:** 50,000 monthly retained users on the free plan *(excerpt)*. A development instance is capped at 100 users *(excerpt)*, plenty for classmates.
- **Messages:** development instances send at most 100 emails and 20 SMS a month. Messages to Clerk's test addresses don't count, so the Playwright test should use them.
- **Rate limits:** the Backend API allows 100 requests per 10 seconds in development. Sign-in and sign-up allow 5 per 10 seconds per IP. Over a limit you get HTTP 429 with `Retry-After`.
- **Limits and alerts:** no spending cap or usage alert is documented (not confirmed). There's nothing to bill on the free plan, and no card is required *(excerpt)*.

### Supabase (Free plan)
- **Limits:** 500 MB of database, 5 GB of egress (plus 5 GB cached), 1 GB of file storage, and 2 active free projects. API requests are unlimited. Clerk users count against a separate allowance of 50,000 third-party monthly active users.
- **Pausing:** a free project is paused after 7 days of low activity, with a warning email first. Resume it from Dashboard › your organization › the paused project › Resume project. How long a paused project can be restored is unclear: the docs say both 90 days and 1 year. Open the app every few days until grades are back.
- **At the limit:** Free is never charged. You're notified, and sustained overuse gets the service restricted.
- **Limits and alerts:** the Spend Cap (Organization › Billing › Cost Control) exists only on Pro. On Free, watch Organization › Usage. No usage alerts are documented.

### Vercel (Hobby)
- **Per month:** 1M function invocations, 4 hours of active CPU, 100 GB of Fast Data Transfer, 10 GB of Fast Origin Transfer, 1M CDN requests and 5,000 image transformations.
- **Builds:** 45-minute build limit and 100 deployments a day.
- **Terms:** Hobby is for personal, non-commercial use only.
- **At the limit:** you can't buy more. The project is paused and the site returns "503 DEPLOYMENT_PAUSED". One help article says you resume each project yourself, after cutting usage or upgrading.
- **Limits and alerts:** Spend Management isn't available on Hobby. Vercel emails you as you near and pass a limit *(excerpt)*. Watch Dashboard › Usage.
- **Payment method:** whether Hobby signup asks for a card is not confirmed. If it does, don't add one.

### Open-Meteo (free, non-commercial)
- **Limits:** under 600 calls a minute, 5,000 an hour, 10,000 a day and 300,000 a month (the monthly one isn't enforced yet). No uptime guarantee.
- **At the limit:** rate-limited. Misuse can be blocked without notice.
- **Shared IPs:** limits are counted per IP address and per application, and Vercel's server IPs are shared with many apps. This matters for step 6.
- **Limits and alerts:** none. No key, no account and nothing to bill.

### GitHub (free personal account)
- **Actions:** not used by Pack Again. If they ever are: free on public repos, 2,000 minutes a month on private ones, and with no payment method, usage is blocked at the quota.
- **Limits and alerts:** github.com/settings/billing › Budgets and alerts › New budget, with "Stop usage when budget limit is reached" and alerts at 75%, 90% and 100%. Whether a $0 budget is set by default couldn't be confirmed.

### What to do as each account is created
1. **Clerk (step 4):** don't add a card, and use test emails in tests.
2. **Supabase (step 5):** stay on Free, no card, and bookmark Organization › Usage.
3. **Vercel (step 8):** stay on Hobby, no card, and check Dashboard › Usage after the classmate test.
4. **GitHub:** nothing needed while Actions are unused.

Sources:
- **Clerk:** [pricing](https://clerk.com/pricing), [environments](https://clerk.com/docs/guides/development/managing-environments), [test emails](https://clerk.com/docs/guides/development/testing/test-emails-and-phones), [system limits](https://clerk.com/docs/guides/how-clerk-works/system-limits)
- **Supabase:** [pricing](https://supabase.com/pricing), [pausing](https://supabase.com/docs/guides/platform/free-project-pausing), [cost control](https://supabase.com/docs/guides/platform/cost-control), [third-party MAU](https://supabase.com/docs/guides/platform/manage-your-usage/monthly-active-users-third-party)
- **Vercel:** [Hobby](https://vercel.com/docs/plans/hobby), [limits](https://vercel.com/docs/limits), [paused deployments](https://vercel.com/kb/guide/why-is-my-account-deployment-blocked)
- **Open-Meteo:** [terms](https://open-meteo.com/en/terms)
- **GitHub:** [Actions billing](https://docs.github.com/en/billing/concepts/product-billing/github-actions), [budgets](https://docs.github.com/en/billing/concepts/budgets-and-alerts)

## Step 1: The Open-Meteo response

> "Explain this response: what each field means, and which ones my tool needs."

Pack Again uses two Open-Meteo APIs, both without a key: the place search (geocoding) to find a trip's destination, and the forecast for that place. Calls made on 22 Oct 2026.

### Place search

`GET https://geocoding-api.open-meteo.com/v1/search?name=Valparaíso&count=5&language=es&format=json`

```json
{
  "results": [
    {
      "id": 3868626, "name": "Valparaíso",
      "latitude": -33.036, "longitude": -71.62963, "elevation": 15.0,
      "feature_code": "PPLA", "country_code": "CL", "country": "Chile",
      "admin1": "Región de Valparaíso", "admin2": "Valparaíso", "admin3": "Valparaíso",
      "timezone": "America/Santiago", "population": 282448
    }
  ],
  "generationtime_ms": 0.6
}
```

Four more Valparaísos come back: Indiana (US), Zacatecas (Mexico), and Caquetá and Antioquia (Colombia). Results are sorted by population.

| Field | Meaning | Needed? |
|---|---|---|
| `results` | The matching places. **Missing entirely** when nothing matches. | Yes: missing means "no places found" |
| `id` | GeoNames' permanent id for the place | Yes: a stable key for the place picked |
| `name` | Place name, in the language asked for | Yes |
| `admin1` | Region or state | Yes: tells same-name places apart |
| `country`, `country_code` | Country name and two-letter code | Yes: also tells them apart |
| `latitude`, `longitude` | The place's coordinates | Yes: the forecast needs them |
| `timezone` | The place's time zone | Maybe: the forecast gets it with `timezone=auto` |
| `admin2`, `admin3`, `*_id`, `feature_code`, `population`, `elevation`, `postcodes` | Smaller divisions, ids, place type, size, height, postal codes (some often missing) | No |
| `generationtime_ms` | Server time | No |

**Nothing found** (`zzqxv`, an empty name or a single letter) returns HTTP 200 and only `{"generationtime_ms": 0.05}`, with no `results` key at all, not even an empty list.

### Forecast

`GET https://api.open-meteo.com/v1/forecast?latitude=-33.036&longitude=-71.62963&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,uv_index_max,wind_speed_10m_max,wind_gusts_10m_max,wind_direction_10m_dominant&timezone=auto&forecast_days=7`

```json
{
  "latitude": -33.075573, "longitude": -71.64618,
  "timezone": "America/Santiago", "timezone_abbreviation": "GMT-3", "utc_offset_seconds": -10800,
  "elevation": 11.0,
  "daily_units": { "temperature_2m_max": "°C", "precipitation_probability_max": "%", "uv_index_max": "", "wind_speed_10m_max": "km/h", "…": "…" },
  "daily": {
    "time": ["2026-10-22", "2026-10-23", "2026-10-24", "2026-10-25", "2026-10-26", "2026-10-27", "2026-10-28"],
    "weather_code": [53, 51, 1, 3, 51, 3, 3],
    "temperature_2m_max": [19.1, 18.0, 17.7, 22.3, 19.0, 20.2, 21.0],
    "temperature_2m_min": [14.0, 12.4, 11.1, 13.5, 15.4, 15.0, 13.9],
    "precipitation_probability_max": [100, 100, 2, 0, 12, 14, 0],
    "uv_index_max": [8.2, 8.1, 8.35, 7.95, 5.35, 8.5, 8.4],
    "wind_speed_10m_max": [17.3, 21.0, 22.4, 22.7, 16.7, 20.1, 12.0],
    "wind_gusts_10m_max": [47.2, 49.7, 51.8, 50.8, 40.3, 47.9, 32.4],
    "wind_direction_10m_dominant": [357, 203, 194, 188, 205, 200, 244]
  }
}
```

The daily values are parallel arrays: day `i` is position `i` in every array.

| Field | Meaning | Needed? |
|---|---|---|
| `daily.time` | Each day's local date, today first | Yes: day labels |
| `daily.temperature_2m_max`, `_min` | Highest and lowest air temperature that day, 2 m above ground, °C | Yes: warm layers or light clothes |
| `daily.precipitation_probability_max` | Highest chance of rain in any hour that day, 0–100% | Yes: umbrella, rain jacket |
| `daily.weather_code` | WMO code for the day's main weather (1 mainly clear, 3 overcast, 51/53 drizzle) | Yes: a word or icon per day, from our own code table |
| `daily.uv_index_max` | Strongest sun that day (no unit; 8+ is very high) | Yes: sunscreen, hat |
| `daily.wind_speed_10m_max` | Strongest sustained wind, km/h | Yes: windbreaker |
| `daily.wind_gusts_10m_max` | Strongest gust, km/h | Optional |
| `daily.wind_direction_10m_dominant` | Where the wind mostly comes from, degrees | No |
| `daily_units` | The unit of each field | No: fixed by what we ask for |
| `timezone`, `timezone_abbreviation`, `utc_offset_seconds` | The time zone of the dates | No: `timezone=auto` gives local dates already |
| `latitude`, `longitude`, `elevation` | The model's grid point, slightly off from the place | No |
| `generationtime_ms` | Server time | No |

### Errors

Any invalid request returns HTTP 400 with `{"error": true, "reason": "…"}`. For example: "Latitude must be in range of -90 to 90°. Given: 200.0.", "Invalid timezone", "Forecast days is invalid. Allowed range 0 to 16." The reasons can be technical, so the app checks `error` and shows its own message. Responses have no rate-limit headers.

### So the tool needs

- **From the search:** `id`, `name`, `admin1`, `country`, `latitude` and `longitude`. A result reads "Valparaíso · Región de Valparaíso, Chile".
- **From the forecast:** `time`, `weather_code`, `temperature_2m_max` and `_min`, `precipitation_probability_max`, `uv_index_max` and `wind_speed_10m_max`.
- **What's saved:** probably only the place. The forecast can be fetched fresh each time.

### Terms (free, non-commercial)

- **Use:** non-commercial only. Educational projects qualify.
- **Limits:** under 600 calls a minute, 5,000 an hour, 10,000 a day and 300,000 a month. A request with more than 10 variables, or more than 2 weeks of data, counts as more than one call.
- **Credit:** under CC BY 4.0, a "Weather data by Open-Meteo.com" link to https://open-meteo.com/ must sit next to the weather.
- **Shared IPs:** limits are counted per IP address and per application. Apps on Vercel can hit them sooner, because Vercel's IPs are shared.
- **Privacy:** server logs, which can include the coordinates requested, are kept for 90 days.

Sources: [terms](https://open-meteo.com/en/terms), [licence](https://open-meteo.com/en/licence), [pricing](https://open-meteo.com/en/pricing).

## Step 5: Row-level security, in plain words

> "Explain each row-level security policy in plain words, then show me a query that one of them would block."

Every request from the app carries the signed-in person's Clerk session token. Supabase checks it, and `auth.jwt()->>'sub'` is then their Clerk user id, like `user_2abc…`. Every policy compares that id with the row's `user_id`. The `(select …)` around it makes Postgres read the token once per query, not once per row.

Two layers decide what a query may do:

- **Grants** say which kinds of query a role may run at all. Signed-out visitors (`anon`) have none, so their queries fail before any policy is read. Signed-in people (`authenticated`) may select, insert, update and delete trips and items, but only select and insert profiles.
- **Policies** then say which rows. With row-level security on, anything no policy allows is refused.

A policy has up to two parts:

- **USING** picks the existing rows a query can see or touch. The others are skipped silently: the query gets 0 rows, not an error.
- **WITH CHECK** tests a row as it will be after an insert or update. If the row fails, the query is an error and nothing is written.

### trips

| Policy | In plain words |
|---|---|
| Select own trips | You see only the trips whose `user_id` is yours. |
| Insert own trips | A new trip must be yours. The app never sends `user_id` (it defaults to your id), so this stops anyone sending someone else's. |
| Update own trips | You can change only your own trips, and the result must still be yours, so a trip can't be given away. |
| Delete own trips | You can delete only your own trips. Their items go with them. |

### items

| Policy | In plain words |
|---|---|
| Select own items | You see only your own items. |
| Insert own items into own trips | A new item must be yours, and so must the trip it goes on. Knowing someone's trip id isn't enough to add to their list. |
| Update own items in own trips | You can change only your own items, and only within your own trips, so an item can't be moved onto someone else's list. |
| Delete own items | You can delete only your own items. |

### profiles

| Policy | In plain words |
|---|---|
| Select own profile | You see only your own profile, which records that your starter trips were made. |
| Insert own profile | You can make only your own profile. |

There's no update or delete policy, and no grant for them. A profile can't be changed or deleted, so the starter trips are never made twice. `add_starter_trips` runs as the caller (`security invoker`), so its inserts go through the same policies, and signed-out visitors can't call it.

### A query a policy blocks

Account B is signed in and knows the id of one of A's trips, from a shared link for example. In the browser's console, B tries to add an item to A's list:

```js
await supabase.from("items").insert({ trip_id: "<A's trip id>", name: "Sneaky", section: "other" });
```

Supabase refuses it with error `42501`: `new row violates row-level security policy for table "items"`. The WITH CHECK of "Insert own items into own trips" found that the trip isn't B's, so nothing was written.

To see it yourself, run this in Supabase › SQL Editor. The editor runs as the database owner, so it pretends to be A and then B, and `rollback` keeps nothing:

```sql
begin;
set local role authenticated;

-- Signed in as A: a trip of A's.
select set_config('request.jwt.claims', '{"sub":"user_a","role":"authenticated"}', true);
insert into public.trips (name) values ('Only A');
select set_config('demo.trip', (select id::text from public.trips where name = 'Only A'), true);

-- Signed in as B: the same trip id, someone else's list.
select set_config('request.jwt.claims', '{"sub":"user_b","role":"authenticated"}', true);
insert into public.items (trip_id, name, section)
values (current_setting('demo.trip')::uuid, 'Sneaky', 'other');
-- ERROR: 42501: new row violates row-level security policy for table "items"

rollback;
```

What the other policies did, run the same way on 23 Oct with two pretend users (all rolled back):

| Signed in as | Query | Result | Because of |
|---|---|---|---|
| B | `select count(*) from trips` | 1, only B's trip | Select own trips |
| B | `select … from trips where id = '<A's trip>'` | 0 rows | Select own trips |
| B | `update trips set name = 'Hacked' where id = '<A's trip>'` | 0 rows changed, no error | Update own trips (USING) |
| B | `delete from items where id = '<A's item>'` | 0 rows deleted, no error | Delete own items |
| B | `insert into trips (name, user_id) values ('Fake', '<A's id>')` | Error 42501 | Insert own trips (WITH CHECK) |
| B | `delete from profiles` | Error 42501: permission denied | No grant to delete profiles |
| Signed out | `select … from trips` | Error 42501: permission denied | `anon` has no grants |
