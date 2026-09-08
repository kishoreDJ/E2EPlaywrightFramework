import { test, expect } from '../../src/fixtures/browser-fixture';

// NOTE: the /Recycle folder has 7 Zephyr cases total. DJCSS-T85 and T86 duplicate the
// logo checks already covered in /Logo Updates (DJCSS-T95, T96) and are automated here.
// The remaining 5 (DJCSS-T90-T94) require creating/publishing articles in Alfresco CMS
// and verifying email templates via Campaign Monitor subscribers - external systems
// this framework has no credentials or integration for, and are blocked pending access.
test.describe('Recycle', { tag: '@regression' }, () => {
  test('DJCSS-T85: Verify updated Top Left Site Logo on DJCSS', async ({ loginPage, homePage }) => {
    await test.step('Login to DJCSS application', async () => {
      await loginPage.goto('/');
      await loginPage.login(process.env.DJCSS_USERNAME!, process.env.DJCSS_PASSWORD!);
    });

    await test.step('Verify the top left site logo is displayed', async () => {
      await expect(homePage.headerLogo).toBeVisible();
    });
  });

  test('DJCSS-T86: Verify updated Footer Logo on DJCSS', async ({ loginPage, homePage }) => {
    await test.step('Login to DJCSS application', async () => {
      await loginPage.goto('/');
      await loginPage.login(process.env.DJCSS_USERNAME!, process.env.DJCSS_PASSWORD!);
    });

    await test.step('Verify the footer logo is displayed', async () => {
      await homePage.footerLogo.scrollIntoViewIfNeeded();
      await expect(homePage.footerLogo).toBeVisible();
    });
  });
});
