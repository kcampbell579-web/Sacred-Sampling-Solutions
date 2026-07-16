#!/usr/bin/env python3
# Build shared header/footer + legal pages + SEO for the hosting build.
import re, os

DOMAIN = "https://www.sacredsamplingsolutions.com"
UPDATED = "July 15, 2026"
SUPPORT = "support@sacredsamplingsolutions.com"

FAVICON = ("<link rel=\"icon\" href=\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E"
"%3Crect width='100' height='100' rx='22' fill='%230E0E0E'/%3E"
"%3Cellipse cx='50' cy='30' rx='17' ry='6' fill='none' stroke='%236fb6ff' stroke-width='4'/%3E"
"%3Crect x='46' y='22' width='8' height='26' fill='%236fb6ff'/%3E%3Crect x='38' y='30' width='24' height='7' fill='%236fb6ff'/%3E"
"%3Ccircle cx='50' cy='66' r='20' fill='none' stroke='%232C94FC' stroke-width='5'/%3E"
"%3Cpath d='M50 52 C58 64 60 70 60 74 a10 10 0 1 1 -20 0 C40 70 42 64 50 52 Z' fill='%238fc4f0'/%3E%3C/svg%3E\">")

FONT = ('<link rel="preconnect" href="https://fonts.googleapis.com">'
        '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'
        '<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&display=swap" rel="stylesheet">')

def seo(title, desc, slug):
    url = DOMAIN + "/" + slug
    return f'''<link rel="canonical" href="{url}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Sacred Sampling Solutions">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{desc}">
<meta property="og:url" content="{url}">
<meta property="og:image" content="{DOMAIN}/assets/logo-color.png">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{title}">
<meta name="twitter:description" content="{desc}">
<meta name="twitter:image" content="{DOMAIN}/assets/logo-color.png">
{FONT}'''

def nav(active=""):
    def a(href, label, key):
        cls = ' class="active"' if (key and key==active) else ''
        return f'<a href="{href}"{cls}>{label}</a>'
    return f'''<header>
  <div class="wrap nav">
    <a class="brand" href="index.html" aria-label="Sacred Sampling Solutions home"><img src="assets/logo-color.png" alt="Sacred Sampling Solutions"></a>
    <nav class="nav-links" id="navLinks">
      {a("kits.html","Test Kits","kits")}
      {a("index.html#how","How It Works","")}
      {a("index.html#contaminants","What We Test","")}
      {a("quiz.html","Find My Kit","quiz")}
      {a("sampleregistration.html","Activate Kit","portal")}
    </nav>
    <div class="nav-cta">
      <a href="sampleregistration.html" class="btn btn-ghost btn-sm hide-sm">Activate kit</a>
      <a href="kits.html" class="btn btn-primary btn-sm">Shop kits</a>
      <button class="nav-toggle" id="navToggle" aria-label="Menu">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>
      </button>
    </div>
  </div>
</header>'''

FOOTER = '''<footer>
  <div class="wrap">
    <div class="foot-grid">
      <div>
        <a class="brand" href="index.html" aria-label="Sacred Sampling Solutions home"><img src="assets/logo-light.png" alt="Sacred Sampling Solutions"></a>
        <p class="foot-about">Certified laboratory environmental testing delivered to your door. Built on science, rooted in faith. Real results — no strips, no guesswork.</p>
      </div>
      <div>
        <h4>Water Kits</h4>
        <a href="kits.html#kits">Heavy Metals &middot; Metals &amp; Minerals</a>
        <a href="kits.html#kits">Essentials</a>
        <a href="kits.html#kits">Comprehensive &middot; PFAS</a>
        <a href="kits.html#kits">Professional (all-in-one)</a>
      </div>
      <div>
        <h4>Company</h4>
        <a href="index.html#how">How it works</a>
        <a href="index.html#contaminants">What we test</a>
        <a href="quiz.html">Find my kit</a>
        <a href="sampleregistration.html">Activate a kit</a>
        <a href="contact.html">Contact</a>
      </div>
      <div>
        <h4>Legal</h4>
        <a href="privacy.html">Privacy Policy</a>
        <a href="terms.html">Terms of Service</a>
        <a href="refund.html">Refund &amp; Returns</a>
        <a href="shipping.html">Shipping Policy</a>
        <a href="disclaimer.html">Disclaimer</a>
      </div>
    </div>
    <div class="foot-bottom">
      <span>&copy; 2026 Sacred Sampling Solutions LLC &middot; Assembled in the USA</span>
      <span class="mono">For informational &amp; screening purposes. Not a medical diagnosis.</span>
    </div>
  </div>
</footer>'''

