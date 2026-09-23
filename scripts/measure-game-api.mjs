import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

// Explicit, bounded synthetic writes. No payment provider or visitor credentials.
const [api, rateText = '80', durationText = '15', output = 'artifacts/live-api.json'] =
  process.argv.slice(2);
const rate = Number(rateText),
  durationSeconds = Number(durationText);
if (
  !['https://api.megamashgin.top', 'http://127.0.0.1:8090'].includes(api) ||
  !Number.isInteger(rate) ||
  rate < 1 ||
  rate > 1280 ||
  !Number.isInteger(durationSeconds) ||
  durationSeconds < 1 ||
  durationSeconds > 60
)
  throw Error(
    'Usage: node scripts/measure-game-api.mjs <allowed-api> <1..1280 purchases/min> <1..60 seconds> <output.json>',
  );
const origin = 'https://game.megamashgin.top';
const startedAt = new Date().toISOString();
const headers = { origin, 'sec-fetch-site': 'cross-site', 'content-type': 'application/json' };
const statuses = {},
  replicas = {},
  receipts = [],
  errors = [],
  lags = [],
  durations = [];
const requestCounts = { menu: 0, sessions: 0, orders: 0, readbacks: 0 };
const sessions = [];
async function request(path, options = {}) {
  const response = await fetch(api + path, {
    ...options,
    signal: AbortSignal.timeout(10000),
    headers: { ...headers, ...options.headers },
  });
  const replica = response.headers.get('x-instance-id');
  if (replica) replicas[replica] = (replicas[replica] ?? 0) + 1;
  const key = `${options.method ?? 'GET'} ${path.replace(/\/orders\/.+/, '/orders/:id')} ${response.status}`;
  statuses[key] = (statuses[key] ?? 0) + 1;
  const body = await response.json();
  if (!response.ok) throw Error(`${path}: HTTP ${response.status} ${body.error?.code ?? ''}`);
  return { response, body };
}
requestCounts.menu++;
const { body: menu } = await request('/api/menu');
const product = menu.products.find((p) => p.available);
const target = Math.ceil((rate * durationSeconds) / 60),
  concurrency = 32;
let dropped = 0,
  launched = 0,
  completed = 0,
  offered = 0,
  stopReason = null;
const inflight = new Set();
async function purchase() {
  const started = performance.now();
  try {
    requestCounts.sessions++;
    const { body: session } = await request('/api/sessions', { method: 'POST', body: '{}' });
    requestCounts.orders++;
    const { response, body: receipt } = await request('/api/orders', {
      method: 'POST',
      headers: { authorization: 'Bearer ' + session.token, 'idempotency-key': randomUUID() },
      body: JSON.stringify({
        items: [{ productId: product.id, quantity: 1 }],
        menuRevision: menu.revision,
        payment: { method: 'demo-card' },
      }),
    });
    if (
      response.status !== 201 ||
      receipt.status !== 'confirmed' ||
      receipt.totalCents !== product.priceCents ||
      receipt.items.length !== 1 ||
      receipt.items[0].productId !== product.id ||
      receipt.items[0].quantity !== 1 ||
      receipt.items[0].unitPriceCents !== product.priceCents ||
      receipt.items[0].lineTotalCents !== product.priceCents
    )
      throw Error('Invalid receipt');
    receipts.push({ id: receipt.id, totalCents: receipt.totalCents });
    sessions.push({ token: session.token, receipt }); // Credentials stay in memory only.
    durations.push(performance.now() - started);
  } catch (error) {
    errors.push(String(error.message));
    if (errors.length >= 5)
      stopReason = 'Five errors: stopped new arrivals to protect the shared demo';
  } finally {
    completed++;
  }
}
const started = performance.now();
for (let i = 0; i < target; i++) {
  if (stopReason) break;
  const scheduled = started + (i * 60000) / rate;
  const delay = scheduled - performance.now();
  if (delay > 0) await new Promise((r) => setTimeout(r, delay));
  const lag = performance.now() - scheduled;
  if (lag > 1000) {
    stopReason = 'Scheduler fell more than one second behind';
    break;
  }
  lags.push(lag);
  offered++;
  if (inflight.size >= concurrency) {
    dropped++;
    continue;
  }
  launched++;
  const task = purchase().finally(() => inflight.delete(task));
  inflight.add(task);
}
await Promise.all(inflight);
// Keep the full offering window in the measured denominator, even at low rates.
const remaining = durationSeconds * 1000 - (performance.now() - started);
if (remaining > 0) await new Promise((r) => setTimeout(r, remaining));
const elapsedMs = performance.now() - started;
let readbackMatches = 0;
const readbackStarted = performance.now();
// Read after the write window: verify every receipt through a new HTTP request.
let cursor = 0;
await Promise.all(
  Array.from({ length: 8 }, async () => {
    while (cursor < sessions.length) {
      const entry = sessions[cursor++];
      try {
        requestCounts.readbacks++;
        const { body } = await request('/api/orders/' + entry.receipt.id, {
          headers: { authorization: 'Bearer ' + entry.token },
        });
        if (JSON.stringify(body) !== JSON.stringify(entry.receipt))
          throw Error('Readback mismatch: ' + entry.receipt.id);
        readbackMatches++;
      } catch (error) {
        errors.push(String(error.message));
      }
    }
  }),
);
const percentile = (list, p) =>
  list.length ? [...list].sort((a, b) => a - b)[Math.ceil(list.length * p) - 1] : null;
const unique = new Set(receipts.map((r) => r.id)).size;
const result = {
  schema: 'bounded-game-api/v1',
  startedAt,
  finishedAt: new Date().toISOString(),
  api,
  origin,
  ratePerMinute: rate,
  durationSeconds,
  concurrency,
  target,
  offered,
  launched,
  completed,
  successful: receipts.length,
  dropped,
  stopReason,
  errors,
  uniqueReceiptIds: unique,
  readbackMatches,
  requestCounts,
  statuses,
  replicas,
  p50Ms: percentile(durations, 0.5),
  p95Ms: percentile(durations, 0.95),
  p99Ms: percentile(durations, 0.99),
  maxMs: percentile(durations, 1),
  schedulerLagP95Ms: percentile(lags, 0.95),
  elapsedMs,
  achievedPurchasesPerMinute: (receipts.length / elapsedMs) * 60000,
  writeRequestsPerSecond: ((requestCounts.sessions + requestCounts.orders) / elapsedMs) * 1000,
  readbackDurationMs: performance.now() - readbackStarted,
  latencyScope: 'successful session POST + order POST; excludes later readback',
  expectedProductId: product.id,
  expectedTotalCents: product.priceCents,
  receiptIds: receipts.map((r) => r.id),
  ok:
    receipts.length === target &&
    readbackMatches === target &&
    unique === target &&
    !errors.length &&
    !dropped,
  limits:
    'Short synthetic single-client scheduled-arrival measurement. Not the animated game, maximum capacity, sustained production traffic, or high availability. No authorization tokens retained.',
};
await mkdir(dirname(output), { recursive: true });
await writeFile(output, JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify({ ...result, receiptIds: undefined }));
if (!result.ok) process.exitCode = 1;
