#!/usr/bin/env python3
"""Static site generator for Sacred Forge Systems.

Renders every page from shared head/header/footer templates so navigation,
branding and styling stay identical across the site. Output is plain static
HTML committed alongside this script — no runtime build needed to deploy.

    python3 build.py        # writes all pages into this folder
"""
import os, datetime, urllib.parse

ROOT = os.path.dirname(os.path.abspath(__file__))
SITE = "https://www.sacredforgesystems.com"
EMAIL = "hello@sacredforgesystems.com"
PHONE = "(555) 123-4567"          # placeholder — replace before launch
BOOK  = "https://cal.com/sacredforge"  # placeholder scheduling link

# ---------------------------------------------------------------- icons
_I = {
 "web":'<rect x="3" y="4" width="18" height="14" rx="2"/><path d="M3 9h18M8 21h8"/>',
 "software":'<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>',
 "mobile":'<rect x="6" y="2" width="12" height="20" rx="3"/><path d="M11 18h2"/>',
 "ai":'<path d="M12 3l1.7 4.3L18 9l-4.3 1.7L12 15l-1.7-4.3L6 9l4.3-1.7z"/><path d="M18.5 14l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z"/>',
 "branding":'<path d="M12 2a10 10 0 1 0 2 19.8c1-.2 1.4-1.4.8-2.3-.5-.8-.1-1.9.9-2h1.3A6 6 0 0 0 22 11c0-5-4.5-9-10-9z"/><circle cx="8.5" cy="8.5" r="1.3"/><circle cx="12" cy="6.5" r="1.3"/><circle cx="15.5" cy="8.5" r="1.3"/>',
 "api":'<path d="M7 8l-4 4 4 4M17 8l4 4-4 4M14 4l-4 16"/>',
 "portal":'<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M9 9v11"/>',
 "cart":'<circle cx="9" cy="21" r="1.6"/><circle cx="18" cy="21" r="1.6"/><path d="M2 3h3l2.4 12.4a2 2 0 0 0 2 1.6h8.7a2 2 0 0 0 2-1.6L23 7H6"/>',
 "construction":'<path d="M4 18h16v3H4z"/><path d="M6 18v-4a6 6 0 0 1 12 0v4"/><path d="M12 3v4M9.5 7h5"/>',
 "engineering":'<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/>',
 "environmental":'<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.5 19 2c1 4 0 12-6 15z"/><path d="M2 22c4-4 7-6 10-7"/>',
 "healthcare":'<path d="M2 12h4l2 6 4-13 2 7h6"/>',
 "manufacturing":'<path d="M3 21V9l6 4V9l6 4V4l6 3v14z"/><path d="M3 21h18"/>',
 "professional":'<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
 "government":'<path d="M3 21h18M4 10h16M5 10l7-6 7 6M6 10v8M10 10v8M14 10v8M18 10v8"/>',
 "smallbiz":'<path d="M4 9l1.2-5h13.6L20 9M4 9h16M4 9v11h16V9M9 20v-5h6v5"/>',
 "cube":'<path d="M12 2l8 4.5v9L12 20l-8-4.5v-9z"/><path d="M4 6.5L12 11l8-4.5M12 11v9"/>',
 "secure":'<path d="M12 3l7 3v5c0 4.5-3 7.6-7 9-4-1.4-7-4.5-7-9V6z"/><path d="M9 12l2 2 4-4"/>',
 "bolt":'<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
 "layers":'<path d="M12 2l9 5-9 5-9-5z"/><path d="M3 12l9 5 9-5M3 17l9 5 9-5"/>',
 "support":'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3.5"/><path d="M5 5l4.5 4.5M14.5 14.5L19 19M19 5l-4.5 4.5M9.5 14.5L5 19"/>',
 "search":'<circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/>',
 "target":'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.2"/>',
 "design":'<path d="M4 20l5-1L20 8l-4-4L5 15z"/><path d="M13 7l4 4"/>',
 "dev":'<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 9l3 3-3 3M13 15h4"/>',
 "rocket":'<path d="M5 15c-1 3-1 5-1 5s2 0 5-1M9 15l-3-3a11 11 0 0 1 9-9c3 0 4 1 4 4a11 11 0 0 1-9 9z"/><circle cx="14.5" cy="9.5" r="1.4"/>',
 "care":'<path d="M21 12a9 9 0 1 1-3-6.7M21 4v4h-4"/>',
 "receipt":'<path d="M5 3v18l2-1 2 1 2-1 2 1 2-1 2 1V3l-2 1-2-1-2 1-2-1-2 1z"/><path d="M8 8h8M8 12h6"/>',
 "folder":'<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
 "activity":'<path d="M3 12h4l3 8 4-16 3 8h4"/>',
 "chat":'<path d="M21 15a2 2 0 0 1-2 2H8l-4 4V5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2z"/>',
 "doc":'<path d="M6 2h8l4 4v16H6z"/><path d="M14 2v4h4M9 13h6M9 17h6"/>',
 "calendar":'<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M3 9h18M8 2v4M16 2v4"/>',
 "phone":'<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2 4.2 2 2 0 0 1 4 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.2a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.7.7A2 2 0 0 1 22 16.9z"/>',
 "mail":'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
 "clock":'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
 "bot":'<rect x="4" y="8" width="16" height="12" rx="3"/><path d="M12 8V4M8 2h8M9.5 14h.01M14.5 14h.01M4 13H2M22 13h-2"/>',
 "dashboard":'<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>',
 "chart":'<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M8 17V9M12 17V6M16 17v-4"/>',
}
def ic(name, size=24, sw=1.9):
    return (f'<svg width="{size}" height="{size}" viewBox="0 0 24 24" fill="none" '
            f'stroke="currentColor" stroke-width="{sw}" stroke-linecap="round" '
            f'stroke-linejoin="round" aria-hidden="true">{_I[name]}</svg>')

CHK = ('<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" '
       'stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>')
ARROW = '<span class="arrow">→</span>'

# Brand mark: the Sacred Forge emblem — gold atom + cross inside a targeting
# ring — lives in assets/logo-mark.svg (metallic gradients, glowing nucleus) so
# it stays crisp at every size and also serves as the favicon. Accent #E6B422.
AMBER = "#E6B422"
LOGO = '<img class="logo" src="/assets/logo-mark.svg" alt="Sacred Forge" width="34" height="34">'
FAVICON = "/assets/logo-mark.svg"
# Two-tone wordmark lockup used beside the emblem, matching the logo artwork.
BRAND_TX = ('<span class="brand-tx"><span class="wordmark">SACRED<span class="wf">FORGE</span></span>'
            '<small>We Forge Digital Solutions.</small></span>')

# --------------------------------------------------------------- helpers
def ticks(items):
    return '<ul class="ticks">' + ''.join(f'<li>{CHK}{t}</li>' for t in items) + '</ul>'

def tags(items):
    return '<ul class="tags">' + ''.join(f'<li>{t}</li>' for t in items) + '</ul>'

def sec_head(eyebrow, h2, p="", center=False, inner=""):
    c = " center" if center else ""
    p = f'<p>{p}</p>' if p else ""
    return f'<div class="sec-head{c}"><span class="eyebrow">{eyebrow}</span><h2>{h2}</h2>{p}{inner}</div>'

def card(icon, title, body, href=None, more=None, ticks_items=None, tag=None):
    inner = f'<span class="ic">{ic(icon)}</span><h3>{title}</h3><p>{body}</p>'
    if ticks_items: inner += ticks(ticks_items)
    if more and href: inner += f'<span class="more">{more} →</span>'
    tg = f'<span class="tag{tag[1]}">{tag[0]}</span>' if tag else ''
    if href:
        return f'<a class="card link" href="{href}">{tg}{inner}</a>'
    return f'<div class="card">{tg}{inner}</div>'

