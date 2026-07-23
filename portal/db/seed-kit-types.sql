-- Seed the kit_types catalog (8 kits, master spec §7).
-- Content for the water kits + air comes from the collection-training mockups.
-- whats_inside / steps use newline-separated "Title | description" lines.
-- NOTE: ALD, AMM, TCK carry structural stubs — finalize their content from
--       Kits_import.csv. COM's collection steps come from the Comprehensive
--       mockup; confirm they match the spec panel (VOCs + PFAS + Nitrate).

insert into kit_types (code, title, slug, matrix, intro, tests, methods, sensitivity, containers, whats_inside, steps, panels) values

('BAS','Baseline Water Kit','baseline-water','water',
 'A simple, single-bottle screen for heavy metals like lead, arsenic, and copper. One bottle, one rule — don''t rinse it.',
 'Heavy metals (Pb, As, Cu, Cr, Fe, Mn)','ICP-MS · EPA 200.8','Parts per billion (µg/L)','One 125 mL HDPE bottle',
 E'HDPE sample bottle | Pre-cleaned and acid-preserved — do not rinse.\nCooling gel pack | Freeze solid before you collect.\nPrepaid mailer | Drop-off shipping to the lab.\nInstructions + COC card | Scan the QR to register and track.\nSample label | Already carries your Sample ID.\nLab report | EPA-verified results with interpretation.',
 E'Pick a cold, unfiltered tap | Use a cold-water kitchen or bathroom tap with no aerator, filter, or softener — not outdoors.\nFlush 2–3 minutes | Run the cold water two to three minutes to clear standing water, then reduce to a gentle stream.\nDo NOT rinse the bottle | The bottle is pre-preserved with acid that keeps metals in solution. Don''t rinse it or pour it out.\nFill to the shoulder | Fill to within 1–2 inches of the top without touching the bottle to the faucet, then cap immediately.\nRecord time & register | Write the exact collection date and time, scan the QR to finish your chain of custody, then ship the same day.',
 'metals'),

('BEN','Benchmark Water Kit','benchmark-water','water',
 'Heavy metals plus nitrites — two bottles collected in opposite ways. Keep them straight and the rest is easy.',
 'Metals + Nitrites','ICP-MS 200.8 · Colorimetric 353.2','Parts per billion (µg/L)','125 mL HDPE metals bottle + nitrite bottle',
 E'HDPE metals bottle | Pre-preserved — do not rinse.\nNitrite bottle | Rinse 3× before filling.\nCooling gel pack | Freeze solid; nitrites must stay cold.\nInsulated mailer + prepaid label | Same-day cold-ship to the lab.\nInstructions + COC card | Scan the QR to register and track.\nLab report | Levels compared to EPA limits.',
 E'Know your two bottles | Metals bottle = never rinse. Nitrite bottle = rinse 3×. This is the one thing to keep straight.\nPick the tap & flush | Cold tap, no filter/aerator/softener. Run briefly, then reduce to a gentle stream.\nMetals bottle — do NOT rinse | Fill the pre-preserved HDPE bottle to the shoulder without touching the faucet, and cap immediately.\nNitrite bottle — rinse 3× | Rinse and cap three times with sample water, discarding each rinse, then fill and cap.\nChill immediately | Place both bottles on the frozen gel pack right away. Nitrites must reach the lab within 48 hours.\nRecord, register, ship | Write the collection date and time, scan the QR to complete your chain of custody, and ship the same day.',
 'metals,nitrite'),

('COM','Comprehensive Water Kit','comprehensive-water','water',
 'Our most complete water panel — volatile organics, the full PFAS panel, and nitrate, in one kit.',
 'VOCs · PFAS · Nitrate as N','GC-MS · EPA 524.2 · LC-MS/MS · EPA 533 · EPA 300.0','ppb (VOCs) · ppt (PFAS)','2 × 40 mL VOC vials + 250 mL PFAS bottle + nitrate bottle',
 E'VOC glass vials | Teflon-lined caps for zero-headspace fill.\nPFAS bottle | Certified PFAS-free — do not rinse.\nNitrate bottle | For nitrate as N.\nCooling gel pack | Freeze solid before you collect.\nInsulated mailer + prepaid label | Priority cold-ship to the lab.\nInstructions + COC card | Scan the QR to register and track.',
 E'Fill the VOC glass vials first | Cold tap, no aerator or filter; gentle stream. Fill to a positive meniscus and cap so no air is trapped — invert and tap; any bubble means refill.\nFill the PFAS bottle — ultra-clean | Wash hands with plain soap only; no lotion or sunscreen. Open the certified bottle only at the faucet, fill to the line, cap immediately. Do not rinse.\nFill the nitrate bottle | Fill to the shoulder from the same faucet, same session, and cap.\nChill immediately | Place all containers on the frozen gel pack right away.\nRecord date & time, then register | Write the exact collection date and time, then scan the QR to complete your chain of custody.',
 'vocs,pfas,nitrate'),

