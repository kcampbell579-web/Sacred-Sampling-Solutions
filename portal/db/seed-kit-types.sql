-- Seed the kit_types catalog — 6 water kits (BAS BEN ESS COM PFA PRO).
-- whats_inside / steps use newline-separated "Title | description" lines.
-- No semicolons inside string literals (the Neon SQL editor splits on ';').

insert into kit_types (code, title, slug, matrix, intro, tests, methods, sensitivity, containers, whats_inside, steps, panels) values
('BAS','Baseline Water Kit','baseline-water','water',
 'A simple, single-bottle screen for heavy metals like lead, arsenic, and copper. One bottle, one rule — don''t rinse it.',
 'Heavy metals (Pb, As, Cu, Cr, Fe, Mn)','ICP-MS · EPA 200.8','Parts per billion (µg/L)','One 125 mL HDPE bottle',
 E'HDPE sample bottle | Pre-cleaned and acid-preserved — do not rinse.\nCooling gel pack | Freeze solid before you collect.\nPrepaid mailer | Drop-off shipping to the lab.\nInstructions + COC card | Scan the QR to register and track.\nSample label | Already carries your Sample ID.\nLab report | EPA-verified results with interpretation.',
 E'Pick a cold, unfiltered tap | Cold kitchen or bath tap, no aerator/filter/softener — not outdoors.\nFlush 2–3 minutes | Run cold water 2–3 minutes, then reduce to a gentle stream.\nDo NOT rinse the bottle | It is acid-preserved to keep metals in solution. Do not rinse or empty it.\nFill to the shoulder | Fill to within 1–2 inches of the top without touching the faucet, then cap.\nRecord time & register | Write the date and time, scan the QR to finish your chain of custody, ship same day.',
 'metals'),
('BEN','Benchmark Water Kit','benchmark-water','water',
 'Heavy metals plus nitrites — two bottles collected in opposite ways. Keep them straight and the rest is easy.',
 'Metals + Nitrites','ICP-MS 200.8 · Colorimetric 353.2','Parts per billion (µg/L)','HDPE metals bottle + nitrite bottle',
 E'HDPE metals bottle | Pre-preserved — do not rinse.\nNitrite bottle | Rinse 3× before filling.\nCooling gel pack | Freeze solid — nitrites must stay cold.\nInsulated mailer + prepaid label | Same-day cold-ship.\nInstructions + COC card | Scan the QR to register and track.\nLab report | Levels compared to EPA limits.',
 E'Know your two bottles | Metals = never rinse. Nitrite = rinse 3×.\nPick the tap & flush | Cold tap, no filter or aerator. Run briefly, reduce to a gentle stream.\nMetals bottle — do NOT rinse | Fill to the shoulder without touching the faucet, cap immediately.\nNitrite bottle — rinse 3× | Rinse and cap three times, discarding each, then fill and cap.\nChill immediately | Both bottles on the gel pack. Nitrites must reach the lab within 48 hours.\nRecord, register, ship | Write the date and time, scan the QR, ship same day.',
 'metals,nitrite'),
('ESS','Essentials Water Kit','essentials-water','water',
 'A core safety screen — bacteria and E. coli plus the everyday water-chemistry basics: nitrates, pH, and hardness.',
 'Total coliform / E. coli · Nitrates · pH · Hardness','Membrane filtration · Colorimetric · Electrometric','Presence/absence + quantitative','Sterile bacteria bottle + chemistry bottle',
 E'Sterile bacteria bottle | Do not open until collection, and do not rinse.\nChemistry bottle | For nitrate, pH, and hardness.\nCooling gel pack | Freeze solid before you collect.\nInsulated mailer + prepaid label | Same-day cold-ship.\nInstructions + COC card | Scan the QR to register and track.\nLab report | Results compared to EPA limits.',
 E'Wash hands & pick a cold tap | Cold tap, no filter or aerator, and wash your hands first. No outdoor spigot.\nFlush, then reduce flow | Run cold water 1–2 minutes, then a gentle stream.\nBacteria bottle — sterile | Open only at the faucet, do not touch the inside, do not rinse. Fill to the line and cap.\nChemistry bottle | Fill from the same faucet to the shoulder and cap.\nChill immediately | Both bottles on the gel pack. Bacteria has a short holding time.\nRecord & register | Write the date and time, scan the QR, ship same day.',
 'bacteria,nitrate,ph,hardness'),
