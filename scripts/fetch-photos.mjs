/**
 * Pulls one photo per species from Wikimedia and writes the credits alongside them.
 *
 * Run with:  node scripts/fetch-photos.mjs [--force]
 *
 * Only freely licensed images are kept — public domain, CC0, CC BY and CC BY-SA. Anything
 * else (non-commercial, fair use, or no licence data at all) is skipped, and that species
 * keeps its procedural drawing. Every kept image records its author, licence and source
 * page in `public/insects/credits.json`: CC BY and CC BY-SA both require attribution, and
 * shipping these without credit would not be legal.
 *
 * Titles are queried in batches of 50 through the MediaWiki query API rather than one
 * request per species. The first version of this script made two requests per species and
 * was rate-limited into uselessness — worse, it reported every 429 as "no image found",
 * which hid the real problem completely.
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const OUT_DIR = path.join(process.cwd(), 'public', 'insects');
const CREDITS = path.join(OUT_DIR, 'credits.json');
const WIDTH = 900;
const BATCH = 50;
const FORCE = process.argv.includes('--force');
const UA = 'CreepyCrawlies/0.1 (hobby game; https://github.com/aleksandrenko/creepy-crawlies)';

/**
 * Licences we may redistribute. Everything else is skipped rather than guessed at.
 *
 * Both the machine-readable `License` and the human `LicenseShortName` are checked: public
 * domain files often carry no machine value at all, and testing only that field rejected
 * the single most permissive case there is.
 *
 * GFDL is deliberately not here. It is a free licence, but it obliges you to ship the full
 * licence text with the work, which is not worth it for one photo.
 */
const ALLOWED = [
  /^cc0/i, /^cc.?zero/i, /^cc-by-\d/i, /^cc-by-sa-\d/i,
  /^cc by \d/i, /^cc by-sa \d/i,
  /public.?domain/i, /^pd([-_ ]|$)/i,
];
const isAllowed = (lic) =>
  ALLOWED.some((re) => re.test(lic?.license ?? '') || re.test(lic?.licenseName ?? ''));
const strip = (html) => String(html ?? '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Retries on throttling and server errors instead of mistaking them for "not found". */
async function api(url, attempt = 0) {
  const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' } });
  if (res.status === 429 || res.status >= 500) {
    if (attempt >= 4) throw new Error(`gave up after ${attempt + 1} tries: HTTP ${res.status}`);
    const wait = 2000 * 2 ** attempt;
    console.log(`    throttled (HTTP ${res.status}); waiting ${wait / 1000}s`);
    await sleep(wait);
    return api(url, attempt + 1);
  }
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function chunk(list, size) {
  const out = [];
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size));
  return out;
}

/**
 * Maps the titles we asked for to the pages we got back. MediaWiki rewrites titles twice —
 * once normalising them and again following redirects — so both hops have to be replayed
 * or half the results cannot be matched to the species that asked for them.
 */
function resolveTitles(query, asked) {
  const rewrite = new Map();
  for (const n of query.normalized ?? []) rewrite.set(n.from, n.to);
  for (const r of query.redirects ?? []) rewrite.set(r.from, r.to);

  const byTitle = new Map((query.pages ?? []).map((p) => [p.title, p]));
  const out = new Map();
  for (const title of asked) {
    let current = title;
    for (let hop = 0; hop < 4 && rewrite.has(current); hop++) current = rewrite.get(current);
    const page = byTitle.get(current);
    if (page && !page.missing) out.set(title, page);
  }
  return out;
}

/** One request per 50 titles: returns title -> { file, page } for whatever had a lead image. */
async function findImages(titles) {
  const found = new Map();
  for (const group of chunk(titles, BATCH)) {
    const url =
      'https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2' +
      '&prop=pageimages&piprop=original|name&redirects=1&titles=' +
      encodeURIComponent(group.join('|'));
    const data = await api(url);
    const pages = resolveTitles(data.query ?? {}, group);
    for (const [asked, page] of pages) {
      const file = page.pageimage ?? null;
      if (file) found.set(asked, { file: file.replace(/_/g, ' '), page: page.title });
    }
    await sleep(700);
  }
  return found;
}