def cta_band(h2="Let's build something that lasts.",
             p="Tell us what you have in mind — a website, an app, an internal tool, or a full platform. We'll reply within one business day.",
             primary=("Start your project","/contact.html"), secondary=("View our work","/portfolio/")):
    s = f'<a href="{secondary[1]}" class="btn btn-ghost btn-lg">{secondary[0]}</a>' if secondary else ''
    return (f'<section class="sec"><div class="wrap"><div class="cta">'
            f'<span class="eyebrow">Start a build</span><h2>{h2}</h2><p>{p}</p>'
            f'<div class="hero-cta"><a href="{primary[1]}" class="btn btn-primary btn-lg">{primary[0]} {ARROW}</a>{s}</div>'
            f'</div></div></section>')

SVC_SUB = [
 ("/services/website-design.html","Website Design"),
 ("/services/custom-software.html","Custom Software"),
 ("/services/mobile-apps.html","Mobile Apps"),
 ("/services/ai-automation.html","AI &amp; Automation"),
 ("/services/branding.html","Branding"),
]
NAV = [
 ("/","Home","home"),
 ("/services/","Services","services"),
 ("/products/","Products","products"),
 ("/portfolio/","Portfolio","portfolio"),
 ("/industries/","Industries","industries"),
 ("/about.html","About","about"),
 ("/blog/","Blog","blog"),
 ("/contact.html","Contact","contact"),
]

def header(active):
    items = ""
    for href, label, key in NAV:
        cls = " active" if key == active else ""
        if key == "services":
            drop = ''.join(f'<a href="{h}">{l}</a>' for h,l in SVC_SUB)
            drop += '<a href="/services/">All services</a>'
            items += (f'<span class="has-drop"><a href="{href}" class="{cls.strip()}">{label}</a>'
                      f'<span class="drop">{drop}</span></span>')
        else:
            items += f'<a href="{href}" class="{cls.strip()}">{label}</a>'
    return (f'<header class="site"><div class="wrap nav">'
            f'<a class="brand" href="/" aria-label="Sacred Forge Systems home">{LOGO}{BRAND_TX}</a>'
            f'<nav class="nav-links" id="navLinks">{items}</nav>'
            f'<div class="nav-cta"><a href="/contact.html" class="btn btn-primary btn-sm">Start your project {ARROW}</a>'
            f'<button class="nav-toggle" id="navToggle" aria-label="Menu">'
            f'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>'
            f'</button></div></div></header>')

def footer():
    svc = ''.join(f'<a href="{h}">{l}</a>' for h,l in SVC_SUB) + '<a href="/services/">All services</a>'
    prod = ('<a href="/products/">SacredOps</a><a href="/products/">Sacred Sampling Portal</a>'
            '<a href="/products/">Proposal Builder</a><a href="/products/">All products</a>')
    comp = ('<a href="/about.html">About</a><a href="/process.html">Process</a><a href="/pricing.html">Pricing</a>'
            '<a href="/portfolio/">Portfolio</a><a href="/industries/">Industries</a><a href="/blog/">Blog</a>')
    supp = ('<a href="/contact.html">Contact</a><a href="/faq.html">FAQ</a><a href="/portal/">Client Portal</a>'
            f'<a href="mailto:{EMAIL}">{EMAIL}</a>')
    year = datetime.date.today().year
    return (f'<footer class="site"><div class="wrap"><div class="foot-grid">'
            f'<div><a class="brand" href="/" aria-label="Sacred Forge Systems home">{LOGO}{BRAND_TX}</a>'
            f'<p class="foot-about">A technology studio that designs, builds and launches websites, software, apps and AI — plus a growing line of our own products.</p></div>'
            f'<div><h4>Services</h4>{svc}</div>'
            f'<div><h4>Products</h4>{prod}</div>'
            f'<div><h4>Company</h4>{comp}</div>'
            f'<div><h4>Support</h4>{supp}</div>'
            f'</div><div class="foot-bottom"><span>&copy; {year} Sacred Forge Systems &middot; Built in the USA</span>'
            f'<button class="themetog" id="themeToggle" aria-label="Toggle theme"><span id="themeIcon">☾</span> <span id="themeLabel">Dark</span></button>'
            f'</div></div></footer>')

def page(path, title, desc, body, active=""):
    canonical = SITE + "/" + (path if path != "index.html" else "")
    html = (f'<!DOCTYPE html>\n<html lang="en" data-theme="dark">\n<head>\n'
            f'<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n'
            f'<title>{title}</title>\n<meta name="description" content="{desc}">\n'
            f'<link rel="canonical" href="{canonical}">\n'
            f'<link rel="icon" type="image/svg+xml" href="{FAVICON}">\n'
            f'<meta property="og:type" content="website">\n<meta property="og:site_name" content="Sacred Forge Systems">\n'
            f'<meta property="og:title" content="{title}">\n<meta property="og:description" content="{desc}">\n'
            f'<meta property="og:url" content="{canonical}">\n<meta name="twitter:card" content="summary_large_image">\n'
            f'<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'
            f'<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">\n'
            f'<link rel="stylesheet" href="/styles.css">\n</head>\n<body>\n'
            f'{header(active)}\n<main>\n{body}\n</main>\n{footer()}\n'
            f'<script src="/app.js"></script>\n</body>\n</html>\n')
    full = os.path.join(ROOT, path)
    os.makedirs(os.path.dirname(full), exist_ok=True)
    with open(full, "w") as f:
        f.write(html)
    return path

def phero(crumbs, eyebrow, h1, p):
    cr = ' <span>/</span> '.join(crumbs)
    return (f'<section class="phero"><div class="wrap"><nav class="crumbs">{cr}</nav>'
            f'<span class="eyebrow" style="margin-top:14px;display:block">{eyebrow}</span>'
            f'<h1>{h1}</h1><p>{p}</p></div></section>')

CRUMB_HOME = '<a href="/">Home</a>'

