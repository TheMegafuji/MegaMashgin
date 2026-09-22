import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { fingerprint } from './fingerprint.mjs';
const base = process.env.BASE_URL ?? 'http://127.0.0.1:8090';
const parsed = new URL(base);
if (!['127.0.0.1', 'localhost'].includes(parsed.hostname))
  throw Error(
    'This check is limited to the local demo. Use the documented manual walkthrough for remote review.',
  );
const startedAt = new Date().toISOString();
const observations = [];
async function call(path, method = 'GET', body, token, key) {
  const res = await fetch(base + path, {
    method,
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: 'Bearer ' + token } : {}),
      ...(key ? { 'idempotency-key': key } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
    signal: AbortSignal.timeout(10000),
  });
  const data = res.status === 204 ? null : await res.json();
  observations.push({
    path,
    method,
    status: res.status,
    instance: res.headers.get('x-instance-id'),
    requestId: res.headers.get('x-request-id'),
  });
  return { status: res.status, data };
}
assert.equal((await call('/health/ready')).status, 200);
const menu = (await call('/api/menu')).data;
const session = (await call('/api/sessions', 'POST', {})).data;
const key = crypto.randomUUID();
const body = {
  items: [{ productId: 'pesto-focaccia', quantity: 2 }],
  payment: { method: 'demo-card' },
  menuRevision: menu.revision,
};
const results = await Promise.all(
  Array.from({ length: 20 }, () => call('/api/orders', 'POST', body, session.token, key)),
);
assert.equal(results.filter((r) => r.status === 201).length, 1);
assert.equal(results.filter((r) => r.status === 200).length, 19);
assert.equal(new Set(results.map((r) => r.data.id)).size, 1);
const instances = [
  ...new Set(observations.filter((o) => o.path === '/api/orders').map((o) => o.instance)),
];
assert.equal(instances.length, 2, 'Both independent API containers must respond.');
const receipt = results[0].data;
assert.equal(
  (await call('/api/orders/' + receipt.id, 'GET', undefined, session.token)).data.totalCents,
  1700,
);
assert.equal(
  (
    await call(
      '/api/orders',
      'POST',
      { ...body, payment: { method: 'demo-cash' } },
      session.token,
      key,
    )
  ).status,
  409,
);
let restartVerified = false;
if (process.argv.includes('--restart')) {
  const result = spawnSync('docker', ['compose', 'restart', 'api1', 'api2'], { stdio: 'inherit' });
  assert.equal(result.status, 0);
  for (let attempt = 0; attempt < 20; attempt++) {
    try {
      const res = await fetch(base + '/health/ready', { signal: AbortSignal.timeout(1500) });
      if (res.ok) break;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  const replay = await call('/api/orders', 'POST', body, session.token, key);
  assert.equal(replay.status, 200);
  assert.equal(replay.data.id, receipt.id);
  restartVerified = true;
}
await mkdir('artifacts', { recursive: true });
const report = {
  startedAt,
  finishedAt: new Date().toISOString(),
  base,
  sourceFingerprint: await fingerprint(),
  ok: true,
  concurrentAttempts: 20,
  created: 1,
  replayed: 19,
  orderId: receipt.id,
  instances,
  restartVerified,
  observations,
  note: 'Bounded correctness demonstration, not a capacity benchmark. Tokens are intentionally excluded.',
};
await writeFile('artifacts/compose-check.json', JSON.stringify(report, null, 2) + '\n');
console.log(
  'PASS: 20 concurrent attempts, one order, both API containers' +
    (restartVerified ? ', durable receipt after restart.' : '.'),
);
