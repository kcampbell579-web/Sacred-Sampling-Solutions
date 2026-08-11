/* Cookie consent + gated analytics.
   Google Analytics and Microsoft Clarity load ONLY after the visitor accepts.
   Vercel Web Analytics is cookieless and loads separately (no consent needed). */
(function () {
  var GA_ID = "G-KDPVGW9JPK";
  var CLARITY_ID = "xnia2cvcli"; // Microsoft Clarity project ID
  var META_PIXEL_ID = "3647281315287094"; // Facebook / Meta Pixel
  var KEY = "sss_consent"; // stored value: "granted" | "denied"

  function loadMetaPixel() {
    if (!META_PIXEL_ID || window.__fbqLoaded) return; window.__fbqLoaded = true;
    !function (f, b, e, v, n, t, s) {
      if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
      if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = "2.0"; n.queue = [];
      t = b.createElement(e); t.async = !0; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
    }(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
    window.fbq("init", META_PIXEL_ID);
    window.fbq("track", "PageView");
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", trackViewContent);
    else trackViewContent();
  }

  // Fire ViewContent on a kit product page (kit-<slug>.html).
  function trackViewContent() {
    if (!window.fbq) return;
    var m = location.pathname.match(/kit-([a-z0-9-]+)\.html$/);
    if (!m) return;
    var nameEl = document.querySelector(".page-hero h1");
    var amtEl = document.querySelector(".page-hero .price .amt");
    var val = amtEl ? parseFloat(amtEl.textContent.replace(/[^0-9.]/g, "")) : NaN;
    var data = { content_type: "product", content_ids: [m[1]], content_name: nameEl ? nameEl.textContent.trim() : m[1] };
    if (!isNaN(val)) { data.value = val; data.currency = "USD"; }
    window.fbq("track", "ViewContent", data);
  }

  // Fire InitiateCheckout when a Stripe buy link is clicked (only if the pixel
  // is loaded, i.e. the visitor consented).
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest('a[href*="buy.stripe.com"]');
    if (!a) return;
    var amtEl = document.querySelector(".buycard .price .amt, .page-hero .price .amt");
    var val = amtEl ? parseFloat(amtEl.textContent.replace(/[^0-9.]/g, "")) : NaN;
    // Meta: InitiateCheckout
    if (window.fbq) {
      var fb = { content_type: "product" };
      if (!isNaN(val)) { fb.value = val; fb.currency = "USD"; }
      window.fbq("track", "InitiateCheckout", fb);
    }
    // GA4 / Google Ads: begin_checkout (import as a conversion in Google Ads)
    if (window.gtag) {
      var ga = { currency: "USD" };
      if (!isNaN(val)) ga.value = val;
      window.gtag("event", "begin_checkout", ga);
    }
  }, true);

  function loadGA() {
    if (window.__gaLoaded) return; window.__gaLoaded = true;
    var s = document.createElement("script");
    s.async = true; s.src = "https://www.googletagmanager.com/gtag/js?id=" + GA_ID;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag("js", new Date());
    window.gtag("config", GA_ID);
  }

  function loadClarity() {
    if (!CLARITY_ID || window.__clarityLoaded) return; window.__clarityLoaded = true;
    (function (c, l, a, r, i, t, y) {
      c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); };
      t = l.createElement(r); t.async = 1; t.src = "https://www.clarity.ms/tag/" + i;
      y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y);
    })(window, document, "clarity", "script", CLARITY_ID);
  }

  function enable() { loadGA(); loadClarity(); loadMetaPixel(); }

  var choice = null;
  try { choice = localStorage.getItem(KEY); } catch (e) {}
  if (choice === "granted") { enable(); return; }
  if (choice === "denied") { return; }

  function save(v) { try { localStorage.setItem(KEY, v); } catch (e) {} }

  function showBanner() {
    var d = document.createElement("div");
    d.className = "cookie-banner";
    d.setAttribute("role", "dialog");
    d.setAttribute("aria-label", "Cookie consent");
    d.innerHTML =
      '<div class="cookie-inner">' +
      '<p>We use cookies for analytics to understand how our site is used. See our <a href="privacy.html">Privacy Policy</a>.</p>' +
      '<div class="cookie-actions">' +
      '<button type="button" class="ck-decline">Decline</button>' +
      '<button type="button" class="ck-accept">Accept</button>' +
      "</div></div>";
    document.body.appendChild(d);
    d.querySelector(".ck-accept").addEventListener("click", function () { save("granted"); enable(); d.remove(); });
    d.querySelector(".ck-decline").addEventListener("click", function () { save("denied"); d.remove(); });
  }

  if (document.body) showBanner();
  else document.addEventListener("DOMContentLoaded", showBanner);
})();
