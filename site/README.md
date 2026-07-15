# Sacred Sampling Solutions — redesigned site (static HTML)

A fast, conversion-optimized static site you can host **right now** while you
rebuild in Wix. No build step, no dependencies — just HTML/CSS/JS.

## Files
| File | What it is |
|------|-----------|
| `index.html` | Homepage — dark hero, the 6 water kits, how-it-works, what-we-measure, "why us", email capture |
| `kits.html`  | Shop page — 6 water kits, air kits, a "what each kit tests" comparison matrix, and FAQ |
| `quiz.html`  | Interactive "Find my kit" quiz (pure JS) that recommends one of the 6 kits |
| `styles.css` | Shared design system (brand tokens at the top) |
| `app.js`     | Shared behavior (theme toggle, mobile nav, scroll reveal) |
| `assets/`    | Logo files (transparent PNGs keyed from your live-site logos) |

## Brand
- **Colors:** black `#0E0E0E` + blue `#2C94FC` (per your product copy). All tokens
  live at the top of `styles.css` under `:root` (and the dark-theme blocks).
- **Voice:** warm, plain-language, for parents and homeowners. Health context is
  kept light on the product pages (meant to live in an Education library).
- Header + hero are intentionally **dark** (black → navy) in both light and dark mode.

## The 6 drinking-water kits (from your Wix product copy)
1. **Heavy Metals Kit** — 13 heavy metals
2. **Metals & Minerals Kit** — 13 metals + chloride + fluoride
3. **Essentials Kit** — bacteria (total coliform), E. coli, nitrates, pH, hardness *(marked "Most popular")*
4. **Comprehensive Kit** — VOCs + 13 metals + chloride + fluoride
5. **PFAS Kit** — 25-compound PFAS panel, EPA Method 533 (LC-MS/MS)
6. **Professional Kit** — everything, all 10 analytes *(marked "Most complete")*

## Prices (from the "6-Kit Model 2026" SKU sheet)
Essentials **$199** · Heavy Metals **$249** · Metals & Minerals **$329** ·
Comprehensive **$499** · PFAS **$499** · Professional **$1,195**.
Air standalone: Formaldehyde **$149** · VOC **$199** · Ammonia **$125**.

## ⚠️ To finish before launch
1. **Accreditation** — I say "accredited partner laboratory" generically. If you have a
   named lab or ISO/IEC 17025 number, it's a strong trust signal to add.
2. **"Add to cart" links** point to `#` — wire them to your real checkout.
3. **Email capture** (homepage) is front-end only — connect it to your email tool.

Every page carries the required footer disclaimer: *"For informational & screening
purposes. Not a medical diagnosis."*

## Hosting (fastest first)
- **GitHub Pages** — enable Pages on this branch, serve from `/site`.
- **Netlify / Vercel / Cloudflare Pages** — drag-and-drop the `site/` folder.
- **Any static host** — upload the `site/` folder as-is. Opens from `file://` too.
