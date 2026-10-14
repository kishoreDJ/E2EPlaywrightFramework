/**
 * Browser Fixture
 * Extends Playwright's base test with pooled browser instances and
 * pre-configured browser contexts for UI tests.
 */
import { Browser, BrowserContext, Page } from '@playwright/test';
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
import { AdministrationPage } from '../pages/AdministrationPage';
import { AlfrescoContentUpdatePage } from '../pages/AlfrescoContentUpdatePage';
import { FactivaUpdatesPage } from '../pages/FactivaUpdatesPage';
export type BrowserFixtures = {
    /** Sets the Allure parent suite label from the test's @smoke/@regression tag */
    allureSuiteLabel: void;
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
    administrationPage: AdministrationPage;
    alfrescoContentUpdatePage: AlfrescoContentUpdatePage;
    factivaUpdatesPage: FactivaUpdatesPage;
};
export type BrowserWorkerFixtures = {
    /** Which browser the pool targets for this worker */
    targetBrowserName: BrowserName;
    /** Pool sizing options for this worker */
    targetPoolConfig: Partial<PoolConfig>;
};
export declare const test: import("playwright/test").TestType<import("playwright/test").PlaywrightTestArgs & import("playwright/test").PlaywrightTestOptions & BrowserFixtures, import("playwright/test").PlaywrightWorkerArgs & import("playwright/test").PlaywrightWorkerOptions & BrowserWorkerFixtures>;
export { expect } from '@playwright/test';
export { BrowserContextOptionsBuilder } from '../browser/browser-launch-options';
export { BrowserLaunchOptionsManager } from '../browser/browser-launch-options';
export { BrowserPoolRegistry } from '../browser/browser-pool';
//# sourceMappingURL=browser-fixture.d.ts.map