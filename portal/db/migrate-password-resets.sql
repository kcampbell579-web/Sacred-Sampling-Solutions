-- One-time tokens for setting/resetting a portal password.
-- Run once in the Neon SQL editor (Project -> SQL Editor) against the portal DB.
-- Powers the "set your password" link emailed to customers whose account is
-- auto-created at checkout, and can back a password-reset flow too.

create table if not exists password_resets (
  token      text primary key,
  user_id    bigint not null references users(id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index if not exists idx_password_resets_user on password_resets(user_id);
