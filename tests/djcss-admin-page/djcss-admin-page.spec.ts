import { test, expect } from '../../src/fixtures/browser-fixture';

// NOTE: the /DJCSS-Admin Page folder has 2 Zephyr cases, both blocked:
//   - DJCSS-T69: Add product to product status page
//   - DJCSS-T70: Remove product from the product status page
// Both require adding/removing a product via the Alfresco CMS admin interface, which this
// framework has no credentials or integration for, and would also mutate shared QA product
// status data used by other tests. Neither is automatable from the DJCSS web app alone.
test.describe.skip('DJCSS-Admin Page - blocked, see NOTE above', () => {});

test.describe('Administration Page - availability', { tag: '@regression' }, () => {
  test('Verify the Administration page is up', { tag: '@smoke' }, async ({
    loginPage,
    administrationPage,
  }) => {
    await test.step('Login to DJCSS application', async () => {
      await loginPage.goto('/');
      await loginPage.login(process.env.DJCSS_USERNAME!, process.env.DJCSS_PASSWORD!);
    });

    await test.step('Navigate to the Administration page', async () => {
      await administrationPage.open();
    });

    await test.step('Verify the Administration page loaded successfully', async () => {
      await expect(administrationPage.getHeading()).toBeVisible();
      expect(administrationPage.getUrl()).toContain('/administration');
      expect(await administrationPage.getTitle()).toContain('Administration');
    });
  });
});
