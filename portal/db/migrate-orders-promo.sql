-- Coupon / campaign tracking: the promotion code a customer used at checkout and
-- the discount amount. Captured by the Stripe webhook and shown on the
-- fulfillment Campaigns tab. The app also adds these columns on first use
-- (self-healing), so running this by hand is optional.

alter table orders add column if not exists promo_code     text;
alter table orders add column if not exists discount_total integer;  -- cents

create index if not exists idx_orders_promo on orders (upper(promo_code));
