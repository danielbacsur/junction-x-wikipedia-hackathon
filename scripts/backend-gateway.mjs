import http from 'node:http';
import { timingSafeEqual } from 'node:crypto';
const secret = process.env.BACKEND_TOKEN;
if (!secret || secret.length < 32) throw new Error('BACKEND_TOKEN must be configured');
const authorized = value => typeof value === 'string' && Buffer.byteLength(value) === Buffer.byteLength(secret) && timingSafeEqual(Buffer.from(value), Buffer.from(secret));
http.createServer((req, res) => {
  if (!authorized(req.headers['x-backend-token'])) { res.writeHead(401); res.end('Unauthorized'); return; }
  const pathname = new URL(req.url, 'http://localhost').pathname;
  const agent = pathname.startsWith('/eve/historian/v1/');
  if (!(agent || pathname.startsWith('/api/') || pathname === '/mcp')) { res.writeHead(404); res.end(); return; }
  const headers = { ...req.headers, host: agent ? '127.0.0.1:3102' : '127.0.0.1:3100' };
  if (!agent) delete headers['x-backend-token'];
  delete headers['accept-encoding'];
  const upstream = http.request({ hostname: '127.0.0.1', port: agent ? 3102 : 3100,
    path: agent ? req.url.replace('/eve/historian/v1/', '/eve/v1/') : req.url,
    method: req.method, headers }, response => {
      res.writeHead(response.statusCode ?? 502, response.headers);
      response.pipe(res);
    });
  upstream.on('error', error => { console.error(error.message); if (!res.headersSent) res.writeHead(502); res.end('Backend unavailable'); });
  req.on('aborted', () => upstream.destroy());
  res.on('close', () => upstream.destroy());
  req.pipe(upstream);
}).listen(3101, '127.0.0.1', () => console.log('Authenticated backend gateway listening on 3101'));
