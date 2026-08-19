// Sacred Sampling Solutions — shared behavior
(function () {
  var root = document.documentElement;

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

  // Email capture before Stripe checkout.
  // Intercepts buy-button clicks, asks for an email once, stores the lead,
  // pre-fills it into Stripe, then continues to secure checkout.
  (function () {
    var LEAD = 'sss_lead';
    function validEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }
    function withEmail(url, email) {
      try { var u = new URL(url); if (email) u.searchParams.set('prefilled_email', email); return u.toString(); }
      catch (e) { return url; }
    }
    function go(url, email) { window.location.href = withEmail(url, email); }
    function ctx() {
      var h1 = document.querySelector('.page-hero h1');
      var amt = document.querySelector('.page-hero .price .amt, .buycard .price .amt');
      return { product: h1 ? h1.textContent.trim() : document.title, price: amt ? amt.textContent.trim() : '', page: location.pathname };
    }
    function capture(email, c) {
      try { localStorage.setItem(LEAD, email); } catch (e) {}
      try {
        fetch('https://formsubmit.co/ajax/info@sacredsamplingsolutions.com', {
          method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({ _subject: 'New checkout lead — ' + c.product, email: email, product: c.product, price: c.price, page: c.page })
        }).catch(function () {});
      } catch (e) {}
      if (window.gtag) window.gtag('event', 'generate_lead', { currency: 'USD' });
      if (window.fbq) window.fbq('track', 'Lead');
    }
    function openModal(stripe) {
      var c = ctx();
      var ov = document.createElement('div');
      ov.className = 'cogate';
      ov.innerHTML =
        '<div class="cogate-card" role="dialog" aria-modal="true" aria-label="Enter your email to continue">' +
        '<button type="button" class="cogate-x" aria-label="Close">&times;</button>' +
        '<span class="eyebrow">Almost there</span>' +
        '<h3>Where should we send your receipt &amp; results?</h3>' +
        '<p class="cogate-sub">Enter your email and we’ll take you to secure checkout' + (c.price ? ' — ' + c.product + ' (' + c.price + ')' : '') + '.</p>' +
        '<form class="cogate-form" novalidate>' +
        '<input type="email" name="email" inputmode="email" autocomplete="email" placeholder="you@email.com" aria-label="Email" required>' +
        '<div class="cogate-err" hidden>Please enter a valid email.</div>' +
        '<button type="submit" class="btn btn-gold">Continue to secure checkout <span class="arrow">&rarr;</span></button>' +
        '</form>' +
        '<p class="cogate-fine">We’ll email your receipt and kit updates. Secure payment by Stripe. No spam.</p>' +
        '</div>';
      document.body.appendChild(ov);
      document.body.style.overflow = 'hidden';
      var input = ov.querySelector('input[name=email]');
      var err = ov.querySelector('.cogate-err');
      setTimeout(function () { input.focus(); }, 30);
      function close() { document.body.style.overflow = ''; ov.remove(); }
      ov.querySelector('.cogate-x').addEventListener('click', close);
      ov.addEventListener('click', function (e) { if (e.target === ov) close(); });
      document.addEventListener('keydown', function esc(e) { if (e.key === 'Escape') { close(); document.removeEventListener('keydown', esc); } });
      ov.querySelector('.cogate-form').addEventListener('submit', function (e) {
        e.preventDefault();
        var email = input.value.trim();
        if (!validEmail(email)) { err.hidden = false; input.focus(); return; }
        capture(email, c);
        close();
        go(stripe, email);
      });
    }
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href*="buy.stripe.com"]');
      if (!a) return;
      var stripe = a.getAttribute('href');
      var saved = null; try { saved = localStorage.getItem(LEAD); } catch (x) {}
      e.preventDefault();
      if (saved && validEmail(saved)) { go(stripe, saved); return; } // already captured
      openModal(stripe);
    });
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
