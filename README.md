# Horæ · every hour has a name

**Live:** https://ruibinray.github.io/WebDesign8/ (GitHub `RuibinRay/WebDesign8`, deployed by `.github/workflows/deploy.yml` on every push to `main`).

Concept luxury watch brand. Before the hours were numbers, the Greeks named them: Hyginus lists twelve Horae, from **Auge** (first light) to **Arktos** (the night sky). Horæ makes one watch for each of four of those hours, and the hour decides everything about it: dial, metal, thickness, even the shadow its hands cast.

| Watch | Hour | Case | Movement | Price |
|---|---|---|---|---|
| **Anatole** | Sunrise | Steel, 39 mm, sunburst dial rose to gold | H·1 self-winding, 72 h | $9,800 |
| **Mesembria** | Noon | White gold, 37 mm, **6.4 mm thin**, grand feu enamel | H·2 hand-wound, 60 h | $24,500 |
| **Hesperis** | Evening | Rose gold, 38.5 mm, salmon sector dial, small seconds | H·2S hand-wound, 60 h | $28,400 |
| **Arktos** | Night | Platinum, 40 mm, aventurine dial, lume, real moon phase | H·1L self-winding, 72 h | $46,000 |
| **The Complete Day** (set) | All four | The four with consecutive case numbers in one lacquered box, twelve sets a year | | $108,700 |

**Look:** the palette is a day: night ink `#0A0E1C`, dawn rose `#EBC3B0`, enamel `#FBF9F3`, limestone `#F3EEE4`, copper `#9A5A3E`, aventurine `#1A2A57`, with gold `#C9A46A` and lume green `#A6FFD0` as the only accents. Type: **Bodoni Moda** (optical sizes, italic for watch names) and **Jost** for labels and body.

## Pages

| Page | What it is |
|---|---|
| `index.html` | Home: one day (hero + the four watches), the twelve names, the calibre taken apart, the four hours, the set (the box), the atelier, reserve |
| `watch.html?m=arktos` | Watch page, one template for all four: live watch with strap choice and “its hour”, gallery, its hour, specs, the other hours, reserve bar |
| `breakdown.html` | The brand breakdown: idea, name and mark, range, colour, type, **every scroll transition explained**, pages, pictures, what is invented |
| `shots.html` | The shot sheet (not linked from the site): every image with prompt, model, aspect, reference and copy buttons |

## The watches are photographs now, with live hands

Every watch on the site (the day stage, the watch pages, the "other hours", the box) is a photograph of the real watch, cut out of its backdrop, with only the hands drawn in code on top. So it still tells your time, its hands still cast the sun's shadow and the Arktos hands still glow at night. On the watch page, "See the back" crossfades to a photograph of the movement through sapphire. Add `?drawn` to the address to see the drawings instead.

How it is made (2026-11-20, 32 credits, every image usable first try): the four masters (`<watch>-front`); from each, the same photograph with the hands removed (`<watch>-plate`, the Hesperis keeps its small seconds) and the back framed the same way with the crown on the left (`<watch>-back`); both cut out with Higgsfield's background remover (`node higgsfield/cutout.mjs`, 1 credit each). `optimize.mjs` then measures each case circle from the cut-out's outline (`ready.js` `cut`), and `js/art.js` places the photo so its case is the drawing's case, with the drawn hands on its pinion, scaled to each dial (`photoDial` in `LOOK`). Contact sheets: `higgsfield/contact-sheet-masters.jpg`, `-plates-backs.jpg`, `-cutouts.jpg`, `-fit.jpg` (the fitted circles).

Limits: the strap is the one photographed (the watch page says which); the Arktos moon on the photo is fixed, not the real moon. The watches are shown flat and face on, in 2D, on purpose.

## Luxury pass (2026-11-21)

