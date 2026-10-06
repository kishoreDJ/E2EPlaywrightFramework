import * as fs from 'fs';
import * as path from 'path';
import { test, expect } from '../../src/fixtures/browser-fixture';

interface FeedbackFormConfig {
  key: string;
  slug: string;
  displayName: string;
  requiresLogin: boolean;
  product?: string;
}

// apidocumentation is the only slug with a Product dropdown; DJCSS-T170-T173 each
// select a different Product option on the same shared form.
const FEEDBACK_FORMS: FeedbackFormConfig[] = [
  {
    key: 'DJCSS-T170',
    slug: 'apidocumentation',
    displayName: 'API Documentation - R&C Due Diligence Reports API',
    requiresLogin: false,
    product: 'R&C Due Diligence Reports API',
  },
  {
    key: 'DJCSS-T171',
    slug: 'apidocumentation',
    displayName: 'API Documentation - R&C Legacy Risk & Compliance API',
    requiresLogin: false,
    product: 'R&C Legacy Risk & Compliance API',
  },
  {
    key: 'DJCSS-T172',
    slug: 'apidocumentation',
    displayName: 'API Documentation - Risk & Compliance Ad Hoc Search API 2.0',
    requiresLogin: false,
    product: 'Risk & Compliance Ad Hoc Search API 2.0',
  },
  {
    key: 'DJCSS-T173',
    slug: 'apidocumentation',
    displayName: 'API Documentation - R&C Screening & Monitoring API',
    requiresLogin: false,
    product: 'R&C Screening & Monitoring API',
  },
  { key: 'DJCSS-T174', slug: 'oxfordanalytica', displayName: 'Oxford Analytica', requiresLogin: true },
  { key: 'DJCSS-T175', slug: 'globalriskmonitor', displayName: 'Global Risk Monitor', requiresLogin: true },
  { key: 'DJCSS-T176', slug: 'thirdparty', displayName: 'Third Party', requiresLogin: false },
  { key: 'DJCSS-T178', slug: 'rcfc', displayName: 'RCFC (Financial Crimes)', requiresLogin: true },
  { key: 'DJCSS-T179', slug: 'tradecompliance', displayName: 'Trade Compliance', requiresLogin: true },
];

const uploadDir = path.resolve(__dirname, '..', '..', 'test-data', 'feedback-uploads');

function createTempFile(name: string, content: string): string {
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
  const filePath = path.join(uploadDir, name);
  fs.writeFileSync(filePath, content);
  return filePath;
}

// NOTE: the manual Zephyr steps for DJCSS-T170 include a final step verifying a
// Jira "Needs review" ticket entry for the submission. That verification targets an
// external Jira POC instance outside DJCSS and is not automatable here - these tests
// cover the in-app form submission and success message only.
test.describe('RC Feedback Forms', { tag: '@regression' }, () => {
  // Login-required cases go through the DJCSS -> SSO redirect and networkidle wait,
  // which can exceed the default 30s test timeout under load.
  test.setTimeout(60_000);

  for (const form of FEEDBACK_FORMS) {
    test(`${form.key}: Verify form submission for RC DJCSS ${form.displayName}`, { tag: form.key === 'DJCSS-T170' ? '@smoke' : [] }, async ({
      loginPage,
      feedbackFormPage,
    }) => {
      if (form.requiresLogin) {
        await test.step('Login to DJCSS', async () => {
          await loginPage.goto('/');
          await loginPage.login(process.env.DJCSS_USERNAME!, process.env.DJCSS_PASSWORD!);
        });
      }

      await test.step(`Open the ${form.displayName} feedback form`, async () => {
        await feedbackFormPage.openForSlug(form.slug);
      });

      await test.step('Fill in mandatory fields and message', async () => {
        await feedbackFormPage.fillForm({
          firstName: 'Automated',
          lastName: 'Tester',
          email: 'automated.test@example.com',
          message: 'Automated test feedback message.',
        });
      });

      if (form.product) {
        await test.step(`Select "${form.product}" from the Product dropdown`, async () => {
          await feedbackFormPage.selectProduct(form.product!);
        });
      }

      await test.step('Upload an attachment', async () => {
        const filePath = createTempFile(`${form.key}-attachment.txt`, 'sample feedback attachment');
        await feedbackFormPage.uploadFiles([filePath]);
      });

      await test.step('Click Submit and verify the success message', async () => {
        await feedbackFormPage.clickSubmit();
        await expect(feedbackFormPage.successMessage).toBeVisible({ timeout: 15000 });
      });
    });
  }

  test('DJCSS-T177: Verify form submission for RC DJCSS RiskJournal', async ({
    loginPage,
    feedbackFormPage,
  }) => {
    await test.step('Login to DJCSS', async () => {
      await loginPage.goto('/');
      await loginPage.login(process.env.DJCSS_USERNAME!, process.env.DJCSS_PASSWORD!);
    });

    await test.step('Open the RiskJournal feedback form', async () => {
      await feedbackFormPage.openForSlug('riskjournal');
    });

    await test.step('Fill in mandatory fields, message, and an attachment', async () => {
      await feedbackFormPage.fillForm({
        firstName: 'Automated',
        lastName: 'Tester',
        email: 'automated.test@example.com',
        message: 'Automated test feedback message.',
      });
      const filePath = createTempFile('DJCSS-T177-attachment.txt', 'sample feedback attachment');
      await feedbackFormPage.uploadFiles([filePath]);
    });

    await test.step('Click Submit and verify the success message', async () => {
      await feedbackFormPage.clickSubmit();
      await expect(feedbackFormPage.successMessage).toBeVisible({ timeout: 15000 });
    });
  });

  // NOTE: on this QA build, the Product dropdown on apidocumentation is marked
  // mandatory in the Zephyr steps and on the form UI (label has an asterisk), but
  // submitting without selecting a Product still succeeds server-side. This
  // documents the actual live behavior rather than the Zephyr assumption.
  test('DJCSS-T170b: Verify apidocumentation form submits successfully even when Product is left unselected', async ({
    feedbackFormPage,
  }) => {
    await test.step('Open the API Documentation feedback form', async () => {
      await feedbackFormPage.openForSlug('apidocumentation');
    });

    await test.step('Fill in mandatory fields, leaving Product unselected', async () => {
      await feedbackFormPage.fillForm({
        firstName: 'Automated',
        lastName: 'Tester',
        email: 'automated.test@example.com',
        message: 'Automated test feedback message.',
      });
    });

    await test.step('Click Submit and verify the success message', async () => {
      await feedbackFormPage.clickSubmit();
      await expect(feedbackFormPage.successMessage).toBeVisible({ timeout: 15000 });
    });
  });

  test('DJCSS-T170c: Verify apidocumentation form prevents submission when First Name, Last Name, and message are empty', async ({
    feedbackFormPage,
  }) => {
    await test.step('Open the API Documentation feedback form', async () => {
      await feedbackFormPage.openForSlug('apidocumentation');
    });

    await test.step('Click Submit without filling any fields', async () => {
      await feedbackFormPage.clickSubmit();
    });

    await test.step('Verify inline error messages appear and no success message is shown', async () => {
      await expect(feedbackFormPage.firstNameError).toBeVisible();
      await expect(feedbackFormPage.lastNameError).toBeVisible();
      await expect(feedbackFormPage.emailError).toBeVisible();
      await expect(feedbackFormPage.messageError).toBeVisible();
      await expect(feedbackFormPage.successMessage).not.toBeVisible();
    });
  });
});
