-- Add outbound (warehouse -> customer) UPS tracking to orders.
-- Run once in the Neon SQL editor (Project -> SQL Editor) against the portal DB.
-- The return leg (customer -> lab) already lives on sample_registrations.tracking_number.

alter table orders add column if not exists tracking_number text;
alter table orders add column if not exists carrier text default 'UPS';
