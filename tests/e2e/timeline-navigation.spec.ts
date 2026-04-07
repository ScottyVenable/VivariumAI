import { expect, test } from '@playwright/test';
import { captureFlowScreenshot } from './helpers/screenshots';
import { deleteTimeline } from './helpers/timeline';

test('supports timeline creation and control-surface navigation', async ({ page, request }, testInfo) => {
  const timelineName = `UI Flow ${testInfo.project.name}-${Date.now()}`;
  let timelineId = '';

  try {
    await page.goto('/');
    await captureFlowScreenshot(page, testInfo, 'timeline-nav-home');

    await page.getByRole('button', { name: /new timeline/i }).click();
    await expect(page.getByRole('heading', { name: /create new timeline/i })).toBeVisible();
    await captureFlowScreenshot(page, testInfo, 'timeline-nav-create-modal');

    await page.getByLabel('Timeline Name').fill(timelineName);
    await page.getByLabel('World Type').selectOption('SYNTHETIC_WORLD');

    const populationSlider = page.locator('input[type="range"]').first();
    await populationSlider.evaluate((element, value) => {
      const input = element as HTMLInputElement;
      input.value = value;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }, '18');

    await page.getByRole('button', { name: 'Create' }).click();
    await expect(page).toHaveURL(/\/timeline\/[^/]+$/);

    timelineId = page.url().split('/').pop() ?? '';

    await expect(page.getByRole('heading', { name: timelineName })).toBeVisible();
    await expect(page.getByPlaceholder("What's happening in your Vivarium?")).toBeVisible();
    await expect(page.getByText('Global Pulse')).toBeVisible();
    await expect(page.getByText('Trending in the Vivarium')).toBeVisible();
    await captureFlowScreenshot(page, testInfo, 'timeline-nav-timeline-loaded');

    await page.getByRole('button', { name: 'Latest' }).click();
    await page.getByRole('button', { name: 'For you' }).click();

    await page.locator('button[title="God Mode Dashboard"]').click();
    await expect(page.getByText('GOD MODE')).toBeVisible();
    await expect(page.getByText('Vibe Slider')).toBeVisible();
    await expect(page.getByText('Bot Management')).toBeVisible();
    await expect(page.getByRole('button', { name: /Play Simulation|Pause Simulation/ })).toBeVisible();
    await captureFlowScreenshot(page, testInfo, 'timeline-nav-godmode-open');

    await page.getByRole('button', { name: '×' }).click();
    await expect(page.getByText('GOD MODE')).toBeHidden();

    await page.locator('header a[href="/"]').click();
    await expect(page.getByRole('heading', { name: 'V I V A R I U M' })).toBeVisible();
    await expect(page.getByRole('link', { name: timelineName })).toBeVisible();
    await captureFlowScreenshot(page, testInfo, 'timeline-nav-home-return');
  } finally {
    if (timelineId) {
      await deleteTimeline(request, timelineId);
    }
  }
});