/**
 * Browser Fixture
 * Extends Playwright's base test with pooled browser instances and
 * pre-configured browser contexts for UI tests.
 */

import { test as base, Browser, BrowserContext, Page, chromium, firefox, webkit } from '@playwright/test';
import { BrowserPoolRegistry } from '../browser/browser-pool';
import { BrowserLaunchOptionsManager, BrowserContextOptionsBuilder } from '../browser/browser-launch-options';
import { buildBrowserStackWsEndpoint, BS_CAPABILITY_PRESETS } from '../browser/browserstack-config';
import type { BrowserName, BrowserContextConfig, PoolConfig } from '../browser/browser-types';
import { LoginPage } from '../pages/LoginPage';
import { AlfrescoLoginPage } from '../pages/AlfrescoLoginPage';
import { FaqPage } from '../pages/FaqPage';
import { LiveChatPage } from '../pages/LiveChatPage';
import { MctFormPage } from '../pages/MctFormPage';
import { FeedbackFormPage } from '../pages/FeedbackFormPage';
import { HomePage } from '../pages/HomePage';
import { ProductAlertsPage } from '../pages/ProductAlertsPage';
import { HelpRequestFormPage } from '../pages/HelpRequestFormPage';
import { SupportResourceRequestPage } from '../pages/SupportResourceRequestPage';
import { RcProductUpdatePage } from '../pages/RcProductUpdatePage';
import { YomiuriPage } from '../pages/YomiuriPage';

// ==========================================
// Fixture types
// ==========================================

export type BrowserFixtures = {
  pooledBrowser: Browser;
  pooledContext: BrowserContext;
  pooledPage: Page;
  /** Override context options per test */
  contextConfig: BrowserContextConfig;
  loginPage: LoginPage;
  alfrescoLoginPage: AlfrescoLoginPage;
  faqPage: FaqPage;
  liveChatPage: LiveChatPage;
  mctFormPage: MctFormPage;
  feedbackFormPage: FeedbackFormPage;
  homePage: HomePage;
  productAlertsPage: ProductAlertsPage;
  helpRequestFormPage: HelpRequestFormPage;
  supportResourceRequestPage: SupportResourceRequestPage;
  rcProductUpdatePage: RcProductUpdatePage;
  yomiuriPage: YomiuriPage;
};

export type BrowserWorkerFixtures = {
  /** Which browser the pool targets for this worker */
  targetBrowserName: BrowserName;
  /** Pool sizing options for this worker */
  targetPoolConfig: Partial<PoolConfig>;
};

// ==========================================
// Extended test object
// ==========================================

