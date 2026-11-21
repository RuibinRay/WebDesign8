/*
 * HORÆ home page.
 *
 *   1. One day: a pinned stage where scrolling is the clock. The sky, the sun and moon, the shadows
 *      the hands cast, the dial and the lume all follow the hour. Each watch holds the stage at its hour.
 *   2. The twelve names on a ring that turns as you pass.
 *   3. The calibre: tilts into 3D and comes apart layer by layer, each part labelled.
 *   4. The four hours: cards that stack, each sliding over the last.
 *   5. Reserve: front-end form.
 *
 * Every watch is its photograph, flat and face on, with live drawn hands. The day and the set come to rest on their states
 * after you stop scrolling, and ← / → step through them (see SETTLE AND STEPS at the end).
 */
(function (root) {
  var H = root.HORAE, ART = root.HZ_ART, UI = root.HZ_UI;
  var $ = function (s, el) { return (el || document).querySelector(s); };
  var clamp = UI.clamp, smooth = UI.smooth;
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var mobile = function () { return window.innerWidth < 760; };
  var pad2 = function (n) { return (n < 10 ? '0' : '') + n; };
  var hhmm = function (h) { h = ((h % 24) + 24) % 24; var m = Math.floor((h % 1) * 60 + 1e-6); return pad2(Math.floor(h)) + ':' + pad2(m); };
  var testing = /[?&]sync\b/.test(location.search);
  var calm = function () { return UI.reduce() || testing; };
  var esc = function (t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };

  /* ───────── colour helpers ───────── */
  var hex = function (h) { var n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
  var mix = function (a, b, t) { return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)]; };
  var css = function (c) { return 'rgb(' + Math.round(c[0]) + ',' + Math.round(c[1]) + ',' + Math.round(c[2]) + ')'; };
  var lum = function (c) { return (0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]) / 255; };

  /* ═════════ 1 · ONE DAY ═════════ */
  var stage = $('[data-day]');
  var section = $('#day');

  var skyAt = H.skyAt;

  /* scroll progress → clock hour. Plateaus hold each watch at its hour; between them the hands race. */
  var KF = [[0, 5.5], [0.06, 6.2], [0.2, 6.3], [0.32, 11.98], [0.46, 12.06], [0.58, 18.62], [0.7, 18.72], [0.82, 22.42], [0.96, 22.52], [1, 22.56]];
  function hourAt(p) {
    for (var i = 0; i < KF.length - 1; i++) {
      if (p <= KF[i + 1][0]) {
        var t = (p - KF[i][0]) / (KF[i + 1][0] - KF[i][0]);
        return lerp(KF[i][1], KF[i + 1][1], t * t * (3 - 2 * t));
      }
    }
    return KF[KF.length - 1][1];
  }
  var PLATEAU = { anatole: [0.06, 0.2], mesembria: [0.32, 0.46], hesperis: [0.58, 0.7], arktos: [0.82, 1.02] };
  var ORDER = ['anatole', 'mesembria', 'hesperis', 'arktos'];
  var BOUNDS = [0.035, 0.26, 0.52, 0.76];
  /* where the day comes to rest: the hero, then each watch's plateau (its panel fully shown) */
  var DAY_RESTS = [[0, 0.006], [0.066, 0.194], [0.326, 0.454], [0.586, 0.694], [0.826, 1]];

  var liveIdx = 0;
  function modelForHour(h) {
    var n = H.horaAt(h).name;
    if (/Auge|Anatole|Mousike|Gymnastike/.test(n)) return 0;
    if (/Nymphe|Mesembria|Sponde|Elete/.test(n)) return 1;
    if (/Akte|Hesperis|Dysis/.test(n)) return 2;
    return 3;
  }
  function idxAt(p) { return p < BOUNDS[0] ? liveIdx : p < BOUNDS[1] ? 0 : p < BOUNDS[2] ? 1 : p < BOUNDS[3] ? 2 : 3; }
  function weights(p) {
    var w = [0, 0, 0, 0], W = 0.026;
    for (var i = 0; i < BOUNDS.length; i++) {
      var B = BOUNDS[i];
      if (Math.abs(p - B) < W) {
        var t = smooth(B - W, B + W, p);
        w[idxAt(B - 0.001)] += 1 - smooth(0, 0.48, t);
        w[idxAt(B + 0.001)] += smooth(0.52, 1, t);
        return { w: w, t: t, edge: true };
      }
    }
    w[idxAt(p)] = 1;
    return { w: w, t: 0, edge: false };
  }

  if (stage) {
    /* the four watches, stacked */
    var holder = $('[data-day-watch]', stage);
    var watches = ORDER.map(function (m) {
      var wrap = document.createElement('div');
      wrap.className = 'day__w';
      /* page morph: "Discover" in this watch's panel flies this drawing into the watch page */
      wrap.setAttribute('data-morph-for', m);
      wrap.setAttribute('data-morph-part', 'watch');
      var w = ART.watch(m, { lazy: true });
      wrap.appendChild(w.el);
      holder.appendChild(wrap);
      return { wrap: wrap, w: w, on: false };
    });

    root.addEventListener('load', function () { setTimeout(function () { watches.forEach(function (W) { W.w.load(); }); }, 1200); });

    /* steps: the buttons on the stage, and ← / → (wired at the end) */
    var stepBtns = Array.prototype.slice.call(stage.querySelectorAll('[data-day-step]'));
    stepBtns.forEach(function (b) {
      b.addEventListener('click', function () { if (b.getAttribute('aria-disabled') !== 'true') stepScene('day', +b.getAttribute('data-day-step')); });
    });

    /* settle: the watch sways a little with the speed of the scroll (flat, in its own plane), and swings into
       place with a small overshoot when the next one arrives */
    var sw = { t: 0, p: 0, x: 0, vx: 0, main: -1, ends: '' };

    /* model panels */
    H.MODELS.forEach(function (m) {
      var el = document.createElement('article');
      el.className = 'day__panel';
      el.setAttribute('data-panel', m.id);
      el.setAttribute('data-morph', m.id);
      el.innerHTML =
        '<p class="eyebrow"><span class="day__at">' + hhmm(m.at) + '</span> · ' + esc(m.hour) + '</p>' +
        '<h2 class="day__name" data-morph-part="name">' + esc(m.name) + '</h2>' +
        '<p class="day__kicker">' + esc(m.kicker) + '</p>' +
        '<p class="day__line">' + esc(m.line) + '</p>' +
        '<p class="day__spec">' + esc(m.metal) + ' · ' + esc(m.case) + ' · ' + esc(m.thick) + ' thin · from ' + H.money(m.price) + '</p>' +
        '<a class="link" href="watch.html?m=' + m.id + '">Discover ' + esc(m.name) + '</a>';
      stage.appendChild(el);
    });
    var panels = Array.prototype.slice.call(stage.querySelectorAll('[data-panel]'));

    /* the twelve-hour rail */
    var rail = $('[data-rail]', stage);
    var MODEL_NAMES = H.MODELS.map(function (m) { return m.name; });
    rail.innerHTML = H.HOURS.map(function (h) {
      return '<li data-hora="' + h.name + '"' + (MODEL_NAMES.indexOf(h.name) > -1 ? ' class="is-model"' : '') + '>' + h.name + '</li>';
    }).join('');
    var railItems = Array.prototype.slice.call(rail.children);
    var clock = $('[data-clock]', stage);

    /* stars: one element, many box-shadows */
    (function () {
      var s = [], seed = 3;
      var r = function () { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
      for (var i = 0; i < 220; i++) {
        var a = 0.25 + r() * 0.75;
        s.push((r() * 100).toFixed(2) + 'vw ' + (r() * 100).toFixed(2) + 'vh 0 ' + (r() < 0.08 ? '1px' : '0') + ' rgba(255,255,255,' + a.toFixed(2) + ')');
      }
      $('[data-stars]', stage).style.boxShadow = s.join(',');
    })();

    /* the day as a film: a real place behind the drawn watch, played by the same clock (js/film.js).
       With nothing generated the drawn sky is the storyboard; with the stills, they crossfade by the hour. */
    var DAY_SHOTS = ['day-am', 'day-pm', 'day-eve'];
    var dayFilm = root.HZ_FILM.make($('[data-day-film]', stage), DAY_SHOTS, { phased: true });
    var saveData = navigator.connection && (navigator.connection.saveData || /2g/.test(navigator.connection.effectiveType || ''));
    if (dayFilm.more && !saveData && root.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      root.addEventListener('load', function () { setTimeout(function () { dayFilm.more(); }, 3500); });
    }
    stage.classList.toggle('day--film', dayFilm.tier !== 'board');
    filmTag($('[data-day-film-tag]', stage), dayFilm.tier, DAY_SHOTS, 'Drawn sky');

    /* the live sentence in the hero */
    var nowEl = $('[data-now]', stage);
    function paintNow() {
      var t = ART.now(), h = t.h + t.m / 60, hora = H.horaAt(h);
      var model = H.MODELS.filter(function (m) { return m.name === hora.name; })[0];
      nowEl.innerHTML = 'It is <b>' + pad2(t.h) + ':' + pad2(t.m) + '</b> where you are. The Greeks called this hour <em>' + hora.name + '</em>: ' + esc(hora.means) + '.' +
        (model ? ' It is also a watch.' : '');
      liveIdx = modelForHour(h);
    }
    paintNow();
    setInterval(paintNow, 15000);

    var lastHora = '';
    var progress = 0;
    var dayTone = 'dark';

    function sectionProgress() {
      var r = section.getBoundingClientRect();
      var span = r.height - window.innerHeight;
      return { p: clamp(-r.top / span, 0, 1), visible: r.bottom > 0 && r.top < window.innerHeight };
    }

    function render() {
      var sp = sectionProgress();
      if (!sp.visible) return;
      var p = progress = sp.p;
      var live = ART.now();
      var liveH = live.h + live.m / 60 + live.s / 3600;

      /* the clock: live in the hero, then wound back to first light and run through the day */
      var b = smooth(0.004, 0.05, p);
      var h = lerp(liveH, hourAt(p), b);
      var hh = ((h % 24) + 24) % 24;
      var hInt = Math.floor(hh), mFloat = (hh - hInt) * 60;
      if (dayFilm.tier !== 'board') {
        dayFilm.set(root.HZ_FILM.hourPos(DAY_SHOTS, hh));
        if (p > 0.004 && dayFilm.more) dayFilm.more(); /* the visitor has started the day: fetch the rest of it */
      }
      var secs = live.s;

      /* sky */
      var sky = skyAt(hh);
      var L = 0.45 * lum(sky[0]) + 0.55 * lum(sky[1]);
      var night = 1 - smooth(0.16, 0.42, L);
      var dark = smooth(0.36, 0.52, L); /* 0 = light text, 1 = dark text */
      var ink = mix([243, 238, 228], [23, 20, 15], dark);
      var st = stage.style;
      st.setProperty('--sky-t', css(sky[0]));
      st.setProperty('--sky-b', css(sky[1]));
      st.setProperty('--ink', css(ink));
      st.setProperty('--night', night.toFixed(3));
      var tone = dark > 0.5 ? 'light' : 'dark';
      if (tone !== dayTone) { dayTone = tone; UI.kick(); }

      /* sun and moon on their arcs */
      var th = Math.PI * (hh - 6.2) / 12.6;
      var el = Math.sin(th);
      st.setProperty('--sx', (50 - 46 * Math.cos(th)).toFixed(2) + '%');
      st.setProperty('--sy', (96 - 78 * el).toFixed(2) + '%');
      st.setProperty('--so', smooth(-0.06, 0.14, el).toFixed(3));
      st.setProperty('--sun', css(mix(hex('#FF9F6B'), hex('#FFF3D2'), clamp(el * 1.6, 0, 1))));
      var hm = hh < 12 ? hh + 24 : hh;
      var tm = Math.PI * (hm - 19.4) / 11.2;
      /* the moon's arc keeps it in the open sky between the words and the watch */
      st.setProperty('--mx', (56 - 26 * Math.cos(tm)).toFixed(2) + '%');
      st.setProperty('--my', (72 - 62 * Math.sin(tm)).toFixed(2) + '%');
      st.setProperty('--mo', (smooth(-0.05, 0.2, Math.sin(tm)) * night).toFixed(3));

      /* light on the dial: shadows long and sideways at sunrise and sunset, short at noon, soft at night */
      var light = ART.lightAt(hh);

      /* settle: a spring under the watch (a little overshoot, then still) */
      var main = idxAt(p);
      var tNow = performance.now(), sdt = clamp((tNow - sw.t) / 1000, 0.001, 0.05);
      var vel = (p - sw.p) / sdt;
      sw.t = tNow;
      if (main !== sw.main) {
        if (sw.main !== -1 && !calm()) sw.vx += (p > sw.p ? -1 : 1) * 40;
        sw.main = main;
      }
      sw.p = p;
      if (calm()) { sw.x = sw.vx = 0; }
      else { sw.vx += (150 * (clamp(vel * 40, -2.5, 2.5) - sw.x) - 12 * sw.vx) * sdt; sw.x += sw.vx * sdt; }
      holder.style.setProperty('--sway', sw.x.toFixed(3) + 'deg');
      var ends = (p <= DAY_RESTS[0][1] + 0.003 ? 'a' : '') + (p >= DAY_RESTS[DAY_RESTS.length - 1][0] - 0.003 ? 'z' : '');
      if (ends !== sw.ends) {
        sw.ends = ends;
        stepBtns[0].setAttribute('aria-disabled', String(ends.indexOf('a') > -1));
        stepBtns[1].setAttribute('aria-disabled', String(ends.indexOf('z') > -1));
      }

      /* which watch is on the stage */
      var mw = weights(p);
      var breath = mw.edge ? 1 - 0.04 * (1 - Math.abs(2 * mw.t - 1)) : 1;
      var heroIn = 1 - smooth(0.004, 0.05, p);
      holder.style.setProperty('--ws', (breath * (1 - 0.12 * heroIn)).toFixed(4));
      st.setProperty('--chrome', (1 - heroIn).toFixed(3));
      for (var i = 0; i < watches.length; i++) {
        var W = watches[i], o = mw.w[i];
        if (o > 0.001) {
          if (!W.on) { W.wrap.style.visibility = 'visible'; W.on = true; W.w.load(); }
          W.wrap.style.opacity = o.toFixed(3);
          W.w.time(hInt, mFloat, secs).light(light).lume(night);
        } else if (W.on) {
          W.wrap.style.visibility = 'hidden'; W.wrap.style.opacity = 0; W.on = false;
        }
      }

      /* panels */
      panels.forEach(function (pn) {
        var id = pn.getAttribute('data-panel'), vis, dir;
        if (id === 'hero') { vis = 1 - smooth(0.008, 0.034, p); dir = -1; }
        else {
          var a = PLATEAU[id][0], z = PLATEAU[id][1];
          vis = smooth(a - 0.04, a - 0.004, p) * (1 - smooth(z, z + 0.036, p));
          dir = p < a ? 1 : -1;
        }
        pn.style.opacity = vis.toFixed(3);
        pn.style.setProperty('--py', ((1 - vis) * 34 * dir).toFixed(1) + 'px');
        var on = vis > 0.02;
        if (on !== pn._on) { pn._on = on; pn.classList.toggle('is-vis', on); }
      });

      /* rail and clock */
      clock.textContent = pad2(hInt) + ':' + pad2(Math.floor(mFloat));
      var hora = H.horaAt(hh).name;
      if (hora !== lastHora) {
        lastHora = hora;
        railItems.forEach(function (li) { li.classList.toggle('is-on', li.getAttribute('data-hora') === hora); });
      }
    }

    /* the nav follows the sky while the day is on screen */
    UI.setNavTone(function () {
      return section.getBoundingClientRect().bottom > 30 ? dayTone : null;
    });

    /* one loop: the seconds hand ticks even when nobody scrolls */
    (function loop() { render(); requestAnimationFrame(loop); })();
  }

  /* ═════════ 2 · THE TWELVE NAMES ═════════ */
  var ringEl = $('[data-ring]');
  if (ringEl) {
    var parts = H.HOURS.map(function (h) {
      var isModel = H.byId[h.name.toLowerCase()];
      return '<tspan class="' + (isModel ? 'ring__m' : 'ring__o') + '">' + h.name.toUpperCase() + '</tspan><tspan class="ring__o">  ·  </tspan>';
    }).join('');
    ringEl.innerHTML =
      '<svg viewBox="-500 -500 1000 1000"><defs><path id="ringPath" d="M0,-430 A430,430 0 1 1 -0.1,-430"/></defs>' +
      '<circle r="470" fill="none" stroke="currentColor" stroke-opacity=".14"/><circle r="392" fill="none" stroke="currentColor" stroke-opacity=".1"/>' +
      Array.apply(null, { length: 60 }).map(function (_, i) {
        var a = (i * 6 - 90) * Math.PI / 180, r1 = i % 5 ? 462 : 452;
        return '<line x1="' + (r1 * Math.cos(a)).toFixed(1) + '" y1="' + (r1 * Math.sin(a)).toFixed(1) + '" x2="' + (470 * Math.cos(a)).toFixed(1) + '" y2="' + (470 * Math.sin(a)).toFixed(1) + '" stroke="currentColor" stroke-opacity=".3"/>';
      }).join('') +
      '<text class="ring__text"><textPath href="#ringPath" textLength="2690" lengthAdjust="spacing">' + parts + '</textPath></text></svg>';
    var namesSec = $('#names');
    UI.onScroll(function () {
      var r = namesSec.getBoundingClientRect(), vh = window.innerHeight;
      if (r.bottom < 0 || r.top > vh) return;
      var p = clamp((vh - r.top) / (vh + r.height), 0, 1);
      ringEl.style.setProperty('--rot', (-40 + p * 120).toFixed(2) + 'deg');
    });
  }

  /* ═════════ 3 · THE CALIBRE ═════════ */
  var cal = $('[data-cal]');
  if (cal) {
    var calSec = $('#calibre');
    var stack = $('[data-stack]', cal), labels = $('[data-labels]', cal), lines = $('[data-lines]', cal), hint = $('[data-cal-hint]', cal);
    var svgs = ART.calibre();
    var EDGE = [150, 174, 128, 139, 112, 98, 130, 124, 164]; /* where each part's leader line starts: its radius */
    var N = H.CALIBRE.length;
    var layers = H.CALIBRE.map(function (c, i) {
      var el = document.createElement('div');
      el.className = 'cal__layer cal__layer--' + c.id;
      el.innerHTML = svgs[i] + '<i class="cal__anchor" style="left:' + ((200 + EDGE[i]) / 4) + '%"></i>';
      stack.appendChild(el);
      var li = document.createElement('li');
      li.innerHTML = '<b><span class="l">' + esc(c.title) + '</span><span class="s">' + esc(c.short) + '</span></b><span class="d">' + esc(c.detail) + '</span>';
      labels.appendChild(li);
      return { el: el, anchor: el.querySelector('.cal__anchor'), li: li };
    });
    var rotor = stack.querySelector('[data-rotor]');
    $('[data-stats]', cal).innerHTML = H.STATS.map(function (s) {
      return '<li><b data-count="' + s.n + '">' + s.n + '</b><span>' + esc(s.label) + '</span></li>';
    }).join('');
    var statEls = cal.querySelectorAll('[data-count]');
    /* count-ups in the pinned stage start with the stage, not on intersect */
    Array.prototype.forEach.call(statEls, function (b) { b.removeAttribute('data-count'); b.setAttribute('data-to', b.textContent); });
    var counted = false;
    /* the filmed calibre (js/film.js): when it exists it replaces the drawn stack, and the labels stand in a
       column beside it, appearing in the order the parts come apart */
    var calFilm = root.HZ_FILM.make($('[data-cal-film]', cal), ['calibre'], { eager: false });
    var filmed = calFilm.tier !== 'board';
    cal.classList.toggle('cal--film', filmed);

    UI.onScroll(function () {
      var r = calSec.getBoundingClientRect(), vh = window.innerHeight;
      if (filmed && calFilm.load && r.top < vh * 2.5) calFilm.load();
      if (r.bottom < 0 || r.top > vh) return;
      var p = clamp(-r.top / (r.height - vh), 0, 1);
      if (filmed) {
        if (calFilm.more && p > 0.002) calFilm.more();
        calFilm.set(smooth(0.06, 0.72, p));
      }
      var tilt = smooth(0.0, 0.18, p);
      var mob = mobile();
      stack.style.transform = 'rotateX(' + (58 * tilt).toFixed(2) + 'deg) rotateZ(' + (-16 * tilt - 30 * p).toFixed(2) + 'deg) scale(' + (1 - 0.12 * tilt).toFixed(3) + ')';
      var gap = Math.min(vh * (mob ? 0.062 : 0.092), 84);
      var mid = (N - 1) / 2;
      var shown = [];
      layers.forEach(function (L, i) {
        var s0 = 0.14 + i * 0.035;
        var e = smooth(s0, s0 + 0.24, p);
        /* 1px base offset keeps the face (crystal, hands, dial) in front while the watch is still whole */
        L.el.style.transform = 'translateZ(' + ((mid - i) * (1 + gap * e)).toFixed(1) + 'px)';
        var lo = smooth(s0 + 0.1, s0 + 0.2, p);
        L.lo = lo;
        if (lo > 0.01) shown.push(i);
      });
      if (rotor) rotor.setAttribute('transform', 'rotate(' + (p * 420).toFixed(1) + ')');
      hint.style.opacity = (1 - smooth(0.02, 0.1, p)).toFixed(2);

      if (!counted && p > 0.02) {
        counted = true;
        Array.prototype.forEach.call(statEls, function (b) {
          var to = +b.getAttribute('data-to'), t0 = null;
          if (UI.reduce()) return;
          (function step(t) {
            if (t0 === null) t0 = t;
            var k = clamp((t - t0) / 1600, 0, 1);
            b.textContent = Math.round(to * (1 - Math.pow(1 - k, 3)));
            if (k < 1) requestAnimationFrame(step);
          })(performance.now());
        });
      }

      /* labels: a column to the right of the movement, each on a leader line from its part
         (filmed: an evenly spaced column, no leader lines) */
      var cr = cal.getBoundingClientRect();
      if (filmed) {
        var fr = $('[data-cal-film]', cal).getBoundingClientRect();
        var fx = mob ? cr.width - 118 : fr.right - cr.left + 16, ftop = cr.height * (mob ? 0.3 : 0.17), fstep = cr.height * (mob ? 0.5 : 0.68) / (N - 1);
        layers.forEach(function (L, i) {
          L.li.style.transform = 'translate(' + fx.toFixed(1) + 'px,' + (ftop + i * fstep - (mob ? 9 : 12)).toFixed(1) + 'px)';
          L.li.style.opacity = L.lo.toFixed(3);
        });
        return;
      }
      var pts = layers.map(function (L) { var a = L.anchor.getBoundingClientRect(); return { x: a.left - cr.left, y: a.top - cr.top }; });
      var colX = mob ? cr.width - 118 : Math.max.apply(null, pts.map(function (q) { return q.x; })) + 56;
      if (!mob) colX = Math.min(colX, cr.width - 300);
      var minGap = mob ? 30 : 64, prevY = -1e9, svgOut = '';
      layers.forEach(function (L, i) {
        var y = Math.max(pts[i].y, prevY + minGap);
        prevY = y;
        L.li.style.transform = 'translate(' + colX.toFixed(1) + 'px,' + (y - (mob ? 9 : 12)).toFixed(1) + 'px)';
        L.li.style.opacity = L.lo.toFixed(3);
        if (L.lo > 0.01) {
          var x0 = pts[i].x, y0 = pts[i].y, k = L.lo;
          var xm = lerp(x0, colX - 12, k);
          svgOut += '<circle cx="' + x0.toFixed(1) + '" cy="' + y0.toFixed(1) + '" r="2.2" opacity="' + k.toFixed(2) + '"/>' +
            '<polyline points="' + x0.toFixed(1) + ',' + y0.toFixed(1) + ' ' + lerp(x0, colX - 30, k).toFixed(1) + ',' + lerp(y0, y, k).toFixed(1) + ' ' + xm.toFixed(1) + ',' + lerp(y0, y, k).toFixed(1) + '" opacity="' + (k * 0.8).toFixed(2) + '"/>';
        }
      });
      lines.innerHTML = svgOut;
    });
  }

  /* ═════════ 4 · THE FOUR HOURS ═════════ */
  var cardsEl = $('[data-cards]');
  if (cardsEl) {
    cardsEl.innerHTML = H.MODELS.map(function (m, i) {
      return '<article class="hcard hcard--' + m.id + '" data-tone="' + m.tone + '" id="hour-' + m.id + '" data-morph="' + m.id + '">' +
        '<div class="hcard__in">' +
        '<div class="hcard__media"><div class="slot" data-shot="' + m.id + '-front" data-morph-part="watch" data-img-sizes="(max-width: 760px) 100vw, 45vw"></div>' +
        '<div class="slot hcard__wrist" data-shot="' + m.id + '-wrist" data-img-sizes="(max-width: 760px) 60vw, 22vw"></div></div>' +
        '<div class="hcard__copy">' +
        '<p class="eyebrow"><span>' + pad2(i + 1) + ' / 04</span> · ' + esc(m.hour) + ' · ' + esc(m.range) + '</p>' +
        '<h3 class="hcard__name" data-morph-part="name">' + esc(m.name) + '</h3>' +
        '<p class="hcard__kicker">' + esc(m.kicker) + '</p>' +
        '<p class="hcard__line">' + esc(m.line) + '</p>' +
        '<dl class="hcard__spec"><div><dt>Case</dt><dd>' + esc(m.metal) + ', ' + esc(m.case) + '</dd></div><div><dt>Thickness</dt><dd>' + esc(m.thick) + '</dd></div>' +
        '<div><dt>Movement</dt><dd>' + esc(m.calibre) + '</dd></div><div><dt>Power reserve</dt><dd>' + esc(m.reserve) + '</dd></div></dl>' +
        '<p class="hcard__price">' + H.money(m.price) + '<span>' + m.year + ' made each year</span></p>' +
        '<div class="hcard__cta"><a class="btn" href="watch.html?m=' + m.id + '">Discover</a><a class="link" href="#reserve" data-pick-model="' + m.id + '">Reserve</a></div>' +
        '</div></div></article>';
    }).join('');
    root.HZ_MEDIA.all(cardsEl);
    var cards = Array.prototype.slice.call(cardsEl.children);
    UI.onScroll(function () {
      if (mobile()) return;
      var vh = window.innerHeight;
      cards.forEach(function (c, i) {
        var next = cards[i + 1];
        var cover = next ? clamp(1 - next.getBoundingClientRect().top / vh, 0, 1) : 0;
        c.style.setProperty('--cover', cover.toFixed(3));
      });
    });
  }

  /* ═════════ 4a · ON THE WRIST ═════════
     The wrist photographs with whose wrist it is; the four cases side on, to scale; and a check of each
     watch's lug-to-lug against the flat top of your wrist (about a third of its circumference). */
  var wristGrid = $('[data-wrist-grid]');
  if (wristGrid) {
    wristGrid.innerHTML = H.MODELS.map(function (m) {
      return '<figure class="wcard rv"><div class="slot" data-shot="' + m.id + '-wrist" data-img-sizes="(max-width: 760px) 100vw, 45vw"></div>' +
        '<figcaption><span class="wcard__name">' + esc(m.name) + '</span><span class="wcard__on">On a ' + m.wristCm + ' cm wrist</span>' +
        '<span class="wcard__spec">' + esc(m.case) + ' · ' + esc(m.thick) + ' · ' + m.lug + ' mm lug to lug</span>' +
        '<p class="wcard__sits">' + esc(m.sits) + '</p></figcaption></figure>';
    }).join('');
    root.HZ_MEDIA.all(wristGrid);
    UI.watch(wristGrid);

    /* side on, to scale (1 mm = 10 units): one watch per row, all on the same scale, so the thickness
       and the reach of the lugs compare directly; name and sizes beside each */
    var S10 = 10, ROW = 175, X0 = 20, METAL = ART.METAL, LOOKS = ART.LOOK, parts = '', defs = '';
    var maxLug = Math.max.apply(null, H.MODELS.map(function (m) { return m.lug; })) * S10, LX = X0 + maxLug + 110;
    H.MODELS.forEach(function (m, i) {
      var d = parseFloat(m.case) * S10, t = parseFloat(m.thick) * S10, lug = m.lug * S10, c = METAL[LOOKS[m.id].metal];
      var x = X0 + (maxLug - lug) / 2, base = 150 + i * ROW, cx = x + lug / 2, top = base - t - 18, left = cx - d / 2;
      defs += '<linearGradient id="wp' + m.id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + c[0] + '"/><stop offset=".45" stop-color="' + c[1] + '"/><stop offset="1" stop-color="' + c[2] + '"/></linearGradient>';
      var dome = m.id === 'arktos' ? 14 : 6;
      parts +=
        '<line x1="' + (X0 - 10) + '" x2="' + (X0 + maxLug + 10) + '" y1="' + (base + 10) + '" y2="' + (base + 10) + '" stroke="currentColor" stroke-opacity=".15" stroke-dasharray="4 6"/>' +
        /* strap, then lugs reaching down to the wrist, then the case and its crystal, then the crown */
        '<path d="M' + (x - 20) + ',' + (base + 8) + ' Q' + cx + ',' + (base - 6) + ' ' + (x + lug + 20) + ',' + (base + 8) + '" fill="none" stroke="' + esc(m.straps[0].color) + '" stroke-width="10" stroke-linecap="round" opacity=".75"/>' +
        '<path d="M' + (left + 8) + ',' + (top + t * 0.55) + ' L' + x + ',' + (base - 2) + ' L' + (x + 16) + ',' + (base - 2) + ' L' + (left + 26) + ',' + (top + t * 0.8) + 'Z" fill="url(#wp' + m.id + ')"/>' +
        '<path d="M' + (left + d - 8) + ',' + (top + t * 0.55) + ' L' + (x + lug) + ',' + (base - 2) + ' L' + (x + lug - 16) + ',' + (base - 2) + ' L' + (left + d - 26) + ',' + (top + t * 0.8) + 'Z" fill="url(#wp' + m.id + ')"/>' +
        '<rect x="' + left + '" y="' + top + '" width="' + d + '" height="' + t + '" rx="' + Math.min(18, t / 3) + '" fill="url(#wp' + m.id + ')" stroke="rgba(0,0,0,.22)"/>' +
        '<path d="M' + (left + 10) + ',' + top + ' Q' + cx + ',' + (top - dome) + ' ' + (left + d - 10) + ',' + top + '" fill="rgba(200,215,235,.55)" stroke="rgba(0,0,0,.15)"/>' +
        '<rect x="' + (left + d) + '" y="' + (top + t / 2 - 12) + '" width="16" height="24" rx="4" fill="url(#wp' + m.id + ')" stroke="rgba(0,0,0,.2)"/>' +
        '<text class="pn" x="' + LX + '" y="' + (base - 40) + '" font-size="34">' + esc(m.name) + '</text>' +
        '<text x="' + LX + '" y="' + (base - 8) + '" font-size="20" letter-spacing="1.5">' + esc(m.thick.toUpperCase()) + ' THICK · ' + esc(m.case.toUpperCase()) + ' · ' + m.lug + ' MM LUGS</text>';
    });
    var VW = LX + 470, VH = 150 + 3 * ROW + 40;
    $('[data-wrist-profiles]').innerHTML = '<svg viewBox="0 20 ' + VW + ' ' + VH + '" role="img" aria-label="The four watches side on, drawn to scale: ' +
      H.MODELS.map(function (m) { return m.name + ' ' + m.case + ' across, ' + m.thick + ' thick, ' + m.lug + ' mm lug to lug'; }).join('; ') + '."><defs>' + defs + '</defs>' + parts + '</svg>';

    /* your wrist */
    var range = $('[data-wrist-size]'), out = $('[data-wrist-out]'), bars = $('[data-wrist-bars]');
    bars.innerHTML = H.MODELS.map(function (m) {
      return '<li><b>' + esc(m.name) + '</b><span class="wrist__bar"><i data-bar="' + m.id + '"></i></span><span class="wrist__say" data-say="' + m.id + '"></span></li>';
    }).join('');
    var paintFit = function () {
      var cm = +range.value, top = cm * 10 / 3.2; /* flat top of the wrist, mm */
      out.textContent = cm + ' cm';
      range.setAttribute('aria-valuetext', cm + ' cm');
      H.MODELS.forEach(function (m) {
        var k = m.lug / top, bar = bars.querySelector('[data-bar="' + m.id + '"]'), say = bars.querySelector('[data-say="' + m.id + '"]');
        bar.style.setProperty('--fill', (k * 100).toFixed(1) + '%');
        bar.classList.toggle('is-over', k > 1);
        say.textContent = m.lug + ' mm on a ' + Math.round(top) + ' mm wrist top · ' + (k <= 0.9 ? 'sits well inside' : k <= 1 ? 'fills the wrist, edge to edge' : 'the lugs reach past the edge');
      });
    };
    range.addEventListener('input', paintFit);
    paintFit();
  }

  /* ═════════ 4b · THE SET ═════════
     An empty box, closed. Scroll: it turns toward you and the lid lifts on its hinge, showing four empty
     places lined in the colours of the hours. Then the watches drop in one at a time, sunrise to night,
     and each one is checked off in the list as it lands. With all four in, the set's total appears. */
  var setStage = $('[data-set]');
  if (setStage) {
    var setSec = $('#set'), S = H.SET;
    var boxEl = $('[data-box]', setStage);
    var tick = '<svg class="tick" viewBox="0 0 22 22" aria-hidden="true"><circle cx="11" cy="11" r="10"/><path d="M6.5 11.4l3 3 6-6.4"/></svg>';
    boxEl.innerHTML =
      '<i class="bx bx--ground"></i>' +
      '<i class="bx bx--floor"></i>' +
      '<i class="bx bx--wx bx--back-out"></i><i class="bx bx--wx bx--back-in"></i>' +
      '<i class="bx bx--wy bx--left-out"></i><i class="bx bx--wy bx--left-in"></i>' +
      '<i class="bx bx--wy bx--right-out"></i><i class="bx bx--wy bx--right-in"></i>' +
      '<div class="set__tray">' + H.MODELS.map(function (m) {
        return '<div class="set__slot set__slot--' + m.id + '"><div class="set__w" data-set-w="' + m.id + '"></div></div>';
      }).join('') + '</div>' +
      '<i class="bx bx--wx bx--front-in"></i><i class="bx bx--wx bx--front-out"></i>' +
      '<i class="bx bx--rim bx--rim-b"></i><i class="bx bx--rim bx--rim-f"></i><i class="bx bx--rim bx--rim-l"></i><i class="bx bx--rim bx--rim-r"></i>' +
      '<div class="set__lid" data-lid>' +
      '<div class="lid lid--under"><em>Every hour has a name.</em><small>Anatole · Mesembria · Hesperis · Arktos</small></div>' +
      '<i class="lid lid--wx lid--b"></i><i class="lid lid--wy lid--l"></i><i class="lid lid--wy lid--r"></i><i class="lid lid--wx lid--f"></i>' +
      '<div class="lid lid--top">' + ART.mark() + '<b>HORÆ</b><small>The Complete Day</small><span class="lid__dots"><i></i><i></i><i></i><i></i></span></div>' +
      '</div>';
    var lidEl = $('[data-lid]', boxEl);
    var setWatches = H.MODELS.map(function (m, i) {
      var holder = boxEl.querySelector('[data-set-w="' + m.id + '"]');
      var w = ART.watch(m.id, { strap: false });
      holder.appendChild(w.el);
      w.light({ dx: 0.6, dy: 2.6, blur: 1.8, alpha: 0.34, deg: 0 }).lume(m.id === 'arktos' ? 0.45 : 0);
      return { m: m, holder: holder, w: w, spin: [-28, 22, -18, 30][i] };
    });

    /* the list you check the set against */
    $('[data-set-line]', setStage).textContent = S.line + ' ' + S.year + ' sets a year.';
    var listEl = $('[data-set-list]', setStage);
    listEl.innerHTML =
      '<li data-item="box">' + tick + '<span><b>The box</b><small>' + esc(S.box) + '</small></span><span class="pr">Included</span></li>' +
      H.MODELS.map(function (m) {
        return '<li data-item="' + m.id + '">' + tick + '<span><b>' + esc(m.name) + '</b><small>' + esc(m.hour) + ' · ' + esc(m.metal) + '</small></span><span class="pr">' + H.money(m.price) + '</span></li>';
      }).join('');
    var items = {};
    Array.prototype.forEach.call(listEl.children, function (li) { items[li.getAttribute('data-item')] = li; });
    $('[data-set-price]', setStage).textContent = H.money(S.price);
    $('[data-set-made]', setStage).textContent = 'Four watches, consecutive case numbers, one box. ' + S.year + ' sets a year.';
    var statusEl = $('[data-set-status]', setStage), countEl = $('[data-set-count]', setStage);
    var sumEl = $('[data-set-sum]', setStage), setHint = $('[data-set-hint]', setStage);
    var setVisible = false, lastStatus = '';

    /* the box as a film: the real box opens (the first quarter of the scene), then hands over to the drawn box
       just before the watches drop in. With nothing generated the drawn box does it all, as before. */
    var filmHost = $('[data-set-film]', setStage), sceneEl = $('.set__scene', setStage);
    var boxFilm = root.HZ_FILM.make(filmHost, ['box'], { eager: false, fit: 'contain' });
    filmTag($('[data-set-film-tag]', setStage), boxFilm.tier, ['box'], 'Drawn box');
    var FILM_END = 0.25, HAND = 0.285;
    /* The film is placed so the photographed tray lands on the drawn tray in its open pose (the pose at the
       hand-over), so the crossfade does not jump. In box-open the tray spans 58.2% of the frame's width,
       centred, at 53% of its height; re-measure these if box-open is re-rolled. The soft mask fades the frame's edges. */
    /* With the photographs, the real box stays to the end: the film (or its stills) opens the lid, then the four
       photographed watches drop into the real cushions, laid back to the camera's angle, still ticking.
       Cushion centres measured in box-open (fractions of the frame): x 30.0 / 43.2 / 56.5 / 69.7 %, y 53 %,
       each about 11 % of the frame wide. Re-measure if box-open is re-rolled. */
    var REAL = boxFilm.tier !== 'board';
    var CUSH = { x: [0.300, 0.432, 0.565, 0.697], y: 0.53, w: 0.104 };
    var drops = null;
    if (REAL) {
      drops = document.createElement('div');
      drops.className = 'set__drops';
      drops.setAttribute('aria-hidden', 'true');
      setStage.insertBefore(drops, sceneEl);
      drops = H.MODELS.map(function (m, i) {
        var el = document.createElement('div');
        el.className = 'set__drop';
        var w = ART.watch(m.id, { strap: false });
        el.appendChild(w.el);
        w.light({ dx: 0.6, dy: 2.6, blur: 1.8, alpha: 0.34, deg: 0 }).lume(m.id === 'arktos' ? 0.45 : 0);
        setStage.querySelector('.set__drops').appendChild(el);
        return { el: el, w: w, spin: [-24, 18, -14, 26][i] };
      });
      sceneEl.style.visibility = 'hidden';
    }
    var fitFilm = function () {
      /* the photographed box as large as it fits in the box's place, centred */
      var a = sceneEl.getBoundingClientRect(), b = setStage.getBoundingClientRect();
      var w = Math.min(a.width * (mobile() ? 1.45 : 1.5), a.height * 1.3 * 16 / 9), h = w * 9 / 16;
      var left = a.left - b.left + (a.width - w) / 2, top = a.top - b.top + (a.height - h) / 2;
      [filmHost, setStage.querySelector('.set__drops')].forEach(function (el) {
        var st = el.style;
        st.inset = 'auto'; st.width = w + 'px'; st.height = h + 'px'; st.left = left + 'px'; st.top = top + 'px';
      });
      if (boxFilm.resize) boxFilm.resize();
    };
    if (REAL) { fitFilm(); window.addEventListener('resize', fitFilm); }

    UI.onScroll(function () {
      var r = setSec.getBoundingClientRect(), vh = window.innerHeight;
      if (boxFilm.load && r.top < vh * 2.5) boxFilm.load();
      setVisible = r.bottom > 0 && r.top < vh;
      if (!setVisible) return;
      var p = clamp(-r.top / (r.height - vh), 0, 1);
      var mob = mobile();
      if (REAL) {
        boxFilm.set(clamp(p / FILM_END, 0, 1));
        /* the watches drop into the real cushions on the same beats as the checklist */
        var dw = parseFloat(drops[0].el.parentNode.style.width) || 0, dh = dw * 9 / 16;
        drops.forEach(function (o, i) {
          var s0 = 0.31 + i * 0.105, e = smooth(s0, s0 + 0.085, p), land = e * e * (3 - 2 * e);
          var size = CUSH.w * dw;
          o.el.style.width = o.el.style.height = size.toFixed(1) + 'px';
          o.el.style.left = (CUSH.x[i] * dw - size / 2).toFixed(1) + 'px';
          o.el.style.top = (CUSH.y * dh - size / 2).toFixed(1) + 'px';
          o.el.style.opacity = smooth(s0 - 0.012, s0 + 0.018, p).toFixed(3);
          o.el.style.transform = 'translateY(' + (-(1 - land) * dh * 0.55).toFixed(1) + 'px) scale(' + (1 + 0.22 * (1 - land)).toFixed(3) + ') rotate(' + ((1 - land) * o.spin).toFixed(2) + 'deg) rotateX(' + (34 * land).toFixed(1) + 'deg)';
          o.el.style.setProperty('--sh', land.toFixed(3));
        });
      }

      /* the box turns toward you and tips so you can look in; the lid lifts on its hinge */
      var turn = smooth(0.0, 0.3, p);
      var tilt = lerp(mob ? 36 : 24, mob ? 46 : 42, turn); /* past ~45° the front wall hides the dials */
      var spin = lerp(mob ? -10 : -18, 0, turn) + lerp(0, mob ? 0 : 4, smooth(0.82, 1, p));
      boxEl.style.transform = 'translateY(' + lerp(mob ? 10 : 30, 0, turn).toFixed(1) + 'px) rotateX(' + tilt.toFixed(2) + 'deg) rotateZ(' + spin.toFixed(2) + 'deg)';
      var open = smooth(0.1, 0.27, p);
      lidEl.style.transform = 'translateZ(calc(var(--H) + 1px)) rotateX(' + (open * 108).toFixed(2) + 'deg)';

      /* the four, sunrise to night, dropping into their places */
      var zMax = Math.min(vh * (mob ? 0.55 : 0.72), 620), inBox = 0, last = null;
      setWatches.forEach(function (o, i) {
        var s0 = 0.31 + i * 0.105;
        var e = smooth(s0, s0 + 0.085, p);
        var land = e * e * (3 - 2 * e);
        o.holder.style.opacity = smooth(s0 - 0.012, s0 + 0.018, p).toFixed(3);
        o.holder.style.transform = 'translate(-50%,-50%) translateZ(' + ((1 - land) * zMax).toFixed(1) + 'px) rotateZ(' + ((1 - land) * o.spin).toFixed(2) + 'deg) rotateX(' + lerp(-62, -24, land).toFixed(2) + 'deg)';
        var inNow = e > 0.97;
        if (inNow) { inBox++; last = o.m; }
        if (items[o.m.id]._on !== inNow) { items[o.m.id]._on = inNow; items[o.m.id].classList.toggle('is-checked', inNow); }
      });
      var boxOpen = open > 0.96;
      if (items.box._on !== boxOpen) { items.box._on = boxOpen; items.box.classList.toggle('is-checked', boxOpen); }
      countEl.textContent = inBox + ' of 4 in the box';

      var status = p < 0.1 ? 'Closed, and empty.' : !boxOpen ? 'Opening.' : inBox === 0 ? 'Empty. Four places, cut to size.'
        : inBox < 4 ? last.name + ', in. ' + ['Sunrise first.', 'Then noon.', 'Then evening.'][inBox - 1] : 'All four hours, in one box.';
      if (status !== lastStatus) { lastStatus = status; statusEl.textContent = status; }
      sumEl.classList.toggle('is-on', inBox === 4);
      setHint.style.opacity = (1 - smooth(0.02, 0.1, p)).toFixed(2);
    });

    /* the watches in the box keep time */
    var setBeat = -1;
    (function setLoop() {
      if (setVisible) {
        var t = ART.now();
        if (t.s !== setBeat) { setBeat = t.s; setWatches.forEach(function (o) { o.w.time(t.h, t.m, t.s); }); if (drops) drops.forEach(function (o) { o.w.time(t.h, t.m, t.s); }); }
      }
      requestAnimationFrame(setLoop);
    })();
  }

  /* a faint line saying what the film behind a scene is made of, until the film itself exists */
  function filmTag(el, tier, names, drawn) {
    if (!el) return;
    var have = (root.HORAE_READY || {}).film || {};
    var missing = names.filter(function (n) { return !have[n]; }).map(function (n) { return root.HZ_FILM.shot(n).id; });
    if (!missing.length) { el.hidden = true; return; }
    el.hidden = false;
    el.textContent = (tier === 'frames' ? 'Film, with stills for the rest' : tier === 'stills' ? 'Stills crossfade' : drawn) + ' · film pending: ' + missing.join(', ');
  }

  /* ═════════ SETTLE AND STEPS ═════════
     A pinned scene with resting states comes to rest on the nearest one a moment after you stop scrolling,
     leaning toward the way you were going. Never while a finger or the scrollbar is held, never under
     "reduce", never under ?sync (tests call HZ_HOME.settle() instead). ← and → step from one state to the
     next, and so do the buttons on the day stage. HZ_HOME.state() reads where everything is. */
  var scenes = [];
  if (stage) scenes.push({ name: 'day', sec: section, rests: DAY_RESTS });
  if (setStage) scenes.push({ name: 'set', sec: setSec, rests: [[0, 0.06], [0.272, 0.296], [0.396, 0.402], [0.501, 0.507], [0.606, 0.612], [0.711, 1]] });
  var sceneBy = function (n) { return scenes.filter(function (x) { return x.name === n; })[0]; };

  function geo(sc) {
    var r = sc.sec.getBoundingClientRect(), vh = window.innerHeight, span = r.height - vh;
    return { top: window.scrollY + r.top, span: span, p: clamp(-r.top / span, 0, 1), pinned: r.top <= 1 && r.bottom >= vh - 1 };
  }
  function nearest(sc, p, dir) {
    var best = null, bd = Infinity;
    for (var i = 0; i < sc.rests.length; i++) {
      var R = sc.rests[i], q = clamp(p, R[0], R[1]), dist = Math.abs(q - p);
      if (dist < 1e-4) return null; /* already resting */
      if (dir && (q - p) * dir > 0) dist *= 0.55;
      if (dist < bd) { bd = dist; best = q; }
    }
    return best;
  }
  function goP(g, q) {
    var y = Math.round(g.top + q * g.span), dy = Math.abs(y - window.scrollY);
    if (dy < 2) return;
    var L = UI.lenis();
    if (L) L.scrollTo(y, { duration: clamp(0.45 + dy / window.innerHeight * 0.4, 0.45, 1.2), easing: function (t) { return 1 - Math.pow(1 - t, 3); } });
    else window.scrollTo({ top: y, behavior: calm() ? 'instant' : 'smooth' });
  }
  function pinned() {
    for (var i = 0; i < scenes.length; i++) { var g = geo(scenes[i]); if (g.pinned) return { sc: scenes[i], g: g }; }
    return null;
  }
  var lastDir = 0;
  function settle() {
    var a = pinned();
    if (!a) return null;
    var q = nearest(a.sc, a.g.p, lastDir);
    if (q === null) return null;
    goP(a.g, q);
    return { scene: a.sc.name, from: +a.g.p.toFixed(4), to: +q.toFixed(4) };
  }
  function stepScene(name, dir) {
    var sc = sceneBy(name);
    if (!sc) return null;
    var g = geo(sc), R = sc.rests, to = null, i;
    if (dir > 0) { for (i = 0; i < R.length; i++) if (R[i][0] > g.p + 0.003) { to = R[i][0]; break; } }
    else { for (i = R.length - 1; i >= 0; i--) if (R[i][1] < g.p - 0.003) { to = R[i][1]; break; } }
    if (to === null) return null;
    lastDir = dir;
    goP(g, to);
    return { scene: name, from: +g.p.toFixed(4), to: to };
  }

  if (scenes.length) {
    var lastY = window.scrollY, idle = null, held = false;
    var later = function () { clearTimeout(idle); if (!calm() && !held) idle = setTimeout(settle, 170); };
    window.addEventListener('scroll', function () {
      var y = window.scrollY;
      if (y !== lastY) { lastDir = y > lastY ? 1 : -1; lastY = y; }
      later();
    }, { passive: true });
    var hold = function () { held = true; clearTimeout(idle); };
    var release = function () { if (held) { held = false; later(); } };
    /* a finger on the screen, or the mouse on the scrollbar */
    window.addEventListener('touchstart', hold, { passive: true });
    window.addEventListener('touchend', release, { passive: true });
    window.addEventListener('touchcancel', release, { passive: true });
    window.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'mouse' && (e.target === document.documentElement || e.clientX >= document.documentElement.clientWidth)) hold();
    }, true);
    window.addEventListener('pointerup', function (e) { if (e.pointerType === 'mouse') release(); }, true);

    document.addEventListener('keydown', function (e) {
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      var t = e.target;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.getAttribute('role') === 'slider')) return;
      var a = pinned();
      if (a && stepScene(a.sc.name, e.key === 'ArrowRight' ? 1 : -1)) e.preventDefault();
    });
  }

  root.HZ_HOME = {
    settle: settle, step: stepScene,
    state: function () {
      var out = {};
      scenes.forEach(function (sc) { var g = geo(sc); out[sc.name] = { p: +g.p.toFixed(4), pinned: g.pinned, resting: nearest(sc, g.p, 0) === null }; });
      if (stage) out.sway = +sw.x.toFixed(3);
      return out;
    },
  };

  /* ═════════ 5 · RESERVE ═════════ */
  var form = $('[data-form]');
  if (form) {
    var pick = $('[data-pick]', form);
    pick.innerHTML = H.MODELS.map(function (m, i) {
      return '<label class="pick__opt pick__opt--' + m.id + '"><input type="radio" name="model" value="' + m.id + '"' + (i === 3 ? ' checked' : '') + '>' +
        '<span class="pick__dot" aria-hidden="true"></span><span class="pick__name">' + esc(m.name) + '</span><span class="pick__hour">' + esc(m.hour) + '</span></label>';
    }).join('') +
      '<label class="pick__opt pick__opt--set"><input type="radio" name="model" value="set">' +
      '<span class="pick__dot" aria-hidden="true"></span><span class="pick__name">' + esc(H.SET.name) + '</span><span class="pick__hour">All four, one box · ' + H.money(H.SET.price) + '</span></label>';
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('[data-pick-model]');
      if (!a) return;
      var r = form.querySelector('input[value="' + a.getAttribute('data-pick-model') + '"]');
      if (r) r.checked = true;
    });
    var err = $('[data-err]', form);
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = form.name.value.trim(), email = form.email.value.trim();
      var model = (form.querySelector('input[name="model"]:checked') || {}).value;
      var bad = !name ? 'Please add your name.' : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? 'That email address looks incomplete.' : '';
      err.textContent = bad;
      form.classList.toggle('has-err', !!bad);
      if (bad) { (name ? form.email : form.name).focus(); return; }
      UI.reserve({ model: model, at: Date.now() });
      UI.toast('Thank you, ' + name.split(' ')[0] + '. ' + (model === 'set' ? H.SET.name + ' (all four)' : 'The ' + H.byId[model].name) + ' is noted in this browser. Reservations open at launch; nothing was sent.');
      form.reset();
      form.querySelector('input[value="' + model + '"]').checked = true;
    });
  }

  /* footer model links */
  var fm = $('[data-foot-models]');
  if (fm) fm.innerHTML = H.MODELS.map(function (m) { return '<li><a href="watch.html?m=' + m.id + '">' + esc(m.name) + '</a></li>'; }).join('');
})(window);