APP = '''<script>
(function(){
  var t=document.getElementById('navToggle'), l=document.getElementById('navLinks');
  if(t&&l){t.addEventListener('click',function(){l.classList.toggle('open');});
    l.addEventListener('click',function(e){if(e.target.tagName==='A')l.classList.remove('open');});}
  var els=[].slice.call(document.querySelectorAll('.reveal'));
  if('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion:reduce)').matches){
    var io=new IntersectionObserver(function(en){en.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}});},{threshold:.12,rootMargin:'0px 0px -8% 0px'});
    els.forEach(function(el){if(!el.classList.contains('in'))io.observe(el);});
  } else {els.forEach(function(el){el.classList.add('in');});}
})();
</script>'''

def legal_page(slug, title, desc, h1, lead, body):
    return f'''<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title} — Sacred Sampling Solutions</title>
<meta name="description" content="{desc}">
{FAVICON}
{seo(title+" — Sacred Sampling Solutions", desc, slug)}
<link rel="stylesheet" href="styles.css">
</head>
<body>
{nav()}
<main class="legal">
  <div class="updated">Last updated · {UPDATED}</div>
  <h1>{h1}</h1>
  <p class="lead">{lead}</p>
  {body}
  <hr>
  <p>Questions about this policy? Email <a href="mailto:{SUPPORT}">{SUPPORT}</a>.</p>
</main>
{FOOTER}
<script src="app.js"></script>
</body>
</html>'''

# ---------- Legal content ----------
disclaimer_note = '<div class="callout"><p><strong>Screening use only.</strong> Sacred Sampling Solutions kits are for informational and screening purposes and are not a medical diagnosis or a substitute for professional advice.</p></div>'

PRIVACY = '''
<h2>1. Who we are</h2>
<p>Sacred Sampling Solutions LLC ("Sacred Sampling," "we," "us") provides mail-in environmental testing kits and a customer results portal at sacredsamplingsolutions.com. This Privacy Policy explains what information we collect, how we use it, and the choices you have.</p>
<h2>2. Information we collect</h2>
<ul>
<li><strong>Account information</strong> — your name, email address, password, and (optionally) a phone number for shipping and results notifications.</li>
<li><strong>Kit &amp; sample information</strong> — the unique Kit ID you activate, the sampling location (e.g., kitchen tap, well, nursery), collection date, and any context you provide about your sample.</li>
<li><strong>Results data</strong> — the laboratory analysis performed on your sample and the report we generate for you.</li>
<li><strong>Order &amp; payment information</strong> — items purchased and shipping address. Payment card details are processed by our payment provider; we do not store full card numbers.</li>
<li><strong>Usage information</strong> — basic device, browser, and analytics data collected through cookies and similar technologies.</li>
</ul>
<h2>3. How we use your information</h2>
<ul>
<li>To process orders, activate kits, and tie your physical sample to your account and the correct lab workflow.</li>
<li>To analyze your sample, generate your report, and deliver results to your secure portal.</li>
<li>To communicate order, shipping, and results notifications, and to provide customer support.</li>
<li>To operate, secure, and improve our website and portal.</li>
<li>To comply with legal obligations.</li>
</ul>
<h2>4. How we share information</h2>
<p>We do not sell your personal information. We share it only with:</p>
<ul>
<li><strong>Our accredited partner laboratory</strong>, to analyze your sample and return results.</li>
<li><strong>Shipping carriers</strong>, to deliver kits and return samples.</li>
<li><strong>Service providers</strong> (payment processing, hosting, email, analytics) who process data on our behalf.</li>
<li><strong>Authorities</strong>, where required by law or to protect our rights.</li>
</ul>
<h2>5. Cookies &amp; analytics</h2>
<p>We use cookies and similar technologies to keep you signed in, remember preferences, and understand how the site is used. You can control cookies through your browser settings.</p>
<h2>6. Data security &amp; retention</h2>
<p>We use reasonable administrative and technical safeguards to protect your information and retain it only as long as needed to provide our services and meet legal requirements. No method of transmission or storage is 100% secure.</p>
<h2>7. Your choices &amp; rights</h2>
<p>Depending on where you live, you may have the right to access, correct, delete, or receive a copy of your personal information, and to opt out of certain processing. To make a request, email <a href="mailto:'''+SUPPORT+'''">'''+SUPPORT+'''</a>.</p>
<h2>8. Children</h2>
<p>Our services are intended for adults. We do not knowingly collect personal information from children under 13.</p>
<h2>9. Changes to this policy</h2>
<p>We may update this policy from time to time. Material changes will be posted here with an updated date.</p>
'''

