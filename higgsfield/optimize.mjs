/**
 * HORÆ: turn renders into what the site loads.
 *
 *   node higgsfield/optimize.mjs
 *
 * Reads   higgsfield/renders/<id>.png|jpg|webp   (from generate.mjs, or saved there by hand from the Higgsfield app)
 * Writes  assets/img/<id>.webp      2000 px wide
 *         assets/img/<id>-sm.webp   900 px wide, for phones
 *         assets/img/og.jpg         social card from the family shot, if it exists
 *         assets/img/ready.js       the list of images and videos that exist; the site only asks for these
 *
 *         assets/film/<name>/d/0001.webp…   scroll frames from higgsfield/renders/film-<name>.mp4, 1600 px wide, 12 a second
 *         assets/film/<name>/m/0001.webp…   720 × 1280 portrait crop for phones, at the film's `focus`
 *         (the first and last frame are replaced by the sharp stills the film was made from)
 *         assets/img/<id>-cut.webp, -cut-sm.webp   the cut-out live watches (from higgsfield/cutout.mjs), with the
 *                                  case circle of each measured from its outline (ready.js `cut`), so js/art.js
 *                                  can lay its drawn hands exactly on the photographed dial
 * Films need ffmpeg (set FFMPEG_BIN if it is not on PATH).
 *
 * Videos are optional: put <id>.mp4 in assets/video/ (for example closing.mp4) and run this again.
 * Re-running is cheap: an image is only re-encoded when its render is newer than its WebP.
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

/* sharp on Windows keeps a file it has read open in its cache, so a frame it has just read cannot be overwritten */
sharp.cache(false);

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'higgsfield/renders');
const OUT = path.join(ROOT, 'assets/img');
const VID = path.join(ROOT, 'assets/video');
const FILM = path.join(ROOT, 'assets/film');
const FPS = 12;
const newer = (a, b) => !fs.existsSync(b) || fs.statSync(a).mtimeMs > fs.statSync(b).mtimeMs;

const ctx = {};
ctx.globalThis = ctx;
vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'js/shots.js'), 'utf8'), ctx);
const S = ctx.HORAE_SHOTS;
const known = new Set(S.shots.map((s) => s.id));

fs.mkdirSync(OUT, { recursive: true });
const renders = fs.existsSync(SRC) ? fs.readdirSync(SRC).filter((f) => /\.(png|jpe?g|webp)$/i.test(f) && !/_v\d+\./.test(f)) : [];

for (const file of renders) {
  const id = file.replace(/\.[^.]+$/, '');
  if (!known.has(id)) { if (!/-cut$/.test(id)) console.log(`  · ${file}: not a shot id in js/shots.js, skipped`); continue; }
  const src = path.join(SRC, file);
  const big = path.join(OUT, `${id}.webp`);
  if (fs.existsSync(big) && fs.statSync(big).mtimeMs >= fs.statSync(src).mtimeMs) continue;
  const meta = await sharp(src).metadata();
  await sharp(src).resize({ width: Math.min(2000, meta.width) }).webp({ quality: 80, effort: 5 }).toFile(big);
  await sharp(src).resize({ width: Math.min(900, meta.width) }).webp({ quality: 78, effort: 5 }).toFile(path.join(OUT, `${id}-sm.webp`));
  console.log(`  ✓ ${id.padEnd(15)} ${meta.width}×${meta.height}`);
}

/* social card: the family shot with the mark (a ring of twelve hour points around the Æ) */
const hero = renders.find((f) => /^family\.(png|jpe?g|webp)$/i.test(f));
if (hero) {
  const dots = Array.from({ length: 12 }, (_, i) => {
    const a = (i * 30 - 90) * Math.PI / 180;
    return `<circle cx="${(60 + 52 * Math.cos(a)).toFixed(1)}" cy="${(60 + 52 * Math.sin(a)).toFixed(1)}" r="${i % 3 ? 1.6 : 2.6}"/>`;
  }).join('');
  const mark =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120"><g fill="#E7D3A7">' + dots + '</g>' +
    '<circle cx="60" cy="60" r="44" fill="none" stroke="#E7D3A7" stroke-width="1"/>' +
    '<text x="60" y="76" text-anchor="middle" font-family="Didot, Bodoni 72, serif" font-size="46" fill="#F5F1E8">Æ</text></svg>';
  await sharp(path.join(SRC, hero))
    .resize(1200, 630, { fit: 'cover', position: 'centre' })
    .composite([{ input: Buffer.from(mark), left: 64, top: 64 }])
    .jpeg({ quality: 84, mozjpeg: true })
    .toFile(path.join(OUT, 'og.jpg'));
  console.log('  ✓ og.jpg');
}