export const test = base.extend<BrowserFixtures, BrowserWorkerFixtures>({
  // ---- Worker-scoped fixtures (one per worker process) ----

  targetBrowserName: [
    async ({}, use) => {
      await use('chrome');
    },
    { scope: 'worker' },
  ],

  targetPoolConfig: [
    async ({}, use) => {
      await use({
        maxSize: 10,
        minIdle: 2,
        acquireTimeoutMs: 30_000,
        idleTimeoutMs: 300_000,
        maxUsageCount: 50,
      });
    },
    { scope: 'worker' },
  ],

  // ---- Test-scoped fixtures ----

  contextConfig: async ({}, use) => {
    await use(BrowserLaunchOptionsManager.getContextOptions());
  },

  // Maps playwright.config.ts project name → BS_CAPABILITY_PRESETS key
  pooledBrowser: async ({ targetBrowserName, targetPoolConfig }, use, testInfo) => {
    if (process.env.USE_BROWSERSTACK === 'true') {
      const username = process.env.BROWSERSTACK_USERNAME;
      const accessKey = process.env.BROWSERSTACK_ACCESS_KEY;
      if (!username || !accessKey) {
        throw new Error('USE_BROWSERSTACK=true but BROWSERSTACK_USERNAME or BROWSERSTACK_ACCESS_KEY is missing.');
      }
      const PROJECT_TO_PRESET: Record<string, string> = {
        'BS-Chrome-Windows11':  'chrome-windows-11',
        'BS-Chrome-MacSequoia': 'chrome-mac-sequoia',
        'BS-Firefox-Windows11': 'firefox-windows-11',
        'BS-Edge-Windows11':    'edge-windows-11',
      };
      const presetKey = PROJECT_TO_PRESET[testInfo.project.name] ?? process.env.BS_CAPABILITY_PRESET ?? 'chrome-windows-11';
      const caps = {
        ...BS_CAPABILITY_PRESETS[presetKey],
        build: process.env.BS_BUILD_NAME ?? 'local',
        project: process.env.BS_PROJECT_NAME ?? 'E2EFrameworkOne',
        name: testInfo.title,
      };
      const wsEndpoint = buildBrowserStackWsEndpoint({ credentials: { username, accessKey }, capabilities: caps });
      const launcher = caps.browser === 'firefox' ? firefox : caps.browser === 'playwright-webkit' ? webkit : chromium;
      const browser = await launcher.connect(wsEndpoint);
      await use(browser);
      await browser.close();
      return;
    }

    const launchOptions = BrowserLaunchOptionsManager.getOptions(targetBrowserName, {
      headless: process.env.HEADLESS !== 'false',
    });

    const pool = await BrowserPoolRegistry.getPool(targetBrowserName, launchOptions, targetPoolConfig);
    const browser = await pool.acquire();

    await use(browser);

    await pool.release(browser);
  },

  pooledContext: async ({ pooledBrowser, contextConfig }, use) => {
    const context = await pooledBrowser.newContext({
      viewport: contextConfig.viewport ?? { width: 1920, height: 1080 },
      userAgent: contextConfig.userAgent,
      locale: contextConfig.locale,
      timezoneId: contextConfig.timezoneId,
      permissions: contextConfig.permissions,
      geolocation: contextConfig.geolocation,
      colorScheme: contextConfig.colorScheme,
      ignoreHTTPSErrors: contextConfig.ignoreHTTPSErrors,
      recordVideo: contextConfig.recordVideo,
    });

    await use(context);

    await context.close();
  },

  pooledPage: async ({ pooledContext }, use, testInfo) => {
    const page = await pooledContext.newPage();

    await use(page);

    const video = page.video();
    await page.close();

    if (video) {
      const videoPath = await video.path();
      await testInfo.attach('video', { path: videoPath, contentType: 'video/webm' });
    }
  },

  loginPage: async ({ pooledPage }, use) => {
    await use(new LoginPage(pooledPage));
  },

  alfrescoLoginPage: async ({ pooledPage }, use) => {
    await use(new AlfrescoLoginPage(pooledPage));
  },

  faqPage: async ({ pooledPage }, use) => {
    await use(new FaqPage(pooledPage));
  },

  liveChatPage: async ({ pooledPage }, use) => {
    await use(new LiveChatPage(pooledPage));
  },

  mctFormPage: async ({ pooledPage }, use) => {
    await use(new MctFormPage(pooledPage));
  },

  feedbackFormPage: async ({ pooledPage }, use) => {
    await use(new FeedbackFormPage(pooledPage));
  },

  homePage: async ({ pooledPage }, use) => {
    await use(new HomePage(pooledPage));
  },

  productAlertsPage: async ({ pooledPage }, use) => {
    await use(new ProductAlertsPage(pooledPage));
  },

  helpRequestFormPage: async ({ pooledPage }, use) => {
    await use(new HelpRequestFormPage(pooledPage));
  },

  supportResourceRequestPage: async ({ pooledPage }, use) => {
    await use(new SupportResourceRequestPage(pooledPage));
  },

  rcProductUpdatePage: async ({ pooledPage }, use) => {
    await use(new RcProductUpdatePage(pooledPage));
  },

  yomiuriPage: async ({ pooledPage }, use) => {
    await use(new YomiuriPage(pooledPage));
  },
});

export { expect } from '@playwright/test';

// ==========================================
// Convenience builders re-exported for tests
// ==========================================

export { BrowserContextOptionsBuilder } from '../browser/browser-launch-options';
export { BrowserLaunchOptionsManager } from '../browser/browser-launch-options';
export { BrowserPoolRegistry } from '../browser/browser-pool';
