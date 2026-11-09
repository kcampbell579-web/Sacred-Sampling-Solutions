#!/usr/bin/env python3
"""SEO metadata check for the static site in site/.

Standard library only. Run from the repo root:

    python3 scripts/seo_check.py           # errors fail (exit 1), warnings print
    python3 scripts/seo_check.py --strict  # warnings fail too

Checks every site/*.html page for: missing/long/duplicate titles, missing/long/
short/duplicate meta descriptions, canonical URLs (present, https://www, matching
the page's clean URL), OpenGraph basics and that the og:image file exists,
HTML entities that leaked into metadata, duplicate meta tags, JSON-LD that does
not parse, and sitemap.xml consistency with noindex directives.
"""
import html
import json
import os
import re
import sys
from collections import Counter, defaultdict

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = os.path.join(ROOT, "site")
ORIGIN = "https://www.sacredsamplingsolutions.com"

TITLE_MAX = 70
DESC_MAX = 160
DESC_TARGET = (140, 155)   # outside this range is a warning
DESC_MIN = 70              # below this is an error ("too short")

errors, warnings = [], []


def err(page, msg):
    errors.append(f"{page}: {msg}")


def warn(page, msg):
    warnings.append(f"{page}: {msg}")


def meta_values(text, key, name):
    pat = r'<meta\s+' + key + r'="' + re.escape(name) + r'"\s+content="(.*?)"\s*/?>'
    return re.findall(pat, text, re.S | re.I)


def page_url(fn):
    return ORIGIN + "/" if fn == "index.html" else ORIGIN + "/" + fn[:-5]


def main():
    strict = "--strict" in sys.argv
    pages = sorted(f for f in os.listdir(SITE) if f.endswith(".html"))
    titles, descs = defaultdict(list), defaultdict(list)
    noindex = set()

    for fn in pages:
        text = open(os.path.join(SITE, fn), encoding="utf-8").read()
        head = text.split("</head>", 1)[0]
        is_noindex = bool(re.search(r'<meta\s+name="robots"[^>]*noindex', head, re.I))
        if is_noindex:
            noindex.add(fn)

        # Title
        tm = re.findall(r"<title>(.*?)</title>", head, re.S)
        if not tm:
            err(fn, "missing <title>")
        else:
            if len(tm) > 1:
                err(fn, "more than one <title>")
            title = html.unescape(re.sub(r"<[^>]+>", "", tm[0])).strip()
            if not title:
                err(fn, "empty <title>")
            elif len(title) > TITLE_MAX:
                err(fn, f"title is {len(title)} chars (max {TITLE_MAX}): {title}")
            titles[title].append(fn)

        # Meta description
        dm = meta_values(head, "name", "description")
        if not dm:
            err(fn, "missing meta description")
        else:
            d = html.unescape(dm[0]).strip()
            if len(d) > DESC_MAX:
                err(fn, f"description is {len(d)} chars (max {DESC_MAX})")
            elif len(d) < DESC_MIN:
                err(fn, f"description is {len(d)} chars (too short)")
            elif not (DESC_TARGET[0] <= len(d) <= DESC_TARGET[1]):
                warn(fn, f"description is {len(d)} chars (target {DESC_TARGET[0]}-{DESC_TARGET[1]})")
            descs[d].append(fn)

        # Canonical
        cm = re.findall(r'<link\s+rel="canonical"\s+href="([^"]*)"', head, re.I)
        if not cm:
            err(fn, "missing canonical URL")
        else:
            if len(cm) > 1:
                err(fn, "more than one canonical URL")
            if not cm[0].startswith(ORIGIN + "/"):
                err(fn, f"canonical is not on {ORIGIN}: {cm[0]}")
            elif cm[0] != page_url(fn) and not is_noindex:
                warn(fn, f"canonical {cm[0]} differs from page URL {page_url(fn)}")

        # OpenGraph / Twitter (indexable pages only)
        if not is_noindex:
            for key, name in [("property", "og:title"), ("property", "og:description"),
                              ("property", "og:url"), ("property", "og:type"),
                              ("property", "og:image"), ("name", "twitter:card")]:
                if not meta_values(head, key, name):
                    err(fn, f"missing {name}")
            for img in meta_values(head, "property", "og:image"):
                if not img.startswith(ORIGIN + "/"):
                    err(fn, f"og:image is not an absolute site URL: {img}")
                elif not os.path.exists(os.path.join(SITE, img[len(ORIGIN) + 1:])):
                    err(fn, f"og:image file does not exist: {img}")
            if not meta_values(head, "property", "og:image:alt"):
                warn(fn, "missing og:image:alt")

        # Encoded entities leaking into metadata (e.g. a literal "&#8212;").
        for m in re.finditer(r'<(?:title|meta[^>]*content=")([^<"]*)', head):
            once = html.unescape(m.group(1))
            if re.search(r"&(#\d+|#x[0-9a-f]+|[a-z]+);", once, re.I):
                err(fn, f"double-encoded entity in metadata: {m.group(1)[:60]}")

        # Duplicate meta tags
        names = re.findall(r'<meta\s+(?:name|property)="([^"]+)"', head, re.I)
        for name, n in Counter(names).items():
            if n > 1 and name not in ("og:image",):
                err(fn, f"duplicate meta tag: {name} x{n}")

        # JSON-LD must parse
        for block in re.findall(r'<script type="application/ld\+json">(.*?)</script>', text, re.S):
            try:
                json.loads(block)
            except ValueError as e:
                err(fn, f"invalid JSON-LD: {e}")

    for title, fns in titles.items():
        if len(fns) > 1:
            err(", ".join(fns), f"duplicate title: {title}")
    for d, fns in descs.items():
        if len(fns) > 1:
            err(", ".join(fns), "duplicate meta description")

    # Sitemap vs. pages and noindex
    sm_path = os.path.join(SITE, "sitemap.xml")
    if not os.path.exists(sm_path):
        err("sitemap.xml", "missing")
    else:
        locs = set(re.findall(r"<loc>([^<]+)</loc>", open(sm_path, encoding="utf-8").read()))
        for fn in pages:
            u = page_url(fn)
            if fn in noindex and u in locs:
                err("sitemap.xml", f"lists noindex page {u}")
            if fn not in noindex and u not in locs:
                warn("sitemap.xml", f"indexable page not listed: {u}")
        for u in locs:
            path = u[len(ORIGIN):]
            f = "index.html" if path in ("", "/") else path.lstrip("/") + ".html"
            if not os.path.exists(os.path.join(SITE, f)):
                err("sitemap.xml", f"URL has no page: {u}")

    for w in warnings:
        print("WARN ", w)
    for e in errors:
        print("ERROR", e)
    print(f"\n{len(pages)} pages checked: {len(errors)} errors, {len(warnings)} warnings")
    return 1 if errors or (strict and warnings) else 0


if __name__ == "__main__":
    sys.exit(main())
