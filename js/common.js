/*
 * HORÆ: shared behaviour for every page. Marks, image slots, the nav and its tone,
 * word reveals, iris reveals, the reservation list, the toast and the motion setting.
 */
(function (root) {
  var d = document.documentElement;
  var $$ = function (s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); };
  var reduce = function () { return d.classList.contains('reduce'); };
  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  var smooth = function (a, b, v) { var t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

  /* marks */
  $$('[data-mark]').forEach(function (el) { el.innerHTML = root.HZ_ART.mark(); });

  /* image slots */
  root.HZ_MEDIA.all();

  /* headings that rise word by word from behind a mask */
  $$('[data-split]').forEach(function (el) {
    var html = el.innerHTML.trim().split(/(<br\s*\/?>)/i);
    var n = 0;
    el.innerHTML = html.map(function (part) {
      if (/^<br/i.test(part)) return part;
      return part.split(/\s+/).filter(Boolean).map(function (w) {
        return '<span class="w"><span style="transition-delay:' + (n++ * 55) + 'ms">' + w + '</span></span>';
      }).join(' ');
    }).join('');
    el.classList.add('rv-words');
  });

  /* scroll: one listener, many subscribers */
  var subs = [], ticking = false;
  function frame() {
    ticking = false;
    var y = window.scrollY;
    for (var i = 0; i < subs.length; i++) subs[i](y);
  }
  function kick() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }
  window.addEventListener('scroll', kick, { passive: true });
  window.addEventListener('resize', kick);
  var onScroll = function (fn) { subs.push(fn); fn(window.scrollY); };

  /* nav: takes the tone of whatever section is under it; tucks away reading down */
  var nav = document.querySelector('[data-nav]');
  var lastY = 0;
  var navTone = null; /* a page can set this to drive the tone itself (the day sequence does) */
  if (nav) onScroll(function (y) {
    nav.classList.toggle('is-solid', y > 40);
    var down = y > lastY + 4, up = y < lastY - 4;
    if (down && y > window.innerHeight * 0.9) nav.classList.add('is-hidden');
    else if (up || y < 80) nav.classList.remove('is-hidden');
    lastY = y;
    var tone = navTone && navTone(y);
    if (!tone) {
      var probe = 30;
      var secs = $$('[data-tone]');
      for (var i = secs.length - 1; i >= 0; i--) {
        var r = secs[i].getBoundingClientRect();
        if (r.top <= probe && r.bottom > probe) { tone = secs[i].getAttribute('data-tone'); break; }
      }
    }
    nav.setAttribute('data-on', tone || 'light');
  });

  /* ───────── smooth scrolling ─────────
     Lenis on desktop with full motion. It drives the real window scroll, so every scroll scene
     keeps reading window.scrollY and getBoundingClientRect as before. Off on touch screens,
     under "reduce", and under ?sync (the hidden test pane never fires animation frames). */
  var lenis = null;
  var touch = root.matchMedia('(hover: none) and (pointer: coarse)').matches;
  var testing = /[?&]sync\b/.test(location.search);
  function smoothOn() {
    if (lenis || reduce() || touch || testing || !root.Lenis) return;
    lenis = new root.Lenis({ autoRaf: true, lerp: 0.09, wheelMultiplier: 0.9, respectReducedMotion: false });
    lenis.on('scroll', kick);
  }
  function smoothOff() { if (lenis) { lenis.destroy(); lenis = null; } }
  smoothOn();

  /* same-page anchors: a long jump plays as a fast-forward (clicking Reserve runs the whole day past you).
     Handled here rather than by Lenis's own anchor option, which leaves the browser's instant jump in place. */
  var easeInOut = function (t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
  function goTo(target) {
    if (lenis) {
      var screens = Math.abs(target.getBoundingClientRect().top) / window.innerHeight;
      lenis.scrollTo(target, { duration: clamp(0.9 + screens * 0.075, 0.9, 2.8), easing: easeInOut });
    } else {
      target.scrollIntoView({ behavior: reduce() || testing ? 'instant' : 'smooth', block: 'start' });
    }
    if (!target.hasAttribute('tabindex') && !/^(A|BUTTON|INPUT|SELECT|TEXTAREA)$/.test(target.tagName)) target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
  }
  document.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target.closest && e.target.closest('a[href*="#"]');
    if (!a) return;
    var url = new URL(a.href, location.href);
    if (url.origin !== location.origin || url.pathname !== location.pathname || !url.hash) return;
    var target = document.getElementById(decodeURIComponent(url.hash.slice(1)));
    if (!target) return;
    e.preventDefault();
    goTo(target);
    if (history.replaceState) history.replaceState(null, '', url.hash);
  });

  /* ───────── page morphs (View Transitions between pages) ─────────
     A watch page names its hero watch "watch-<id>" and its title "name-<id>".
     On the page you leave, names are given only to the parts of the thing you clicked, at the moment
     you leave, because a watch appears in several places on the home page and two elements with the
     same name cancel the whole transition. A clickable group is [data-morph="<id>"]; its parts are
     [data-morph-part="watch|name"] inside it, or anywhere with [data-morph-for="<id>"]. */
  var lastLink = null, morphed = [];
  document.addEventListener('click', function (e) { var a = e.target.closest && e.target.closest('a[href]'); if (a) lastLink = a; }, true);
  function nameIt(el, name, cls) {
    if (!el) return;
    el.style.viewTransitionName = name;
    el.style.viewTransitionClass = cls;
    morphed.push(el);
  }
  function clearMorph() {
    morphed.forEach(function (el) { el.style.viewTransitionName = ''; el.style.viewTransitionClass = ''; });
    morphed = [];
  }
  function partOf(group, id, part) {
    return group.querySelector('[data-morph-part="' + part + '"]') ||
      document.querySelector('[data-morph-for="' + id + '"][data-morph-part="' + part + '"]');
  }
  function guard(t) {
    /* a transition the browser aborts (background tab, quick reload) rejects these; that is not an error */
    [t.ready, t.finished, t.updateCallbackDone].forEach(function (p) { if (p && p.catch) p.catch(function () {}); });
  }
  root.addEventListener('pageswap', function (e) {
    var t = e.viewTransition;
    if (!t) return;
    guard(t);
    if (reduce()) { t.skipTransition(); return; }
    var dest = e.activation && e.activation.entry && e.activation.entry.url;
    var group = lastLink && dest && lastLink.href === dest && lastLink.closest('[data-morph]');
    if (!group) return;
    var id = group.getAttribute('data-morph');
    nameIt(partOf(group, id, 'watch'), 'watch-' + id, 'watch');
    nameIt(partOf(group, id, 'name'), 'name-' + id, 'name');
  });
  root.addEventListener('pagereveal', function (e) {
    var t = e.viewTransition;
    if (!t) return;
    guard(t);
    if (reduce()) t.skipTransition();
    /* coming back through the history cache, the names set on the way out are still there: the watch
       flies back to where it came from. Clear them once that is done. */
    t.finished.then(clearMorph, clearMorph);
  });
  root.addEventListener('pageshow', function (e) { if (e.persisted) setTimeout(clearMorph, 1500); });

  /* entrance reveals */
  var io = 'IntersectionObserver' in root ? new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return;
      e.target.classList.add('is-in');
      io.unobserve(e.target);
    });
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.1 }) : null;
  function watch(scope) {
    $$('.rv, .rv-words', scope).forEach(function (el) {
      if (io && !reduce()) io.observe(el);
      else el.classList.add('is-in');
    });
  }
  watch();

  /* iris: an image opens like an aperture as it scrolls into view (scroll-linked, so it also runs backwards) */
  var irises = $$('[data-iris]');
  if (irises.length) onScroll(function () {
    var vh = window.innerHeight;
    irises.forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.bottom < -50 || r.top > vh + 50) return;
      var p = smooth(vh * 0.98, vh * 0.28, r.top);
      el.style.setProperty('--iris', (p * 75).toFixed(2) + '%');
      /* the gold ring sits on the aperture's edge, then fades as it opens fully */
      var ring = el.parentNode.querySelector('.iris__ring');
      if (ring) {
        ring.style.setProperty('--iris-n', (p * 1.72).toFixed(3));
        ring.style.setProperty('--iris-ring', (smooth(0, 0.08, p) * (1 - smooth(0.7, 1, p))).toFixed(3));
      }
    });
  });

  /* counters */
  var cio = 'IntersectionObserver' in root ? new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return;
      cio.unobserve(e.target);
      var el = e.target, to = +el.getAttribute('data-count'), t0 = null;
      if (reduce()) { el.textContent = to.toLocaleString('en-US'); return; }
      (function step(t) {
        if (t0 === null) t0 = t;
        var k = clamp((t - t0) / 1400, 0, 1);
        el.textContent = Math.round(to * (1 - Math.pow(1 - k, 3))).toLocaleString('en-US');
        if (k < 1) requestAnimationFrame(step);
      })(performance.now());
    });
  }, { threshold: 0.6 }) : null;
  $$('[data-count]').forEach(function (el) { if (cio) cio.observe(el); else el.textContent = el.getAttribute('data-count'); });

  /* toast */
  var toastEl = document.querySelector('[data-toast]'), toastT;
  function toast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add('is-on');
    clearTimeout(toastT);
    toastT = setTimeout(function () { toastEl.classList.remove('is-on'); }, 3200);
  }

  /* reservations (front end only: stored in this browser) */
  var KEY = 'horae.reserved';
  function readList() { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { return []; } }
  function paintList(bump) {
    var n = readList().length;
    $$('[data-res-count]').forEach(function (c) {
      c.textContent = n;
      c.hidden = !n;
      if (bump) { c.classList.remove('bump'); void c.offsetWidth; c.classList.add('bump'); }
    });
  }
  function reserve(item) {
    var list = readList();
    list.push(item);
    try { localStorage.setItem(KEY, JSON.stringify(list)); } catch (e) {}
    paintList(true);
  }
  paintList(false);
  /* the nav's Reserve always goes to the reserve form; if you have reserved already, it also says so */
  $$('[data-res]').forEach(function (b) {
    b.addEventListener('click', function () {
      var n = readList().length;
      if (n) toast(n + (n === 1 ? ' watch' : ' watches') + ' reserved in this browser. Reservations open at launch.');
    });
  });

  /* motion setting */
  /* the button sits faint at the top right of the nav; it says what it will do next */
  var mb = document.querySelector('[data-motion-toggle]');
  var mbLabel = mb && mb.querySelector('[data-motion-label]');
  function paintMotion() {
    if (!mb) return;
    var text = reduce() ? 'Full motion' : 'Reduce motion';
    if (mbLabel) mbLabel.textContent = text; else mb.textContent = text;
    mb.setAttribute('aria-label', text);
    mb.setAttribute('aria-pressed', String(reduce()));
  }
  if (mb) mb.addEventListener('click', function () {
    d.classList.toggle('reduce');
    try { localStorage.setItem('horae.motion', reduce() ? 'reduce' : 'full'); } catch (e) {}
    if (reduce()) smoothOff(); else smoothOn();
    paintMotion();
    $$('video').forEach(function (v) { if (reduce()) v.pause(); else v.play().catch(function () {}); });
    $$('.rv, .rv-words').forEach(function (el) { el.classList.add('is-in'); });
    kick();
  });
  paintMotion();

  /* the year */
  $$('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });

  root.HZ_UI = {
    $$: $$, onScroll: onScroll, toast: toast, reserve: reserve, watch: watch, reduce: reduce, kick: kick, clamp: clamp, smooth: smooth,
    setNavTone: function (fn) { navTone = fn; kick(); },
    goTo: goTo, lenis: function () { return lenis; },
  };
})(window);