# ================================================================ HOME
def build_home():
    hero = f'''<section class="hero">
  <div class="grid-bg"></div>
  <div class="wrap hero-grid">
    <div>
      <span class="badge"><span class="dot"></span> A technology studio — not just a web shop</span>
      <h1>We forge <span class="grad">digital solutions</span>.</h1>
      <p class="lead">Websites, custom software, AI, and automation — engineered to help your business grow. From first sketch to launch day and beyond.</p>
      <div class="hero-cta">
        <a href="/contact.html" class="btn btn-primary btn-lg">Start your project {ARROW}</a>
        <a href="/portfolio/" class="btn btn-ghost btn-lg">View our work</a>
      </div>
      <div class="hero-meta">
        <span class="im">{ic("secure",17,2.2)}<b>Secure</b> by design</span>
        <span class="im">{ic("mobile",17,2.2)}<b>Mobile</b> first</span>
        <span class="im">{ic("cube",17,2.2)}You own <b>the code</b></span>
      </div>
    </div>
    <div>
      <div class="console" role="img" aria-label="A build pipeline showing website, software, AI and launch stages">
        <div class="console-top"><div class="lights"><i></i><i></i><i></i></div><span class="ttl">forge://build-pipeline — live</span></div>
        <div class="console-body"><div class="pipe">
          <div class="pipe-row"><span class="ic">{ic("web",18)}</span><div class="txt"><b>Website &amp; brand</b><span>design → responsive build</span></div><span class="chip ok">shipped</span></div>
          <div class="pipe-row"><span class="ic">{ic("software",18)}</span><div class="txt"><b>Custom software</b><span>portals · data · workflows</span></div><span class="chip run">building</span></div>
          <div class="pipe-row"><span class="ic">{ic("ai",18)}</span><div class="txt"><b>AI &amp; automation</b><span>agents · document parsing</span></div><span class="chip run">building</span></div>
          <div class="pipe-row"><span class="ic">{ic("rocket",18)}</span><div class="txt"><b>Launch &amp; support</b><span>deploy · monitor · iterate</span></div><span class="chip wait">queued</span></div>
        </div></div>
        <div class="console-foot"><span>uptime 99.9%</span><span>build 3.0.0 · region us-east</span></div>
      </div>
    </div>
  </div>
</section>'''

    strip = ('<div class="strip"><div class="wrap">'
             '<div class="kpi"><b>8+</b><span>Disciplines</span></div>'
             '<div class="kpi"><b>2–6 wk</b><span>Typical build</span></div>'
             '<div class="kpi"><b>100%</b><span>Code you own</span></div>'
             '<div class="kpi"><b>1</b><span>Point of contact</span></div>'
             '<div class="kpi"><b>∞</b><span>Ongoing support</span></div>'
             '</div></div>')

    svc_cards = [
      card("web","Website Design","Fast, accessible marketing sites that make you look established.","/services/website-design.html","Explore"),
      card("software","Custom Software","CRMs, portals, inventory and internal systems built around how you work.","/services/custom-software.html","Explore"),
      card("mobile","Mobile Apps","iPhone, Android and cross-platform apps your customers can install.","/services/mobile-apps.html","Explore"),
      card("ai","AI &amp; Automation","Chatbots, AI agents and workflow automation that cut the busywork.","/services/ai-automation.html","Explore"),
      card("branding","Branding","Logos, identity and style guides so every touchpoint matches.","/services/branding.html","Explore"),
      card("api","API Integrations","Connect the tools you already use — payments, CRMs, email and more.","/services/custom-software.html","Explore"),
      card("portal","Client Portals","Secure logged-in home bases for your customers and your team.","/portal/","Explore"),
      card("cart","E-Commerce","Storefronts, checkout and subscriptions wired to real fulfillment.","/services/website-design.html","Explore"),
    ]
    services = (f'<section class="sec" id="services"><div class="wrap">'
                + sec_head("What we build","Everything under one roof.",
                  "Most studios do one thing. We take you from an empty domain to a running business system — the front door, the product, and the back office.")
                + '<div class="grid g-4">' + ''.join(svc_cards) + '</div></div></section>')

    IND = [("construction","Construction"),("engineering","Engineering"),("environmental","Environmental"),
           ("healthcare","Healthcare"),("manufacturing","Manufacturing"),("professional","Professional Services"),
           ("government","Government"),("smallbiz","Small Business")]
    ind_pills = ''.join(f'<div class="pill"><span class="ic">{ic(n,18)}</span>{l}</div>' for n,l in IND)
    industries = (f'<section class="sec alt"><div class="wrap">'
                  + sec_head("Industries","Built for the work you do.",
                    "We speak more than one language. Field crews, labs, clinics and back offices each get software that fits their day.")
                  + f'<div class="pills">{ind_pills}</div>'
                  + '<div style="margin-top:24px"><a href="/industries/" class="btn btn-ghost">See all industries →</a></div>'
                  + '</div></section>')

    WHY = [("cube","Custom Built","No templates you have to bend around. Everything is built to fit your workflow."),
           ("secure","Secure by Design","Authentication, encryption and least-privilege access baked in from day one."),
           ("mobile","Mobile First","Designed for phones first, so it works everywhere your customers are."),
           ("bolt","AI Ready","Structured so you can add assistants and automation as you grow."),
           ("layers","Scalable Architecture","Proven foundations that stay fast from your first user to your ten-thousandth."),
           ("support","Ongoing Support","We don't disappear at launch — hosting, updates and iteration on a simple plan.")]
    why_cards = ''.join(card(n,t,b) for n,t,b in WHY)
    why = (f'<section class="sec"><div class="wrap">'
           + sec_head("Why Sacred Forge","Engineered to last.","")
           + f'<div class="grid g-3">{why_cards}</div></div></section>')

    PORT = [("Sacred Sampling","Environmental · Portal + Site","dashboard","/portfolio/sacred-sampling.html"),
            ("SacredOps","Operations platform","chart","/portfolio/sacredops.html"),
            ("Dashboards","Analytics &amp; reporting","dashboard","/portfolio/"),
            ("Client Portals","Secure customer areas","portal","/portal/"),
            ("Mobile Apps","iOS · Android · PWA","mobile","/services/mobile-apps.html")]
    def pcard(name, kline, icon, href):
        mock = ('<div class="thumb"><div class="mock"><div class="bar b"></div><div class="bar g"></div>'
                '<div class="row"><div class="box"></div><div class="box"></div><div class="box"></div></div></div></div>')
        return (f'<a class="pcard card link" href="{href}" style="padding:16px">{mock}'
                f'<h3>{name}</h3><div class="kline">{kline}</div></a>')
    port_cards = ''.join(pcard(*p) for p in PORT)
    portfolio = (f'<section class="sec alt"><div class="wrap">'
                 + sec_head("Portfolio","Selected work.","A look at systems we've forged — from full platforms to focused tools.")
                 + f'<div class="grid g-3">{port_cards}</div>'
                 + '<div style="margin-top:24px"><a href="/portfolio/" class="btn btn-ghost">View all projects →</a></div>'
                 + '</div></section>')

    STEPS = [("Discovery","Map your goals, users and must-haves into a fixed scope."),
             ("Strategy","Sitemap, data model and the plan of attack — before we build."),
             ("Design","Clickable designs you approve, so there are no surprises."),
             ("Development","We ship in visible increments on a live staging link."),
             ("Launch","Domains, analytics and testing — then we go live."),
             ("Support","Ongoing care, iteration and new features as you grow.")]
    step_html = ''.join(f'<div class="step"><span class="dot"></span><span class="n">0{i+1}</span><h3>{t}</h3><p>{d}</p></div>' for i,(t,d) in enumerate(STEPS))
    process = (f'<section class="sec"><div class="wrap">'
               + sec_head("Process","A clear path from idea to launch.","")
               + f'<div class="steps">{step_html}</div>'
               + '<div style="margin-top:26px"><a href="/process.html" class="btn btn-ghost">How we work →</a></div>'
               + '</div></section>')

    # placeholder testimonials — replace with real client quotes before launch
    Q = [("Sacred Forge took us from a spreadsheet mess to a real portal our whole crew actually uses. Same fixed price they quoted.","JM","Operations Lead","Environmental Services"),
         ("They built our site and our internal software as one connected system. No handoffs, no finger-pointing.","RA","Owner","Construction"),
         ("The AI intake tool alone saves our office hours every week. They understood the workflow, not just the code.","SP","Practice Manager","Healthcare")]
    q_html = ''.join(
      f'<div class="quote"><div class="stars">★★★★★</div><p>“{t}”</p>'
      f'<div class="who"><span class="av">{a}</span><div><b>{r}</b><span>{c}</span></div></div></div>' for t,a,r,c in Q)
    testi = (f'<section class="sec alt"><div class="wrap">'
             + sec_head("Testimonials","What clients say.","", center=True)
             + f'<div class="quotes">{q_html}</div></div></section>')

    body = hero + strip + services + industries + why + portfolio + process + testi + cta_band()
    page("index.html","Sacred Forge Systems — Websites, Custom Software, AI &amp; Automation",
         "Sacred Forge Systems is a technology studio building websites, custom software, mobile apps, AI and automation for businesses that want to grow. Custom-built, secure, and yours to keep.",
         body, "home")

# ================================================================ SERVICES OVERVIEW
def build_services_index():
    hero = phero([CRUMB_HOME,"Services"],"Services","Websites, software, AI — engineered together.",
                 "We design and build the full stack of digital tools a growing business needs. Explore each discipline, or bring us a problem and we'll assemble the right mix.")
    cards = [
      card("web","Website Design","Business sites, corporate sites, landing pages and membership sites that convert.","/services/website-design.html","Explore"),
      card("software","Custom Software","CRMs, portals, inventory, internal systems and databases built to fit.","/services/custom-software.html","Explore"),
      card("mobile","Mobile Apps","iPhone, Android and cross-platform apps, installable and offline-ready.","/services/mobile-apps.html","Explore"),
      card("ai","AI &amp; Automation","Chatbots, internal AI, workflow automation, document processing and agents.","/services/ai-automation.html","Explore"),
      card("branding","Branding","Logos, brand identity, style guides and marketing materials.","/services/branding.html","Explore"),
      card("api","API Integrations","Wire together payments, CRMs, email, maps and the tools you already run.","/services/custom-software.html","Explore"),
      card("portal","Client Portals","Secure, logged-in areas for invoices, files, updates and messaging.","/portal/","Explore"),
      card("cart","E-Commerce","Storefronts, checkout, subscriptions and fulfillment that just work.","/services/website-design.html","Explore"),
    ]
    body = (hero + f'<section class="sec"><div class="wrap"><div class="grid g-3">'
            + ''.join(cards) + '</div></div></section>'
            + cta_band(h2="Not sure what you need?",
                       p="Tell us the problem — slow quoting, no customer portal, a clunky site — and we'll recommend the smallest thing that fixes it.",
                       secondary=("See pricing","/pricing.html")))
    page("services/index.html","Services — Sacred Forge Systems",
         "Website design, custom software, mobile apps, AI & automation, branding, API integrations, client portals and e-commerce — from Sacred Forge Systems.",
         body,"services")

