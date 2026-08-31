import { test, expect } from '../../src/fixtures/browser-fixture';

// NOTE: the /Logo Updates folder has 16 Zephyr cases total. 13 of them (DJCSS-T97,
// T99-T104, T107-T110, T121) require creating/publishing articles in Alfresco CMS and
// verifying email templates via Campaign Monitor subscribers - external systems this
// framework has no credentials or integration for. Only the 3 cases below verify the
// DJCSS web app directly and are automated here. The rest are blocked pending
// Alfresco/Campaign Monitor access.
test.describe('Logo Updates', () => {
  test('DJCSS-T95: Verify updated Top Left Site Logo on DJCSS', async ({ loginPage, homePage }) => {
    await test.step('Login to DJCSS application', async () => {
      await loginPage.goto('/');
      await loginPage.login(process.env.DJCSS_USERNAME!, process.env.DJCSS_PASSWORD!);
    });

    await test.step('Verify the top left site logo is displayed', async () => {
      await expect(homePage.headerLogo).toBeVisible();
    });
  });

  test('DJCSS-T96: Verify updated Footer Logo on DJCSS', async ({ loginPage, homePage }) => {
    await test.step('Login to DJCSS application', async () => {
      await loginPage.goto('/');
      await loginPage.login(process.env.DJCSS_USERNAME!, process.env.DJCSS_PASSWORD!);
    });

    await test.step('Verify the footer logo is displayed', async () => {
      await homePage.footerLogo.scrollIntoViewIfNeeded();
      await expect(homePage.footerLogo).toBeVisible();
    });
  });

  test('DJCSS-T98: Verify updated Favicon Logo', async ({ loginPage, homePage, faqPage }) => {
    await test.step('Login to DJCSS application', async () => {
      await loginPage.goto('/');
      await loginPage.login(process.env.DJCSS_USERNAME!, process.env.DJCSS_PASSWORD!);
    });

    const homeFavicon = await test.step('Verify the favicon is set on the Home page', async () => {
      const href = await homePage.getFaviconHref();
      expect(href).toBeTruthy();
      return href;
    });

    await test.step('Verify the favicon remains consistent when navigating to another page', async () => {
      await faqPage.open();
      const faqFavicon = await homePage.getFaviconHref();
      expect(faqFavicon).toBe(homeFavicon);
    });
  });
});
