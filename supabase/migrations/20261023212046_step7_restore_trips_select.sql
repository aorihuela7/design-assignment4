-- Step 7: undoes the previous migration. With only "Select own trips" left, each
-- person sees only their own trips again.
--
-- Run by hand in Supabase › SQL Editor: the Supabase MCP server asks for confirmation
-- before a drop, and that question couldn't reach the person from the agent's session,
-- so it declined twice. Because of that this migration isn't in the project's
-- migration history (supabase_migrations.schema_migrations); the policy is gone all
-- the same. The version is the time this file was added.
drop policy "Step 7: everyone signed in sees every trip" on public.trips;