# service sub-page template
def service_page(slug, title, eyebrow, h1, intro, offer_title, offers, feature_list, stack, faq_pairs):
    hero = phero([CRUMB_HOME,'<a href="/services/">Services</a>',title],eyebrow,h1,intro)
    offer_cards = ''.join(card(n,t,b) for n,t,b in offers)
    features = ticks(feature_list)
    faq = ''.join(f'<details class="qa"><summary>{q}<span class="plus"></span></summary><div class="a">{a}</div></details>' for q,a in faq_pairs)
    body = (hero
      + f'<section class="sec"><div class="wrap">' + sec_head("What we offer", offer_title, "")
      + f'<div class="grid g-3">{offer_cards}</div></div></section>'
      + f'<section class="sec alt"><div class="wrap"><div class="split">'
      + f'<div><span class="eyebrow">Included</span><h2 style="margin-top:12px">Everything you need to launch.</h2>'
      + f'<div style="margin-top:20px">{features}</div></div>'
      + f'<div class="callout"><span class="eyebrow">Typical stack</span><p style="color:var(--ink-2)">We build on proven, well-supported tools so your project is fast today and maintainable for years.</p>'
      + f'<div style="margin-top:16px">{tags(stack)}</div></div>'
      + f'</div></div></section>'
      + f'<section class="sec"><div class="wrap"><div class="sec-head center"><span class="eyebrow">FAQ</span><h2>Good to know.</h2></div>'
      + f'<div class="faq">{faq}</div></div></section>'
      + cta_band(primary=("Start your project","/contact.html"), secondary=("See pricing","/pricing.html")))
    page(f"services/{slug}.html", f"{title} — Sacred Forge Systems",
         intro.replace('"',"'")[:180], body, "services")

def build_service_pages():
    service_page("website-design","Website Design","Website Design","Websites that look like you mean business.",
      "Fast, accessible, search-friendly sites — from a one-page landing to a full corporate presence and members-only areas.",
      "From landing page to full site",
      [("web","Business &amp; Corporate Sites","Multi-page sites with the pages, proof and calls-to-action that turn visitors into leads."),
       ("bolt","Landing Pages","Single-purpose pages tuned for one campaign, one offer, one conversion."),
       ("portal","Membership Sites","Gated content, logins and subscriptions for communities and courses."),
       ("cart","E-Commerce","Storefronts and checkout wired to real fulfillment and payments.")],
      ["Custom design system &amp; copy help","SEO, analytics &amp; speed built in","Mobile-first, accessible layouts",
       "Edit-it-yourself content","Contact &amp; lead capture","Hosting &amp; SSL set up for you"],
      ["Next.js / React","Static HTML/CSS","Headless CMS","Stripe","Vercel","Analytics"],
      [("How long does a website take?","Most marketing sites go live in about two weeks once we have your content and brand direction."),
       ("Can I edit it myself?","Yes. We wire up a simple editor for the parts you'll want to change, and hand over the rest."),
       ("Do you do SEO?","On-page SEO — structure, metadata, speed and semantics — is included. Ongoing content strategy is optional.")])

    service_page("custom-software","Custom Software","Custom Software","Software shaped around how you actually work.",
      "CRMs, portals, inventory and internal systems — the tools spreadsheets and off-the-shelf apps can't quite cover.",
      "Internal tools &amp; platforms",
      [("dashboard","CRMs &amp; Pipelines","Track leads, jobs and customers the way your team already thinks about them."),
       ("portal","Portals","Customer and staff portals with role-based access, documents and status flows."),
       ("cube","Inventory &amp; Assets","Know what you have, where it is and what it's worth — in real time."),
       ("software","Internal Systems &amp; Databases","Replace the fragile spreadsheet everyone's afraid to touch.")],
      ["Role-based accounts &amp; permissions","Reporting &amp; dashboards","Document &amp; PDF generation",
       "Integrations with your existing tools","Audit trails &amp; data export","Built to scale as you grow"],
      ["Next.js / React","Node &amp; Edge","PostgreSQL","REST / APIs","Auth &amp; sessions","Vercel"],
      [("Can you connect to our existing tools?","Usually yes — if it has an API or exports data, we can integrate it (payments, CRMs, accounting, email)."),
       ("Do we own the software?","Completely. The code lives in your repository and the accounts are in your name."),
       ("Can you take over an existing system?","Often. We'll audit it, tell you honestly whether to improve or rebuild, and give you a plan.")])

    service_page("mobile-apps","Mobile Apps","Mobile Apps","Apps your customers can hold in their hand.",
      "Native and cross-platform apps for iPhone and Android — plus installable web apps when that's the smarter, cheaper path.",
      "Native &amp; cross-platform",
      [("mobile","iPhone (iOS)","Polished, App Store–ready experiences that feel at home on Apple devices."),
       ("mobile","Android","Fast, reliable apps for the world's most widely-used platform."),
       ("layers","Cross-Platform","One codebase, both stores — the pragmatic choice for most projects."),
       ("portal","Installable Web Apps (PWA)","App-like experiences with no store, offline-ready and instantly updated.")],
      ["Offline-ready &amp; fast","Push notifications","Secure login &amp; accounts",
       "Camera, GPS &amp; device features","App Store &amp; Play Store submission","Backed by your web platform"],
      ["React Native","PWA","Expo","Push / notifications","Offline sync","App Store / Play"],
      [("Native or cross-platform?","For most businesses, cross-platform gives you both stores for close to the cost of one. We'll advise based on your needs."),
       ("Do I need a separate backend?","We can build the app and the server together, so your data and logic live in one connected system."),
       ("Can it be a web app instead?","Often a PWA does everything you need without the store overhead — we'll tell you when that's the better call.")])

    service_page("ai-automation","AI &amp; Automation","AI &amp; Automation","Put the busywork on autopilot.",
      "Chatbots, internal AI, document processing and agents — practical automation wired into the tools you already use.",
      "Practical AI, not hype",
      [("chat","Chatbots &amp; Assistants","Answer customers and staff instantly, grounded in your own content and data."),
       ("bot","Internal AI &amp; Agents","Agents that draft, summarize, triage and take action across your systems."),
       ("activity","Workflow Automation","Connect apps so hand-offs, alerts and updates happen without anyone lifting a finger."),
       ("doc","Document Processing","Turn PDFs, forms and emails into structured, searchable data automatically.")],
      ["Grounded in your own data","Human-in-the-loop where it matters","Connects to your existing tools",
       "Cost controls &amp; guardrails","Private &amp; secure by default","Measurable time saved"],
      ["LLM APIs","Retrieval (RAG)","Workflow engines","Webhooks","Vector search","Queues"],
      [("Is my data safe with AI features?","Yes — we design for privacy, keep your data in your control, and add guardrails so the system stays on-task."),
       ("Will AI replace my staff?","Our goal is to remove drudgery, not people — freeing your team for the work that needs judgment."),
       ("How do we know it's worth it?","We target a specific, measurable bottleneck first, so you can see the time saved before expanding.")])

    service_page("branding","Branding","Branding","A brand that looks as sharp as your work.",
      "Logos, identity systems and style guides so every touchpoint — site, app, proposal, truck — feels like the same company.",
      "Identity, end to end",
      [("branding","Logos","A distinctive, versatile mark that works from a favicon to a billboard."),
       ("design","Brand Identity","Color, type and voice — a coherent system, not a one-off graphic."),
       ("doc","Style Guides","Clear rules so your brand stays consistent no matter who's using it."),
       ("web","Marketing Materials","Decks, one-pagers, social templates and print, all on-brand.")],
      ["Logo suite &amp; variations","Color &amp; type system","Voice &amp; messaging guidance",
       "Reusable templates","Delivered in every format you need","Ready to hand to any designer"],
      ["Logo suite","Color &amp; type","Style guide","Templates","Print-ready","Social kit"],
      [("Do I need a full rebrand?","Not always. Sometimes a refresh and a proper style guide is all it takes — we'll tell you straight."),
       ("Will the brand work on my website?","That's the point — we design identity and interface together so they never fight each other."),
       ("What do I get at the end?","Source files, exports in every format, and a style guide so anyone can use the brand correctly.")])

