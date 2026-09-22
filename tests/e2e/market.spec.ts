import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('[CK-12] [CK-13] [CK-14] visitor history survives new orders and reload; forgetting revokes access', async ({
  page,
  context,
}) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'My orders', exact: true })).toBeEnabled();
  const before = (await context.cookies()).find((c) => c.name === 'megafuji_visitor')!;
  expect(before.httpOnly).toBe(true);
  expect(await page.evaluate(() => document.cookie)).not.toContain('megafuji_visitor');
  await page.getByRole('button', { name: 'Add Pesto focaccia', exact: true }).click();
  await page.getByRole('button', { name: 'Review order', exact: true }).click();
  await page.getByRole('button', { name: /Place demo order/ }).click();
  await expect(page.getByRole('heading', { name: 'That’s a good choice.' })).toBeVisible();
  const reference = await page.locator('.receipt-reference strong').textContent();
  await page.getByRole('button', { name: 'Start another order' }).click();
  await expect(page.getByRole('heading', { name: 'Good things. On the go.' })).toBeVisible();
  await page.reload();
  expect((await context.cookies()).find((c) => c.name === 'megafuji_visitor')!.value).toBe(
    before.value,
  );
  await page.getByRole('button', { name: 'My orders', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Order history' })).toContainText(reference!);
  const a11y = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(a11y.violations).toEqual([]);
  await page.screenshot({ path: 'artifacts/screenshots/market-history.png' });
  await page.getByRole('button', { name: 'Forget this device', exact: true }).click();
  await page.getByRole('button', { name: 'Yes, forget this device' }).click();
  await expect(page.getByRole('dialog', { name: 'Order history' })).not.toBeVisible();
  expect((await context.cookies()).find((c) => c.name === 'megafuji_visitor')!.value).not.toBe(
    before.value,
  );
  await page.getByRole('button', { name: 'My orders', exact: true }).click();
  await expect(page.getByText('Your first good thing awaits.')).toBeVisible();
});

test('[UX-04] local autocomplete is instant while AI arrives later; results stay keyboard-selectable', async ({
  page,
}) => {
  let release: (() => void) | undefined;
  await page.route('**/api/discovery', async (route) => {
    await new Promise<void>((resolve) => {
      release = resolve;
    });
    await route.fulfill({
      json: {
        status: 'ready',
        source: 'jev',
        products: [{ productId: 'sea-salt-chips', weight: 0.9 }],
        confidence: 0.8,
        matchEvidence: 0.95,
        cached: false,
      },
    });
  });
  await page.goto('/');
  const input = page.getByRole('combobox', { name: 'Search the menu' });
  await input.fill('cola');
  await expect(page.getByRole('group', { name: 'Menu matches' })).toContainText('Classic cola');
  await expect(page.getByRole('group', { name: 'AI suggestions' })).not.toContainText(
    'Sea salt chips',
  );
  await expect.poll(() => Boolean(release)).toBe(true);
  release!();
  await expect(page.getByRole('group', { name: 'AI suggestions' })).toContainText('Sea salt chips');
  const a11y = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(a11y.violations).toEqual([]);
  await page.screenshot({ path: 'artifacts/screenshots/market-search.png' });
  await input.press('ArrowDown');
  await input.press('Enter');
  await expect(input).toHaveValue('Classic cola');
  await expect(page.getByRole('listbox')).not.toBeVisible();
  await expect(page.getByRole('button', { name: 'Add Classic cola', exact: true })).toBeVisible();
});

test('[UX-04] stale asynchronous suggestions cannot replace a newer search', async ({ page }) => {
  let oldRelease: (() => void) | undefined;
  await page.route('**/api/discovery', async (route) => {
    const query = route.request().postDataJSON().query;
    if (query === 'crunchy')
      await new Promise<void>((resolve) => {
        oldRelease = resolve;
      });
    await route.fulfill({
      json: {
        status: 'ready',
        source: 'jev',
        products: [
          { productId: query === 'crunchy' ? 'sea-salt-chips' : 'house-coffee', weight: 0.9 },
        ],
        cached: false,
      },
    });
  });
  await page.goto('/');
  const input = page.getByRole('combobox', { name: 'Search the menu' });
  await input.fill('crunchy');
  await expect.poll(() => Boolean(oldRelease)).toBe(true);
  await input.fill('warm morning sip');
  await expect(page.getByRole('group', { name: 'AI suggestions' })).toContainText('House coffee');
  oldRelease!();
  await expect(page.getByRole('group', { name: 'AI suggestions' })).not.toContainText(
    'Sea salt chips',
  );
  await expect(input).toHaveValue('warm morning sip');
});

test('[UX-03] [UX-05] landing quick-add, collections, categories and reduced motion work', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Good things. On the go.' })).toBeVisible();
  await page.getByRole('button', { name: 'Quick add Sea salt chips' }).click();
  await expect(page.getByLabel('Sea salt chips quantity')).toHaveText('1');
  await page.getByRole('button', { name: /Crunch time/ }).click();
  await expect(page.getByRole('button', { name: 'Snacks', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(page.locator('.product-card')).toHaveCount(8);
  expect(
    await page.locator('.floating-0').evaluate((el) => getComputedStyle(el).animationName),
  ).toBe('none');
  await page.screenshot({ path: 'artifacts/screenshots/market-home.png', fullPage: true });
});

test('[AI-05] missing or unavailable AI leaves exact autocomplete and checkout available', async ({
  page,
}) => {
  await page.route('**/api/discovery', (route) =>
    route.fulfill({ json: { status: 'unavailable', source: 'jev', products: [], cached: false } }),
  );
  await page.goto('/');
  const input = page.getByRole('combobox', { name: 'Search the menu' });
  await input.fill('cola');
  await expect(page.getByRole('group', { name: 'Menu matches' })).toContainText('Classic cola');
  await expect(
    page.getByRole('status').filter({ hasText: 'AI suggestions are taking a break.' }),
  ).toBeVisible();
  await input.press('Escape');
  await expect(input).toHaveValue('cola');
  await page.getByRole('button', { name: 'Add Classic cola', exact: true }).click();
  await page.getByRole('button', { name: 'Review order', exact: true }).click();
  await page.getByRole('button', { name: /Place demo order/ }).click();
  await expect(page.getByRole('heading', { name: 'That’s a good choice.' })).toBeVisible();
});

test('[CK-11] [CK-13] starting another order clears saved intent before session-close network response', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Add Pesto focaccia', exact: true }).click();
  await page.getByRole('button', { name: 'Review order', exact: true }).click();
  await page.getByRole('button', { name: /Place demo order/ }).click();
  await expect(page.getByRole('heading', { name: 'That’s a good choice.' })).toBeVisible();
  let release: (() => void) | undefined;
  await page.route('**/api/sessions/close', async (route) => {
    await new Promise<void>((resolve) => {
      release = resolve;
    });
    await route.fulfill({ status: 204 });
  });
  await page.getByRole('button', { name: 'Start another order' }).click();
  await expect
    .poll(() => page.evaluate(() => sessionStorage.getItem('megafuji.checkout.v1')))
    .toBeNull();
  await expect.poll(() => Boolean(release)).toBe(true);
  release!();
  await page.reload();
  await expect(page.getByRole('button', { name: 'Review order', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'My orders', exact: true })).toBeEnabled();
});
