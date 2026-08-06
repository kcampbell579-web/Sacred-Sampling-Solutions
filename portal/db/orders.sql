-- Orders captured from Stripe checkout (fulfillment portal).
-- Run this in the Neon SQL editor once.
create table if not exists orders (
  id                bigint generated always as identity primary key,
  stripe_session_id text unique not null,
  email             text,
  customer_name     text,
  amount_total      integer,                 -- in cents
  currency          text default 'usd',
  kit_name          text,                    -- product name(s) from the checkout line items
  quantity          integer default 1,
  ship_name         text,
  ship_address      text,                    -- formatted, single string
  phone             text,
  status            text not null default 'new',   -- new | shipped | fulfilled
  notes             text,
  created_at        timestamptz not null default now(),
  shipped_at        timestamptz
);

create index if not exists idx_orders_status  on orders(status);
create index if not exists idx_orders_created  on orders(created_at desc);
