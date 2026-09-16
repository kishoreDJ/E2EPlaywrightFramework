const { chromium } = require('playwright');

(async () => {
  require('dotenv').config({ path: '.env.djcss' });
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage({ viewport: { width: 1600, height: 1200 } });

  await page.goto(process.env.ALFRESCO_BASE_URL + 'share/page/site/djcss/documentlibrary');
  console.log('Landed on:', page.url());
  await page.screenshot({ path: 'alfresco-01-landing.png' });

  // Try typical Alfresco Share login form
  const userInput = page.locator('#USERNAME, input[name="username"], #username');
  const passInput = page.locator('#PASSWORD, input[name="password"], #password');

  if (await userInput.count() > 0) {
    await userInput.first().fill(process.env.ALFRESCO_USERNAME);
    await passInput.first().fill(process.env.ALFRESCO_PASSWORD);
    await page.screenshot({ path: 'alfresco-02-filled.png' });
    await page.getByText('Sign In', { exact: true }).click();
    await page.waitForTimeout(3000);
  }

  console.log('After login attempt:', page.url());
  await page.screenshot({ path: 'alfresco-03-after-login.png', fullPage: true });

  // Search for Dragonfly-related content/naming across the whole site
  await page.locator('input[placeholder="Search files, people, sites"]').fill('dragonfly');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(3000);
  const searchResults = await page.locator('.filename a, .alfresco-search-result a').allTextContents();
  console.log('--- Search results for "dragonfly" ---');
  console.log(JSON.stringify(searchResults, null, 2));
  await page.screenshot({ path: 'alfresco-search-dragonfly.png', fullPage: true });

  await browser.close();
})();
