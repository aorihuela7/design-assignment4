# Data model

Three tables in Supabase. The SQL is in [`supabase/migrations/`](../supabase/migrations/).

```mermaid
erDiagram
  clerk_user ||--o| profiles : "gets one, on first sign-in"
  clerk_user ||--o{ trips : owns
  clerk_user ||--o{ items : owns
  trips ||--o{ items : "holds (deleted with the trip)"

  clerk_user {
    text sub "Clerk user id, e.g. user_2abc. Lives in Clerk, not Supabase"
  }

  profiles {
    text user_id PK "= sub. Select and insert only"
    timestamptz starters_added_at "when the starter trips were made"
  }

  trips {
    uuid id PK
    text user_id "= sub"
    text name "1-40 chars, unique per person"
    text destination_name "optional, from Open-Meteo"
    text destination_country "optional"
    double latitude "optional, with the name"
    double longitude "optional, with the name"
    text timezone "optional"
    timestamptz last_packed_at "every item ticked"
    timestamptz prompt_dismissed_at "answered Packing for a new trip?"
    timestamptz ticks_cleared_at "ticks cleared for a new trip"
    date departs_on "optional, the day it leaves"
    timestamptz created_at "order the trips were made in"
    timestamptz updated_at "any change to the trip or its items"
  }

  items {
    uuid id PK
    text user_id "= sub"
    uuid trip_id FK "one of the same person's trips"
    text name "1-60 chars, unique per trip"
    text section "clothes, toiletries, tech, documents, other"
    boolean packed
    boolean is_new "added after a full pack"
    timestamptz created_at "order the items were added in"
  }
```

## How each row belongs to one person

1. The browser sends Supabase the person's Clerk session token with every request.
2. Supabase checks the token against Clerk, and `auth.jwt()->>'sub'` is that person's Clerk user id.
3. **Writing:** a new row's `user_id` defaults to that id, so the app never sends it.
4. **Reading and changing:** every table has row-level security. Its select, insert, update and delete policies only match rows where `user_id` is that id. An item can also only point at a trip with the same `user_id`.
5. **Signed out:** with no token, the request runs as `anon`, which has no access to any table.

The forecast is never saved: only where a trip is going, and optionally the day it leaves (`departs_on`, a calendar day from 2000 to 2099). The starter trips are made once per person, by `add_starter_trips()`. Because a profile can't be changed or deleted, deleting every trip doesn't bring them back.
