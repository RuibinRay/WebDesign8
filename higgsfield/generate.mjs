/**
 * HORÆ: generate every image and scroll film on Higgsfield from js/shots.js.
 *
 *   node higgsfield/generate.mjs                  plan only: what would run, what it costs, current balance
 *   node higgsfield/generate.mjs --go             generate everything not yet made (stage 1, 2, 3, then 4)
 *   node higgsfield/generate.mjs images --go      only images   (also: films)
 *   node higgsfield/generate.mjs arktos-front family --go     only these
 *   node higgsfield/generate.mjs family --go --force       re-roll (the old file is kept as family_v1.png)
 *   node higgsfield/generate.mjs --go --quality xhigh    upgrade pass for the gpt_image_2_6 shots
 *
 * Stage 1 makes each watch's master (<model>-front) and the atelier shots.
 * Stage 2 passes the master as a reference image so the same watch appears in every picture,
 * so a stage 2 shot is skipped until its master exists.
 * Stage 3 makes the films' later stills FROM their first still ("the same frame, later"): day-noon, day-dusk,
 * day-night from day-dawn, box-open from box-closed. Look at them side by side before stage 4.
 * Stage 4 makes the scroll films (Kling 4.0, image to video between a start and an end still, about 5 minutes each).
 *
 * After a run it calls optimize.mjs, which turns the renders into the WebP files the site loads.
 * Needs the Higgsfield CLI, logged in. Set HF_BIN if it is not in the default place.
 * Every job is recorded in higgsfield/manifest.json (job ids only, never the download links).
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'higgsfield/renders');
const MANIFEST = path.join(ROOT, 'higgsfield/manifest.json');
const CONCURRENCY = Number(process.env.HF_CONCURRENCY || 4);
const DEFAULT_BIN = path.join(process.env.LOCALAPPDATA || '', 'Programs/higgsfield-cli/hf.exe');
const HF = process.env.HF_BIN || (fs.existsSync(DEFAULT_BIN) ? DEFAULT_BIN : 'higgsfield');
/* a film cannot be priced by the CLI before its stills exist: credits quoted on 2026-11-20 */
const QUOTED = { kling4_0: { 5: 18.75, 10: 37.5 } };

/* ── load the shot list (a browser script) ── */
const ctx = {};
ctx.globalThis = ctx;
vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'js/shots.js'), 'utf8'), ctx);
const shots = ctx.HORAE_SHOTS.all;
const kindOf = (s) => s.kind || 'image';
const GROUPS = { images: 'image', films: 'film' };

/* ── arguments ── */
const argv = process.argv.slice(2);
const flag = (n) => { const i = argv.indexOf(`--${n}`); return i > -1 ? argv[i + 1] : undefined; };
const GO = argv.includes('--go');
const FORCE = argv.includes('--force');
const override = { quality: flag('quality'), resolution: flag('resolution') };
const words = argv.filter((a, i) => !a.startsWith('--') && !/^--(quality|resolution)$/.test(argv[i - 1] || ''));

/* ── helpers ── */
function hf(args) {
  return new Promise((resolve, reject) => {
    const c = spawn(HF, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let o = '', e = '';
    c.stdout.on('data', (d) => (o += d));
    c.stderr.on('data', (d) => (e += d));
    c.on('error', reject);
    c.on('close', (code) => (code === 0 ? resolve(o) : reject(new Error((e || o).trim().slice(0, 500)))));
  });
}
const readManifest = () => (fs.existsSync(MANIFEST) ? JSON.parse(fs.readFileSync(MANIFEST, 'utf8')) : { images: {} });
const writeManifest = (m) => fs.writeFileSync(MANIFEST, JSON.stringify(m, null, 2));
const renderOf = (id) => {
  for (const ext of ['png', 'jpg', 'jpeg', 'webp', 'mp4']) {
    const f = path.join(OUT, `${id}.${ext}`);
    if (fs.existsSync(f)) return f;
  }
  return null;
};
/* refs are written as higgsfield/renders/<id>.png; accept whatever extension the download had */
const resolveRef = (ref) => renderOf(path.basename(ref).replace(/\.[^.]+$/, ''));
const paramsOf = (s) => {
  const p = { ...s.params };
  if (s.model === 'gpt_image_2_6') {
    if (override.quality) p.quality = override.quality;
    if (override.resolution) p.resolution = override.resolution;
  }
  return p;
};
const argsOf = (s, files) => {
  const a = [s.model, '--prompt', s.prompt, '--aspect_ratio', s.aspect];
  for (const [k, v] of Object.entries(paramsOf(s))) a.push(`--${k}`, String(v));
  if (kindOf(s) === 'film') { if (files[0]) a.push('--start-image', files[0]); if (files[1]) a.push('--end-image', files[1]); }
  else for (const r of files) a.push('--image', r);
  return a;
};
const findUrl = (j) => {
  const m = JSON.stringify(j).match(/https?:\/\/[^"\\]+?\.(?:png|jpe?g|webp|mp4)(?:\?[^"\\]*)?/i);
  return m ? m[0] : null;
};

