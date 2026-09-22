import { test, expect } from '@playwright/test';
import type { Receipt } from '../../src/shared/contracts.js';
const add = async (page: import('@playwright/test').Page, name = 'Pesto focaccia') =>
  page.getByRole('button', { name: 'Add ' + name, exact: true }).click();
test('[CK-02] [CK-03] [CK-05] [CK-11] tablet checkout completes and the next customer starts fresh', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.goto('/');
  await add(page);
  await add(page, 'Iced latte');
  await page.getByRole('button', { name: 'Review order', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('radio', { name: /Demo cash/ }).check();
  await page.screenshot({ path: 'artifacts/screenshots/review.png' });
  await page.getByRole('button', { name: /Place demo order/ }).click();
  await expect(page.getByRole('heading', { name: 'That’s a good choice.' })).toBeVisible();
  await expect(page.getByLabel('Confirmed order receipt')).toContainText('$13.00');
  await expect(page.getByLabel('Confirmed order receipt')).toContainText('Demo cash');
  await page.screenshot({ path: 'artifacts/screenshots/receipt.png' });
  await page.reload();
  await expect(page.getByRole('heading', { name: 'That’s a good choice.' })).toBeVisible();
  await page.getByRole('button', { name: 'Start another order' }).click();
  await expect(page.getByRole('heading', { name: 'Make yourself happy.' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Review order', exact: true })).toBeDisabled();
  const saved = await page.evaluate(() => sessionStorage.getItem('megafuji.checkout.v1'));
  expect(saved).toBeNull();
});
test('[CK-01] menu failure has an actionable retry', async ({ page }) => {
  await page.route(
    '**/api/menu',
    (route) =>
      route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({
          error: { code: 'TEMPORARILY_UNAVAILABLE', message: 'Unavailable' },
        }),
      }),
    { times: 1 },
  );
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'The menu needs a moment.' })).toBeVisible();
  await page.getByRole('button', { name: 'Try again', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Add Pesto focaccia', exact: true })).toBeVisible();
});
test('[CK-08] [UX-02] response is lost after the real server saved the order; reload recovers its ID', async ({
  page,
}) => {
  let committed: Receipt | undefined;
  let key: string | undefined;
  await page.route(
    '**/api/orders',
    async (route) => {
      key = route.request().headers()['idempotency-key'];
      const response = await route.fetch();
      expect(response.status()).toBe(201);
      committed = (await response.json()) as Receipt;
      await route.abort('failed');
    },
    { times: 1 },
  );
  await page.goto('/');
  await add(page);
  await page.getByRole('button', { name: 'Review order', exact: true }).click();
  await page.getByRole('button', { name: /Place demo order/ }).click();
  await expect(
    page.getByRole('heading', { name: 'Your order may already be saved.' }),
  ).toBeVisible();
  expect(committed?.id).toBeTruthy();
  await expect(page.getByRole('button', { name: 'Close order review' })).toHaveCount(0);
  const before = await page.evaluate(() =>
    JSON.parse(sessionStorage.getItem('megafuji.checkout.v1')!),
  );
  expect(before.intent.key).toBe(key);
  const replay = page.waitForResponse((r) => r.url().endsWith('/api/orders') && r.status() === 200);
  await page.reload();
  const response = await replay;
  expect(((await response.json()) as Receipt).id).toBe(committed!.id);
  await expect(page.getByLabel('Confirmed order receipt')).toContainText(committed!.reference);
});
test('[CK-02] search, categories, sold-out state and quantity bounds stay coherent', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Drinks', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Add Pesto focaccia', exact: true })).toHaveCount(
    0,
  );
  await expect(page.getByRole('button', { name: 'Add Iced matcha', exact: true })).toBeDisabled();
  await page.getByLabel('Search the menu').fill('no-such-food');
  await expect(page.getByRole('heading', { name: 'No matches just yet.' })).toBeVisible();
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Show all favorites' }).click();
  await add(page);
  await page.getByRole('button', { name: 'Add one Pesto focaccia', exact: true }).click();
  await expect(page.getByLabel('Pesto focaccia quantity')).toHaveText('2');
  await page.getByRole('button', { name: 'Remove one Pesto focaccia', exact: true }).click();
  await page.getByRole('button', { name: 'Remove one Pesto focaccia', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Make yourself happy.' })).toBeVisible();
});
test('[CK-09] an unavailable order service keeps the intent for retry', async ({ page }) => {
  await page.route(
    '**/api/orders',
    (route) =>
      route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({
          error: { code: 'TEMPORARILY_UNAVAILABLE', message: 'Please try again.' },
        }),
      }),
    { times: 1 },
  );
  await page.goto('/');
  await add(page);
  await page.getByRole('button', { name: 'Review order', exact: true }).click();
  await page.getByRole('button', { name: /Place demo order/ }).click();
  await expect(page.getByRole('button', { name: 'Check my order' })).toBeVisible();
  await page.getByRole('button', { name: 'Check my order' }).click();
  await expect(page.getByRole('heading', { name: 'That’s a good choice.' })).toBeVisible();
});
test('[UX-02] review traps focus, Escape returns to the cart and keeps its contents', async ({
  page,
}) => {
  await page.goto('/');
  await add(page);
  await page.getByRole('button', { name: 'Review order', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Everything look good?' })).toBeFocused();
  await page.keyboard.press('Tab');
  expect(await page.evaluate(() => Boolean(document.activeElement?.closest('dialog')))).toBe(true);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(page.getByLabel('Pesto focaccia quantity')).toHaveText('1');
});
for (const viewport of [
  { width: 1440, height: 1000 },
  { width: 768, height: 1024 },
  { width: 390, height: 844 },
]) {
  test('[UX-01] layout and artwork render at ' + viewport.width + 'px', async ({ page }) => {
    await page.setViewportSize(viewport);
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto('/');
    await add(page);
    await expect(page.getByRole('button', { name: 'Review order', exact: true })).toBeEnabled();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    expect(
      await page
        .locator('.product-art img')
        .evaluateAll((images) =>
          images.every((image) => (image as HTMLImageElement).naturalWidth > 0),
        ),
    ).toBe(true);
    expect(errors).toEqual([]);
    await page.screenshot({
      path: 'artifacts/screenshots/checkout-' + viewport.width + '.png',
      fullPage: true,
    });
  });
}

test('[UX-02] storage failure blocks purchase before any order request', async ({ page }) => {
  await page.addInitScript(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key === 'megafuji.checkout.v1' && JSON.parse(value).intent)
        throw new DOMException('Quota reached', 'QuotaExceededError');
      return original.call(this, key, value);
    };
  });
  let orderRequests = 0;
  page.on('request', (request) => {
    if (request.url().endsWith('/api/orders') && request.method() === 'POST') orderRequests++;
  });
  await page.goto('/');
  await add(page);
  await page.getByRole('button', { name: 'Review order', exact: true }).click();
  await page.getByRole('button', { name: /Place demo order/ }).click();
  await expect(page.getByRole('alert')).toContainText('recoverable checkout');
  expect(orderRequests).toBe(0);
});
