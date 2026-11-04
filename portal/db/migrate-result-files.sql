-- Uploaded lab-result PDFs, stored in-database (base64) so no external blob
-- store or extra env var is needed. Served through /results-pdf/<SampleID>,
-- which checks the customer owns the sample (or is staff) before streaming it.
-- Keep uploads modest (the app caps them at ~4.5 MB); for large reports, paste
-- a hosted URL instead. The app also creates this table on first upload
-- (self-healing), so running this by hand is optional.

create table if not exists result_files (
  sample_id    text primary key references sample_registrations(sample_id) on delete cascade,
  pdf_b64      text not null,
  filename     text,
  content_type text,
  created_at   timestamptz not null default now()
);
