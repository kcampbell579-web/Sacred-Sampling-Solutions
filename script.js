/* Sacred Sampling Solutions — homepage interactions */
(function () {
  'use strict';

  // --- Mobile menu toggle ---
  var toggle = document.querySelector('.nav-toggle');
  var menu = document.getElementById('mobile-menu');

  if (toggle && menu) {
    var setOpen = function (open) {
      toggle.setAttribute('aria-expanded', String(open));
      menu.hidden = !open;
      menu.classList.toggle('is-open', open);
    };

    toggle.addEventListener('click', function () {
      setOpen(toggle.getAttribute('aria-expanded') !== 'true');
    });

    // Close after tapping a link
    menu.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () { setOpen(false); });
    });

    // Reset menu state when resizing up to desktop
    window.addEventListener('resize', function () {
      if (window.innerWidth > 760) setOpen(false);
    });
  }

  // --- Current year in footer ---
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // --- Accordion: keep only one FAQ open at a time ---
  var accItems = document.querySelectorAll('.accordion .acc');
  accItems.forEach(function (item) {
    item.addEventListener('toggle', function () {
      if (item.open) {
        accItems.forEach(function (other) {
          if (other !== item) other.open = false;
        });
      }
    });
  });
})();
