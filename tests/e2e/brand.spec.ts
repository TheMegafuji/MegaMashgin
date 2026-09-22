import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('[UX-06] [UX-08] warm drinks have distinct art and vapor that respects motion controls', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  await page.getByRole('button', { name: 'Coffee & cups', exact: true }).click();
  const warm = page.locator('.product-card.is-warm');
  await expect(warm).toHaveCount(6);
  await expect(page.locator('.product-card:not(.is-warm) .product-steam')).toHaveCount(0);
  const images = await page
    .locator('.product-card .product-art > img')
    .evaluateAll((imgs) => imgs.map((img) => (img as HTMLImageElement).src));
  expect(new Set(images).size).toBe(8);
  const vapor = warm.first().locator('.product-steam');
  await expect(vapor).toBeVisible();
  const bounds = await warm.first().evaluate((el) => {
    const card = el.getBoundingClientRect(),
      steam = el.querySelector('.product-steam')!.getBoundingClientRect();
    return {
      escapes: steam.top < card.top,
      overflow: getComputedStyle(el).overflow,
      pointerEvents: getComputedStyle(el.querySelector('.product-steam')!).pointerEvents,
    };
  });
  expect(bounds).toEqual({ escapes: true, overflow: 'visible', pointerEvents: 'none' });
  await page.getByRole('button', { name: 'Pause animation' }).click();
  await expect(vapor).toBeHidden();
  await page.getByRole('button', { name: 'Play animation' }).click();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(vapor).toBeHidden();
  const a11y = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(a11y.violations).toEqual([]);
  await page
    .locator('.menu-section')
    .screenshot({ path: 'artifacts/screenshots/coffee-variations.png' });
});

test('[UX-07] category audio starts only after accepted additions, mute persists and errors leave cart usable', async ({
  page,
}) => {
  await page.addInitScript(() => {
    const events: number[] = [];
    Object.assign(window, { soundNotes: events });
    const Original = window.AudioContext;
    class ObservedAudio extends Original {
      override createOscillator() {
        const oscillator = super.createOscillator();
        const set = oscillator.frequency.setValueAtTime.bind(oscillator.frequency);
        oscillator.frequency.setValueAtTime = (value: number, time: number) => {
          events.push(value);
          return set(value, time);
        };
        return oscillator;
      }
    }
    window.AudioContext = ObservedAudio;
  });
  const notes = () =>
    page.evaluate(() => (window as unknown as { soundNotes: number[] }).soundNotes);
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Mute cart sounds' })).toBeVisible();
  expect(await notes()).toEqual([]);
  await page.getByRole('button', { name: 'Quick add Sea salt chips' }).click();
  await expect.poll(notes).toEqual([520, 780]);
  await page.getByRole('button', { name: 'Coffee & cups', exact: true }).click();
  await page.getByRole('button', { name: 'Add House coffee', exact: true }).click();
  await expect.poll(notes).toEqual([520, 780, 440, 554, 659]);
  await page.getByRole('button', { name: 'Mute cart sounds' }).click();
  await page.getByRole('button', { name: 'Add Cappuccino', exact: true }).click();
  expect(await notes()).toHaveLength(5);
  await page.reload();
  await expect(page.getByRole('button', { name: 'Enable cart sounds' })).toHaveAttribute(
    'aria-pressed',
    'false',
  );
  expect(await notes()).toEqual([]);
  await page.getByRole('button', { name: 'Enable cart sounds' }).click();
  await page.getByRole('button', { name: 'Add one Sea salt chips', exact: true }).click();
  await expect.poll(notes).toEqual([520, 780]);
  await page.getByRole('button', { name: 'Remove one Sea salt chips', exact: true }).click();
  expect(await notes()).toHaveLength(2);
  await page.addInitScript(() => {
    window.AudioContext = class {
      constructor() {
        throw Error('Audio unavailable');
      }
    } as unknown as typeof AudioContext;
  });
  await page.reload();
  await page.getByRole('button', { name: 'Quick add Sea salt chips' }).click();
  await expect(page.getByLabel('Sea salt chips quantity')).toHaveText('2');
});

test('[UX-09] [OPS-04] press kit downloads and metadata are available without pretending to be a public deployment', async ({
  page,
  request,
}) => {
  await page.goto('/');
  await expect(page).toHaveTitle('Mashgin Market — Checkout concept by Megafuji');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex,follow');
  await page.getByRole('link', { name: 'Press & brand kit' }).click();
  await expect(
    page.getByRole('heading', { name: 'One little market. A considered experience.' }),
  ).toBeVisible();
  const download = page.waitForEvent('download');
  await page.getByRole('link', { name: 'Download the brand kit' }).click();
  expect((await download).suggestedFilename()).toBe('mashgin-market-press-kit.zip');
  expect((await request.get('/brand/social-card.png')).headers()['content-type']).toContain(
    'image/png',
  );
  expect(await (await request.get('/robots.txt')).text()).toContain('Disallow: /');
  expect((await request.get('/made-up-page')).status()).toBe(404);
  const a11y = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(a11y.violations).toEqual([]);
  await page.screenshot({ path: 'artifacts/screenshots/press-kit.png', fullPage: true });
});
