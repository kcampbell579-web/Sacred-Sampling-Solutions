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
 'A core safety screen for your drinking water — Total Coliform bacteria and E. coli, plus nitrate, pH, and hardness.',
 'Total Coliform · E. coli · Nitrate · pH · Hardness','Microbiology culture · Colorimetric · Electrometric · Titrimetric','Presence/absence + quantitative','Microbiology 125 mL round (red cap) · Nitrate · pH 250 mL rectangular · Hardness',
 E'Microbiology bottle (red cap) | Clear 125 mL round bottle for Total Coliform and E. coli. Contains a preservative — do not rinse or empty it.\nNitrate, pH & Hardness bottles | The pH sample uses the 250 mL rectangular bottle. Keep each capped until you fill it.\nInsulated thermal pouch | Keeps your samples cold in transit.\nFrozen ice pack | Freeze solid before you collect.\nQR card + Sample Collection Guide | Scan to register and record each bottle''s date and time.\nPrepaid UPS return label | Ship the same day you collect.',
 E'Register & open your guide | Scan the QR, confirm your info and Sample ID, and keep the Sample Collection Guide open — you will record each bottle''s date and time.\nChoose the faucet & prepare | Use a regularly used indoor cold-water faucet (no hose, outdoor spigot, or fridge dispenser). Wash hands with plain soap, no lotion or sanitizer. Remove the aerator, run cold water about 5 minutes, then reduce to a gentle stream.\nBottle-handling rules | Open one bottle at a time. Never rinse a bottle, touch the inside of the bottle or cap, or set a cap face-down. Do not let the bottle touch the faucet. Fill to the marked line and recap immediately.\nMicrobiology bottle (red cap) | The 125 mL round bottle contains a preservative — do not rinse or pour it out. Fill to the line without overfilling, recap, and record the date and time.\nNitrate, pH & Hardness bottles | Fill each labeled bottle to the indicated level from the same gentle stream, recap immediately, and record each bottle''s date and time.\nFinal check | Confirm every bottle is filled correctly, caps are tight, nothing leaks, and all dates and times are recorded.\nPack & ship same day | Bottles into protective packaging, then the thermal pouch with the frozen ice pack, seal the box, and apply the prepaid UPS label. Refrigerate if you must wait — never freeze the samples.',
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
