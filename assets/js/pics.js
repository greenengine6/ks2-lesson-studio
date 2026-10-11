/* Pictures and videos for lessons.
   Pictures: the free lead picture of a Wikipedia article (an exact title, or a search across articles), each with
   the credit its licence asks for; or the teacher's own picture, made smaller here and kept in this browser only
   (IndexedDB), never uploaded. Videos: a YouTube link plays inside the slide through youtube-nocookie.com, YouTube's
   privacy-enhanced player. Every picture a class could see passes a strict word check first (article title,
   description and file name), and the teacher sees it on the slide before presenting.
   What leaves the browser: picture search words go to Wikipedia; video search words go to YouTube only if the school
   has added a YouTube key. */
import { store, CONFIG } from './core.js?v=b8e2dc0e';
import { kvGet, kvSet, kvDel } from './idb.js?v=b8e2dc0e';

const API = 'https://en.wikipedia.org/w/api.php';
const CACHE = 'ks2-engine.pics.v1';
const WIKI_IMG = /^https:\/\/upload\.wikimedia\.org\//;
const STEPS = [330, 500, 960, 1280, 1920];
export const QUALITY = [['960', 'Standard', 'Quick to load'], ['1280', 'Sharp', 'Clearer on a big screen'], ['1920', 'Full HD', 'Best on a projector or large TV'], ['full', 'Original', 'The full-size file']];

/* ---------------- the word check ---------------- */
const WORDS = [
  'sex', 'sexes', 'sexual\\w*', 'sexy', 'porn\\w*', 'erotic\\w*', 'nude', 'nudes', 'nudity', 'nudis\\w*', 'naked', 'topless', 'nipples?', 'breasts?', 'breastfeed\\w*',
  'genital\\w*', 'penis\\w*', 'phall\\w*', 'vagina\\w*', 'vulva\\w*', 'testic\\w*', 'scrot\\w*', 'buttocks?', 'anus', 'anal', 'fetish\\w*', 'bdsm', 'bondage',
  'prostitut\\w*', 'brothels?', 'strippers?', 'striptease', 'lingerie', 'underwear', 'bikinis?', 'condoms?', 'contracept\\w*', 'masturbat\\w*', 'intercourse',
  'orgasm\\w*', 'coitus', 'rape', 'raped', 'rapes', 'rapist\\w*', 'incest\\w*', 'paedophil\\w*', 'pedophil\\w*', 'molest\\w*', 'hentai', 'playboy',
  'gore', 'gory', 'corpses?', 'cadavers?', 'carcass\\w*', 'autops\\w*', 'decapitat\\w*', 'behead\\w*', 'dismember\\w*', 'mutilat\\w*', 'lynch\\w*', 'executions?',
  'executed', 'hanged', 'gallows', 'guillotin\\w*', 'massacres?', 'genocid\\w*', 'holocaust', 'atrocit\\w*', 'tortur\\w*', 'murder\\w*', 'suicid\\w*',
  'self[- ]harm', 'terroris\\w*', 'mass shooting\\w*', 'school shooting\\w*', 'stampedes?', 'crowd crush\\w*', 'war crimes?', 'dead bod(?:y|ies)', 'death camps?',
  'concentration camps?', 'electric chair', 'firing squad', 'roadkill', 'cocaine', 'heroin', 'methamphetamine', 'cannabis', 'marijuana', 'opium', 'narcotics?',
  'swastikas?', 'nazis?', 'nazism', 'ku klux', 'kkk', 'hitler', 'white supremac\\w*'
];
const BAD = new RegExp('\\b(?:' + WORDS.join('|') + ')\\b', 'i');
const BAD_PAGE = /^(?:human (?:body|anatomy|reproduction|sexuality)|puberty|childbirth|nudity|sexual reproduction|reproductive system)$/i;
export const okText = (t) => !BAD.test(String(t || '').replace(/[_]+/g, ' ').replace(/\.(?:jpe?g|png|gif|svg|tiff?|webp)$/i, ''));

/* ---------------- a small cache in this browser (saves asking Wikipedia twice) ---------------- */
const flight = new Map();
function readCache() { const v = store.getJSON(CACHE, {}); return v && typeof v === 'object' && !Array.isArray(v) ? v : {}; }
function cached(key, make) {
  const c = readCache()[key], fresh = c && Date.now() - c[0] < (c[1] ? 21 : 3) * 864e5;
  if (fresh) return Promise.resolve(c[1] || null);
  if (flight.has(key)) return flight.get(key);
  const job = make().then((v) => {
    const all = readCache();
    all[key] = [Date.now(), v || 0];
    const keys = Object.keys(all);
    if (keys.length > 220) keys.sort((a, b) => all[a][0] - all[b][0]).slice(0, keys.length - 200).forEach((k) => delete all[k]);
    store.setJSON(CACHE, all);
    return v || null;
  }).finally(() => flight.delete(key));
  flight.set(key, job);
  return job;
}

