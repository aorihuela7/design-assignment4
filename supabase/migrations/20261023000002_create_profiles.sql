-- Profiles: one row per person, made the first time they sign in. For now its only
-- job is to remember that their starter trips were created, so it happens only once,
-- even after they delete every trip.
create table public.profiles (
  user_id text primary key not null default (auth.jwt() ->> 'sub'),
  starters_added_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Select and insert only: a profile can't be changed or deleted, so the starters
-- can't be made a second time.
revoke all on table public.profiles from anon, authenticated;
grant select, insert on table public.profiles to authenticated;

create policy "Select own profile" on public.profiles
  for select to authenticated
  using ((select auth.jwt() ->> 'sub') = user_id);

create policy "Insert own profile" on public.profiles
  for insert to authenticated
  with check ((select auth.jwt() ->> 'sub') = user_id);