- **Palette:** warmer ink `#141210`, softer ivory `#F2EEE6`, champagne gold `#B8976A` / `#DCC7A1` in place of the yellower gold, finer hairlines. The four hour colours now appear only as the backdrops of the watch photographs, sampled from them (Anatole `#E5C5BC`, Mesembria `#E5E0D8`, Hesperis `#924D36`, Arktos `#10173D`), so each collection card and its photograph are one surface and the watch floats.
- **Hero:** the watch a little smaller, a stronger veil behind the words, the hour rail and step buttons held back until you scroll.
- **Between watches:** the first fades out before the next fades in (a breath of empty sky), instead of a double exposure.
- **Wrist check:** hairline bars and a champagne slider instead of app-style bars.
- **Films:** desktop frames cut at the films' own 1920 px (was 1600), so the sky is sharp on a large screen.

## The Arktos, close (4K)

On the Arktos page, right after the hero, a pinned film played by scrolling: the dial in near darkness, a thin beam of light sweeps across it, the aventurine fills with sparks and the lume comes alive, one line of copy per moment. Made 2026-11-21 for 49 credits: two stills (`arktos-macro-dark` from the master, `arktos-macro-lit` from the dark one) and `film-arktos-macro`, Kling 4.0 at 4K (3828 × 2164, 45 credits). Desktop frames are cut at 2560 px (`width` on the film in `js/shots.js`), phones get the portrait crop. The section appears only on a watch page whose `<watch>-macro` film or stills exist, so the other three watches can get theirs later for about 49 credits each.

## On the wrist

A section after the four hours (`#wrist`): the four wrist photographs, each saying whose wrist it is (17.5, 15.5, 17 and 18 cm) with the case, thickness, lug to lug and a line on how it sits; the four cases drawn side on to scale, one per row (Mesembria visibly the thin one, Arktos the thick one); and "On your wrist", a slider for your wrist size that compares each watch's lug-to-lug with the flat top of your wrist (taken as a third of the circumference, a common rule of thumb): sits well inside up to 90%, fills the wrist up to 100%, the lugs reach past the edge beyond. The watch page's specs now include lug to lug. Data in `js/data.js` (`FIT`).

## Signature pieces, all drawn in code (no images needed)

