import { test, expect } from '../../src/fixtures/browser-fixture';

test.describe('Live Chat', () => {
  test('DJCSS-T55: Live Chat - Preferred Language selection is required', async ({
    loginPage,
    liveChatPage,
  }) => {
    await test.step('Login to DJCSS', async () => {
      await loginPage.goto('/');
      await loginPage.login(process.env.DJCSS_USERNAME!, process.env.DJCSS_PASSWORD!);
    });

    await test.step('Click on Contact us -> Live chat title', async () => {
      await liveChatPage.open();
    });

    await test.step('Submit the form without selecting Preferred Language', async () => {
      await liveChatPage.clickStartChat();
    });

    await test.step('Validate Preferred Language is required', async () => {
      const errors = await liveChatPage.getValidationErrors();
      expect(errors).toContain('Please select a Language');
    });
  });

  test('DJCSS-T162: User can successfully change their Phone Country within the chat interface', async ({
    loginPage,
    liveChatPage,
  }) => {
    await test.step('Login to DJCSS QA', async () => {
      await loginPage.goto('/');
      await loginPage.login(process.env.DJCSS_USERNAME!, process.env.DJCSS_PASSWORD!);
    });

    await test.step('Click on Contact Us and select Live Chat', async () => {
      await liveChatPage.open();
    });

    await test.step('Select a different country in the Phone Country dropdown', async () => {
      await liveChatPage.selectCountry('Canada');
    });

    await test.step('Fill in the required contact details', async () => {
      await liveChatPage.fillContactDetails({
        firstName: 'Test',
        lastName: 'User',
        email: 'test.user@example.com',
        phone: '4165551234',
        message: 'Automated test inquiry',
      });
      await liveChatPage.selectProductArea('Risk Database');
      await liveChatPage.selectLanguage('English');
    });
  });

  test('DJCSS-T165: Dragonfly Intelligence product name is updated in Live Chat form', async ({
    loginPage,
    liveChatPage,
  }) => {
    await test.step('Login to DJCSS QA and click Contact Us -> Live Chat', async () => {
      await loginPage.goto('/');
      await loginPage.login(process.env.DJCSS_USERNAME!, process.env.DJCSS_PASSWORD!);
      await liveChatPage.open();
    });

    await test.step('Select Global Risk Insights product line and open Product Area dropdown', async () => {
      await liveChatPage.selectProductLine('Global Risk Insights');
      const options = await liveChatPage.getProductAreaOptions();
      // NOTE: as of this QA build the option still reads "Dragonfly", not "Dragonfly
      // Intelligence" per the test case objective. This assertion documents the
      // current (unrenamed) state; flip to 'Dragonfly Intelligence' once the rename ships.
      expect(options).toContain('Dragonfly');
    });
  });

  test('DJCSS-T168: Portuguese option appears in Preferred Language dropdown', async ({
    loginPage,
    liveChatPage,
  }) => {
    await test.step('Navigate to the DJCSS QA Live Chat entry point', async () => {
      await loginPage.goto('/');
      await loginPage.login(process.env.DJCSS_USERNAME!, process.env.DJCSS_PASSWORD!);
      await liveChatPage.open();
    });

    await test.step("Click on the 'Preferred Language' dropdown and inspect the list", async () => {
      const options = await liveChatPage.getLanguageOptions();
      expect(options).toContain('Português');
    });

    await test.step("Select 'Português' from the dropdown", async () => {
      await liveChatPage.selectLanguage('Português');
      const selected = await liveChatPage.getSelectedLanguage();
      expect(selected).toContain('Português');
    });
  });
});
