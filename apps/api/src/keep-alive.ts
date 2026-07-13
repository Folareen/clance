import http from 'http';
import https from 'https';

const PING_INTERVAL_MS = 14 * 60 * 1000;

function ping() {
  const selfUrl = process.env.SELF_URL;
  if (!selfUrl) return;

  const url = new URL('/', selfUrl);
  const client = url.protocol === 'https:' ? https : http;

  client
    .get(url.toString(), (res) => {
      console.log(`[keep-alive] ping ${res.statusCode}`);
      res.resume();
    })
    .on('error', (err) => {
      console.error('[keep-alive] ping failed:', err.message);
    });
}

export function startKeepAlive() {
  if (!process.env.SELF_URL) return;
  setInterval(ping, PING_INTERVAL_MS);
}
