/*
 * HORÆ: the brand as data. Copy, the four watches, the twelve hours, the calibre.
 *
 * CONCEPT VALUES: every price, dimension, power reserve, part count, finishing time,
 * edition size and the moon-phase accuracy below are proposals for the concept.
 * Replace them with real figures before anything is sold.
 *
 * The twelve Horae of the day follow the list given by Hyginus (Fabulae 183).
 * Which clock hours each name covers is our own reading, made for the site.
 */
(function (root) {
  /* The twelve hours. from/to are clock hours (24 h). Arktos wraps past midnight. */
  var HOURS = [
    { name: 'Auge', from: 4.5, to: 6, means: 'first light' },
    { name: 'Anatole', from: 6, to: 7, means: 'sunrise' },
    { name: 'Mousike', from: 7, to: 8, means: 'the morning hour of music and study' },
    { name: 'Gymnastike', from: 8, to: 9, means: 'the morning hour of exercise' },
    { name: 'Nymphe', from: 9, to: 11, means: 'the hour for bathing' },
    { name: 'Mesembria', from: 11, to: 13, means: 'noon' },
    { name: 'Sponde', from: 13, to: 14, means: 'the libation poured after the midday meal' },
    { name: 'Elete', from: 14, to: 15, means: 'prayer, the first hour of the afternoon’s work' },
    { name: 'Akte', from: 15, to: 17, means: 'eating and pleasure' },
    { name: 'Hesperis', from: 17, to: 19, means: 'the start of evening' },
    { name: 'Dysis', from: 19, to: 20.5, means: 'sunset' },
    { name: 'Arktos', from: 20.5, to: 28.5, means: 'the night sky, named for the Bear' },
  ];

  function horaAt(h) {
    var x = h < 4.5 ? h + 24 : h;
    for (var i = 0; i < HOURS.length; i++) if (x >= HOURS[i].from && x < HOURS[i].to) return HOURS[i];
    return HOURS[11];
  }

  /*
   * The four watches. `at` is the clock hour the watch is shown at in the day sequence.
   * `sky` is that hour's sky (top, horizon) for the product page backdrop.
   */
  var MODELS = [
    {
      id: 'anatole', name: 'Anatole', hour: 'Sunrise', range: '06:00 – 07:00', at: 6.2,
      kicker: 'The hour the light comes back',
      line: 'A sunburst dial that shades from rose at six to pale gold at twelve, the way the sky does at sunrise. Steel, so it can be worn every day.',
      long: [
        'Anatole was the second of the Horae, the hour the sun clears the horizon. The dial is cut with a sunburst so fine it shifts as you turn your wrist, and lacquered in a graded colour that runs from rose at six o’clock to pale gold at twelve.',
        'The case is steel, brushed on top and polished on the bevels, on a three-row bracelet that tapers to the clasp. It is the watch in the collection meant for every morning.',
      ],
      price: 9800, metal: 'Steel', case: '39 mm', thick: '9.8 mm', calibre: 'H·1, self-winding', reserve: '72 hours',
      water: '100 m', dial: 'Graded sunburst lacquer, rose to gold', crystal: 'Sapphire, anti-reflective on both faces',
      straps: [
        { id: 'bracelet', label: 'Steel bracelet', color: '#B9BEC3' },
        { id: 'stone', label: 'Stone calfskin', color: '#B9AFA2' },
        { id: 'navy', label: 'Navy calfskin', color: '#1E2A44' },
      ],
      sky: ['#7686AD', '#F0B79A'], tone: 'light', year: 120,
    },
    {
      id: 'mesembria', name: 'Mesembria', hour: 'Noon', range: '11:00 – 13:00', at: 12.02,
      kicker: 'The hour of the shortest shadow',
      line: 'At noon a shadow is at its shortest. So is this case: 6.4 mm of white gold around a grand feu enamel dial with blued hands.',
      long: [
        'Mesembria was noon, when the sun stands highest and a shadow shrinks to almost nothing. We took that as a brief: the thinnest watch we could make, with nothing on the dial that is not needed to read the time.',
        'The dial is grand feu enamel, powdered glass fired seven times until it is as white and deep as porcelain. The hands are steel, heated by hand until they turn blue.',
      ],
      price: 24500, metal: '18k white gold', case: '37 mm', thick: '6.4 mm', calibre: 'H·2, hand-wound, 2.9 mm', reserve: '60 hours',
      water: '30 m', dial: 'Grand feu white enamel, Roman numerals', crystal: 'Sapphire, anti-reflective on both faces',
      straps: [
        { id: 'black', label: 'Black alligator', color: '#1A1A1E' },
        { id: 'midnight', label: 'Midnight alligator', color: '#1B2340' },
        { id: 'grey', label: 'Grey alligator', color: '#5E6066' },
      ],
      sky: ['#C8D9E6', '#F7F5EE'], tone: 'light', year: 60,
    },
    {
      id: 'hesperis', name: 'Hesperis', hour: 'Evening', range: '17:00 – 19:00', at: 18.66,
      kicker: 'The hour the light turns copper',
      line: 'A salmon dial in rose gold, with small seconds at six, so the long hand stays still enough to read in the last of the light.',
      long: [
        'Hesperis opened the evening: the hour when work stops and the light goes low and warm. The dial is a two-level sector dial in salmon, the colour stone takes on at that time of day.',
        'The seconds have their own small dial at six o’clock. With the long hand gone from the centre, the time reads calmly, the way an evening should.',
      ],
      price: 28400, metal: '18k rose gold', case: '38.5 mm', thick: '8.1 mm', calibre: 'H·2S, hand-wound, small seconds', reserve: '60 hours',
      water: '30 m', dial: 'Salmon sector dial, applied rose gold indices', crystal: 'Sapphire, anti-reflective on both faces',
      straps: [
        { id: 'chestnut', label: 'Chestnut alligator', color: '#4A2A1E' },
        { id: 'tobacco', label: 'Tobacco suede', color: '#7A5338' },
        { id: 'black', label: 'Black alligator', color: '#1A1A1E' },
      ],
      sky: ['#5E5A86', '#E9946E'], tone: 'dark', year: 80,
    },
    {
      id: 'arktos', name: 'Arktos', hour: 'Night', range: '20:30 – 04:30', at: 22.5,
      kicker: 'The hour named for the stars that never set',
      line: 'An aventurine dial flecked like the night sky, a moon that keeps time with the real one, and hands that glow when the lights go out.',
      long: [
        'Arktos is the Bear, the stars that circle the pole and never set. When the Greeks named the last hour of the day, they looked up, and so did we.',
        'The dial is aventurine glass, flecked with copper like a clear night. The moon at six follows the real moon and drifts one day from it only once in 122 years. The hands and hour markers are filled with luminous compound that glows green after dark.',
      ],
      price: 46000, metal: '950 platinum', case: '40 mm', thick: '10.6 mm', calibre: 'H·1L, self-winding, moon phase', reserve: '72 hours',
      water: '50 m', dial: 'Aventurine glass, luminous markers, moon at six', crystal: 'Sapphire, box-domed, anti-reflective',
      straps: [
        { id: 'night', label: 'Night-blue alligator', color: '#101827' },
        { id: 'black', label: 'Black alligator', color: '#141416' },
        { id: 'slate', label: 'Slate calfskin', color: '#3B414B' },
      ],
      sky: ['#080C1C', '#141B3A'], tone: 'dark', year: 40,
    },
  ];

  /* On the wrist. CONCEPT VALUES: lug-to-lug lengths, and the wrist of the person in each wrist photograph. */
  var FIT = {
    anatole: { lug: 47, wrist: 17.5, sits: 'The bracelet tapers from the case to the clasp, so it wears smaller than 39 mm and sits flat over the wrist bone.' },
    mesembria: { lug: 44, wrist: 15.5, sits: 'At 6.4 mm it slides under a shirt cuff without catching. The thinnest of the four, and the smallest wrist in the photographs.' },
    hesperis: { lug: 46, wrist: 17, sits: 'Short lugs curve down to follow the wrist, so the case sits close and the strap falls straight.' },
    arktos: { lug: 48.5, wrist: 18, sits: 'The largest and the thickest, 10.6 mm with the domed crystal. Made to be seen; it wears over a cuff, not under.' },
  };
  MODELS.forEach(function (m) { m.lug = FIT[m.id].lug; m.wristCm = FIT[m.id].wrist; m.sits = FIT[m.id].sits; });

  /* The set: all four in one box. CONCEPT VALUES: the price (the four added up, box included) and twelve sets a year. */
  var SET = {
    id: 'set', name: 'The Complete Day', hour: 'All four hours',
    line: 'All four watches with consecutive case numbers, in one lacquered box lined in the colours of their hours.',
    box: 'Lacquered box, lined by hand',
    price: MODELS.reduce(function (a, m) { return a + m.price; }, 0), year: 12,
  };

  /* The exploded calibre, top layer first. Shown with the Arktos (H·1L). */
  var CALIBRE = [
    { id: 'crystal', title: 'Sapphire crystal', short: 'Crystal', detail: 'Box-domed, anti-reflective on both faces.' },
    { id: 'case', title: 'Case, 950 platinum', short: 'Case', detail: '40 mm. Fourteen surfaces, each brushed or polished by hand.' },
    { id: 'hands', title: 'Hands', short: 'Hands', detail: 'Hand-polished white gold, filled with luminous compound.' },
    { id: 'dial', title: 'Aventurine dial', short: 'Dial', detail: 'Glass flecked with copper. No two skies alike.' },
    { id: 'bridges', title: 'Bridges and balance', short: 'Balance', detail: 'Côtes de Genève stripes, bevelled edges, beating at 4 Hz.' },
    { id: 'train', title: 'Going train', short: 'Wheels', detail: 'Five wheels in gilt brass, set in 31 jewels.' },
    { id: 'plate', title: 'Mainplate', short: 'Mainplate', detail: 'Perlage by hand: about 1,400 overlapping circles.' },
    { id: 'rotor', title: '22k gold rotor', short: 'Rotor', detail: 'Engraved with the twelve hour names. Winds as you move.' },
    { id: 'back', title: 'Sapphire caseback', short: 'Caseback', detail: 'Numbered by the watchmaker who built it.' },
  ];

  var STATS = [
    { n: 214, label: 'parts' },
    { n: 31, label: 'jewels' },
    { n: 72, label: 'hours of power reserve' },
    { n: 41, label: 'hours of hand finishing' },
  ];

  /* The sky by clock hour: [hour, top, horizon]. Shared by the day sequence and the watch pages. */
  var hex = function (h) { var n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
  var SKY = [
    [0, '#05070F', '#0B1024'], [4.6, '#0A0F22', '#1A1D3C'], [5.6, '#262A52', '#8A6A84'], [6.3, '#6F7FAA', '#F2B596'],
    [7.4, '#9CB6D6', '#F3D8C2'], [9.5, '#AFC8DE', '#EEF0EB'], [12, '#C8D9E6', '#F7F5EE'], [15.5, '#B6CBDC', '#F1E8DA'],
    [17.6, '#9C9FBE', '#F1C596'], [18.7, '#5D5987', '#EA9269'], [19.6, '#2B2B56', '#7B4E6E'], [21, '#0E1430', '#1C2147'],
    [22.5, '#080C1C', '#111733'], [24, '#05070F', '#0B1024'],
  ].map(function (k) { return [k[0], hex(k[1]), hex(k[2])]; });
  function skyAt(h) {
    h = ((h % 24) + 24) % 24;
    var mix = function (a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; };
    for (var i = 0; i < SKY.length - 1; i++) {
      if (h <= SKY[i + 1][0]) {
        var t = (h - SKY[i][0]) / (SKY[i + 1][0] - SKY[i][0]);
        t = t * t * (3 - 2 * t);
        return [mix(SKY[i][1], SKY[i + 1][1], t), mix(SKY[i][2], SKY[i + 1][2], t)];
      }
    }
    return [SKY[0][1], SKY[0][2]];
  }

  var money = function (n) { return '$' + n.toLocaleString('en-US'); };

  root.HORAE = {
    HOURS: HOURS, horaAt: horaAt, MODELS: MODELS, SET: SET, CALIBRE: CALIBRE, STATS: STATS, money: money, skyAt: skyAt, hex: hex,
    byId: MODELS.reduce(function (a, m) { a[m.id] = m; return a; }, {}),
    perYear: MODELS.reduce(function (a, m) { return a + m.year; }, 0),
  };
})(window);
