const { chromium } = require('playwright');

(async () => {
  require('dotenv').config({ path: '.env.djcss' });
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  await page.goto(process.env.DJCSS_BASE_URL);
  await page.locator('#email').fill(process.env.DJCSS_USERNAME);
  await page.locator('#password-form-item').fill(process.env.DJCSS_PASSWORD);
  await page.locator('#signin-btn').click();
  await page.waitForLoadState('networkidle');

  await page.getByText('Advanced search', { exact: false }).first().click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'advanced-search-open.png', fullPage: true });

  const checkboxes = await page.locator('[role="checkbox"]').all();
  const labels = [];
  for (const cb of checkboxes) {
    const label = await cb.getAttribute('aria-label');
    if (label) labels.push(label);
  }
  console.log('Product filter checkboxes found:', JSON.stringify(labels, null, 2));

  await browser.close();
})();
