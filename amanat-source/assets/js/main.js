(function () {
  "use strict";

  // Mobile menu toggle (all pages)
  document.querySelectorAll('[data-menu-toggle]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var nav = document.querySelector('[data-menu-nav]');
      if (!nav) return;
      var isOpen = nav.style.display !== 'none';
      nav.style.display = isOpen ? 'none' : 'flex';
    });
  });
  document.querySelectorAll('[data-menu-close]').forEach(function (a) {
    a.addEventListener('click', function () {
      var nav = document.querySelector('[data-menu-nav]');
      if (nav) nav.style.display = 'none';
    });
  });

  // Home page only: scroll-linked invert effect + bestseller carousel
  var categorySection = document.querySelector('[data-category-section]');
  if (!categorySection) return;

  function lerp(a, b, t) { return Math.round(a + (b - a) * t); }
  function clamp01(v) { return Math.max(0, Math.min(1, v)); }

  var pageBg = document.querySelector('[data-page-bg]');
  var trustBar = document.querySelector('[data-trust-bar]');
  var trustMarquee = document.querySelectorAll('[data-trust-marquee]');
  var catTitle = document.querySelector('[data-category-title]');
  var bestsellersSection = document.querySelector('[data-bestsellers-section]');

  function onScroll() {
    var rect = categorySection.getBoundingClientRect();
    var vh = window.innerHeight;
    var enter = (vh - rect.top) / (vh * 0.6);
    var exit = rect.bottom / (vh * 0.6);
    var p = clamp01(Math.min(enter, exit));
    var bg = 'rgb(' + lerp(255, 10, p) + ',' + lerp(255, 10, p) + ',' + lerp(255, 12, p) + ')';
    var fg = 'rgb(' + lerp(1, 255, p) + ',' + lerp(2, 255, p) + ',' + lerp(5, 255, p) + ')';
    if (pageBg) pageBg.style.background = bg;
    if (trustBar) {
      trustBar.style.background = bg;
      trustBar.style.borderColor = p > 0.5 ? 'rgba(255,255,255,.14)' : 'rgba(1,2,5,.08)';
    }
    trustMarquee.forEach(function (el) { el.style.color = fg; });
    if (catTitle) catTitle.style.color = fg;
    if (bestsellersSection) bestsellersSection.style.background = bg;
  }
  var scrollTicking = false;
  window.addEventListener('scroll', function () {
    if (scrollTicking) return;
    scrollTicking = true;
    requestAnimationFrame(function () {
      onScroll();
      scrollTicking = false;
    });
  }, { passive: true });
  onScroll();

  // Bestseller carousel
  var stageWrap = document.querySelector('[data-carousel-wheel]');
  if (!stageWrap) return;
  var slides = Array.prototype.slice.call(stageWrap.querySelectorAll('[data-carousel-slide]'));
  var data = window.__bestsellers || [];
  var n = data.length;
  if (!n) return;

  var nameEl = document.querySelector('[data-bestseller-name]');
  var priceEl = document.querySelector('[data-bestseller-price]');
  var noteEl = document.querySelector('[data-bestseller-note]');
  var linkEl = document.querySelector('[data-bestseller-link]');

  var pointer = 1;
  var prevD = [];
  var loopTimer = null;

  function render() {
    var activeIndex = ((pointer - 1) % n + n) % n;
    slides.forEach(function (slide, s) {
      var d = s - pointer;
      var visible = Math.abs(d) <= 1;
      var opacity = d === 0 ? 1 : (visible ? 0.35 : 0);
      var prev = prevD[s];
      var jump = prev === undefined ? 0 : Math.abs(d - prev);
      var transition = jump > 1.5 ? 'none' : 'transform .5s cubic-bezier(.25,.1,.25,1), opacity .5s ease';
      prevD[s] = d;
      slide.style.cursor = visible ? 'pointer' : 'default';
      slide.style.pointerEvents = visible ? 'auto' : 'none';
      slide.style.transform = 'translate(calc(-50% + ' + (d * 92) + '%), -50%)';
      slide.style.opacity = String(opacity);
      slide.style.zIndex = String(10 - Math.abs(d));
      slide.style.transition = transition;
    });
    var b = data[activeIndex];
    if (nameEl) nameEl.textContent = b.name;
    if (priceEl) priceEl.textContent = b.price;
    if (noteEl) noteEl.textContent = b.note;
    if (linkEl) linkEl.href = b.href;
  }

  function setActiveDot(realIdx) {
    clearTimeout(loopTimer);
    pointer = realIdx + 1;
    render();
  }
  function goNext() {
    pointer++;
    render();
    if (pointer === n + 1) {
      clearTimeout(loopTimer);
      loopTimer = setTimeout(function () { pointer = 1; render(); }, 520);
    }
  }
  function goPrev() {
    pointer--;
    render();
    if (pointer === 0) {
      clearTimeout(loopTimer);
      loopTimer = setTimeout(function () { pointer = n; render(); }, 520);
    }
  }

  slides.forEach(function (slide, s) {
    slide.addEventListener('click', function () {
      setActiveDot(((s - 1) % n + n) % n);
    });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft') goPrev();
    if (e.key === 'ArrowRight') goNext();
  });
  var lastWheelNav = 0;
  stageWrap.addEventListener('wheel', function (e) {
    if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
    var now = Date.now();
    if (now - lastWheelNav < 550) return;
    if (Math.abs(e.deltaX) < 12) return;
    lastWheelNav = now;
    if (e.deltaX > 0) goNext(); else goPrev();
  });

  // Touch swipe support (mobile has no wheel events)
  var touchStartX = 0, touchStartY = 0, touchActive = false;
  stageWrap.addEventListener('touchstart', function (e) {
    if (e.touches.length !== 1) return;
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    touchActive = true;
  }, { passive: true });
  stageWrap.addEventListener('touchend', function (e) {
    if (!touchActive) return;
    touchActive = false;
    var touch = e.changedTouches[0];
    var dx = touch.clientX - touchStartX;
    var dy = touch.clientY - touchStartY;
    if (Math.abs(dx) < 30 || Math.abs(dx) <= Math.abs(dy)) return;
    if (dx < 0) goNext(); else goPrev();
  }, { passive: true });

  render();
})();

