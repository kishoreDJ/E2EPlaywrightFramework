import { test, expect } from '../../src/fixtures/browser-fixture';

// NOTE: the /DJ Yomiuri Standalone folder has 1 Zephyr case (DJCSS-T151), verifying the
// DJCSS web app directly, automated here.
test.describe('DJ Yomiuri Standalone', () => {
  test('DJCSS-T151: Verify DJ Yomiuri logo is displayed correctly across viewport sizes', async ({
    loginPage,
    yomiuriPage,
    pooledPage,
  }) => {
    await test.step('Login to DJCSS application', async () => {
      await loginPage.goto('/');
      await loginPage.login(process.env.DJCSS_USERNAME!, process.env.DJCSS_PASSWORD!);
    });

    await test.step('Navigate to the DJ Yomiuri Standalone page', async () => {
      await yomiuriPage.open();
    });

    for (const size of [
      { width: 1920, height: 1080 },
      { width: 768, height: 1024 },
      { width: 375, height: 667 },
    ]) {
      await test.step(`Verify the logo is visible at ${size.width}x${size.height}`, async () => {
        await pooledPage.setViewportSize(size);
        await expect(yomiuriPage.logo).toBeVisible();
      });
    }
  });
});