/* ---------------- Wikipedia ---------------- */
async function api(params) {
  const u = new URL(API), all = Object.assign({ action: 'query', format: 'json', formatversion: '2', origin: '*', maxage: '86400', smaxage: '86400' }, params);
  Object.keys(all).forEach((k) => u.searchParams.set(k, all[k]));
  const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), 9000);
  try {
    const r = await fetch(u.href, { signal: ctl.signal, credentials: 'omit', referrerPolicy: 'no-referrer' });
    if (!r.ok) throw new Error('http ' + r.status);
    return await r.json();
  } finally { clearTimeout(t); }
}
const PAGE_IMAGES = { prop: 'pageimages|description', piprop: 'thumbnail|name|original', pilimit: '50' };
function fromPage(pg) {
  if (!pg || !pg.thumbnail || !pg.pageimage || pg.missing) return null;
  if (BAD_PAGE.test(pg.title || '') || !okText(pg.title) || !okText(pg.description) || !okText(pg.pageimage)) return null;
  const t = pg.thumbnail, o = pg.original || {}, ow = Number(o.width || t.width) || 0, oh = Number(o.height || t.height) || 0;
  if (!WIKI_IMG.test(t.source || '') || ow < 240 || oh < 120) return null;
  if (ow / oh > 4 || oh / ow > 3) return null;                     // banners and very tall strips do not suit a slide
  return { t: t.source, o: WIKI_IMG.test(o.source || '') ? o.source : t.source, ow, oh, file: String(pg.pageimage), page: String(pg.title || ''), alt: String(pg.title || ''), desc: String(pg.description || '').slice(0, 140) };
}
const clean = (q) => String(q || '').replace(/[\u0000-\u001f]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 120);
/* The lead picture of one article (redirects followed). Null when the article has no free picture. */
export function leadPicture(title) {
  title = clean(title);
  if (!title || !okText(title)) return Promise.resolve(null);
  return cached('t:' + title.toLowerCase(), async () => {
    const j = await api(Object.assign({ titles: title, redirects: '1', pithumbsize: '960' }, PAGE_IMAGES));
    const pages = (j && j.query && j.query.pages) || [];
    return fromPage(pages[0]);
  });
}
/* Pictures from a search across Wikipedia articles, best match first. Throws when Wikipedia cannot be reached. */
export async function searchPictures(q, n) {
  q = clean(q);
  if (!q || !okText(q)) return [];
  const j = await api(Object.assign({ generator: 'search', gsrsearch: q, gsrnamespace: '0', gsrlimit: String(n || 16), pithumbsize: '500' }, PAGE_IMAGES));
  const pages = ((j && j.query && j.query.pages) || []).slice().sort((a, b) => (a.index || 99) - (b.index || 99));
  const seen = new Set(), out = [];
  pages.forEach((pg) => { const p = fromPage(pg); if (p && !seen.has(p.file)) { seen.add(p.file); out.push(p); } });
  return out;
}
const plain = (h) => {
  if (!h) return '';
  try { return (new DOMParser().parseFromString(String(h), 'text/html').body.textContent || '').replace(/\s+/g, ' ').trim(); } catch (e) { return String(h).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim(); }
};
/* Who made the picture and its licence (Wikimedia Commons asks for both). Fills pic.by, pic.lic and pic.url. */
export async function creditFor(pic) {
  if (!pic || pic.up || !pic.file) return pic;
  const c = await cached('c:' + pic.file, async () => {
    const j = await api({ titles: 'File:' + pic.file, prop: 'imageinfo', iiprop: 'extmetadata|url', iiextmetadatafilter: 'Artist|LicenseShortName' });
    const pg = j && j.query && j.query.pages && j.query.pages[0], ii = pg && pg.imageinfo && pg.imageinfo[0];
    if (!ii) return null;
    const m = ii.extmetadata || {}, url = String(ii.descriptionurl || '');
    return { by: plain(m.Artist && m.Artist.value).slice(0, 90), lic: plain(m.LicenseShortName && m.LicenseShortName.value).slice(0, 40), url: /^https:\/\/(?:commons\.wikimedia|en\.wikipedia)\.org\//.test(url) ? url : '' };
  }).catch(() => null);
  if (c) Object.assign(pic, { by: c.by || '', lic: c.lic || '', url: c.url || '' });
  return pic;
}
/* One picture for a slide: the article the engine named, then its search words, then a wider search. */
export async function findPicture(o) {
  const avoid = o.avoid || new Set();
  if (o.wiki) { const p = await leadPicture(o.wiki).catch(() => null); if (p && !avoid.has(p.file)) return p; }
  for (const q of [o.terms, o.also].filter(Boolean)) {
    const list = await searchPictures(q, 8).catch(() => []);
    const p = list.find((x) => !avoid.has(x.file));
    if (p) return p;
  }
  return null;
}
/* A cover for a saved lesson on the dashboard: the best Wikipedia picture for its topic. */
export function coverFor(topic) {
  const q = clean(String(topic || '').replace(/^MOCK\s+/, ''));
  if (!q) return Promise.resolve(null);
  return cached('k:' + q.toLowerCase(), async () => (await searchPictures(q, 6))[0] || null).catch(() => null);
}

/* ---------------- the address of a picture at the chosen quality ---------------- */
const ups = new Map();                     // upload id → object URL for this visit
export function picURL(pic, size) {
  if (!pic) return '';
  if (pic.up) return ups.get(pic.up) || '';
  if (!WIKI_IMG.test(pic.t || '') && !WIKI_IMG.test(pic.o || '')) return '';
  const want = String(size || pic.size || '960') === 'full' ? 0 : Number(size || pic.size || 960) || 960;
  const vector = /\.svg$/i.test(pic.o || ''), raster = /\.(?:jpe?g|png|gif|webp)$/i.test(pic.o || '');
  if (raster && WIKI_IMG.test(pic.o) && (!want || pic.ow <= want)) return pic.o;
  const m = /^(https:\/\/upload\.wikimedia\.org\/.+\/thumb\/.+\/)((?:lossy-)?(?:page\d+-)?)(\d+)px-([^/]+)$/.exec(pic.t || '');
  if (!m) return WIKI_IMG.test(pic.t || '') ? pic.t : pic.o;
  const w = want || 1920;
  const step = vector ? w : (STEPS.filter((s) => s <= w && s < pic.ow).pop() || Number(m[3]));
  return m[1] + m[2] + step + 'px-' + m[4];
}
export function creditText(pic, short) {
  if (!pic) return '';
  if (pic.up) return short ? '' : 'Your own picture';
  const who = pic.by || 'Wikimedia Commons';
  return short ? who + (pic.lic ? ' · ' + pic.lic : '') : 'Picture: ' + who + (pic.lic ? ', ' + pic.lic : '') + ', via Wikimedia Commons' + (pic.url ? ' (' + pic.url + ')' : '');
}
/* Only the fields a saved pack needs (no search extras). */
export function keepPic(p, extra) {
  if (!p) return null;
  const o = p.up ? { up: String(p.up), ow: p.ow, oh: p.oh, alt: p.alt || '' } : { t: p.t, o: p.o, ow: p.ow, oh: p.oh, file: p.file, page: p.page, alt: p.alt || p.page || '', by: p.by || '', lic: p.lic || '', url: p.url || '' };
  return Object.assign(o, { size: QUALITY.some((q) => q[0] === String(p.size)) ? String(p.size) : '960', fit: p.fit === 'contain' ? 'contain' : 'cover' }, extra || {});
}
export function safePic(p) {
  if (!p || typeof p !== 'object') return null;
  if (p.up) return /^u[a-z0-9]{6,24}$/.test(String(p.up)) ? p : null;
  return WIKI_IMG.test(String(p.t || '')) || WIKI_IMG.test(String(p.o || '')) ? p : null;
}

/* ---------------- the teacher's own pictures (this browser only) ---------------- */
async function bitmapOf(blob) {
  if (typeof createImageBitmap === 'function') { try { return await createImageBitmap(blob); } catch (e) { /* try the slow way */ } }
  return new Promise((res, rej) => {
    const u = URL.createObjectURL(blob), img = new Image();
    img.onload = () => { res(img); setTimeout(() => URL.revokeObjectURL(u), 1000); };
    img.onerror = () => { URL.revokeObjectURL(u); rej(new Error('bad image')); };
    img.src = u;
  });
}
const sizeOf = (b) => [b.naturalWidth || b.width, b.naturalHeight || b.height];
export async function savePicture(file) {
  const kind = file && (file.type || (/\.(png|jpe?g|gif|webp|bmp|avif|heic|heif)$/i.exec(file.name || '') || [])[1] || '');
  if (!file || !/^(?:image\/)?(?:png|jpe?g|gif|webp|bmp|avif|heic|heif)$/i.test(kind)) throw new Error('not-image');
  if (file.size > 30e6) throw new Error('too-big');
  const bmp = await bitmapOf(file), [w0, h0] = sizeOf(bmp);
  if (!w0 || !h0) throw new Error('not-image');
  const k = Math.min(1, 1920 / w0, 1920 / h0), w = Math.max(1, Math.round(w0 * k)), h = Math.max(1, Math.round(h0 * k));
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d'); g.fillStyle = '#FFFFFF'; g.fillRect(0, 0, w, h); g.drawImage(bmp, 0, 0, w, h);
  const blob = await new Promise((res) => c.toBlob(res, 'image/jpeg', 0.86));
  if (!blob) throw new Error('not-image');
  const id = 'u' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  if (!(await kvSet('pic:' + id, blob))) throw new Error('no-space');
  ups.set(id, URL.createObjectURL(blob));
  const name = String(file.name || '').replace(/\.[a-z0-9]+$/i, '').replace(/[_-]+/g, ' ').trim().slice(0, 60);
  return { up: id, ow: w, oh: h, alt: name || 'Your picture', size: '1280', fit: 'cover' };
}
export async function loadUpload(id) {
  if (ups.has(id)) return ups.get(id);
  const b = await kvGet('pic:' + id).catch(() => null);
  if (!(b instanceof Blob)) return '';
  const u = URL.createObjectURL(b);
  ups.set(id, u);
  return u;
}
export function forgetUploads(ids) { (ids || []).forEach((id) => { kvDel('pic:' + id); const u = ups.get(id); if (u) { URL.revokeObjectURL(u); ups.delete(id); } }); }
/* Uploaded pictures are drawn as <img data-up="…"> and filled in here, once the browser has them. */
export function hydrate(root) {
  if (!root || !root.querySelectorAll) return;
  root.querySelectorAll('img[data-up]').forEach((img) => {
    if (img.getAttribute('src')) return;
    loadUpload(img.dataset.up).then((u) => {
      if (u) img.src = u;
      else { const f = img.closest('.lk-pic,.lk-bg,.sh-cover,.lk-now figure'); if (f) f.classList.add('gone'); }
    });
  });
}
/* A picture as a JPEG data URL for the PowerPoint, cut to the box (cover) or whole (contain). Null if not possible. */
export async function pictureData(pic, o) {
  try {
    if (pic.up) return await blobData(await kvGet('pic:' + pic.up), o);
    const size = String(pic.size) === 'full' ? '1920' : pic.size || '960';
    return await urlData(picURL(pic, size), o);
  } catch (e) { return null; }
}
export async function urlData(url, o) {
  try {
    if (!url) return null;
    const r = await fetch(url, { credentials: 'omit', referrerPolicy: 'no-referrer', mode: 'cors' });
    return r.ok ? await blobData(await r.blob(), o) : null;
  } catch (e) { return null; }
}
async function blobData(blob, o) {
  o = o || {};
  try {
    if (!(blob instanceof Blob)) return null;
    const bmp = await bitmapOf(blob), [bw, bh] = sizeOf(bmp);
    let sx = 0, sy = 0, sw = bw, sh = bh;
    if (o.cover && o.aspect) { if (bw / bh > o.aspect) { sw = bh * o.aspect; sx = (bw - sw) / 2; } else { sh = bw / o.aspect; sy = (bh - sh) / 2; } }
    const k = Math.min(1, (o.max || 1600) / sw), c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(sw * k)); c.height = Math.max(1, Math.round(sh * k));
    const g = c.getContext('2d'); g.fillStyle = '#FFFFFF'; g.fillRect(0, 0, c.width, c.height);
    g.drawImage(bmp, sx, sy, sw, sh, 0, 0, c.width, c.height);
    if (o.scrim) { g.fillStyle = o.scrim; g.fillRect(0, 0, c.width, c.height); }
    return { data: c.toDataURL('image/jpeg', 0.86), w: c.width, h: c.height };
  } catch (e) { return null; }
}

