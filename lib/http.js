// Small wrapper for Vercel serverless functions: JSON body, query, cookies, errors.
const { sign, verify } = require('./util');
const COOKIE = 'ps_admin';

function parseCookies(h = '') {
  const o = {};
  h.split(';').forEach((p) => { const i = p.indexOf('='); if (i > 0) o[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1).trim()); });
  return o;
}
function readBody(req) {
  return new Promise((resolve) => {
    if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) return resolve(req.body);
    if (typeof req.body === 'string') { try { return resolve(JSON.parse(req.body)); } catch (_) { return resolve({}); } }
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => { try { resolve(JSON.parse(Buffer.concat(chunks).toString() || '{}')); } catch (_) { resolve({}); } });
    req.on('error', () => resolve({}));
  });
}
const secret = () => {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error('JWT_SECRET environment variable is not set.');
  return s;
};

function handler(fn) {
  return async (req, res) => {
    const url = new URL(req.url, 'http://x');
    const ctx = {
      method: req.method,
      query: Object.fromEntries(url.searchParams),
      body: req.method === 'GET' ? {} : await readBody(req),
      respond(data, status = 200) {
        res.statusCode = status;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.setHeader('Cache-Control', 'no-store');
        res.end(JSON.stringify(data));
      },
      isAdmin() {
        const c = parseCookies(req.headers.cookie || '')[COOKIE];
        return !!verify(c, secret());
      },
      setAdmin(on) {
        const secure = process.env.VERCEL ? '; Secure' : '';
        const val = on ? sign({ admin: true }, secret(), 60 * 60 * 24 * 30) : '';
        res.setHeader('Set-Cookie', `${COOKIE}=${encodeURIComponent(val)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${on ? 60 * 60 * 24 * 30 : 0}${secure}`);
      },
    };
    try { await fn(ctx, req, res); }
    catch (e) {
      console.error(e);
      ctx.respond({ success: false, error: 'Server error. Please try again.' }, 500);
    }
  };
}
module.exports = { handler };
