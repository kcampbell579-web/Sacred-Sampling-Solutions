-- Outbound (warehouse -> customer) UPS label bought from the fulfillment card.
-- Stores the purchased label's PDF URL alongside the tracking number. The app
-- also adds these columns on first use (self-healing), so this is optional.

alter table orders add column if not exists tracking_number    text;
alter table orders add column if not exists outbound_label_url text;