/* ── what to run ── */
const manifest = readManifest();
const unknown = words.filter((w) => w !== 'all' && !GROUPS[w] && !shots.some((s) => s.id === w));
if (unknown.length) { console.error('Unknown ids or groups: ' + unknown.join(', ')); process.exit(1); }
const wanted = !words.length || words.includes('all') ? shots
  : shots.filter((s) => words.includes(s.id) || words.some((w) => GROUPS[w] === kindOf(s)));
const queue = wanted.filter((s) => FORCE || !renderOf(s.id)).sort((a, b) => a.stage - b.stage);

/* ── plan: price every job (free), show the balance ── */
const prices = {};
async function priceOf(s) {
  if (s.model in QUOTED) return QUOTED[s.model][s.params.duration] ?? null;
  const key = s.model + JSON.stringify(paramsOf(s)) + s.aspect;
  if (!(key in prices)) {
    try { prices[key] = JSON.parse(await hf(['generate', 'cost', ...argsOf(s, []), '--json'])).credits; }
    catch { prices[key] = null; }
  }
  return prices[key];
}
let total = 0;
console.log(`\n  ${queue.length} of ${shots.length} assets to make${FORCE ? ' (forced re-roll)' : ''}\n`);
for (const s of queue) {
  const c = await priceOf(s);
  total += c || 0;
  console.log(`  ${String(s.stage).padEnd(2)} ${s.id.padEnd(15)} ${s.model.padEnd(15)} ${s.aspect.padEnd(5)} ${c == null ? '?' : c.toFixed(2).padStart(6)} cr`);
}
let balance = null;
try { balance = JSON.parse(await hf(['account', 'status', '--json'])).credits; } catch (e) { console.log('\n  Could not read the balance: ' + e.message.split('\n')[0]); }
console.log(`\n  Estimated cost ${total.toFixed(2)} credits · balance ${balance == null ? 'unknown' : balance.toFixed(2)} credits\n`);

if (!GO) {
  console.log('  Plan only. Add --go to generate.\n');
  process.exit(0);
}
if (!queue.length) process.exit(0);
if (balance != null && balance < total * 1.05) {
  console.log(`  Not enough credits for this batch (need about ${(total * 1.05).toFixed(1)} with a 5% margin). Top up, or name fewer shots.\n`);
  process.exit(2);
}

