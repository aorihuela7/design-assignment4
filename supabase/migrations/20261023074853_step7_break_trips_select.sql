-- TEMPORARY, step 7 only: breaks row-level security on purpose, so the end-to-end
-- test can be seen failing. A second, permissive select policy: policies of the same
-- kind are combined with OR, so every signed-in person can read every trip. Items
-- stay protected. The next migration drops it.
create policy "Step 7: everyone signed in sees every trip" on public.trips
  for select to authenticated
  using (true);
