-- Sample Kit IDs for testing. In production, insert a row here when a kit is
-- manufactured/printed so the customer can activate it.

insert into kits (kit_id, product) values
  ('SSS-ESS-0001',  'essentials'),
  ('SSS-BAS-0001',  'heavymetals'),
  ('SSS-MNM-0001',  'minerals'),
  ('SSS-COM-0001',  'comprehensive'),
  ('SSS-PFAS-0001', 'pfas'),
  ('SSS-PRO-0001',  'professional')
on conflict (kit_id) do nothing;

-- ── Lab/admin cheat-sheet (run manually as a kit moves through the lab) ──
-- Mark received:   update kits set status='received'  where kit_id='SSS-ESS-0001';
-- Mark analyzing:  update kits set status='analyzing' where kit_id='SSS-ESS-0001';
-- Release results: update kits set status='ready' where kit_id='SSS-ESS-0001';
--                  insert into results (kit_id, summary, report_url)
--                  values ('SSS-ESS-0001','All analytes within EPA limits.','https://.../report.pdf');
