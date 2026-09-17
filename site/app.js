// Sacred Sampling Solutions — shared behavior
(function () {
  var root = document.documentElement;

  // Single source of truth for the stated lab turnaround time.
  // Change it here once and every [data-turnaround] element updates.
  var TURNAROUND = '7–10 business days';
  [].forEach.call(document.querySelectorAll('[data-turnaround]'), function (el) {
    el.textContent = TURNAROUND;
  });

  // Theme toggle (persists for the session)
  var themeBtn = document.getElementById('themeBtn');
  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      var cur = root.getAttribute('data-theme');
      if (!cur) cur = matchMedia('(prefers-color-scheme:dark)').matches ? 'dark' : 'light';
      root.setAttribute('data-theme', cur === 'dark' ? 'light' : 'dark');
    });
  }

  // Mobile nav
  var navToggle = document.getElementById('navToggle');
  var navLinks = document.getElementById('navLinks');
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', function () {
      navLinks.classList.toggle('open');
    });
    navLinks.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') navLinks.classList.remove('open');
    });
  }

  // Mega-menu — rebuild the header nav into grouped dropdowns (desktop) /
  // accordion (mobile). Injected here so every page shares one nav source.
  if (navLinks) {
    var MENU = [
      ['Shop Tests', [['All Tests', '/kits'], ['Water', '/kits#filter=water'], ['Indoor Air', '/kits#filter=air'], ['Asbestos', '/kits#filter=asbestos'], ['Surface & Dust', '/kits#filter=surface'], ['Cosmetics', '/kits#filter=cosmetic']]],
      ['What Should I Test?', [['Find My Test — 60-sec quiz', '/quiz'], ['ZIP Code Lookup — What\'s near you?', '/zip-lookup'], ['Private Well', '/well-water'], ['Older Home / Plumbing', '/older-home'], ['Buying a Home', '/buying-a-home'], ['Near Landfill / Airport / Industry', '/near-industry'], ['Renovating', '/renovating'], ['New Furniture / Chemical Odor', '/chemical-odor']]],
      ['How It Works', [['How It Works', '/#how'], ['Sample Reports', '/sample-report'], ['Laboratory & Methods', '/laboratory'], ['Shipping & Turnaround', '/shipping']]],
      ['Learn', [['Education Center', '/learn'], ['Water', '/learn#water'], ['Indoor Air', '/learn#air'], ['Asbestos', '/learn#asbestos'], ['News / Sacred Intel', '/learn']]],
      ['About', [['About Sacred', '/about'], ['Our Laboratory', '/laboratory'], ['For Professionals', '/professionals'], ['Contact', '/contact']]]
    ];
    var chev = '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>';
    var html = MENU.map(function (g, i) {
      var rightClass = (i >= MENU.length - 2) ? ' nav-right' : '';
      var items = g[1].map(function (it) { return '<a href="' + it[1] + '">' + it[0] + '</a>'; }).join('');
      return '<div class="navgroup' + rightClass + '">' +
        '<button type="button" class="navgroup-btn" aria-expanded="false" data-href="' + g[1][0][1] + '">' + g[0] + ' ' + chev + '</button>' +
        '<div class="navdrop">' + items + '</div></div>';
    }).join('');
    html += '<a class="nav-signin" href="https://app.sacredsamplingsolutions.com/login">My Results</a>';
    navLinks.innerHTML = html;

    navLinks.addEventListener('click', function (e) {
      var btn = e.target.closest && e.target.closest('.navgroup-btn');
      if (!btn) return;
      if (window.matchMedia('(min-width:981px)').matches) {
        // Desktop: hover reveals the dropdown; a click goes to the section landing.
        var href = btn.getAttribute('data-href');
        if (href) window.location.href = href;
        return;
      }
      // Mobile: toggle this group's accordion.
      var group = btn.parentNode;
      var open = group.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    // Turn the header's primary CTA into "Find my test".
    var primaryCta = document.querySelector('header .nav-cta a.btn-primary');
    if (primaryCta) { primaryCta.setAttribute('href', '/quiz'); primaryCta.textContent = 'Find my test'; }
  }

  // Help widget — a floating "Questions?" button that opens a panel of common
  // questions (tap to reveal the answer) with a "request a call" option.
  (function () {
    if (/\/checkout$/.test(location.pathname.replace(/\.html$/, ''))) return; // not during checkout
    if (document.querySelector('.help-fab')) return;

    var FAQ = [
      ['How does it work?', 'Order online, collect your sample at home in a few minutes, and mail it back in the prepaid pouch. Your accredited-lab report arrives by email. <a href="/#how">See the steps &rarr;</a>'],
      ['How long do results take?', 'Typically <b>7–10 business days</b> after the laboratory receives your sample.'],
      ['Is this a real laboratory?', 'Yes — samples are analyzed by an accredited partner lab (NYSDOH ELAP #11693) using EPA-referenced methods. <a href="/laboratory">Our laboratory &rarr;</a>'],
      ['Which test do I need?', 'Take the 60-second quiz and we’ll match you, or start from your situation. <a href="/quiz">Find my test &rarr;</a>'],
      ['Is it hard to collect the sample?', 'No — every kit includes simple, step-by-step instructions, and most samples take just a few minutes.'],
      ['What does shipping cost?', 'Return shipping is free — a prepaid label is in every kit. <a href="/shipping">Shipping policy &rarr;</a>'],
      ['Can I use results for real estate or a dispute?', 'Yes — every sample carries a documented chain of custody, so the results are defensible.'],
      ['Do you sell filters or treatment?', 'No. We’re independent — we only test, so a result never doubles as a sales pitch.']
    ];

    var fab = document.createElement('button');
    fab.type = 'button';
    fab.className = 'help-fab';
    fab.setAttribute('aria-label', 'Questions? Open help');
    fab.innerHTML = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H8l-4 4V5a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2z"/><path d="M9.2 9.5a2.8 2.8 0 0 1 5.4 1c0 1.8-2.6 2.5-2.6 2.5"/><path d="M12 16.5h.01"/></svg><span class="help-fab-label">Questions?</span>';

    var panel = document.createElement('div');
    panel.className = 'help-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'Help');
    panel.hidden = true;
    panel.innerHTML =
      '<div class="help-head"><div><b>How can we help?</b><span>Tap a question, or request a call.</span></div>' +
      '<button type="button" class="help-x" aria-label="Close help">&times;</button></div>' +
      '<div class="help-body">' +
        '<div class="help-faq">' +
        FAQ.map(function (q) {
          return '<div class="help-q"><button type="button" class="help-qbtn">' + q[0] +
            '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg></button>' +
            '<div class="help-a">' + q[1] + '</div></div>';
        }).join('') +
        '</div>' +
        '<form class="help-callform" hidden novalidate>' +
          '<a class="help-back" href="#">&larr; Back to questions</a>' +
          '<p class="help-formlead">Leave your number and a good time — we’ll call you back.</p>' +
          '<input name="name" type="text" placeholder="Your name" autocomplete="name" required>' +
          '<input name="phone" type="tel" inputmode="tel" placeholder="Phone number" autocomplete="tel" required>' +
          '<select name="time"><option value="">Best time to call…</option><option>Morning</option><option>Afternoon</option><option>Evening</option></select>' +
          '<input name="email" type="email" inputmode="email" placeholder="Email (optional)" autocomplete="email">' +
          '<div class="help-err" hidden>Please add your name and phone.</div>' +
          '<button type="submit" class="btn btn-primary btn-block">Request my call</button>' +
        '</form>' +
      '</div>' +
      '<div class="help-foot"><button type="button" class="help-callbtn">📞 Request a call</button>' +
      '<a class="help-email" href="mailto:info@sacredsamplingsolutions.com">or email us</a></div>';

    document.body.appendChild(fab);
    document.body.appendChild(panel);

    var body = panel.querySelector('.help-body');
    var faq = panel.querySelector('.help-faq');
    var form = panel.querySelector('.help-callform');
    var foot = panel.querySelector('.help-foot');

    function open() { panel.hidden = false; requestAnimationFrame(function () { panel.classList.add('open'); }); fab.classList.add('is-open'); }
    function close() { panel.classList.remove('open'); fab.classList.remove('is-open'); setTimeout(function () { panel.hidden = true; }, 220); }
    fab.addEventListener('click', function () { panel.hidden || !panel.classList.contains('open') ? open() : close(); });
    panel.querySelector('.help-x').addEventListener('click', close);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && panel.classList.contains('open')) close(); });

    // FAQ accordion
    faq.addEventListener('click', function (e) {
      var btn = e.target.closest && e.target.closest('.help-qbtn');
      if (!btn) return;
      btn.parentNode.classList.toggle('open');
    });

    // Swap to the call-back form and back
    function showForm(on) { faq.hidden = on; foot.hidden = on; form.hidden = !on; }
    panel.querySelector('.help-callbtn').addEventListener('click', function () { showForm(true); });
    panel.querySelector('.help-back').addEventListener('click', function (e) { e.preventDefault(); showForm(false); });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = form.elements['name'].value.trim(), phone = form.phone.value.trim();
      var err = form.querySelector('.help-err');
      if (!name || !phone) { err.hidden = false; return; }
      err.hidden = true;
      var btn = form.querySelector('button[type=submit]');
      btn.disabled = true; btn.textContent = 'Sending…';
      fetch('https://formsubmit.co/ajax/info@sacredsamplingsolutions.com', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ _subject: 'Call-back request — ' + name, name: name, phone: phone, best_time: form.time.value, email: form.email.value.trim(), page: location.pathname })
      }).then(finish, finish);
      if (window.gtag) window.gtag('event', 'generate_lead', { event_label: 'callback' });
      if (window.fbq) window.fbq('track', 'Lead', { content_name: 'callback' });
      function finish() {
        body.innerHTML = '<div class="help-done"><div class="help-done-ic"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></div>' +
          '<b>Thanks, ' + name.split(' ')[0] + '!</b><p>We’ll call you ' + (form.time.value ? form.time.value.toLowerCase() : 'shortly') + '. Talk soon.</p></div>';
        foot.hidden = true;
      }
    });
  })();

  // ── Shopping cart ────────────────────────────────────────────────────
  // Client-side cart (localStorage) + slide-out drawer + Stripe Checkout.
  // Add-to-cart buttons are the legacy per-kit "Buy now" links, upgraded in
  // place (see below). Prices shown here are display-only — /api/checkout
  // re-prices every line from its own server catalog before charging.
  (function () {
    var KEY = 'sss_cart', LEAD = 'sss_lead';
    function validEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }
    function read() { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { return []; } }
    function write(items) { try { localStorage.setItem(KEY, JSON.stringify(items)); } catch (e) {} render(); }
    function count() { return read().reduce(function (n, i) { return n + i.qty; }, 0); }
    function subtotalCents() { return read().reduce(function (n, i) { return n + i.price * i.qty; }, 0); }
    function money(cents) {
      return '$' + (cents / 100).toLocaleString('en-US', {
        minimumFractionDigits: (cents % 100 ? 2 : 0), maximumFractionDigits: 2
      });
    }
    function add(slug, name, price) {
      if (!slug || !(price > 0)) return;
      var items = read(), found = null;
      items.forEach(function (i) { if (i.slug === slug) found = i; });
      if (found) found.qty = Math.min(10, found.qty + 1);
      else items.push({ slug: slug, name: name, price: price, qty: 1 });
      write(items);
    }
    function setQty(slug, qty) {
      var items = read().map(function (i) {
        if (i.slug === slug) i.qty = Math.max(0, Math.min(10, qty));
        return i;
      }).filter(function (i) { return i.qty > 0; });
      write(items);
    }
    function removeItem(slug) { write(read().filter(function (i) { return i.slug !== slug; })); }

    // Clear the cart once the purchase completes (Stripe → /thank-you).
    if (/\/thank-you$/.test(location.pathname.replace(/\.html$/, ''))) {
      try { localStorage.removeItem(KEY); } catch (e) {}
    }

    // ── Header cart button ────────────────────────────────────────────
    var navCta = document.querySelector('header .nav-cta');
    var cartBtn = null;
    if (navCta) {
      cartBtn = document.createElement('button');
      cartBtn.type = 'button';
      cartBtn.className = 'cart-btn';
      cartBtn.id = 'cartBtn';
      cartBtn.setAttribute('aria-label', 'Open cart');
      cartBtn.setAttribute('aria-haspopup', 'dialog');
      cartBtn.innerHTML =
        '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
        '<path d="M4 4h2l2.4 12.2a1.5 1.5 0 0 0 1.5 1.2h8.1a1.5 1.5 0 0 0 1.5-1.2L23 7H6"/>' +
        '<circle cx="10" cy="21" r="1"/><circle cx="19" cy="21" r="1"/></svg>' +
        '<span class="cart-count" hidden>0</span>';
      var toggle = navCta.querySelector('.nav-toggle');
      if (toggle) navCta.insertBefore(cartBtn, toggle);
      else navCta.appendChild(cartBtn);
      cartBtn.addEventListener('click', openDrawer);
    }

    // ── Drawer ────────────────────────────────────────────────────────
    var drawer = document.createElement('div');
    drawer.className = 'cart-drawer';
    drawer.id = 'cartDrawer';
    drawer.hidden = true;
    drawer.innerHTML =
      '<div class="cart-overlay" data-act="close"></div>' +
      '<aside class="cart-panel" role="dialog" aria-modal="true" aria-label="Your cart">' +
        '<div class="cart-head"><h2>Your cart</h2>' +
        '<button type="button" class="cart-x" data-act="close" aria-label="Close cart">&times;</button></div>' +
        '<div class="cart-body"></div>' +
        '<div class="cart-foot">' +
          '<div class="cart-row"><span>Subtotal</span><b class="cart-sub-amt">$0</b></div>' +
          '<div class="cart-ship">✓ Free U.S. shipping &amp; prepaid return label</div>' +
          '<div class="cart-promo">Have a code? Enter <b>WELCOME25</b> at checkout for $25 off your first order.</div>' +
          '<input type="email" class="cart-email" inputmode="email" autocomplete="email" placeholder="Email for your receipt &amp; results">' +
          '<button type="button" class="btn btn-gold btn-lg cart-checkout">Checkout <span class="arrow">&rarr;</span></button>' +
          '<div class="cart-err" hidden></div>' +
          '<p class="cart-fine">Secure checkout on our site — card processing powered by Stripe.</p>' +
        '</div>' +
      '</aside>';
    document.body.appendChild(drawer);
    var body = drawer.querySelector('.cart-body');
    var subAmt = drawer.querySelector('.cart-sub-amt');
    var errEl = drawer.querySelector('.cart-err');
    var checkoutBtn = drawer.querySelector('.cart-checkout');
    var emailInput = drawer.querySelector('.cart-email');
    try { var savedLead = localStorage.getItem(LEAD); if (savedLead) emailInput.value = savedLead; } catch (e) {}

    function openDrawer() {
      render();
      drawer.hidden = false;
      document.body.style.overflow = 'hidden';
      requestAnimationFrame(function () { drawer.classList.add('open'); });
    }
    function closeDrawer() {
      drawer.classList.remove('open');
      document.body.style.overflow = '';
      setTimeout(function () { drawer.hidden = true; }, 260);
    }
    drawer.addEventListener('click', function (e) {
      var el = e.target.closest && e.target.closest('[data-act]');
      var act = el && el.getAttribute('data-act');
      if (act === 'close') { closeDrawer(); return; }
      var line = e.target.closest && e.target.closest('.cart-line');
      if (!line) return;
      var slug = line.getAttribute('data-slug');
      if (act === 'inc') setQty(slug, itemQty(slug) + 1);
      else if (act === 'dec') setQty(slug, itemQty(slug) - 1);
      else if (act === 'rm') removeItem(slug);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !drawer.hidden) closeDrawer();
    });
    function itemQty(slug) { var q = 0; read().forEach(function (i) { if (i.slug === slug) q = i.qty; }); return q; }

    function render() {
      var items = read(), n = count();
      if (cartBtn) {
        var badge = cartBtn.querySelector('.cart-count');
        badge.textContent = n;
        badge.hidden = n === 0;
        cartBtn.setAttribute('aria-label', n ? ('Open cart, ' + n + ' item' + (n === 1 ? '' : 's')) : 'Open cart');
      }
      subAmt.textContent = money(subtotalCents());
      if (!items.length) {
        body.innerHTML = '<div class="cart-empty"><p>Your cart is empty.</p>' +
          '<a class="btn btn-ghost" href="/kits" data-act="close">Browse test kits</a></div>';
        checkoutBtn.disabled = true;
        return;
      }
      checkoutBtn.disabled = false;
      body.innerHTML = items.map(function (i) {
        return '<div class="cart-line" data-slug="' + i.slug + '">' +
          '<div class="cart-line-main">' +
            '<a class="cart-line-name" href="/' + i.slug + '">' + i.name + '</a>' +
            '<div class="cart-line-price">' + money(i.price) + ' each</div>' +
          '</div>' +
          '<div class="cart-qty">' +
            '<button type="button" data-act="dec" aria-label="Decrease quantity">&minus;</button>' +
            '<span aria-live="polite">' + i.qty + '</span>' +
            '<button type="button" data-act="inc" aria-label="Increase quantity">+</button>' +
          '</div>' +
          '<button type="button" class="cart-line-rm" data-act="rm" aria-label="Remove ' + i.name + '">Remove</button>' +
        '</div>';
      }).join('');
    }

    function checkout() {
      var items = read();
      if (!items.length) return;
      var email = (emailInput.value || '').trim();
      if (email && validEmail(email)) { try { localStorage.setItem(LEAD, email); } catch (e) {} }
      if (window.gtag) window.gtag('event', 'begin_checkout', { currency: 'USD', value: subtotalCents() / 100 });
      if (window.fbq) window.fbq('track', 'InitiateCheckout');
      // Payment happens on our own /checkout page (embedded Stripe).
      window.location.href = '/checkout';
    }
    checkoutBtn.addEventListener('click', checkout);

    // ── Upgrade the legacy per-kit "Buy now" links into Add-to-cart ────
    // Every sellable kit page carries buy.stripe.com links; on a kit page
    // they all refer to that one kit, so slug/name/price come from the page.
    (function () {
      var slug = location.pathname.replace(/^\//, '').replace(/\.html$/, '');
      if (!/^kit-[a-z0-9-]+$/.test(slug)) return;
      var nameEl = document.querySelector('.page-hero h1');
      var amtEl = document.querySelector('.page-hero .price .amt');
      if (!nameEl || !amtEl) return;
      var name = nameEl.textContent.trim();
      var priceCents = Math.round(parseFloat(amtEl.textContent.replace(/[^0-9.]/g, '')) * 100);
      if (!(priceCents > 0)) return;
      [].forEach.call(document.querySelectorAll('a[href*="buy.stripe.com"], [data-addcart]'), function (a) {
        a.removeAttribute('href');
        a.setAttribute('role', 'button');
        a.style.cursor = 'pointer';
        a.innerHTML = 'Add to cart <span class="arrow">&rarr;</span>';
        a.addEventListener('click', function (e) {
          e.preventDefault();
          add(slug, name, priceCents);
          openDrawer();
        });
      });
    })();

    render();
    window.SSSCart = { add: add, open: openDrawer, count: count };
  })();

  // Waitlist confirmation (coming-soon kit pages)
  (function () {
    if (new URLSearchParams(location.search).get('waitlisted') !== '1') return;
    document.querySelectorAll('.waitlist-form').forEach(function (form) {
      var d = document.createElement('div');
      d.className = 'waitlist-done';
      d.innerHTML = '✓ You\'re on the list — we\'ll email you the moment this kit launches.';
      form.parentNode.replaceChild(d, form);
    });
  })();

  // Water Safety Guide + $25-off welcome popup — captures the email in the
  // background (AJAX, no page reload), then delivers the free guide and the
  // discount code. Shows once per visitor.
  (function () {
    var SEEN = 'sss_promo_seen', LEAD = 'sss_lead', CODE = 'WELCOME25';
    var HERO = '/assets/popup-hero.jpg';                  // glass-of-water lifestyle hero
    var GUIDE = '/assets/home-environmental-testing-guide.pdf'; // The Home Environmental Testing Guide (PDF)
    var MJ = 'https://15q4o.mjt.lu/wgt/15q4o/0yyg/subscribe?c=603a85a3'; // Mailjet list subscribe endpoint
    var path = location.pathname.replace(/\.html$/, '');
    // Don't interrupt checkout confirmation, the dedicated guide opt-in, the
    // unsubscribe page, or repeat visitors/leads.
    if (/\/(thank-you|home-safety-check|unsubscribed|checkout)$/.test(path)) return;
    var seen = false, lead = false;
    try { seen = !!localStorage.getItem(SEEN); lead = !!localStorage.getItem(LEAD); } catch (e) {}
    if (seen || lead) return;
    function mark() { try { localStorage.setItem(SEEN, '1'); } catch (e) {} }
    function validEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }

    // Trust badges (icon + label), matching the lineup under the form.
    var BADGES = [
      ['<path d="M9 3h6M10 3v5l-5 9a3 3 0 0 0 3 4h8a3 3 0 0 0 3-4l-5-9V3"/><path d="M7 15h10"/>', 'Accredited Laboratory Analysis'],
      ['<rect x="3" y="7" width="18" height="13" rx="1.5"/><path d="M3 10h18M9 7V4h6v3"/>', 'Easy Mail-In Sample Collection'],
      ['<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>', 'Easy-to-Understand Results'],
      ['<path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z"/><path d="M9 12l2 2 4-4"/>', 'EPA Method Testing']
    ];
    function badgesHtml() {
      return '<div class="promo-badges">' + BADGES.map(function (b) {
        return '<div class="promo-badge"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + b[0] + '</svg><span>' + b[1] + '</span></div>';
      }).join('') + '</div>';
    }

    var shown = false;
    function show() {
      if (shown) return; shown = true; mark();
      var ov = document.createElement('div');
      ov.className = 'promo-pop';
      ov.innerHTML =
        '<div class="promo-card" role="dialog" aria-modal="true" aria-label="Free Water Safety Guide plus $25 off your first order">' +
        '<button type="button" class="promo-x" aria-label="Close">&times;</button>' +
        '<img class="promo-hero" src="' + HERO + '" alt="Sacred Sampling Solutions water test kit">' +
        '<div class="promo-body">' +
        '<h3>Concerned About PFAS, Lead, or Well Water?</h3>' +
        '<p class="promo-sub">Get our <b>free Home Water Safety Guide</b> plus <b>$25 off</b> your first laboratory water test.</p>' +
        '<p class="promo-mini">Learn what to test for, how often to test, and how to understand your results.</p>' +
        '<form class="promo-form" novalidate>' +
        '<input type="email" name="email" inputmode="email" autocomplete="email" placeholder="Enter your email address" aria-label="Email" required>' +
        '<button type="submit" class="btn btn-gold">Get My Guide + $25 Off <span class="arrow">&rarr;</span></button>' +
        '<div class="promo-err" hidden>Please enter a valid email.</div>' +
        '</form>' +
        badgesHtml() +
        '<p class="promo-fine">No spam. Just water safety insights and your exclusive discount.</p>' +
        '</div>' +
        '</div>';
      document.body.appendChild(ov);
      var input = ov.querySelector('input[name=email]');
      var err = ov.querySelector('.promo-err');
      function close() { ov.remove(); }
      ov.querySelector('.promo-x').addEventListener('click', close);
      ov.addEventListener('click', function (e) { if (e.target === ov) close(); });
      ov.querySelector('.promo-form').addEventListener('submit', function (e) {
        e.preventDefault();
        var email = input.value.trim();
        if (!validEmail(email)) { err.hidden = false; input.focus(); return; }
        try { localStorage.setItem(LEAD, email); } catch (x) {}
        // Add the subscriber to Mailjet (fire-and-forget; text/plain avoids a
        // CORS preflight, response is opaque — we optimistically continue).
        try {
          fetch(MJ, {
            method: 'POST', mode: 'no-cors',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify({ Email: email, Fields: [] })
          }).catch(function () {});
        } catch (x) {}
        if (window.gtag) window.gtag('event', 'generate_lead', { currency: 'USD', value: 25 });
        if (window.fbq) window.fbq('track', 'Lead');
        ov.querySelector('.promo-body').innerHTML =
          '<span class="eyebrow">You\'re in</span>' +
          '<h3>Your guide is ready &mdash; and here\'s your $25 code</h3>' +
          '<div class="promo-code">' + CODE + '</div>' +
          '<p class="promo-sub">Apply <b>' + CODE + '</b> at checkout for <b>$25 off</b> your first water test.</p>' +
          '<a class="btn btn-gold" href="' + GUIDE + '" target="_blank" rel="noopener">Download my Water Safety Guide <span class="arrow">&rarr;</span></a>' +
          '<a class="promo-shop" href="/kits#kits">Shop water kits &rarr;</a>';
        ov.querySelector('.promo-x') && ov.querySelector('.promo-x').addEventListener('click', close);
      });
    }

    // Trigger: after 15s, or on exit-intent (mouse leaves toward the top), whichever comes first.
    var t = setTimeout(show, 15000);
    document.addEventListener('mouseout', function onOut(e) {
      if (!e.relatedTarget && e.clientY <= 0) { clearTimeout(t); document.removeEventListener('mouseout', onOut); show(); }
    });
  })();

  // Mobile sticky purchase bar on product (kit) pages.
  // Appears once the hero Buy CTA scrolls out of view; hides at the footer.
  // CSS hides it entirely on desktop (min-width:821px), so it never affects
  // desktop behavior.
  (function () {
    var path = location.pathname.replace(/\.html$/, '');
    if (!/\/kit-[a-z0-9-]+$/.test(path)) return;               // product pages only
    var heroBtn = document.querySelector('.page-hero a[href*="buy.stripe.com"], .page-hero [data-addcart]');
    var nameEl = document.querySelector('.page-hero h1');
    var priceEl = document.querySelector('.page-hero .price .amt');
    var footer = document.querySelector('footer');
    if (!heroBtn || !nameEl || !priceEl) return;               // sellable kits only (skip coming-soon)
    if (!('IntersectionObserver' in window)) return;

    var fullName = nameEl.textContent.trim();
    var name = fullName.replace(/\s+Kit$/i, '');       // abbreviate: drop trailing "Kit"
    var price = priceEl.textContent.trim();
    var slug = path.replace(/^\//, '');
    var priceCents = Math.round(parseFloat(price.replace(/[^0-9.]/g, '')) * 100);

    var bar = document.createElement('div');
    bar.className = 'buybar';
    bar.setAttribute('aria-hidden', 'true');
    bar.innerHTML =
      '<div class="buybar-info">' +
      '<div class="buybar-name">' + name + '</div>' +
      '<div class="buybar-price">' + price + '</div>' +
      '</div>' +
      '<button type="button" class="buybar-btn" tabindex="-1" aria-label="Add ' + name + ' kit to cart — ' + price + '">Add to cart</button>';
    document.body.appendChild(bar);
    var btn = bar.querySelector('.buybar-btn');
    btn.addEventListener('click', function () {
      if (window.SSSCart) { window.SSSCart.add(slug, fullName, priceCents); window.SSSCart.open(); }
    });

    var past = false, atFooter = false;
    function update() {
      var show = past && !atFooter;
      bar.classList.toggle('show', show);
      bar.setAttribute('aria-hidden', show ? 'false' : 'true');
      btn.tabIndex = show ? 0 : -1;
    }
    var anchor = document.querySelector('.page-hero .hero-cta') || heroBtn;
    new IntersectionObserver(function (es) {
      es.forEach(function (e) { past = !e.isIntersecting && e.boundingClientRect.top < 0; });
      update();
    }, { threshold: 0 }).observe(anchor);
    if (footer) {
      new IntersectionObserver(function (es) {
        es.forEach(function (e) { atFooter = e.isIntersecting; });
        update();
      }, { threshold: 0 }).observe(footer);
    }
  })();

  // ── ZIP Code Lookup — "What's in your water?" ────────────────────────
  // Reads a bundled, public-data JSON (site/data/zip-lookup.json) and shows the
  // documented area-level environmental profile for a ZIP, plus the right kit to
  // start with. Screening only — never a claim about an individual home.
  (function () {
    var form = document.getElementById('zipForm');
    var results = document.getElementById('zipResults');
    if (!form || !results) return;                 // only on /zip-lookup
    var input = document.getElementById('zipInput');
    var countEl = document.getElementById('zipCount');
    var DATA = null, loading = false;

    // Kit copy for the info-only (non-purchasable) kits, so the CTA links out
    // rather than fabricating a cart price.
    function esc(s) {
      return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
      });
    }

    function load() {
      if (DATA || loading) return Promise.resolve(DATA);
      loading = true;
      return fetch('/data/zip-lookup.json').then(function (r) { return r.json(); })
        .then(function (j) {
          DATA = j; loading = false;
          if (countEl && j.count) countEl.textContent = j.count.toLocaleString() + ' ZIP codes in our screening database.';
          return j;
        }).catch(function () { loading = false; return null; });
    }
    load();

    function dots(sd, strength) {
      // sd is like "●●●●○"; color by strength.
      var cls = 'ok';
      if (/very high/i.test(strength)) cls = 'vhigh';
      else if (/high/i.test(strength)) cls = 'high';
      else if (/moderate/i.test(strength)) cls = 'mod';
      return '<span class="zip-dots ' + cls + '" aria-hidden="true">' + esc(sd || '') + '</span>';
    }

    function chips(str) {
      return String(str || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean)
        .map(function (s) { return '<span class="zip-chip">' + esc(s) + '</span>'; }).join('');
    }

    function kitCard(rec) {
      var kit = (DATA.kits && DATA.kits[rec.kit]) || {};
      var name = kit.name || 'Recommended test';
      var href = '/' + rec.kit;
      if (kit.buy && kit.price) {
        return '<div class="zip-kit">' +
          '<div class="zip-kit-tag">Recommended starting point</div>' +
          '<div class="zip-kit-row">' +
            '<div><div class="zip-kit-name">' + esc(name) + '</div>' +
            '<div class="zip-kit-price">$' + kit.price + '</div></div>' +
            '<button type="button" class="btn btn-gold" data-zipbuy="' + esc(rec.kit) + '" data-zipname="' + esc(name) + '" data-zipprice="' + kit.price + '">Add to cart <span class="arrow">&rarr;</span></button>' +
          '</div>' +
          '<a class="zip-kit-learn" href="' + href + '">See what this kit covers &rarr;</a>' +
        '</div>';
      }
      // Info-only kit (no published DTC price yet) — link to the kit page.
      return '<div class="zip-kit">' +
        '<div class="zip-kit-tag">Recommended starting point</div>' +
        '<div class="zip-kit-row">' +
          '<div><div class="zip-kit-name">' + esc(name) + '</div>' +
          '<div class="zip-kit-price muted">See kit page</div></div>' +
          '<a class="btn btn-gold" href="' + href + '">View the ' + esc(name) + ' <span class="arrow">&rarr;</span></a>' +
        '</div>' +
      '</div>';
    }

    function render(zip, rec) {
      var place = [rec.c, rec.s].filter(Boolean).join(', ');
      var disc = 'This does not mean ' + esc(rec.pc) + ' is present in your home’s water. Your individual water can only be evaluated by testing a sample from your property.';
      results.innerHTML =
        '<div class="zip-card reveal in">' +
          '<div class="zip-card-head">' +
            '<div>' +
              '<span class="eyebrow">ZIP ' + esc(zip) + '</span>' +
              '<h2>' + esc(place) + (rec.co ? ' &middot; ' + esc(rec.co) + ' County' : '') + '</h2>' +
            '</div>' +
            '<div class="zip-signal">' +
              '<span class="zip-signal-label">Signal strength</span>' +
              dots(rec.sd, rec.ss) +
              '<b>' + esc(rec.ss) + '</b>' +
            '</div>' +
          '</div>' +

          '<div class="zip-alert">We found environmental factors worth knowing about in your area.</div>' +

          '<div class="zip-primary">' +
            '<span class="zip-primary-tag">Primary concern</span>' +
            '<div class="zip-primary-name">' + esc(rec.pc) + '</div>' +
            (rec.pcd ? '<p class="zip-primary-detail">' + esc(rec.pcd) + '</p>' : '') +
          '</div>' +

          '<div class="zip-facts">' +
            (rec.lct ? '<div class="zip-fact"><h4>Local context</h4><p><b>' + esc(rec.lct) + '</b><br>' + esc(rec.lcd) + '</p></div>' : '') +
            (rec.why ? '<div class="zip-fact"><h4>Why your area appears</h4><p>' + esc(rec.why) + '</p></div>' : '') +
          '</div>' +

          (rec.sc ? '<div class="zip-fact"><h4>Contaminants documented in the area</h4><div class="zip-chips">' + chips(rec.sc) + '</div></div>' : '') +
          (rec.src ? '<div class="zip-fact"><h4>Associated source</h4><p>' + esc(rec.src) + '</p></div>' : '') +

          '<div class="zip-source-toggle">' +
            '<span>Your water comes from:</span>' +
            '<div class="zip-seg" role="group" aria-label="Water source">' +
              '<button type="button" class="zip-seg-btn is-on" data-src="city">City / municipal</button>' +
              '<button type="button" class="zip-seg-btn" data-src="well">Private well</button>' +
            '</div>' +
            '<p class="zip-source-note" id="zipSrcNote"></p>' +
          '</div>' +

          kitCard(rec) +

          '<p class="zip-disc">' + disc + '</p>' +

          '<div class="zip-report">' +
            '<div><b>Want this in writing?</b><span>Email me my area profile and a checklist of what to test.</span></div>' +
            '<form class="zip-report-form" novalidate>' +
              '<input type="email" name="email" inputmode="email" autocomplete="email" placeholder="you@email.com" aria-label="Email" required>' +
              '<button type="submit" class="btn btn-primary">Email my profile</button>' +
              '<span class="zip-report-msg" hidden></span>' +
            '</form>' +
          '</div>' +
        '</div>';

      results.hidden = false;

      // Water-source note toggle.
      var note = document.getElementById('zipSrcNote');
      function setNote(kind) {
        note.textContent = kind === 'well'
          ? 'Private wells aren’t regulated or treated by a utility, so testing at the tap is the only way to know what’s there. A well owner should also check bacteria and nitrate at least once a year.'
          : 'Municipal water is treated and monitored at the plant, but lead and other contaminants can still be picked up between the plant and your tap. Testing at your own tap is the only way to know what reaches your glass.';
      }
      setNote('city');
      [].forEach.call(results.querySelectorAll('.zip-seg-btn'), function (b) {
        b.addEventListener('click', function () {
          results.querySelectorAll('.zip-seg-btn').forEach(function (x) { x.classList.remove('is-on'); });
          b.classList.add('is-on');
          setNote(b.getAttribute('data-src'));
        });
      });

      // Add-to-cart for purchasable recommendation.
      var buy = results.querySelector('[data-zipbuy]');
      if (buy) buy.addEventListener('click', function () {
        var cents = Math.round(parseFloat(buy.getAttribute('data-zipprice')) * 100);
        if (window.SSSCart) { window.SSSCart.add(buy.getAttribute('data-zipbuy'), buy.getAttribute('data-zipname'), cents); window.SSSCart.open(); }
      });

      // Email-my-profile (fire-and-forget lead capture via formsubmit.co).
      var rform = results.querySelector('.zip-report-form');
      if (rform) rform.addEventListener('submit', function (e) {
        e.preventDefault();
        var em = (rform.elements['email'].value || '').trim();
        var msg = rform.querySelector('.zip-report-msg');
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) { msg.hidden = false; msg.textContent = 'Please enter a valid email.'; return; }
        try {
          fetch('https://formsubmit.co/ajax/info@sacredsamplingsolutions.com', {
            method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({ _subject: 'ZIP profile request — ' + zip, email: em, zip: zip, area: place, primary_concern: rec.pc })
          }).catch(function () {});
        } catch (x) {}
        try { localStorage.setItem('sss_lead', em); } catch (x) {}
        if (window.gtag) window.gtag('event', 'generate_lead', { currency: 'USD', value: 0 });
        rform.innerHTML = '<div class="zip-report-done">✓ On its way &mdash; check your inbox. Ready to test? <a href="/kits#kits">Shop kits &rarr;</a></div>';
      });

      results.scrollIntoView({ behavior: 'smooth', block: 'start' });
      if (window.gtag) window.gtag('event', 'zip_lookup', { zip: zip, primary_concern: rec.pc });
    }

    function notFound(zip) {
      results.innerHTML =
        '<div class="zip-card zip-card-empty reveal in">' +
          '<h2>We don’t have area data for ' + esc(zip) + ' yet.</h2>' +
          '<p>Our screening database is growing. That doesn’t mean your area is clear &mdash; it just means we don’t have a public-record match to show. The surest answer is always a laboratory test of your own water.</p>' +
          '<div class="hero-cta"><a class="btn btn-gold btn-lg" href="/quiz">Find my test <span class="arrow">&rarr;</span></a>' +
          '<a class="btn btn-ghost btn-lg" href="/kits">Browse all kits</a></div>' +
        '</div>';
      results.hidden = false;
      results.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function lookup() {
      var raw = (input.value || '').replace(/[^0-9]/g, '');
      if (raw.length < 5) { input.focus(); return; }
      var zip = raw.slice(0, 5);
      results.hidden = false;
      results.innerHTML = '<div class="zip-card zip-loading">Checking public records for ' + esc(zip) + '…</div>';
      load().then(function (j) {
        if (!j || !j.zips) { results.innerHTML = '<div class="zip-card zip-loading">Sorry &mdash; the lookup is unavailable right now. Please try again.</div>'; return; }
        var rec = j.zips[zip];
        if (rec) render(zip, rec); else notFound(zip);
      });
    }

    form.addEventListener('submit', function (e) { e.preventDefault(); lookup(); });
    input.addEventListener('input', function () { input.value = input.value.replace(/[^0-9]/g, '').slice(0, 5); });

    // Deep link: /zip-lookup?zip=90210 runs the search on load.
    var qz = new URLSearchParams(location.search).get('zip');
    if (qz) { input.value = qz.replace(/[^0-9]/g, '').slice(0, 5); lookup(); }
  })();

  // Reveal on scroll
  var els = [].slice.call(document.querySelectorAll('.reveal'));
  if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion:reduce)').matches) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    els.forEach(function (el) { if (!el.classList.contains('in')) io.observe(el); });
  } else {
    els.forEach(function (el) { el.classList.add('in'); });
  }
})();
