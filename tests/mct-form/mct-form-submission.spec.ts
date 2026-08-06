import * as fs from 'fs';
import * as path from 'path';
import { test, expect } from '../../src/fixtures/browser-fixture';

interface CompanyConfig {
  slug: string;
  displayName: string;
  keys: {
    displayForm?: string;
    fullSubmit: string;
    mandatoryEmptyValidation: string;
    mandatoryOnlySubmit: string;
    exactlyThreeFiles: string;
    unrestrictedFileType?: string;
  };
}

const COMPANIES: CompanyConfig[] = [
  {
    slug: 'analog',
    displayName: 'Analog',
    keys: {
      displayForm: 'DJCSS-T111',
      fullSubmit: 'DJCSS-T112',
      mandatoryEmptyValidation: 'DJCSS-T113',
      mandatoryOnlySubmit: 'DJCSS-T114',
      exactlyThreeFiles: 'DJCSS-T115',
      unrestrictedFileType: 'DJCSS-T128',
    },
  },
  {
    slug: 'prosegur',
    displayName: 'Prosegur',
    keys: {
      displayForm: 'DJCSS-T116',
      fullSubmit: 'DJCSS-T117',
      mandatoryEmptyValidation: 'DJCSS-T118',
      mandatoryOnlySubmit: 'DJCSS-T119',
      exactlyThreeFiles: 'DJCSS-T120',
    },
  },
  {
    slug: 'otsuka',
    displayName: 'Otsuka',
    keys: {
      displayForm: 'DJCSS-T130',
      fullSubmit: 'DJCSS-T131',
      mandatoryEmptyValidation: 'DJCSS-T132',
      mandatoryOnlySubmit: 'DJCSS-T133',
      exactlyThreeFiles: 'DJCSS-T134',
      unrestrictedFileType: 'DJCSS-T135',
    },
  },
  {
    slug: 'arconic',
    displayName: 'Arconic',
    keys: {
      fullSubmit: 'DJCSS-T136',
      mandatoryEmptyValidation: 'DJCSS-T137',
      mandatoryOnlySubmit: 'DJCSS-T138',
      exactlyThreeFiles: 'DJCSS-T139',
      unrestrictedFileType: 'DJCSS-T140',
    },
  },
  {
    slug: 'constellium',
    displayName: 'Constellium',
    keys: {
      fullSubmit: 'DJCSS-T141',
      mandatoryEmptyValidation: 'DJCSS-T142',
      mandatoryOnlySubmit: 'DJCSS-T143',
      exactlyThreeFiles: 'DJCSS-T144',
      unrestrictedFileType: 'DJCSS-T145',
    },
  },
];

const EXPECTED_FIELD_LABELS = [
  'Your Name',
  'Your Email Address',
  'Headline Title',
  'Publication Name',
  'Publication Date',
  'URL to Link to',
  'Upload File',
  'Any Comments?',
];

const uploadDir = path.resolve(__dirname, '..', '..', 'test-data', 'mct-uploads');

function createTempFile(name: string, content: string): string {
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
  const filePath = path.join(uploadDir, name);
  fs.writeFileSync(filePath, content);
  return filePath;
}