TERMS = '''
<h2>1. Agreement</h2>
<p>By accessing our website, purchasing a kit, or using the customer portal, you agree to these Terms of Service. If you do not agree, please do not use our services.</p>
<h2>2. Eligibility &amp; accounts</h2>
<p>You must be at least 18 years old to purchase. You are responsible for the accuracy of your account information and for keeping your password secure. You are responsible for activity under your account.</p>
<h2>3. What our kits are — and are not</h2>
'''+disclaimer_note+'''
<p>Our kits provide laboratory analysis of samples you collect at home. Results compare your sample against reference thresholds such as EPA Maximum Contaminant Levels. They are not a medical diagnosis, medical advice, or a certified inspection where one is legally required. See our <a href="disclaimer.html">Disclaimer</a>.</p>
<h2>4. Orders &amp; pricing</h2>
<p>Prices are shown at checkout and may change. We may refuse or cancel orders due to errors, suspected fraud, or availability.</p>
<h2>5. Your responsibilities when collecting a sample</h2>
<ul>
<li>Follow the included instructions and any QR-guided steps for your specific kit.</li>
<li>Collect, chill (where required), and ship your sample the same day using the prepaid label so it remains valid.</li>
<li>Provide accurate sampling context. Results depend on proper collection and handling.</li>
</ul>
<h2>6. Results</h2>
<p>Results are delivered to your secure portal after laboratory analysis. Turnaround times are estimates and may vary. We are not responsible for decisions you make based on your results.</p>
<h2>7. Shipping, returns &amp; refunds</h2>
<p>See our <a href="shipping.html">Shipping Policy</a> and <a href="refund.html">Refund &amp; Return Policy</a>.</p>
<h2>8. Intellectual property</h2>
<p>Our brand, content, reports, and interpretation guides are owned by Sacred Sampling Solutions LLC and may not be copied or resold without permission.</p>
<h2>9. Disclaimers &amp; limitation of liability</h2>
<p>Our services are provided "as is" without warranties of any kind. To the fullest extent permitted by law, Sacred Sampling Solutions LLC is not liable for indirect, incidental, or consequential damages, and our total liability is limited to the amount you paid for the applicable kit.</p>
<h2>10. Governing law</h2>
<p>These Terms are governed by the laws of the State of [Your State], without regard to conflict-of-law rules.</p>
<h2>11. Changes</h2>
<p>We may update these Terms. Continued use after changes means you accept the updated Terms.</p>
'''

REFUND = '''
<h2>Overview</h2>
<p>Because our kits involve sterile collection materials and laboratory processing, our refund policy depends on whether a kit has been activated or a sample submitted.</p>
<h2>Unopened, unused kits</h2>
<p>You may return an unopened, unused kit within <strong>30 days</strong> of delivery for a refund, less original shipping. Email <a href="mailto:'''+SUPPORT+'''">'''+SUPPORT+'''</a> to start a return. Refunds are issued to the original payment method after we receive the kit.</p>
<h2>Activated or used kits</h2>
<p>Once a kit has been activated in the portal or a sample has been shipped to the lab, it is <strong>non-refundable</strong>, because laboratory resources have been committed to your analysis.</p>
<h2>Damaged or defective kits</h2>
<p>If your kit arrives damaged or is missing components, contact us within 7 days of delivery and we will send a free replacement.</p>
<h2>Samples that can&rsquo;t be analyzed</h2>
<p>If the laboratory cannot process your sample due to an error on our side or the lab&rsquo;s side, we will provide a free replacement kit. If a sample cannot be analyzed because collection or shipping instructions were not followed (for example, a sample shipped late or without cold-chain), a replacement kit may be purchased at a discount.</p>
<h2>Order cancellations</h2>
<p>You may cancel an order for a full refund any time before it ships. Once shipped, the return policy above applies.</p>
<h2>How to request a refund or return</h2>
<p>Email <a href="mailto:'''+SUPPORT+'''">'''+SUPPORT+'''</a> with your order number and reason. We typically respond within 1&ndash;2 business days, and approved refunds post within 5&ndash;10 business days depending on your bank.</p>
'''

