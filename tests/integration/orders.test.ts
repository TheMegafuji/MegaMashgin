import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import { buildApp } from '../../src/server/app.js';
import { createPool } from '../../src/server/infrastructure/database.js';
import { migrate } from '../../src/server/migrate.js';
import type { OrderRequest, Menu, Receipt } from '../../src/shared/contracts.js';
import { tokenHash } from '../../src/server/modules/sessions/sessions.js';
import { testDatabaseUrl } from '../helpers.js';

const poolA = createPool(testDatabaseUrl());
const poolB = createPool(testDatabaseUrl());
let dropNext = false;
const appA = await buildApp({
  pool: poolA,
  instanceId: 'api-a',
  sessionLimit: 1000,
  gameOrigins: [
    'http://localhost:5180',
    'http://127.0.0.1:5180',
    'http://localhost:4180',
    'http://localhost:4181',
  ],
  afterCommit: async (request) => {
    if (dropNext) {
      dropNext = false;
      request.raw.socket.destroy();
    }
  },
});
const appB = await buildApp({ pool: poolB, instanceId: 'api-b', sessionLimit: 1000 });
let address: string;
let menu: Menu;
let token: string;
const body = (): OrderRequest => ({
  items: [
    { productId: 'pesto-focaccia', quantity: 2 },
    { productId: 'iced-latte', quantity: 1 },
  ],
  menuRevision: menu.revision,
  payment: { method: 'demo-card' },
});
const headers = (key: string, t = token) => ({
  authorization: 'Bearer ' + t,
  'idempotency-key': key,
});
beforeAll(async () => {
  await migrate(poolA);
  address = await appA.listen({ host: '127.0.0.1', port: 0 });
});
beforeEach(async () => {
  dropNext = false;
  await poolA.query('TRUNCATE orders, customer_sessions, admission CASCADE');
  await poolA.query(
    "UPDATE products SET price_cents = 850, available = true WHERE id = 'pesto-focaccia'",
  );
  menu = (await appA.inject({ method: 'GET', url: '/api/menu' })).json<Menu>();
  token = (await appA.inject({ method: 'POST', url: '/api/sessions', payload: {} })).json<{
    token: string;
  }>().token;
});
afterAll(async () => {
  await appA.close();
  await appB.close();
  await poolA.end();
  await poolB.end();
});
describe('PostgreSQL purchase guarantees', () => {
  it('[CK-01] serves the catalog with an availability flag and a revision', async () => {
    expect(menu.products).toHaveLength(76);
    expect(menu.products.find((p) => p.id === 'matcha-latte')?.available).toBe(false);
    expect(menu.revision).toMatch(/^[a-f0-9]{64}$/);
  });
  it('[CK-04] [CK-05] uses catalog prices and persists a complete immutable snapshot', async () => {
    const res = await appA.inject({
      method: 'POST',
      url: '/api/orders',
      headers: headers(randomUUID()),
      payload: body(),
    });
    expect(res.statusCode).toBe(201);
    const receipt = res.json<Receipt>();
    expect(receipt.totalCents).toBe(2150);
    expect(receipt.items.find((i) => i.productId === 'pesto-focaccia')).toMatchObject({
      quantity: 2,
      unitPriceCents: 850,
      lineTotalCents: 1700,
    });
    const persisted = await poolB.query('SELECT total_cents, items FROM orders WHERE id = $1', [
      receipt.id,
    ]);
    expect(persisted.rows[0]).toMatchObject({ total_cents: 2150, items: receipt.items });
    expect(res.headers['x-request-id']).toMatch(/^[a-f0-9-]{36}$/);
    expect(res.headers['cache-control']).toBe('no-store');
  });
  it('[CK-06] twenty concurrent requests through independent API factories create one order', async () => {
    const key = randomUUID();
    const requests = await Promise.all(
      Array.from({ length: 20 }, (_, i) =>
        (i % 2 ? appA : appB).inject({
          method: 'POST',
          url: '/api/orders',
          headers: headers(key),
          payload: body(),
        }),
      ),
    );
    expect(requests.filter((r) => r.statusCode === 201)).toHaveLength(1);
    expect(requests.filter((r) => r.statusCode === 200)).toHaveLength(19);
    expect(new Set(requests.map((r) => r.json<Receipt>().id)).size).toBe(1);
    expect(new Set(requests.map((r) => r.headers['x-instance-id'])).size).toBe(2);
    expect((await poolA.query('SELECT count(*)::int AS count FROM orders')).rows[0].count).toBe(1);
  });
  it('[CK-07] rejects payload/key reuse and another purchase for the same customer', async () => {
    const key = randomUUID();
    await appA.inject({
      method: 'POST',
      url: '/api/orders',
      headers: headers(key),
      payload: body(),
    });
    const changed = await appB.inject({
      method: 'POST',
      url: '/api/orders',
      headers: headers(key),
      payload: { ...body(), payment: { method: 'demo-cash' } },
    });
    expect(changed.statusCode).toBe(409);
    expect(changed.json().error.code).toBe('INTENT_CONFLICT');
    const second = await appB.inject({
      method: 'POST',
      url: '/api/orders',
      headers: headers(randomUUID()),
      payload: body(),
    });
    expect(second.statusCode).toBe(409);
    expect(second.json().error.code).toBe('SESSION_COMPLETE');
  });
  it('[CK-08] destroys the socket only after commit, then recovers via another API', async () => {
    const key = randomUUID();
    dropNext = true;
    await expect(
      fetch(address + '/api/orders', {
        method: 'POST',
        headers: { ...headers(key), 'content-type': 'application/json' },
        body: JSON.stringify(body()),
      }),
    ).rejects.toThrow();
    const rows = (await poolB.query('SELECT id FROM orders')).rows;
    expect(rows).toHaveLength(1);
    const recovered = await appB.inject({
      method: 'POST',
      url: '/api/orders',
      headers: headers(key),
      payload: body(),
    });
    expect(recovered.statusCode).toBe(200);
    expect(recovered.json<Receipt>().id).toBe(rows[0].id);
  });
  it('[CK-04] stale menu cannot create an order but an existing receipt still replays', async () => {
    const key = randomUUID();
    const intent = body();
    const first = await appA.inject({
      method: 'POST',
      url: '/api/orders',
      headers: headers(key),
      payload: intent,
    });
    await poolA.query("UPDATE products SET price_cents = 900 WHERE id = 'pesto-focaccia'");
    const replay = await appB.inject({
      method: 'POST',
      url: '/api/orders',
      headers: headers(key),
      payload: intent,
    });
    expect(replay.json()).toEqual(first.json());
    const other = (await appA.inject({ method: 'POST', url: '/api/sessions', payload: {} })).json<{
      token: string;
    }>().token;
    const stale = await appB.inject({
      method: 'POST',
      url: '/api/orders',
      headers: headers(randomUUID(), other),
      payload: intent,
    });
    expect(stale.statusCode).toBe(409);
    expect(stale.json().error.code).toBe('MENU_CHANGED');
  });
  it('[CK-03] [CK-04] rejects tampered totals, payment secrets, invalid quantities and unavailable items', async () => {
    for (const payload of [
      { ...body(), totalCents: 1 },
      { ...body(), payment: { method: 'demo-card', cvv: 'not-real' } },
      { ...body(), items: [{ productId: 'pesto-focaccia', quantity: -1 }] },
    ]) {
      expect(
        (
          await appA.inject({
            method: 'POST',
            url: '/api/orders',
            headers: headers(randomUUID()),
            payload,
          })
        ).statusCode,
      ).toBe(400);
    }
    const missing = await appA.inject({
      method: 'POST',
      url: '/api/orders',
      headers: headers(randomUUID()),
      payload: { ...body(), items: [{ productId: 'matcha-latte', quantity: 1 }] },
    });
    expect(missing.statusCode).toBe(409);
    expect((await poolA.query('SELECT count(*)::int AS count FROM orders')).rows[0].count).toBe(0);
  });
  it('[CK-10] isolates receipts and stores a hash instead of the bearer token', async () => {
    const order = (
      await appA.inject({
        method: 'POST',
        url: '/api/orders',
        headers: headers(randomUUID()),
        payload: body(),
      })
    ).json<Receipt>();
    const other = (await appA.inject({ method: 'POST', url: '/api/sessions', payload: {} })).json<{
      token: string;
    }>().token;
    expect(
      (
        await appB.inject({
          method: 'GET',
          url: '/api/orders/' + order.id,
          headers: { authorization: 'Bearer ' + other },
        })
      ).statusCode,
    ).toBe(404);
    expect((await appB.inject({ method: 'GET', url: '/api/orders/' + order.id })).statusCode).toBe(
      401,
    );
    expect(
      (
        await poolA.query('SELECT token_hash FROM customer_sessions WHERE token_hash = $1', [
          tokenHash(token),
        ])
      ).rows[0].token_hash,
    ).not.toBe(token);
  });
  it('[CK-10] [CK-11] closed and expired sessions cannot create purchases', async () => {
    expect(
      (
        await appA.inject({
          method: 'POST',
          url: '/api/sessions/close',
          headers: { authorization: 'Bearer ' + token },
          payload: {},
        })
      ).statusCode,
    ).toBe(204);
    expect(
      (
        await appA.inject({
          method: 'POST',
          url: '/api/orders',
          headers: headers(randomUUID()),
          payload: body(),
        })
      ).statusCode,
    ).toBe(410);
    await poolA.query(
      "UPDATE customer_sessions SET closed_at = NULL, expires_at = now() - interval '1 second'",
    );
    expect(
      (
        await appB.inject({
          method: 'POST',
          url: '/api/orders',
          headers: headers(randomUUID()),
          payload: body(),
        })
      ).statusCode,
    ).toBe(410);
  });
  it('[CK-09] [OPS-02] a disconnected database returns 503, stays live, and retry can succeed', async () => {
    const deadPool = createPool(
      'postgresql://checkout:local-test-only@127.0.0.1:65530/checkout_test',
    );
    const dead = await buildApp({ pool: deadPool });
    try {
      expect((await dead.inject({ method: 'GET', url: '/health/live' })).statusCode).toBe(200);
      expect((await dead.inject({ method: 'GET', url: '/health/ready' })).statusCode).toBe(503);
      const key = randomUUID();
      expect(
        (
          await dead.inject({
            method: 'POST',
            url: '/api/orders',
            headers: headers(key),
            payload: body(),
          })
        ).statusCode,
      ).toBe(503);
      expect(
        (
          await appA.inject({
            method: 'POST',
            url: '/api/orders',
            headers: headers(key),
            payload: body(),
          })
        ).statusCode,
      ).toBe(201);
    } finally {
      await dead.close();
      await deadPool.end();
    }
  });
  it('[OPS-03] admission limit is shared by distinct API factories', async () => {
    const limitedA = await buildApp({ pool: poolA, sessionLimit: 2 });
    const limitedB = await buildApp({ pool: poolB, sessionLimit: 2 });
    await poolA.query('TRUNCATE admission');
    try {
      const responses = await Promise.all(
        [limitedA, limitedB, limitedA].map((app) =>
          app.inject({ method: 'POST', url: '/api/sessions', payload: {} }),
        ),
      );
      expect(responses.filter((r) => r.statusCode === 201)).toHaveLength(2);
      expect(responses.filter((r) => r.statusCode === 429)).toHaveLength(1);
    } finally {
      await limitedA.close();
      await limitedB.close();
    }
  });
  it('[CK-10] rejects cross-origin mutations without enabling CORS', async () => {
    const res = await appA.inject({
      method: 'POST',
      url: '/api/orders',
      headers: { ...headers(randomUUID()), origin: 'https://unrelated.example' },
      payload: body(),
    });
    expect(res.statusCode).toBe(403);
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });
  it('[GAME] keeps game session admission bounded separately from ordinary checkout', async () => {
    const quotaApp = await buildApp({
      pool: poolA,
      sessionLimit: 30,
      gameSessionLimit: 240,
      gameOrigins: ['http://localhost:5180'],
    });
    try {
      await poolA.query('TRUNCATE admission');
      const game = await Promise.all(
        Array.from({ length: 31 }, () =>
          quotaApp.inject({
            method: 'POST',
            url: '/api/sessions',
            headers: { origin: 'http://localhost:5180', 'sec-fetch-site': 'cross-site' },
            payload: {},
          }),
        ),
      );
      expect(game.every((response) => response.statusCode === 201)).toBe(true);
      const ordinary = await Promise.all(
        Array.from({ length: 31 }, () =>
          quotaApp.inject({ method: 'POST', url: '/api/sessions', payload: {} }),
        ),
      );
      expect(ordinary.filter((response) => response.statusCode === 201)).toHaveLength(30);
      expect(ordinary.filter((response) => response.statusCode === 429)).toHaveLength(1);
    } finally {
      await quotaApp.close();
    }
  });
  it('[GAME] keeps game order admission separate from ordinary checkout', async () => {
    const quotaApp = await buildApp({
      pool: poolA,
      sessionLimit: 30,
      gameOrigins: ['http://localhost:5180'],
      gameSessionLimit: 100,
      gameSessionGlobalLimit: 100,
      gameOrderLimit: 1,
    });
    const gameHeaders = { origin: 'http://localhost:5180', 'sec-fetch-site': 'cross-site' };
    try {
      await poolA.query('TRUNCATE admission');
      const sessions = await Promise.all(
        [0, 1].map(() =>
          quotaApp.inject({
            method: 'POST',
            url: '/api/sessions',
            headers: gameHeaders,
            payload: {},
          }),
        ),
      );
      expect(sessions.every((response) => response.statusCode === 201)).toBe(true);
      const gameOrder = (response: (typeof sessions)[number], key: string) =>
        quotaApp.inject({
          method: 'POST',
          url: '/api/orders',
          headers: {
            ...gameHeaders,
            authorization: 'Bearer ' + response.json<{ token: string }>().token,
            'idempotency-key': key,
          },
          payload: body(),
        });
      expect((await gameOrder(sessions[0]!, randomUUID())).statusCode).toBe(201);
      const limitedGameOrder = await gameOrder(sessions[1]!, randomUUID());
      expect(limitedGameOrder.statusCode).toBe(429);
      expect(limitedGameOrder.headers['retry-after']).toBe('60');
      const ordinary = await quotaApp.inject({
        method: 'POST',
        url: '/api/orders',
        headers: headers(randomUUID()),
        payload: body(),
      });
      expect(ordinary.statusCode).toBe(201);
    } finally {
      await quotaApp.close();
    }
  });
  it('[CK-10] allows only the explicit token-only game origin and preflight', async () => {
    const preflight = await appA.inject({
      method: 'OPTIONS',
      url: '/api/orders',
      headers: {
        origin: 'http://localhost:5180',
        'access-control-request-method': 'POST',
        'access-control-request-headers': 'authorization,content-type,idempotency-key',
      },
    });
    expect(preflight.statusCode).toBe(204);
    expect(preflight.headers['access-control-allow-origin']).toBe('http://localhost:5180');
    expect(preflight.headers['access-control-allow-credentials']).toBeUndefined();
    expect(preflight.headers['access-control-expose-headers']).toContain('Retry-After');
    const session = await appA.inject({
      method: 'POST',
      url: '/api/sessions',
      headers: { origin: 'http://localhost:5180', 'sec-fetch-site': 'cross-site' },
      payload: {},
    });
    expect(session.statusCode).toBe(201);
    expect(session.headers['access-control-allow-origin']).toBe('http://localhost:5180');
    expect(session.headers['set-cookie']).toBeUndefined();
    const visitor = await appA.inject({
      method: 'POST',
      url: '/api/visitor',
      headers: { origin: 'http://localhost:5180', 'sec-fetch-site': 'cross-site' },
      payload: {},
    });
    expect(visitor.statusCode).toBe(403);
  });
  it('[GAME] applies server-owned 20% promotions only to explicit game sessions', async () => {
    const gameOrigin = 'http://localhost:5180';
    const gameSession = await appA.inject({
      method: 'POST',
      url: '/api/sessions',
      headers: { origin: gameOrigin, 'sec-fetch-site': 'cross-site' },
      payload: {},
    });
    expect(gameSession.statusCode).toBe(201);
    const gameToken = gameSession.json<{ token: string }>().token;
    const discounted = await appA.inject({
      method: 'POST',
      url: '/api/orders',
      headers: {
        authorization: 'Bearer ' + gameToken,
        'idempotency-key': randomUUID(),
        origin: gameOrigin,
      },
      payload: {
        ...body(),
        items: [{ productId: 'pesto-focaccia', quantity: 2 }],
        promotionProductIds: ['pesto-focaccia'],
      },
    });
    expect(discounted.statusCode).toBe(201);
    expect(discounted.json<Receipt>()).toMatchObject({
      totalCents: 1360,
      items: [{ productId: 'pesto-focaccia', unitPriceCents: 680, lineTotalCents: 1360 }],
    });

    const ordinary = await appA.inject({
      method: 'POST',
      url: '/api/orders',
      headers: { ...headers(randomUUID()), origin: gameOrigin },
      payload: {
        ...body(),
        items: [{ productId: 'pesto-focaccia', quantity: 2 }],
        promotionProductIds: ['pesto-focaccia'],
      },
    });
    expect(ordinary.statusCode).toBe(422);
    expect(ordinary.json().error.code).toBe('PROMOTION_NOT_ALLOWED');
  });
});
