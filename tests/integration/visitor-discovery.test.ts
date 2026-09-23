import { beforeAll, beforeEach, afterAll, it, expect } from 'vitest';
import { randomUUID } from 'node:crypto';
import { buildApp } from '../../src/server/app.js';
import { createPool } from '../../src/server/infrastructure/database.js';
import { migrate } from '../../src/server/migrate.js';
import { testDatabaseUrl } from '../helpers.js';
import { tokenHash } from '../../src/server/modules/sessions/sessions.js';
import { JevHttpError, type JevProvider } from '../../src/server/modules/discovery/jev.js';
import type { Menu } from '../../src/shared/contracts.js';

const pool = createPool(testDatabaseUrl());
let calls = 0,
  mode: 'ok' | 'error' | 'invalid' | 'slow' | 'auth' = 'ok';
let unblock: (() => void) | undefined;
const provider: JevProvider = async (_request, signal) => {
  calls++;
  if (mode === 'slow')
    await new Promise<void>((resolve, reject) => {
      unblock = resolve;
      signal.addEventListener('abort', () => reject(signal.reason), { once: true });
    });
  if (mode === 'auth') throw new JevHttpError(401);
  if (mode === 'error') throw new Error('Provider unavailable');
  if (mode === 'invalid') return { answers: { ranking: { choice: 'made-up-product' } } };
  return {
    model: 'jev-1.13.0',
    answers: {
      ranking: {
        type: 'choice',
        choice: 'sea-salt-chips',
        confidence: 0.9,
        probabilities: { 'sea-salt-chips': 0.97, none: 0.03 },
      },
      exists: { type: 'noul', noul: 0.98 },
    },
    usage: { input_tokens: 1500, output_tokens: 42 },
  };
};
const appA = await buildApp({
  pool,
  instanceId: 'visitor-a',
  sessionLimit: 1000,
  discovery: { provider, timeoutMs: 200, maxCallsPerDay: 2 },
});
const appB = await buildApp({
  pool,
  instanceId: 'visitor-b',
  sessionLimit: 1000,
  discovery: { provider, timeoutMs: 200, maxCallsPerDay: 2 },
});
const offline = await buildApp({ pool, sessionLimit: 1000 });
let menu: Menu;
beforeAll(async () => {
  await migrate(pool);
});
beforeEach(async () => {
  await pool.query(
    'TRUNCATE orders,customer_sessions,visitors,admission,discovery_cache,discovery_usage CASCADE',
  );
  calls = 0;
  mode = 'ok';
  unblock = undefined;
  menu = (await appA.inject({ url: '/api/menu' })).json();
});
afterAll(async () => {
  await Promise.all([appA.close(), appB.close(), offline.close()]);
  await pool.end();
});
async function visitor(app = appA) {
  const response = await app.inject({ method: 'POST', url: '/api/visitor', payload: {} });
  expect(response.statusCode).toBe(200);
  return {
    cookie: response.cookies[0]!.name + '=' + response.cookies[0]!.value,
    token: response.cookies[0]!.value,
    id: response.json().id,
    response,
  };
}
async function buy(cookie: string) {
  const session = await appA.inject({
    method: 'POST',
    url: '/api/sessions',
    headers: { cookie },
    payload: {},
  });
  const headers = {
    cookie,
    authorization: 'Bearer ' + session.json().token,
    'idempotency-key': randomUUID(),
  };
  const response = await appB.inject({
    method: 'POST',
    url: '/api/orders',
    headers,
    payload: {
      items: [{ productId: 'sea-salt-chips', quantity: 1 }],
      payment: { method: 'demo-card' },
      menuRevision: menu.revision,
    },
  });
  expect(response.statusCode).toBe(201);
  return { order: response.json(), headers, token: session.json().token };
}
it('[CK-12] server creates a stable UUID but authenticates with a distinct HttpOnly cookie hash', async () => {
  const first = await visitor();
  expect(first.id).toMatch(/^[a-f0-9-]{36}$/);
  expect(first.token).not.toBe(first.id);
  expect(first.response.headers['set-cookie']).toContain('HttpOnly');
  expect(first.response.headers['set-cookie']).toContain('SameSite=Lax');
  const second = await appB.inject({
    method: 'POST',
    url: '/api/visitor',
    headers: { cookie: first.cookie },
    payload: {},
  });
  expect(second.json().id).toBe(first.id);
  expect(second.cookies).toHaveLength(0);
  const stored = (await pool.query('SELECT token_hash FROM visitors WHERE id=$1', [first.id]))
    .rows[0].token_hash;
  expect(stored).toBe(tokenHash(first.token));
  expect(stored).not.toBe(first.token);
  expect(
    (
      await appA.inject({
        url: '/api/visitor/orders',
        headers: { cookie: 'megafuji_visitor=' + first.id },
      })
    ).statusCode,
  ).toBe(401);
  expect(
    (await appA.inject({ method: 'POST', url: '/api/visitor', payload: { id: first.id } }))
      .statusCode,
  ).toBe(400);
});
it('[CK-13] history retains multiple completed purchase sessions and isolates visitor IDs', async () => {
  const a = await visitor(),
    b = await visitor();
  const first = await buy(a.cookie);
  await appA.inject({
    method: 'POST',
    url: '/api/sessions/close',
    headers: first.headers,
    payload: {},
  });
  await buy(a.cookie);
  const history = (
    await appB.inject({ url: '/api/visitor/orders', headers: { cookie: a.cookie } })
  ).json();
  expect(history.orders).toHaveLength(2);
  expect(history.orders.some((o: { id: string }) => o.id === first.order.id)).toBe(true);
  expect(
    (await appA.inject({ url: '/api/visitor/orders', headers: { cookie: b.cookie } })).json()
      .orders,
  ).toEqual([]);
  expect(
    (
      await appA.inject({
        url: '/api/visitor/orders/' + first.order.id,
        headers: { cookie: b.cookie },
      })
    ).statusCode,
  ).toBe(404);
  expect(
    (
      await appA.inject({
        url: '/api/orders/' + first.order.id,
        headers: { cookie: b.cookie, authorization: 'Bearer ' + first.token },
      })
    ).statusCode,
  ).toBe(410);
});
it('[CK-13] owner-bound purchase credentials also require the matching visitor cookie', async () => {
  const a = await visitor(),
    b = await visitor(),
    purchase = await buy(a.cookie);
  expect(
    (
      await appA.inject({
        url: '/api/orders/' + purchase.order.id,
        headers: { authorization: 'Bearer ' + purchase.token },
      })
    ).statusCode,
  ).toBe(401);
  expect(
    (
      await appA.inject({
        url: '/api/orders/' + purchase.order.id,
        headers: { cookie: b.cookie, authorization: 'Bearer ' + purchase.token },
      })
    ).statusCode,
  ).toBe(403);
});
it('[CK-13] history paginates without duplicates or accepting another visitor cursor', async () => {
  const a = await visitor(),
    b = await visitor();
  for (let i = 0; i < 11; i++) await buy(a.cookie);
  const other = await buy(b.cookie);
  const first = (
    await appA.inject({ url: '/api/visitor/orders', headers: { cookie: a.cookie } })
  ).json();
  expect(first.orders).toHaveLength(10);
  expect(first.nextCursor).toBeTruthy();
  const next = (
    await appA.inject({
      url: '/api/visitor/orders?cursor=' + first.nextCursor,
      headers: { cookie: a.cookie },
    })
  ).json();
  expect(next.orders).toHaveLength(1);
  expect(next.nextCursor).toBeNull();
  expect(new Set([...first.orders, ...next.orders].map((o: { id: string }) => o.id)).size).toBe(11);
  expect(
    (
      await appA.inject({
        url: '/api/visitor/orders?cursor=' + other.order.id,
        headers: { cookie: a.cookie },
      })
    ).json().orders,
  ).toEqual([]);
});
it('[CK-14] forgetting revokes the cookie and expiry is enforced by the database', async () => {
  const a = await visitor();
  await buy(a.cookie);
  expect(
    (
      await appA.inject({
        method: 'POST',
        url: '/api/visitor/forget',
        headers: { cookie: a.cookie },
        payload: {},
      })
    ).statusCode,
  ).toBe(204);
  expect(
    (await appB.inject({ url: '/api/visitor/orders', headers: { cookie: a.cookie } })).statusCode,
  ).toBe(401);
  const next = await appA.inject({
    method: 'POST',
    url: '/api/visitor',
    headers: { cookie: a.cookie },
    payload: {},
  });
  expect(next.json().id).not.toBe(a.id);
  await pool.query("UPDATE visitors SET expires_at=now()-interval '1 second'");
  expect(
    (
      await appA.inject({
        url: '/api/visitor/orders',
        headers: { cookie: next.cookies[0]!.name + '=' + next.cookies[0]!.value },
      })
    ).statusCode,
  ).toBe(401);
});
it('[CK-12] visitor mutations reject cross-site requests', async () => {
  expect(
    (
      await appA.inject({
        method: 'POST',
        url: '/api/visitor',
        headers: { origin: 'https://different.example' },
        payload: {},
      })
    ).statusCode,
  ).toBe(403);
});
it('[CK-15] catalog migration preserves original items and expands nine real categories', async () => {
  expect(menu.products).toHaveLength(76);
  const counts = [...new Set(menu.products.map((p) => p.category))].map(
    (category) => menu.products.filter((p) => p.category === category).length,
  );
  expect(counts).toHaveLength(9);
  expect(Math.min(...counts)).toBeGreaterThanOrEqual(8);
  expect(menu.products.find((p) => p.id === 'pesto-focaccia')?.priceCents).toBe(850);
});
it('[AI-06] cache and paid-call limits are shared across API instances', async () => {
  const a = await visitor();
  const req = {
    method: 'POST' as const,
    url: '/api/discovery',
    headers: { cookie: a.cookie },
    payload: { query: 'something crunchy' },
  };
  expect((await appA.inject(req)).json().status).toBe('ready');
  const cached = (await appB.inject(req)).json();
  expect(cached.cached).toBe(true);
  expect(calls).toBe(1);
  expect((await appB.inject({ ...req, payload: { query: 'salty snack' } })).json().status).toBe(
    'ready',
  );
  expect((await appA.inject({ ...req, payload: { query: 'another snack' } })).json().status).toBe(
    'limited',
  );
  expect(calls).toBe(2);
  expect((await pool.query('SELECT count(*) FROM discovery_usage')).rows[0].count).toBe('2');
});
it('[AI-06] simultaneous equal queries coalesce into a single paid provider request', async () => {
  mode = 'slow';
  const a = await visitor();
  const req = {
    method: 'POST' as const,
    url: '/api/discovery',
    headers: { cookie: a.cookie },
    payload: { query: 'crunchy snack' },
  };
  const first = appA.inject(req);
  while (!unblock) await new Promise((r) => setTimeout(r, 5));
  expect((await appB.inject(req)).json().status).toBe('pending');
  unblock();
  expect((await first).json().status).toBe('ready');
  expect(calls).toBe(1);
  expect((await appB.inject(req)).json().cached).toBe(true);
});
it('[AI-05] timeout, invalid response, missing key and outages preserve normal menu/order behavior', async () => {
  const a = await visitor(),
    req = {
      method: 'POST' as const,
      url: '/api/discovery',
      headers: { cookie: a.cookie },
      payload: { query: 'a snack' },
    };
  expect((await offline.inject(req)).json().status).toBe('unavailable');
  expect(calls).toBe(0);
  mode = 'invalid';
  expect((await appA.inject(req)).json().status).toBe('unavailable');
  mode = 'slow';
  expect((await appB.inject({ ...req, payload: { query: 'cold drink' } })).json().status).toBe(
    'unavailable',
  );
  expect((await appA.inject({ url: '/api/menu' })).statusCode).toBe(200);
  expect((await buy(a.cookie)).order.status).toBe('confirmed');
});
it('[AI-04] [AI-06] catalog changes invalidate cache and malicious query shape cannot change the request contract', async () => {
  const a = await visitor(),
    req = {
      method: 'POST' as const,
      url: '/api/discovery',
      headers: { cookie: a.cookie },
      payload: { query: 'a crunchy snack' },
    };
  await appA.inject(req);
  await pool.query("UPDATE products SET available=false WHERE id='sea-salt-chips'");
  try {
    expect((await appB.inject(req)).json().products).toEqual([]);
    expect(calls).toBe(2);
  } finally {
    await pool.query("UPDATE products SET available=true WHERE id='sea-salt-chips'");
  }
  expect((await appA.inject({ ...req, payload: { query: 'x'.repeat(121) } })).statusCode).toBe(400);
  expect(
    (
      await appA.inject({
        ...req,
        payload: { query: 'chips', apiKey: 'attacker', visitorId: a.id },
      })
    ).statusCode,
  ).toBe(400);
});

