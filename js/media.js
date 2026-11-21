/*
 * HORÆ: image slots.
 *
 *   <figure class="slot" data-shot="arktos-front"></figure>
 *   <figure class="slot slot--fill" data-shot="closing"></figure>
 *
 * If the shot id is listed in assets/img/ready.js (written by higgsfield/optimize.mjs),
 * the slot loads assets/img/<id>.webp (and <id>-sm.webp for small screens).
 * If not, it draws a placeholder that says exactly which picture belongs there,
 * over an engraved guilloché rosette in that hour's colour. Never a broken image.
 */
(function (root) {
  var SHOTS = root.HORAE_SHOTS;
  var READY = root.HORAE_READY || { img: [], video: [] };
  var img = {}, vid = {};
  (READY.img || []).forEach(function (id) { img[id] = 1; });
  (READY.video || []).forEach(function (id) { vid[id] = 1; });

  var ratio = function (a) { var p = a.split(':'); return p[0] + ' / ' + p[1]; };
  var backdrop = function (s) { var m = s.prompt.match(/Backdrop:[^#]*(#[0-9A-Fa-f]{6})/); return m ? m[1] : null; };
  var esc = function (t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var SEED = { dawn: 0, noon: 1, dusk: 2, night: 3, bench: 4 };

  function pending(el, s) {
    var bg = backdrop(s);
    el.classList.add('slot--pending', 'slot--' + s.tone);
    if (bg) {
      var n = parseInt(bg.slice(1), 16);
      var lum = (0.2126 * (n >> 16) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255;
      el.classList.add(lum > 0.55 ? 'slot--on-light' : 'slot--on-dark');
    }
    el.innerHTML =
      root.HZ_ART.guilloche(SEED[s.tone] || 0) +
      '<figcaption class="slot__note">' +
      '<span class="slot__tag"><b>Image pending</b><span>' + esc(s.id) + '</span><span>' + esc(s.aspect) + '</span></span>' +
      '<span class="slot__brief">' + esc(s.brief) + '</span>' +
      '</figcaption>';
    el.setAttribute('role', 'img');
    el.setAttribute('aria-label', s.alt + ' (image not produced yet)');
  }

  function picture(el, s) {
    var i = document.createElement('img');
    i.src = 'assets/img/' + s.id + '.webp';
    i.srcset = 'assets/img/' + s.id + '-sm.webp 900w, assets/img/' + s.id + '.webp 2000w';
    i.sizes = el.getAttribute('data-img-sizes') || '100vw';
    i.alt = s.alt;
    i.decoding = 'async';
    if (s.priority) { i.loading = 'eager'; i.setAttribute('fetchpriority', 'high'); } else i.loading = 'lazy';
    if (el.dataset.focus) i.style.objectPosition = el.dataset.focus;
    i.addEventListener('load', function () { el.classList.add('is-loaded'); });
    el.innerHTML = '';
    el.appendChild(i);
    el.classList.add('slot--ready');
    if (i.complete) el.classList.add('is-loaded');
  }

  function video(el, id) {
    var v = document.createElement('video');
    v.className = 'slot__video';
    v.muted = true; v.loop = true; v.playsInline = true; v.autoplay = !document.documentElement.classList.contains('reduce');
    v.setAttribute('muted', ''); v.setAttribute('playsinline', '');
    v.preload = 'auto';
    v.src = 'assets/video/' + id + '.mp4';
    el.appendChild(v);
  }

  function fill(el) {
    var id = el.getAttribute('data-shot');
    var s = SHOTS && SHOTS.byId[id];
    if (!s) { el.textContent = 'Unknown shot: ' + id; return; }
    if (!el.classList.contains('slot--fill')) el.style.aspectRatio = ratio(s.aspect);
    var bg = backdrop(s);
    if (bg) el.style.setProperty('--slot-bg', bg);
    if (img[id]) picture(el, s);
    else pending(el, s);
    var v = el.getAttribute('data-video');
    if (v && vid[v]) video(el, v);
  }

  root.HZ_MEDIA = {
    fill: fill,
    all: function (scope) { Array.prototype.forEach.call((scope || document).querySelectorAll('[data-shot]'), fill); },
    ready: function (id) { return !!img[id]; },
  };
})(window);
