-- Trips: one row per packing list, owned by the Clerk user whose token created it.
-- Clerk ids aren't UUIDs ("user_2abc…"), so user_id is text from the token's sub claim.
create table public.trips (
  id uuid primary key default gen_random_uuid(),
  user_id text not null default (auth.jwt() ->> 'sub'),
  name text not null check (char_length(name) between 1 and 40),
  -- Optional destination from Open-Meteo's place search. The forecast is never saved.
  destination_name text,
  destination_country text,
  latitude double precision check (latitude between -90 and 90),
  longitude double precision check (longitude between -180 and 180),
  timezone text,
  last_packed_at timestamptz,
  prompt_dismissed_at timestamptz,
  ticks_cleared_at timestamptz,
  -- Order the trips were made in (keeps each trip's 3-letter code stable).
  created_at timestamptz not null default now(),
  -- Last change to the trip or its items: sorts My trips and drives "Welcome back".
  updated_at timestamptz not null default now(),
  -- A destination is a named place with coordinates, or nothing.
  constraint trips_destination_complete check (
    (destination_name is null and latitude is null and longitude is null)
    or (destination_name is not null and latitude is not null and longitude is not null)
  )
);

-- One trip per name for each person, ignoring case, like the app's own check.
-- It starts with user_id, so it also serves the policies below.
create unique index trips_user_id_name_key on public.trips (user_id, lower(name));

-- Every change to a trip sets updated_at, whatever the client sends.
create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger trips_set_updated_at
  before update on public.trips
  for each row execute function public.set_updated_at();

alter table public.trips enable row level security;

-- Signed-out visitors (anon) get nothing; signed-in people only these four, through the policies.
revoke all on table public.trips from anon, authenticated;
grant select, insert, update, delete on table public.trips to authenticated;

create policy "Select own trips" on public.trips
  for select to authenticated
  using ((select auth.jwt() ->> 'sub') = user_id);

create policy "Insert own trips" on public.trips
  for insert to authenticated
  with check ((select auth.jwt() ->> 'sub') = user_id);

create policy "Update own trips" on public.trips
  for update to authenticated
  using ((select auth.jwt() ->> 'sub') = user_id)
  with check ((select auth.jwt() ->> 'sub') = user_id);

create policy "Delete own trips" on public.trips
  for delete to authenticated
  using ((select auth.jwt() ->> 'sub') = user_id);
