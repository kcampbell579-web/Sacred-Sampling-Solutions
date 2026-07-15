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

  // --- Education library search/filter (no-op on pages without it) ---
  var eduInput = document.getElementById('eduSearch');
  if (eduInput) {
    var items = Array.prototype.slice.call(document.querySelectorAll('[data-tags]'));
    var groups = Array.prototype.slice.call(document.querySelectorAll('[data-searchgroup]'));
    var noResults = document.getElementById('eduNoResults');

    var applyFilter = function (raw) {
      var q = (raw || '').trim().toLowerCase();
      var anyVisible = false;

      items.forEach(function (el) {
        var hay = (el.getAttribute('data-tags') + ' ' + el.textContent).toLowerCase();
        var show = !q || hay.indexOf(q) !== -1;
        el.classList.toggle('search-hidden', !show);
        if (show) anyVisible = true;
      });

      // Hide a section whose items are all filtered out
      groups.forEach(function (group) {
        var groupItems = group.querySelectorAll('[data-tags]');
        if (!groupItems.length) return;
        var visible = group.querySelectorAll('[data-tags]:not(.search-hidden)').length;
        group.classList.toggle('search-hidden', q && visible === 0);
      });

      if (noResults) noResults.hidden = !(q && !anyVisible);
    };

    var debounce;
    eduInput.addEventListener('input', function () {
      clearTimeout(debounce);
      debounce = setTimeout(function () { applyFilter(eduInput.value); }, 120);
    });

    document.querySelectorAll('.edu-chips .chip').forEach(function (chip) {
      chip.addEventListener('click', function () {
        eduInput.value = chip.getAttribute('data-q') || chip.textContent;
        applyFilter(eduInput.value);
        eduInput.focus();
      });
    });
  }
})();
