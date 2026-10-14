/**
 * BrowserStack Connection
 * Connects Playwright to a remote BrowserStack Automate session via WebSocket CDP.
 * Handles connect, disconnect, and session status reporting (pass/fail).
 */
import { Browser, Page } from '@playwright/test';
import type { BrowserStackConfig } from './browser-types';
export type BsSessionStatus = 'passed' | 'failed';
export declare class BrowserStackConnection {
    /**
     * Connects to a BrowserStack remote browser and returns a Playwright Browser.
     * The wsEndpoint encodes all capabilities, so no local launch occurs.
     */
    static connect(config: BrowserStackConfig): Promise<Browser>;
    /**
     * Gracefully closes the remote browser session.
     */
    static disconnect(browser: Browser): Promise<void>;
    /**
     * Marks the BrowserStack session as passed or failed via JS executor.
     * This updates the visual status badge in the BS Automate dashboard.
     * Must be called before browser.close() — the session is already gone after that.
     */
    static updateSessionStatus(page: Page, status: BsSessionStatus, reason?: string): Promise<void>;
    /**
     * Returns the correct Playwright launcher based on the BS browser capability.
     * BrowserStack maps 'chrome' and 'edge' to chromium protocol,
     * 'firefox' to firefox, and 'playwright-webkit' to webkit.
     */
    private static getLauncher;
}
/**
 * Utility that reads Playwright test result status and maps it to a BS status.
 * Use inside fixture teardown after `use()` resolves.
 */
export declare class BrowserStackSessionReporter {
    /**
     * Maps Playwright TestInfo.status to a BrowserStack session status string.
     * 'skipped' is treated as passed (not a failure) to avoid cluttering the dashboard.
     */
    static mapStatus(playwrightStatus: string | undefined): BsSessionStatus;
    /**
     * Builds a concise reason string shown in the BS session tooltip.
     */
    static buildReason(testTitle: string, status: BsSessionStatus, errorMessage?: string): string;
}
//# sourceMappingURL=browserstack-connection.d.ts.map