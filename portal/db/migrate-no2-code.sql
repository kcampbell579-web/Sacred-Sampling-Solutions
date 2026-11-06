-- Rename the NO₂ air-badge kit-type code from NDX to NO2 so Sample IDs read
-- SS-NO2-#####. kit_code is a FK to kit_types(code), so this is done in an order
-- that never violates it. Safe/idempotent — run once in the Neon SQL editor.

-- 1. Ensure a NO2 row exists (copy from the old NDX row if that's what's there).
insert into kit_types (code, title, slug, matrix, intro, tests, methods, sensitivity, containers, whats_inside, steps, panels, video_url)
select 'NO2', title, slug, matrix, intro, tests, methods, sensitivity, containers, whats_inside, steps, panels, video_url
  from kit_types where code = 'NDX'
on conflict (code) do nothing;

-- 2. Repoint any existing registrations from NDX to NO2 (NO2 now exists, so the FK holds).
update sample_registrations set kit_code = 'NO2' where kit_code = 'NDX';

-- 3. Drop the old NDX row now that nothing references it.
delete from kit_types where code = 'NDX';
