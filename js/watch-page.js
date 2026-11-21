/*
 * HORÆ watch page: one template for all four (watch.html?m=anatole | mesembria | hesperis | arktos).
 *
 * The drawn watch runs on your time, under the sky of your hour. "Its hour" moves the sky, the light
 * and the hands to the hour the watch is named for. As you scroll, the watch settles and a bar with
 * the reserve button slides up.
 */
(function (root) {
  var H = root.HORAE, ART = root.HZ_ART, UI = root.HZ_UI;
  var $ = function (s, el) { return (el || document).querySelector(s); };
  var esc = function (t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var pad2 = function (n) { return (n < 10 ? '0' : '') + n; };
  var css = function (c) { return 'rgb(' + Math.round(c[0]) + ',' + Math.round(c[1]) + ',' + Math.round(c[2]) + ')'; };
  var lum = function (c) { return (0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]) / 255; };
  var m = H.byId[H.current];

  /* ── copy ── */
  document.title = m.name + ' · ' + m.hour + ' · Horæ';
  var meta = document.querySelector('meta[name="description"]');
  if (meta) meta.setAttribute('content', 'The Horæ ' + m.name + ': ' + m.line);
  var F = {
    hour: m.name, eyebrow: m.hour + ' · ' + m.range, name: m.name, kicker: m.kicker, line: m.line,
    price: H.money(m.price), made: m.year + ' made each year · ' + m.metal + ', ' + m.case,
    'its-hour': m.hour + ' ' + (function () { var h = Math.floor(m.at), mm = Math.round((m.at - h) * 60); return pad2(h) + ':' + pad2(mm); })(),
    'hour-eyebrow': 'Its hour · ' + m.range, 'hour-title': m.kicker + '.', 'long-1': m.long[0], 'long-2': m.long[1],
    'bar-price': H.money(m.price) + ' · ' + m.metal,
  };
  Array.prototype.forEach.call(document.querySelectorAll('[data-f]'), function (el) {
    var k = el.getAttribute('data-f');
    if (F[k] != null) el.textContent = F[k];
  });

  /* ── specs ── */
  var specs = [
    ['Case', m.metal + ', ' + m.case], ['Thickness', m.thick], ['Lug to lug', m.lug + ' mm'], ['Movement', 'Calibre ' + m.calibre], ['Power reserve', m.reserve],
    ['Frequency', '4 Hz (28,800 vibrations an hour)'], ['Dial', m.dial], ['Crystal', m.crystal], ['Water resistance', m.water],
    ['Made each year', String(m.year)], ['Warranty', 'Ten years'],
  ];
  $('[data-specs]').innerHTML = specs.map(function (s) { return '<div><dt>' + s[0] + '</dt><dd>' + esc(s[1]) + '</dd></div>'; }).join('');

  /* ── the watches on this page ── */
  var hero = $('[data-hero]');
  var big = ART.watch(m.id);
  /* the front and the back, one over the other; "See the back" crossfades between them (flat, no turning) */
  var pair = document.createElement('div');
  pair.className = 'wp-pair';
  var back = ART.back(m.id);
  pair.appendChild(big.el);
  pair.appendChild(back.el);
  $('[data-hero-watch]').appendChild(pair);
  var flipBtn = $('[data-flip]');
  flipBtn.addEventListener('click', function () {
    var on = !pair.classList.contains('is-back');
    pair.classList.toggle('is-back', on);
    flipBtn.setAttribute('aria-pressed', String(on));
    flipBtn.textContent = on ? 'See the dial' : 'See the back';
  });
  /* page morph targets: whatever you clicked to get here (a drawn watch, a card photo, a name) lands on these */
  big.el.style.viewTransitionName = 'watch-' + m.id;
  big.el.style.viewTransitionClass = 'watch';
  var heroName = $('.wp-hero__name');
  heroName.style.viewTransitionName = 'name-' + m.id;
  heroName.style.viewTransitionClass = 'name';
  var bar = ART.watch(m.id, { strap: false });
  $('[data-bar-watch]').appendChild(bar.el);
  var minis = H.MODELS.filter(function (o) { return o.id !== m.id; }).map(function (o) {
    var a = document.createElement('a');
    a.className = 'other rv';
    a.href = 'watch.html?m=' + o.id;
    a.setAttribute('data-morph', o.id);
    a.innerHTML = '<span class="other__w" data-morph-part="watch"></span><span class="other__name" data-morph-part="name">' + esc(o.name) + '</span><span class="other__hour">' + esc(o.hour) + ' · ' + esc(o.range) + '</span>';
    var w = ART.watch(o.id, { strap: false });
    a.querySelector('.other__w').appendChild(w.el);
    $('[data-others]').appendChild(a);
    return w;
  });
  UI.watch($('[data-others]'));

  /* ── straps ── */
  var strapsEl = $('[data-straps]');
  var strap = m.straps[0];
  strapsEl.innerHTML = m.straps.map(function (s, i) {
    return '<label class="strap-opt"><input type="radio" name="strap" value="' + s.id + '"' + (i ? '' : ' checked') + '><i style="background:' + s.color + '"></i>' + esc(s.label) + '</label>';
  }).join('');
  /* a photographed watch shows the strap it was photographed on; the choice is still recorded with the reservation */
  if (big.photo) strapsEl.parentNode.querySelector('legend').textContent = 'Strap · pictured on the ' + m.straps[0].label.toLowerCase();
  strapsEl.addEventListener('change', function (e) {
    strap = m.straps.filter(function (s) { return s.id === e.target.value; })[0];
    big.strap(strap.color, strap.id === 'bracelet');
    back.strap(strap.color, strap.id === 'bracelet');
  });

  /* ── reserve ── */
  Array.prototype.forEach.call(document.querySelectorAll('[data-reserve]'), function (b) {
    b.addEventListener('click', function () {
      UI.reserve({ model: m.id, strap: strap.id, at: Date.now() });
      UI.toast('The ' + m.name + ' on ' + strap.label.toLowerCase() + ' is reserved in this browser. Reservations open at launch; nothing was charged.');
    });
  });

  /* ── your time or its hour ── */
  var mode = 'now';
  var toggles = document.querySelectorAll('[data-show]');
  Array.prototype.forEach.call(toggles, function (b) {
    b.addEventListener('click', function () {
      mode = b.getAttribute('data-show');
      Array.prototype.forEach.call(toggles, function (o) { o.setAttribute('aria-pressed', String(o === b)); });
      paintSky(true);
    });
  });

  var lastHourKey = '';
  function hourNow() { var t = ART.now(); return mode === 'hour' ? m.at : t.h + t.m / 60; }
  function paintSky(force) {
    var h = hourNow(), key = mode + Math.floor(h * 12);
    if (!force && key === lastHourKey) return;
    lastHourKey = key;
    var sky = H.skyAt(h);
    hero.style.setProperty('--sky-t', css(sky[0]));
    hero.style.setProperty('--sky-b', css(sky[1]));
    var L = 0.45 * lum(sky[0]) + 0.55 * lum(sky[1]);
    var tone = L > 0.46 ? 'light' : 'dark';
    hero.classList.toggle('tone-light', tone === 'light');
    hero.classList.toggle('tone-dark', tone === 'dark');
    hero.setAttribute('data-tone', tone);
    var night = 1 - Math.min(1, Math.max(0, (L - 0.16) / 0.26));
    big.light(ART.lightAt(h)).lume(night);
    bar.lume(0.6);
    UI.kick();
  }
  paintSky(true);

  /* ── one loop for every watch on the page ── */
  var lastBeat = -1;
  (function loop() {
    var t = ART.now();
    if (t.s !== lastBeat) {
      lastBeat = t.s;
      var h = mode === 'hour' ? Math.floor(m.at) : t.h;
      var mi = mode === 'hour' ? (m.at % 1) * 60 : t.m;
      big.time(h, mi, t.s);
      bar.time(t.h, t.m, t.s);
      minis.forEach(function (w) { w.time(t.h, t.m, t.s); });
      paintSky(false);
    }
    requestAnimationFrame(loop);
  })();

  /* ── the macro film (only where it exists): scroll plays it, one line of copy per moment ── */
  var macroSec = $('[data-macro]'), macroShot = root.HZ_FILM && root.HZ_FILM.shot(m.id + '-macro');
  if (macroSec && macroShot) {
    var macro = root.HZ_FILM.make($('[data-macro-film]'), [macroShot.name], { eager: false });
    if (macro.tier !== 'board') {
      macroSec.hidden = false;
      $('[data-macro-eyebrow]').textContent = m.name + ', close';
      var beatEl = $('[data-macro-beat]'), beatNow = '';
      UI.onScroll(function () {
        var r = macroSec.getBoundingClientRect(), vh = window.innerHeight;
        if (macro.load && r.top < vh * 2.5) macro.load();
        if (r.bottom < 0 || r.top > vh) return;
        var p = UI.clamp(-r.top / (r.height - vh), 0, 1);
        macro.set(p);
        var b = macroShot.beats[0];
        macroShot.beats.forEach(function (x) { if (p >= x.at) b = x; });
        if (b.text !== beatNow) { beatNow = b.text; beatEl.textContent = b.text; }
      });
    }
  }

  /* ── scroll: the watch settles, the bar arrives, the hour photo eases in ── */
  var barEl = $('[data-buybar]');
  var hourSec = $('.wp-hour'), hourImg = $('[data-hour-img]');
  var foot = $('.foot');
  UI.onScroll(function () {
    var vh = window.innerHeight;
    var r = hero.getBoundingClientRect();
    var k = UI.clamp(-r.top / r.height, 0, 1);
    pair.style.setProperty('--wy', (k * 18).toFixed(1) + 'vh');
    pair.style.setProperty('--wsc', (1 - k * 0.14).toFixed(3));
    var on = r.bottom < vh * 0.4 && foot.getBoundingClientRect().top > vh;
    barEl.classList.toggle('is-on', on);
    barEl.setAttribute('aria-hidden', String(!on));
    barEl.querySelector('button').tabIndex = on ? 0 : -1;
    var hr = hourSec.getBoundingClientRect();
    if (hr.bottom > 0 && hr.top < vh) hourImg.style.setProperty('--hz', (1.12 - 0.12 * UI.clamp((vh - hr.top) / (vh + hr.height), 0, 1)).toFixed(4));
  });

  /* footer model links */
  var fm = $('[data-foot-models]');
  if (fm) fm.innerHTML = H.MODELS.map(function (o) { return '<li><a href="watch.html?m=' + o.id + '">' + esc(o.name) + '</a></li>'; }).join('');
})(window);
