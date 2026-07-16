/* Cookie consent + gated analytics.
   Google Analytics and Microsoft Clarity load ONLY after the visitor accepts.
   Vercel Web Analytics is cookieless and loads separately (no consent needed). */
(function () {
  var GA_ID = "G-KDPVGW9JPK";
  var CLARITY_ID = "xnia2cvcli"; // Microsoft Clarity project ID
  var KEY = "sss_consent"; // stored value: "granted" | "denied"

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

  function enable() { loadGA(); loadClarity(); }

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
