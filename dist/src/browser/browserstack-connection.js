"use strict";
/**
 * BrowserStack Connection
 * Connects Playwright to a remote BrowserStack Automate session via WebSocket CDP.
 * Handles connect, disconnect, and session status reporting (pass/fail).
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BrowserStackSessionReporter = exports.BrowserStackConnection = void 0;
const test_1 = require("@playwright/test");
const browserstack_config_1 = require("./browserstack-config");
// ==========================================
// BrowserStackConnection
// ==========================================
class BrowserStackConnection {
    /**
     * Connects to a BrowserStack remote browser and returns a Playwright Browser.
     * The wsEndpoint encodes all capabilities, so no local launch occurs.
     */
    static async connect(config) {
        const wsEndpoint = (0, browserstack_config_1.buildBrowserStackWsEndpoint)(config);
        console.log(`Connecting to BrowserStack at ${wsEndpoint}`);
        const launcher = BrowserStackConnection.getLauncher(config.capabilities);
        return launcher.connect(wsEndpoint);
    }
    /**
     * Gracefully closes the remote browser session.
     */
    static async disconnect(browser) {
        if (browser.isConnected()) {
            await browser.close();
        }
    }
    /**
     * Marks the BrowserStack session as passed or failed via JS executor.
     * This updates the visual status badge in the BS Automate dashboard.
     * Must be called before browser.close() — the session is already gone after that.
     */
    static async updateSessionStatus(page, status, reason) {
        const script = reason
            ? `browserstack_executor: {"action": "setSessionStatus", "arguments": {"status": "${status}", "reason": "${reason}"}}`
            : `browserstack_executor: {"action": "setSessionStatus", "arguments": {"status": "${status}"}}`;
        await page.evaluate(() => { }, script);
    }
    /**
     * Returns the correct Playwright launcher based on the BS browser capability.
     * BrowserStack maps 'chrome' and 'edge' to chromium protocol,
     * 'firefox' to firefox, and 'playwright-webkit' to webkit.
     */
    static getLauncher(caps) {
        switch (caps.browser) {
            case 'firefox':
            case 'playwright-firefox':
                return test_1.firefox;
            case 'playwright-webkit':
                return test_1.webkit;
            default:
                return test_1.chromium;
        }
    }
}
exports.BrowserStackConnection = BrowserStackConnection;
// ==========================================
// BrowserStackSessionReporter
// ==========================================
/**
 * Utility that reads Playwright test result status and maps it to a BS status.
 * Use inside fixture teardown after `use()` resolves.
 */
class BrowserStackSessionReporter {
    /**
     * Maps Playwright TestInfo.status to a BrowserStack session status string.
     * 'skipped' is treated as passed (not a failure) to avoid cluttering the dashboard.
     */
    static mapStatus(playwrightStatus) {
        return playwrightStatus === 'passed' || playwrightStatus === 'skipped'
            ? 'passed'
            : 'failed';
    }
    /**
     * Builds a concise reason string shown in the BS session tooltip.
     */
    static buildReason(testTitle, status, errorMessage) {
        if (status === 'passed') {
            return `Test passed: ${testTitle}`;
        }
        return errorMessage
            ? `Test failed: ${testTitle} — ${errorMessage.slice(0, 200)}`
            : `Test failed: ${testTitle}`;
    }
}
exports.BrowserStackSessionReporter = BrowserStackSessionReporter;
