import { expect, test } from '@playwright/test';

test('home page supports the mobile-first timeline flow', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'V I V A R I U M' })).toBeVisible();
  await expect(page.getByText('Multi-agent social simulation engine')).toBeVisible();

  await page.getByRole('button', { name: /new timeline/i }).click();

  await expect(page.getByRole('heading', { name: /create new timeline/i })).toBeVisible();
  await expect(page.getByPlaceholder(/terra nova/i)).toBeVisible();
  await expect(page.getByRole('combobox').first()).toBeVisible();
});