- **One day** (`js/home.js`): a pinned stage where scrolling is the clock. It opens on *your* time (“It is 16:58 where you are. The Greeks called this hour Akte”), winds back to first light, then runs the day: sky, sun, moon and stars move, the hands cast real shadows (long at sunrise, none at noon), the dial morphs from watch to watch at each one’s hour, and the lume glows at night.
- **The live watches** (`js/art.js`): four SVG watches with sunburst, enamel, sector and aventurine dials, ticking at 8 beats a second. The Arktos moon follows the real moon.
- **The calibre taken apart**: the watch tilts into 3D and separates into nine labelled layers. Gears turn, the balance beats, the gold rotor (engraved with all twelve hour names) swings with the scroll.
- **The box** (`#set`): a closed, empty presentation box in CSS 3D (lacquer walls, gold rims, hinged lid with the mark on top and “Every hour has a name.” inside). On scroll it turns toward you and opens; the four live watches drop into cushions lined in their hours’ colours, sunrise to night, and a checklist ticks off the box and each watch as it lands, ending on the set’s total and “Reserve the set” (which pre-selects the set in the reserve form). Phones get a 2×2 box.
- **Page morphs** (`js/common.js`, View Transitions): “Discover” flies the watch you clicked, from the day stage or a collection card, into the watch page hero, and its name into the title. Watch page to watch page, the small dial grows into the next hero. Names are given only to what you clicked, at the moment you leave, because a watch appears several times on the home page and duplicate names cancel a transition. The arriving page holds its first paint (`<link rel="expect" blocking="render">`) until the scripts have named the hero. Chrome and Edge 126+, Safari 18.2+; other browsers simply load the page.
- **Flat, face-on watches** (2D on purpose): every watch is its photograph seen straight on, never turned in 3D. On the watch page, "See the back" crossfades to the photographed back. (A CSS-3D "pick it up" version was built and then removed on request: a drawn case side next to a photographed face did not look real.)
- **Scroll feel**: inertia (Lenis on desktop), settle (the day's watch leans with scroll speed and swings into place with a small overshoot when the next one arrives), snap (a moment after you stop, the day and the box come to rest on their nearest state, leaning toward the way you were going; never while a finger or the scrollbar is held, never under reduce), steps (← and → go from state to state; round buttons on the day stage). For tests: `HZ_HOME.settle()`, `HZ_HOME.step('day', 1)`, `HZ_HOME.state()`.
- **Smooth scroll**: Lenis 1.3.27 (MIT), vendored in `assets/vendor/`, on desktop only. Menu links fast-forward through the page (up to 2.8 s, eased) instead of jumping.
- **Guilloché placeholders**: every pending image shows an engraved rosette in its hour’s colour plus a note saying exactly what goes there.

## Scroll films: drawn until they exist

Two films, both planned in `js/shots.js` and played by `js/film.js`:

- **The day** (behind the day stage): one fixed view from a limestone terrace over the sea, from first light to night. Three 5 s Kling films chained at four stills (dawn 06:00, noon 12:00, evening 18:40, night 22:30), played by the same scroll clock that turns the drawn hands, frame by frame. The drawn sun, moon and stars step aside; the drawn watch, rail and panels stay on top.
- **The box** (the set): the real lacquered box opens in the first quarter of the scene, then hands over to the drawn box (a short crossfade at 25–28.5%) just before the live watches drop in, so the checklist works as before.

Each scene works in three tiers: **nothing generated**, the drawn sky and the drawn box are the storyboard (a faint line at the bottom left says the film is pending); **stills only**, the stills crossfade by the hour (day) or by scroll (box); **films**, `optimize.mjs` cuts each film into WebP frames (1600 px wide, 12 a second, plus a 720 × 1280 crop for phones), replaces the first and last frame with the sharp stills, and the page draws them on a canvas, coarse frames first. Tested end to end with throwaway stills and `testsrc2` films (since deleted).

| Film batch | Model | Credits (2026-11-20 quotes) |
|---|---|---|
| 6 stills: `day-dawn`, `box-closed` (stage 1); `day-noon`, `day-dusk`, `day-night`, `box-open` made from them (stage 3) | GPT Image 2.6, 2K high | 12 at 2.00 each (16.5 at 2.75) |
| 4 films: `film-day-am`, `film-day-pm`, `film-day-eve`, `film-box`, 5 s 1080p | Kling 4.0, start + end frame | 75 (18.75 each) |

**The six stills are made** (2026-11-20, 12.00 credits, all first try; the two box stills re-rolled for 4.00 because a ring of twelve gold dots on midnight blue read as the EU flag, now a gold dial ring with twelve batons, old pair kept as `_v1`; contact sheet `higgsfield/contact-sheet-film-stills.jpg`), so the site runs the stills tier now: the day crossfades dawn, noon, evening and night behind the watch, and the box crossfades closed to open. The photographed tray is placed on the drawn tray in its open pose (`TRAY` in `js/home.js`: 58.2% of the frame wide, centred, at 53% height; re-measure if `box-open` is re-rolled), so the hand-over to the drawn box does not jump on desktop; on phones the drawn tray is 2 × 2, so it is a softer crossfade. **Films (2026-11-20, 75 credits, all four made):** `film-day-am` (sunrise to noon), `film-day-pm` (noon to golden hour), `film-day-eve` (golden hour to night, stars and moon) and `film-box` (the lid opens) play frame by frame. The three day films join without a seam: each starts and ends at its stills' brightness (morning 132→194, afternoon 194→111, evening 111→30). Contact sheet `higgsfield/contact-sheet-films.jpg`. The afternoon film first failed before Higgsfield created a job (not charged) and was re-made. `generate.mjs` now submits, saves the job id in `manifest.json` straight away, then waits: if a long wait drops, run the same command again and it resumes that job instead of paying for a new one. `js/film.js` can also play a chain with one film missing, crossfading that shot's two stills.

## Images: not generated yet

29 images (23 for the pages, 6 film stills), all planned in `js/shots.js`. All page images are made (2026-11-20): the 6 film stills, the 4 masters, 4 backs, 4 angles, 4 wrists, the four together, the closing shot, the four atelier scenes and the sundial, plus 4 hand-free plates and 8 cut-outs for the live watches. Contact sheets in `higgsfield/`. `atelier-enamel` and `story-sundial` were re-rolled once (0.24 credits): the first versions missed their brief (a cup instead of an enamel dial leaving the kiln; a stone bowl instead of a sundial); the old ones are kept as `_v1`. When you are ready:

```powershell
node higgsfield/generate.mjs
```

prints the plan, the cost of every image and your balance, and spends nothing. Then:

```powershell
node higgsfield/generate.mjs --go
```

Stage 1 makes the four masters (`<watch>-front`), five scenes without a watch and the films' first stills; stage 2 passes each master in as a reference image so the same watch appears everywhere; stage 3 makes the films' later stills from their first; stage 4 makes the films. The 23 page images are about **50 credits** at the prices quoted on 2026-11-20 (GPT Image 2.6 at 2K high 2.75 each, later seen at 2.00; Soul Cinematic 0.12 each); with the films, about **124–142 credits** in all. `images` or `films` after the script name runs one group. It writes `higgsfield/manifest.json` and runs the optimiser at the end.

**By hand**: open `shots.html`, copy each prompt, use the model and aspect shown, attach the named reference for stage 2, and save as `higgsfield/renders/<id>.png`. Then run `npm install` once and:

```powershell
node higgsfield/optimize.mjs
```

That writes `assets/img/<id>.webp` and `<id>-sm.webp`, the social card `assets/img/og.jpg` (from `family`), the film frames in `assets/film/<name>/d|m/` (from `higgsfield/renders/film-<name>.mp4`; needs ffmpeg), and `assets/img/ready.js`, the list the site reads.

## Edit the content

- Range, copy, prices, specs, the twelve hours, calibre parts, the sky colours: `js/data.js`
- Prompts, look bible, watch descriptions, the films (stills, beats, which hours each film covers): `js/shots.js`. The film player: `js/film.js`
- The drawn watches, their backs and the calibre: `js/art.js`. The watch page's front/back crossfade: `js/watch-page.js` (`.wp-pair` in the CSS). Where the day and the box come to rest: `DAY_RESTS` and the set's `rests` in `js/home.js`
- Colours, type, layout: `css/horae.css` (tokens at the top)
- Home behaviour: `js/home.js`. Watch page: `js/watch-page.js`. Shared: `js/common.js`, `js/media.js`

## Run it locally

```powershell
node tools/serve.mjs
```

Then open http://localhost:4181/. Plain HTML, CSS and JS, no build step. Motion is full on desktop by default; phones follow the system “reduce motion” switch; the faint “Reduce motion” dial at the top right of the nav lets anyone change it (saved as `horae.motion`). Reduce keeps the scroll-driven scenes (they only move when you scroll) and stops the self-running loops, smooth scrolling and page transitions. `?sync` is a testing aid for background browser tabs where animation frames never fire; it also turns smooth scrolling off.

## Before a real launch

- **Name:** check “Horae”/“Horæ” for trademarks in watches (Nice class 14). A Swiss brand called Horage exists; distinct, but worth a lawyer’s look.
- **Concept values:** every lug-to-lug length and the wrist sizes in the wrist photographs, every price, dimension, power reserve, part and jewel count, finishing time, firing count, “300 a year”, the set’s price and “twelve sets a year”, the warranty, the wait time, the atelier size and the 122-year moon accuracy are proposals. Replace them with real figures.
- **Which hours each name covers** (the hero sentence) is our own reading of Hyginus’s list, made for the site.
- **Reservations** are front end only (stored in the browser). Connect a CRM or mailing tool.
- Service links in the footer are plain text until those pages exist.
