# Sacred Command Nexus

Marketing site for **Sacred Command Nexus** — a digital build studio offering
website design & build, app building, portal building, and ongoing care. It's a
sister brand to Sacred Sampling Solutions and shares its blue/gold, Manrope
design DNA with a darker "command center" treatment.

## What's here

- `index.html` — the full single-page site. Fully self-contained: all CSS and JS
  are inline, the logo/favicon is an inline SVG, and fonts are the only external
  request (Google Fonts). No build step required.
- `vercel.json` — static hosting config with `cleanUrls` and basic security headers.

## Sections

Hero (build-pipeline console) → trust KPIs → services (Website, App, Portal +
AI/Automation, Branding, Care) → process pipeline → tech stack → case study
(Sacred Sampling Solutions) → engagement tiers → FAQ → contact CTA → footer.

## Run locally

It's a static file — open `index.html` directly, or serve the folder:

```bash
cd nexus
python3 -m http.server 8000   # then visit http://localhost:8000
```

## Notes

- **Theme:** dark by default with a light toggle in the footer; the choice is
  remembered in `localStorage`. Respects `prefers-reduced-motion`.
- **Responsive:** collapses to a mobile nav and single-column layouts under 900px.
- **Placeholders to update before going live:** the `hello@sacredcommandnexus.com`
  contact address, the pricing bands, and the Q3 booking badge in the hero.
