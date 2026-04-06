import { chromium, devices } from 'playwright';

const baseURL = 'http://localhost:3000';

async function auditProject(name, deviceConfig) {
  const browser = await chromium.launch();
  const context = await browser.newContext({ ...deviceConfig });
  const page = await context.newPage();

  const createdTimeline = await context.request.post(`${baseURL}/api/timelines`, {
    data: {
      name: `UI Audit ${name}`,
      worldType: 'EARTH_MIRROR',
      initialBotCount: 20,
    },
  });
  const timeline = await createdTimeline.json();
  const timelineId = timeline.id;

  await page.goto(baseURL, { waitUntil: 'networkidle' });

  const homeMetrics = await page.evaluate(() => {
    const main = document.querySelector('main');
    const header = document.querySelector('header');
    const timelineCard = document.querySelector('a[href^="/timeline/"]');
    const styles = timelineCard ? window.getComputedStyle(timelineCard) : null;

    return {
      viewport: { width: window.innerWidth, height: window.innerHeight },
      mainBackground: main ? window.getComputedStyle(main).backgroundColor : null,
      headerBorder: header ? window.getComputedStyle(header).borderBottomColor : null,
      timelineCard: styles
        ? {
            background: styles.backgroundColor,
            borderRadius: styles.borderRadius,
            borderColor: styles.borderColor,
            padding: styles.padding,
          }
        : null,
      hasBottomNav: Boolean(document.querySelector('nav[aria-label="Bottom Navigation"], nav.bottom-nav, [data-mobile-nav]')),
    };
  });

  await page.getByRole('button', { name: /new timeline/i }).click();
  await page.waitForTimeout(200);

  const modalMetrics = await page.evaluate(() => {
    const dialog = document.querySelector('form')?.closest('div[class*="rounded"]');
    if (!dialog) return null;
    const styles = window.getComputedStyle(dialog);
    return {
      background: styles.backgroundColor,
      borderRadius: styles.borderRadius,
      borderColor: styles.borderColor,
      width: styles.width,
    };
  });

  const cancelButton = page.getByRole('button', { name: /^cancel$/i });
  if (await cancelButton.isVisible().catch(() => false)) {
    await cancelButton.click();
  } else {
    await page.keyboard.press('Escape');
  }

  await page.waitForTimeout(150);
  await context.request.post(`${baseURL}/api/timelines/${timelineId}/tick`);
  await context.request.post(`${baseURL}/api/timelines/${timelineId}/tick`);

  await page.goto(`${baseURL}/timeline/${timelineId}`, { waitUntil: 'networkidle' });
  await page.waitForLoadState('networkidle');

  const timelineMetrics = await page.evaluate(() => {
    const post = document.querySelector('main article');
    const postStyles = post ? window.getComputedStyle(post) : null;
    const pulseCard = document.querySelector('aside div[class*="rounded-2xl"]');
    const pulseStyles = pulseCard ? window.getComputedStyle(pulseCard) : null;

    const accentCandidates = Array.from(document.querySelectorAll('*')).filter((el) => {
      const c = window.getComputedStyle(el).color;
      return c.includes('rgb(168, 85, 247)') || c.includes('rgb(147, 51, 234)');
    }).length;

    return {
      postCard: postStyles
        ? {
            background: postStyles.backgroundColor,
            borderRadius: postStyles.borderRadius,
            borderColor: postStyles.borderColor,
          }
        : null,
      pulseCard: pulseStyles
        ? {
            background: pulseStyles.backgroundColor,
            borderRadius: pulseStyles.borderRadius,
            borderColor: pulseStyles.borderColor,
          }
        : null,
      purpleAccentElements: accentCandidates,
    };
  });

  await browser.close();

  return { name, homeMetrics, modalMetrics, timelineMetrics };
}

const desktop = await auditProject('desktop', { viewport: { width: 1440, height: 900 } });
const mobile = await auditProject('mobile', devices['Pixel 7']);

console.log(JSON.stringify({ desktop, mobile }, null, 2));
