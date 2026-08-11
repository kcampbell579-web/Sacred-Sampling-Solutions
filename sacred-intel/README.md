# Sacred Intel

**The stories behind safety, science, engineering, and environmental health.**

Sacred Intel is a podcast and content platform covering environmental health,
workplace safety, engineering failures, disasters, emerging contaminants, and
the science behind major headlines. This repo is the website — a fast static
site built with [Astro](https://astro.build).

## Tech stack

- **Astro** — static site generator (no client framework, ships minimal JS)
- **Markdown content collections** — episodes and articles are just `.md` files
- **@astrojs/rss** — generates the podcast feed (`/podcast.xml`) and a general feed (`/rss.xml`)
- **@astrojs/sitemap** — generates `sitemap-index.xml`
- Hand-written CSS (no framework) using the brand palette

## Getting started

```bash
npm install
npm run dev      # local dev server at http://localhost:4321
npm run build    # production build to ./dist
npm run preview  # preview the production build
```

## Project structure

```
src/
  content/
    episodes/     # one .md file per episode
    articles/     # one .md file per article
    config.ts     # content schemas (frontmatter validation)
  components/      # Header, Footer, EpisodeCard, Newsletter, etc.
  layouts/Base.astro
  pages/
    index.astro                 # Home
    episodes/index.astro        # Episodes archive + search/filter
    episodes/[slug].astro       # Episode page (player, sources, transcript, related)
    series/[series].astro       # Disaster Files / Deep Dives / Behind the Headlines
    articles/index.astro        # Articles / Intel
    articles/[slug].astro       # Article page
    about.astro  guests.astro  contact.astro
    podcast.xml.js  rss.xml.js  # feeds
  lib/
    site.js       # site name, tagline, subscribe links, email, social
    series.js     # the three series + accent colors
  styles/global.css
public/            # favicon, robots.txt, and any images you add
```

## Publishing an episode

Create a new file in `src/content/episodes/`, e.g. `my-episode.md`:

```md
---
title: "Your Episode Title"
number: 13
series: "Deep Dives"            # or "Disaster Files" | "Behind the Headlines"
topics: ["PFAS", "Water"]       # drives the topic filter + related episodes
date: 2026-08-15
duration: "22 min"
description: "One or two sentences shown on cards and in the feed."
audio: "/audio/ep-13.mp3"       # URL to the MP3 (see Audio & video below)
video: "https://youtu.be/XXXXXXXXXXX"   # optional — embeds a YouTube player
featured: true                  # optional — pins it as the homepage feature
guests: ["Dr. Jane Doe"]        # optional
sources:                        # optional — renders the references sidebar
  - title: "Source name"
    url: "https://example.org/report"
transcript: |                   # optional — renders a collapsible transcript
  First paragraph of the transcript.

  Second paragraph.
---

The episode show notes go here in **Markdown**.
```

Articles work the same way in `src/content/articles/`.

## Audio & video

- **Audio:** put MP3s somewhere hosted (your podcast host, S3, etc.) and set the
  `audio:` field to the URL. The on-page player and the podcast RSS `<enclosure>`
  both use it. The sample episodes point at `/audio/…` placeholders — replace them.
- **Video:** add a `video:` field with a YouTube URL or ID to embed a player at
  the top of the episode page.

## Things to customize

- **`src/lib/site.js`** — subscribe links (Apple/Spotify/YouTube/Overcast/RSS are
  `#` placeholders), contact email, and social links.
- **Newsletter & forms** — the newsletter and the contact/guest forms post to `#`.
  Point them at your provider (Mailchimp, ConvertKit, Beehiiv, Buttondown, Formspree…).
- **`astro.config.mjs`** — set `site` to your real domain once it's connected so
  canonical URLs, the sitemap, and the podcast feed use absolute links.
- **Open Graph image** — `Base.astro` falls back to the favicon; add a real
  `og.png` in `/public` and reference it for better link previews.

## Deploying

The site is fully static — deploy `dist/` anywhere. Easiest options:

- **Vercel / Netlify / Cloudflare Pages** — connect the repo, framework preset
  "Astro", build command `npm run build`, output directory `dist`. Add your
  custom domain in the host's dashboard when it's ready.

## License

© Sacred Intel. All rights reserved.
