import { test, expect } from '../../src/fixtures/browser-fixture';

// NOTE: the /FAQ folder has 12 Zephyr cases beyond DJCSS-T105 (already automated in
// faq-navigation.spec.ts). DJCSS-T74, T158, T159, T160, T163 require creating/publishing
// articles in Alfresco/Knowledge Base and are blocked pending that access. DJCSS-T161
// requires backend visibility into which products genuinely have zero content, which this
// framework cannot independently verify. DJCSS-T84 requires changing a PDF's embedded year
// via Alfresco to test the "different year" re-prompt path - also blocked.
//
// DJCSS-T82 (verify the acceptance modal appears on first visit to the "Testing - Factiva
// Learning guide" PDF link) is ALSO blocked: an earlier investigation into this modal's
// behavior accidentally clicked ACCEPT using the shared lisaadmin QA account, and that
// acceptance state persists server-side with no way to reset it from the UI. The "first-time
// modal" scenario is therefore no longer reproducible with the access available here.
// DJCSS-T83 (verify the modal does NOT reappear on a later visit, same PDF year) remains
// valid and is automated below, using that now-accepted state.
test.describe('FAQ Forms', { tag: '@regression' }, () => {
  test('DJCSS-T83: Verify Acceptance Modal does not reappear for an already-accepted PDF (same year)', async ({
    loginPage,
    faqPage,
    pooledPage,
  }) => {
    await test.step('Login to DJCSS application', async () => {
      await loginPage.goto('/');
      await loginPage.login(process.env.DJCSS_USERNAME!, process.env.DJCSS_PASSWORD!);
    });

    await test.step('Search for the Testing - Factiva Learning guide article', async () => {
      await faqPage.open();
      await faqPage.search('Testing - Factiva Learning guide');
    });

    await test.step('Open the article and click the PDF link', async () => {
      await faqPage.openArticle('Testing - Factiva Learning guide');
      await pooledPage.getByText('link', { exact: true }).click();
      await pooledPage.waitForTimeout(2000);
    });

    await test.step('Verify the acceptance modal is not shown again', async () => {
      await expect(faqPage.acceptTermsButton).not.toBeVisible();
    });
  });

  test('DJCSS-T106: Verify FAQ URL after submitting Help Request Form', async ({
    loginPage,
    helpRequestFormPage,
    pooledPage,
  }) => {
    await test.step('Login to DJCSS application', async () => {
      await loginPage.goto('/');
      await loginPage.login(process.env.DJCSS_USERNAME!, process.env.DJCSS_PASSWORD!);
    });

    await test.step('Open the Help Request form', async () => {
      await helpRequestFormPage.open();
    });

    await test.step('Fill in the required details and submit', async () => {
      await helpRequestFormPage.fillHelpRequest({
        firstName: 'Automated',
        lastName: 'Tester',
        email: 'automated.test@example.com',
        phone: '1234567890',
        message: 'Automated test message for DJCSS-T106.',
      });
      await helpRequestFormPage.selectProduct('Factiva');
      await helpRequestFormPage.selectLanguage('English');
      await helpRequestFormPage.clickSubmit();
    });

    await test.step('Verify the Thank you page shows and click the FAQ link', async () => {
      // Submission takes ~5s to render the Thank you screen - the default 5000ms
      // expect timeout races it, so use an explicit longer timeout here.
      await expect(helpRequestFormPage.thankYouHeading).toBeVisible({ timeout: 15000 });
      await helpRequestFormPage.faqLink.click();
    });

    await test.step('Verify the FAQ URL is redirected to the FAQ list page', async () => {
      await expect(pooledPage).toHaveURL(/\/faq\/list/);
    });
  });

  test('Verify a "0 Results Found" message is shown for a search term with no matching articles', async ({
    loginPage,
    faqPage,
    pooledPage,
  }) => {
    await test.step('Login to DJCSS application', async () => {
      await loginPage.goto('/');
      await loginPage.login(process.env.DJCSS_USERNAME!, process.env.DJCSS_PASSWORD!);
    });

    await test.step('Search for a term with no matching articles', async () => {
      await faqPage.open();
      await faqPage.search('zzzznonexistentqueryxyz123');
    });

    await test.step('Verify the "0 Results Found" message and Contact us link are shown', async () => {
      await expect(faqPage.resultsCountText).toHaveText(/0 Results Found/i);
      await expect(faqPage.noResultsContactUsLink).toBeVisible();
      // Page closes for video capture right after this step - without a brief
      // pause here the recording ends one frame before "0 Results Found" renders.
      await pooledPage.waitForTimeout(1000);
    });
  });

  test('Verify search results pagination navigates to the next page of articles', async ({
    loginPage,
    faqPage,
    pooledPage,
  }) => {
    await test.step('Login to DJCSS application', async () => {
      await loginPage.goto('/');
      await loginPage.login(process.env.DJCSS_USERNAME!, process.env.DJCSS_PASSWORD!);
    });

    await test.step('Search for a broad term that returns multiple pages of results', async () => {
      await faqPage.open();
      await faqPage.search('a');
    });

    await test.step('Verify the first page shows results 1-10', async () => {
      await expect(faqPage.resultsCountText).toHaveText(/1\s*-\s*10\s*of\s*\d+\s*Results found/i);
    });

    await test.step('Navigate to page 2 and verify results 11-20 are shown', async () => {
      await faqPage.goToResultsPage(2);
      await expect(pooledPage).toHaveURL(/offset=2/);
      await expect(faqPage.resultsCountText).toHaveText(/11\s*-\s*20\s*of\s*\d+\s*Results found/i);
    });
  });
});
