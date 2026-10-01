import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const pages = [
  ['home', '/'],
  ['stay', '/stay'],
  ['dining', '/dining'],
  ['showcase', '/showcase'],
] as const;

for (const theme of ['light', 'dark'] as const) {
  for (const [name, path] of pages) {
    test(`a11y: ${name} (${theme}) has no WCAG 2.1 AA violations`, async ({ page }) => {
      await page.addInitScript(
        (t) =>
          localStorage.setItem('ironwood-ui', JSON.stringify({ state: { theme: t }, version: 0 })),
        theme,
      );
      await page.goto(path);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await page.waitForLoadState('networkidle');
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();
      expect(results.violations).toEqual([]);
    });
  }
}

test('skip link is the first tab stop and moves focus to main content', async ({ page }) => {
  await page.goto('/');
  // The SPA must have mounted before keyboard input is meaningful.
  await page.getByRole('heading', { level: 1 }).first().waitFor();
  await page.keyboard.press('Tab');
  const skip = page.getByRole('link', { name: /skip to/i });
  await expect(skip).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#main')).toBeFocused();
});
