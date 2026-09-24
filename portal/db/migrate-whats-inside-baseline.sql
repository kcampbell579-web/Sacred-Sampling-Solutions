-- Update the "What's inside" box contents for the Baseline / Heavy Metals kit.
-- Run once in the Neon SQL editor (Project → SQL Editor) against the portal DB.
-- Replaces "Instructions + COC card" with "QR code + instructions", removes
-- "Lab report", and adds nitrile gloves, thermal pack, and the label integrity seal.
-- No semicolons inside the string literal (the Neon editor splits statements on ';').

update kit_types set whats_inside = E'HDPE sample bottle | Pre-cleaned and acid-preserved — do not rinse.\nNitrile gloves | Powder-free — put them on before you handle the bottle.\nCooling gel pack | Freeze solid before you collect.\nThermal pack | Insulated wrap that keeps your sample cold in transit.\nSample label | Already carries your Sample ID.\nLabel integrity seal | Tamper-evident seal that protects your chain of custody.\nQR code + instructions | Scan the QR to register and track.\nPrepaid mailer | Drop-off shipping to the lab.' where slug = 'baseline-water';
