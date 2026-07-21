-- Highland Valley Medical Care — patient portal schema (Neon / Postgres)
-- The mockup uses localStorage; these tables mirror those shapes so the demo
-- can be wired to Neon by replacing lib/store.js functions with SQL queries.

create table if not exists patients (
  id            uuid primary key default gen_random_uuid(),
  mrn           text unique not null,
  first_name    text not null,
  last_name     text not null,
  dob           date not null,
  email         text unique not null,
  phone         text,
  address       text,
  insurance     text,
  member_id     text,
  pharmacy      text,
  created_at    timestamptz not null default now()
);

create table if not exists providers (
  id            text primary key,          -- e.g. 'dr-butt'
  name          text not null,
  title         text not null,
  specialty     text not null,
  initials      text not null,
  active        boolean not null default true
);

create table if not exists visit_types (
  id            text primary key,          -- e.g. 'wellness'
  name          text not null,
  duration_min  int not null,
  description   text
);

create table if not exists appointments (
  id            uuid primary key default gen_random_uuid(),
  patient_id    uuid not null references patients(id) on delete cascade,
  provider_id   text not null references providers(id),
  visit_type_id text not null references visit_types(id),
  scheduled_on  date not null,
  scheduled_at  text not null,             -- display time, e.g. '10:00 AM'
  reason        text,
  status        text not null default 'upcoming'
                  check (status in ('upcoming','completed','cancelled')),
  created_at    timestamptz not null default now(),
  -- one provider can't be double-booked for the same slot
  unique (provider_id, scheduled_on, scheduled_at)
);

create table if not exists lab_results (
  id            uuid primary key default gen_random_uuid(),
  patient_id    uuid not null references patients(id) on delete cascade,
  name          text not null,
  collected_on  date not null,
  status        text not null default 'Reviewed',
  flag          text not null default 'normal' check (flag in ('normal','attention')),
  created_at    timestamptz not null default now()
);

create index if not exists idx_appts_patient on appointments(patient_id, scheduled_on);
create index if not exists idx_results_patient on lab_results(patient_id, collected_on desc);
