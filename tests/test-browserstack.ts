import { chromium, Browser, BrowserContext, Page } from 'playwright';

async function runTest(): Promise<void> {
  // 1. Define capabilities interface and object
  interface BrowserStackCaps {
    browser: string;
    os: string;
    os_version: string;
    name: string;
    'browserstack.username': string;
    'browserstack.accessKey': string;
  }

  const caps: BrowserStackCaps = {
    browser: 'chrome',
    os: 'Windows',
    os_version: '11',
    name: 'Basic TypeScript Connection Test',
    'browserstack.username': 'syamkishorerapak1';
    'browserstack.accessKey': 'qzPK4rH3Svf1JmwTp9ya',
  };

  // 2. Connect to BrowserStack via WebSocket
  const wssUrl: string = `wss://cdp.browserstack.com/playwright?caps=${encodeURIComponent(JSON.stringify(caps))}`;
  console.log('Connecting to BrowserStack...');
  
  const browser: Browser = await chromium.connect(wssUrl);

  try {
    // 3. Open context and page
    const context: BrowserContext = browser.contexts()[0];
    const page: Page = context.pages()[0] || (await context.newPage());

    console.log('Navigating to website...');
    await page.goto('https://example.com');

    // 4. Get page title to verify connection
    const title: string = await page.title();
    console.log('Successfully connected! Page title is:', title);

  } catch (error) {
    console.error('Test execution failed:', error);
  } finally {
    // 5. Always close the browser instance
    await browser.close();
    console.log('Browser session closed.');
  }
}

runTest();