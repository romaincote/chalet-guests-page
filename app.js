/* ═══════════════════════════════════════════════════
   COCO CHALET — Guest Page App
   - Checklist persistence (daily reset)
   - Shop & season filters
   - Smooth pill scroll
   - WiFi password copy button
═══════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ─────────────────────────────────────────────
     CONSTANTS
     NOTE: CHALET_NAME and WIFI_SSID are intentionally
     separate. The chalet name may change; the WiFi SSID
     is fixed hardware config. Do NOT merge them.
  ───────────────────────────────────────────────── */
  var CHALET_NAME   = 'Coco Chalet';  // update here when owner renames
  var WIFI_SSID     = 'Coco Chalet';  // hardware SSID — keep separate
  var WIFI_PASSWORD = '12345678';

  var LS_DATE_KEY   = 'chalet-checklist-date';
  var CHECKLIST_KEYS = [
    'arriving-1', 'arriving-2', 'arriving-3', 'arriving-4',
    'departing-1', 'departing-2', 'departing-3', 'departing-4', 'departing-5', 'departing-6'
  ];

  /* ─────────────────────────────────────────────
     DAILY RESET
     If the stored date differs from today, wipe all
     checklist keys before restoring state.
  ───────────────────────────────────────────────── */
  function getTodayString() {
    var d = new Date();
    return d.getFullYear() + '-' +
      String(d.getMonth() + 1).padStart(2, '0') + '-' +
      String(d.getDate()).padStart(2, '0');
  }

  function maybeResetChecklist() {
    var today = getTodayString();
    var stored = localStorage.getItem(LS_DATE_KEY);
    if (stored !== today) {
      CHECKLIST_KEYS.forEach(function (key) {
        localStorage.removeItem('chalet-check-' + key);
      });
      localStorage.setItem(LS_DATE_KEY, today);
    }
  }

  /* ─────────────────────────────────────────────
     CHECKLISTS
  ───────────────────────────────────────────────── */
  function initChecklists() {
    maybeResetChecklist();

    var checkboxes = document.querySelectorAll('.checklist-checkbox');

    checkboxes.forEach(function (cb) {
      var key = cb.getAttribute('data-key');
      if (!key) return;

      // Restore persisted state
      var stored = localStorage.getItem('chalet-check-' + key);
      if (stored === 'true') {
        cb.checked = true;
        applyDoneStyle(cb);
      }

      cb.addEventListener('change', function () {
        localStorage.setItem('chalet-check-' + key, cb.checked ? 'true' : 'false');
        applyDoneStyle(cb);
      });
    });
  }

  function applyDoneStyle(cb) {
    var item = cb.closest('.checklist-item');
    if (!item) return;
    if (cb.checked) {
      item.classList.add('is-done');
    } else {
      item.classList.remove('is-done');
    }
  }

  /* ─────────────────────────────────────────────
     FILTER SYSTEM (Shops + Activities)
     Cards default to visible. JS adds .hidden to
     non-matching cards. JS-disabled: everything shows.
  ───────────────────────────────────────────────── */
  function initFilters() {
    var filterBars = document.querySelectorAll('.filter-bar');

    filterBars.forEach(function (bar) {
      var btns = bar.querySelectorAll('.filter-btn');

      btns.forEach(function (btn) {
        btn.addEventListener('click', function () {
          // Update active state on buttons in this bar
          btns.forEach(function (b) {
            b.classList.remove('active');
            b.setAttribute('aria-selected', 'false');
          });
          btn.classList.add('active');
          btn.setAttribute('aria-selected', 'true');

          var filterGroup = btn.getAttribute('data-filter');
          var value       = btn.getAttribute('data-value');
          applyFilter(filterGroup, value);
        });
      });
    });
  }

  function applyFilter(filterGroup, value) {
    var grid;
    var attrName;

    if (filterGroup === 'commerces') {
      grid     = document.getElementById('commerces-grid');
      attrName = 'data-category';
    } else if (filterGroup === 'activites') {
      grid     = document.getElementById('activites-grid');
      attrName = 'data-season';
    }

    if (!grid) return;

    var cards = grid.querySelectorAll('.place-card');
    cards.forEach(function (card) {
      if (value === 'all') {
        card.classList.remove('hidden');
      } else {
        var attrValue = card.getAttribute(attrName) || '';
        // data-season may contain multiple values ("ete hiver")
        var tokens = attrValue.split(/\s+/);
        if (tokens.indexOf(value) !== -1) {
          card.classList.remove('hidden');
        } else {
          card.classList.add('hidden');
        }
      }
    });
  }

  /* ─────────────────────────────────────────────
     PILL SMOOTH SCROLL
     Fallback in case CSS scroll-behavior isn't enough
     on older browsers; HTML already has the anchors.
  ───────────────────────────────────────────────── */
  function initPillScroll() {
    var pills = document.querySelectorAll('.pill[href]');
    pills.forEach(function (pill) {
      pill.addEventListener('click', function (e) {
        var href = pill.getAttribute('href');
        if (!href || href.charAt(0) !== '#') return;
        var target = document.querySelector(href);
        if (!target) return;
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
      });
    });
  }

  /* ─────────────────────────────────────────────
     COPY BUTTON
  ───────────────────────────────────────────────── */
  function initCopyButtons() {
    var buttons = document.querySelectorAll('.copy-btn[data-copy]');
    buttons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var text = btn.getAttribute('data-copy');
        if (!text) return;

        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(function () {
            showCopied(btn);
          }).catch(function () {
            fallbackCopy(text, btn);
          });
        } else {
          fallbackCopy(text, btn);
        }
      });
    });
  }

  function fallbackCopy(text, btn) {
    try {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      ta.style.top  = '-9999px';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      showCopied(btn);
    } catch (err) {
      // Silent fail — the password is still visible on screen
    }
  }

  function showCopied(btn) {
    var original = btn.textContent;
    btn.textContent = 'Copié !';
    btn.classList.add('copied');
    setTimeout(function () {
      btn.textContent = original;
      btn.classList.remove('copied');
    }, 2000);
  }

  /* ─────────────────────────────────────────────
     CHALET NAME INJECTION
     All [data-chalet-name] elements are populated
     from the CHALET_NAME constant so they can be
     updated in one place.
  ───────────────────────────────────────────────── */
  function injectChaletName() {
    var els = document.querySelectorAll('[data-chalet-name]');
    els.forEach(function (el) {
      el.textContent = CHALET_NAME;
    });
  }

  /* ─────────────────────────────────────────────
     INIT
  ───────────────────────────────────────────────── */
  function init() {
    injectChaletName();
    initChecklists();
    initFilters();
    initPillScroll();
    initCopyButtons();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