/** One request per 50 files: returns file -> licence details and a resized URL. */
async function findLicences(files) {
  const out = new Map();
  for (const group of chunk(files, BATCH)) {
    const url =
      'https://commons.wikimedia.org/w/api.php?action=query&format=json&formatversion=2' +
      `&prop=imageinfo&iiprop=extmetadata|url&iiurlwidth=${WIDTH}&titles=` +
      encodeURIComponent(group.map((f) => `File:${f}`).join('|'));
    const data = await api(url);
    for (const page of data.query?.pages ?? []) {
      const info = page.imageinfo?.[0];
      if (!info) continue;
      const meta = info.extmetadata ?? {};
      out.set(page.title.replace(/^File:/, ''), {
        license: meta.License?.value ?? '',
        licenseName: strip(meta.LicenseShortName?.value) || 'unknown',
        licenseUrl: meta.LicenseUrl?.value ?? '',
        author: strip(meta.Artist?.value) || 'Unknown',
        descriptionUrl: info.descriptionurl ?? '',
        url: info.thumburl ?? info.url ?? '',
      });
    }
    await sleep(700);
  }
  return out;
}

/**
 * Last resort for species whose Wikipedia lead image is missing or badly licensed:
 * search Commons itself for a freely licensed photo of the genus.
 *
 * Commons search hits are far less reliable than a curated lead image — you can get a
 * diagram, a specimen drawer, or the wrong species entirely — so this only runs for the
 * handful that the normal path could not serve, and the licence filter still applies.
 */
async function searchCommons(term) {
  const url =
    'https://commons.wikimedia.org/w/api.php?action=query&format=json&formatversion=2' +
    '&list=search&srnamespace=6&srlimit=8&srsearch=' +
    encodeURIComponent(`${term} filetype:bitmap`);
  const data = await api(url).catch(() => null);
  const hits = (data?.query?.search ?? [])
    .map((h) => h.title.replace(/^File:/, ''))
    .filter((f) => /\.(jpe?g|png)$/i.test(f))
    // Diagrams, maps and plates are common in these results and are not what we want.
    .filter((f) => !/(map|diagram|distribution|plate|drawing|illustration|stamp|logo)/i.test(f));
  if (hits.length === 0) return null;

  const licences = await findLicences(hits);
  for (const file of hits) {
    const lic = licences.get(file);
    if (lic && isAllowed(lic)) return { file, lic };
  }
  return null;
}

/** The image CDN throttles bursts too, so downloads need the same patience as the API. */
async function downloadWithRetry(url, dest, attempt = 0) {
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (res.status === 429 || res.status >= 500) {
    if (attempt >= 4) throw new Error(`gave up after ${attempt + 1} tries: HTTP ${res.status}`);
    const wait = 3000 * 2 ** attempt;
    console.log(`    image throttled (HTTP ${res.status}); waiting ${wait / 1000}s`);
    await sleep(wait);
    return downloadWithRetry(url, dest, attempt + 1);
  }
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  await writeFile(dest, Buffer.from(await res.arrayBuffer()));
}

