-- An optional departure date for each trip: a day, not a time, in the person's own
-- calendar. It counts down on the trip's card, puts what's leaving next first on My
-- trips and marks the day on the forecast. Row-level security is unchanged: the four
-- policies on trips already cover every column of a person's own rows, and anon still
-- has no grants.
-- "if not exists": it was run by hand in the SQL Editor, so it isn't in the project's
-- migration history, and applying it again must do nothing rather than fail.
alter table public.trips
  add column if not exists departs_on date
  constraint trips_departs_on_range check (departs_on between date '2000-01-01' and date '2099-12-31');