/* ── cut-outs: the live watches ──
   The case is a circle; the strap above and below it is narrower. Rows where the outline reaches well past the
   strap are the case; their left and right edges (minus the rows of the crown, at the widest row) are fitted
   with a least-squares circle. Stored as fractions of the image: centre (u, v), radius r of the width, aspect a. */
async function caseCircle(file) {
  const W = 600;
  const { data, info } = await sharp(file).resize({ width: W }).ensureAlpha().extractChannel('alpha').raw().toBuffer({ resolveWithObject: true });
  const H = info.height, L = [], R = [];
  for (let y = 0; y < H; y++) {
    let l = -1, r = -1;
    for (let x = 0; x < W; x++) if (data[y * W + x] > 128) { if (l < 0) l = x; r = x; }
    L.push(l); R.push(r);
  }
  const strap = (arr, sign) => { const v = arr.slice(0, Math.round(H * 0.06)).filter((x) => x >= 0).sort((a, b) => a - b); return v.length ? v[v.length >> 1] : (sign < 0 ? W / 2 : W / 2); };
  const sl = strap(L, -1), sr = strap(R, 1), cy0 = L.indexOf(Math.min(...L.filter((x) => x >= 0)));
  const band = [];
  for (let y = 0; y < H; y++) if (L[y] >= 0 && sl - L[y] > W * 0.1 && R[y] - sr > W * 0.1) band.push(y);
  const half = (band[band.length - 1] - band[0]) / 2, mid = (band[band.length - 1] + band[0]) / 2;
  const pts = [];
  for (const y of band) {
    if (Math.abs(y - mid) < half * 0.22) continue; /* the crown sits at the widest row, on one side or the other */
    pts.push([L[y], y], [R[y] + 1, y]);
  }
  /* Kasa fit: x² + y² + Dx + Ey + F = 0 */
  let a = [[0, 0, 0], [0, 0, 0], [0, 0, 0]], b = [0, 0, 0];
  for (const [x, y] of pts) {
    const row = [x, y, 1], z = -(x * x + y * y);
    for (let i = 0; i < 3; i++) { b[i] += row[i] * z; for (let j = 0; j < 3; j++) a[i][j] += row[i] * row[j]; }
  }
  const det = (m) => m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) - m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) + m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0]);
  const d0 = det(a), sol = [0, 1, 2].map((k) => det(a.map((row, i) => row.map((v, j) => (j === k ? b[i] : v)))) / d0);
  const cx = -sol[0] / 2, cy = -sol[1] / 2, rad = Math.sqrt(cx * cx + cy * cy - sol[2]);
  return { u: +(cx / W).toFixed(4), v: +(cy / H).toFixed(4), r: +(rad / W).toFixed(4), a: +(W / H).toFixed(4), points: pts.length, cy0: +(cy0 / H).toFixed(4) };
}
const cuts = {};
for (const shot of S.shots.filter((x) => x.cutout)) {
  const file = path.join(SRC, `${shot.id}-cut.png`);
  if (!fs.existsSync(file)) continue;
  const big = path.join(OUT, `${shot.id}-cut.webp`);
  if (newer(file, big)) {
    const meta = await sharp(file).metadata();
    await sharp(file).resize({ width: meta.width }).webp({ quality: 92, alphaQuality: 95, effort: 6 }).toFile(big);
    await sharp(file).resize({ width: Math.min(900, meta.width) }).webp({ quality: 88, alphaQuality: 92, effort: 6 }).toFile(path.join(OUT, `${shot.id}-cut-sm.webp`));
    console.log(`  ✓ ${shot.id}-cut  ${meta.width}×${meta.height}`);
  }
  const { points, cy0, ...fit } = await caseCircle(file);
  cuts[shot.id] = fit;
  console.log(`    case circle ${shot.id}: centre ${fit.u}, ${fit.v} · radius ${fit.r} of the width (${points} edge points)`);
}

