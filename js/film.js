/*
 * HORÆ: scroll films. A film here is one or more Kling shots chained end to start (js/shots.js, `films`),
 * played on a canvas by a position the page sets, so the same clock that turns the drawn hands can play it.
 *
 *   var f = HZ_FILM.make(host, ['day-am', 'day-pm', 'day-eve'], { onTier: fn })
 *   f.tier                 'frames' | 'stills' | 'board'
 *   f.set(pos)             pos runs from 0 (the first still) to the number of shots (the last still)
 *   f.state()              { tier, pos, frame, loaded } for tests
 *
 * Three tiers, so the scene is designed whatever exists:
 *   frames   assets/film/<name>/d|m/0001.webp…  (listed in ready.js by optimize.mjs): drawn frame by frame
 *            (Math.floor on the frame index, never a tween), coarse frames first so scrubbing works early
 *   stills   every start and end still exists: they crossfade by position, with a slow push-in
 *   board    nothing yet: the host stays empty and the drawn scene underneath is the storyboard
 *
 * On a portrait phone the 'm' set is used: optimize.mjs crops it from the film at the shot's `focus`.
 */
(function (root) {
  var S = root.HORAE_SHOTS, READY = root.HORAE_READY || {}, MEDIA = root.HZ_MEDIA;
  var FILMS = READY.film || {};
  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  var smooth = function (t) { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
  var phone = function () { return root.matchMedia('(max-width: 760px) and (orientation: portrait)').matches; };
  var shot = function (name) { return S.films.filter(function (f) { return f.name === name; })[0]; };

  function make(host, names, opt) {
    opt = opt || {};
    var segs = names.map(shot);
    var stills = [segs[0].start].concat(segs.map(function (s) { return s.end; }));
    var focus = segs[0].focus == null ? 0.5 : segs[0].focus;
    /* fit 'contain': the whole frame shows (an object centred on a plain backdrop, like the box); phones then
       use the full frames, not the portrait crop, which would cut the object */
    var contain = opt.fit === 'contain';
    var set = !contain && phone() && segs.every(function (s) { return !FILMS[s.name] || FILMS[s.name].m; }) ? 'm' : 'd';
    var counts = segs.map(function (s) { return FILMS[s.name] ? FILMS[s.name][set] || 0 : 0; });
    var stillsReady = stills.every(function (id) { return MEDIA.ready(id); });
    /* frames when every shot has its film, or some do and the stills can stand in for the rest */
    var tier = counts.every(Boolean) || (counts.some(Boolean) && stillsReady) ? 'frames' : stillsReady ? 'stills' : 'board';
    host.classList.add('film', 'film--' + tier);
    if (contain) host.classList.add('film--contain');
    var api = { tier: tier, set: function () {}, state: function () { return { tier: tier }; } };
    if (opt.onTier) opt.onTier(tier);
    if (tier === 'board') return api;

    var pos = 0;

    /* ── stills: stacked images, crossfaded by position ── */
    if (tier === 'stills') {
      var imgs = stills.map(function (id, k) {
        var i = document.createElement('img');
        i.className = 'film__still';
        i.src = 'assets/img/' + id + '.webp';
        i.srcset = 'assets/img/' + id + '-sm.webp 900w, assets/img/' + id + '.webp 2000w';
        i.sizes = '100vw';
        i.alt = '';
        i.decoding = 'async';
        i.style.objectPosition = (focus * 100).toFixed(0) + '% 50%';
        i.style.opacity = k ? 0 : 1;
        host.appendChild(i);
        return i;
      });
      api.set = function (p) {
        pos = clamp(p, 0, segs.length);
        var calm = root.HZ_UI && root.HZ_UI.reduce();
        imgs.forEach(function (im, k) {
          /* still k fades in over shot k-1, on top of the earlier ones (later stills come later in the DOM) */
          var o = k === 0 ? 1 : smooth(pos - (k - 1));
          im.style.opacity = o.toFixed(3);
          im.style.transform = calm ? '' : 'scale(' + (1.02 + 0.04 * (pos / segs.length)).toFixed(4) + ')';
        });
      };
      api.state = function () { return { tier: tier, pos: +pos.toFixed(4), stills: stills }; };
      return api;
    }

    /* ── frames: one canvas, every shot's frames ── */
    var canvas = document.createElement('canvas');
    canvas.className = 'film__canvas';
    host.appendChild(canvas);
    var ctx = canvas.getContext('2d');
    var frames = segs.map(function () { return []; }), loaded = 0, started = false, drawn = '';
    var stand = {}; /* stills standing in for a missing film: id → Image */
    var src = function (k, i) { return 'assets/film/' + segs[k].name + '/' + set + '/' + String(i + 1).padStart(4, '0') + '.webp'; };
    function load() {
      if (started) return;
      started = true;
      var order = [];
      [16, 8, 4, 2, 1].forEach(function (step) {
        segs.forEach(function (s, k) {
          for (var i = 0; i < counts[k]; i += step) if (!frames[k][i]) { frames[k][i] = 'q'; order.push([k, i]); }
          if (step === 16 && counts[k] && !frames[k][counts[k] - 1]) { frames[k][counts[k] - 1] = 'q'; order.push([k, counts[k] - 1]); }
        });
      });
      segs.forEach(function (sg, k) {
        if (counts[k]) return;
        [sg.start, sg.end].forEach(function (id) {
          if (stand[id]) return;
          var im = new Image();
          im.decoding = 'async';
          im.onload = function () { stand[id] = im; draw(true); };
          im.src = 'assets/img/' + id + (phone() ? '-sm' : '') + '.webp';
          stand[id] = null;
        });
      });
      var next = 0, active = 0;
      (function pump() {
        while (active < 6 && next < order.length) {
          var ki = order[next++], im = new Image();
          active++;
          im.decoding = 'async';
          im.onload = (function (k, i, im) { return function () { frames[k][i] = im; loaded++; active--; pump(); draw(true); }; })(ki[0], ki[1], im);
          im.onerror = function () { active--; pump(); };
          im.src = src(ki[0], ki[1]);
        }
      })();
    }
    function nearest(k, i) {
      var f = frames[k];
      for (var d = 0; d < counts[k]; d++) {
        if (f[i - d] && f[i - d] !== 'q') return i - d;
        if (f[i + d] && f[i + d] !== 'q') return i + d;
      }
      return -1;
    }
    var W = 0, H = 0;
    function size() {
      var r = host.getBoundingClientRect(), dpr = Math.min(root.devicePixelRatio || 1, 2);
      W = Math.max(1, Math.round(r.width * dpr)); H = Math.max(1, Math.round(r.height * dpr));
      if (canvas.width !== W || canvas.height !== H) { canvas.width = W; canvas.height = H; drawn = ''; }
    }
    var cur = { k: 0, i: 0 };
    function draw(force) {
      var k = Math.min(segs.length - 1, Math.floor(pos)), t = pos - k;
      if (pos >= segs.length) { k = segs.length - 1; t = 1; }
      if (!counts[k]) {
        /* no film for this shot yet: its two stills crossfade */
        var A = stand[segs[k].start], B = stand[segs[k].end];
        if (!A || !B) return;
        var tk = k + ':s' + Math.round(t * 200);
        if (tk === drawn && !force) return;
        var paint = function (im, alpha) {
          var sc = (contain ? Math.min : Math.max)(W / im.naturalWidth, H / im.naturalHeight), ww = im.naturalWidth * sc, hh = im.naturalHeight * sc;
          ctx.globalAlpha = alpha;
          ctx.drawImage(im, (W - ww) * focus, (H - hh) / 2, ww, hh);
        };
        if (contain) ctx.clearRect(0, 0, W, H);
        paint(A, 1); paint(B, t * t * (3 - 2 * t)); ctx.globalAlpha = 1;
        drawn = tk; cur = { k: k, i: -1 };
        host.classList.add('has-frame');
        return;
      }
      var want = Math.min(counts[k] - 1, Math.floor(t * (counts[k] - 1) + 1e-6)); /* frame by frame */
      var i = nearest(k, want);
      if (i < 0) return;
      var key = k + ':' + i;
      if (key === drawn && !force) return;
      var im = frames[k][i], s = (contain ? Math.min : Math.max)(W / im.naturalWidth, H / im.naturalHeight);
      if (contain) ctx.clearRect(0, 0, W, H);
      var w = im.naturalWidth * s, h = im.naturalHeight * s;
      ctx.drawImage(im, (W - w) * focus, (H - h) / 2, w, h);
      drawn = key; cur = { k: k, i: i };
      host.classList.add('has-frame');
    }
    api.set = function (p) {
      pos = clamp(p, 0, segs.length);
      draw(false);
    };
    api.load = load;
    api.resize = function () { size(); draw(true); };
    api.state = function () { return { tier: tier, pos: +pos.toFixed(4), shot: segs[cur.k].name, frame: cur.i + 1, of: counts[cur.k], loaded: loaded, set: set }; };
    size();
    root.addEventListener('resize', function () { size(); draw(true); });
    if (opt.eager !== false) load();
    return api;
  }

  /* where a clock hour falls in a chain of day shots (each knows its `from` and `to` hour) */
  function hourPos(names, hh) {
    var segs = names.map(shot), first = segs[0].from, last = segs[segs.length - 1].to;
    var h = hh < 4.5 ? hh + 24 : hh;                       /* past midnight is still the night */
    if (h <= first) return 0;
    if (h >= last) return segs.length;
    for (var k = 0; k < segs.length; k++) if (h <= segs[k].to) return k + (h - segs[k].from) / (segs[k].to - segs[k].from);
    return segs.length;
  }

  root.HZ_FILM = { make: make, hourPos: hourPos, shot: shot };
})(window);
