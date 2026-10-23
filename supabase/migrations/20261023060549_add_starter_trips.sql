-- Creates the signed-in person's starter trips, once. The profile row is the marker:
-- if it already exists, nothing happens, so calling this twice (two tabs, a retry)
-- never duplicates anything. One transaction, so it's all or nothing.
-- Security invoker: it runs as the caller, so every insert still goes through RLS.
create function public.add_starter_trips(starters jsonb)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  starter record;
  new_trip_id uuid;
begin
  -- The app sends 3 trips of about 15 items. Anything much bigger isn't the app's
  -- starters, so it's refused before anything is written.
  if jsonb_array_length(starters) > 5 then
    raise exception 'At most 5 starter trips';
  end if;
  if exists (
    select 1 from jsonb_array_elements(starters) as trip
    where jsonb_array_length(trip.value -> 'items') > 30
  ) then
    raise exception 'At most 30 items per starter trip';
  end if;

  insert into public.profiles default values on conflict (user_id) do nothing;
  if not found then
    return false;
  end if;

  -- starters: [{ "name": "Beach weekend", "items": [{ "name": "Swimsuit", "section": "clothes" }, …] }, …]
  for starter in select value, ordinality from jsonb_array_elements(starters) with ordinality loop
    -- 1 ms apart, so trips and items keep the order they're listed in.
    insert into public.trips (name, created_at)
    values (starter.value ->> 'name', now() + starter.ordinality * interval '1 millisecond')
    returning id into new_trip_id;

    insert into public.items (trip_id, name, section, created_at)
    select new_trip_id, item.value ->> 'name', item.value ->> 'section', now() + item.ordinality * interval '1 millisecond'
    from jsonb_array_elements(starter.value -> 'items') with ordinality as item;
  end loop;

  return true;
end;
$$;

revoke execute on function public.add_starter_trips(jsonb) from public, anon;
grant execute on function public.add_starter_trips(jsonb) to authenticated;
