import * as fs from 'fs';
import * as path from 'path';
import { test, expect } from '../../src/fixtures/browser-fixture';

const uploadDir = path.resolve(__dirname, '..', '..', 'test-data', 'rc-product-update-uploads');

function createTempFile(name: string, content: string): string {
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
  const filePath = path.join(uploadDir, name);
  fs.writeFileSync(filePath, content);
  return filePath;
}

// NOTE: the /Risk&Compliance Product Update folder has 2 Zephyr cases total (DJCSS-T57,
// DJCSS-T125). Both verify the DJCSS web app directly and are automated here - nothing in
// this folder is blocked.
test.describe('Risk & Compliance Product Update', { tag: '@regression' }, () => {
  test('DJCSS-T57: Verify Dow Jones Risk Journal is listed under the Product section', { tag: '@smoke' }, async ({
    loginPage,
    rcProductUpdatePage,
  }) => {
    await test.step('Login to DJCSS application', async () => {
      await loginPage.goto('/');
      await loginPage.login(process.env.DJCSS_USERNAME!, process.env.DJCSS_PASSWORD!);
    });

    await test.step('Navigate to the R&C Product Update page', async () => {
      await rcProductUpdatePage.open();
    });

    await test.step('Verify Dow Jones Risk Journal is visible under the Product filter section', async () => {
      await expect(rcProductUpdatePage.riskJournalLabel).toBeVisible();
    });
  });

  test('DJCSS-T125: Verify unrestricted file upload is rejected on the R&C profile update tab', async ({
    loginPage,
    helpRequestFormPage,
  }) => {
    await test.step('Login to DJCSS application', async () => {
      await loginPage.goto('/');
      await loginPage.login(process.env.DJCSS_USERNAME!, process.env.DJCSS_PASSWORD!);
    });

    await test.step('Open the Help Request form and switch to the R&C profile update tab', async () => {
      await helpRequestFormPage.open();
      await helpRequestFormPage.openRcProfileUpdateTab();
    });

    await test.step('Attempt to upload an unsupported file type', async () => {
      const filePath = createTempFile('rc-profile-update-malware.exe', 'MZ fake exe content');
      await helpRequestFormPage.uploadAttachment(filePath);
    });

    await test.step('Verify the unsupported file type error message is shown', async () => {
      await expect(helpRequestFormPage.attachmentErrorMessage).toBeVisible();
    });
  });
});
