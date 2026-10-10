/**
 * KS2 Lesson Engine inbox (Google Apps Script web app).
 *
 * Teachers' devices post their activity here, locked (encrypted) so that only Rabinder's dashboard can open it.
 * This script cannot read it either: it keeps the locked parts in a Google Sheet in the owner's Drive and hands
 * them to the dashboard when it asks.
 *
 * One-time set-up: Deploy > New deployment > Web app. Execute as: Me. Who has access: Anyone. Deploy, allow
 * access, then copy the web app address (it ends in /exec) into the site's config as "inbox".
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

/* A teacher's device sends one locked part. */
function doPost(e) {
  var body = (e && e.postData && e.postData.contents) || '';
  if (!body || body.length > MAX) return out_({ ok: false, error: 'size' });
  var box;
  try { box = JSON.parse(body); } catch (err) { return out_({ ok: false, error: 'format' }); }
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
