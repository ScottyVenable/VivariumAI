import { test } from '@playwright/test';
import { createTimeline, deleteTimeline } from './helpers/timeline';

test('capture UI audit screenshots for home and timeline views', async ({ page, request }, testInfo) => {
  const suffix = testInfo.project.name.toLowerCase().replace(/\s+/g, '-');
  const timeline = await createTimeline(request, `UI Audit ${suffix}`, 20);

  try {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(400);

    await page.screenshot({
      path: `test-results/ui-audit-${suffix}-home.png`,
      fullPage: true,
    });

    await page.getByRole('button', { name: /new timeline/i }).click();
    await page.waitForTimeout(250);

    await page.screenshot({
      path: `test-results/ui-audit-${suffix}-home-create-modal.png`,
      fullPage: true,
    });

    await page.getByRole('button', { name: /^cancel$/i }).click();

    await page.goto(`/timeline/${timeline.id}`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(600);

    await page.screenshot({
      path: `test-results/ui-audit-${suffix}-timeline.png`,
      fullPage: true,
    });

    await page.locator('button[title="God Mode Dashboard"]').click();
    await page.waitForTimeout(250);

    await page.screenshot({
      path: `test-results/ui-audit-${suffix}-timeline-godmode.png`,
      fullPage: true,
    });
  } finally {
    await deleteTimeline(request, timeline.id);
  }
});
