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

  await page.goto(process.env.DJCSS_BASE_URL + 'notifications');
  await page.waitForLoadState('networkidle');
  const bodyText = await page.locator('body').innerText();
  console.log('Contains "Dragonfly Intelligence":', bodyText.includes('Dragonfly Intelligence'));
  console.log('Contains "Dragonfly":', bodyText.includes('Dragonfly'));
  await page.screenshot({ path: 'dragonfly-product-alerts.png', fullPage: true });

  await browser.close();
})();