SHIPPING = '''
<h2>Where we ship</h2>
<p>We currently ship within the United States. We do not offer international shipping at this time.</p>
<h2>Order processing</h2>
<p>Orders are typically processed within 1&ndash;2 business days. You&rsquo;ll receive a confirmation email with tracking once your kit ships.</p>
<h2>Getting your kit</h2>
<p>Each kit arrives in a premium box with everything you need: sample containers, gloves, a cold pack where required, a QR collection guide, and a <strong>prepaid return mailer</strong>.</p>
<h2>Returning your sample</h2>
<ul>
<li>Collect your sample and place the cold pack in the insulated mailer.</li>
<li><strong>Ship the same day you collect</strong>, using the prepaid label — samples are time-sensitive and must reach the lab promptly to stay valid.</li>
<li>Where available, log or scan your return tracking number in the portal so you and our team can follow the sample&rsquo;s journey.</li>
</ul>
<h2>Lost or delayed packages</h2>
<p>If a kit or return shipment is lost or significantly delayed, contact <a href="mailto:'''+SUPPORT+'''">'''+SUPPORT+'''</a> and we&rsquo;ll help resolve it, including sending a replacement kit where appropriate.</p>
'''

DISCLAIMER = '''
'''+disclaimer_note+'''
<h2>Informational &amp; screening use</h2>
<p>Sacred Sampling Solutions kits and reports are provided for informational and screening purposes only. They are designed to help you understand what a laboratory measured in your sample compared to published reference thresholds.</p>
<h2>Not a medical diagnosis</h2>
<p>Our results are <strong>not</strong> a medical diagnosis and are not a substitute for advice from a physician or other qualified health professional. If you have health concerns, consult a licensed medical provider.</p>
<h2>Not a certified inspection</h2>
<p>Where a certified or licensed inspection is legally required (for example, certain real-estate, asbestos, or remediation contexts), our screening kits are not a substitute for that inspection. Consult a licensed professional as appropriate.</p>
<h2>Results depend on collection</h2>
<p>The accuracy of any result depends on samples being collected, chilled, and shipped correctly and promptly. Please follow the instructions included with your kit.</p>
<h2>No guaranteed outcome</h2>
<p>Analysis is performed by an accredited partner laboratory using established methods. We do not guarantee any particular result, and reference thresholds such as EPA Maximum Contaminant Levels are provided for comparison only.</p>
'''

CONTACT = '''
<p>We&rsquo;re a small, independent team and we read every message. For the fastest help, email us and include your order number if you have one.</p>
<h2>Email</h2>
<p><a href="mailto:'''+SUPPORT+'''">'''+SUPPORT+'''</a></p>
<h2>Mailing address</h2>
<p>Sacred Sampling Solutions LLC<br>[Business Mailing Address]</p>
<h2>Send us a message</h2>
<form onsubmit="return false" style="display:flex;flex-direction:column;gap:12px;max-width:520px;margin-top:8px">
  <input type="text" placeholder="Your name" aria-label="Your name" style="padding:.8em 1em;border-radius:10px;border:1px solid var(--line-strong);background:var(--ground);color:var(--ink);font-family:var(--sans)">
  <input type="email" placeholder="you@email.com" aria-label="Email" style="padding:.8em 1em;border-radius:10px;border:1px solid var(--line-strong);background:var(--ground);color:var(--ink);font-family:var(--sans)">
  <textarea placeholder="How can we help?" rows="5" aria-label="Message" style="padding:.8em 1em;border-radius:10px;border:1px solid var(--line-strong);background:var(--ground);color:var(--ink);font-family:var(--sans)"></textarea>
  <button class="btn btn-primary" type="submit" style="align-self:flex-start">Send message</button>
</form>
<p style="font-size:.82rem;color:var(--ink-3);margin-top:10px">This form is a placeholder — connect it to your email tool or Wix Forms before launch.</p>
'''