# ================================================================ PRODUCTS
def build_products():
    hero = phero([CRUMB_HOME,"Products"],"Products","We build our own software, too.",
      "Beyond client work, Sacred Forge develops productized platforms and tools — some in daily use, others on the roadmap. It's why we think like a technology company, not a freelancer.")
    P = [
      ("chart","SacredOps","Live","An operations platform for running projects, crews and jobs — scheduling, status, documents and reporting in one place.",""),
      ("dashboard","Sacred Sampling Portal","In use","The customer + lab portal behind Sacred Sampling Solutions: kit activation, chain-of-custody, results and training.","/portfolio/sacred-sampling.html"),
      ("doc","Proposal Builder","Beta","Assemble branded proposals and quotes from reusable blocks — send, track and win faster.",""),
      ("secure","Safety Software","In dev","Toolbox talks, incident reports and compliance records for field-heavy teams.",""),
      ("mobile","Inspection Apps","In dev","Mobile-first inspection and checklist apps with photos, GPS and instant PDF reports.",""),
      ("bot","AI Assistants","In dev","Domain-trained assistants that answer questions and draft documents from your own data.",""),
      ("construction","Construction Tools","Planned","Estimating, daily logs and job tracking purpose-built for the trades.",""),
      ("environmental","Environmental Calculators","Planned","Fast, defensible calculators for sampling, limits and reporting workflows.",""),
    ]
    def prod_card(icon,name,status,body,href):
        cls = " soon" if status in ("In dev","Planned","Beta") else ""
        tg = (status, cls)
        return card(icon, name, body, href or None, ("Read the case study" if href else None), None, tg)
    cards = ''.join(prod_card(*p) for p in P)
    body = (hero + '<section class="sec"><div class="wrap"><div class="grid g-3">' + cards + '</div>'
            + '<p class="note" style="margin-top:22px">Status labels are indicative — roadmap items are shaped by the clients and partners we build them with.</p>'
            + '</div></section>'
            + cta_band(h2="Want early access — or a product of your own?",
                p="We partner with operators who know a niche cold and want software to match. If that's you, let's talk.",
                secondary=("View portfolio","/portfolio/")))
    page("products/index.html","Products — SacredOps, Sacred Sampling &amp; more — Sacred Forge Systems",
         "Sacred Forge Systems builds its own products: SacredOps operations platform, the Sacred Sampling portal, Proposal Builder, safety and inspection apps, AI assistants and industry tools.",
         body,"products")

# ================================================================ PORTFOLIO
def build_portfolio():
    hero = phero([CRUMB_HOME,"Portfolio"],"Portfolio","Systems we've forged.",
      "From full platforms to focused tools — a look at what we build and the problems it solves.")
    PROJ = [
      ("Sacred Sampling Solutions","Environmental · Site + Portal + Lab","dashboard","/portfolio/sacred-sampling.html",
        "A certified water-testing company with no software — now a full command system from storefront to signed report."),
      ("SacredOps","Operations Platform","chart","/portfolio/sacredops.html",
        "One place to run projects, crews and jobs — scheduling, status, documents and reporting."),
      ("Analytics Dashboards","Reporting &amp; BI","dashboard","/contact.html",
        "Live dashboards that turn scattered data into decisions leaders actually trust."),
      ("Client Portals","Secure Customer Areas","portal","/portal/",
        "Logged-in areas for invoices, files, updates and messaging — branded to each client."),
      ("Mobile Apps","iOS · Android · PWA","mobile","/services/mobile-apps.html",
        "Field and customer apps with offline support, photos, GPS and instant reports."),
      ("API Integrations","Connected Systems","api","/services/custom-software.html",
        "Payments, CRMs, mapping and email stitched into one system that stays in sync."),
    ]
    def big(name, kline, icon, href, blurb):
        mock = ('<div class="thumb"><div class="mock"><div class="bar b"></div><div class="bar g"></div>'
                '<div class="row"><div class="box"></div><div class="box"></div><div class="box"></div></div></div></div>')
        return (f'<a class="pcard card link" href="{href}" style="padding:16px">{mock}'
                f'<div class="kline" style="margin-top:14px">{kline}</div><h3 style="margin:6px 0">{name}</h3>'
                f'<p style="color:var(--ink-2);font-size:.92rem">{blurb}</p></a>')
    grid = ''.join(big(*p) for p in PROJ)
    body = (hero + '<section class="sec"><div class="wrap"><div class="grid g-3">' + grid + '</div></div></section>'
            + cta_band(secondary=("Our process","/process.html")))
    page("portfolio/index.html","Portfolio — Sacred Forge Systems",
         "Selected work from Sacred Forge Systems: Sacred Sampling Solutions, SacredOps, dashboards, client portals, mobile apps and API integrations.",
         body,"portfolio")

def case_study(slug, title, sub, problem, solution, tech, results, screens):
    hero = phero([CRUMB_HOME,'<a href="/portfolio/">Portfolio</a>',title],"Case study",title,sub)
    def block(h,items_or_p,as_list=True):
        if as_list:
            return f'<h3>{h}</h3>{ticks(items_or_p)}'
        return f'<h3>{h}</h3><p style="color:var(--ink-2)">{items_or_p}</p>'
    mock = ''.join('<div class="thumb"><div class="mock"><div class="bar b"></div><div class="bar g"></div>'
                   '<div class="row"><div class="box"></div><div class="box"></div><div class="box"></div></div></div></div>'
                   for _ in range(screens))
    results_html = ''.join(f'<div class="metric"><b>{b}</b><span>{s}</span></div>' for b,s in results)
    body = (hero
      + '<section class="sec"><div class="wrap"><div class="split">'
      + f'<div class="prose">{block("The problem",problem,False)}{block("Our solution",solution,True)}</div>'
      + f'<div><div class="callout"><span class="eyebrow">Results</span><div style="display:flex;flex-direction:column;gap:14px;margin-top:14px">{results_html}</div></div>'
      + f'<div class="callout" style="margin-top:18px"><span class="eyebrow">Technology</span><div style="margin-top:14px">{tags(tech)}</div></div></div>'
      + '</div></div></section>'
      + '<section class="sec alt"><div class="wrap">' + sec_head("Screens","A look inside.","")
      + f'<div class="grid g-3">{mock}</div>'
      + '<p class="note" style="margin-top:16px">Representative interface mockups — swap in real screenshots before launch.</p>'
      + '</div></section>'
      + cta_band(h2="Have a project like this?", secondary=("All projects","/portfolio/")))
    page(f"portfolio/{slug}.html", f"{title} — Case Study — Sacred Forge Systems", sub.replace('"',"'")[:180], body, "portfolio")

def build_case_studies():
    case_study("sacred-sampling","Sacred Sampling Solutions",
      "A certified mail-in water & contaminant testing company needed a storefront, a customer app and a lab back office — all connected.",
      "Sacred Sampling had a real testing service and no software. Customers had no way to activate kits, chain-of-custody was paper, and results were emailed by hand. Nothing connected the storefront to the lab.",
      ["A marketing site that explains the kits and drives orders",
       "A customer portal for kit activation, sample registration and results",
       "Automated chain-of-custody document generation",
       "Training gates so customers collect samples correctly",
       "A lab intake dashboard for the team on the other side",
       "One continuous system from “shop now” to “signed report”"],
      ["Next.js","React","PostgreSQL","Server Actions","PDF generation","Vercel"],
      [("3-in-1","Website + portal + lab tools, one build"),("End-to-end","Storefront through signed report"),("Self-serve","Customers activate &amp; track kits")],
      3)
    case_study("sacredops","SacredOps",
      "An operations platform to run projects, crews and jobs — replacing scattered spreadsheets and group texts.",
      "Growing service businesses run on spreadsheets, whiteboards and group texts. Nobody has one view of what's scheduled, what's done, and what's owed — so things slip through the cracks.",
      ["A single dashboard for projects, crews and jobs",
       "Scheduling and status that update in real time",
       "Documents, photos and reports attached to each job",
       "Role-based access for office, field and clients",
       "Reporting that turns activity into decisions",
       "Built to add modules as the business grows"],
      ["Next.js","React","PostgreSQL","Auth &amp; roles","REST APIs","Vercel"],
      [("1 view","Projects, crews &amp; jobs together"),("Real-time","Status everyone can trust"),("Modular","Grows with the business")],
      3)

