-- Sacred Sampling Solutions — Portal schema v2 (7-stage spec)
-- Run once in the Neon SQL Editor. Additive: creates the v2 tables alongside
-- auth (users/sessions). The legacy `kits`/`samples` tables from v1 can be
-- dropped later with db/drop-v1.sql once the new flow is live.

-- ── Auth (unchanged from v1) ────────────────────────────────────────────────
create table if not exists users (
  id            bigint generated always as identity primary key,
  name          text not null,
  email         text unique not null,
  phone         text,
  password_hash text not null,
  created_at    timestamptz not null default now()
);

create table if not exists sessions (
  token      text primary key,
  user_id    bigint not null references users(id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

-- ── Kit catalog (drives Register + Training + Collection) ────────────────────
-- One row per kit TYPE. whats_inside / steps are newline-separated
-- "Title | description" lines (each line becomes one repeater card).
create table if not exists kit_types (
  code         text primary key,          -- BAS BEN COM PFA VOC ALD AMM TCK
  title        text not null,
  slug         text not null unique,
  matrix       text not null,             -- water | air | tick
  intro        text,
  tests        text,
  methods      text,
  sensitivity  text,
  containers   text,
  whats_inside text,
  steps        text,
  learn        text,
  video_url    text,
  panels       text                       -- comma list, e.g. "vocs,pfas,nitrate"
);

-- ── One row per registered physical kit ─────────────────────────────────────
-- status is the 7-stage human label (see lib/status.js). Registration starts
-- a kit at 'With Customer for Collection'.
create table if not exists sample_registrations (
  id                    bigint generated always as identity primary key,
  sample_id             text unique not null,          -- SSS-COM-00001
  kit_code              text not null references kit_types(code),
  kit_panel             text,                          -- display name
  kit_slug              text,
  user_id               bigint references users(id),
  customer_name         text,
  email                 text,
  phone                 text,
  street                text,
  city                  text,
  state                 text,
  zip                   text,
  water_source          text,                          -- water kits
  sample_source         text,                          -- water kits (exact tap)
  room_location         text,                          -- air kits
  consent_same_day_ship boolean not null default false,
  marketing_opt_in      boolean not null default false,
  status                text not null default 'With Customer for Collection',
  coc_url               text,
  coc_created           timestamptz,
  tracking_number       text,
  ship_date             timestamptz,
  lab_report_pdf        text,
  customer_report_html  text,
  created_at            timestamptz not null default now()
);

-- ── Training acknowledgments (liability record) ─────────────────────────────
create table if not exists training_acknowledgments (
  id                 bigint generated always as identity primary key,
  sample_id          text not null references sample_registrations(sample_id) on delete cascade,
  user_id            bigint references users(id),
  ack_watched        boolean not null default false,
  ack_deviations     boolean not null default false,
  ack_responsibility boolean not null default false,
  signed_name        text,
  created_at         timestamptz not null default now()
);

-- ── Chain of custody records ────────────────────────────────────────────────
create table if not exists chain_of_custody (
  id            bigint generated always as identity primary key,
  sample_id     text not null references sample_registrations(sample_id) on delete cascade,
  coc_ref       text,
  coc_url       text,
  sampler_name  text,
  collected_at  timestamptz,
  location      text,
  matrix        text,
  observations  text,
  signature_png text,
  created_at    timestamptz not null default now()
);

-- ── Shipments (prepaid UPS return labels via Shippo) ────────────────────────
create table if not exists shipments (
  id           bigint generated always as identity primary key,
  sample_id    text not null references sample_registrations(sample_id) on delete cascade,
  carrier      text,
  service      text,
  tracking     text,
  label_url    text,
  rate         text,
  from_name    text,
  from_street1 text,
  from_street2 text,
  from_city    text,
  from_state   text,
  from_zip     text,
  from_phone   text,
  created_at   timestamptz not null default now()
);

-- ── Results (lab upload + parsed analytes for the table view) ────────────────
create table if not exists results (
  id          bigint generated always as identity primary key,
  sample_id   text not null references sample_registrations(sample_id) on delete cascade,
  report_pdf  text,
  analytes    jsonb,             -- [{panel,name,cas,loq,result,units,flag,detected,limit}]
  summary     text,
  released_at timestamptz not null default now()
);

create index if not exists idx_sr_user       on sample_registrations(user_id);
create index if not exists idx_sr_email       on sample_registrations(lower(email));
create index if not exists idx_sessions_user   on sessions(user_id);
create index if not exists idx_train_sample     on training_acknowledgments(sample_id);
create index if not exists idx_coc_sample        on chain_of_custody(sample_id);
create index if not exists idx_ship_sample        on shipments(sample_id);
create index if not exists idx_results_sample      on results(sample_id);