pages = [
 ("privacy.html","Privacy Policy","How Sacred Sampling Solutions collects, uses, and protects your information.","Privacy Policy","This policy explains what information we collect through our website, kits, and results portal, and how we use and protect it.",PRIVACY),
 ("terms.html","Terms of Service","The terms that govern your use of Sacred Sampling Solutions kits, website, and portal.","Terms of Service","Please read these terms carefully. They govern your purchase and use of our kits, website, and customer portal.",TERMS),
 ("refund.html","Refund & Return Policy","Our refund and return policy for mail-in testing kits.","Refund &amp; Return Policy","Here&rsquo;s exactly when a kit can be returned or refunded, and how to request it.",REFUND),
 ("shipping.html","Shipping Policy","How kits are shipped, and how to return your sample.","Shipping Policy","How your kit gets to you, and how to send your sample back so it stays valid.",SHIPPING),
 ("disclaimer.html","Disclaimer","Important information about how to use your Sacred Sampling results.","Disclaimer","Important context on what our kits and reports are — and are not.",DISCLAIMER),
 ("contact.html","Contact","Get in touch with the Sacred Sampling Solutions team.","Contact us","Questions about a kit, an order, or your results? Here&rsquo;s how to reach us.",CONTACT),
]
for slug,title,desc,h1,lead,body in pages:
    open(slug,"w").write(legal_page(slug,title,desc,h1,lead,body))
    print("wrote", slug)

# ---------- Update main pages: header/footer/SEO + pin light theme ----------
main = {
 "index.html": ("Sacred Sampling Solutions — Certified Home Water Testing Kits",
   "Lab-backed, mail-in drinking water test kits. Six kits from a focused metals check to a full Professional panel — collect at home, mail it back, get an easy-to-read report.", ""),
 "kits.html": ("Test Kits & Pricing — Sacred Sampling Solutions",
   "Six lab-backed, mail-in drinking water test kits — Heavy Metals, Metals & Minerals, Essentials, Comprehensive, PFAS, and the all-in-one Professional.", "kits"),
 "quiz.html": ("Find My Kit — Sacred Sampling Solutions",
   "Answer a few quick questions and we'll match you to the right Sacred Sampling water test kit.", "quiz"),
}
for fn,(title,desc,active) in main.items():
    s=open(fn).read()
    s=s.replace('<html lang="en">','<html lang="en" data-theme="light">',1)
    if 'data-theme' not in s.split('>',1)[0]:
        s=s.replace('<html lang="en" data-theme="light">','<html lang="en" data-theme="light">')
    # inject SEO before stylesheet link (font included in seo())
    if 'rel="canonical"' not in s:
        s=s.replace('<link rel="stylesheet" href="styles.css">',
                    seo(title,desc,fn)+'\n<link rel="stylesheet" href="styles.css">',1)
    # swap header & footer
    s=re.sub(r'<header>.*?</header>', nav(active), s, count=1, flags=re.S)
    s=re.sub(r'<footer>.*?</footer>', FOOTER, s, count=1, flags=re.S)
    open(fn,"w").write(s)
    print("updated", fn)

# ---------- sitemap + robots ----------
urls = ["", "kits.html", "quiz.html",
        "privacy.html","terms.html","refund.html","shipping.html","disclaimer.html","contact.html"]
sm = ['<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
for u in urls:
    loc = DOMAIN + "/" + u
    pr = "1.0" if u=="" else ("0.8" if u in ("kits.html","quiz.html","sampleregistration.html") else "0.4")
    sm.append(f"  <url><loc>{loc}</loc><changefreq>weekly</changefreq><priority>{pr}</priority></url>")
sm.append("</urlset>")
open("sitemap.xml","w").write("\n".join(sm))
open("robots.txt","w").write(f"User-agent: *\nAllow: /\n\nSitemap: {DOMAIN}/sitemap.xml\n")
print("wrote sitemap.xml, robots.txt")
