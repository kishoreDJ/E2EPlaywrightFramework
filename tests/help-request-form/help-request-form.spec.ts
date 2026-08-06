import * as fs from 'fs';
import * as path from 'path';
import { test, expect } from '../../src/fixtures/browser-fixture';

const uploadDir = path.resolve(__dirname, '..', '..', 'test-data', 'help-request-form-uploads');

function createTempFile(name: string, content: string): string {
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
  const filePath = path.join(uploadDir, name);
  fs.writeFileSync(filePath, content);
  return filePath;
}

// NOTE: the /Help Request Form folder has 3 Zephyr cases (DJCSS-T127, T129, T166). All 3
// verify the DJCSS web app directly and are automated here - nothing in this folder is
// blocked.
test.describe('Help Request Form', () => {
  test('DJCSS-T127: Verify unrestricted file upload is rejected on the Support Resource Request form', async ({
    loginPage,
    supportResourceRequestPage,
  }) => {
    await test.step('Login to DJCSS application', async () => {
      await loginPage.goto('/');
      await loginPage.login(process.env.DJCSS_USERNAME!, process.env.DJCSS_PASSWORD!);
    });

    await test.step('Open the Support Resource Request form', async () => {
      await supportResourceRequestPage.open();
    });

    await test.step('Attempt to upload an unsupported file type via the file chooser', async () => {
      const filePath = createTempFile('support-resource-malware.exe', 'fake exe content');
      await supportResourceRequestPage.uploadViaFileChooser(filePath);
    });

    // NOTE: unlike the Help Request/R&C profile update tabs (which show an explicit
    // "Your attachment file type is not supported" error), this form silently rejects
    // unsupported file types - no error text is shown and no file is attached. The
    // restriction is verified here by confirming the file was never attached.
    await test.step('Verify the unsupported file was not attached', async () => {
      const fileCount = await supportResourceRequestPage.getSelectedFileCount();
      expect(fileCount).toBe(0);
    });
  });

  test('DJCSS-T129: Verify unrestricted file upload is rejected on the Help Request tab', async ({
    loginPage,
    helpRequestFormPage,
  }) => {
    await test.step('Login to DJCSS application', async () => {
      await loginPage.goto('/');
      await loginPage.login(process.env.DJCSS_USERNAME!, process.env.DJCSS_PASSWORD!);
    });

    await test.step('Open the Help Request form', async () => {
      await helpRequestFormPage.open();
    });

    await test.step('Attempt to upload an unsupported file type', async () => {
      const filePath = createTempFile('help-request-malware.exe', 'fake exe content');
      await helpRequestFormPage.uploadAttachment(filePath);
    });

    await test.step('Verify the unsupported file type error message is shown', async () => {
      await expect(helpRequestFormPage.attachmentErrorMessage).toBeVisible();
    });
  });

  test('DJCSS-T166: Verify Product Area dropdown reflects updated product names for Global Risk Insights', async ({
    loginPage,
    helpRequestFormPage,
  }) => {
    await test.step('Login to DJCSS application', async () => {
      await loginPage.goto('/');
      await loginPage.login(process.env.DJCSS_USERNAME!, process.env.DJCSS_PASSWORD!);
    });

    await test.step('Open the Help Request form and select Global Risk Insights as Product', async () => {
      await helpRequestFormPage.open();
      await helpRequestFormPage.selectProduct('Global Risk Insights');
    });

    await test.step('Verify the Product Area dropdown shows the updated product names', async () => {
      const options = await helpRequestFormPage.getProductAreaOptions();
      for (const expected of [
        'Dragonfly',
        'OA/DF Advisory Services',
        'OA/DF CoPilot',
        'Oxford Analytica Daily Brief',
        'Oxford Analytica GRM',
      ]) {
        expect(options).toContain(expected);
      }
    });
  });
});
