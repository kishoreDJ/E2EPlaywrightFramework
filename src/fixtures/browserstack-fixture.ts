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

    const presetKey = process.env.BS_CAPABILITY_PRESET ?? 'chrome-windows-11';
    const builder = new BrowserStackConfigBuilder(presetKey)
      .setBrowser(bsCapabilities.browser)
      .setBrowserVersion(bsCapabilities.browser_version ?? 'latest')
      .setOS(bsCapabilities.os, bsCapabilities.os_version)
      .setSessionName(testInfo.title)
      .setBuild(resolveBuildName())
      .setProject(resolveProjectName())
      .enableDebug(bsCapabilities['browserstack.debug'] ?? true)
      .enableVideo(bsCapabilities['browserstack.video'] ?? true)
      .enableNetworkLogs(bsCapabilities['browserstack.networkLogs'] ?? false);

    if (process.env.USE_BS_LOCAL === 'true') {
      builder
        .enableLocal(true)
        .setLocalIdentifier(process.env.BS_LOCAL_IDENTIFIER || 'default');
    }

    const config = builder.build();

    const browser = await BrowserStackConnection.connect(config);
    await use(browser);

    // Child fixtures (bsPage → bsContext) have fully torn down by this point,
    // so all pages and contexts are closed. We report session status here —
    // right before disconnect — to guarantee the directive lands before
    // browser.close() ends the session on BrowserStack's side.
    //
    // bsPage stores the final status/reason on testInfo so we can read them here.
    const status = BrowserStackSessionReporter.mapStatus(testInfo.status);
    const reason = BrowserStackSessionReporter.buildReason(
      testInfo.title,
      status,
      testInfo.errors?.[0]?.message
    );

    // Open a short-lived page solely to deliver the executor directive.
    // This avoids depending on a page that bsPage already closed.
    let statusPage: Page | undefined;
    try {
      const ctx = await browser.newContext();
      statusPage = await ctx.newPage();
      await BrowserStackConnection.updateSessionStatus(statusPage, status, reason);
      await ctx.close();
    } catch (err) {
      console.warn('[BrowserStack] Failed to report session status:', err);
    }

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

  // ---- Test-scoped: page in the remote context ----
  bsPage: async ({ bsContext, pooledPage }, use) => {
    if (!isBrowserStackEnabled()) {
      await use(pooledPage);
      return;
    }

    const page = await bsContext.newPage();
    await use(page);
    await page.close();
  },
});

export { expect };

// Re-export builders so test files can customise capabilities inline
export { BrowserStackConfigBuilder } from '../browser/browserstack-config';
export { BS_CAPABILITY_PRESETS } from '../browser/browserstack-config';
export { BrowserLaunchOptionsManager } from '../browser/browser-launch-options';
export { BrowserContextOptionsBuilder } from '../browser/browser-launch-options';