async function loadSpecies() {
  // Read ids and names straight out of the roster files, so this needs no TS build.
  const dir = path.join(process.cwd(), 'src', 'content', 'roster');
  const files = ['core.ts', 'strikers.ts', 'strikers2.ts', 'support.ts'];
  const species = [];
  for (const f of files) {
    const text = await readFile(path.join(dir, f), 'utf8');
    const re = /id:\s*'([^']+)',\s*\n\s*name:\s*(?:'([^']*)'|"([^"]*)"),\s*\n\s*latin:\s*'([^']+)'/g;
    for (const m of text.matchAll(re)) {
      species.push({ id: m[1], name: (m[2] ?? m[3] ?? '').replace(/\\'/g, "'"), latin: m[4] });
    }
  }
  return species;
}

// ── run ───────────────────────────────────────────────────────────────────────

const species = await loadSpecies();
console.log(`roster: ${species.length} species`);
await mkdir(OUT_DIR, { recursive: true });

const credits = existsSync(CREDITS) ? JSON.parse(await readFile(CREDITS, 'utf8')) : {};
const todo = species.filter((s) => FORCE || !existsSync(path.join(OUT_DIR, `${s.id}.jpg`)) || !credits[s.id]);
console.log(`${species.length - todo.length} already have a photo; fetching ${todo.length}`);

// Scientific name first — it disambiguates far better than a common name.
console.log('\nlooking up scientific names…');
const byLatin = await findImages(todo.map((s) => s.latin));

const stillMissing = todo.filter((s) => !byLatin.has(s.latin));
console.log(`looking up ${stillMissing.length} common names…`);
const byName = stillMissing.length ? await findImages(stillMissing.map((s) => s.name)) : new Map();

const picks = new Map();
for (const s of todo) {
  const hit = byLatin.get(s.latin) ?? byName.get(s.name);
  if (hit) picks.set(s.id, { ...s, ...hit });
}
console.log(`found images for ${picks.size} of ${todo.length}`);

console.log('\nchecking licences…');
const licences = await findLicences([...new Set([...picks.values()].map((p) => p.file))]);

let kept = 0;
const skipped = [];

for (const pick of picks.values()) {
  const lic = licences.get(pick.file);
  if (!lic || !isAllowed(lic)) {
    skipped.push(`${pick.id} — licence "${lic?.licenseName ?? 'none'}" not redistributable`);
    continue;
  }
  try {
    await downloadWithRetry(lic.url, path.join(OUT_DIR, `${pick.id}.jpg`));
  } catch (err) {
    skipped.push(`${pick.id} — download failed: ${err.message}`);
    continue;
  }
  credits[pick.id] = {
    latin: pick.latin,
    author: lic.author,
    license: lic.licenseName,
    licenseUrl: lic.licenseUrl,
    source: lic.descriptionUrl,
  };
  kept++;
  console.log(`  ok  ${pick.id.padEnd(18)} ${lic.licenseName.padEnd(14)} ${lic.author.slice(0, 38)}`);
  await sleep(600);
}

// Anything the normal path could not serve gets one attempt at a Commons search.
const stragglers = todo.filter((s) => !credits[s.id]);
if (stragglers.length) {
  console.log(`\nsearching Commons for ${stragglers.length} stragglers…`);
  for (const s of stragglers) {
    const hit = (await searchCommons(s.latin)) ?? (await searchCommons(s.name));
    if (!hit) {
      skipped.push(`${s.id} — nothing freely licensed found for "${s.latin}" or "${s.name}"`);
      continue;
    }
    try {
      await downloadWithRetry(hit.lic.url, path.join(OUT_DIR, `${s.id}.jpg`));
    } catch (err) {
      skipped.push(`${s.id} — download failed: ${err.message}`);
      continue;
    }
    credits[s.id] = {
      latin: s.latin,
      author: hit.lic.author,
      license: hit.lic.licenseName,
      licenseUrl: hit.lic.licenseUrl,
      source: hit.lic.descriptionUrl,
    };
    kept++;
    console.log(`  ok  ${s.id.padEnd(18)} ${hit.lic.licenseName.padEnd(14)} ${hit.lic.author.slice(0, 34)} (via search)`);
    await sleep(800);
  }
}

await writeFile(CREDITS, `${JSON.stringify(credits, null, 2)}\n`);
console.log(`\nkept ${kept}, skipped ${skipped.length}`);
for (const line of skipped) console.log(`  skip ${line}`);
console.log(`\nCredits: public/insects/credits.json (${Object.keys(credits).length} entries)`);
