const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { build } = require('./build.cjs');

build();
const root = path.resolve(__dirname, '../dist');
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.csv': 'text/csv' };
const server = http.createServer((request, response) => {
  if (!['GET', 'HEAD'].includes(request.method)) { response.writeHead(405); return response.end(); }
  let pathname;
  try { pathname = decodeURIComponent(new URL(request.url, 'http://127.0.0.1').pathname); }
  catch { response.writeHead(400); return response.end('Invalid URL'); }
  const filename = path.resolve(root, `.${pathname === '/' ? '/index.html' : pathname}`);
  const relative = path.relative(root, filename);
  if (relative.startsWith('..') || path.isAbsolute(relative)) { response.writeHead(403); return response.end(); }
  try {
    const data = fs.readFileSync(filename);
    response.writeHead(200, { 'Content-Type': types[path.extname(filename)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    response.end(request.method === 'HEAD' ? undefined : data);
  } catch { response.writeHead(404); response.end('Not found (Netlify functions are unavailable in this static preview).'); }
});
server.listen(4173, '127.0.0.1', () => console.log('Static preview: http://127.0.0.1:4173 — Ctrl+C to stop. No cloud functions are served.'));
