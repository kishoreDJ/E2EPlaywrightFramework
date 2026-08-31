import { test, expect } from '../../src/fixtures/browser-fixture';

test.describe('FAQ Navigation', () => {
  test('DJCSS-T105: Verify the FAQ URL redirection on FAQ Menu on the Navigation bar', async ({
    pooledPage,
    loginPage,
    faqPage,
  }) => {
    await test.step('Login into DJCSS', async () => {
      await loginPage.goto('/');
      await loginPage.login(process.env.DJCSS_USERNAME!, process.env.DJCSS_PASSWORD!);
    });

    await test.step('Click on FAQ Menu on the Navigation bar', async () => {
      await faqPage.open();
    });

    await test.step('Verify if the FAQ URL is redirected to the FAQ list page', async () => {
      await expect(pooledPage).toHaveURL(/\/faq\/list/);
      await expect(pooledPage).toHaveTitle(/FAQs/i);
    });
  });
});
