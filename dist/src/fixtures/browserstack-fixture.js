"use strict";
/**
 * BrowserStack Fixture
 * Extends browser-fixture with bsBrowser / bsContext / bsPage.
 *
 * Set USE_BROWSERSTACK=true to route tests to BrowserStack Automate.
 * When USE_BROWSERSTACK is false (the default), bsPage falls back to
 * the local pooledPage so the same test file works in both environments.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BrowserContextOptionsBuilder = exports.BrowserLaunchOptionsManager = exports.BS_CAPABILITY_PRESETS = exports.BrowserStackConfigBuilder = exports.expect = exports.test = void 0;
const browser_fixture_1 = require("./browser-fixture");
Object.defineProperty(exports, "expect", { enumerable: true, get: function () { return browser_fixture_1.expect; } });
const browserstack_connection_1 = require("../browser/browserstack-connection");
const browserstack_config_1 = require("../browser/browserstack-config");
// ==========================================
// Helpers
// ==========================================
function isBrowserStackEnabled() {
    return process.env.USE_BROWSERSTACK === 'true';
}
function resolveBuildName() {
    return process.env.BS_BUILD_NAME ?? `local-${new Date().toISOString().slice(0, 10)}`;
}
function resolveProjectName() {
    return process.env.BS_PROJECT_NAME ?? 'E2EFrameworkOne';
}
// ==========================================
// Extended test object
// ==========================================
exports.test = browser_fixture_1.test.extend({
    // ---- Worker-scoped: capability matrix entry for this worker ----
    bsCapabilities: [
        async ({}, use) => {
            const presetKey = process.env.BS_CAPABILITY_PRESET ?? 'chrome-windows-11';
            const preset = browserstack_config_1.BS_CAPABILITY_PRESETS[presetKey] ?? browserstack_config_1.BS_CAPABILITY_PRESETS['chrome-windows-11'];
            await use({ ...preset });
        },
        { scope: 'worker' },
    ],
    // ---- Test-scoped: remote Browser connected to BrowserStack ----
    bsBrowser: async ({ bsCapabilities, pooledBrowser }, use, testInfo) => {
        if (!isBrowserStackEnabled()) {
            // Fall back to local pool — no BS credentials required for local dev
            await use(pooledBrowser);
            return;
        }
        const presetKey = process.env.BS_CAPABILITY_PRESET ?? 'chrome-windows-11';
        const builder = new browserstack_config_1.BrowserStackConfigBuilder(presetKey)
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
        const browser = await browserstack_connection_1.BrowserStackConnection.connect(config);
        await use(browser);
        // Child fixtures (bsPage → bsContext) have fully torn down by this point,
        // so all pages and contexts are closed. We report session status here —
        // right before disconnect — to guarantee the directive lands before
        // browser.close() ends the session on BrowserStack's side.
        //
        // bsPage stores the final status/reason on testInfo so we can read them here.
        const status = browserstack_connection_1.BrowserStackSessionReporter.mapStatus(testInfo.status);
        const reason = browserstack_connection_1.BrowserStackSessionReporter.buildReason(testInfo.title, status, testInfo.errors?.[0]?.message);
        // Open a short-lived page solely to deliver the executor directive.
        // This avoids depending on a page that bsPage already closed.
        let statusPage;
        try {
            const ctx = await browser.newContext();
            statusPage = await ctx.newPage();
            await browserstack_connection_1.BrowserStackConnection.updateSessionStatus(statusPage, status, reason);
            await ctx.close();
        }
        catch (err) {
            console.warn('[BrowserStack] Failed to report session status:', err);
        }
        await browserstack_connection_1.BrowserStackConnection.disconnect(browser);
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
// Re-export builders so test files can customise capabilities inline
var browserstack_config_2 = require("../browser/browserstack-config");
Object.defineProperty(exports, "BrowserStackConfigBuilder", { enumerable: true, get: function () { return browserstack_config_2.BrowserStackConfigBuilder; } });
var browserstack_config_3 = require("../browser/browserstack-config");
Object.defineProperty(exports, "BS_CAPABILITY_PRESETS", { enumerable: true, get: function () { return browserstack_config_3.BS_CAPABILITY_PRESETS; } });
var browser_launch_options_1 = require("../browser/browser-launch-options");
Object.defineProperty(exports, "BrowserLaunchOptionsManager", { enumerable: true, get: function () { return browser_launch_options_1.BrowserLaunchOptionsManager; } });
var browser_launch_options_2 = require("../browser/browser-launch-options");
Object.defineProperty(exports, "BrowserContextOptionsBuilder", { enumerable: true, get: function () { return browser_launch_options_2.BrowserContextOptionsBuilder; } });