# ================================================================ INDUSTRIES
def build_industries():
    hero = phero([CRUMB_HOME,"Industries"],"Industries","Software that speaks your language.",
      "We don't just build websites. We build the systems specific industries run on — shaped by how the work actually happens in the field, the lab and the back office.")
    IND = [
      ("construction","Construction","Estimating, daily logs, job tracking and crew scheduling — plus safety and inspection tools for the field."),
      ("engineering","Engineering","Project portals, document control and calculators that keep technical work organized and defensible."),
      ("environmental","Environmental","Sampling workflows, chain-of-custody, lab portals and reporting — like the Sacred Sampling platform we built."),
      ("healthcare","Healthcare","Intake, scheduling and secure patient-facing tools designed with privacy first."),
      ("manufacturing","Manufacturing","Inventory, work orders and floor dashboards that connect the shop to the office."),
      ("professional","Professional Services","CRMs, proposals, client portals and billing for firms that sell expertise."),
      ("government","Government","Accessible, secure public-facing sites and internal systems that meet the bar."),
      ("smallbiz","Small Business","Sharp websites, booking, e-commerce and automation — enterprise polish at a small-business budget."),
    ]
    cards = ''.join(card(n,t,b) for n,t,b in IND)
    body = (hero + '<section class="sec"><div class="wrap"><div class="grid g-3">' + cards + '</div></div></section>'
            + cta_band(h2="Don't see your industry?",
                p="If your business runs on process, we can build the software for it. Tell us how the work flows and we'll map the tools.",
                secondary=("View our work","/portfolio/")))
    page("industries/index.html","Industries — Sacred Forge Systems",
         "Sacred Forge Systems builds websites and custom software for construction, engineering, environmental, healthcare, manufacturing, professional services, government and small business.",
         body,"industries")

# ================================================================ ABOUT
def build_about():
    hero = phero([CRUMB_HOME,"About"],"About","A technology company that builds to last.",
      "Sacred Forge Systems designs, builds and launches digital tools — and develops its own products. We work like a partner, not a vendor.")
    body = (hero
      + '<section class="sec"><div class="wrap"><div class="split">'
      + '<div class="prose"><span class="eyebrow">Mission</span><h2 style="margin:12px 0 16px">Forge software that outlasts the invoice.</h2>'
      + '<p>Too much software is rented, brittle and built to lock you in. We do the opposite: custom systems you own outright, built on proven foundations, designed to still be serving you years from now.</p>'
      + '<p>We take businesses from an empty domain to a running system — the website, the product and the back office — without the hand-offs and finger-pointing that come from stitching five vendors together.</p>'
      + '<h3>Our background</h3><p>Sacred Forge grew out of building real operational software for real businesses — including the Sacred Sampling platform and the SacredOps operations suite. That product mindset shapes every client project: we build tools meant to be used every day, not demos that impress once.</p>'
      + '<p class="note">(Personalize this section with the founder\'s story before launch.)</p></div>'
      + '<div><div class="callout"><span class="eyebrow">Why Sacred Forge</span>'
      + ticks(["One partner for site, software, apps and AI","Fixed scope and fixed price — no surprise invoices",
               "You own the code and the accounts","Built secure, mobile-first and ready to scale",
               "We stay on after launch to help it grow"]) + '</div>'
      + '<div class="callout" style="margin-top:18px"><span class="eyebrow">Values</span>'
      + ticks(["Craft over shortcuts","Honesty over upsells","Ownership over lock-in","Durability over trends"]) + '</div></div>'
      + '</div></div></section>'
      + cta_band(secondary=("Our process","/process.html")))
    page("about.html","About — Sacred Forge Systems",
         "Sacred Forge Systems is a technology studio that designs, builds and launches durable software — and develops its own products. Custom-built, secure, and yours to keep.",
         body,"about")

# ================================================================ PROCESS
def build_process():
    hero = phero([CRUMB_HOME,"Process"],"Process","How a project actually works.",
      "No mystery, no month-long silences. Here's exactly how we go from your first message to a live system you own.")
    STEPS = [
     ("Discovery","We map your goals, users and must-haves, then turn them into a fixed scope and a flat quote. No guessing, no open-ended meter."),
     ("Strategy","Sitemap, data model and technical plan. We decide what to build, what to integrate and what to leave out — before writing code."),
     ("Design","Clickable designs you review and approve. You see and shape the product before it's built, so launch holds no surprises."),
     ("Development","We build in visible increments on a live staging link you can watch the whole way. You're never wondering where things stand."),
     ("Launch","Domains, analytics, testing and a final review — then we go live and hand you the keys, the code and the accounts."),
     ("Support","Hosting, monitoring, updates and new features on a simple plan. We stay on to help the system grow with your business."),
    ]
    step_html = ''.join(f'<div class="step"><span class="dot"></span><span class="n">Step 0{i+1}</span><h3>{t}</h3><p>{d}</p></div>' for i,(t,d) in enumerate(STEPS))
    body = (hero
      + f'<section class="sec"><div class="wrap"><div class="steps">{step_html}</div></div></section>'
      + '<section class="sec alt"><div class="wrap"><div class="split">'
      + '<div class="callout"><span class="eyebrow">What you always get</span>'
      + ticks(["A fixed scope and flat price","A live staging link from day one","Weekly, plain-English updates",
               "Full ownership of code and accounts","A real person as your point of contact"]) + '</div>'
      + '<div class="callout"><span class="eyebrow">What we ask of you</span>'
      + ticks(["A short kickoff call","Your brand assets and content (or help creating them)","Timely feedback at each review",
               "One decision-maker to sign off","Honesty about what's working"]) + '</div>'
      + '</div></div></section>'
      + cta_band(secondary=("See pricing","/pricing.html")))
    page("process.html","Process — How We Work — Sacred Forge Systems",
         "How Sacred Forge Systems runs a project: Discovery, Strategy, Design, Development, Launch and Support — fixed scope, fixed price, and code you own.",
         body,"")

