const crypto = require('crypto');

const YMD = /^\d{4}-\d{2}-\d{2}$/;
const isYmd = (s) => typeof s === 'string' && YMD.test(s) && !Number.isNaN(Date.parse(s + 'T00:00:00Z'));

// "today" in the Philippines (UTC+8), as YYYY-MM-DD
function todayManila() {
  return new Date(Date.now() + 8 * 3600 * 1000).toISOString().slice(0, 10);
}
function addDays(ymd, n) {
  const d = new Date(ymd + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
function datesBetween(from, days) {
  return Array.from({ length: days }, (_, i) => addDays(from, i));
}

// Booking reference like PS-7K3Q9X (no confusing characters)
function makeRef() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (const b of crypto.randomBytes(6)) s += chars[b % chars.length];
  return 'PS-' + s;
}

const str = (v, max = 200) => (v == null ? '' : String(v).trim().slice(0, max));
const normPhone = (p) => str(p, 30).replace(/[^\d+]/g, '');

// ── tiny signed-token helpers for the admin session (no extra dependency) ──
const b64 = (b) => Buffer.from(b).toString('base64url');
function sign(payload, secret, ttlSec) {
  const body = b64(JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + ttlSec }));
  const sig = crypto.createHmac('sha256', secret).update(body).digest('base64url');
  return body + '.' + sig;
}
function verify(token, secret) {
  if (!token || token.indexOf('.') < 0) return null;
  const [body, sig] = token.split('.');
  const good = crypto.createHmac('sha256', secret).update(body).digest('base64url');
  const a = Buffer.from(sig), b = Buffer.from(good);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const p = JSON.parse(Buffer.from(body, 'base64url').toString());
    return p.exp > Date.now() / 1000 ? p : null;
  } catch (_) { return null; }
}

module.exports = { isYmd, todayManila, addDays, datesBetween, makeRef, str, normPhone, sign, verify };
