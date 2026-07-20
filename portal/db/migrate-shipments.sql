-- Migration: add the shipments table for prepaid UPS return labels.
-- Run this once in the Neon SQL Editor if your database was created before
-- the return-label feature was added. Safe to run more than once.

create table if not exists shipments (
  id           bigint generated always as identity primary key,
  kit_id       text not null references kits(kit_id) on delete cascade,
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

create index if not exists idx_shipments_kit on shipments(kit_id);