it('[AI-05] provider outage is cached briefly without blocking purchase', async () => {
  const a = await visitor();
  mode = 'error';
  const req = {
    method: 'POST' as const,
    url: '/api/discovery',
    headers: { cookie: a.cookie },
    payload: { query: 'a crunchy snack' },
  };
  expect((await appA.inject(req)).json().status).toBe('unavailable');
  expect((await appB.inject(req)).json().cached).toBe(true);
  expect(calls).toBe(1);
  expect((await buy(a.cookie)).order.status).toBe('confirmed');
});

it('[AI-05] credential rejection opens a shared cooldown instead of retrying every query', async () => {
  const a = await visitor();
  mode = 'auth';
  const req = {
    method: 'POST' as const,
    url: '/api/discovery',
    headers: { cookie: a.cookie },
    payload: { query: 'a crunchy snack' },
  };
  expect((await appA.inject(req)).json().status).toBe('unavailable');
  expect((await appB.inject({ ...req, payload: { query: 'a cold drink' } })).json().status).toBe(
    'unavailable',
  );
  expect(calls).toBe(1);
  expect((await pool.query('SELECT outcome FROM discovery_usage')).rows[0].outcome).toBe(
    'http_401',
  );
});

it('[CK-12] browser identity headers cannot downgrade silently when cookies are absent', async () => {
  const a = await visitor(),
    b = await visitor();
  expect(
    (
      await appA.inject({
        method: 'POST',
        url: '/api/sessions',
        headers: { 'x-visitor-id': a.id },
        payload: {},
      })
    ).statusCode,
  ).toBe(401);
  expect(
    (
      await appA.inject({
        method: 'POST',
        url: '/api/sessions',
        headers: { cookie: a.cookie, 'x-visitor-id': b.id },
        payload: {},
      })
    ).statusCode,
  ).toBe(403);
});

it('[CK-04] [CK-15] the expanded catalog accepts more than twenty distinct items within the forty-unit limit', async () => {
  const a = await visitor();
  const session = await appA.inject({
    method: 'POST',
    url: '/api/sessions',
    headers: { cookie: a.cookie, 'x-visitor-id': a.id },
    payload: {},
  });
  const items = menu.products
    .filter((p) => p.available)
    .slice(0, 25)
    .map((p) => ({ productId: p.id, quantity: 1 }));
  const response = await appA.inject({
    method: 'POST',
    url: '/api/orders',
    headers: {
      cookie: a.cookie,
      authorization: 'Bearer ' + session.json().token,
      'idempotency-key': randomUUID(),
    },
    payload: { items, payment: { method: 'demo-card' }, menuRevision: menu.revision },
  });
  expect(response.statusCode).toBe(201);
  expect(response.json().items).toHaveLength(25);
});