/* ---------------- YouTube ---------------- */
export function seconds(t) {
  t = String(t || '').trim().toLowerCase();
  if (!t) return 0;
  if (/^\d+s?$/.test(t)) return parseInt(t, 10);
  let m = /^(?:(\d+):)?(\d{1,2}):(\d{2})$/.exec(t);
  if (m) return Number(m[1] || 0) * 3600 + Number(m[2]) * 60 + Number(m[3]);
  m = /^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/.exec(t);
  return m && (m[1] || m[2] || m[3]) ? Number(m[1] || 0) * 3600 + Number(m[2] || 0) * 60 + Number(m[3] || 0) : 0;
}
export const mmss = (s) => Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
const YT_ID = /^[A-Za-z0-9_-]{11}$/;
/* A YouTube link (watch, youtu.be, shorts, embed or live) → { id, start }. Null if it is not one. */
export function youTube(text) {
  const s = String(text || '').trim();
  if (YT_ID.test(s)) return { id: s, start: 0 };
  let id = '', start = 0;
  try {
    const u = new URL(/^https?:\/\//i.test(s) ? s : 'https://' + s), h = u.hostname.toLowerCase().replace(/^(?:www|m|music)\./, '');
    if (h === 'youtu.be') id = u.pathname.slice(1).split('/')[0];
    else if (h === 'youtube.com' || h === 'youtube-nocookie.com') {
      if (u.pathname === '/watch') id = u.searchParams.get('v') || '';
      else { const m = /^\/(?:embed|shorts|live|v)\/([^/?#]+)/.exec(u.pathname); if (m) id = m[1]; }
    }
    start = seconds(u.searchParams.get('t') || u.searchParams.get('start') || '');
  } catch (e) { return null; }
  return YT_ID.test(id) ? { id, start } : null;
}
export const safeVideo = (v) => (v && typeof v === 'object' && YT_ID.test(String(v.id || '')) ? v : null);
export const ytThumb = (id) => 'https://i.ytimg.com/vi/' + id + '/hqdefault.jpg';
export const ytWatch = (v) => 'https://www.youtube.com/watch?v=' + v.id + (v.start ? '&t=' + v.start + 's' : '');
/* The same video as a link with no "&" in it (PowerPoint's picture links need that). */
export const ytShort = (v) => 'https://youtu.be/' + v.id + (v.start ? '?t=' + v.start : '');
export const ytEmbed = (v) => 'https://www.youtube-nocookie.com/embed/' + v.id + '?autoplay=1&rel=0&modestbranding=1&playsinline=1&iv_load_policy=3' + (v.start ? '&start=' + v.start : '');
/* A YouTube search in a new tab: short videos only (under 4 minutes), worded for children. */
export function ytFind(terms) {
  const q = clean(terms) || 'KS2 lesson';
  return 'https://www.youtube.com/results?search_query=' + encodeURIComponent(/\b(?:kids?|child(?:ren)?|ks2|primary|for school)\b/i.test(q) ? q : q + ' for kids') + '&sp=EgIYAQ%253D%253D';
}
export const ytKey = () => (typeof CONFIG.youtubeKey === 'string' && /^[A-Za-z0-9_-]{30,60}$/.test(CONFIG.youtubeKey) ? CONFIG.youtubeKey : '');
/* In-app video search, only when the school has added a YouTube key to the site settings (index.html). */
export async function ytSearch(q) {
  const key = ytKey();
  q = clean(q);
  if (!key || !q || !okText(q)) return [];
  const u = new URL('https://www.googleapis.com/youtube/v3/search'), p = { part: 'snippet', type: 'video', videoEmbeddable: 'true', safeSearch: 'strict', maxResults: '12', relevanceLanguage: 'en', regionCode: 'GB', q, key };
  Object.keys(p).forEach((k) => u.searchParams.set(k, p[k]));
  const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), 9000);
  try {
    const r = await fetch(u.href, { signal: ctl.signal, credentials: 'omit', referrerPolicy: 'strict-origin-when-cross-origin' });
    if (!r.ok) throw new Error('http ' + r.status);
    const j = await r.json();
    return (j.items || []).map((it) => ({ id: it && it.id && it.id.videoId, title: plain(it && it.snippet && it.snippet.title).slice(0, 90), ch: plain(it && it.snippet && it.snippet.channelTitle).slice(0, 60) }))
      .filter((v) => YT_ID.test(String(v.id || '')) && okText(v.title) && okText(v.ch));
  } finally { clearTimeout(t); }
}
