/* Cookie consent + gated analytics, with Google Consent Mode v2.
   - The Google tag (GA4 + Google Ads) loads on every page with consent
     DEFAULTED TO DENIED, so Google receives cookieless "modeled" pings even
     from visitors who decline or ignore the banner (no cookies are set until
     they accept). On Accept, consent is UPDATED to granted for full measurement.
   - Meta Pixel and Microsoft Clarity have no Consent Mode, so they load only
     after the visitor accepts.
   - Vercel Web Analytics is cookieless and loads separately. */
(function () {
  var GA_ID = "G-KDPVGW9JPK";
  var GADS_ID = "AW-18399559838"; // Google Ads (conversion tracking / remarketing)
  var CLARITY_ID = "y22uptqeoi";   // Microsoft Clarity project ID
  var META_PIXEL_ID = "3647281315287094"; // Facebook / Meta Pixel
  var KEY = "sss_consent"; // stored value: "granted" | "denied"

  // gtag shim (must exist before we push consent/config commands)
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = gtag;

  // Capture ad attribution on landing so it survives the off-site Stripe
  // checkout and can be re-attached to the purchase on thank-you.
  (function captureAttribution() {
    try {
      var q = new URLSearchParams(location.search), a = {};
      ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "gclid", "fbclid"]
        .forEach(function (k) { if (q.get(k)) a[k] = q.get(k); });
      if (Object.keys(a).length) { a.landing = location.pathname; localStorage.setItem("sss_attr", JSON.stringify(a)); }
    } catch (e) {}
  })();

  var choice = null;
  try { choice = localStorage.getItem(KEY); } catch (e) {}

  // Consent Mode v2 — default everything to denied BEFORE the tag loads.
  // (If the visitor previously granted, we set granted straight away.)
  var granted = choice === "granted";
  gtag("consent", "default", {
    ad_storage: granted ? "granted" : "denied",
    analytics_storage: granted ? "granted" : "denied",
    ad_user_data: granted ? "granted" : "denied",
    ad_personalization: granted ? "granted" : "denied",
    functionality_storage: granted ? "granted" : "denied",
    personalization_storage: granted ? "granted" : "denied",
    security_storage: "granted",
    wait_for_update: 500
  });

  // Load the Google tag on every page. With consent denied this sends
  // cookieless pings (modeled conversions); with consent granted it measures fully.
  (function loadGoogleTag() {
    if (window.__gaLoaded) return; window.__gaLoaded = true;
    var s = document.createElement("script");
    s.async = true; s.src = "https://www.googletagmanager.com/gtag/js?id=" + GA_ID;
    document.head.appendChild(s);
    gtag("js", new Date());
    gtag("config", GA_ID);
    if (GADS_ID) gtag("config", GADS_ID);
  })();

  function updateConsentGranted() {
    gtag("consent", "update", {
      ad_storage: "granted", analytics_storage: "granted",
      ad_user_data: "granted", ad_personalization: "granted",
      functionality_storage: "granted", personalization_storage: "granted"
    });
  }

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

  function loadClarity() {
    if (!CLARITY_ID || window.__clarityLoaded) return; window.__clarityLoaded = true;
    (function (c, l, a, r, i, t, y) {
      c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); };
      t = l.createElement(r); t.async = 1; t.src = "https://www.clarity.ms/tag/" + i;
      y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y);
    })(window, document, "clarity", "script", CLARITY_ID);
  }

  // Fire ViewContent on a kit product page (with or without the .html suffix).
  function trackViewContent() {
    if (!window.fbq) return;
    var m = location.pathname.match(/kit-([a-z0-9-]+)(?:\.html)?$/);
    if (!m) return;
    var nameEl = document.querySelector(".page-hero h1");
    var amtEl = document.querySelector(".page-hero .price .amt");
    var val = amtEl ? parseFloat(amtEl.textContent.replace(/[^0-9.]/g, "")) : NaN;
    var data = { content_type: "product", content_ids: [m[1]], content_name: nameEl ? nameEl.textContent.trim() : m[1] };
    if (!isNaN(val)) { data.value = val; data.currency = "USD"; }
    window.fbq("track", "ViewContent", data);
  }

  // Fire begin_checkout / InitiateCheckout when a Stripe buy link is clicked.
  // GA4 begin_checkout fires under Consent Mode regardless; Meta only if loaded.
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest('a[href*="buy.stripe.com"]');
    if (!a) return;
    var amtEl = document.querySelector(".buycard .price .amt, .page-hero .price .amt");
    var val = amtEl ? parseFloat(amtEl.textContent.replace(/[^0-9.]/g, "")) : NaN;
    if (window.gtag) { var ga = { currency: "USD" }; if (!isNaN(val)) ga.value = val; window.gtag("event", "begin_checkout", ga); }
    if (window.fbq) { var fb = { content_type: "product" }; if (!isNaN(val)) { fb.value = val; fb.currency = "USD"; } window.fbq("track", "InitiateCheckout", fb); }
  }, true);

  function enable() { updateConsentGranted(); loadMetaPixel(); loadClarity(); }

  if (choice === "granted") { enable(); return; }
  if (choice === "denied") { return; } // consent stays denied; Meta/Clarity never load

  function save(v) { try { localStorage.setItem(KEY, v); } catch (e) {} }

  function showBanner() {
    var d = document.createElement("div");
    d.className = "cookie-banner";
    d.setAttribute("role", "dialog");
    d.setAttribute("aria-label", "Cookie consent");
    d.innerHTML =
      '<div class="cookie-inner">' +
      '<p>We use cookies for analytics to understand how our site is used. See our <a href="privacy">Privacy Policy</a>.</p>' +
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
