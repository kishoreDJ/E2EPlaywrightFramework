import { defineConfig, devices } from '@playwright/test';
import { BrowserLaunchOptionsManager } from './src/browser/browser-launch-options';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '.env.djcss') });

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
  reporter: [['html'], ['allure-playwright', { resultsDir: 'allure-results' }]],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('')`. */
    baseURL: process.env.DJCSS_BASE_URL,

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',

    headless: isHeadless,
  },

  /* Configure projects for major browsers */
  projects: [
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

