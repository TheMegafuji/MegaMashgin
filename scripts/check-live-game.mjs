import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
const api = 'https://api.megamashgin.top',
  game = 'https://game.megamashgin.top';
const directory = 'docs/evidence/live-game/browser';
await mkdir(directory, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const receipts = new Map(),
  tasks = [],
  statuses = [],
  errors = [],
  replicas = new Set();
const startedAt = new Date().toISOString();
page.on('pageerror', (e) => errors.push(e.message));
page.on('response', (response) => {
  if (response.url() !== api + '/api/orders' || response.request().method() !== 'POST') return;
  tasks.push(
    (async () => {
      statuses.push(response.status());
      if (!response.ok()) {
        errors.push('Order status ' + response.status());
        return;
      }
      const receipt = await response.json();
      replicas.add(response.headers()['x-instance-id']);
      receipts.set(receipt.id, {
        receipt,
        authorization: response.request().headers().authorization,
      });
    })(),
  );
});
try {
  await page.goto(game + '/?debug=1&paused=1');
  await page.waitForFunction(() => window.__mt?.ready);
  const defaultMode = (await page.locator('body').innerText()).includes('OFFLINE SANDBOX');
  await page.getByTestId('settings').click();
  await page.getByRole('radio', { name: 'Live checkout API' }).check();
  await page.locator('#api-url').fill(api);
  await page
    .getByRole('checkbox', { name: 'Show HTTP status, latency and purchase trace' })
    .check();
  await page.getByRole('button', { name: 'Apply settings' }).click();
  await page.getByRole('dialog', { name: 'Make it your market.' }).waitFor({ state: 'hidden' });
  await page.evaluate(() => window.__mt.dispatch({ type: 'dismissTutorial' }));
  const started = Date.now();
  while (receipts.size < 35 && Date.now() - started < 120000 && !errors.length) {
    await page.evaluate(() => window.__mt.advance(5000));
    await page.waitForTimeout(500);
  }
  await page.waitForFunction(
    () => JSON.parse(localStorage.getItem('megafuji.market.jobs.v1') ?? '[]').length === 0,
    null,
    { timeout: 20000 },
  );
  await Promise.all(tasks);
  const state = await page.evaluate(() => window.__mt.state());
  let readbackMatches = 0;
  for (const { receipt, authorization } of receipts.values()) {
    const response = await page.request.get(api + '/api/orders/' + receipt.id, {
      headers: { authorization, origin: game },
    });
    if (
      response.status() === 200 &&
      JSON.stringify(await response.json()) === JSON.stringify(receipt)
    )
      readbackMatches++;
  }
  const totalCents = [...receipts.values()].reduce((sum, x) => sum + x.receipt.totalCents, 0);
  const ok =
    receipts.size >= 35 &&
    state.stats.paid === receipts.size &&
    Math.abs(state.totalEarned - totalCents / 100) < 0.001 &&
    readbackMatches === receipts.size &&
    errors.length === 0;
  const evidence = {
    startedAt,
    finishedAt: new Date().toISOString(),
    game,
    api,
    defaultMode: defaultMode ? 'offline' : 'other',
    modeTested: 'Live checkout API',
    simulation: 'accelerated through existing debug advance; not a wall-clock throughput benchmark',
    network: 'real public browser requests; no route interception or mocks',
    orderStatuses: statuses,
    uniqueReceipts: receipts.size,
    gamePaid: state.stats.paid,
    totalCents,
    gameTotalEarned: state.totalEarned,
    pending: 0,
    readbackMatches,
    replicas: [...replicas],
    errors,
    receiptIds: [...receipts.keys()],
    receipts: [...receipts.values()].map((x) => ({
      id: x.receipt.id,
      totalCents: x.receipt.totalCents,
    })),
    ok,
  };
  await page.screenshot({ path: directory + '/live-game.png' });
  await writeFile(directory + '/result.json', JSON.stringify(evidence, null, 2) + '\n');
  console.log(JSON.stringify({ ...evidence, receiptIds: undefined, receipts: undefined }));
  if (!ok) process.exitCode = 1;
} finally {
  await browser.close();
}
