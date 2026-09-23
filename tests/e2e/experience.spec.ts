import { test, expect } from '@playwright/test';

test('[UX-07] sound preview produces a measurable signal and volume survives reload', async ({
  page,
}) => {
  await page.addInitScript(() => {
    const observations = { peak: 0, contexts: 0 };
    Object.assign(window, { audioProof: observations });
    const Original = window.AudioContext;
    window.AudioContext = class extends Original {
      constructor(options?: AudioContextOptions) {
        super(options);
        observations.contexts++;
      }
      override createGain() {
        const gain = super.createGain();
        const connect = gain.connect.bind(gain);
        const analyser = this.createAnalyser();
        analyser.fftSize = 256;
        const samples = new Float32Array(analyser.fftSize);
        gain.connect = ((destination: AudioNode) => {
          if (destination === this.destination) {
            connect(analyser);
            analyser.connect(destination);
            return destination;
          }
          return connect(destination);
        }) as typeof gain.connect;
        const timer = setInterval(() => {
          analyser.getFloatTimeDomainData(samples);
          for (const sample of samples)
            observations.peak = Math.max(observations.peak, Math.abs(sample));
        }, 5);
        setTimeout(() => {
          clearInterval(timer);
          analyser.disconnect();
        }, 1200);
        return gain;
      }
    };
  });
  await page.goto('/');
  expect(await page.evaluate(() => (window as any).audioProof.contexts)).toBe(0);
  await page.getByLabel('Sound settings', { exact: true }).click();
  await page.getByLabel('Volume').fill('75');
  await page.getByRole('button', { name: 'Test sound' }).click();
  await expect
    .poll(() => page.evaluate(() => (window as any).audioProof.peak))
    .toBeGreaterThan(0.015);
  await expect(page.getByRole('status').filter({ hasText: 'Sound played' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Make yourself happy.' })).toBeVisible();
  await page.reload();
  await page.getByLabel('Sound settings', { exact: true }).click();
  await expect(page.getByLabel('Volume')).toHaveValue('75');
  await page.getByLabel('Volume').fill('0');
  await expect(page.getByRole('button', { name: 'Test sound' })).toBeDisabled();
});

test('[UX-06] game invitation moves its illustration, keeps its link stable and respects reduced motion', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  const link = page.getByRole('link', { name: /Play Mashgin Market/ });
  await expect(link).toHaveAttribute('href', 'https://game.megamashgin.top/');
  await expect(link).toHaveAttribute('target', '_blank');
  await link.scrollIntoViewIfNeeded();
  const positions = await page.locator('.game-invitation').evaluate(async (el) => {
    const shopper = el.querySelector('.mini-shopper')!;
    const link = el.querySelector('a')!;
    const first = {
      shopper: shopper.getBoundingClientRect().x,
      link: link.getBoundingClientRect().x,
    };
    await new Promise((resolve) => setTimeout(resolve, 350));
    return {
      first,
      next: { shopper: shopper.getBoundingClientRect().x, link: link.getBoundingClientRect().x },
    };
  });
  expect(Math.abs(positions.first.shopper - positions.next.shopper)).toBeGreaterThan(1);
  expect(positions.first.link).toBe(positions.next.link);
  await page.getByRole('button', { name: 'Pause animation' }).click();
  await expect(page.locator('.mini-shopper').first()).toHaveCSS('animation-play-state', 'paused');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.locator('.mini-shopper').first()).toHaveCSS('animation-name', 'none');
  await expect(link).toBeVisible();
});
