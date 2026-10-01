import { expect, test } from '@playwright/test';

test('page stays usable when the content API fails (section-level error + retry)', async ({
  page,
}) => {
  await page.route('**/graphql/execute.json/**', (route) => route.fulfill({ status: 503 }));
  await page.goto('/dining');
  await expect(page.getByRole('alert').first()).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Primary' })).toBeVisible();
});
