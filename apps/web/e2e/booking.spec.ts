import { expect, test } from '@playwright/test';

test('guest can search, reserve and receive a confirmation', async ({ page }) => {
  await page.goto('/stay');
  await expect(page.getByRole('heading', { name: 'Find your suite' })).toBeVisible();

  await page
    .getByRole('link', { name: /^Reserve/ })
    .first()
    .click();
  await expect(page.getByRole('heading', { name: 'Guest details' })).toBeVisible();

  // Validation errors are announced and focus moves to the summary.
  await page.getByRole('button', { name: /confirm|reserve|book/i }).click();
  await expect(page.getByRole('alert').first()).toBeVisible();

  await page.getByLabel('First name').fill('Ada');
  await page.getByLabel('Last name').fill('Lovelace');
  await page.getByLabel('Email').fill('ada@example.com');
  await page.getByRole('button', { name: /confirm|reserve|book/i }).click();

  await expect(page.getByTestId('confirmation-id')).toBeVisible();
});
