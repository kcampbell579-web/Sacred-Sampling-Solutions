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

  // Floating WhatsApp chat button (opens a chat to the business number)
  (function () {
    var PHONE = '16313171295'; // WhatsApp Business — country code + number, digits only
    var MSG = 'Hi Sacred Sampling — I have a question about your water test kits.';
    if (document.querySelector('.wa-fab')) return;
    var a = document.createElement('a');
    a.className = 'wa-fab';
    a.href = 'https://wa.me/' + PHONE + '?text=' + encodeURIComponent(MSG);
    a.target = '_blank';
    a.rel = 'noopener';
    a.setAttribute('aria-label', 'Chat with us on WhatsApp');
    a.innerHTML =
      '<svg viewBox="0 0 32 32" width="30" height="30" aria-hidden="true" fill="currentColor">' +
      '<path d="M16 3C9.4 3 4 8.4 4 15c0 2.1.6 4.1 1.6 5.9L4 29l8.3-1.6c1.7.9 3.7 1.4 5.7 1.4 6.6 0 12-5.4 12-12S22.6 3 16 3zm0 21.8c-1.8 0-3.5-.5-5-1.4l-.4-.2-3.7.7.7-3.6-.2-.4c-1-1.6-1.5-3.4-1.5-5.3 0-5.5 4.5-9.9 9.9-9.9 5.5 0 9.9 4.5 9.9 9.9.1 5.4-4.4 9.9-9.7 9.9zm5.5-7.4c-.3-.1-1.8-.9-2-1-.3-.1-.5-.1-.7.1-.2.3-.8 1-.9 1.2-.2.2-.3.2-.6.1-1.8-.9-3-1.6-4.2-3.6-.3-.5.3-.5.9-1.6.1-.2 0-.4 0-.5-.1-.1-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.2.2 2.1 3.3 5.2 4.6 2.9 1.2 2.9.8 3.5.8.5-.1 1.8-.7 2-1.4.3-.7.3-1.3.2-1.4-.1-.2-.3-.2-.6-.4z"/></svg>' +
      '<span class="wa-label">Chat with us</span>';
    document.body.appendChild(a);
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
          '<p class="cart-fine">Secure payment by Stripe. You choose your kits, then pay on Stripe’s hosted checkout.</p>' +
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

    function showErr(msg) {
      errEl.textContent = msg || 'Something went wrong. Please try again.';
      errEl.hidden = false;
    }
    function checkout() {
      var items = read();
      if (!items.length) return;
      errEl.hidden = true;
      var email = (emailInput.value || '').trim();
      if (email && validEmail(email)) { try { localStorage.setItem(LEAD, email); } catch (e) {} }
      checkoutBtn.disabled = true;
      checkoutBtn.innerHTML = 'Redirecting…';
      if (window.gtag) window.gtag('event', 'begin_checkout', { currency: 'USD', value: subtotalCents() / 100 });
      if (window.fbq) window.fbq('track', 'InitiateCheckout');
      fetch('/api/checkout', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map(function (i) { return { slug: i.slug, qty: i.qty }; }),
          email: (email && validEmail(email)) ? email : undefined
        })
      }).then(function (r) {
        return r.json().then(function (d) { return { ok: r.ok, d: d }; }, function () { return { ok: false, d: {} }; });
      }).then(function (res) {
        if (res.ok && res.d && res.d.url) { window.location.href = res.d.url; return; }
        showErr(res.d && res.d.error);
        checkoutBtn.disabled = false;
        checkoutBtn.innerHTML = 'Checkout <span class="arrow">&rarr;</span>';
      }).catch(function () {
        showErr();
        checkoutBtn.disabled = false;
        checkoutBtn.innerHTML = 'Checkout <span class="arrow">&rarr;</span>';
      });
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
      [].forEach.call(document.querySelectorAll('a[href*="buy.stripe.com"]'), function (a) {
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
    if (/\/(thank-you|home-safety-check|unsubscribed)$/.test(path)) return;
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
    var heroBtn = document.querySelector('.page-hero a[href*="buy.stripe.com"]');
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
