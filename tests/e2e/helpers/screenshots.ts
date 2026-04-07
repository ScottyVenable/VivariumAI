import type { Page, TestInfo } from '@playwright/test';

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function captureFlowScreenshot(
  page: Page,
  testInfo: TestInfo,
  label: string,
  fullPage = true
): Promise<void> {
  const fileName = `${slugify(testInfo.project.name)}-${slugify(label)}.png`;
  await page.screenshot({
    path: testInfo.outputPath(fileName),
    fullPage,
  });
}
