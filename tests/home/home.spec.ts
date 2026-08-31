/// <reference types="node" />
import { test, expect } from '../../src/fixtures/browser-fixture';

// NOTE: the /Home folder has 1 Zephyr case (DJCSS-T167), verifying the DJCSS web app
// directly, automated here.
test.describe('Home', () => {
  test('DJCSS-T167: Verify Advanced Search product filter navigates to filtered results', async ({
    loginPage,
    homePage,
    pooledPage,
  }) => {
    await test.step('Login to DJCSS application', async () => {
      await loginPage.goto('/');
      await loginPage.login(process.env.DJCSS_USERNAME!, process.env.DJCSS_PASSWORD!);
    });

    await test.step('Open Advanced Search and select the Factiva product filter', async () => {
      await homePage.openAdvancedSearch();
      await homePage.selectProductFilter('Factiva');
    });

    await test.step('Click the Search button', async () => {
      await homePage.clickSearch();
    });

    await test.step('Verify navigation to the filtered learning FAQ list', async () => {
      await expect(pooledPage).toHaveURL(/\/learningFaq\/list\?product=factiva/);
    });
  });
});
