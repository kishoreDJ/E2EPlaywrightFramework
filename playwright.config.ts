import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '.env') });

import { defineConfig, devices } from '@playwright/test';
import { BrowserLaunchOptionsManager } from './src/browser/browser-launch-options';
import { buildBrowserStackWsEndpoint, BS_CAPABILITY_PRESETS } from './src/browser/browserstack-config';

const isBrowserStack = process.env.USE_BROWSERSTACK === 'true';

function bsConnectOptions(presetKey: string): { wsEndpoint: string } {
  const username = process.env.BROWSERSTACK_USERNAME;
  const accessKey = process.env.BROWSERSTACK_ACCESS_KEY;
  if (!username || !accessKey) {
    throw new Error('USE_BROWSERSTACK=true but BROWSERSTACK_USERNAME or BROWSERSTACK_ACCESS_KEY is missing.');
  }
  const caps = {
    ...BS_CAPABILITY_PRESETS[presetKey],
    build: process.env.BS_BUILD_NAME ?? 'local',
    project: process.env.BS_PROJECT_NAME ?? 'E2EFrameworkOne',
  };
  return { wsEndpoint: buildBrowserStackWsEndpoint({ credentials: { username, accessKey }, capabilities: caps }) };
}

const isHeadless = process.env.HEADLESS !== 'false';

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Workers: allow enough parallelism for 50+ concurrent tests */
  workers: process.env.CI ? 4 : process.env.WORKERS ? parseInt(process.env.WORKERS) : undefined,
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
      timeout: 60_000,
      use: {},
    },

    // ---- Local browser projects (default) ----
    ...(isBrowserStack ? [] : [
      {
        name: 'Chrome',
        use: {
          ...devices['Desktop Chrome'],
          channel: 'chrome',
          launchOptions: BrowserLaunchOptionsManager.getOptions('chrome', { headless: isHeadless }),
        },
      },
      {
        name: 'Firefox',
        use: {
          ...devices['Desktop Firefox'],
          launchOptions: BrowserLaunchOptionsManager.getOptions('firefox', { headless: isHeadless }),
        },
      },
      {
        name: 'Safari',
        use: {
          ...devices['Desktop Safari'],
          launchOptions: BrowserLaunchOptionsManager.getOptions('webkit', { headless: isHeadless }),
        },
      },
      {
        name: 'Edge',
        use: {
          ...devices['Desktop Edge'],
          channel: 'msedge',
          launchOptions: BrowserLaunchOptionsManager.getOptions('edge', { headless: isHeadless }),
        },
      },
    ]),

    // ---- BrowserStack remote projects (USE_BROWSERSTACK=true) ----
    ...(isBrowserStack ? [
      {
        name: 'BS-Chrome-Windows11',
        use: {
          ...devices['Desktop Chrome'],
          connectOptions: bsConnectOptions('chrome-windows-11'),
        },
      },
      {
        name: 'BS-Chrome-MacSequoia',
        use: {
          ...devices['Desktop Chrome'],
          connectOptions: bsConnectOptions('chrome-mac-sequoia'),
        },
      },
      {
        name: 'BS-Firefox-Windows11',
        use: {
          ...devices['Desktop Firefox'],
          connectOptions: bsConnectOptions('firefox-windows-11'),
        },
      },
      {
        name: 'BS-Edge-Windows11',
        use: {
          ...devices['Desktop Edge'],
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

