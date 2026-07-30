/**
 * Browser Fixture
 * Extends Playwright's base test with pooled browser instances and
 * pre-configured browser contexts for UI tests.
 */

import { test as base, Browser, BrowserContext, Page } from '@playwright/test';
import { BrowserPoolRegistry } from '../browser/browser-pool';
import { BrowserLaunchOptionsManager, BrowserContextOptionsBuilder } from '../browser/browser-launch-options';
import type { BrowserName, BrowserContextConfig, PoolConfig } from '../browser/browser-types';

// ==========================================
// Fixture types
// ==========================================

export type BrowserFixtures = {
  pooledBrowser: Browser;
  pooledContext: BrowserContext;
  pooledPage: Page;
  /** Override context options per test */
  contextConfig: BrowserContextConfig;
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

  pooledBrowser: async ({ targetBrowserName, targetPoolConfig }, use) => {
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

  pooledPage: async ({ pooledContext }, use) => {
    const page = await pooledContext.newPage();

    await use(page);

    await page.close();
  },
});

export { expect } from '@playwright/test';

// ==========================================
// Convenience builders re-exported for tests
// ==========================================

export { BrowserContextOptionsBuilder } from '../browser/browser-launch-options';
export { BrowserLaunchOptionsManager } from '../browser/browser-launch-options';
export { BrowserPoolRegistry } from '../browser/browser-pool';
