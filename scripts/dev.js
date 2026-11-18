// Local test server that mimics Vercel:  node scripts/dev.js  → http://localhost:3000
const fs = require('fs'), path = require('path'), http = require('http');
for (const f of ['.env.local', '.env']) {
  const p = path.join(__dirname, '..', f);
  if (fs.existsSync(p)) for (const line of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}
const root = path.join(__dirname, '..'), pub = path.join(root, 'public');
const MIME = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon' };
http.createServer((req, res) => {
  const u = new URL(req.url, 'http://x');
  if (u.pathname.startsWith('/api/')) {
    try { return require(path.join(root, u.pathname + '.js'))(req, res); }
    catch (e) { console.error(e); res.statusCode = 500; return res.end(String(e)); }
  }
  let p = u.pathname === '/' ? '/index.html' : u.pathname === '/admin' ? '/admin.html' : u.pathname;
  const file = path.join(pub, path.normalize(p));
  if (!file.startsWith(pub) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.statusCode = 404; return res.end('Not found'); }
  res.setHeader('Content-Type', MIME[path.extname(file)] || 'application/octet-stream');
  fs.createReadStream(file).pipe(res);
}).listen(process.env.PORT || 3000, () => console.log('Dev server: http://localhost:' + (process.env.PORT || 3000)));
