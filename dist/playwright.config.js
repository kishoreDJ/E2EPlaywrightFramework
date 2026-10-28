"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '.env') });
const test_1 = require("@playwright/test");
const browser_launch_options_1 = require("./src/browser/browser-launch-options");
const browserstack_config_1 = require("./src/browser/browserstack-config");
const isBrowserStack = process.env.USE_BROWSERSTACK === 'true';
function bsConnectOptions(presetKey) {
    const username = process.env.BROWSERSTACK_USERNAME;
    const accessKey = process.env.BROWSERSTACK_ACCESS_KEY;
    if (!username || !accessKey) {
        throw new Error('USE_BROWSERSTACK=true but BROWSERSTACK_USERNAME or BROWSERSTACK_ACCESS_KEY is missing.');
    }
    const caps = {
        ...browserstack_config_1.BS_CAPABILITY_PRESETS[presetKey],
        build: process.env.BS_BUILD_NAME ?? 'local',
        project: process.env.BS_PROJECT_NAME ?? 'E2EFrameworkOne',
    };
    return { wsEndpoint: (0, browserstack_config_1.buildBrowserStackWsEndpoint)({ credentials: { username, accessKey }, capabilities: caps }) };
}
const isHeadless = process.env.HEADLESS !== 'false';
/**
 * See https://playwright.dev/docs/test-configuration.
 */
exports.default = (0, test_1.defineConfig)({
    globalSetup: './src/setup/globalSetup',
    globalTeardown: './src/setup/globalTeardown',
    testDir: './tests',
    /* Run tests in files in parallel */
    fullyParallel: true,
    /* Fail the build on CI if you accidentally left test.only in the source code. */
    forbidOnly: !!process.env.CI,
    /* Retry on CI only */
    retries: process.env.CI ? 2 : 0,
    /* Workers: BrowserStack plans typically allow few parallel sessions, so
       CI runs with limited concurrency against it; local runs still parallelize for speed. */
    workers: process.env.CI
        ? (isBrowserStack ? 2 : 4)
        : process.env.WORKERS
            ? parseInt(process.env.WORKERS)
            : undefined,
    /* Reporter to use. See https://playwright.dev/docs/test-reporters */
    reporter: [['allure-playwright', { resultsDir: process.env.ALLURE_RESULTS_DIR || 'allure-results' }]],
    /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
    use: {
        /* Base URL to use in actions like `await page.goto('')`. */
        baseURL: process.env.DJCSS_BASE_URL,
        /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
        trace: 'retain-on-failure',
        screenshot: 'only-on-failure',
        headless: isHeadless,
    },
    /* Configure projects for major browsers */
    projects: [
        // ---- API-only project (no browser needed) ----
        {
            name: 'API',
            testMatch: '**/tests/data-privacy/**/*.spec.ts',
            timeout: 60000,
            use: {},
        },
        // ---- Local browser projects (default) ----
        ...(isBrowserStack ? [] : [
            {
                name: 'Chrome',
                use: {
                    ...test_1.devices['Desktop Chrome'],
                    channel: 'chrome',
                    launchOptions: browser_launch_options_1.BrowserLaunchOptionsManager.getOptions('chrome', { headless: isHeadless }),
                },
            },
            {
                name: 'Firefox',
                use: {
                    ...test_1.devices['Desktop Firefox'],
                    launchOptions: browser_launch_options_1.BrowserLaunchOptionsManager.getOptions('firefox', { headless: isHeadless }),
                },
            },
            {
                name: 'Safari',
                use: {
                    ...test_1.devices['Desktop Safari'],
                    launchOptions: browser_launch_options_1.BrowserLaunchOptionsManager.getOptions('webkit', { headless: isHeadless }),
                },
            },
            {
                name: 'Edge',
                use: {
                    ...test_1.devices['Desktop Edge'],
                    channel: 'msedge',
                    launchOptions: browser_launch_options_1.BrowserLaunchOptionsManager.getOptions('edge', { headless: isHeadless }),
                },
            },
        ]),
        // ---- BrowserStack remote projects (USE_BROWSERSTACK=true) ----
        ...(isBrowserStack ? [
            {
                name: 'BS-Chrome-Windows11',
                use: {
                    ...test_1.devices['Desktop Chrome'],
                    connectOptions: bsConnectOptions('chrome-windows-11'),
                },
            },
            {
                name: 'BS-Chrome-MacSequoia',
                use: {
                    ...test_1.devices['Desktop Chrome'],
                    connectOptions: bsConnectOptions('chrome-mac-sequoia'),
                },
            },
            {
                name: 'BS-Firefox-Windows11',
                use: {
                    ...test_1.devices['Desktop Firefox'],
                    connectOptions: bsConnectOptions('firefox-windows-11'),
                },
            },
            {
                name: 'BS-Edge-Windows11',
                use: {
                    ...test_1.devices['Desktop Edge'],
                    connectOptions: bsConnectOptions('edge-windows-11'),
                },
            },
        ] : []),
        /* Test against mobile viewports. */
        // {
        //   name: 'Mobile Chrome',
        //   use: { ...devices['Pixel 5'] },
        // },
        // {
        //   name: 'Mobile Safari',
        //   use: { ...devices['iPhone 12'] },
        // },
    ],
    /* Run your local dev server before starting the tests */
    // webServer: {
    //   command: 'npm run start',
    //   url: 'http://localhost:3000',
    //   reuseExistingServer: !process.env.CI,
    // },
});