# ================================================================ PRICING
def build_pricing():
    hero = phero([CRUMB_HOME,"Pricing"],"Pricing","Honest bands, not a black box.",
      "Every project is scoped and quoted as a flat price after a short discovery call. These bands show where most projects land so you can plan.")
    PLANS = [
      ("Starter Website","From $2,500","A polished presence that makes a small business look established.",
        ["Up to ~5 designed pages","Mobile-first &amp; accessible","Contact &amp; lead capture","Basic SEO &amp; analytics","Live in ~2 weeks"], False),
      ("Professional Website","From $6,000","A larger site with the content, integrations and polish a growing brand needs.",
        ["10+ pages or CMS","Copy &amp; content help","E-commerce or memberships","Integrations &amp; automation","Advanced SEO setup"], True),
      ("Enterprise Platform","From $18,000","Custom software, portals or apps — a real system, not a brochure.",
        ["Custom app or portal","Accounts, roles &amp; data","APIs &amp; integrations","AI &amp; automation options","Built to scale"], False),
      ("Custom Quote","Let's talk","Multi-phase products, ongoing partnerships and everything in between.",
        ["Discovery workshop","Phased roadmap","Dedicated build team","Ongoing support plan","Priced to fit"], False),
    ]
    def plan(name,price,who,feats,pop):
        cls = " pop" if pop else ""
        tg = '<span class="poptag">Most popular</span>' if pop else ''
        lis = ''.join(f'<li>{CHK}{f}</li>' for f in feats)
        btn = "btn-primary" if pop else "btn-ghost"
        return (f'<div class="plan{cls}">{tg}<h3>{name}</h3><div class="price">{price}</div><p class="who">{who}</p>'
                f'<ul>{lis}</ul><a href="/contact.html" class="btn {btn} btn-block" style="width:100%">Get a quote</a></div>')
    plans = ''.join(plan(*p) for p in PLANS)
    body = (hero
      + f'<section class="sec"><div class="wrap"><div class="plans">{plans}</div>'
      + '<p class="note" style="margin-top:22px">Ongoing hosting, care and iteration are available from $500/mo. Every project is quoted flat — you approve the price before we start.</p>'
      + '</div></section>'
      + '<section class="sec alt"><div class="wrap"><div class="sec-head center"><span class="eyebrow">FAQ</span><h2>Pricing questions.</h2></div><div class="faq">'
      + ''.join(f'<details class="qa"><summary>{q}<span class="plus"></span></summary><div class="a">{a}</div></details>' for q,a in [
          ("Why not list exact prices?","Because honest software pricing depends on scope. We quote a firm flat price after a short call — no bait-and-switch."),
          ("Are there ongoing costs?","Hosting and care start around $500/mo and are optional. Third-party services (domains, email, some APIs) are billed at cost."),
          ("Do you offer payment plans?","Yes — most projects are split into milestone payments tied to progress you can see."),
        ]) + '</div></div></section>'
      + cta_band(h2="Ready for a real number?", secondary=("How we work","/process.html")))
    page("pricing.html","Pricing — Sacred Forge Systems",
         "Sacred Forge Systems pricing bands: Starter Website, Professional Website, Enterprise Platform and Custom Quote — flat-priced after a short discovery call.",
         body,"")

# ================================================================ BLOG
BLOG_POSTS = [
  ("ai-for-small-business","AI","Practical AI for small businesses (that isn't hype)","2026-07-28",
   "Where AI actually saves time for a small team — and where it just adds noise.",
   ["Most small businesses don't need a chatbot on their homepage. They need the boring wins: drafting the same three emails, pulling data out of PDFs, triaging the inbox.",
    "Start with one measurable bottleneck. Automate it. Measure the hours saved. Then decide whether to expand — not before.",
    "The goal isn't to replace judgment. It's to clear the busywork so your people spend their time where judgment actually matters."]),
  ("own-your-code","Business Technology","Why you should own your code","2026-07-14",
   "Rented software feels cheaper — until you want to leave. Here's the case for ownership.",
   ["When your software lives on someone else's platform, your business does too. Prices change, features vanish, and migrating is a nightmare by design.",
    "Owning the code means the repository, the domain and the accounts are in your name. You can host it anywhere, hire anyone to work on it, and never get held hostage by a renewal email.",
    "Custom isn't always more expensive over the life of a system. It's often the cheaper path once you count the subscriptions you never stop paying."]),
  ("secure-by-design","Cybersecurity","Secure by design, not as an afterthought","2026-06-30",
   "Security bolted on at the end is expensive and leaky. Baked in, it's just how the system works.",
   ["Authentication, encryption and least-privilege access aren't features you add later — they're decisions you make on day one, in the data model itself.",
    "The cheapest breach is the one the architecture makes impossible. That's why we default to secure patterns even when a project doesn't ask for them.",
    "Good security is invisible to your users and boring to your engineers. That's the goal."]),
  ("field-software","Construction Technology","Software that survives the job site","2026-06-16",
   "Field tools fail when they assume perfect signal and clean hands. Design for the real world.",
   ["The best inspection app is useless if it needs five bars and two hands. Field software has to work offline, in gloves, in the sun.",
    "Capture first, sync later. Big tap targets. Photos and GPS by default. A PDF the office can actually use.",
    "Build for the crew, not the demo. If the people in the field won't use it, nothing else matters."]),
]
def build_blog():
    hero = phero([CRUMB_HOME,"Blog"],"Blog","Notes from the forge.",
      "Practical takes on AI, web development, cybersecurity and the technology behind the businesses we build for.")
    def post_card(slug,cat,title,date,excerpt,live=True):
        cover = f'<div class="cover">{ic("doc",30,1.6)}</div>'
        inner = (f'{cover}<div class="body"><span class="cat">{cat}</span><h3>{title}</h3>'
                 f'<p>{excerpt}</p><span class="meta">{date}</span></div>')
        if live:
            return f'<a class="post" href="/blog/{slug}.html">{inner}</a>'
        return f'<div class="post" style="opacity:.7">{cover}<div class="body"><span class="cat">{cat}</span><h3>{title}</h3><p>{excerpt}</p><span class="meta">Coming soon</span></div></div>'
    live_cards = ''.join(post_card(s,c,t,d,e) for s,c,t,d,e,_ in BLOG_POSTS)
    soon = [("Environmental Technology","Chain-of-custody without the paper"),
            ("Software Tips","The spreadsheet you should turn into an app"),
            ("Web Development","Speed is a feature: why we obsess over load time")]
    soon_cards = ''.join(post_card("",c,t,"","A short, practical read — publishing soon.",False) for c,t in soon)
    body = (hero + '<section class="sec"><div class="wrap"><div class="posts">' + live_cards + soon_cards + '</div></div></section>'
            + cta_band(h2="Want this kind of thinking on your project?", secondary=("Our services","/services/")))
    page("blog/index.html","Blog — Sacred Forge Systems",
         "The Sacred Forge Systems blog: practical writing on AI, web development, cybersecurity, business technology and building software for the trades.",
         body,"blog")
    # individual posts
    for slug,cat,title,date,excerpt,paras in BLOG_POSTS:
        ph = phero([CRUMB_HOME,'<a href="/blog/">Blog</a>',cat],cat,title,excerpt)
        art = ''.join(f'<p style="color:var(--ink-2);margin-bottom:18px">{p}</p>' for p in paras)
        b = (ph + '<section class="sec"><div class="wrap" style="max-width:760px">'
             + f'<div class="prose">{art}</div>'
             + f'<p class="meta note" style="margin-top:24px">Published {date} · Sacred Forge Systems</p>'
             + '</div></section>'
             + cta_band(h2="Have a project in mind?", secondary=("Read more","/blog/")))
        page(f"blog/{slug}.html", f"{title} — Sacred Forge Systems", excerpt.replace('"',"'")[:180], b, "blog")

# ================================================================ FAQ
def build_faq():
    hero = phero([CRUMB_HOME,"FAQ"],"FAQ","Questions, answered.",
      "The things people ask before starting a project. Don't see yours? Just ask.")
    QA = [
      ("How long does a project take?","A marketing site is typically live in about two weeks. A full app or portal runs about four to six weeks depending on scope. You'll get a firm timeline with your fixed quote."),
      ("How does pricing work?","We scope the work up front and quote one flat price — no hourly meter, no surprise invoices. See the pricing page for typical bands, and we confirm an exact number after a short call."),
      ("Do you handle hosting?","Yes. We set up fast, secure hosting and can manage it for you on a simple monthly plan, or hand it over if you'd rather run it yourself."),
      ("What about maintenance?","Optional care plans cover hosting, updates, monitoring and a set of feature hours each month. It's month-to-month — no long contracts."),
      ("Can you redesign an existing site or app?","Often, yes. We'll audit what you have, tell you honestly whether to improve or rebuild, and give you a plan either way."),
      ("Who owns the code?","You do — completely. The code lives in your repository and the domain and accounts are in your name. No lock-in, ever."),
    ]
    faq = ''.join(f'<details class="qa"><summary>{q}<span class="plus"></span></summary><div class="a">{a}</div></details>' for q,a in QA)
    body = (hero + f'<section class="sec"><div class="wrap"><div class="faq">{faq}</div></div></section>'
            + cta_band(secondary=("Contact us","/contact.html")))
    page("faq.html","FAQ — Sacred Forge Systems",
         "Frequently asked questions about working with Sacred Forge Systems: timelines, pricing, hosting, maintenance, redesigns and code ownership.",
         body,"")

