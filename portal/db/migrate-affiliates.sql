-- Sacred Partners affiliate program. Optional: lib/affiliates.js creates these
-- tables automatically on first use. Safe to run more than once.
create table if not exists affiliates (
  id              bigint generated always as identity primary key,
  email           text unique not null,
  name            text not null,
  user_id         bigint references users(id) on delete set null,
  status          text not null default 'pending',   -- pending | approved | paused | rejected
  code            text unique,                        -- e.g. JANE20 (Stripe promotion code)
  stripe_promo_id text,
  website         text,
  audience        text,
  channel         text,
  preferred_code  text,
  about           text,
  payout_method   text,                               -- paypal | venmo | zelle | check
  payout_handle   text,
  w9_received     boolean not null default false,
  agreed_terms_at timestamptz,
  created_at      timestamptz not null default now(),
  approved_at     timestamptz
);

create table if not exists affiliate_commissions (
  id                bigint generated always as identity primary key,
  affiliate_id      bigint not null references affiliates(id) on delete cascade,
  order_id          bigint,
  stripe_session_id text unique not null,
  source            text not null,                    -- code | link
  product_cents     integer not null,                 -- product total after discount, before shipping/tax
  commission_cents  integer not null,                 -- 10% of product_cents
  status            text not null default 'pending',  -- pending | paid | void (payable = pending older than 30 days)
  created_at        timestamptz not null default now(),
  paid_at           timestamptz,
  payout_ref        text
);
create index if not exists affiliate_commissions_aff on affiliate_commissions (affiliate_id, status);
