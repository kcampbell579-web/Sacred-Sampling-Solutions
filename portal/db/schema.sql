-- Sacred Sampling Solutions — portal schema
-- Run this once in the Neon SQL Editor for your database.

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

-- One row per physical kit. kit_id is the code printed on the insert / bottle.
-- status: inactive -> activated -> received -> analyzing -> ready
create table if not exists kits (
  kit_id       text primary key,
  product      text not null,           -- key into PRODUCTS (heavymetals, minerals, essentials, comprehensive, pfas, professional)
  status       text not null default 'inactive',
  activated_by bigint references users(id),
  activated_at timestamptz
);

create table if not exists samples (
  id           bigint generated always as identity primary key,
  kit_id       text not null references kits(kit_id) on delete cascade,
  location     text,
  collected_on date,
  notes        text,
  tracking     text,
  created_at   timestamptz not null default now()
);

create table if not exists results (
  id          bigint generated always as identity primary key,
  kit_id      text not null references kits(kit_id) on delete cascade,
  summary     text,
  report_url  text,
  released_at timestamptz not null default now()
);

create index if not exists idx_kits_user     on kits(activated_by);
create index if not exists idx_sessions_user on sessions(user_id);
create index if not exists idx_samples_kit    on samples(kit_id);
create index if not exists idx_results_kit     on results(kit_id);
