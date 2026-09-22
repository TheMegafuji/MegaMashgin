import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
test('[UX-01] automated accessibility checks cover menu, review and receipt', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Add Pesto focaccia', exact: true }).click();
  const menu = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(menu.violations).toEqual([]);
  await page.getByRole('button', { name: 'Review order', exact: true }).click();
  const review = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
  expect(review.violations).toEqual([]);
  await page.getByRole('button', { name: /Place demo order/ }).click();
  await expect(page.getByRole('heading', { name: 'That’s a good choice.' })).toBeVisible();
  const receipt = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
  expect(receipt.violations).toEqual([]);
});
