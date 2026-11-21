/*
 * HORÆ: every image the site needs, as data.
 *
 * One file feeds three things:
 *   1. the website (alt text, ratio, the brief shown in each placeholder)
 *   2. higgsfield/generate.mjs (prompt, model, aspect, reference images)
 *   3. shots.html (the shot sheet: copy a prompt into the Higgsfield app by hand)
 *
 * Consistency comes from reuse: the LOOK strings and the WATCH descriptions are pasted
 * byte-identical into every prompt. Change a word here and every prompt changes with it.
 *
 * Stage 1 makes each watch's master (a straight-on studio portrait, no reference) and the atelier scenes.
 * Stage 2 passes that master as a reference image, so the same watch appears everywhere.
 * Stage 3 makes the films' later stills from their first one; stage 4 makes the films (see THE SCROLL FILMS).
 *
 * Plain script on purpose: the browser reads window.HORAE_SHOTS, Node reads it through vm.
 */
(function (root) {
  /* ───────────── LOOK BIBLE ───────────── */

  var STUDIO =
    'Photoreal luxury watch product photography, medium-format camera, 120mm macro lens, focus-stacked so the whole watch is sharp edge to edge. ' +
    'One large soft key light from upper left through a diffusion panel, one thin white strip light reflected cleanly along the polished case edges, ' +
    'a soft natural contact shadow. Seamless matte backdrop in one flat colour. Spotless: no dust, no fingerprints, no scratches. ' +
    'Colour-accurate grade, very fine grain.';

  /* The four hours of light. Each watch is photographed in its own hour. */
  var LIGHT = {
    anatole:
      'Sunrise light: the sun just above the horizon, low warm rose-gold light raking in from the side, long soft shadows, ' +
      'a cool blue-lilac sky behind, dew on surfaces. Palette: dawn rose #EBC3B0, pale gold #F3E0B9, sky blue-lilac #7686AD.',
    mesembria:
      'Noon light: hard white sun directly overhead, tiny crisp shadows pooled right under objects, bright and clean, ' +
      'pale whitewashed stone and a high pale sky. Palette: limewash white #F5F1E8, stone #D9D2C3, sky #C8D9E6, ink #17140F.',
    hesperis:
      'Evening golden-hour light: low sun from the side, warm copper and amber light, long shadows, everything glowing, ' +
      'warm terracotta and honey stone. Palette: copper #C98B6B, salmon #E3A588, honey #D9A45B, dusk violet #5E5A86.',
    arktos:
      'Night: deep blue-black darkness lit only by faint cool moonlight from above and the green glow of the watch’s own luminous hands and markers. ' +
      'Palette: night ink #0A0E1C, midnight blue #141B3A, moon silver #C9D2E0, lume green #9EF7C8.',
  };

  var SCENE =
    'Photoreal cinematic photography, shot on ARRI Alexa 35 with a vintage spherical lens, fine film grain, natural colour, shallow depth of field. ' +
    'Calm, quiet, unhurried. No haze, no lens flare, no bloom.';

  var ATELIER =
    'Photoreal documentary photography inside a small watchmaker’s atelier, 100mm macro lens, shallow depth of field, fine film grain. ' +
    'Light from one north-facing window, soft and cool, plus one small warm bench lamp. Worn walnut bench, brass and steel tools, a green bench mat. ' +
    'Palette: walnut #4A3424, brass #C9A46A, bench green #2F4A3C, steel #9AA0A6, warm white #F5F1E8.';

  var NEG = 'No brand name, no logo, no words or letters anywhere on the dial, case, strap or in the frame, no watermark.';
  var SAME = 'The watch is exactly the watch in the reference image: identical case, dial, hands, markers and strap. Do not redesign it.';

  /* ───────────── THE WATCHES (described the same way every time) ───────────── */

  var WATCH = {
    anatole:
      'a 39 mm round steel wristwatch with a brushed flat bezel and polished bevelled edges, a fine sunburst dial lacquered in a graded colour that shades from dawn rose (#EBC3B0) ' +
      'at six o’clock to pale gold (#F3E0B9) at twelve o’clock, applied polished steel baton hour markers (a double marker at twelve), steel tapered dauphine hour and minute hands, ' +
      'a thin steel centre seconds hand, a fluted crown at three o’clock, on a three-row brushed steel bracelet with polished centre links',
    mesembria:
      'an ultra-thin 37 mm round 18k white gold dress wristwatch, the case only 6.4 mm thick with a narrow polished bezel, a pure white grand feu enamel dial with a deep glossy surface, ' +
      'painted black Roman numerals I to XII and a fine black railway minute track, slim heat-blued steel hands with open round tips near their ends, a thin blued centre seconds hand, ' +
      'a small round crown, on a black alligator leather strap with a white gold pin buckle',
    hesperis:
      'a 38.5 mm round 18k rose gold wristwatch with a polished case, a salmon-coloured (#E3A588) two-level sector dial: a slightly darker outer minute ring, ' +
      'applied polished rose gold baton hour markers, and a small seconds sub-dial at six o’clock with its own thin rose gold hand, rose gold dauphine hour and minute hands, ' +
      'a fluted rose gold crown, on a chestnut brown alligator leather strap',
    arktos:
      'a 40 mm round 950 platinum wristwatch with a polished case and a box-domed sapphire crystal, a midnight-blue aventurine glass dial densely flecked with tiny copper and silver sparkles like a starry sky, ' +
      'round luminous hour markers filled with pale green luminous compound, polished white gold sword-shaped hour and minute hands with luminous centres, a thin white gold centre seconds hand, ' +
      'a moon-phase window at six o’clock showing a gold moon on a dark blue starry disc, on a night-blue alligator leather strap',
  };

  /* Studio backdrop per watch: each watch has its hour's colour. */
  var BACKDROP = {
    anatole: 'pale dawn rose (#EBD2C4)',
    mesembria: 'limewash white (#EEEAE0)',
    hesperis: 'deep copper (#9A5A3E)',
    arktos: 'midnight blue (#141B3A)',
  };

  /* Where each watch is worn, at its hour. */
  var WRIST = {
    anatole:
      LIGHT.anatole + ' ' + SCENE + ' Close, 85mm lens: a man’s wrist resting on the rail of a wooden balcony above a misty valley at sunrise, ' +
      'the sleeve of a cream knit sweater pushed back, a cup of coffee out of focus beside it. The sun catches the sunburst dial and makes it glow. ' +
      'The watch is the sharp subject, in the right third of the frame.',
    mesembria:
      LIGHT.mesembria + ' ' + SCENE + ' Close, 85mm lens, looking down: a woman’s wrist in a white linen shirt cuff resting on a whitewashed stone wall at noon, ' +
      'the hard overhead sun leaves only a tiny shadow under the watch. A sprig of olive leaves on the wall beside it. The watch is the sharp subject, centred.',
    hesperis:
      LIGHT.hesperis + ' ' + SCENE + ' Close, 85mm lens: a wrist in a rolled navy shirt sleeve resting on a terracotta terrace table at golden hour, ' +
      'a glass of amber wine and a folded book out of focus, a long warm shadow stretching across the table. The watch is the sharp subject, in the left third.',
    arktos:
      LIGHT.arktos + ' ' + SCENE + ' Close, 85mm lens: a wrist in a dark wool coat sleeve resting on a stone parapet at night, a field of stars soft in the sky above, ' +
      'the watch’s hands and markers glowing green, the moon in its window catching the faint moonlight. The watch is the sharp subject, centred low.',
  };

  var gpt = function (o, quality) {
    o.model = 'gpt_image_2_6';
    o.params = { resolution: '2k', quality: quality || 'high' };
    return o;
  };
  var soul = function (o) {
    o.model = 'soul_cinematic';
    o.params = { quality: '2k' };
    return o;
  };

  var MODELS = ['anatole', 'mesembria', 'hesperis', 'arktos'];
  var NAMES = { anatole: 'Anatole', mesembria: 'Mesembria', hesperis: 'Hesperis', arktos: 'Arktos' };
  var TONE = { anatole: 'dawn', mesembria: 'noon', hesperis: 'dusk', arktos: 'night' };
  var shots = [];

  /* ───────────── STAGE 1: the four masters ───────────── */
  MODELS.forEach(function (m) {
    shots.push(
      gpt({
        id: m + '-front', stage: 1, aspect: '4:5', tone: TONE[m], model_of: m,
        used: ['Home: the four hours', 'Watch page: main image', 'Master reference for every other ' + NAMES[m] + ' image'],
        alt: 'The Horæ ' + NAMES[m] + ', face on.',
        brief: NAMES[m] + ', straight on, dial square to camera, strap running off top and bottom, on ' + BACKDROP[m].replace(/ \(.*\)/, '') + '. This image defines the watch.',
        prompt:
          STUDIO + ' Backdrop: ' + BACKDROP[m] + '. A single ' + WATCH[m] + '. ' +
          'Shot straight on, the dial square to the camera and perfectly round, centred, the case filling about 55% of the frame width, ' +
          'the strap or bracelet running straight up and down out of the top and bottom of the frame. The hands set at ten past ten. ' + NEG,
      })
    );
  });

  /* The atelier: hands and tools, no finished watch, so the cheap cinematic model. */
  shots.push(
    soul({
      id: 'atelier-enamel', stage: 1, aspect: '3:4', tone: 'bench',
      used: ['Home: the atelier'],
      alt: 'A white enamel dial glowing orange as it leaves the kiln on a steel fork.',
      brief: 'An enamel dial blank lifted out of a small kiln on a steel fork, glowing orange-white, the enameller’s hand in a glove.',
      prompt:
        ATELIER + ' Close macro: a round watch dial blank of white enamel lifted out of the open mouth of a small electric kiln on a long steel fork, ' +
        'the enamel still glowing orange-white from the heat, the enameller’s gloved hand at the edge of the frame, the kiln’s orange glow lighting the scene. ' + NEG,
    }),
    soul({
      id: 'atelier-perlage', stage: 1, aspect: '3:4', tone: 'bench',
      used: ['Home: the atelier'],
      alt: 'A watch mainplate being decorated with overlapping circles by a spinning peg.',
      brief: 'Macro: a spinning peg pressing tiny overlapping circles (perlage) into a silver-grey watch mainplate.',
      prompt:
        ATELIER + ' Extreme close macro: a small round rhodium-plated brass watch mainplate held in a steel clamp, its surface covered in a pattern of tiny overlapping circular grained spots (perlage), ' +
        'a thin spinning peg touching the metal and pressing one new circle, fine metal dust, the bench lamp reflecting in the pattern. ' + NEG,
    }),
    soul({
      id: 'atelier-anglage', stage: 1, aspect: '3:4', tone: 'bench',
      used: ['Home: the atelier'],
      alt: 'A watchmaker bevelling the edge of a movement bridge by hand with a file.',
      brief: 'Macro: fingers holding a movement bridge, polishing its bevelled edge with a stick of wood; the bevel shines like a mirror.',
      prompt:
        ATELIER + ' Extreme close macro: a watchmaker’s fingertips holding a small steel-grey movement bridge with straight Geneva stripes, polishing its bevelled 45-degree edge ' +
        'with a pointed stick of gentian wood, the freshly polished bevel shining like a thin line of mirror. ' + NEG,
    }),
    soul({
      id: 'atelier-bench', stage: 1, aspect: '3:4', tone: 'bench',
      used: ['Home: the atelier'],
      alt: 'A watchmaker at the bench at night with a loupe, under one lamp.',
      brief: 'Night, the atelier empty except one watchmaker under a bench lamp, loupe in eye, tweezers raised over a movement.',
      prompt:
        ATELIER + ' After dark, the window black. 50mm lens from the side: one watchmaker at a raised walnut bench under a single warm lamp, a loupe in one eye, ' +
        'tweezers held over an open watch movement in a holder, elbows resting on pads, the rest of the room falling into soft darkness. Seen in profile, face in shadow. ' + NEG,
    }),
    soul({
      id: 'story-sundial', stage: 1, aspect: '3:4', tone: 'dawn',
      used: ['Home: the twelve hours'],
      alt: 'An ancient marble sundial with the shadow of its pointer falling across carved hour lines.',
      brief: 'Ancient Greek marble sundial at dawn: the gnomon’s long shadow falling across the carved hour lines.',
      prompt:
        LIGHT.anatole + ' ' + SCENE + ' Close, 50mm lens: a weathered ancient Greek marble sundial, a concave bowl carved with curved hour lines, on a stone pedestal among olive trees, ' +
        'the long shadow of its bronze pointer falling across the lines in the first sun of the morning. ' + NEG,
    })
  );

  /* ───────────── STAGE 2: everything that shows a watch, referenced to its master ───────────── */
  MODELS.forEach(function (m) {
    var ref = ['higgsfield/renders/' + m + '-front.png'];
    shots.push(
      gpt({
        id: m + '-angle', stage: 2, aspect: '4:5', tone: TONE[m], model_of: m, refs: ref,
        used: ['Watch page: gallery'],
        alt: 'The Horæ ' + NAMES[m] + ' at a three-quarter angle, showing the crown and case side.',
        brief: 'Three-quarter view from the crown side: the case profile, the crown, the dial catching the light.',
        prompt:
          STUDIO + ' Backdrop: ' + BACKDROP[m] + '. A single ' + WATCH[m] + '. Three-quarter view from the right, slightly above, 120mm lens, ' +
          'showing the case side and crown in profile and the dial at an angle catching a long highlight, the strap curving away behind. ' + SAME + ' ' + NEG,
      }),
      gpt({
        id: m + '-back', stage: 2, aspect: '4:5', tone: TONE[m], model_of: m, refs: ref, cutout: true,
        used: ['Watch page: gallery'],
        alt: 'The back of the Horæ ' + NAMES[m] + ', the movement visible through sapphire.',
        brief: (m === 'anatole' || m === 'arktos')
          ? 'Caseback through sapphire: a gold half-moon rotor over striped bridges and red jewels.'
          : 'Caseback through sapphire: hand-wound movement, striped bridges, red jewels, blued screws.',
        prompt:
          STUDIO + ' Backdrop: ' + BACKDROP[m] + '. The back of ' + WATCH[m] + ', lying face down, seen straight on from directly above: ' +
          'the caseback square to the camera and perfectly round, centred, the case filling about 55% of the frame width, the strap or bracelet running straight up and down ' +
          'out of the top and bottom of the frame, the crown on the left side at nine o’clock. ' +
          'A sapphire caseback shows the mechanical movement inside: ' +
          ((m === 'anatole' || m === 'arktos')
            ? 'a half-moon shaped solid gold winding rotor covering half the movement, finely engraved around its edge with a thin decorative band, '
            : 'a hand-wound movement with a large round mainspring barrel and a visible balance wheel, ') +
          'rhodium bridges with straight Geneva stripes and mirror-polished bevelled edges, deep red jewels in gold settings, heat-blued screws. ' + SAME + ' ' + NEG,
      }),
      /* The live watches: the master with its hands taken off. The site cuts it out and draws its own hands on top,
         so the photographed watch still tells your time and casts the sun's shadow. */
      gpt({
        id: m + '-plate', stage: 2, aspect: '4:5', tone: TONE[m], model_of: m, refs: ref, cutout: true,
        used: ['Every live watch on the site: the photographed watch under the drawn hands (cut out)'],
        alt: 'The Horæ ' + NAMES[m] + ' with its hands removed.',
        brief: NAMES[m] + ' exactly as its master, hands removed' + (m === 'hesperis' ? ' (the small seconds stays)' : '') + '; the site draws live hands on top.',
        prompt:
          'The same photograph as the reference image, with the watch’s ' +
          (m === 'hesperis' ? 'hour and minute hands removed; keep the small seconds hand in its sub-dial at six o’clock exactly as it is' : 'hour, minute and centre seconds hands removed') +
          '. The dial is complete and unobstructed where the hands were: every marker, numeral, track' + (m === 'arktos' ? ', the moon-phase window' : '') +
          ' and the dial surface intact, with only a small polished round pinion left at the exact centre of the dial. ' +
          'Everything else is identical to the reference image: camera, framing, scale, position, light, reflections, case, crown, strap and backdrop. ' +
          'Do not move, resize or redesign anything. ' + NEG,
      }),
      gpt({
        id: m + '-wrist', stage: 2, aspect: '3:2', tone: TONE[m], model_of: m, refs: ref,
        used: ['Home: the four hours', 'Watch page: its hour'],
        alt: 'The Horæ ' + NAMES[m] + ' worn at ' + { anatole: 'sunrise', mesembria: 'noon', hesperis: 'golden hour', arktos: 'night' }[m] + '.',
        brief: {
          anatole: 'Sunrise: a wrist on a balcony rail over a misty valley, the sunburst dial glowing.',
          mesembria: 'Noon: a wrist in a linen cuff on a whitewashed wall, a tiny shadow under the watch.',
          hesperis: 'Golden hour: a wrist on a terracotta terrace table, amber wine, one long shadow.',
          arktos: 'Night: a wrist on a stone parapet under stars, hands glowing green.',
        }[m],
        prompt: WRIST[m] + ' The watch: ' + WATCH[m] + '. ' + SAME + ' ' + NEG,
      })
    );
  });

  var allRefs = MODELS.map(function (m) { return 'higgsfield/renders/' + m + '-front.png'; });
  shots.push(
    gpt({
      id: 'family', stage: 2, aspect: '16:9', tone: 'noon', refs: allRefs, priority: true,
      used: ['Home: the four hours (intro)', 'Social card'],
      alt: 'The four Horæ watches in a row, from sunrise to night.',
      brief: 'The four watches face up in a row on pale stone, dawn to night, each lit by its own hour’s light.',
      prompt:
        STUDIO + ' Backdrop: warm limestone grey (#D9D2C3). Four watches lying face up in a straight row with equal space between them, seen from directly above, ' +
        'from left to right: ' + WATCH.anatole + '; ' + WATCH.mesembria + '; ' + WATCH.hesperis + '; ' + WATCH.arktos + '. ' +
        'A soft gradient of light across the row, warm rose on the left to cool blue on the right. Each watch is exactly the watch in its reference image. Do not redesign them. ' + NEG,
    }),
    gpt({
      id: 'closing', stage: 2, aspect: '21:9', tone: 'night', model_of: 'arktos', refs: ['higgsfield/renders/arktos-front.png'],
      used: ['Home: reserve your hour'],
      alt: 'The Arktos glowing on a dark stone ledge under the night sky.',
      brief: 'Night: the Arktos lying on a dark stone ledge in the right third, hands glowing; left 60% empty starry sky.',
      prompt:
        LIGHT.arktos + ' ' + SCENE + ' Wide 35mm frame: a single ' + WATCH.arktos + ' lying on a dark weathered stone ledge in the right third of the frame, ' +
        'its hands and markers glowing green, the moon in its window catching the light. The left 60% of the frame is a quiet night sky full of fine stars above a dark horizon. ' +
        SAME + ' ' + NEG,
    })
  );

  /* ───────────── THE SCROLL FILMS ─────────────
     Two films, each made from stills: Kling 4.0 turns a start frame and an end frame into one locked-off shot.
     Every end frame is made FROM its start frame ("the same frame as the reference image, later"), so both
     ends share one camera. js/film.js plays them; until they exist the drawn scenes are the storyboard.

     1. THE DAY behind the day stage: one fixed view, a terrace over the sea, from first light to night.
        Three films chained at four stills (dawn 06:00, noon 12:00, evening 18:40, night 22:30), scrubbed
        by the same clock as the drawn watch. Looking south, so the sun rises left and sets right, as the
        drawn sun does. The right two-thirds stay open sky: the watch hangs there.
     2. THE BOX in the set: the real box opens, then hands over to the drawn box just before the watches
        drop in. Centred on a background the colour of the set's stage, so its edges dissolve. */
  var VIEW =
    'One fixed wide view, 24mm lens, camera locked on a tripod at chest height: from the edge of a whitewashed limestone terrace high on a Greek island, ' +
    'looking south over a calm open sea to a straight, level horizon. The horizon sits low, a quarter of the way up the frame. A low limestone parapet runs along the bottom edge of the frame; ' +
    'a dark rocky headland with three olive trees enters from the left edge; the right two-thirds of the frame above the horizon are open sky with a few thin high clouds. ' +
    'No people, no boats, no buildings, no birds.';
  var DAYLIGHT = {
    dawn: 'First light, a few minutes after sunrise: the sun just clearing the sea at the far left of the horizon, a band of rose and gold along the horizon, the sky above cooling to blue-lilac, ' +
      'the sea pale and still, the parapet glowing faintly pink, long soft shadows. Palette: dawn rose #EBC3B0, pale gold #F3E0B9, blue-lilac #7686AD.',
    noon: 'Noon: the sun high overhead and out of the frame, hard white light, the shortest shadows tucked under the parapet, the sky a high pale blue, ' +
      'the sea bright and glittering, the limestone almost white. Palette: limewash white #F5F1E8, sky #C8D9E6, sea blue #6F93B4.',
    dusk: 'Evening golden hour: the sun low over the sea at the right of the frame, warm copper and amber light, long shadows reaching left across the parapet, the sea gold and copper, ' +
      'the sky shading from honey at the horizon to dusk violet above. Palette: copper #C98B6B, honey #D9A45B, salmon #E3A588, dusk violet #5E5A86.',
    night: 'Night, about two hours after sunset: the sky deep blue-black and full of fine stars, a bright moon high at the upper left laying a silver path across the dark sea, ' +
      'the parapet faintly silvered by moonlight, the headland a black silhouette. Dark but readable, not black. Palette: night ink #0A0E1C, midnight blue #141B3A, moon silver #C9D2E0.',
  };
  var BOX =
    STUDIO.replace('Seamless matte backdrop in one flat colour.', 'A deep midnight-blue backdrop (#0B1024) with a soft pool of light under the box, fading to near black (#070A16) at every edge of the frame.') +
    ' A single watch presentation box, seen from the front and about 40 degrees above, centred, filling about 45% of the frame width: a flat rectangular case about four times as wide as it is deep, ' +
    'in deep midnight-blue piano lacquer with softly rounded corners, a thin polished gold line around the rim of the lid and of the base, and centred on the lid a small inlaid gold watch-dial motif: one thin gold circle with twelve short gold baton marks pointing inward from it like the hour markers of a watch dial, the centre plain lacquer. No dots, no stars.';
  var LATER = function (when) {
    return 'The same frame as the reference image, ' + when + '. Same camera position, lens, framing and horizon; nothing in the frame has moved, only the light and the sky have changed. ';
  };

  var dayStill = function (o) {
    o.stage = o.refs ? 3 : 1; o.aspect = '16:9'; o.tone = o.tone || 'dawn';
    return gpt(o);
  };
  shots.push(
    dayStill({
      id: 'day-dawn', tone: 'dawn',
      used: ['Home: one day, the sky at 06:00 (first frame of the day films)', 'Start frame for every later still of the day'],
      alt: 'A terrace over the sea at first light, the sun just clearing the horizon.',
      brief: 'The terrace over the sea at first light: sun on the horizon at the left, rose and gold, right two-thirds open sky.',
      prompt: SCENE + ' ' + VIEW + ' ' + DAYLIGHT.dawn + ' ' + NEG,
    }),
    dayStill({
      id: 'day-noon', tone: 'noon', refs: ['higgsfield/renders/day-dawn.png'],
      used: ['Home: one day, the sky at 12:00 (end of the morning film, start of the afternoon film)'],
      alt: 'The same terrace at noon, hard white light and a glittering sea.',
      brief: 'The same frame six hours later: noon, hard white light, the shortest shadows, a glittering sea.',
      prompt: LATER('six hours later, at noon') + DAYLIGHT.noon + ' ' + NEG,
    }),
    dayStill({
      id: 'day-dusk', tone: 'dusk', refs: ['higgsfield/renders/day-dawn.png'],
      used: ['Home: one day, the sky at 18:40 (end of the afternoon film, start of the evening film)'],
      alt: 'The same terrace at golden hour, the sun low over the sea at the right.',
      brief: 'The same frame at golden hour: the sun low at the right, copper light, long shadows to the left.',
      prompt: LATER('twelve hours later, at golden hour') + DAYLIGHT.dusk + ' ' + NEG,
    }),
    dayStill({
      id: 'day-night', tone: 'night', refs: ['higgsfield/renders/day-dawn.png'],
      used: ['Home: one day, the sky at 22:30 (last frame of the day films)'],
      alt: 'The same terrace at night under stars, the moon laying a silver path on the sea.',
      brief: 'The same frame at night: stars, the moon high at the left, a silver path on the sea. Dark but readable.',
      prompt: LATER('sixteen hours later, at night') + DAYLIGHT.night + ' ' + NEG,
    }),
    gpt({
      id: 'box-closed', stage: 1, aspect: '16:9', tone: 'night',
      used: ['Home: the set, the closed box (first frame of the box film)', 'Start frame for box-open'],
      alt: 'The Horæ presentation box, closed: midnight-blue lacquer with a gold rim.',
      brief: 'The set’s box, closed, centred on midnight blue: lacquer, a gold line at the rim, twelve gold dots on the lid.',
      prompt: BOX + ' The lid is closed. ' + NEG,
    }),
    gpt({
      id: 'box-open', stage: 3, aspect: '16:9', tone: 'night', refs: ['higgsfield/renders/box-closed.png'],
      used: ['Home: the set, the open empty box (last frame of the box film, then the drawn box takes over)'],
      alt: 'The box open and empty: four cushioned places lined in the colours of the four hours.',
      brief: 'The same frame, the lid open: four empty cushioned places in a row, dawn rose, enamel white, copper, midnight blue.',
      prompt:
        'The same frame as the reference image, with the lid now open. Same camera position, lens, framing, light and box; nothing else has moved. ' +
        'The lid stands open on its hinge at the back, tipped back a little past upright, lined inside in cream silk. Inside the box, a tray with four empty oval cushioned places in a row, ' +
        'left to right lined in dawn rose (#EBCDBD), enamel white (#F4F0E6), copper (#B06C49) and midnight blue aventurine (#1A2A57). The places are empty: no watches. ' + NEG,
    })
  );

  var film = function (o) {
    o.kind = 'film'; o.stage = 4; o.model = 'kling4_0'; o.aspect = '16:9';
    o.params = { mode: 'image-to-video', duration: o.duration || 5, resolution: '1080p' };
    delete o.duration;
    return o;
  };
  /* The Arktos macro: one 4K film for the watch page. The dial in near darkness, then a thin beam of light
     sweeps across it and the lume comes alive. The dark frame is made from the master; the lit frame from the dark one. */
  var MACRO = 'Photoreal luxury watch macro photography, 100mm macro lens, focus-stacked so the whole dial is sharp edge to edge, very fine grain. ' +
    'Extreme close-up, seen straight on: the round dial fills the full height of the frame, centred, the polished platinum case edge just visible at the left and right of the dial, pure black beyond it. ';
  shots.push(
    gpt({
      id: 'arktos-macro-dark', stage: 2, aspect: '16:9', tone: 'night', model_of: 'arktos', refs: ['higgsfield/renders/arktos-front.png'],
      used: ['Arktos page: first frame of the macro film'],
      alt: 'The Arktos dial in near darkness, the aventurine barely glinting.',
      brief: 'Macro, near darkness: the Arktos dial fills the frame, only faint moonlight, a few copper flecks glinting, the lume faint green.',
      prompt: MACRO + 'The dial of ' + WATCH.arktos + ', the hands at ten past ten. Almost total darkness: only a faint cool moonlight from the upper left; ' +
        'the aventurine is a deep near-black blue with a few copper flecks barely glinting; the luminous hands and markers glow faintly green. ' + SAME + ' ' + NEG,
    }),
    gpt({
      id: 'arktos-macro-lit', stage: 3, aspect: '16:9', tone: 'night', model_of: 'arktos', refs: ['higgsfield/renders/arktos-macro-dark.png'],
      used: ['Arktos page: last frame of the macro film'],
      alt: 'The Arktos dial lit by a thin beam of light, the aventurine sparkling, the lume glowing green.',
      brief: 'The same frame, lit: a thin raking beam across the dial, every fleck of the aventurine sparkling, the hands bright, the lume vivid green.',
      prompt: 'The same frame as the reference image, a moment later. Same camera position, lens, framing and watch; nothing has moved. ' +
        'A thin soft beam of warm light now rakes across the dial from the left: every copper and silver fleck of the aventurine sparkles like a field of stars, ' +
        'the polished white gold hands catch one bright highlight along their edges, the moon in its window glows gold, and the luminous hands and markers glow a vivid green. ' + NEG,
    })
  );

  /* The calibre taken apart, filmed: the whole Arktos head, then the same head separated into its layers in
     build order. On the calibre section's own midnight backdrop, so the film sits in the scene. */
  var CAL = 'Photoreal luxury watch product photography, medium-format camera, 120mm lens, focus-stacked, very fine grain. ' +
    'A deep midnight-blue backdrop (#121A38) fading to near black (#06080F) at every edge, one large soft key light from above and a thin rim light from behind. ';
  var LAYERS = 'from top to bottom: the box-domed sapphire crystal; the polished platinum case ring with its crown; the white gold hands with green luminous centres; ' +
    'the midnight-blue aventurine dial flecked with copper, with its gold moon in the window at six; the rhodium movement bridges with straight Geneva stripes, red jewels, blued screws and the gold balance wheel; ' +
    'the gilt gear train of five wheels; the round mainplate decorated with overlapping circular perlage; the half-moon 22k gold winding rotor; and the sapphire caseback in a platinum ring';
  shots.push(
    gpt({
      id: 'calibre-whole', stage: 2, aspect: '16:9', tone: 'night', model_of: 'arktos', refs: ['higgsfield/renders/arktos-front.png'],
      used: ['Home: the calibre, first frame of the film (the watch whole)'],
      alt: 'The Arktos watch head, whole, floating above a midnight-blue backdrop.',
      brief: 'The Arktos head without its strap, floating, seen from about 35 degrees above, centred on midnight blue.',
      prompt: CAL + 'The head of ' + WATCH.arktos.replace(', on a night-blue alligator leather strap', '') + ', with no strap, floating level in the air, ' +
        'seen from the front and about 35 degrees above, centred, the case filling about a third of the frame width, the dial facing up and toward the camera, the hands at ten past ten. ' + SAME + ' ' + NEG,
    }),
    gpt({
      id: 'calibre-apart', stage: 3, aspect: '16:9', tone: 'night', model_of: 'arktos', refs: ['higgsfield/renders/calibre-whole.png'],
      used: ['Home: the calibre, last frame of the film (taken apart)'],
      alt: 'The same watch taken apart into nine layers floating one above the other.',
      brief: 'The same frame, the watch taken apart: nine layers floating in a vertical stack on one axis, evenly spaced, in build order.',
      prompt: 'The same frame as the reference image, with the watch now taken apart. Same camera, lens, angle, light and backdrop. ' +
        'Its parts float in a single vertical stack on the same centre axis, level, evenly spaced, the stack filling about 85% of the frame height, ' + LAYERS + '. ' +
        'Every part is clean, complete and sharp; nothing is broken or missing. ' + NEG,
    })
  );

  var TL = 'One continuous time-lapse shot, no cuts, the camera locked off and perfectly still. ';
  var STEADY = ' Smooth, steady, natural motion, no flicker, constant framing. No text, no logos.';
  var films = [
    film({
      id: 'film-day-am', name: 'day-am', start: 'day-dawn', end: 'day-noon', focus: 0.62, scene: 'day', from: 6, to: 12,
      used: ['Home: one day, 06:00 to 12:00, scrubbed by the clock'],
      alt: 'Time-lapse: the sun climbs from the horizon to noon over a terrace by the sea.',
      brief: 'Locked-off time-lapse, 5 s: sunrise to noon. The sun climbs out of frame, rose turns white, the shadows shorten.',
      beats: [{ at: 0, text: 'First light. The sun clears the sea.' }, { at: 0.45, text: 'The rose goes out of the light.' }, { at: 0.85, text: 'Noon. The shortest shadow.' }],
      prompt: TL + 'From sunrise to noon: the sun climbs from the horizon at the left and up out of the top of the frame, the sky brightens from rose and lilac to pale blue, ' +
        'the rose light on the stone turns white, the shadows on the parapet shorten to almost nothing, thin clouds drift slowly to the right.' + STEADY,
    }),
    film({
      id: 'film-day-pm', name: 'day-pm', start: 'day-noon', end: 'day-dusk', focus: 0.62, scene: 'day', from: 12, to: 18.67,
      used: ['Home: one day, 12:00 to 18:40, scrubbed by the clock'],
      alt: 'Time-lapse: the light warms from noon to golden hour over the sea.',
      brief: 'Locked-off time-lapse, 5 s: noon to golden hour. The sun comes down at the right, shadows lengthen left, the sea turns gold.',
      beats: [{ at: 0, text: 'Noon.' }, { at: 0.5, text: 'The light warms.' }, { at: 0.85, text: 'Golden hour. The light turns copper.' }],
      prompt: TL + 'From noon to golden hour: the sun comes down into the right of the frame, the light warms from white to amber and copper, ' +
        'the shadows lengthen across the parapet toward the left, the sea turns from blue to gold, thin clouds drift slowly to the right.' + STEADY,
    }),
    film({
      id: 'film-day-eve', name: 'day-eve', start: 'day-dusk', end: 'day-night', focus: 0.62, scene: 'day', from: 18.67, to: 22.5,
      used: ['Home: one day, 18:40 to 22:30, scrubbed by the clock'],
      alt: 'Time-lapse: the sun sets into the sea, the stars come out and the moon rises.',
      brief: 'Locked-off time-lapse, 5 s: golden hour to night. The sun sets at the right, violet to blue-black, stars, the moon rises left.',
      beats: [{ at: 0, text: 'Golden hour.' }, { at: 0.35, text: 'The sun goes into the sea.' }, { at: 0.7, text: 'The first stars.' }, { at: 0.9, text: 'Night. The Bear is up.' }],
      prompt: TL + 'From golden hour to night: the sun sets into the sea at the right, the sky passes through copper and violet to deep blue-black, ' +
        'the first stars appear and thicken, the moon rises at the upper left and lays a silver path across the sea. The scene stays readable to the end.' + STEADY,
    }),
    film({
      id: 'film-box', name: 'box', start: 'box-closed', end: 'box-open', focus: 0.5, scene: 'set',
      used: ['Home: the set, the box opening, scrubbed by scrolling; then the drawn box takes over'],
      alt: 'The lacquered box opens on its hinge, showing four empty places lined in four colours.',
      brief: 'Locked-off, 5 s: the lid lifts slowly on its hinge and opens on four empty places. Only the lid moves.',
      beats: [{ at: 0, text: 'Closed, and empty.' }, { at: 0.35, text: 'The lid lifts.' }, { at: 0.85, text: 'Four places, cut to size.' }],
      prompt: 'One continuous shot, no cuts, locked-off camera. The lid of the box lifts slowly on its hinge at the back and opens, revealing a tray with four empty cushioned places lined in four colours. ' +
        'Only the lid moves; the box, the camera and the light stay still. Slow and smooth, constant exposure. No text, no logos.',
    }),
  ];

  films.push(film({
    id: 'film-arktos-macro', name: 'arktos-macro', start: 'arktos-macro-dark', end: 'arktos-macro-lit', focus: 0.5, scene: 'arktos', width: 2560,
    used: ['Arktos page: the macro film, scrubbed by scrolling'],
    alt: 'In near darkness, a beam of light sweeps across the Arktos dial; the aventurine sparkles and the hands begin to glow.',
    brief: 'Macro, 4K, 5 s: in near darkness a thin beam sweeps across the dial; the aventurine sparkles, the lume comes alive. Nothing else moves.',
    beats: [{ at: 0, text: 'Lights out.' }, { at: 0.4, text: 'A thread of light across the aventurine.' }, { at: 0.85, text: 'The hands begin to glow.' }],
    prompt: 'One continuous macro shot, no cuts, locked-off camera with a very slow push-in. In near darkness a thin beam of light slowly sweeps across the watch dial from left to right, ' +
      'lighting the copper flecks of the aventurine one by one like stars; the luminous hands and markers glow steadily brighter green. The watch and its hands do not move. Slow, smooth, constant framing. No text, no logos.',
  }));
  films[films.length - 1].params.resolution = '4k';
  films.push(film({
    id: 'film-calibre', name: 'calibre', start: 'calibre-whole', end: 'calibre-apart', focus: 0.5, scene: 'calibre', width: 2560,
    used: ['Home: the calibre taken apart, scrubbed by scrolling'],
    alt: 'The Arktos comes apart into its layers, crystal at the top, caseback at the bottom.',
    brief: 'Locked-off, 4K, 5 s: the whole watch head separates slowly into nine layers in a vertical stack. Only the parts move, straight up and down.',
    beats: [{ at: 0, text: 'Whole.' }, { at: 0.35, text: 'It comes apart in the order it was built.' }, { at: 0.85, text: 'Nine layers. 214 parts.' }],
    prompt: 'One continuous shot, no cuts, locked-off camera. The floating watch head slowly comes apart: its layers lift and separate straight up and down along one vertical axis, ' +
      'the crystal rising to the top and the caseback sinking to the bottom, the dial, movement bridges, wheels, mainplate and gold rotor spreading evenly between them, ' +
      'until all nine layers float level in a tall evenly spaced stack. The parts do not spin or tilt. Slow, smooth, precise, constant light. No text, no logos.',
  }));
  films[films.length - 1].params.resolution = '4k';

  var all = shots.concat(films);
  root.HORAE_SHOTS = {
    look: { STUDIO: STUDIO, SCENE: SCENE, ATELIER: ATELIER, LIGHT_ANATOLE: LIGHT.anatole, LIGHT_MESEMBRIA: LIGHT.mesembria, LIGHT_HESPERIS: LIGHT.hesperis, LIGHT_ARKTOS: LIGHT.arktos, VIEW: VIEW, BOX: BOX, NEG: NEG, SAME: SAME },
    watch: WATCH,
    shots: shots,
    films: films,
    all: all,
    byId: all.reduce(function (a, s) { a[s.id] = s; return a; }, {}),
  };
})(typeof window !== 'undefined' ? window : globalThis);
