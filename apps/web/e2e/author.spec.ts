import { expect, test } from '@playwright/test';

test('author mode edits a content fragment inline and the change persists', async ({ page }) => {
  await page.goto('/?author=1');
  const headline = page.getByRole('button', { name: 'Edit Headline' });
  await headline.click();

  const dialog = page.getByRole('dialog');
  const field = dialog.getByLabel('Headline');
  const next = `Playwright headline ${Date.now()}`;
  await field.fill(next);
  await dialog.getByRole('button', { name: /save/i }).click();

  await expect(page.getByRole('heading', { level: 1 })).toContainText(next);
  await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toContainText(next);
});

test('UE instrumentation attributes are present', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('[data-aue-resource][data-aue-prop="title"]').first()).toBeVisible();
});
