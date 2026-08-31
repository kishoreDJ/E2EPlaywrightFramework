# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: live-chat/live-chat.spec.ts >> Live Chat >> DJCSS-T168: Portuguese option appears in Preferred Language dropdown
- Location: tests/live-chat/live-chat.spec.ts:77:7

# Error details

```
Error: browserType.connect: Error: Invalid 'browser'. Use 'chrome', 'edge', 'playwright-chromium', 'playwright-webkit' or 'playwright-firefox' only
```

# Test source

```ts
  12  | import { LoginPage } from '../pages/LoginPage';
  13  | import { AlfrescoLoginPage } from '../pages/AlfrescoLoginPage';
  14  | import { FaqPage } from '../pages/FaqPage';
  15  | import { LiveChatPage } from '../pages/LiveChatPage';
  16  | import { MctFormPage } from '../pages/MctFormPage';
  17  | import { FeedbackFormPage } from '../pages/FeedbackFormPage';
  18  | import { HomePage } from '../pages/HomePage';
  19  | import { ProductAlertsPage } from '../pages/ProductAlertsPage';
  20  | import { HelpRequestFormPage } from '../pages/HelpRequestFormPage';
  21  | import { SupportResourceRequestPage } from '../pages/SupportResourceRequestPage';
  22  | import { RcProductUpdatePage } from '../pages/RcProductUpdatePage';
  23  | import { YomiuriPage } from '../pages/YomiuriPage';
  24  | 
  25  | // ==========================================
  26  | // Fixture types
  27  | // ==========================================
  28  | 
  29  | export type BrowserFixtures = {
  30  |   pooledBrowser: Browser;
  31  |   pooledContext: BrowserContext;
  32  |   pooledPage: Page;
  33  |   /** Override context options per test */
  34  |   contextConfig: BrowserContextConfig;
  35  |   loginPage: LoginPage;
  36  |   alfrescoLoginPage: AlfrescoLoginPage;
  37  |   faqPage: FaqPage;
  38  |   liveChatPage: LiveChatPage;
  39  |   mctFormPage: MctFormPage;
  40  |   feedbackFormPage: FeedbackFormPage;
  41  |   homePage: HomePage;
  42  |   productAlertsPage: ProductAlertsPage;
  43  |   helpRequestFormPage: HelpRequestFormPage;
  44  |   supportResourceRequestPage: SupportResourceRequestPage;
  45  |   rcProductUpdatePage: RcProductUpdatePage;
  46  |   yomiuriPage: YomiuriPage;
  47  | };
  48  | 
  49  | export type BrowserWorkerFixtures = {
  50  |   /** Which browser the pool targets for this worker */
  51  |   targetBrowserName: BrowserName;
  52  |   /** Pool sizing options for this worker */
  53  |   targetPoolConfig: Partial<PoolConfig>;
  54  | };
  55  | 
  56  | // ==========================================
  57  | // Extended test object
  58  | // ==========================================
  59  | 
  60  | export const test = base.extend<BrowserFixtures, BrowserWorkerFixtures>({
  61  |   // ---- Worker-scoped fixtures (one per worker process) ----
  62  | 
  63  |   targetBrowserName: [
  64  |     async ({}, use) => {
  65  |       await use('chrome');
  66  |     },
  67  |     { scope: 'worker' },
  68  |   ],
  69  | 
  70  |   targetPoolConfig: [
  71  |     async ({}, use) => {
  72  |       await use({
  73  |         maxSize: 10,
  74  |         minIdle: 2,
  75  |         acquireTimeoutMs: 30_000,
  76  |         idleTimeoutMs: 300_000,
  77  |         maxUsageCount: 50,
  78  |       });
  79  |     },
  80  |     { scope: 'worker' },
  81  |   ],
  82  | 
  83  |   // ---- Test-scoped fixtures ----
  84  | 
  85  |   contextConfig: async ({}, use) => {
  86  |     await use(BrowserLaunchOptionsManager.getContextOptions());
  87  |   },
  88  | 
  89  |   // Maps playwright.config.ts project name → BS_CAPABILITY_PRESETS key
  90  |   pooledBrowser: async ({ targetBrowserName, targetPoolConfig }, use, testInfo) => {
  91  |     if (process.env.USE_BROWSERSTACK === 'true') {
  92  |       const username = process.env.BROWSERSTACK_USERNAME;
  93  |       const accessKey = process.env.BROWSERSTACK_ACCESS_KEY;
  94  |       if (!username || !accessKey) {
  95  |         throw new Error('USE_BROWSERSTACK=true but BROWSERSTACK_USERNAME or BROWSERSTACK_ACCESS_KEY is missing.');
  96  |       }
  97  |       const PROJECT_TO_PRESET: Record<string, string> = {
  98  |         'BS-Chrome-Windows11':  'chrome-windows-11',
  99  |         'BS-Chrome-MacSequoia': 'chrome-mac-sequoia',
  100 |         'BS-Firefox-Windows11': 'firefox-windows-11',
  101 |         'BS-Edge-Windows11':    'edge-windows-11',
  102 |       };
  103 |       const presetKey = PROJECT_TO_PRESET[testInfo.project.name] ?? process.env.BS_CAPABILITY_PRESET ?? 'chrome-windows-11';
  104 |       const caps = {
  105 |         ...BS_CAPABILITY_PRESETS[presetKey],
  106 |         build: process.env.BS_BUILD_NAME ?? 'local',
  107 |         project: process.env.BS_PROJECT_NAME ?? 'E2EFrameworkOne',
  108 |         name: testInfo.title,
  109 |       };
  110 |       const wsEndpoint = buildBrowserStackWsEndpoint({ credentials: { username, accessKey }, capabilities: caps });
  111 |       const launcher = caps.browser === 'firefox' ? firefox : caps.browser === 'playwright-webkit' ? webkit : chromium;
> 112 |       const browser = await launcher.connect(wsEndpoint);
      |                                      ^ Error: browserType.connect: Error: Invalid 'browser'. Use 'chrome', 'edge', 'playwright-chromium', 'playwright-webkit' or 'playwright-firefox' only
  113 |       await use(browser);
  114 |       await browser.close();
  115 |       return;
  116 |     }
  117 | 
  118 |     const launchOptions = BrowserLaunchOptionsManager.getOptions(targetBrowserName, {
  119 |       headless: process.env.HEADLESS !== 'false',
  120 |     });
  121 | 
  122 |     const pool = await BrowserPoolRegistry.getPool(targetBrowserName, launchOptions, targetPoolConfig);
  123 |     const browser = await pool.acquire();
  124 | 
  125 |     await use(browser);
  126 | 
  127 |     await pool.release(browser);
  128 |   },
  129 | 
  130 |   pooledContext: async ({ pooledBrowser, contextConfig }, use) => {
  131 |     const context = await pooledBrowser.newContext({
  132 |       viewport: contextConfig.viewport ?? { width: 1920, height: 1080 },
  133 |       userAgent: contextConfig.userAgent,
  134 |       locale: contextConfig.locale,
  135 |       timezoneId: contextConfig.timezoneId,
  136 |       permissions: contextConfig.permissions,
  137 |       geolocation: contextConfig.geolocation,
  138 |       colorScheme: contextConfig.colorScheme,
  139 |       ignoreHTTPSErrors: contextConfig.ignoreHTTPSErrors,
  140 |       recordVideo: contextConfig.recordVideo,
  141 |     });
  142 | 
  143 |     await use(context);
  144 | 
  145 |     await context.close();
  146 |   },
  147 | 
  148 |   pooledPage: async ({ pooledContext }, use, testInfo) => {
  149 |     const page = await pooledContext.newPage();
  150 | 
  151 |     await use(page);
  152 | 
  153 |     const video = page.video();
  154 |     await page.close();
  155 | 
  156 |     if (video) {
  157 |       const videoPath = await video.path();
  158 |       await testInfo.attach('video', { path: videoPath, contentType: 'video/webm' });
  159 |     }
  160 |   },
  161 | 
  162 |   loginPage: async ({ pooledPage }, use) => {
  163 |     await use(new LoginPage(pooledPage));
  164 |   },
  165 | 
  166 |   alfrescoLoginPage: async ({ pooledPage }, use) => {
  167 |     await use(new AlfrescoLoginPage(pooledPage));
  168 |   },
  169 | 
  170 |   faqPage: async ({ pooledPage }, use) => {
  171 |     await use(new FaqPage(pooledPage));
  172 |   },
  173 | 
  174 |   liveChatPage: async ({ pooledPage }, use) => {
  175 |     await use(new LiveChatPage(pooledPage));
  176 |   },
  177 | 
  178 |   mctFormPage: async ({ pooledPage }, use) => {
  179 |     await use(new MctFormPage(pooledPage));
  180 |   },
  181 | 
  182 |   feedbackFormPage: async ({ pooledPage }, use) => {
  183 |     await use(new FeedbackFormPage(pooledPage));
  184 |   },
  185 | 
  186 |   homePage: async ({ pooledPage }, use) => {
  187 |     await use(new HomePage(pooledPage));
  188 |   },
  189 | 
  190 |   productAlertsPage: async ({ pooledPage }, use) => {
  191 |     await use(new ProductAlertsPage(pooledPage));
  192 |   },
  193 | 
  194 |   helpRequestFormPage: async ({ pooledPage }, use) => {
  195 |     await use(new HelpRequestFormPage(pooledPage));
  196 |   },
  197 | 
  198 |   supportResourceRequestPage: async ({ pooledPage }, use) => {
  199 |     await use(new SupportResourceRequestPage(pooledPage));
  200 |   },
  201 | 
  202 |   rcProductUpdatePage: async ({ pooledPage }, use) => {
  203 |     await use(new RcProductUpdatePage(pooledPage));
  204 |   },
  205 | 
  206 |   yomiuriPage: async ({ pooledPage }, use) => {
  207 |     await use(new YomiuriPage(pooledPage));
  208 |   },
  209 | });
  210 | 
  211 | export { expect } from '@playwright/test';
  212 | 
```