// Contact-channel picker modal: "Тест-драйв" / "Написать" buttons let the
// visitor choose WhatsApp, Telegram or a phone call instead of forcing WhatsApp.
(function () {
  "use strict";
  var modal = document.getElementById('contact-modal');
  if (!modal) return;
  var waLink = modal.querySelector('[data-modal-wa]');
  var tgLink = modal.querySelector('[data-modal-tg]');
  var lastFocused = null;

  function openModal(waHref, tgHref) {
    waLink.href = waHref;
    tgLink.href = tgHref;
    lastFocused = document.activeElement;
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
  }
  function closeModal() {
    modal.hidden = true;
    document.body.style.overflow = '';
    if (lastFocused && lastFocused.focus) lastFocused.focus();
  }

  modal.querySelectorAll('[data-modal-close]').forEach(function (el) {
    el.addEventListener('click', closeModal);
  });
  modal.querySelectorAll('.contact-modal__option').forEach(function (el) {
    el.addEventListener('click', closeModal);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !modal.hidden) closeModal();
  });
  document.querySelectorAll('[data-contact-cta]').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      openModal(btn.getAttribute('data-wa'), btn.getAttribute('data-tg'));
    });
  });
})();

// "Back" links on product pages point at that model's primary catalog by
// default, but a product can also be listed in a second catalog (e.g. Kugoo
// V6 shows up under both couriers and riders). If the visitor actually came
// from this same site, prefer real browser history so "back" returns them
// to whichever catalog they were browsing instead of always the default one -
// and update the link's label/href to match, so it reads correctly even if
// history navigation doesn't apply.
(function () {
  "use strict";
  var CATALOG_LABELS = {
    'catalog-couriers.html': 'Электровелосипеды для курьеров',
    'catalog-riders.html': 'Электробайки для себя',
    'catalog-scooters.html': 'Электросамокаты для города'
  };
  var fromSite = document.referrer && document.referrer.indexOf(location.origin) === 0;
  var refPage = fromSite ? document.referrer.split('/').pop().split('?')[0].split('#')[0] : '';
  document.querySelectorAll('[data-smart-back]').forEach(function (link) {
    if (refPage && CATALOG_LABELS[refPage]) {
      link.setAttribute('href', refPage);
      var labelEl = link.querySelector('[data-smart-back-label]');
      if (labelEl) labelEl.textContent = CATALOG_LABELS[refPage];
    }
    link.addEventListener('click', function (e) {
      if (fromSite && window.history.length > 1) {
        e.preventDefault();
        window.history.back();
      }
    });
  });
})();
