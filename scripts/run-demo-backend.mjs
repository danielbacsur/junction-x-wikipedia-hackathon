import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
const children = new Set();
let stopping = false;
function service(name, command, args, options = {}) {
  const child = spawn(command, args, { cwd: process.cwd(), env: { ...process.env, NODE_ENV: 'production' }, stdio: ['ignore', 'pipe', 'pipe'], ...options });
  children.add(child);
  const log = data => {
    const text = data.toString();
    process.stdout.write(`[${name}] ${text}`);
    if (name === 'tunnel') {
      const match = text.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/);
      if (match) writeFileSync('.runtime/backend-url', match[0], { mode: 0o600 });
    }
  };
  child.stdout.on('data', log); child.stderr.on('data', log);
  child.on('exit', code => {
    children.delete(child); console.log(`${name} exited (${code})`);
    if (!stopping) setTimeout(() => service(name, command, args, options), 2000);
  });
}
service('web', process.execPath, [resolve('node_modules/next/dist/bin/next'), 'start', '--hostname', '127.0.0.1', '--port', '3100'], { cwd: resolve('apps/web') });
service('historian', resolve('node_modules/.bin/eve'), ['start', '--port', '3102', '--host', '127.0.0.1'], { cwd: resolve('agents/historian') });
service('gateway', process.execPath, ['scripts/backend-gateway.mjs']);
service('tunnel', '/opt/homebrew/bin/cloudflared', ['tunnel', '--url', 'http://127.0.0.1:3101', '--no-autoupdate']);
service('awake', '/usr/bin/caffeinate', ['-i']);
for (const signal of ['SIGINT','SIGTERM']) process.on(signal, () => {
  stopping = true;
  for (const child of children) child.kill('SIGTERM');
  setTimeout(() => process.exit(0), 1000);
});