/* ── run ── */
async function runJob(s) {
  const inputs = kindOf(s) === 'film' ? [s.start, s.end].map((id) => `higgsfield/renders/${id}.png`) : s.refs || [];
  const refs = inputs.map(resolveRef);
  if (refs.some((r) => !r)) throw new Error('input not made yet: ' + inputs.join(', '));
  const started = Date.now();
  /* Submit, save the job id at once, then wait. A dropped connection during a long wait (a film) can then be
     picked up by running the command again, instead of paying for a second job. */
  const prior = manifest.images[s.id];
  let jobId = !FORCE && prior?.status === 'running' && prior.job_id ? prior.job_id : null;
  if (jobId) console.log(`  … ${s.id}: resuming job ${jobId}`);
  else {
    const raw = await hf(['generate', 'create', ...argsOf(s, refs), '--json']);
    let created = null;
    try { created = JSON.parse(raw); } catch {}
    const c0 = Array.isArray(created) ? created[0] : created;
    jobId = c0?.id || c0?.job_id || (raw.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/) || [])[0];
    if (!jobId) throw new Error('submitted, but no job id in the CLI output: ' + raw.slice(0, 300));
    manifest.images[s.id] = { status: 'running', kind: kindOf(s), model: s.model, job_id: jobId, submitted: new Date().toISOString() };
    writeManifest(manifest);
  }
  const timeout = kindOf(s) === 'film' ? '40m' : '15m';
  let first = null;
  for (let attempt = 1; attempt <= 3 && !first; attempt++) {
    try {
      await hf(['generate', 'wait', jobId, '--timeout', timeout, '--quiet']);
      first = JSON.parse(await hf(['generate', 'get', jobId, '--json']));
    } catch (e) {
      if (attempt === 3) throw new Error(`job ${jobId} is saved in manifest.json; run again to resume. Last error: ${String(e.message || e).split('\n')[0]}`);
    }
  }
  if (first.status && first.status !== 'completed') throw new Error(`job ${jobId} ended as ${first.status}`);
  const url = first.result_url || first.results?.[0]?.url || findUrl(first);
  if (!url) throw new Error('no result url for job ' + jobId);
  const ext = (url.match(/\.(png|jpe?g|webp|mp4)(?:\?|$)/i)?.[1] || (kindOf(s) === 'film' ? 'mp4' : 'png')).toLowerCase().replace('jpeg', 'jpg');
  fs.mkdirSync(OUT, { recursive: true });
  const old = renderOf(s.id);
  if (old) {
    let n = 1;
    while (fs.existsSync(path.join(OUT, `${s.id}_v${n}${path.extname(old)}`))) n++;
    fs.renameSync(old, path.join(OUT, `${s.id}_v${n}${path.extname(old)}`));
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error(`download failed ${res.status}`);
  const file = path.join(OUT, `${s.id}.${ext}`);
  fs.writeFileSync(file, Buffer.from(await res.arrayBuffer()));
  return {
    status: 'done', kind: kindOf(s), model: s.model, params: paramsOf(s), aspect: s.aspect, inputs,
    job_id: jobId, file: path.relative(ROOT, file).replaceAll('\\', '/'),
    seconds: Math.round((Date.now() - started) / 1000), at: new Date().toISOString(),
  };
}

async function runStage(list) {
  let i = 0;
  const worker = async () => {
    while (i < list.length) {
      const s = list[i++];
      try {
        manifest.images[s.id] = await runJob(s);
        console.log(`  ✓ ${s.id.padEnd(15)} ${manifest.images[s.id].seconds}s`);
      } catch (e) {
        /* a job that was submitted keeps its id (status running), so running the command again resumes it */
        const sub = manifest.images[s.id]?.status === 'running' ? manifest.images[s.id] : null;
        manifest.images[s.id] = { ...(sub || {}), status: sub ? 'running' : 'failed', error: String(e.message || e).slice(0, 300), at: new Date().toISOString() };
        console.log(`  ✗ ${s.id.padEnd(15)} ${e.message.split('\n')[0]}`);
      }
      writeManifest(manifest);
    }
  };
  /* Higgsfield runs fewer videos than images at once */
  const n = list.every((s) => kindOf(s) === 'film') ? Math.min(2, CONCURRENCY) : CONCURRENCY;
  await Promise.all(Array.from({ length: Math.min(n, list.length) }, worker));
}

for (const stage of [1, 2, 3, 4]) {
  const list = queue.filter((s) => s.stage === stage);
  if (!list.length) continue;
  console.log(`  Stage ${stage}: ${list.map((s) => s.id).join(', ')}`);
  await runStage(list);
}

const failed = queue.filter((s) => manifest.images[s.id]?.status !== 'done');
console.log(`\n  Done: ${queue.length - failed.length} made, ${failed.length} failed${failed.length ? ' (' + failed.map((s) => s.id).join(', ') + '). Run the same command again to retry them.' : '.'}\n`);

/* hand the new renders to the site */
await new Promise((resolve) => {
  const c = spawn(process.execPath, [path.join(ROOT, 'higgsfield/optimize.mjs')], { stdio: 'inherit' });
  c.on('close', resolve);
});
