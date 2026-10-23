# One request, from the click to the screen

On a list page, the person searches "Lisbon" under Weather and chooses "Lisbon, Lisbon District, Portugal". The destination is saved in Supabase, then the forecast comes from Open-Meteo, straight to the browser. Our Next.js server only served the page, earlier, and plays no part in the click.

```mermaid
sequenceDiagram
  actor P as Person
  participant B as Browser
  participant N as Our Next.js server (Vercel)
  participant C as Clerk
  participant S as Supabase
  participant O as Open-Meteo

  Note over P,O: Before the click: opening the list page
  B->>N: GET /trips/{id}, with the Clerk session cookie
  N->>N: proxy.ts checks the session token with Clerk's public key (fetched from Clerk once, then cached)
  N-->>B: The page, its HTML and JavaScript. The server's part ends here.

  Note over P,O: The click
  P->>B: Chooses "Lisbon, Lisbon District, Portugal"
  B->>C: getToken()
  C-->>B: The session token (valid 60 seconds, refreshed in the background)
  B->>S: PATCH /rest/v1/trips?id=eq.{id}<br/>apikey: the publishable key. Authorization: Bearer {token}<br/>destination_name "Lisbon", latitude 38.73, longitude -9.15, timezone "Europe/Lisbon"
  S->>S: Checks the token's signature with Clerk's public key, then row-level security: sub = user_id
  S-->>B: 204, saved
  B->>P: "Weather in Lisbon, Portugal", and 7 loading rows
  B->>O: GET /v1/forecast with latitude 38.73, longitude -9.15, timezone Europe/Lisbon<br/>No key, no token, no cookie
  alt Open-Meteo answers within 8 seconds
    O-->>B: The next 7 days, as JSON
    B->>P: The departures board, and Pack for this weather
  else Open-Meteo is down or too slow
    B->>P: "Weather is unavailable right now. Your list still works." with Retry
  end
```

## What each call carries

- **To our server:** the Clerk session cookie, when a page opens. Clerk's secret key stays on the server, where `proxy.ts` uses it.
- **To Supabase:** the publishable key, which is meant to be public, and the session token, which says who is asking. Supabase's secret key isn't used anywhere in the app.
- **To Open-Meteo:** only the coordinates and the time zone. Open-Meteo needs no key, and the browser sends it no token and no cookie.

Loading the trips when a page opens works the same way as the save: a token from Clerk, then Supabase.

## Why the weather call skips our server

Decided in step 6; the same reasons are in [AGENTS.md › Weather](../AGENTS.md).

- **No key to hide.** Hiding a key is the main reason to send a call through a server.
- **Rate limits.** Open-Meteo allows 10,000 calls a day per IP address. From the browser, each person uses their own. From our server, every user would share Vercel's IP addresses, and so would other apps on Vercel.
- **Caching.** On Vercel's serverless functions an in-memory cache rarely lasts between requests, and a shared cache costs extra. The browser keeps a forecast for 30 minutes and a place search for a day.
- **Cost.** No function calls or CPU time on the Hobby plan.
- **The trade-off.** Open-Meteo sees each person's IP address with the destination, and keeps its logs for 90 days.

If the call had gone through our server, the forecast would have taken one more hop:

```mermaid
sequenceDiagram
  participant B as Browser
  participant N as Our Next.js server (Vercel)
  participant O as Open-Meteo

  Note over B,O: Not chosen
  B->>N: GET /api/forecast, with the Clerk session cookie
  N->>N: Checks the session and the input, then its cache
  N->>O: GET /v1/forecast, from one of Vercel's shared IP addresses
  O-->>N: The next 7 days
  N-->>B: The next 7 days
```
