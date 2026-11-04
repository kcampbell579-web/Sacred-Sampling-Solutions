-- Leads captured from the marketing site (newsletter / welcome, affiliate
-- sign-ups, contact + "notify me" forms, call-back requests). Mirrored here from
-- the site forms so the fulfillment Leads dashboard has every request in one
-- place. The app also creates this on first capture (self-healing).

create table if not exists leads (
  id         bigint generated always as identity primary key,
  type       text not null default 'inquiry',  -- welcome | affiliate | inquiry | callback | notify | other
  name       text,
  email      text,
  phone      text,
  message    text,
  ref        text,                              -- affiliate/promo code
  source     text,                              -- page path the form was on
  meta       text,                              -- extra fields, JSON string
  created_at timestamptz not null default now()
);
create index if not exists idx_leads_type    on leads(type);
create index if not exists idx_leads_created  on leads(created_at desc);
create index if not exists idx_leads_email    on leads(lower(email));
