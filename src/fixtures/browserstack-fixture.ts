/**
 * BrowserStack Fixture
 * Extends browser-fixture with bsBrowser / bsContext / bsPage.
 *
 * Set USE_BROWSERSTACK=true to route tests to BrowserStack Automate.
 * When USE_BROWSERSTACK is false (the default), bsPage falls back to
 * the local pooledPage so the same test file works in both environments.
 */

import { test as browserTest, expect } from './browser-fixture';
import { Browser, BrowserContext, Page, TestInfo } from '@playwright/test';
import { BrowserStackConnection, BrowserStackSessionReporter } from '../browser/browserstack-connection';
import { BrowserStackConfigBuilder, BS_CAPABILITY_PRESETS } from '../browser/browserstack-config';
import { BrowserLaunchOptionsManager } from '../browser/browser-launch-options';
import type { BrowserStackCapabilities, BrowserContextConfig } from '../browser/browser-types';

// ==========================================
// Fixture types
// ==========================================

export type BsFixtures = {
  bsBrowser: Browser;
  bsContext: BrowserContext;
  bsPage: Page;
  contextConfig: BrowserContextConfig;
};

export type BsWorkerFixtures = {
  bsCapabilities: BrowserStackCapabilities;
};

// ==========================================
// Helpers
// ==========================================

function isBrowserStackEnabled(): boolean {
  return process.env.USE_BROWSERSTACK === 'true';
}

function resolveBuildName(): string {
  return process.env.BS_BUILD_NAME ?? `local-${new Date().toISOString().slice(0, 10)}`;
}

function resolveProjectName(): string {
  return process.env.BS_PROJECT_NAME ?? 'E2EFrameworkOne';
}

// ==========================================
// Extended test object
// ==========================================

export const test = browserTest.extend<BsFixtures, BsWorkerFixtures>({

  // ---- Worker-scoped: capability matrix entry for this worker ----
  bsCapabilities: [
    async ({}, use) => {
      const presetKey = process.env.BS_CAPABILITY_PRESET ?? 'chrome-windows-11';
      const preset = BS_CAPABILITY_PRESETS[presetKey] ?? BS_CAPABILITY_PRESETS['chrome-windows-11'];
      await use({ ...preset });
    },
    { scope: 'worker' },
  ],

  // ---- Test-scoped: remote Browser connected to BrowserStack ----
  bsBrowser: async ({ bsCapabilities, pooledBrowser }, use, testInfo: TestInfo) => {
    if (!isBrowserStackEnabled()) {
      // Fall back to local pool — no BS credentials required for local dev
      await use(pooledBrowser);
      return;
    }

    const config = new BrowserStackConfigBuilder()
      .setBrowser(bsCapabilities.browser)
      .setBrowserVersion(bsCapabilities.browser_version ?? 'latest')
      .setOS(bsCapabilities.os, bsCapabilities.os_version)
      .setSessionName(testInfo.title)
      .setBuild(resolveBuildName())
      .setProject(resolveProjectName())
      .enableDebug(bsCapabilities['browserstack.debug'] ?? true)
      .enableVideo(bsCapabilities['browserstack.video'] ?? true)
      .enableNetworkLogs(bsCapabilities['browserstack.networkLogs'] ?? false)
      .build();

    const browser = await BrowserStackConnection.connect(config);
    await use(browser);
    await BrowserStackConnection.disconnect(browser);
  },

  // ---- Test-scoped: isolated context on the remote browser ----
  bsContext: async ({ bsBrowser, contextConfig }, use) => {
    const context = await bsBrowser.newContext({
      viewport: contextConfig.viewport ?? { width: 1920, height: 1080 },
      userAgent: contextConfig.userAgent,
      locale: contextConfig.locale,
      timezoneId: contextConfig.timezoneId,
      permissions: contextConfig.permissions,
      geolocation: contextConfig.geolocation,
      colorScheme: contextConfig.colorScheme,
      ignoreHTTPSErrors: contextConfig.ignoreHTTPSErrors ?? true,
    });

    await use(context);
    await context.close();
  },

  // ---- Test-scoped: page in the remote context, reports session status on teardown ----
  bsPage: async ({ bsContext, pooledPage }, use, testInfo: TestInfo) => {
    if (!isBrowserStackEnabled()) {
      await use(pooledPage);
      return;
    }

    const page = await bsContext.newPage();
    await use(page);

    // Report pass/fail to BrowserStack dashboard after test body completes
    const status = BrowserStackSessionReporter.mapStatus(testInfo.status);
    const reason = BrowserStackSessionReporter.buildReason(
      testInfo.title,
      status,
      testInfo.errors?.[0]?.message
    );

    try {
      await BrowserStackConnection.updateSessionStatus(page, status, reason);
    } catch {
      // Non-fatal — session may already be closing
    }

    await page.close();
  },
});

export { expect };

// Re-export builders so test files can customise capabilities inline
export { BrowserStackConfigBuilder } from '../browser/browserstack-config';
export { BS_CAPABILITY_PRESETS } from '../browser/browserstack-config';
export { BrowserLaunchOptionsManager } from '../browser/browser-launch-options';
export { BrowserContextOptionsBuilder } from '../browser/browser-launch-options';