# ================================================================ CONTACT
def build_contact():
    hero = phero([CRUMB_HOME,"Contact"],"Contact","Let's build something that lasts.",
      "Tell us what you have in mind. We'll reply within one business day with next steps and a rough scope — no obligation.")
    form = f'''<form class="form" id="leadForm" novalidate>
      <div class="row2">
        <div class="field"><label for="name">Name</label><input id="name" name="name" type="text" autocomplete="name" required></div>
        <div class="field"><label for="email">Email</label><input id="email" name="email" type="email" autocomplete="email" required></div>
      </div>
      <div class="row2">
        <div class="field"><label for="company">Company</label><input id="company" name="company" type="text" autocomplete="organization"></div>
        <div class="field"><label for="type">Project type</label>
          <select id="type" name="type">
            <option>Website</option><option>Custom software</option><option>Mobile app</option>
            <option>AI &amp; automation</option><option>Branding</option><option>Client portal</option>
            <option>E-commerce</option><option>Not sure yet</option>
          </select></div>
      </div>
      <div class="field"><label for="budget">Budget range</label>
        <select id="budget" name="budget">
          <option>Under $5k</option><option>$5k–$15k</option><option>$15k–$40k</option><option>$40k+</option><option>Not sure yet</option>
        </select></div>
      <div class="field"><label for="msg">What are you building?</label><textarea id="msg" name="msg" placeholder="A sentence or two is plenty to start."></textarea></div>
      <button type="submit" class="btn btn-primary btn-lg">Send it {ARROW}</button>
      <p class="note">This demo form doesn't send yet — wire it to your inbox or a form service, or just email us directly.</p>
    </form>
    <div id="formOk" style="display:none" class="callout"><span class="eyebrow">Thanks</span>
      <p style="color:var(--ink-2);margin-top:8px">Got it — this is a demo, so nothing was sent. Email <a href="mailto:{EMAIL}" style="color:var(--brand-2)">{EMAIL}</a> and we'll pick it up right away.</p></div>'''
    info = f'''<div>
      <div class="info-row"><span class="ic">{ic("mail",18)}</span><div><b>Email</b><span><a href="mailto:{EMAIL}" style="color:var(--brand-2)">{EMAIL}</a></span></div></div>
      <div class="info-row"><span class="ic">{ic("phone",18)}</span><div><b>Phone</b><span>{PHONE}</span></div></div>
      <div class="info-row"><span class="ic">{ic("calendar",18)}</span><div><b>Book a call</b><span><a href="{BOOK}" style="color:var(--brand-2)">Grab a 20-minute slot →</a></span></div></div>
      <div class="info-row"><span class="ic">{ic("clock",18)}</span><div><b>Response time</b><span>Within 1 business day</span></div></div>
      <a href="{BOOK}" class="btn btn-ghost btn-block" style="width:100%;margin-top:20px">{ic("calendar",17,2.1)} Book a discovery call</a>
      <p class="note" style="margin-top:14px">Phone and booking link are placeholders — swap in your real details.</p>
    </div>'''
    body = (hero + '<section class="sec"><div class="wrap"><div class="contact-grid">'
            + f'<div>{form}</div>{info}</div></div></section>')
    page("contact.html","Contact — Sacred Forge Systems",
         "Start a project with Sacred Forge Systems. Send us your idea, book a discovery call, or email us directly — we reply within one business day.",
         body,"contact")

# ================================================================ CLIENT PORTAL
def build_portal():
    hero = phero([CRUMB_HOME,"Client Portal"],"Client Portal","Your project, all in one place.",
      "Every Sacred Forge client gets a secure portal — invoices, files, project updates, messaging and documents, without digging through email.")
    FEAT = [("receipt","Invoices","See what's due, what's paid, and pay online — no chasing PDFs."),
            ("folder","Files","Every asset, export and deliverable, versioned and downloadable."),
            ("activity","Project Updates","Live status on where your build stands, updated as we go."),
            ("chat","Messaging","Talk to your team in one thread instead of scattered emails."),
            ("doc","Documents","Contracts, scopes and sign-offs, organized and searchable.")]
    feat_cards = ''.join(card(n,t,b) for n,t,b in FEAT)
    mock = f'''<div class="portal-shell">
      <div class="portal-side">
        <a class="on">{ic("dashboard",18,2)} Overview</a>
        <a>{ic("receipt",18,2)} Invoices</a>
        <a>{ic("folder",18,2)} Files</a>
        <a>{ic("activity",18,2)} Updates</a>
        <a>{ic("chat",18,2)} Messages</a>
        <a>{ic("doc",18,2)} Documents</a>
      </div>
      <div class="portal-main">
        <div class="prow"><b>Invoice #1042</b><span class="chip ok">paid</span></div>
        <div class="prow"><b>Design review — Round 2</b><span>due Fri</span></div>
        <div class="prow"><b>Staging build v0.8</b><span class="chip run">live</span></div>
        <div class="prow"><b>New message from your team</b><span>2h ago</span></div>
      </div>
    </div>'''
    login = f'''<div class="callout" style="max-width:420px">
      <span class="eyebrow">Client sign in</span>
      <form class="form" style="margin-top:14px" onsubmit="return false">
        <div class="field"><label for="pe">Email</label><input id="pe" type="email" placeholder="you@company.com"></div>
        <div class="field"><label for="pp">Password</label><input id="pp" type="password" placeholder="••••••••"></div>
        <button class="btn btn-primary btn-block" style="width:100%">Sign in</button>
        <p class="note">Preview only — portal access is provisioned per client at project kickoff.</p>
      </form>
    </div>'''
    body = (hero
      + '<section class="sec"><div class="wrap">' + sec_head("Inside the portal","Everything your project needs.","")
      + f'<div class="grid g-3" style="margin-bottom:34px">{feat_cards}</div>{mock}</div></section>'
      + '<section class="sec alt"><div class="wrap"><div class="split" style="align-items:center">'
      + '<div><span class="eyebrow">Access</span><h2 style="margin:12px 0 14px">Secure, and yours from day one.</h2>'
      + '<p style="color:var(--ink-2)">Your portal spins up at kickoff with role-based access for everyone who needs it. It stays available for the life of the engagement — and can graduate into a full customer portal for your own clients.</p>'
      + f'<div style="margin-top:20px"><a href="/contact.html" class="btn btn-primary">Start a project {ARROW}</a></div></div>'
      + f'{login}</div></div></section>')
    page("portal/index.html","Client Portal — Sacred Forge Systems",
         "The Sacred Forge Systems client portal: invoices, files, project updates, messaging and documents in one secure place for every client.",
         body,"")

# ================================================================ SITEMAP
def build_sitemap(paths):
    today = datetime.date.today().isoformat()
    urls = ""
    for p in paths:
        loc = SITE + "/" + (p if p != "index.html" else "")
        pr = "1.0" if p == "index.html" else "0.7"
        urls += f"  <url><loc>{loc}</loc><lastmod>{today}</lastmod><priority>{pr}</priority></url>\n"
    xml = ('<?xml version="1.0" encoding="UTF-8"?>\n'
           '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + urls + '</urlset>\n')
    with open(os.path.join(ROOT,"sitemap.xml"),"w") as f: f.write(xml)
    with open(os.path.join(ROOT,"robots.txt"),"w") as f:
        f.write(f"User-agent: *\nAllow: /\nSitemap: {SITE}/sitemap.xml\n")

# ================================================================ RUN
def main():
    build_home(); build_services_index(); build_service_pages()
    build_products(); build_portfolio(); build_case_studies()
    build_industries(); build_about(); build_process(); build_pricing()
    build_blog(); build_faq(); build_contact(); build_portal()
    # collect generated html paths for sitemap
    paths = []
    for dirpath, _, files in os.walk(ROOT):
        for fn in files:
            if fn.endswith(".html"):
                rel = os.path.relpath(os.path.join(dirpath, fn), ROOT)
                paths.append(rel.replace(os.sep, "/"))
    paths.sort(key=lambda p: (p != "index.html", p))
    build_sitemap(paths)
    print(f"Built {len(paths)} pages:")
    for p in paths: print("  " + p)

if __name__ == "__main__":
    main()
