"use strict";
/**
 * Browser Fixture
 * Extends Playwright's base test with pooled browser instances and
 * pre-configured browser contexts for UI tests.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BrowserPoolRegistry = exports.BrowserLaunchOptionsManager = exports.BrowserContextOptionsBuilder = exports.expect = exports.test = void 0;
const test_1 = require("@playwright/test");
const allure_js_commons_1 = require("allure-js-commons");
const browser_pool_1 = require("../browser/browser-pool");
const browser_launch_options_1 = require("../browser/browser-launch-options");
const browserstack_config_1 = require("../browser/browserstack-config");
const LoginPage_1 = require("../pages/LoginPage");
const AlfrescoLoginPage_1 = require("../pages/AlfrescoLoginPage");
const FaqPage_1 = require("../pages/FaqPage");
const LiveChatPage_1 = require("../pages/LiveChatPage");
const MctFormPage_1 = require("../pages/MctFormPage");
const FeedbackFormPage_1 = require("../pages/FeedbackFormPage");
const HomePage_1 = require("../pages/HomePage");
const ProductAlertsPage_1 = require("../pages/ProductAlertsPage");
const HelpRequestFormPage_1 = require("../pages/HelpRequestFormPage");
const SupportResourceRequestPage_1 = require("../pages/SupportResourceRequestPage");
const RcProductUpdatePage_1 = require("../pages/RcProductUpdatePage");
const YomiuriPage_1 = require("../pages/YomiuriPage");
const AdministrationPage_1 = require("../pages/AdministrationPage");
const AlfrescoContentUpdatePage_1 = require("../pages/AlfrescoContentUpdatePage");
const FactivaUpdatesPage_1 = require("../pages/FactivaUpdatesPage");
// ==========================================
// Extended test object
// ==========================================
exports.test = test_1.test.extend({
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
                acquireTimeoutMs: 30000,
                idleTimeoutMs: 300000,
                maxUsageCount: 50,
            });
        },
        { scope: 'worker' },
    ],
    // ---- Test-scoped fixtures ----
    allureSuiteLabel: [
        async ({}, use, testInfo) => {
            if (testInfo.tags.includes('@smoke')) {
                await (0, allure_js_commons_1.parentSuite)('Smoke Test Suite');
            }
            else if (testInfo.tags.includes('@regression')) {
                await (0, allure_js_commons_1.parentSuite)('Regression Test Suite');
            }
            await use();
        },
        { auto: true },
    ],
    contextConfig: async ({}, use) => {
        await use(browser_launch_options_1.BrowserLaunchOptionsManager.getContextOptions());
    },
    // Maps playwright.config.ts project name → BS_CAPABILITY_PRESETS key
    pooledBrowser: async ({ targetBrowserName, targetPoolConfig }, use, testInfo) => {
        if (process.env.USE_BROWSERSTACK === 'true') {
            const username = process.env.BROWSERSTACK_USERNAME;
            const accessKey = process.env.BROWSERSTACK_ACCESS_KEY;
            if (!username || !accessKey) {
                throw new Error('USE_BROWSERSTACK=true but BROWSERSTACK_USERNAME or BROWSERSTACK_ACCESS_KEY is missing.');
            }
            const PROJECT_TO_PRESET = {
                'BS-Chrome-Windows11': 'chrome-windows-11',
                'BS-Chrome-MacSequoia': 'chrome-mac-sequoia',
                'BS-Firefox-Windows11': 'firefox-windows-11',
                'BS-Edge-Windows11': 'edge-windows-11',
            };
            const presetKey = PROJECT_TO_PRESET[testInfo.project.name] ?? process.env.BS_CAPABILITY_PRESET ?? 'chrome-windows-11';
            const caps = {
                ...browserstack_config_1.BS_CAPABILITY_PRESETS[presetKey],
                build: process.env.BS_BUILD_NAME ?? 'local',
                project: process.env.BS_PROJECT_NAME ?? 'E2EFrameworkOne',
                name: testInfo.title,
            };
            const wsEndpoint = (0, browserstack_config_1.buildBrowserStackWsEndpoint)({ credentials: { username, accessKey }, capabilities: caps });
            const launcher = caps.browser === 'playwright-firefox' ? test_1.firefox : caps.browser === 'playwright-webkit' ? test_1.webkit : test_1.chromium;
            const browser = await launcher.connect(wsEndpoint);
            await use(browser);
            await browser.close();
            return;
        }
        const launchOptions = browser_launch_options_1.BrowserLaunchOptionsManager.getOptions(targetBrowserName, {
            headless: process.env.HEADLESS !== 'false',
        });
        const pool = await browser_pool_1.BrowserPoolRegistry.getPool(targetBrowserName, launchOptions, targetPoolConfig);
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
        await use(new LoginPage_1.LoginPage(pooledPage));
    },
    alfrescoLoginPage: async ({ pooledPage }, use) => {
        await use(new AlfrescoLoginPage_1.AlfrescoLoginPage(pooledPage));
    },
    faqPage: async ({ pooledPage }, use) => {
        await use(new FaqPage_1.FaqPage(pooledPage));
    },
    liveChatPage: async ({ pooledPage }, use) => {
        await use(new LiveChatPage_1.LiveChatPage(pooledPage));
    },
    mctFormPage: async ({ pooledPage }, use) => {
        await use(new MctFormPage_1.MctFormPage(pooledPage));
    },
    feedbackFormPage: async ({ pooledPage }, use) => {
        await use(new FeedbackFormPage_1.FeedbackFormPage(pooledPage));
    },
    homePage: async ({ pooledPage }, use) => {
        await use(new HomePage_1.HomePage(pooledPage));
    },
    productAlertsPage: async ({ pooledPage }, use) => {
        await use(new ProductAlertsPage_1.ProductAlertsPage(pooledPage));
    },
    helpRequestFormPage: async ({ pooledPage }, use) => {
        await use(new HelpRequestFormPage_1.HelpRequestFormPage(pooledPage));
    },
    supportResourceRequestPage: async ({ pooledPage }, use) => {
        await use(new SupportResourceRequestPage_1.SupportResourceRequestPage(pooledPage));
    },
    rcProductUpdatePage: async ({ pooledPage }, use) => {
        await use(new RcProductUpdatePage_1.RcProductUpdatePage(pooledPage));
    },
    yomiuriPage: async ({ pooledPage }, use) => {
        await use(new YomiuriPage_1.YomiuriPage(pooledPage));
    },
    administrationPage: async ({ pooledPage }, use) => {
        await use(new AdministrationPage_1.AdministrationPage(pooledPage));
    },
    alfrescoContentUpdatePage: async ({ pooledPage }, use) => {
        await use(new AlfrescoContentUpdatePage_1.AlfrescoContentUpdatePage(pooledPage));
    },
    factivaUpdatesPage: async ({ pooledPage }, use) => {
        await use(new FactivaUpdatesPage_1.FactivaUpdatesPage(pooledPage));
    },
});
var test_2 = require("@playwright/test");
Object.defineProperty(exports, "expect", { enumerable: true, get: function () { return test_2.expect; } });
// ==========================================
// Convenience builders re-exported for tests
// ==========================================
var browser_launch_options_2 = require("../browser/browser-launch-options");
Object.defineProperty(exports, "BrowserContextOptionsBuilder", { enumerable: true, get: function () { return browser_launch_options_2.BrowserContextOptionsBuilder; } });
var browser_launch_options_3 = require("../browser/browser-launch-options");
Object.defineProperty(exports, "BrowserLaunchOptionsManager", { enumerable: true, get: function () { return browser_launch_options_3.BrowserLaunchOptionsManager; } });
var browser_pool_2 = require("../browser/browser-pool");
Object.defineProperty(exports, "BrowserPoolRegistry", { enumerable: true, get: function () { return browser_pool_2.BrowserPoolRegistry; } });
