-- Sacred Sampling Solutions — Mailer schema.
-- Run once in the Neon SQL Editor (the same Neon project as the portal is fine;
-- every table here is prefixed `mail_` so nothing collides).

-- ── An uploaded list ────────────────────────────────────────────────────────
create table if not exists mail_lists (
  id         bigint generated always as identity primary key,
  name       text not null,
  created_at timestamptz not null default now()
);

-- ── One row per address on a list ───────────────────────────────────────────
-- `fields` holds every other CSV column, so {{company}} style tokens in a
-- campaign body can be filled from whatever the uploaded file happened to have.
create table if not exists mail_contacts (
  id           bigint generated always as identity primary key,
  list_id      bigint not null references mail_lists(id) on delete cascade,
  email        text not null,
  name         text,
  fields       jsonb not null default '{}'::jsonb,
  unsubscribed boolean not null default false,
  created_at   timestamptz not null default now(),
  unique (list_id, email)
);

-- ── Global do-not-email set ─────────────────────────────────────────────────
-- Unsubscribes and hard bounces land here and are honoured across every list,
-- so re-uploading a CSV can never resurrect someone who opted out.
create table if not exists mail_suppressions (
  email      text primary key,
  reason     text,
  created_at timestamptz not null default now()
);

-- ── A send: which list, from whom, and how fast ─────────────────────────────
-- The pacing is `batch_size` emails released every `interval_seconds`.
-- `next_send_at` is the clock: the dispatcher only acts when now() passes it.
create table if not exists mail_campaigns (
  id               bigint generated always as identity primary key,
  name             text not null,
  list_id          bigint not null references mail_lists(id) on delete restrict,
  from_name        text,
  from_email       text not null,
  reply_to         text,
  subject          text not null,
  body             text not null,
  body_is_html     boolean not null default false,
  interval_seconds integer not null default 3600,
  batch_size       integer not null default 1,
  status           text not null default 'draft',   -- draft | running | paused | done
  next_send_at     timestamptz,
  created_at       timestamptz not null default now(),
  started_at       timestamptz,
  finished_at      timestamptz
);

-- ── The per-recipient work queue ────────────────────────────────────────────
-- The unique constraint is the no-duplicate-send guarantee: a contact can only
-- ever hold one row per campaign, however many times the dispatcher runs.
create table if not exists mail_queue (
  id          bigint generated always as identity primary key,
  campaign_id bigint not null references mail_campaigns(id) on delete cascade,
  contact_id  bigint not null references mail_contacts(id) on delete cascade,
  email       text not null,
  status      text not null default 'queued',   -- queued | sending | sent | failed | skipped
  attempts    integer not null default 0,
  error       text,
  sent_at     timestamptz,
  unique (campaign_id, contact_id)
);

create index if not exists idx_contacts_list     on mail_contacts(list_id);
create index if not exists idx_contacts_email     on mail_contacts(lower(email));
create index if not exists idx_campaigns_due       on mail_campaigns(status, next_send_at);
create index if not exists idx_queue_campaign       on mail_queue(campaign_id, status);
