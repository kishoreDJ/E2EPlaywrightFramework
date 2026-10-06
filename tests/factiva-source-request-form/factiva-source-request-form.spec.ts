import { test, expect } from '../../src/fixtures/browser-fixture';

// NOTE: the /Factiva Source Request Form folder has 1 Zephyr case (DJCSS-T56), verifying
// the DJCSS web app directly, automated here.
test.describe('Factiva Source Request Form', { tag: '@regression' }, () => {
  test('DJCSS-T56: Verify Source Name field enforces a 160 character limit', { tag: '@smoke' }, async ({
    loginPage,
    helpRequestFormPage,
  }) => {
    await test.step('Login to DJCSS application', async () => {
      await loginPage.goto('/');
      await loginPage.login(process.env.DJCSS_USERNAME!, process.env.DJCSS_PASSWORD!);
    });

    await test.step('Open the Factiva Source Request tab', async () => {
      await helpRequestFormPage.open();
      await helpRequestFormPage.openFactivaSourceRequestTab();
    });

    await test.step('Type 200 characters into the Source Name field', async () => {
      await helpRequestFormPage.fillField('sourceName', 'A'.repeat(200));
    });

    await test.step('Verify the value is truncated to 160 characters', async () => {
      const value = await helpRequestFormPage.getFieldValue('sourceName');
      expect(value.length).toBe(160);
    });
  });
});
