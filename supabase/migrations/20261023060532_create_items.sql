-- Items: the things on a trip's list. Deleting a trip deletes its items.
create table public.items (
  id uuid primary key default gen_random_uuid(),
  user_id text not null default (auth.jwt() ->> 'sub'),
  trip_id uuid not null references public.trips (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  section text not null check (section in ('clothes', 'toiletries', 'tech', 'documents', 'other')),
  packed boolean not null default false,
  is_new boolean not null default false,
  -- Items show in the order they were added; Undo puts one back with its old time.
  created_at timestamptz not null default now()
);

-- One item per name in each trip, ignoring case. It starts with trip_id, so it
-- also indexes the foreign key.
create unique index items_trip_id_name_key on public.items (trip_id, lower(name));
create index items_user_id_idx on public.items (user_id);

-- Adding, changing or removing an item counts as a change to its trip, as it does
-- in the app today. (The update fires trips_set_updated_at.)
create function public.touch_trip()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    update public.trips set updated_at = now() where id = old.trip_id;
  else
    update public.trips set updated_at = now() where id = new.trip_id;
  end if;
  return null;
end;
$$;

create trigger items_touch_trip
  after insert or update or delete on public.items
  for each row execute function public.touch_trip();

alter table public.items enable row level security;

revoke all on table public.items from anon, authenticated;
grant select, insert, update, delete on table public.items to authenticated;

create policy "Select own items" on public.items
  for select to authenticated
  using ((select auth.jwt() ->> 'sub') = user_id);

-- Adding or changing an item also checks its trip: it can only point at one of your own.
create policy "Insert own items into own trips" on public.items
  for insert to authenticated
  with check (
    (select auth.jwt() ->> 'sub') = user_id
    and exists (
      select 1 from public.trips
      where trips.id = items.trip_id and trips.user_id = (select auth.jwt() ->> 'sub')
    )
  );

create policy "Update own items in own trips" on public.items
  for update to authenticated
  using ((select auth.jwt() ->> 'sub') = user_id)
  with check (
    (select auth.jwt() ->> 'sub') = user_id
    and exists (
      select 1 from public.trips
      where trips.id = items.trip_id and trips.user_id = (select auth.jwt() ->> 'sub')
    )
  );

create policy "Delete own items" on public.items
  for delete to authenticated
  using ((select auth.jwt() ->> 'sub') = user_id);