('COM','Comprehensive Water Kit','comprehensive-water','water',
 'Our most complete water panel — volatile organics, the full PFAS panel, and nitrate, in one kit.',
 'VOCs · PFAS · Nitrate as N','GC-MS 524.2 · LC-MS/MS 533 · EPA 300.0','ppb (VOCs) · ppt (PFAS)','2 × 40 mL VOC vials + PFAS bottle + nitrate bottle',
 E'VOC glass vials | Teflon-lined caps for zero-headspace fill.\nPFAS bottle | Certified PFAS-free — do not rinse.\nNitrate bottle | For nitrate as N.\nCooling gel pack | Freeze solid before you collect.\nInsulated mailer + prepaid label | Priority cold-ship.\nInstructions + COC card | Scan the QR to register and track.',
 E'Fill the VOC vials first | Cold tap, no aerator, gentle stream. Fill to a positive meniscus, cap with no air — any bubble means refill.\nFill the PFAS bottle — ultra-clean | Plain-soap hands, no lotion or sunscreen. Open at the faucet, fill to the line, cap. Do not rinse.\nFill the nitrate bottle | Same faucet, same session, fill to the shoulder and cap.\nChill immediately | All containers on the gel pack.\nRecord & register | Write the date and time, scan the QR to complete your chain of custody.',
 'vocs,pfas,nitrate'),
('PFA','PFAS Water Kit','pfas-water','water',
 'Forever-chemical testing is the most contamination-sensitive sample we offer. How you handle it matters as much as the sample.',
 'PFOA · PFOS · PFHxS · PFBS + (25-compound)','LC-MS/MS · EPA 533','Parts per trillion (ppt)','Certified PFAS-free 250 mL bottle',
 E'PFAS-free sample bottle | Lab-certified free of perfluorinated compounds.\nHigh-capacity gel pack | Keeps the sample at or below 4°C.\nInsulated priority mailer | Fast cold-ship with prepaid label.\nUltra-clean checklist | Prevents cross-contamination.\nCOC card + instructions | Scan the QR to register and track.\nHandling guidance | What to wear — and not — while sampling.',
 E'Dress for an ultra-clean sample | Remove waterproof or water-resistant clothing, and avoid Gore-Tex and fabric-softened clothes.\nWash hands — plain soap only | No lotion, sanitizer, sunscreen, or cosmetics.\nChoose the tap & reduce flow | Cold tap, no filter, gentle stream. Do not pre-open the bottle.\nOpen at the faucet, fill to the line | Open only at collection, hold the cap by its edges, fill to the line, cap. Do not rinse.\nChill and record | On the gel pack at or below 4°C, record the date and time, register, and ship same day.',
 'pfas'),
('PRO','Professional Kit','professional','water',
 'Everything we offer in one kit — metals, VOCs, PFAS, nitrate, and bacteria. The complete picture of your water.',
 '13 metals · VOCs · PFAS · Nitrate · Bacteria','ICP-MS · GC-MS · LC-MS/MS · Colorimetric · Membrane filtration','ppb–ppt across panels','Metals + VOC vials + PFAS + nitrate + sterile bacteria bottle',
 E'HDPE metals bottle | Pre-preserved — do not rinse.\nVOC glass vials | Teflon-lined caps, zero headspace.\nPFAS-free bottle | Certified clean — do not rinse.\nNitrate bottle | For nitrate as N.\nSterile bacteria bottle | Open only at the faucet, and do not rinse.\nGel pack + insulated mailer + COC | Same-day cold-ship, scan the QR.',
 E'Fill the VOC vials first | Cold tap, no aerator, gentle stream. Positive meniscus, zero headspace — any bubble means refill.\nPFAS bottle — ultra-clean | Plain-soap hands, no lotion. Open at the faucet, fill to the line, cap. Do not rinse.\nBacteria bottle — sterile | Open only at the faucet, do not touch the inside, do not rinse, then fill and cap.\nMetals bottle — do NOT rinse | Fill to the shoulder and cap.\nNitrate bottle | Same faucet, fill to the shoulder and cap.\nChill, record & register | Everything on the gel pack, write the date and time, scan the QR, ship same day.',
 'metals,vocs,pfas,nitrate,bacteria')
on conflict (code) do update set
  title=excluded.title, slug=excluded.slug, matrix=excluded.matrix, intro=excluded.intro,
  tests=excluded.tests, methods=excluded.methods, sensitivity=excluded.sensitivity,
  containers=excluded.containers, whats_inside=excluded.whats_inside, steps=excluded.steps, panels=excluded.panels;
update kit_types set video_url='/videos/baseline-training.mp4'      where code='BAS';
update kit_types set video_url='/videos/benchmark-training.mp4'     where code='BEN';
update kit_types set video_url='/videos/comprehensive-training.mp4' where code='COM';
update kit_types set video_url='/videos/pfas-training.mp4'          where code='PFA';
