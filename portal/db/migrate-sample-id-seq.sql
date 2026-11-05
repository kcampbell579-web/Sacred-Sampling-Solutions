-- Sample IDs minted by the fulfillment "Kit QR labels" tool.
--
-- The sequence starts at 13000 so freshly minted IDs never collide with the
-- IDs already in use (existing kits / registrations sit below this). The app
-- also creates these objects on first use (self-healing), so running this file
-- by hand is optional — it's here for a clean, explicit setup.

create sequence if not exists sample_id_seq start with 13000 increment by 1;

create table if not exists issued_sample_ids (
  sample_id  text primary key,
  kit_code   text not null,
  batch      text,
  created_at timestamptz not null default now()
);

create index if not exists issued_sample_ids_batch_idx on issued_sample_ids (batch);
