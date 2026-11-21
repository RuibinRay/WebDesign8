/*
 * HORÆ: everything drawn in code. No images needed.
 *
 *   HZ_ART.mark()                    the logo: twelve hour points around an Æ
 *   HZ_ART.guilloche(seed)           engraved rosette, the pattern behind every image placeholder
 *   HZ_ART.watch(model, {strap})     a live watch: .time(h,m,s) .light({...}) .lume(v) .strap(color)
 *                                    When the cut-out photo of the watch exists (ready.js `cut`), the case, dial and
 *                                    strap are that photograph and only the hands are drawn, live, on its pinion.
 *                                    ?drawn in the address shows the drawings instead.
 *   HZ_ART.back(model, {strap})      the back: strap lining, engraved case back, the movement under sapphire
 *   HZ_ART.calibre()                 the nine layers of the exploded movement, top first
 *   HZ_ART.now() / moonPhase(date)   the time at 8 beats a second, and the real moon
 */
(function (root) {
  var uid = 0;
  var r2 = function (n) { return Math.round(n * 100) / 100; };
  var pt = function (r, deg) { var a = (deg - 90) * Math.PI / 180; return [r2(r * Math.cos(a)), r2(r * Math.sin(a))]; };
  var rng = function (seed) { return function () { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }; };
  var SERIF = "'Bodoni Moda', 'Didot', 'Bodoni 72', serif";

  /* ───────── photographs (cut out by higgsfield/cutout.mjs, measured by optimize.mjs) ───────── */
  var CUT = (root.HORAE_READY || {}).cut || {};
  var drawnOnly = /[?&]drawn\b/.test(root.location ? root.location.search : '');
  function photoOf(id) { return !drawnOnly && CUT[id] ? { id: id, fit: CUT[id] } : null; }
  /* the photo placed so its case circle is the drawing's (radius 160 at 0,0); without a strap it is cut to the
     head: the case, the lugs and the crown (on the right from the front, on the left from the back) */
  function photoLayer(P, id, withStrap, crownSide, lazy) {
    var f = P.fit, w = 160 / f.r, h = w / f.a;
    /* lazy: the address waits in data-href until api.load() (a watch that is not on screen yet) */
    var img = '<image ' + (lazy ? 'data-' : '') + 'href="assets/img/' + P.id + '-cut' + (withStrap ? '' : '-sm') + '.webp" x="' + r2(-f.u * w) + '" y="' + r2(-f.v * h) + '" width="' + r2(w) + '" height="' + r2(h) + '" preserveAspectRatio="none"/>';
    if (withStrap) return { defs: '', body: img };
    return {
      defs: '<clipPath id="ph' + id + '"><circle r="165"/><rect x="-90" y="-180" width="180" height="360"/><rect x="' + (crownSide > 0 ? 148 : -186) + '" y="-26" width="38" height="52"/></clipPath>',
      body: '<g clip-path="url(#ph' + id + ')">' + img + '</g>',
    };
  }

  var METAL = {
    steel: ['#F4F5F6', '#AEB4BA', '#6B727A', '#E2E5E8', '#8D949B'],
    white: ['#FBFBF8', '#D3D3CD', '#8C8C86', '#EFEFEA', '#ADADA7'],
    rose: ['#F8DECD', '#D8A185', '#93563C', '#EFC8AF', '#B6795B'],
    platinum: ['#EEF1F4', '#B5BBC3', '#646B74', '#DCE1E6', '#8A919A'],
    gold: ['#F7E6B4', '#DDB86C', '#9A7432', '#EDD08A', '#BA9047'],
    rhodium: ['#E9ECEF', '#BFC5CC', '#8E959E', '#D6DBE0', '#A5ACB4'],
  };

  var LOOK = {
    anatole: { photoDial: 0.77, metal: 'steel', dial: 'sunburst', a: '#E9B7A3', b: '#F3DFB5', ink: '#4D3529', hands: 'steel', idx: 'baton', secs: 'center', strap: '#B9BEC3', bracelet: true },
    mesembria: { photoDial: 0.91, metal: 'white', dial: 'enamel', a: '#FCFAF4', b: '#EDE7DA', ink: '#15120E', hands: 'blued', idx: 'roman', secs: 'center', strap: '#1A1A1E' },
    hesperis: { photoDial: 0.86, metal: 'rose', dial: 'sector', a: '#E8AE92', b: '#D58F72', ink: '#5A2D1D', hands: 'rose', idx: 'baton', secs: 'sub', strap: '#4A2A1E' },
    arktos: { photoDial: 0.88, metal: 'platinum', dial: 'aventurine', a: '#1A2A57', b: '#070D24', ink: '#DCE2EE', hands: 'lume', idx: 'lume', secs: 'center', moon: true, strap: '#101827' },
  };
  var LUME_DAY = '#E2EEE3', LUME_GLOW = '#A6FFD0';

  /* ───────── shared defs ───────── */
  function metalGrad(id, m, rev) {
    var c = METAL[m];
    return '<linearGradient id="' + id + '" x1="' + (rev ? 1 : 0) + '" y1="0" x2="' + (rev ? 0 : 1) + '" y2="1">' +
      '<stop offset="0" stop-color="' + c[0] + '"/><stop offset=".32" stop-color="' + c[1] + '"/><stop offset=".5" stop-color="' + c[2] + '"/>' +
      '<stop offset=".68" stop-color="' + c[3] + '"/><stop offset="1" stop-color="' + c[4] + '"/></linearGradient>';
  }
  var glowFilter = function (id) {
    return '<filter id="' + id + '" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="2.6" result="b"/>' +
      '<feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>';
  };

  /* ───────── the mark ───────── */
  function mark() {
    var dots = '';
    for (var i = 0; i < 12; i++) { var p = pt(17, i * 30); dots += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="' + (i % 3 ? 0.75 : 1.25) + '"/>'; }
    return '<svg class="mark" viewBox="-20 -20 40 40" aria-hidden="true"><g fill="currentColor">' + dots + '</g>' +
      '<circle r="13.4" fill="none" stroke="currentColor" stroke-width=".6"/>' +
      '<text y="5.6" text-anchor="middle" font-family="' + SERIF.replace(/'/g, '&#39;') + '" font-size="15.5" font-weight="500" fill="currentColor">Æ</text></svg>';
  }

  /* ───────── guilloché rosette (placeholders) ───────── */
  function guilloche(seed) {
    var n = 36 + (seed || 0) * 6, out = '';
    for (var i = 0; i < n; i++) { var p = pt(44, i * 360 / n); out += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="44"/>'; }
    var rings = '';
    for (var k = 0; k < 7; k++) rings += '<circle r="' + (92 + k * 3) + '"/>';
    return '<svg class="slot__art" viewBox="-100 -100 200 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' +
      '<g fill="none" stroke="currentColor" stroke-width=".28">' + out + rings + '</g></svg>';
  }

  /* ───────── dial (shared by the live watch and the calibre) ───────── */
  function dial(L, id, opt) {
    opt = opt || {};
    var s = '', defs = '';
    var R = 139;
    if (L.dial === 'sunburst') defs += '<linearGradient id="dg' + id + '" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="' + L.a + '"/><stop offset="1" stop-color="' + L.b + '"/></linearGradient>';
    else defs += '<radialGradient id="dg' + id + '" cx=".46" cy=".42" r=".62"><stop offset="0" stop-color="' + L.a + '"/><stop offset="1" stop-color="' + L.b + '"/></radialGradient>';
    defs += '<clipPath id="dc' + id + '"><circle r="' + R + '"/></clipPath>';
    s += '<circle r="' + R + '" fill="url(#dg' + id + ')"/>';
    var deco = '';
    if (L.dial === 'sunburst') {
      for (var i = 0; i < 144; i++) {
        var p = pt(R, i * 2.5);
        deco += '<line x2="' + p[0] + '" y2="' + p[1] + '" stroke="' + (i % 2 ? 'rgba(255,255,255,.13)' : 'rgba(110,50,30,.07)') + '" stroke-width="1.6"/>';
      }
      deco += '<g data-sheen><path d="M0 0L' + pt(R + 4, -11) + 'A' + (R + 4) + ' ' + (R + 4) + ' 0 0 1 ' + pt(R + 4, 11) + 'Z" fill="rgba(255,250,240,.26)"/>' +
        '<path d="M0 0L' + pt(R + 4, 169) + 'A' + (R + 4) + ' ' + (R + 4) + ' 0 0 1 ' + pt(R + 4, 191) + 'Z" fill="rgba(255,250,240,.18)"/></g>';
    } else if (L.dial === 'enamel') {
      deco += '<circle r="' + (R - 2) + '" fill="none" stroke="rgba(60,40,10,.07)" stroke-width="5"/>' +
        '<ellipse cx="-38" cy="-52" rx="70" ry="40" fill="rgba(255,255,255,.55)" transform="rotate(-32)" style="filter:blur(10px)"/>';
    } else if (L.dial === 'sector') {
      deco += '<circle r="125" fill="none" stroke="rgba(120,45,20,.16)" stroke-width="28"/>' +
        '<circle r="111" fill="none" stroke="' + L.ink + '" stroke-opacity=".4" stroke-width=".8"/>' +
        '<circle r="84" fill="none" stroke="' + L.ink + '" stroke-opacity=".3" stroke-width=".7"/>';
    } else if (L.dial === 'aventurine') {
      var rnd = rng(7 + id);
      for (var j = 0; j < 230; j++) {
        var rr = Math.sqrt(rnd()) * R, aa = rnd() * 360, q = pt(rr, aa);
        deco += '<circle cx="' + q[0] + '" cy="' + q[1] + '" r="' + r2(0.35 + rnd() * 1.05) + '" fill="' + (rnd() > 0.55 ? '#F2D8A6' : '#FFFFFF') + '" opacity="' + r2(0.35 + rnd() * 0.6) + '"/>';
      }
    }
    s += '<g clip-path="url(#dc' + id + ')">' + deco + '</g>';

    /* minute track */
    var track = '';
    var tc = L.dial === 'aventurine' ? 'rgba(220,226,238,.55)' : L.ink;
    if (L.dial === 'enamel') {
      track += '<circle r="124" fill="none" stroke="' + tc + '" stroke-width=".8"/><circle r="132" fill="none" stroke="' + tc + '" stroke-width=".8"/>';
      for (var t = 0; t < 60; t++) { var a1 = pt(124, t * 6), b1 = pt(132, t * 6); track += '<line x1="' + a1[0] + '" y1="' + a1[1] + '" x2="' + b1[0] + '" y2="' + b1[1] + '" stroke="' + tc + '" stroke-width="' + (t % 5 ? 0.7 : 1.4) + '"/>'; }
    } else {
      var r0 = L.dial === 'sector' ? 128 : 131;
      for (var u = 0; u < 60; u++) {
        var c1 = pt(u % 5 ? r0 + 3 : r0, u * 6), d1 = pt(136, u * 6);
        track += '<line x1="' + c1[0] + '" y1="' + c1[1] + '" x2="' + d1[0] + '" y2="' + d1[1] + '" stroke="' + tc + '" stroke-opacity="' + (L.dial === 'sunburst' ? 0.55 : 0.8) + '" stroke-width="' + (u % 5 ? 0.6 : 1.1) + '"/>';
      }
    }
    s += track;

    /* indices */
    var idx = '', glow = '';
    if (L.idx === 'baton') {
      var hm = L.hands === 'rose' ? 'rose' : 'steel';
      var ri = L.dial === 'sector' ? [88, 106] : [98, 124];
      for (var h = 0; h < 12; h++) {
        if (h === 6 && L.secs === 'sub') continue;
        var w = h === 0 ? 4 : 5.4, len = ri[1] - ri[0];
        var one = function (dx) { return '<rect x="' + (dx - w / 2) + '" y="' + -ri[1] + '" width="' + w + '" height="' + len + '" rx=".8" fill="url(#hm' + id + ')" stroke="rgba(0,0,0,.25)" stroke-width=".5" transform="rotate(' + h * 30 + ')"/>'; };
        idx += h === 0 ? one(-4) + one(4) : one(0);
      }
      defs += metalGrad('hm' + id, hm);
    } else if (L.idx === 'roman') {
      var nums = ['XII', 'I', 'II', 'III', 'IIII', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];
      for (var n = 0; n < 12; n++) {
        var pn = pt(106, n * 30);
        idx += '<text x="' + pn[0] + '" y="' + pn[1] + '" dy=".35em" text-anchor="middle" font-family="' + SERIF.replace(/'/g, '&#39;') + '" font-size="' + (n === 0 ? 20 : 18) + '" font-weight="500" fill="' + L.ink + '">' + nums[n] + '</text>';
      }
    } else if (L.idx === 'lume') {
      for (var k = 0; k < 12; k++) {
        if (k === 0) {
          var tri = 'M0,-128 L7,-114 L-7,-114Z';
          idx += '<path d="' + tri + '" fill="' + LUME_DAY + '" stroke="#C9CED6" stroke-width="1"/>';
          glow += '<path d="' + tri + '" fill="' + LUME_GLOW + '"/>';
        } else {
          var pk = pt(119, k * 30), rk = k % 3 ? 4.4 : 5.6;
          idx += '<circle cx="' + pk[0] + '" cy="' + pk[1] + '" r="' + rk + '" fill="' + LUME_DAY + '" stroke="#C9CED6" stroke-width="1"/>';
          glow += '<circle cx="' + pk[0] + '" cy="' + pk[1] + '" r="' + (rk - 0.6) + '" fill="' + LUME_GLOW + '"/>';
        }
      }
    }
    s += '<g data-casts>' + idx + '</g>';
    if (glow) s += '<g filter="url(#gl' + id + ')" style="opacity:var(--lume,0)">' + glow + '</g>';

    /* name */
    s += '<text y="-58" text-anchor="middle" font-family="' + SERIF.replace(/'/g, '&#39;') + '" font-size="13" font-weight="500" letter-spacing="4.5" fill="' + L.ink + '" fill-opacity=".92">HORÆ</text>';

    /* moon phase */
    if (L.moon) {
      defs += '<clipPath id="mw' + id + '"><path d="M-36,78 A36,36 0 0 1 36,78 Z"/></clipPath>' +
        '<radialGradient id="mg' + id + '" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#FBEBC0"/><stop offset="1" stop-color="#C99D4E"/></radialGradient>';
      var stars = '';
      var rs = rng(91);
      for (var st = 0; st < 22; st++) stars += '<circle cx="' + r2(-34 + rs() * 68) + '" cy="' + r2(44 + rs() * 32) + '" r="' + r2(0.4 + rs() * 0.7) + '" fill="#fff" opacity="' + r2(0.4 + rs() * 0.5) + '"/>';
      s += '<g clip-path="url(#mw' + id + ')"><rect x="-40" y="38" width="80" height="42" fill="#0B1538"/>' + stars +
        '<circle data-moon cx="0" cy="62" r="13.5" fill="url(#mg' + id + ')"/>' +
        '<circle cx="-36" cy="78" r="18" fill="' + L.b + '"/><circle cx="36" cy="78" r="18" fill="' + L.b + '"/></g>' +
        '<path d="M-36,78 A36,36 0 0 1 36,78" fill="none" stroke="#C9CED6" stroke-width="1.2"/>';
    }

    /* small seconds */
    if (L.secs === 'sub') {
      var sub = '<circle cx="0" cy="66" r="27" fill="rgba(110,40,20,.1)" stroke="' + L.ink + '" stroke-opacity=".45" stroke-width=".7"/>';
      for (var z = 0; z < 60; z += 5) { var e1 = pt(22, z * 6), e2 = pt(26, z * 6); sub += '<line x1="' + e1[0] + '" y1="' + (e1[1] + 66) + '" x2="' + e2[0] + '" y2="' + (e2[1] + 66) + '" stroke="' + L.ink + '" stroke-opacity=".7" stroke-width=".8"/>'; }
      s += sub;
    }
    return { defs: defs, body: s };
  }

  /* ───────── hands ───────── */
  function hands(L, id, photo) {
    var out = '', defs = '';
    var facet = function (len, w, tail, light, dark) {
      return '<path d="M0,' + -len + ' L' + -w + ',-8 L0,' + tail + 'Z" fill="' + light + '"/><path d="M0,' + -len + ' L' + w + ',-8 L0,' + tail + 'Z" fill="' + dark + '"/>';
    };
    var H, M, S;
    if (L.hands === 'blued') {
      var bl = '#22408F', bh = '#3C62C2';
      var pomme = function (shaft, ring, rr, tip, w) {
        return '<path d="M' + -w + ',16 L' + -w + ',' + -shaft + ' L' + w + ',' + -shaft + ' L' + w + ',16Z" fill="' + bl + '"/>' +
          '<circle cy="' + -ring + '" r="' + rr + '" fill="none" stroke="' + bl + '" stroke-width="2.6"/>' +
          '<path d="M-1.3,' + -(ring + rr) + ' L0,' + -tip + ' L1.3,' + -(ring + rr) + 'Z" fill="' + bh + '"/>';
      };
      H = pomme(50, 58, 8, 84, 1.5);
      M = pomme(96, 104, 6.5, 128, 1.2);
      S = '<line y1="26" y2="-130" stroke="' + bl + '" stroke-width="1.1"/><circle cy="19" r="3.4" fill="' + bl + '"/>';
    } else if (L.hands === 'lume') {
      var wg = METAL.white;
      var sword = function (len, w) {
        return '<path d="M0,' + -len + ' L' + w + ',' + -(len - 14) + ' L' + w + ',10 L' + -w + ',10 L' + -w + ',' + -(len - 14) + 'Z" fill="' + wg[1] + '" stroke="' + wg[2] + '" stroke-width=".6"/>' +
          '<path d="M0,' + -(len - 7) + ' L' + (w - 2.4) + ',' + -(len - 16) + ' L' + (w - 2.4) + ',-8 L' + -(w - 2.4) + ',-8 L' + -(w - 2.4) + ',' + -(len - 16) + 'Z" fill="' + LUME_DAY + '"/>' +
          '<path d="M0,' + -(len - 7) + ' L' + (w - 2.4) + ',' + -(len - 16) + ' L' + (w - 2.4) + ',-8 L' + -(w - 2.4) + ',-8 L' + -(w - 2.4) + ',' + -(len - 16) + 'Z" fill="' + LUME_GLOW + '" filter="url(#gl' + id + ')" style="opacity:var(--lume,0)"/>';
      };
      H = sword(86, 7);
      M = sword(126, 5.4);
      S = '<line y1="28" y2="-132" stroke="' + wg[1] + '" stroke-width="1.2"/><circle cy="20" r="4" fill="' + wg[1] + '"/>' +
        '<circle cy="-110" r="2.8" fill="' + LUME_DAY + '"/><circle cy="-110" r="2.4" fill="' + LUME_GLOW + '" filter="url(#gl' + id + ')" style="opacity:var(--lume,0)"/>';
    } else {
      var c = METAL[L.hands === 'rose' ? 'rose' : 'steel'];
      H = facet(86, 5.6, 14, c[0], c[2]);
      M = facet(126, 4.4, 16, c[0], c[2]);
      S = L.secs === 'center' ? '<line y1="28" y2="-132" stroke="' + c[2] + '" stroke-width="1.2"/><circle cy="20" r="3.6" fill="' + c[2] + '"/>' : '';
    }
    out += '<g data-h>' + H + '</g><g data-m>' + M + '</g>';
    if (L.secs === 'center') out += '<g data-s>' + S + '</g>';
    var capc = METAL[L.metal === 'rose' ? 'rose' : 'white'];
    out += '<circle r="5.6" fill="' + capc[1] + '" stroke="rgba(0,0,0,.3)" stroke-width=".5"/><circle r="1.8" fill="' + capc[2] + '"/>';
    var sub = '';
    if (L.secs === 'sub' && !photo) sub = '<g transform="translate(0,66)"><g data-s><line y1="5" y2="-24" stroke="' + METAL.rose[2] + '" stroke-width="1"/></g><circle r="2.4" fill="' + METAL.rose[1] + '"/></g>';
    return { defs: defs, body: sub + out };
  }

  /* ───────── straps ───────── */
  function strapMarkup(color, bracelet, metal) {
    var top = '', c = METAL[metal || 'steel'];
    if (bracelet) {
      for (var y = -146; y > -320; y -= 24) {
        var w = 64 - Math.min(10, (-146 - y) / 18);
        top += '<rect x="' + -w + '" y="' + (y - 22) + '" width="' + (w * 0.62) + '" height="22" rx="2.5" fill="' + c[1] + '" stroke="rgba(0,0,0,.22)" stroke-width=".7"/>' +
          '<rect x="' + (w * 0.38) + '" y="' + (y - 22) + '" width="' + (w * 0.62) + '" height="22" rx="2.5" fill="' + c[1] + '" stroke="rgba(0,0,0,.22)" stroke-width=".7"/>' +
          '<rect x="' + (-w * 0.38) + '" y="' + (y - 22) + '" width="' + (w * 0.76) + '" height="22" rx="3" fill="' + c[0] + '" stroke="rgba(0,0,0,.25)" stroke-width=".7"/>';
      }
    } else {
      top = '<path d="M-66,-138 L-58,-320 L58,-320 L66,-138Z" fill="' + color + '"/>' +
        '<path d="M-56,-150 L-49,-320 M56,-150 L49,-320" stroke="rgba(255,255,255,.2)" stroke-width="1" stroke-dasharray="4 4" fill="none"/>' +
        '<path d="M-66,-138 L-58,-320 L58,-320 L66,-138Z" fill="url(#strapShade)" opacity=".5"/>';
    }
    return '<g>' + top + '</g><g transform="scale(1,-1)">' + top + '</g>';
  }

  /* ───────── the live watch ───────── */
  function watch(model, opt) {
    opt = opt || {};
    var L = LOOK[model] || LOOK.arktos, id = ++uid;
    var withStrap = opt.strap !== false;
    var P = photoOf(model + '-plate');
    var d = dial(L, id), hd = hands(L, id, !!P);
    var defs = metalGrad('cm' + id, L.metal) + metalGrad('cr' + id, L.metal, true) + glowFilter('gl' + id) + d.defs + hd.defs +
      '<filter id="sh' + id + '" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="2" dy="3" stdDeviation="1.6" flood-color="#000" flood-opacity=".35"/></filter>' +
      '<linearGradient id="gz' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".34"/><stop offset=".6" stop-color="#fff" stop-opacity="0"/></linearGradient>' +
      '<linearGradient id="strapShade" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000" stop-opacity=".5"/><stop offset=".2" stop-color="#000" stop-opacity="0"/><stop offset=".8" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".5"/></linearGradient>';
    var lug = '<path d="M50,-118 L56,-166 Q57,-174 65,-174 L74,-174 Q81,-173 80,-164 L74,-112Z" fill="url(#cm' + id + ')" stroke="rgba(0,0,0,.25)" stroke-width=".6"/>';
    var body =
      (withStrap ? '<g data-strap>' + strapMarkup(L.strap, L.bracelet, L.metal) + '</g>' : '') +
      lug + '<g transform="scale(-1,1)">' + lug + '</g><g transform="scale(1,-1)">' + lug + '</g><g transform="scale(-1,-1)">' + lug + '</g>' +
      '<rect x="150" y="-9" width="12" height="18" rx="2" fill="url(#cm' + id + ')"/>' +
      '<rect x="158" y="-17" width="16" height="34" rx="4" fill="url(#cm' + id + ')" stroke="rgba(0,0,0,.3)" stroke-width=".6"/>' +
      '<path d="M162,-14V14M166,-14V14M170,-14V14" stroke="rgba(0,0,0,.22)" stroke-width="1"/>' +
      '<circle r="160" fill="url(#cm' + id + ')" stroke="rgba(0,0,0,.35)" stroke-width=".8"/>' +
      '<circle r="153" fill="none" stroke="url(#cr' + id + ')" stroke-width="7"/>' +
      '<circle r="146" fill="' + METAL[L.metal][2] + '"/>' +
      '<g data-dial>' + d.body + '</g>' +
      '<g data-hands filter="url(#sh' + id + ')">' + hd.body + '</g>' +
      '<g data-glare clip-path="url(#dc' + id + ')"><ellipse cx="-30" cy="-96" rx="170" ry="92" fill="url(#gz' + id + ')" transform="rotate(-24)"/></g>' +
      '<circle r="146" fill="none" stroke="rgba(255,255,255,.18)" stroke-width="1"/>';
    if (P) {
      /* the photograph, and the drawn hands on its pinion, scaled to its dial */
      var pl = photoLayer(P, id, withStrap, 1, opt.lazy);
      defs += pl.defs;
      body = pl.body + '<g data-hands filter="url(#sh' + id + ')"><g transform="scale(' + r2(L.photoDial * 160 / 146) + ')">' + hd.body + '</g></g>';
    }

    var NS = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', withStrap ? '-200 -300 400 600' : '-182 -182 364 364');
    svg.setAttribute('class', 'watch watch--' + model + (P ? ' watch--photo' : ''));
    svg.setAttribute('aria-hidden', 'true');
    svg.innerHTML = '<defs>' + defs + '</defs>' + body;

    var q = function (s) { return svg.querySelector(s); };
    var hH = q('[data-h]'), hM = q('[data-m]'), hS = q('[data-s]'), sh = q('feDropShadow'), sheen = q('[data-sheen]'), glare = q('[data-glare] ellipse'), moon = q('[data-moon]'), strapG = q('[data-strap]');
    var casts = q('[data-casts]');
    if (casts && L.idx !== 'roman') casts.setAttribute('filter', 'url(#sh' + id + ')');

    if (moon) { var ph = moonPhase(new Date()); moon.setAttribute('cx', r2(-48 + 96 * ph)); }

    var api = {
      el: svg, model: model, photo: !!P,
      load: function () { var im = svg.querySelector('image[data-href]'); if (im) { im.setAttribute('href', im.getAttribute('data-href')); im.removeAttribute('data-href'); } return api; },
      time: function (h, m, s) {
        var hr = (h % 12) + m / 60 + s / 3600, mn = m + s / 60;
        hH.setAttribute('transform', 'rotate(' + r2(hr * 30) + ')');
        hM.setAttribute('transform', 'rotate(' + r2(mn * 6) + ')');
        if (hS) hS.setAttribute('transform', 'rotate(' + r2(s * 6) + ')');
        return api;
      },
      /* light: dx, dy shadow offset; blur; alpha; deg = where the light comes from (0 = above) */
      light: function (o) {
        sh.setAttribute('dx', r2(o.dx)); sh.setAttribute('dy', r2(o.dy));
        sh.setAttribute('stdDeviation', r2(o.blur)); sh.setAttribute('flood-opacity', r2(o.alpha));
        if (sheen) sheen.setAttribute('transform', 'rotate(' + r2(o.deg) + ')');
        if (glare) glare.setAttribute('transform', 'rotate(' + r2(-24 + o.deg * 0.35) + ')');
        return api;
      },
      lume: function (v) { svg.style.setProperty('--lume', r2(v)); return api; },
      strap: function (color, bracelet) { if (strapG) strapG.innerHTML = strapMarkup(color, !!bracelet, L.metal); return api; },
    };
    api.time(10, 9, 36);
    return api;
  }

  /* ───────── light: where the sun is at a clock hour, and the shadow it makes the hands cast ───────── */
  function lightAt(hh) {
    var cl = function (v, a, b) { return v < a ? a : v > b ? b : v; };
    var sm = function (a, b, v) { var t = cl((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
    var lp = function (a, b, t) { return a + (b - a) * t; };
    var th = Math.PI * (hh - 6.2) / 12.6, el = Math.sin(th);
    var e = cl(el, 0, 1), up = sm(-0.04, 0.08, el), len = 2 + 11 * (1 - e);
    return {
      th: th, el: el,
      dx: lp(1, Math.cos(th) * len, up),          /* long and sideways at sunrise and sunset */
      dy: lp(2.4, 1.5 + 4 * (1 - e), up),         /* short at noon */
      blur: lp(2.6, 1 + 1.8 * (1 - e), up),       /* soft at night */
      alpha: lp(0.22, 0.26 + 0.16 * (1 - e), up),
      deg: lp(0, (th / Math.PI - 0.5) * -140, up),
    };
  }

  /* ───────── time ───────── */
  function now() {
    var d = new Date();
    var ms = d.getSeconds() * 1000 + d.getMilliseconds();
    return { h: d.getHours(), m: d.getMinutes(), s: Math.floor(ms / 125) / 8 }; /* 4 Hz: eight beats a second */
  }
  function moonPhase(date) {
    var ref = Date.UTC(2000, 0, 6, 18, 14);
    var days = (date.getTime() - ref) / 86400000;
    var p = (days / 29.530588853) % 1;
    return p < 0 ? p + 1 : p;
  }

  /* ───────── the calibre, exploded ───────── */
  function gear(r, teeth, depth, holes, hub) {
    var d = '', step = 360 / teeth;
    for (var i = 0; i < teeth; i++) {
      var a0 = i * step;
      d += (i ? 'L' : 'M') + pt(r - depth, a0) + 'L' + pt(r, a0 + step * 0.22) + 'L' + pt(r, a0 + step * 0.5) + 'L' + pt(r - depth, a0 + step * 0.72);
    }
    d += 'Z';
    var circ = function (cx, cy, rr) { return 'M' + r2(cx + rr) + ',' + r2(cy) + 'A' + rr + ',' + rr + ' 0 1 0 ' + r2(cx - rr) + ',' + r2(cy) + 'A' + rr + ',' + rr + ' 0 1 0 ' + r2(cx + rr) + ',' + r2(cy) + 'Z'; };
    for (var k = 0; k < holes; k++) { var p = pt(r * 0.56, k * 360 / holes + 45); d += circ(p[0], p[1], r * 0.24); }
    d += circ(0, 0, hub || r * 0.12);
    return d;
  }

  function layerSvg(inner, defs, cls) {
    return '<svg class="cal__svg' + (cls ? ' ' + cls : '') + '" viewBox="-200 -200 400 400" aria-hidden="true"><defs>' + (defs || '') + '</defs>' + inner + '</svg>';
  }

  function calibre() {
    var L = LOOK.arktos, out = [];
    var id = ++uid;

    /* 1 crystal */
    out.push(layerSvg(
      '<circle r="150" fill="url(#cy' + id + ')" stroke="rgba(255,255,255,.55)" stroke-width="1.4"/>' +
      '<circle r="141" fill="none" stroke="rgba(255,255,255,.18)" stroke-width="1"/>' +
      '<path d="M-118,-70 A138,138 0 0 1 40,-134" fill="none" stroke="rgba(255,255,255,.55)" stroke-width="5" stroke-linecap="round" opacity=".55"/>',
      '<radialGradient id="cy' + id + '" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#DDE8FF" stop-opacity=".22"/><stop offset="1" stop-color="#9FB6E8" stop-opacity=".06"/></radialGradient>'));

    /* 2 case */
    var lug = '<path d="M50,-118 L56,-166 Q57,-174 65,-174 L74,-174 Q81,-173 80,-164 L74,-112Z" fill="url(#ca' + id + ')" stroke="rgba(0,0,0,.3)" stroke-width=".6"/>';
    out.push(layerSvg(
      lug + '<g transform="scale(-1,1)">' + lug + '</g><g transform="scale(1,-1)">' + lug + '</g><g transform="scale(-1,-1)">' + lug + '</g>' +
      '<rect x="158" y="-17" width="16" height="34" rx="4" fill="url(#ca' + id + ')" stroke="rgba(0,0,0,.3)" stroke-width=".6"/>' +
      '<path fill-rule="evenodd" d="M160,0A160,160 0 1 0 -160,0A160,160 0 1 0 160,0Z M146,0A146,146 0 1 1 -146,0A146,146 0 1 1 146,0Z" fill="url(#ca' + id + ')" stroke="rgba(0,0,0,.35)" stroke-width=".8"/>' +
      '<circle r="153" fill="none" stroke="url(#cb' + id + ')" stroke-width="7"/>',
      metalGrad('ca' + id, 'platinum') + metalGrad('cb' + id, 'platinum', true)));

    /* 3 hands (fixed at ten past ten) */
    var hd = hands(L, id);
    out.push(layerSvg('<g style="--lume:.85">' + hd.body.replace('<g data-h>', '<g data-h transform="rotate(305)">').replace('<g data-m>', '<g data-m transform="rotate(60)">').replace('<g data-s>', '<g data-s transform="rotate(192)">') + '</g>',
      glowFilter('gl' + id) + hd.defs));

    /* 4 dial */
    var d = dial(L, id);
    out.push(layerSvg('<g style="--lume:.8">' + d.body + '</g>', d.defs + glowFilter('gl' + id)));

    /* 5 bridges and balance */
    var rh = metalGrad('rh' + id, 'rhodium');
    var cotes = '<linearGradient id="cs' + id + '" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>' +
      '<pattern id="cp' + id + '" width="18" height="18" patternUnits="userSpaceOnUse" patternTransform="rotate(-32)"><rect width="18" height="18" fill="url(#cs' + id + ')"/></pattern>';
    var ruby = '<radialGradient id="rb' + id + '" cx=".38" cy=".35" r=".7"><stop offset="0" stop-color="#FF6A86"/><stop offset=".55" stop-color="#B0122F"/><stop offset="1" stop-color="#5A0716"/></radialGradient>';
    var bridges = [
      'M-112,-62 Q-104,-112 -42,-104 Q18,-96 22,-42 Q26,4 -18,24 Q-70,44 -102,12 Q-122,-22 -112,-62Z',
      'M30,-84 Q84,-94 108,-42 Q120,0 98,22 L52,30 Q28,12 30,-22Z',
      'M-20,104 Q-34,64 6,44 Q46,24 70,40 L58,70 Q30,64 20,88 Q10,112 -20,104Z',
    ];
    var br = '';
    bridges.forEach(function (p) {
      br += '<path d="' + p + '" fill="url(#rh' + id + ')"/><path d="' + p + '" fill="url(#cp' + id + ')" opacity=".75"/>' +
        '<path d="' + p + '" fill="none" stroke="#FFFFFF" stroke-opacity=".9" stroke-width="2.2"/><path d="' + p + '" fill="none" stroke="#5E656E" stroke-opacity=".7" stroke-width=".6"/>';
    });
    var jewel = function (x, y) { return '<circle cx="' + x + '" cy="' + y + '" r="7" fill="#E7C987" stroke="#9A7432" stroke-width=".6"/><circle cx="' + x + '" cy="' + y + '" r="4.2" fill="url(#rb' + id + ')"/>'; };
    var screw = function (x, y, a) { return '<circle cx="' + x + '" cy="' + y + '" r="5.2" fill="#2B4EA8" stroke="#16295C" stroke-width=".6"/><line x1="' + (x - 4) + '" y1="' + y + '" x2="' + (x + 4) + '" y2="' + y + '" stroke="#0E1B3D" stroke-width="1.3" transform="rotate(' + a + ' ' + x + ' ' + y + ')"/>'; };
    br += jewel(-40, -32) + jewel(42, -32) + jewel(64, 6) + jewel(4, 70) + jewel(-6, -2);
    br += screw(-92, -44, 20) + screw(-30, 12, 70) + screw(92, -28, 140) + screw(62, 22, 30) + screw(-6, 92, 100);
    /* balance wheel and hairspring */
    var spiral = 'M0,0';
    for (var t = 0; t <= 7 * 360; t += 12) { var rr = 3 + t / (7 * 360) * 19, a = t * Math.PI / 180; spiral += 'L' + r2(rr * Math.cos(a)) + ',' + r2(rr * Math.sin(a)); }
    var bal = '<g transform="translate(60,74)"><path d="' + spiral + '" fill="none" stroke="#3B60C4" stroke-width=".8"/>' +
      '<g class="cal-balance"><circle r="31" fill="none" stroke="url(#gd' + id + ')" stroke-width="4.5"/>' +
      '<line x1="-31" x2="31" stroke="url(#gd' + id + ')" stroke-width="3"/><line y1="-31" y2="31" stroke="url(#gd' + id + ')" stroke-width="3"/>';
    for (var m = 0; m < 8; m++) { var pm = pt(33, m * 45 + 22.5); bal += '<circle cx="' + pm[0] + '" cy="' + pm[1] + '" r="2.4" fill="#E7C987"/>'; }
    bal += '</g>' + jewel(0, 0) + '</g>';
    out.push(layerSvg(br + bal, rh + cotes + ruby + metalGrad('gd' + id, 'gold')));

    /* 6 going train */
    var gearAt = function (x, y, r, teeth, depth, holes, dur, rev) {
      return '<g transform="translate(' + x + ',' + y + ')"><g class="cal-gear" style="animation-duration:' + dur + 's;animation-direction:' + (rev ? 'reverse' : 'normal') + '">' +
        '<path fill-rule="evenodd" d="' + gear(r, teeth, depth, holes) + '" fill="url(#gg' + id + ')" stroke="#7A5A22" stroke-width=".6"/>' +
        '<circle r="' + r2(r * 0.2) + '" fill="#8D6A2C"/></g></g>';
    };
    out.push(layerSvg(
      gearAt(-40, -32, 56, 84, 4, 5, 240) +
      gearAt(-6, -2, 36, 64, 3.4, 4, 60, true) +
      gearAt(42, -32, 24, 48, 2.8, 4, 20) +
      gearAt(64, 6, 18, 40, 2.6, 4, 8, true) +
      gearAt(46, 38, 13, 15, 3.6, 3, 3),
      metalGrad('gg' + id, 'gold')));

    /* 7 mainplate with perlage */
    var perl = '<radialGradient id="pg' + id + '" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#F4F6F8"/><stop offset=".65" stop-color="#C3C9D0"/><stop offset="1" stop-color="#8E959E"/></radialGradient>' +
      '<pattern id="pp' + id + '" width="16" height="14" patternUnits="userSpaceOnUse">' +
      ['0,0', '16,0', '8,7', '0,14', '16,14'].map(function (c) { var xy = c.split(','); return '<circle cx="' + xy[0] + '" cy="' + xy[1] + '" r="8.6" fill="url(#pg' + id + ')" stroke="rgba(0,0,0,.08)" stroke-width=".5"/>'; }).join('') +
      '</pattern>';
    out.push(layerSvg(
      '<circle r="130" fill="url(#rh' + id + ')"/><circle r="130" fill="url(#pp' + id + ')" opacity=".85"/>' +
      '<circle r="130" fill="none" stroke="#fff" stroke-opacity=".8" stroke-width="2"/>' +
      '<circle cx="60" cy="74" r="38" fill="#4F5660" opacity=".55"/><circle cx="-40" cy="-32" r="10" fill="#4F5660" opacity=".5"/>' +
      jewel(-40, -32) + jewel(42, -32) + jewel(64, 6) + jewel(46, 38) + jewel(60, 74),
      rh + perl + ruby));

    /* 8 rotor: two engraved rows of the twelve hour names */
    var names1 = 'AUGE · ANATOLE · MOUSIKE · GYMNASTIKE · NYMPHE · MESEMBRIA', names2 = 'SPONDE · ELETE · AKTE · HESPERIS · DYSIS · ARKTOS';
    var rings = '';
    for (var g = 0; g < 9; g++) rings += '<path d="M' + -(44 + g * 4) + ',0 A' + (44 + g * 4) + ',' + (44 + g * 4) + ' 0 0 0 ' + (44 + g * 4) + ',0" fill="none" stroke="#7A5A22" stroke-opacity=".35" stroke-width=".5"/>';
    out.push(layerSvg(
      '<g data-rotor><path d="M-124,0 A124,124 0 0 0 124,0 L26,0 A26,26 0 0 1 -26,0Z" fill="url(#ro' + id + ')" stroke="#7A5A22" stroke-width=".8"/>' + rings +
      '<path id="ra' + id + '" d="M-110,0 A110,110 0 0 0 110,0" fill="none"/><path id="rb2' + id + '" d="M-97,0 A97,97 0 0 0 97,0" fill="none"/>' +
      '<text font-family="' + SERIF.replace(/'/g, '&#39;') + '" font-size="8.2" letter-spacing="1.1" fill="#6E4F1A"><textPath href="#ra' + id + '" startOffset="50%" text-anchor="middle">' + names1 + '</textPath></text>' +
      '<text font-family="' + SERIF.replace(/'/g, '&#39;') + '" font-size="8.2" letter-spacing="1.1" fill="#6E4F1A"><textPath href="#rb2' + id + '" startOffset="50%" text-anchor="middle">' + names2 + '</textPath></text>' +
      '<circle r="24" fill="url(#ro' + id + ')" stroke="#7A5A22" stroke-width=".8"/>' + screw(-10, 0, 30) + screw(10, 0, 120) + '</g>',
      metalGrad('ro' + id, 'gold') + ruby));

    /* 9 caseback */
    out.push(layerSvg(
      '<path fill-rule="evenodd" d="M164,0A164,164 0 1 0 -164,0A164,164 0 1 0 164,0Z M126,0A126,126 0 1 1 -126,0A126,126 0 1 1 126,0Z" fill="url(#bk' + id + ')" stroke="rgba(0,0,0,.35)" stroke-width=".8"/>' +
      '<path id="bt' + id + '" d="M0,-145 A145,145 0 1 1 -0.1,-145" fill="none"/>' +
      '<text font-family="' + SERIF.replace(/'/g, '&#39;') + '" font-size="10.5" letter-spacing="2.4" fill="#4E555E"><textPath href="#bt' + id + '">HORÆ · CALIBRE H·1L · Nº 017 · 950 PLATINUM · SAPPHIRE · 50 M · MADE BY HAND ·</textPath></text>' +
      '<circle r="126" fill="rgba(150,180,255,.10)" stroke="rgba(255,255,255,.5)" stroke-width="1.2"/>' +
      [30, 90, 150, 210, 270, 330].map(function (a) { var p = pt(158, a); return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="2.4" fill="#7D848D"/>'; }).join(''),
      metalGrad('bk' + id, 'platinum')));

    return out;
  }

  /* ───────── the back: strap lining, the case back, the movement through a sapphire window ─────────
     Drawn in the same box as the front, so the watch page can crossfade between the two.
     Seen from behind the crown is on the left. The movement is the calibre's own drawing (mainplate,
     wheels, bridges and balance), and the self-winding watches show the gold rotor on top. */
  function strapUnder(color, bracelet, metal) {
    if (bracelet) return strapMarkup(color, true, metal);
    var shape = 'M-66,-138 L-58,-320 L58,-320 L66,-138Z';
    var half = function (holes) {
      return '<path d="' + shape + '" fill="' + color + '"/><path d="' + shape + '" fill="#120C08" opacity=".34"/>' +
        '<path d="M-56,-150 L-49,-320 M56,-150 L49,-320" stroke="rgba(255,255,255,.16)" stroke-width="1" stroke-dasharray="4 4" fill="none"/>' +
        '<path d="' + shape + '" fill="url(#strapShade)" opacity=".5"/>' +
        (holes ? [-232, -258, -284].map(function (y) { return '<ellipse cy="' + y + '" rx="3.4" ry="4.2" fill="#0B0705" opacity=".75"/>'; }).join('')
          : '<rect x="-62" y="-262" width="124" height="15" rx="2" fill="' + color + '" stroke="rgba(0,0,0,.35)" stroke-width=".7"/>');
    };
    return '<g>' + half(false) + '</g><g transform="scale(1,-1)">' + half(true) + '</g>';
  }

  function back(model, opt) {
    opt = opt || {};
    var L = LOOK[model] || LOOK.arktos, id = ++uid;
    var withStrap = opt.strap !== false;
    var NS0 = 'http://www.w3.org/2000/svg';
    var PB = photoOf(model + '-back');
    if (PB) {
      /* the photographed back: the movement through sapphire, cut out (the crown is on the left) */
      var pb = photoLayer(PB, id, withStrap, -1), psvg = document.createElementNS(NS0, 'svg');
      psvg.setAttribute('viewBox', withStrap ? '-200 -300 400 600' : '-182 -182 364 364');
      psvg.setAttribute('class', 'watch watch--back watch--photo watch--' + model);
      psvg.setAttribute('aria-hidden', 'true');
      psvg.innerHTML = '<defs>' + pb.defs + '</defs>' + pb.body;
      return { el: psvg, rotor: null, photo: true, strap: function () {} };
    }
    var D = root.HORAE && root.HORAE.byId[model];
    var auto = D ? /self-winding/.test(D.calibre) : true;
    var engr = D ? ['HORÆ', D.name.toUpperCase(), 'CALIBRE ' + D.calibre.split(',')[0], 'Nº 001 / ' + D.year, D.metal.toUpperCase(), D.water.toUpperCase(), 'MADE BY HAND'].join(' · ') + ' ·' : 'HORÆ ·';
    var cal = calibre();
    /* each calibre layer is its own <svg>; nest it, scaled so the mainplate fills the window */
    var nest = function (s) { return s.replace(/^<svg class="cal__svg[^"]*" viewBox="-200 -200 400 400" aria-hidden="true">/, '<svg x="-197" y="-197" width="394" height="394" viewBox="-200 -200 400 400" overflow="visible">'); };
    var movement = nest(cal[6]) + nest(cal[5]) + nest(cal[4]) + (auto ? nest(cal[7]) : '');
    var lug = '<path d="M50,-118 L56,-166 Q57,-174 65,-174 L74,-174 Q81,-173 80,-164 L74,-112Z" fill="url(#bm' + id + ')" stroke="rgba(0,0,0,.25)" stroke-width=".6"/>';
    var defs = metalGrad('bm' + id, L.metal, true) + metalGrad('bn' + id, L.metal) +
      '<clipPath id="bw' + id + '"><circle r="124"/></clipPath>' +
      '<radialGradient id="bg' + id + '" cx=".34" cy=".3" r=".85"><stop offset="0" stop-color="#E4ECFF" stop-opacity=".2"/><stop offset="1" stop-color="#9FB6E8" stop-opacity=".05"/></radialGradient>' +
      '<path id="be' + id + '" d="M0,-143 A143,143 0 1 1 -0.1,-143"/>' +
      '<linearGradient id="strapShade" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000" stop-opacity=".5"/><stop offset=".2" stop-color="#000" stop-opacity="0"/><stop offset=".8" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".5"/></linearGradient>';
    var body =
      (withStrap ? '<g data-bstrap>' + strapUnder(L.strap, L.bracelet, L.metal) + '</g>' : '') +
      lug + '<g transform="scale(-1,1)">' + lug + '</g><g transform="scale(1,-1)">' + lug + '</g><g transform="scale(-1,-1)">' + lug + '</g>' +
      '<rect x="-162" y="-9" width="12" height="18" rx="2" fill="url(#bm' + id + ')"/>' +
      '<rect x="-174" y="-17" width="16" height="34" rx="4" fill="url(#bm' + id + ')" stroke="rgba(0,0,0,.3)" stroke-width=".6"/>' +
      '<circle r="160" fill="url(#bm' + id + ')" stroke="rgba(0,0,0,.35)" stroke-width=".8"/>' +
      '<circle r="155" fill="none" stroke="url(#bn' + id + ')" stroke-width="5"/>' +
      '<text font-family="' + SERIF.replace(/'/g, '&#39;') + '" font-size="9.6" fill="' + METAL[L.metal][2] + '" opacity=".9"><textPath href="#be' + id + '" textLength="880" lengthAdjust="spacing">' + engr + '</textPath></text>' +
      '<circle r="128" fill="' + METAL[L.metal][2] + '"/>' +
      '<g clip-path="url(#bw' + id + ')"><circle r="124" fill="#2B3038"/>' + movement + '</g>' +
      '<circle r="124" fill="url(#bg' + id + ')"/>' +
      '<path d="M-98,-60 A116,116 0 0 1 28,-113" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="5" stroke-linecap="round" opacity=".5"/>' +
      '<circle r="124" fill="none" stroke="rgba(255,255,255,.42)" stroke-width="1.2"/>';
    var NS = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', withStrap ? '-200 -300 400 600' : '-182 -182 364 364');
    svg.setAttribute('class', 'watch watch--back watch--' + model);
    svg.setAttribute('aria-hidden', 'true');
    svg.innerHTML = '<defs>' + defs + '</defs>' + body;
    var strapG = svg.querySelector('[data-bstrap]');
    return {
      el: svg, rotor: svg.querySelector('[data-rotor]'),
      strap: function (color, bracelet) { if (strapG) strapG.innerHTML = strapUnder(color, !!bracelet, L.metal); },
    };
  }

  root.HZ_ART = { mark: mark, guilloche: guilloche, watch: watch, back: back, calibre: calibre, now: now, moonPhase: moonPhase, lightAt: lightAt, LOOK: LOOK, METAL: METAL };
})(window);
