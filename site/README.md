# Sacred Sampling Solutions — redesigned site (static HTML)

A fast, conversion-optimized static site you can host **right now** while you
rebuild in Wix. No build step, no dependencies — just HTML/CSS/JS.

## Files
| File | What it is |
|------|-----------|
| `index.html` | Homepage (dark hero, kits + pricing, how-it-works, contaminants, guarantee, email capture) |
| `kits.html`  | Shop / pricing page with a full panel-comparison matrix and FAQ |
| `quiz.html`  | Interactive "Find my panel" quiz (pure JS, recommends a panel) |
| `styles.css` | Shared design system (brand tokens live at the top) |
| `app.js`     | Shared behavior (theme toggle, mobile nav, scroll reveal) |
| `assets/`    | Logo files (transparent PNGs keyed from your live-site logos) |

## ⚠️ Placeholders to replace before you go live
These are my best guesses — swap in your real values (search across the HTML files):

1. **Prices** — `$129`, `$219`, `$389`. Update in `index.html`, `kits.html`, and the
   `panels` object in `quiz.html`.
2. **Kit names** — "Essentials / Benchmark+ / Comprehensive" and panel titles.
3. **Exact analyte lists** per panel (in `kits.html` cards + the comparison matrix).
4. **Lab accreditation** — I wrote "accredited lab partner" generically. If you have a
   named lab or an ISO/IEC 17025 accreditation number, put it in the hero trust row and
   the guarantee section — it's one of your strongest trust signals.
5. **Cart / checkout links** — the "Add to cart" buttons currently link to `#`. Point them
   at your real store/checkout (Wix Stores, Stripe link, etc.).
6. **Email capture** — the guide form is front-end only. Connect it to your email tool
   (Mailchimp/Wix/etc.) via the form `action` or an embed.

## Brand tokens
All colors live at the top of `styles.css` under `:root` (and the dark-theme blocks).
Primary blue = `--brand`, gold = `--gold`, dark surfaces = `--dk-*`.

## Hosting options (fastest first)
- **GitHub Pages** — push this repo, enable Pages on the branch, point it at `/site`.
- **Netlify / Vercel / Cloudflare Pages** — drag-and-drop the `site/` folder.
- **Any static host / your domain** — upload the `site/` folder contents as-is.

The pages are fully self-contained and work from `file://` too — just open `index.html`.
