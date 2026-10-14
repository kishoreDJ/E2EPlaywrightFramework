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
        const config = new browserstack_config_1.BrowserStackConfigBuilder()
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
        const browser = await browserstack_connection_1.BrowserStackConnection.connect(config);
        await use(browser);
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
    // ---- Test-scoped: page in the remote context, reports session status on teardown ----
    bsPage: async ({ bsContext, pooledPage }, use, testInfo) => {
        if (!isBrowserStackEnabled()) {
            await use(pooledPage);
            return;
        }
        const page = await bsContext.newPage();
        await use(page);
        // Report pass/fail to BrowserStack dashboard after test body completes
        const status = browserstack_connection_1.BrowserStackSessionReporter.mapStatus(testInfo.status);
        const reason = browserstack_connection_1.BrowserStackSessionReporter.buildReason(testInfo.title, status, testInfo.errors?.[0]?.message);
        try {
            await browserstack_connection_1.BrowserStackConnection.updateSessionStatus(page, status, reason);
        }
        catch {
            // Non-fatal — session may already be closing
        }
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
