/**
 * BrowserStack Fixture
 * Extends browser-fixture with bsBrowser / bsContext / bsPage.
 *
 * Set USE_BROWSERSTACK=true to route tests to BrowserStack Automate.
 * When USE_BROWSERSTACK is false (the default), bsPage falls back to
 * the local pooledPage so the same test file works in both environments.
 */
import { expect } from './browser-fixture';
import { Browser, BrowserContext, Page } from '@playwright/test';
import type { BrowserStackCapabilities, BrowserContextConfig } from '../browser/browser-types';
export type BsFixtures = {
    bsBrowser: Browser;
    bsContext: BrowserContext;
    bsPage: Page;
    contextConfig: BrowserContextConfig;
};
export type BsWorkerFixtures = {
    bsCapabilities: BrowserStackCapabilities;
};
export declare const test: import("playwright/test").TestType<import("playwright/test").PlaywrightTestArgs & import("playwright/test").PlaywrightTestOptions & import("./browser-fixture").BrowserFixtures & BsFixtures, import("playwright/test").PlaywrightWorkerArgs & import("playwright/test").PlaywrightWorkerOptions & import("./browser-fixture").BrowserWorkerFixtures & BsWorkerFixtures>;
export { expect };
export { BrowserStackConfigBuilder } from '../browser/browserstack-config';
export { BS_CAPABILITY_PRESETS } from '../browser/browserstack-config';
export { BrowserLaunchOptionsManager } from '../browser/browser-launch-options';
export { BrowserContextOptionsBuilder } from '../browser/browser-launch-options';
//# sourceMappingURL=browserstack-fixture.d.ts.map