('PFA','PFAS Water Kit','pfas-water','water',
 'Forever-chemical testing is the most contamination-sensitive sample we offer. How you handle it is as important as the sample itself.',
 'PFOA · PFOS · PFHxS · PFBS + (25-compound panel)','LC-MS/MS · EPA 533','Parts per trillion (ppt)','Certified PFAS-free 250 mL bottle',
 E'PFAS-free sample tubes | Lab-certified free of perfluorinated compounds.\nHigh-capacity gel pack | Keeps the sample at/below 4°C.\nInsulated priority mailer | Fast cold-ship with prepaid priority label.\nUltra-clean checklist | Step-by-step to prevent cross-contamination.\nCOC card + instructions | Scan the QR to register and track.\nHandling guidance | What to wear — and not wear — while sampling.',
 E'Dress for an ultra-clean sample | Remove waterproof/water-resistant clothing; avoid Gore-Tex, treated fabrics, and freshly fabric-softened clothes.\nWash your hands — plain soap only | No lotion, hand sanitizer, sunscreen, or cosmetics before handling the tube.\nChoose the tap & reduce flow | Cold tap without a filter; gentle, non-splashing stream. Do not pre-open the tube.\nOpen at the faucet and fill to the line | Open the tube only at the moment of collection, hold the cap by its edges, fill to the line, and cap immediately. Do not rinse.\nChill and record | Place the tube on the gel pack immediately (≤4°C), record the date and time, then register your Sample ID and ship the same day.',
 'pfas'),

('VOC','Air — VOC','air-voc','air',
 'Indoor-air monitoring with a passive sampler that measures what you''re actually breathing over time. Placement and exposure time are everything.',
 'TVOCs','EPA TO-15 / TO-17','Passive monitor','Passive monitor badge',
 E'Passive monitor badge(s) | Professionally calibrated air sampler.\nProtective packaging | Keeps the sampler stable before & after.\nExposure instructions | Placement and timing guidance.\nChain-of-custody card | Scan the QR to register and track.\nPrepaid return mailer | Ship the same day you finish.\nLab report | Clear results with interpretation.',
 E'Pick the right room and spot | Place the monitor away from windows, doors, vents, fans, and purifiers, at breathing height (3–5 ft).\nOpen the sampler and note the start time | Record the exact start date and time; the sampler begins absorbing immediately.\nRun the full exposure, undisturbed | Leave it in place for the full duration; keep the room in its normal everyday state.\nSeal and record the end time | Seal exactly as instructed and record the end date and time.\nRegister and ship same day | Scan the QR to complete your chain of custody, then ship with the prepaid label.',
 'air_voc'),

('ALD','Air — Formaldehyde','air-aldehyde','air',
 'Passive badge monitoring for formaldehyde and other aldehydes in indoor air.',
 'Formaldehyde / aldehydes','EPA TO-11A','Passive monitor','Passive aldehyde badge',
 E'Passive aldehyde badge | Calibrated formaldehyde sampler.\nProtective packaging | Keeps the sampler stable before & after.\nExposure instructions | Placement and timing guidance.\nChain-of-custody card | Scan the QR to register and track.\nPrepaid return mailer | Ship the same day you finish.\nLab report | Clear results with interpretation.',
 E'Pick the right room and spot | Place away from windows, vents, and purifiers, at breathing height.\nOpen and record the start time | Record the exact start date and time.\nRun the full exposure | Leave undisturbed for the full duration; keep the room normal.\nSeal and record the end time | Seal as instructed and record the end date/time.\nRegister and ship same day | Complete your chain of custody and ship with the prepaid label.',
 'aldehyde'),

('AMM','Air — Ammonia','air-ammonia','air',
 'Passive badge monitoring for ammonia in indoor air.',
 'Ammonia','Passive badge / IC','Passive monitor','Passive ammonia badge',
 E'Passive ammonia badge | Calibrated ammonia sampler.\nProtective packaging | Keeps the sampler stable before & after.\nExposure instructions | Placement and timing guidance.\nChain-of-custody card | Scan the QR to register and track.\nPrepaid return mailer | Ship the same day you finish.\nLab report | Clear results with interpretation.',
 E'Pick the right room and spot | Place away from windows, vents, and purifiers, at breathing height.\nOpen and record the start time | Record the exact start date and time.\nRun the full exposure | Leave undisturbed for the full duration; keep the room normal.\nSeal and record the end time | Seal as instructed and record the end date/time.\nRegister and ship same day | Complete your chain of custody and ship with the prepaid label.',
 'ammonia'),

('TCK','Tick PCR','tick','tick',
 'Mail-in PCR testing that identifies a tick and screens it for disease-causing pathogens.',
 'Tick ID + pathogen PCR','PCR','Species + pathogen panel','Tick containment vial',
 E'Tick vial | Secure containment for the specimen.\nProtective packaging | Keeps the specimen intact in transit.\nCollection instructions | How to remove and store the tick.\nChain-of-custody card | Scan the QR to register and track.\nPrepaid return mailer | Ship the same day.\nLab report | Species ID + pathogen results.',
 E'Remove the tick carefully | Use fine-tipped tweezers close to the skin; pull straight out without twisting.\nPlace it in the vial | Seal the tick in the provided containment vial.\nRecord details | Note the date found and the bite location if known.\nRegister your Sample ID | Scan the QR to complete your chain of custody.\nShip the same day | Use the prepaid mailer.',
 'tick_pcr')

on conflict (code) do update set
  title = excluded.title, slug = excluded.slug, matrix = excluded.matrix,
  intro = excluded.intro, tests = excluded.tests, methods = excluded.methods,
  sensitivity = excluded.sensitivity, containers = excluded.containers,
  whats_inside = excluded.whats_inside, steps = excluded.steps, panels = excluded.panels;

-- Training videos (self-hosted in portal/public/videos, served by Vercel).
update kit_types set video_url = '/videos/baseline-training.mp4'      where code = 'BAS';
update kit_types set video_url = '/videos/benchmark-training.mp4'     where code = 'BEN';
update kit_types set video_url = '/videos/comprehensive-training.mp4' where code = 'COM';
update kit_types set video_url = '/videos/pfas-training.mp4'          where code = 'PFA';
