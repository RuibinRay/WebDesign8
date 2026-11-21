/**
 * HORÆ: cut the live watches out of their backdrops (Higgsfield image_background_remover, 1 credit each).
 *
 *   node higgsfield/cutout.mjs            plan only: which renders would be cut, the cost, the balance
 *   node higgsfield/cutout.mjs --go       cut every shot marked `cutout: true` in js/shots.js that has a render and no cut yet
 *   node higgsfield/cutout.mjs arktos-plate --go --force      redo one
 *
 * Reads   higgsfield/renders/<id>.png        (the plates: each master with its hands removed; the backs)
 * Writes  higgsfield/renders/<id>-cut.png    (transparent PNG), recorded in manifest.json as <id>-cut
 * Then runs optimize.mjs, which writes assets/img/<id>-cut.webp and measures the case circle of each cut
 * (ready.js `cut`), so js/art.js can put its drawn hands exactly on the photographed dial.
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'higgsfield/renders');
const MANIFEST = path.join(ROOT, 'higgsfield/manifest.json');
const DEFAULT_BIN = path.join(process.env.LOCALAPPDATA || '', 'Programs/higgsfield-cli/hf.exe');
const HF = process.env.HF_BIN || (fs.existsSync(DEFAULT_BIN) ? DEFAULT_BIN : 'higgsfield');
const MODEL = 'image_background_remover';

const ctx = {};
ctx.globalThis = ctx;
vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'js/shots.js'), 'utf8'), ctx);
const argv = process.argv.slice(2);
const GO = argv.includes('--go'), FORCE = argv.includes('--force');
const ids = argv.filter((a) => !a.startsWith('--'));

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
const src = (id) => ['png', 'jpg', 'webp'].map((e) => path.join(OUT, `${id}.${e}`)).find((f) => fs.existsSync(f));
const cut = (id) => path.join(OUT, `${id}-cut.png`);
const manifest = fs.existsSync(MANIFEST) ? JSON.parse(fs.readFileSync(MANIFEST, 'utf8')) : { images: {} };

const marked = ctx.HORAE_SHOTS.shots.filter((s) => s.cutout && (!ids.length || ids.includes(s.id)));
const queue = marked.filter((s) => src(s.id) && (FORCE || !fs.existsSync(cut(s.id))));
const waiting = marked.filter((s) => !src(s.id)).map((s) => s.id);

let price = null;
if (queue.length) {
  try { price = JSON.parse(await hf(['generate', 'cost', MODEL, '--image', src(queue[0].id), '--json'])).credits; } catch { price = null; }
}
let balance = null;
try { balance = JSON.parse(await hf(['account', 'status', '--json'])).credits; } catch {}
console.log(`\n  ${queue.length} to cut${waiting.length ? ` (no render yet: ${waiting.join(', ')})` : ''}`);
queue.forEach((s) => console.log(`  ${s.id.padEnd(16)} ${MODEL}  ${price == null ? '?' : price.toFixed(2)} cr`));
console.log(`\n  Estimated cost ${price == null ? '?' : (price * queue.length).toFixed(2)} credits · balance ${balance == null ? 'unknown' : balance.toFixed(2)} credits\n`);
if (!GO) { console.log('  Plan only. Add --go to cut.\n'); process.exit(0); }

const findUrl = (j) => { const m = JSON.stringify(j).match(/https?:\/\/[^"\\]+?\.(?:png|webp)(?:\?[^"\\]*)?/i); return m ? m[0] : null; };
let i = 0;
async function worker() {
  while (i < queue.length) {
    const s = queue[i++], t0 = Date.now();
    try {
      const json = JSON.parse(await hf(['generate', 'create', MODEL, '--image', src(s.id), '--wait', '--wait-timeout', '10m', '--json']));
      const first = Array.isArray(json) ? json[0] : json;
      const url = first?.result_url || first?.results?.[0]?.url || findUrl(json);
      if (!url) throw new Error('no result url in CLI output');
      const res = await fetch(url);
      if (!res.ok) throw new Error(`download failed ${res.status}`);
      fs.writeFileSync(cut(s.id), Buffer.from(await res.arrayBuffer()));
      manifest.images[`${s.id}-cut`] = { status: 'done', kind: 'cutout', model: MODEL, inputs: [path.relative(ROOT, src(s.id)).replaceAll('\\', '/')], job_id: first?.id || first?.job_id || null, file: path.relative(ROOT, cut(s.id)).replaceAll('\\', '/'), seconds: Math.round((Date.now() - t0) / 1000), at: new Date().toISOString() };
      console.log(`  ✓ ${s.id}-cut  ${manifest.images[`${s.id}-cut`].seconds}s`);
    } catch (e) {
      manifest.images[`${s.id}-cut`] = { status: 'failed', error: String(e.message || e).slice(0, 300), at: new Date().toISOString() };
      console.log(`  ✗ ${s.id}-cut  ${String(e.message || e).split('\n')[0]}`);
    }
    fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2));
  }
}
await Promise.all(Array.from({ length: Math.min(4, queue.length) }, worker));
await new Promise((resolve) => { const c = spawn(process.execPath, [path.join(ROOT, 'higgsfield/optimize.mjs')], { stdio: 'inherit' }); c.on('close', resolve); });