/* ── films → scroll frames ── */
function ffmpegBin() {
  if (process.env.FFMPEG_BIN) return process.env.FFMPEG_BIN;
  if (spawnSync('ffmpeg', ['-version']).status === 0) return 'ffmpeg';
  const base = path.join(process.env.LOCALAPPDATA || '', 'Microsoft/WinGet/Packages');
  if (fs.existsSync(base)) {
    for (const d of fs.readdirSync(base).filter((n) => /ffmpeg/i.test(n))) {
      for (const sub of fs.readdirSync(path.join(base, d))) {
        const exe = path.join(base, d, sub, 'bin', 'ffmpeg.exe');
        if (fs.existsSync(exe)) return exe;
      }
    }
  }
  return null;
}
const stillOf = (id) => { const f = renders.find((n) => n.replace(/\.[^.]+$/, '') === id); return f ? path.join(SRC, f) : null; };
/* the film's first and last frame become the sharp stills it was made from, cropped the same way */
async function swapEnd(dir, still, index, w, h, focus) {
  if (!still) return;
  const meta = await sharp(still).metadata();
  const crop = h > w && meta.width > meta.height
    ? { left: Math.round((meta.width - (meta.height * w) / h) * focus), top: 0, width: Math.round((meta.height * w) / h), height: meta.height }
    : null;
  let img = sharp(still);
  if (crop) img = img.extract(crop);
  /* written beside the frame and then renamed over it */
  const frame = path.join(dir, String(index).padStart(4, '0') + '.webp'), tmp = frame + '.tmp';
  await img.resize(w, h, { fit: 'cover' }).sharpen({ sigma: 0.6 }).webp({ quality: 84 }).toFile(tmp);
  fs.rmSync(frame, { force: true });
  fs.renameSync(tmp, frame);
}
const films = {};
const ff = S.films.some((f) => fs.existsSync(path.join(SRC, `${f.id}.mp4`))) ? ffmpegBin() : null;
for (const f of S.films) {
  const src = path.join(SRC, `${f.id}.mp4`), base = path.join(FILM, f.name);
  if (!fs.existsSync(src) || !newer(src, path.join(base, 'd', '0001.webp'))) continue;
  if (!ff) { console.log(`  ✗ ${f.id}: ffmpeg not found, set FFMPEG_BIN`); continue; }
  const focus = f.focus ?? 0.5;
  for (const [set, vf] of [
    ['d', `fps=${FPS},scale=1600:-2:flags=lanczos,unsharp=5:5:0.35`],
    ['m', `fps=${FPS},crop=ih*9/16:ih:(iw-ih*9/16)*${focus}:0,scale=720:1280:flags=lanczos,unsharp=5:5:0.35`],
  ]) {
    const out = path.join(base, set);
    fs.rmSync(out, { recursive: true, force: true });
    fs.mkdirSync(out, { recursive: true });
    /* phones get a lighter set: a small screen hides the difference, a mobile connection does not */
    const r = spawnSync(ff, ['-v', 'error', '-y', '-i', src, '-an', '-vf', vf, '-c:v', 'libwebp', '-quality', set === 'm' ? '68' : '80', '-compression_level', '6', path.join(out, '%04d.webp')]);
    if (r.status !== 0) { console.log(`  ✗ ${f.id} (${set}): ${String(r.stderr).slice(0, 200)}`); continue; }
    const frames = fs.readdirSync(out).filter((n) => n.endsWith('.webp')).sort();
    const m0 = await sharp(fs.readFileSync(path.join(out, frames[0]))).metadata();
    await swapEnd(out, stillOf(f.start), 1, m0.width, m0.height, focus);
    await swapEnd(out, stillOf(f.end), frames.length, m0.width, m0.height, focus);
    console.log(`  ✓ film ${f.name}/${set}  ${frames.length} frames ${m0.width}×${m0.height}`);
  }
}
for (const f of S.films) {
  const count = (set) => { const d = path.join(FILM, f.name, set); return fs.existsSync(d) ? fs.readdirSync(d).filter((n) => n.endsWith('.webp')).length : 0; };
  if (count('d')) films[f.name] = { d: count('d'), m: count('m') };
}

/* the ready list */
const img = [...known].filter((id) => fs.existsSync(path.join(OUT, `${id}.webp`))).sort();
const video = fs.existsSync(VID) ? fs.readdirSync(VID).filter((f) => f.endsWith('.mp4')).map((f) => f.slice(0, -4)).sort() : [];
fs.writeFileSync(
  path.join(OUT, 'ready.js'),
  '/* Written by higgsfield/optimize.mjs. Lists the images and videos that exist, so the site never requests a missing file. */\n' +
    `window.HORAE_READY = ${JSON.stringify({ img, video, film: films, cut: cuts })};\n`
);
console.log(`\n  ${img.length} of ${known.size} images ready · films: ${Object.keys(films).join(', ') || 'none'}${video.length ? ` · videos: ${video.join(', ')}` : ''}. Reload the site.\n`);
