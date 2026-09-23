// Adapted from the companion MarketTycoon connected proof; requires its published debug API.
import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
const base = process.env.GAME_URL ?? 'http://127.0.0.1:5180';
const api = process.env.CHECKOUT_URL ?? 'http://localhost:8090';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 980 } });
const attempts = [];
const evidenceDir = process.env.PROOF_OUTPUT_DIR ?? 'artifacts/game-recovery';
const promoted = process.env.PROMOTED_PROOF === '1';
let committed = null,
  drop = true;
const assert = (ok, msg) => {
  if (!ok) throw new Error(msg);
};
try {
  await page.route(api + '/api/orders', async (route) => {
    if (route.request().method() !== 'POST') {
      await route.continue();
      return;
    }
    const req = route.request();
    attempts.push({
      body: req.postData(),
      key: req.headers()['idempotency-key'],
      token: req.headers().authorization,
    });
    if (drop) {
      drop = false;
      const response = await route.fetch();
      assert(response.status() === 201, 'First order was not committed: ' + response.status());
      committed = await response.json();
      await route.abort('failed');
    } else await route.continue();
  });
  await page.goto(base + '/?debug=1&paused=1');
  await page.waitForFunction(() => window.__mt?.ready);
  if (promoted)
    assert(
      await page.evaluate(
        () =>
          window.__mt.dispatch({
            type: 'setSale',
            id: 'SHELF_FRUIT',
            productId: 'red-apple',
          }).ok,
      ),
      'Unable to select promotion',
    );
  await page.getByTestId('settings').click();
  await page.getByRole('radio', { name: 'Live checkout API' }).check();
  await page.locator('#api-url').fill(api);
  await page
    .getByRole('checkbox', {
      name: 'Show HTTP status, latency and purchase trace',
    })
    .check();
  await page.getByRole('button', { name: 'Apply settings' }).click();
  await page.getByRole('dialog', { name: 'Make it your market.' }).waitFor({ state: 'hidden' });
  await page.evaluate(() => {
    for (let i = 0; i < 1500; i++) {
      window.__mt.advance(50);
      if (window.__mt.state().customers.some((c) => c.paymentState === 'pending')) break;
    }
  });
  await page.waitForFunction(
    () => JSON.parse(localStorage.getItem('megafuji.market.jobs.v1') ?? '[]').some((j) => j.error),
    null,
    { timeout: 20000 },
  );
  assert(committed?.status === 'confirmed', 'Server receipt missing before interruption');
  assert(
    (await page.evaluate(() => window.__mt.state().stats.paid)) === 0,
    'Game falsely confirmed a lost response',
  );
  await page.reload();
  await page.waitForFunction(() => window.__mt?.ready);
  // Recovery resumes automatically after the stored API configuration is validated.
  await page.waitForFunction(
    () => JSON.parse(localStorage.getItem('megafuji.market.jobs.v1') ?? '[]').length === 0,
    null,
    { timeout: 20000 },
  );
  assert(attempts.length === 2, 'Expected exactly one creation and one recovery request');
  assert(
    attempts[0].key === attempts[1].key &&
      attempts[0].body === attempts[1].body &&
      attempts[0].token === attempts[1].token,
    'Recovery changed purchase identity',
  );
  const persisted = await page.request.get(api + '/api/orders/' + committed.id, {
    headers: { authorization: attempts[0].token },
  });
  assert(persisted.status() === 200, 'Persisted receipt not retrievable');
  const receipt = await persisted.json();
  if (promoted) {
    const menu = await (await page.request.get(api + '/api/menu')).json();
    const apple = menu.products.find((p) => p.id === 'red-apple');
    assert(
      JSON.parse(attempts[0].body).promotionProductIds?.includes('red-apple'),
      'Promotion absent from durable request',
    );
    assert(
      receipt.items.find((p) => p.productId === 'red-apple')?.unitPriceCents ===
        Math.round(apple.priceCents * 0.8),
      'Promotion changed after recovery',
    );
  }
  assert(receipt.id === committed.id, 'Different persisted order');
  const state = await page.evaluate(() => window.__mt.state());
  assert(
    state.stats.paid === 1 && state.appliedReceipts.includes(receipt.id),
    'Receipt credited incorrectly after reload',
  );
  const trace = await page.locator('.debug-panel').innerText();
  assert(trace.includes('200'), 'Replay status not exposed');
  await mkdir(evidenceDir, { recursive: true });
  await page.screenshot({ path: evidenceDir + '/recovery.png' });
  const evidence = {
    testedAt: new Date().toISOString(),
    gameUrl: base,
    apiUrl: api,
    ordersCreated: 1,
    promotedRecovery: promoted,
    orderRequests: attempts.length,
    sameIntentOnRetry: true,
    confirmedBeforeInterruptedResponse: true,
    receiptId: receipt.id,
    totalCents: receipt.totalCents,
    gamePaid: state.stats.paid,
    trace,
  };
  await writeFile(evidenceDir + '/connected.json', JSON.stringify(evidence, null, 2) + '\n');
  console.log('CONNECTED_OK created=1 recovered=1 same-intent=true receipt=' + receipt.id);
} finally {
  await browser.close();
}
