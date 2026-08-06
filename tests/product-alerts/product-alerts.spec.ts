import { test, expect } from '../../src/fixtures/browser-fixture';

// NOTE: the /Product Alerts folder has 7 Zephyr cases total. DJCSS-T153-T156 and T164
// require creating/publishing articles in Alfresco CMS and verifying subscriber email
// templates via Campaign Monitor - external systems this framework has no credentials
// or integration for. Only DJCSS-T61 and DJCSS-T157 verify the DJCSS web app directly
// and are automated here. The rest are blocked pending Alfresco/Campaign Monitor access.
test.describe('Product Alerts', () => {
  test('DJCSS-T61: Verify Product filter Checkbox Menu items are present in the table', async ({
    loginPage,
    productAlertsPage,
  }) => {
    await test.step('Login to DJCSS application', async () => {
      await loginPage.goto('/');
      await loginPage.login(process.env.DJCSS_USERNAME!, process.env.DJCSS_PASSWORD!);
    });

    await test.step('Navigate to the Product Alerts (Notifications) page', async () => {
      await productAlertsPage.open();
    });

    await test.step('Verify a filter checkbox is present for each product', async () => {
      for (const productName of productAlertsPage.getProductNames()) {
        await expect(productAlertsPage.getFilterCheckbox(productName)).toBeVisible();
      }
    });
  });

  test('DJCSS-T157: Verify the updated Product container for Product Alert', async ({
    loginPage,
    productAlertsPage,
  }) => {
    await test.step('Login to DJCSS application', async () => {
      await loginPage.goto('/');
      await loginPage.login(process.env.DJCSS_USERNAME!, process.env.DJCSS_PASSWORD!);
    });

    await test.step('Navigate to the Product Alerts (Notifications) page', async () => {
      await productAlertsPage.open();
    });

    await test.step('Verify every product name is fully visible without being clipped', async () => {
      for (const productName of productAlertsPage.getProductNames()) {
        const label = productAlertsPage.getProductLabel(productName);
        await expect(label).toBeVisible();
        const isOverflowing = await label.evaluate((el) => el.scrollWidth > el.clientWidth);
        expect(isOverflowing).toBe(false);
      }
    });
  });
});
