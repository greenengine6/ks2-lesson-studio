/**
 * KS2 Lesson Engine inbox (Google Apps Script web app).
 *
 * Teachers' devices post their activity here, locked (encrypted) so that only Rabinder's dashboard can open it.
 * This script cannot read it either: it keeps the locked parts in a Google Sheet in the owner's Drive and hands
 * them to the dashboard when it asks.
 *
 * It is also the school relay for live lessons (pupils joining with the QR code): pupils' devices and the
 * teacher's screen pass locked messages through the script's short-term cache, which forgets them after 6 hours
 * at most. The script cannot read those either.
 *
 * One-time set-up: Deploy > New deployment > Web app. Execute as: Me. Who has access: Anyone. Deploy, allow
 * access, then copy the web app address (it ends in /exec) into the site's config as "inbox".
 * Updating an earlier copy: paste this file over it, then Deploy > Manage deployments > Edit > Version: New version.
 */
var SHEET = 'Inbox';
var MAX = 45000;              // characters per part (a sheet cell holds 50,000)

function book_() {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty('BOOK');
  if (id) {
    try { return SpreadsheetApp.openById(id); } catch (e) { /* the sheet was deleted: make a new one */ }
  }
  var ss = SpreadsheetApp.create('KS2 Lesson Engine inbox (locked activity)');
  props.setProperty('BOOK', ss.getId());
  return ss;
}

function sheet_() {
  var ss = book_();
  var sh = ss.getSheetByName(SHEET);
  if (!sh) { sh = ss.getSheets()[0]; sh.setName(SHEET); }
  if (sh.getLastRow() === 0) {
    sh.appendRow(['Received', 'Locked activity (only the dashboard can open it)']);
    sh.setFrozenRows(1);
  }
  return sh;
}

function out_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

function withLock_(fn) {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) return out_({ ok: false, error: 'busy' });
  try { return fn(); } finally { lock.releaseLock(); }
}

/* ---------------- live lessons: the school relay ---------------- */
var RELAY_TTL = 21600;        // 6 hours, the longest the cache keeps anything
var RELAY_MAX = 4000;         // characters per message (the site sends long messages in parts)
var CH = /^[A-Za-z0-9_-]{6,64}$/;

/* One locked message for a lesson channel; numbered so devices can ask for "everything after n". */
function relayPost_(o) {
  var ch = String(o.ch || ''), m = String(o.m || '');
  if (!CH.test(ch) || !m || m.length > RELAY_MAX) return out_({ ok: false, error: 'format' });
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) return out_({ ok: false, error: 'busy' });
  try {
    var cache = CacheService.getScriptCache();
    var n = Number(cache.get(ch + ':n') || 0) + 1;
    if (n > 4000) return out_({ ok: false, error: 'full' });
    cache.put(ch + ':' + n, m, RELAY_TTL);
    cache.put(ch + ':n', String(n), RELAY_TTL);
    return out_({ ok: true, n: n });
  } finally { lock.releaseLock(); }
}
/* ?relay=ks2-live&ch=…&since=n gives the messages after n (60 at a time); ?relay=ks2-live&ping=1 says it is on. */
function relayGet_(p) {
  if (p.ping) return out_({ ok: true, relay: 1 });
  var ch = String(p.ch || '');
  if (!CH.test(ch)) return out_({ ok: false, error: 'format' });
  var cache = CacheService.getScriptCache();
  var last = Number(cache.get(ch + ':n') || 0), since = Math.max(0, parseInt(p.since, 10) || 0);
  if (since >= last) return out_({ ok: true, msgs: [], last: last });
  var keys = [];
  for (var i = since + 1; i <= last && keys.length < 60; i++) keys.push(ch + ':' + i);
  var got = cache.getAll(keys), msgs = [];
  keys.forEach(function (k) { if (got[k] != null) msgs.push({ n: Number(k.split(':').pop()), m: got[k] }); });
  return out_({ ok: true, msgs: msgs, last: since + keys.length });
}

/* A teacher's device sends one locked part (or a live lesson sends a message). */
function doPost(e) {
  var body = (e && e.postData && e.postData.contents) || '';
  if (!body || body.length > MAX) return out_({ ok: false, error: 'size' });
  var box;
  try { box = JSON.parse(body); } catch (err) { return out_({ ok: false, error: 'format' }); }
  if (box && box.relay === 'ks2-live') return relayPost_(box);
  if (!box || box.kind !== 'ks2-sealed' || typeof box.ct !== 'string' || typeof box.epk !== 'string' || typeof box.iv !== 'string') {
    return out_({ ok: false, error: 'format' });
  }
  return withLock_(function () {
    var sh = sheet_();
    sh.appendRow([new Date(), body]);
    return out_({ ok: true, row: sh.getLastRow() });
  });
}

/* Rabinder's dashboard asks for the parts after the last row it has (?since=row&limit=n), or checks ?ping=1. */
function doGet(e) {
  var p = (e && e.parameter) || {};
  if (p.relay === 'ks2-live') return relayGet_(p);
  return withLock_(function () {
    var sh = sheet_();
    var last = sh.getLastRow();
    if (p.ping) return out_({ ok: true, inbox: 'ks2', v: 1, last: last });
    var since = Math.max(1, parseInt(p.since, 10) || 1);
    var limit = Math.min(60, Math.max(1, parseInt(p.limit, 10) || 40));
    if (since >= last) return out_({ ok: true, rows: [], last: last });
    var n = Math.min(limit, last - since);
    var vals = sh.getRange(since + 1, 1, n, 2).getValues();
    var rows = vals.map(function (r, i) {
      return { row: since + 1 + i, at: r[0] instanceof Date ? r[0].getTime() : 0, box: String(r[1] || '') };
    });
    return out_({ ok: true, rows: rows, last: last });
  });
}

/* Optional: run once from the editor to create the sheet straight away. */
function setup() { sheet_(); }