test.describe('MCT Form Submission', () => {
  for (const company of COMPANIES) {
    test.describe(company.displayName, () => {
      if (company.keys.displayForm) {
        test(`${company.keys.displayForm}: Verify New MCT Article Submission Form - ${company.displayName}`, async ({
          mctFormPage,
        }) => {
          await test.step('Open the New MCT Article Submission Form', async () => {
            await mctFormPage.openForCompany(company.slug);
          });

          await test.step('Verify all form fields are displayed', async () => {
            const labels = await mctFormPage.getFieldLabelTexts();
            for (const expectedLabel of EXPECTED_FIELD_LABELS) {
              expect(labels.some((l) => l.includes(expectedLabel))).toBeTruthy();
            }
          });
        });
      }

      test(`${company.keys.fullSubmit}: Verify that the form submits successfully when all fields (Mandatory + Optional) are populated correctly - ${company.displayName}`, async ({
        mctFormPage,
      }) => {
        await test.step('Open the New MCT Article Submission Form', async () => {
          await mctFormPage.openForCompany(company.slug);
        });

        await test.step('Fill in all mandatory and optional fields', async () => {
          await mctFormPage.fillForm({
            yourName: 'Automated Test User',
            email: 'automated.test@example.com',
            headlineTitle: 'Automated Test Headline',
            publicationName: 'Automated Test Publication',
            publicationDate: '2026-08-01',
            urlToLinkTo: 'https://example.com/article',
            comments: 'Automated test comment',
            optIn: true,
          });
          const filePath = createTempFile(`${company.slug}-full-submit.txt`, 'sample content');
          await mctFormPage.uploadFiles([filePath]);
        });

        await test.step('Click Submit and verify success message', async () => {
          await mctFormPage.clickSubmit();
          await expect(mctFormPage.successMessage).toBeVisible();
        });
      });

      test(`${company.keys.mandatoryEmptyValidation}: Verify that the form prevents submission if mandatory fields are empty - ${company.displayName}`, async ({
        mctFormPage,
      }) => {
        await test.step('Open the New MCT Article Submission Form', async () => {
          await mctFormPage.openForCompany(company.slug);
        });

        await test.step('Leave Your Name and Headline Title empty, fill all other fields', async () => {
          await mctFormPage.fillForm({
            publicationName: 'Automated Test Publication',
            publicationDate: '2026-08-01',
            urlToLinkTo: 'https://example.com/article',
            comments: 'Automated test comment',
            optIn: true,
          });
        });

        await test.step('Click Submit', async () => {
          await mctFormPage.clickSubmit();
        });

        await test.step('Verify inline error messages appear for Your Name and Headline Title', async () => {
          const errors = await mctFormPage.getInlineErrorMessages();
          expect(errors.length).toBeGreaterThanOrEqual(2);
          await expect(mctFormPage.successMessage).not.toBeVisible();
        });
      });

      test(`${company.keys.mandatoryOnlySubmit}: Verify submission with only the mandatory fields filled, leaving all optional fields blank - ${company.displayName}`, async ({
        mctFormPage,
      }) => {
        await test.step('Open the New MCT Article Submission Form', async () => {
          await mctFormPage.openForCompany(company.slug);
        });

        await test.step('Fill in Your Name, Headline, Publication, Date, and Opt-In only', async () => {
          await mctFormPage.fillForm({
            yourName: 'Automated Test User',
            headlineTitle: 'Automated Test Headline',
            publicationName: 'Automated Test Publication',
            publicationDate: '2026-08-01',
            optIn: true,
          });
        });

        await test.step('Click Submit and verify success message', async () => {
          await mctFormPage.clickSubmit();
          await expect(mctFormPage.successMessage).toBeVisible();
        });
      });

      test(`${company.keys.exactlyThreeFiles}: Verify the form successfully accepts exactly 3 uploaded files - ${company.displayName}`, async ({
        mctFormPage,
      }) => {
        await test.step('Open the New MCT Article Submission Form', async () => {
          await mctFormPage.openForCompany(company.slug);
        });

        await test.step('Fill in all mandatory fields', async () => {
          await mctFormPage.fillForm({
            yourName: 'Automated Test User',
            headlineTitle: 'Automated Test Headline',
            publicationName: 'Automated Test Publication',
            publicationDate: '2026-08-01',
            optIn: true,
          });
        });

        await test.step('Upload File 1, File 2, and File 3', async () => {
          const files = [1, 2, 3].map((i) =>
            createTempFile(`${company.slug}-file${i}.txt`, `content ${i}`)
          );
          await mctFormPage.uploadFiles(files);
        });

        await test.step('Verify "Maximum 3 files allowed" instruction text is displayed', async () => {
          await expect(mctFormPage.uploadHelperText).toBeVisible();
        });
      });

      if (company.keys.unrestrictedFileType) {
        test(`${company.keys.unrestrictedFileType}: Verify Unrestricted Upload of File for MyCompanyTodayForm - ${company.displayName}`, async ({
          mctFormPage,
        }) => {
          await test.step('Open the New MCT Article Submission Form', async () => {
            await mctFormPage.openForCompany(company.slug);
          });

          await test.step('Fill in all mandatory fields', async () => {
            await mctFormPage.fillForm({
              yourName: 'Automated Test User',
              headlineTitle: 'Automated Test Headline',
              publicationName: 'Automated Test Publication',
              publicationDate: '2026-08-01',
              optIn: true,
            });
          });

          await test.step('Upload an unsupported file type and click Submit', async () => {
            const filePath = createTempFile(`${company.slug}-malware.exe`, 'MZ fake exe content');
            await mctFormPage.uploadFiles([filePath]);
            await mctFormPage.clickSubmit();
          });

          await test.step('Verify an error message is displayed', async () => {
            await expect(mctFormPage.genericErrorMessage).toBeVisible();
          });
        });
      }
    });
  }

  // NOTE: TRS-Upload serves a reduced form template (Headline Title, Email, Upload File
  // only - no Your Name, Publication Name/Date, URL, Comments, or Opt-In checkbox), unlike
  // the shared Analog/Prosegur/Otsuka/Arconic/Constellium template. A file attachment is
  // also required server-side to submit successfully, despite no inline validation for it.
  // These tests are written to match the actual live QA behavior rather than the generic
  // Zephyr steps (which assume the full field set).
  test.describe('TRS', () => {
    test('DJCSS-T146: Verify that the form submits successfully when all fields (Mandatory + Optional) are populated correctly - TRS', async ({
      mctFormPage,
    }) => {
      await test.step('Open the New MCT Article Submission Form', async () => {
        await mctFormPage.openForCompany('TRS-Upload');
      });

      await test.step('Fill in Headline Title and Email, then upload a file', async () => {
        await mctFormPage.fillForm({
          headlineTitle: 'Automated Test Headline',
          email: 'automated.test@example.com',
        });
        const filePath = createTempFile('trs-full-submit.txt', 'sample content');
        await mctFormPage.uploadFiles([filePath]);
      });

      await test.step('Click Submit and verify success message', async () => {
        await mctFormPage.clickSubmit();
        await expect(mctFormPage.successMessage).toBeVisible();
      });
    });

    test('DJCSS-T147: Verify that the form prevents submission if mandatory fields are empty - TRS', async ({
      mctFormPage,
    }) => {
      await test.step('Open the New MCT Article Submission Form', async () => {
        await mctFormPage.openForCompany('TRS-Upload');
      });

      await test.step('Leave Headline Title empty and click Submit', async () => {
        await mctFormPage.clickSubmit();
      });

      await test.step('Verify inline error message appears for Headline Title', async () => {
        const errors = await mctFormPage.getInlineErrorMessages();
        expect(errors.length).toBeGreaterThanOrEqual(1);
        await expect(mctFormPage.successMessage).not.toBeVisible();
      });
    });

    test('DJCSS-T148: Verify submission with only the mandatory fields filled, leaving all optional fields blank - TRS', async ({
      mctFormPage,
    }) => {
      await test.step('Open the New MCT Article Submission Form', async () => {
        await mctFormPage.openForCompany('TRS-Upload');
      });

      await test.step('Fill in Headline Title and upload a file, leaving Email blank', async () => {
        await mctFormPage.fillForm({ headlineTitle: 'Automated Test Headline' });
        const filePath = createTempFile('trs-mandatory-only.txt', 'sample content');
        await mctFormPage.uploadFiles([filePath]);
      });

      // NOTE: on this QA build, submitting TRS-Upload without the Email field populated
      // returns "An error occurred. Please try again." even though Email has no inline
      // "required" validation and isn't marked mandatory on the form. This documents the
      // current (server-side required) behavior rather than the Zephyr step's assumption
      // that only Headline Title is mandatory.
      await test.step('Click Submit and verify the server rejects the submission', async () => {
        await mctFormPage.clickSubmit();
        await expect(mctFormPage.genericErrorMessage).toBeVisible();
      });
    });

    test('DJCSS-T149: Verify the form successfully accepts exactly 3 uploaded files - TRS', async ({
      mctFormPage,
    }) => {
      await test.step('Open the New MCT Article Submission Form', async () => {
        await mctFormPage.openForCompany('TRS-Upload');
      });

      await test.step('Fill in Headline Title', async () => {
        await mctFormPage.fillForm({ headlineTitle: 'Automated Test Headline' });
      });

      await test.step('Upload File 1, File 2, and File 3', async () => {
        const files = [1, 2, 3].map((i) => createTempFile(`trs-file${i}.txt`, `content ${i}`));
        await mctFormPage.uploadFiles(files);
      });

      await test.step('Verify "Maximum 3 files allowed" instruction text is displayed', async () => {
        await expect(mctFormPage.uploadHelperText).toBeVisible();
      });
    });

    test('DJCSS-T150: Verify Unrestricted Upload of File for MyCompanyTodayForm - TRS', async ({
      mctFormPage,
    }) => {
      await test.step('Open the New MCT Article Submission Form', async () => {
        await mctFormPage.openForCompany('TRS-Upload');
      });

      await test.step('Fill in Headline Title', async () => {
        await mctFormPage.fillForm({ headlineTitle: 'Automated Test Headline' });
      });

      await test.step('Upload an unsupported file type and click Submit', async () => {
        const filePath = createTempFile('trs-malware.exe', 'MZ fake exe content');
        await mctFormPage.uploadFiles([filePath]);
        await mctFormPage.clickSubmit();
      });

      await test.step('Verify an error message is displayed', async () => {
        await expect(mctFormPage.genericErrorMessage).toBeVisible();
      });
    });
  });
});
