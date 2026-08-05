# Sacred Forge Systems

Multi-page marketing site for **Sacred Forge Systems** — a technology studio
offering website design, custom software, mobile apps, AI & automation,
branding and more, plus its own line of products. Brand mark is the gold
atom + cross inside a targeting ring; accent is Amber Glow `#E6B422`, on a
blue/amber + Manrope design system.

## How it's built

Pages are **generated** from shared templates by `build.py`, so the nav,
header, footer and `<head>` stay identical everywhere. The output is plain
static HTML committed alongside the script — no build step is needed to deploy.

```bash
cd forge
python3 build.py          # regenerates every .html page + sitemap.xml + robots.txt
python3 -m http.server 8000   # preview at http://localhost:8000
```

> Serve the folder (as above) rather than opening files directly — links are
> root-absolute (`/services/…`), which resolve correctly under any static host.

### Source vs. output
- **Edit `build.py`** (content + templates), `styles.css` (design system) and
  `app.js` (nav, theme, reveal, form). Then re-run `build.py`.
- The `.html` files, `sitemap.xml` and `robots.txt` are generated — don't hand-edit.

## Pages (23)

- **Home** — hero, services, industries, why, portfolio, process, testimonials, CTA
- **Services** — overview + 5 SEO sub-pages (Website Design, Custom Software,
  Mobile Apps, AI & Automation, Branding)
- **Products** — SacredOps, Sacred Sampling Portal, Proposal Builder, and more
- **Portfolio** — grid + two full case studies (Sacred Sampling, SacredOps)
- **Industries** — 8 industries
- **About**, **Process**, **Pricing** (4 bands), **FAQ**
- **Blog** — index + 4 sample posts (+ "coming soon" cards)
- **Contact** — form, booking, phone, email
- **Client Portal** — feature overview, interface mock, sign-in preview

## Notes

- **Theme:** dark by default with a light toggle in the footer (remembered).
  Respects `prefers-reduced-motion`; reveal animations are progressive
  enhancement (content is visible without JS).
- **Responsive:** 8-item nav collapses to a mobile menu with a Services
  dropdown under 1040px.

## Placeholders to replace before launch

- Contact email `hello@sacredforgesystems.com`, phone, and the `cal.com` booking link
- The contact form is a front-end demo — wire it to an inbox or form service
- Testimonials and the About "founder story" are placeholder copy
- Case-study screenshots are mockups — swap in real captures
- Pricing bands are indicative
