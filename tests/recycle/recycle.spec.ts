import { test, expect } from '../../src/fixtures/browser-fixture';
import { CONTENT_UPDATE_TYPES } from '../../src/pages/AlfrescoContentUpdatePage';

// NOTE: the /Recycle folder has 7 Zephyr cases total. DJCSS-T85 and T86 duplicate the
// logo checks already covered in /Logo Updates (DJCSS-T95, T96) and are automated here.
//
// DJCSS-T90 (Factiva Product Update) and DJCSS-T94 (Factiva Content Update) are automated
// end-to-end below: create + publish an article in Alfresco CMS, then verify it displays
// on the corresponding DJCSS notification page.
//
// DJCSS-T92 (Newswire Product Update) and DJCSS-T93 (IMS Product Update) are automated for
// the Alfresco-side create + publish-success assertion only. The DJCSS Notifications
// dropdown has no page for either update type, so there is nothing to verify on the DJCSS
// side for these two cases.
//
// DJCSS-T91 (DJID Updates) is NOT automatable via this pattern: it uses a real .xlsx
// upload/notify flow rather than the article+Publish-Update pattern, and "DJID Updates"
// isn't even an option in the Publish Update type dropdown. It remains blocked.
//
// All five cases (T90-T94) also require verifying the updated logo in the resulting
// Campaign Monitor email template - Campaign Monitor is an external system this framework
// has no credentials or integration for, so that portion of each case remains blocked.
test.describe('Recycle', { tag: '@regression' }, () => {
  // Alfresco create + publish flows chain several fixed waits (folder nav, form fill,
  // publish dialog) on top of real network latency against a slower non-prod environment,
  // plus (for T90/T94) a second full DJCSS login+verify pass - measured up to ~56s even
  // running solo, so the default 30s test timeout is far too tight for these.
  test.setTimeout(90_000);

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

  test('DJCSS-T94: Verify updated logo on Factiva Content Update email template', async ({
    alfrescoLoginPage,
    alfrescoContentUpdatePage,
    loginPage,
    factivaUpdatesPage,
  }) => {
    const type = CONTENT_UPDATE_TYPES.FACTIVA_CONTENT_UPDATE;
    // 2091/2101 are permanently exhausted - Alfresco tracks publish state per type+month+year
    // and never resets it even after the year folder is deleted.
    const year = '2103';
    const month = 'February';
    const title = 'E2E Automated Content Update Test';
    // The Factiva Content Update notification page renders the article body, not its title.
    const content = 'Automated E2E test content body.';

    await test.step('Login to Alfresco', async () => {
      await alfrescoLoginPage.openDocumentLibrary();
      await alfrescoLoginPage.login(process.env.ALFRESCO_USERNAME!, process.env.ALFRESCO_PASSWORD!);
    });

    try {
      await test.step('Create the Factiva Content Update article in Alfresco', async () => {
        await alfrescoContentUpdatePage.createYearFolderIfMissing(type.folderPath, year);
        await alfrescoContentUpdatePage.createArticle(type, year, month, title, content);
      });

      await test.step('Publish the update from Alfresco', async () => {
        await alfrescoContentUpdatePage.publishUpdate(type, month, year);
        await expect(alfrescoContentUpdatePage.getPublishSuccessMessage(type, month, year)).toBeVisible();
      });

      await test.step('Login to DJCSS application', async () => {
        await loginPage.goto('/');
        await loginPage.login(process.env.DJCSS_USERNAME!, process.env.DJCSS_PASSWORD!);
      });

      await test.step('Verify the published update is displayed on DJCSS', async () => {
        await factivaUpdatesPage.openContentUpdates();
        await factivaUpdatesPage.selectYear(year);
        await factivaUpdatesPage.selectMonth(month);
        await expect(factivaUpdatesPage.getArticleContent(content)).toBeVisible();
      });
    } finally {
      await test.step('Clean up the test article from Alfresco', async () => {
        await alfrescoContentUpdatePage.deleteYearFolder(type.folderPath, year);
      });
    }
  });

  test('DJCSS-T90: Verify updated logo on Factiva Product Update email template', async ({
    alfrescoLoginPage,
    alfrescoContentUpdatePage,
    loginPage,
    factivaUpdatesPage,
  }) => {
    const type = CONTENT_UPDATE_TYPES.FACTIVA_PRODUCT_UPDATE;
    // 2093/2102 are permanently exhausted - Alfresco tracks publish state per type+month+year
    // and never resets it even after the year folder is deleted.
    const year = '2104';
    const month = 'February';
    const title = 'E2E Automated Product Update Test';

    await test.step('Login to Alfresco', async () => {
      await alfrescoLoginPage.openDocumentLibrary();
      await alfrescoLoginPage.login(process.env.ALFRESCO_USERNAME!, process.env.ALFRESCO_PASSWORD!);
    });

    try {
      await test.step('Create the Factiva Product Update article in Alfresco', async () => {
        await alfrescoContentUpdatePage.createYearFolderIfMissing(type.folderPath, year);
        await alfrescoContentUpdatePage.createArticle(
          type,
          year,
          month,
          title,
          'Automated E2E test content body for Factiva Product Update.',
        );
      });

      await test.step('Publish the update from Alfresco', async () => {
        await alfrescoContentUpdatePage.publishUpdate(type, month, year);
        await expect(alfrescoContentUpdatePage.getPublishSuccessMessage(type, month, year)).toBeVisible();
      });

      await test.step('Login to DJCSS application', async () => {
        await loginPage.goto('/');
        await loginPage.login(process.env.DJCSS_USERNAME!, process.env.DJCSS_PASSWORD!);
      });

      await test.step('Verify the published update is displayed on DJCSS', async () => {
        await factivaUpdatesPage.openProductUpdates();
        await factivaUpdatesPage.selectYear(year);
        await factivaUpdatesPage.selectMonth(month);
        await expect(factivaUpdatesPage.getArticleContent(title)).toBeVisible();
      });
    } finally {
      await test.step('Clean up the test article from Alfresco', async () => {
        await alfrescoContentUpdatePage.deleteYearFolder(type.folderPath, year);
      });
    }
  });

  test('DJCSS-T92: Verify Newswire Product Update article publishes successfully in Alfresco', async ({
    alfrescoLoginPage,
    alfrescoContentUpdatePage,
  }) => {
    // No DJCSS-side page exists for Newswire Product Update - this covers the Alfresco-side
    // create + publish-success assertion only. See NOTE at top of file.
    const type = CONTENT_UPDATE_TYPES.NEWSWIRE_PRODUCT_UPDATE;
    // 2096 is permanently exhausted - Alfresco tracks publish state per type+month+year
    // and never resets it even after the year folder is deleted.
    const year = '2098';
    const month = 'February';
    const title = 'E2E Automated Newswire Product Update Test';

    await test.step('Login to Alfresco', async () => {
      await alfrescoLoginPage.openDocumentLibrary();
      await alfrescoLoginPage.login(process.env.ALFRESCO_USERNAME!, process.env.ALFRESCO_PASSWORD!);
    });

    try {
      await test.step('Create the Newswire Product Update article in Alfresco', async () => {
        await alfrescoContentUpdatePage.createYearFolderIfMissing(type.folderPath, year);
        await alfrescoContentUpdatePage.createArticle(
          type,
          year,
          month,
          title,
          'Automated E2E test content body for Newswire Product Update.',
        );
      });

      await test.step('Publish the update from Alfresco', async () => {
        await alfrescoContentUpdatePage.publishUpdate(type, month, year);
        await expect(alfrescoContentUpdatePage.getPublishSuccessMessage(type, month, year)).toBeVisible();
      });
    } finally {
      await test.step('Clean up the test article from Alfresco', async () => {
        await alfrescoContentUpdatePage.deleteYearFolder(type.folderPath, year);
      });
    }
  });

  test('DJCSS-T93: Verify IMS Product Update article publishes successfully in Alfresco', async ({
    alfrescoLoginPage,
    alfrescoContentUpdatePage,
  }) => {
    // No DJCSS-side page exists for IMS Product Update - this covers the Alfresco-side
    // create + publish-success assertion only. See NOTE at top of file.
    const type = CONTENT_UPDATE_TYPES.IMS_PRODUCT_UPDATE;
    const year = '2097';
    const month = 'February';
    const title = 'E2E Automated IMS Product Update Test';

    await test.step('Login to Alfresco', async () => {
      await alfrescoLoginPage.openDocumentLibrary();
      await alfrescoLoginPage.login(process.env.ALFRESCO_USERNAME!, process.env.ALFRESCO_PASSWORD!);
    });

    try {
      await test.step('Create the IMS Product Update article in Alfresco', async () => {
        await alfrescoContentUpdatePage.createYearFolderIfMissing(type.folderPath, year);
        await alfrescoContentUpdatePage.createArticle(
          type,
          year,
          month,
          title,
          'Automated E2E test content body for IMS Product Update.',
        );
      });

      await test.step('Publish the update from Alfresco', async () => {
        await alfrescoContentUpdatePage.publishUpdate(type, month, year);
        await expect(alfrescoContentUpdatePage.getPublishSuccessMessage(type, month, year)).toBeVisible();
      });
    } finally {
      await test.step('Clean up the test article from Alfresco', async () => {
        await alfrescoContentUpdatePage.deleteYearFolder(type.folderPath, year);
      });
    }
  });
});
