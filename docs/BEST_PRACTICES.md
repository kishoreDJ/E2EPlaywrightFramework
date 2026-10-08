# UI Automation Best Practices & Debugging Standards

This document covers best practices for writing and maintaining **UI (browser) tests** in this Playwright framework. For API test best practices, see [`API_BEST_PRACTICES.md`](./API_BEST_PRACTICES.md).

---

## Table of Contents

1. [General Principles](#1-general-principles)
2. [Project Structure](#2-project-structure)
3. [Fixtures — How to Write UI Tests](#3-fixtures--how-to-write-ui-tests)
4. [Page Object Model](#4-page-object-model)
5. [Locator Strategy](#5-locator-strategy)
6. [Waits and Assertions](#6-waits-and-assertions)
7. [Test Data](#7-test-data)
8. [Browser & Context Configuration](#8-browser--context-configuration)
9. [BrowserStack Integration](#9-browserstack-integration)
10. [Allure Reporting](#10-allure-reporting)
11. [Environment & Configuration](#11-environment--configuration)
12. [CI/CD Guidelines](#12-cicd-guidelines)
13. [PR Code Review Checklist](#13-pr-code-review-checklist)

---

## 1. General Principles

- **One assertion per concern** — each test verifies one specific behaviour. Prefer many focused tests over one large test that checks everything.
- **Test names are documentation** — use the format `[TestID]: description of behaviour`. Example: `T167: Verify Advanced Search product filter navigates to filtered results`.
- **Never hardcode credentials** — all secrets (usernames, passwords, tokens) must live in `.env` and never be committed to git.
- **Tests must be independent** — a test must not depend on state left behind by another test. Each test sets up its own starting conditions.
- **Fail fast and clearly** — use descriptive assertion messages so failures are immediately understandable without reading the code.

---

## 2. Project Structure

```
E2EPlaywrightFramework/
├── src/
│   ├── fixtures/
│   │   └── browser-fixture.ts       # Extended test object with pooled browser + page objects
│   ├── pages/                       # Page Object Model classes (one per page/feature)
│   │   ├── BasePage.ts              # Shared navigation and wait helpers — always extend this
│   │   └── <FeatureName>Page.ts     # One class per page or logical screen
│   ├── browser/
│   │   ├── browser-launch-options.ts  # BrowserLaunchOptionsManager + fluent builders
│   │   ├── browser-types.ts           # Types, interfaces, VIEWPORT_PRESETS
│   │   └── browserstack-config.ts     # BrowserStack capability presets + builder
│   ├── data/
│   │   ├── unique.ts                # Collision-safe ID/email/order generators
│   │   └── date-formatter.ts        # Date formatting helpers
│   └── utils/
│       └── logger.ts                # Structured logger (info/warn/error/debug)
├── tests/
│   └── <feature>/                   # One folder per feature
│       └── <feature>.spec.ts
├── docs/
│   ├── BEST_PRACTICES.md            # This file — UI tests
│   └── API_BEST_PRACTICES.md        # API test best practices
├── playwright.config.ts
└── .env                             # Local secrets — never commit
```

**Rules:**
- Page Object classes go in `src/pages/` — never put locators or navigation logic inside test files.
- Tests go in `tests/<feature>/` — one spec file per feature.
- Shared data utilities go in `src/data/` — never duplicate ID/email generation logic in test files.

---

## 3. Fixtures — How to Write UI Tests

### Always import from the browser fixture

```typescript
// ✅ Correct — use the extended fixture
import { test, expect } from '../../src/fixtures/browser-fixture';

test('T167: my test', async ({ loginPage, homePage, pooledPage }) => {
  // ...
});
```

```typescript
// ❌ Wrong — bypasses pooled browser, page objects, and Allure suite labelling
import { test } from '@playwright/test';
```

### Available built-in fixtures

| Fixture | Type | What it gives you |
|---|---|---|
| `pooledPage` | `Page` | A Playwright `Page` from the browser pool — use for direct page assertions |
| `pooledContext` | `BrowserContext` | The browser context — use for cookie/storage manipulation |
| `pooledBrowser` | `Browser` | The browser instance — needed only for multi-tab scenarios |
| `contextConfig` | `BrowserContextConfig` | Override context options (viewport, locale, colour scheme) per test |
| `loginPage` | Page object | Login page — SSO login flow |
| *(other page fixtures)* | Page objects | One fixture per registered page — see `browser-fixture.ts` |

### Adding a new page fixture

Every new page class must be wired into `src/fixtures/browser-fixture.ts`:
1. Import the class
2. Add it to the `BrowserFixtures` type
3. Add the fixture definition pointing to `pooledPage`

```typescript
// In browser-fixture.ts
import { MyNewPage } from '../pages/MyNewPage';

export type BrowserFixtures = {
  // ... existing fixtures
  myNewPage: MyNewPage;
};

// In the extend() block:
myNewPage: async ({ pooledPage }, use) => {
  await use(new MyNewPage(pooledPage));
},
```

### Use `test.step()` for every logical action

Wrap each logical action in a `test.step()` — every step appears as a named entry in the Allure report:

```typescript
test('T167: Verify product filter navigates to filtered results', async ({ loginPage, homePage, pooledPage }) => {
  await test.step('Login to the application', async () => {
    await loginPage.goto('/');
    await loginPage.login(process.env.APP_USERNAME!, process.env.APP_PASSWORD!);
  });

  await test.step('Open Advanced Search and select a product filter', async () => {
    await homePage.openAdvancedSearch();
    await homePage.selectProductFilter('Factiva');
  });

  await test.step('Verify navigation to the filtered results page', async () => {
    await expect(pooledPage).toHaveURL(/\/list\?product=factiva/);
  });
});
```

---

## 4. Page Object Model

### Every page must extend `BasePage`

`BasePage` (`src/pages/BasePage.ts`) provides shared helpers used across all page objects:

| Method | What it does |
|---|---|
| `goto(path)` | Navigates to a path relative to `baseURL` |
| `waitForPageLoad()` | Waits for `networkidle` load state |
| `getTitle()` | Returns the page title string |
| `getUrl()` | Returns the current URL string |
| `clickNavLink(text)` | Clicks a nav link by visible text, then waits for page load |
| `closePopupIfPresent(text)` | Dismisses a popup/modal if visible — no-ops safely if absent |

```typescript
// ✅ Correct — extend BasePage, keep locators private
import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class MyPage extends BasePage {
  private readonly submitButton: Locator;

  constructor(page: Page) {
    super(page);
    this.submitButton = page.getByRole('button', { name: 'Submit' });
  }

  async submit(): Promise<void> {
    await this.submitButton.click();
    await this.waitForPageLoad();
  }
}
```

```typescript
// ❌ Wrong — locators and navigation inside test files
test('my test', async ({ pooledPage }) => {
  await pooledPage.locator('#submit-btn').click(); // not reusable
});
```

### Use the built-in logger

`BasePage` injects a `Logger` instance via `this.log`. Use it inside page methods instead of `console.log`:

```typescript
async openAdvancedSearch(): Promise<void> {
  this.log.info('Opening Advanced Search panel');
  await this.advancedSearchButton.click();
  await this.waitForPageLoad();
}
```

Log level is controlled by the `LOG_LEVEL` env var (`debug | info | warn | error`, default `info`).

### Handle transient popups defensively

If the application shows intermittent banners or maintenance notices, use `closePopupIfPresent()` so the test never fails on an unexpected overlay:

```typescript
public async dismissMaintenanceNoticeIfPresent(): Promise<void> {
  if (await this.maintenanceOkButton.isVisible().catch(() => false)) {
    await this.maintenanceOkButton.click();
  }
}
```

---

## 5. Locator Strategy

Prefer locators in this order — most resilient first:

1. `getByRole` / `getByLabel` / `getByText` — semantic, survives HTML restructuring
2. `getByTestId` (`data-testid`) — explicit, stable test hook
3. CSS `id` — only when no semantic option exists
4. CSS class — only as a last resort
5. XPath — avoid entirely if possible

```typescript
// ✅ Preferred — semantic and resilient
page.getByRole('button', { name: 'Submit' });
page.getByLabel('Email address');
page.getByText('Saved successfully');

// ✅ Acceptable — explicit test hook
page.getByTestId('submit-btn');
page.locator('[data-testid="modal-close"]');

// ⚠️ Fallback only
page.locator('#signin-btn');              // ID — stable but not semantic
page.locator('.btn.btn-primary.mt-3');    // CSS class — fragile
page.locator('//button[@type="submit"]'); // XPath — avoid
```

---

## 6. Waits and Assertions

### Never use `page.waitForTimeout()`

Hard-coded sleeps make tests slow, flaky, and hard to debug. Use Playwright's smart waits:

```typescript
// ✅ Correct — smart waits
await expect(page.getByText('Saved successfully')).toBeVisible();
await page.waitForURL(/\/results/);
await page.waitForLoadState('networkidle');

// ❌ Wrong — arbitrary sleep
await page.waitForTimeout(3000);
```

### Standard assertion patterns

```typescript
// URL assertion
await expect(pooledPage).toHaveURL(/\/list\?product=factiva/);

// Title assertion
await expect(pooledPage).toHaveTitle(/FAQs/i);

// Element visibility
await expect(pooledPage.getByRole('heading', { name: 'Welcome' })).toBeVisible();

// Element text content
await expect(pooledPage.getByTestId('status-badge')).toHaveText('Active');
```

### Assert visibility before interacting

If an element may not be immediately present after navigation, assert before acting:

```typescript
const submitButton = page.getByRole('button', { name: 'Submit' });
await expect(submitButton).toBeVisible();
await submitButton.click();
```

---

## 7. Test Data

### Use `src/data/unique.ts` for unique values

Never hardcode identifiers. Use the collision-safe generators so parallel workers never collide on the same data:

```typescript
import { uniqueEmail, uniqueOrderNumber, uniqueSuffix, uniqueCodePrefix } from '../../src/data/unique';

const email   = uniqueEmail('example.com');  // qa.ab12cd34ef@example.com
const orderId = uniqueOrderNumber('ORD');     // ORDab12cd34e
const prefix  = uniqueCodePrefix('PRF');      // PRFab12cd (max 10 chars)
const id      = uniqueSuffix(8);              // ab12cd34
```

### Use `src/data/date-formatter.ts` for date fields

Use the provided formatters instead of building date strings inline:

```typescript
import { formatDate, formatDateTime, dateOffset, dateTimeOffset } from '../../src/data/date-formatter';

const today     = formatDate(new Date());   // 10/08/2026   (MM/dd/yyyy)
const nextWeek  = dateOffset(7);            // 10/15/2026
const orderTime = dateTimeOffset(0, -5);    // now minus 5 mins (America/New_York timezone)
```

`dateTimeOffset` uses the `America/New_York` timezone so date-based validations pass regardless of where tests run.

### Never hardcode credentials

```typescript
// ✅ Correct
await loginPage.login(process.env.APP_USERNAME!, process.env.APP_PASSWORD!);

// ❌ Wrong
await loginPage.login('admin@example.com', 'P@ssw0rd1');
```

---

## 8. Browser & Context Configuration

### `BrowserLaunchOptionsManager` — centralised launch config

Launch options for all browsers are managed in `src/browser/browser-launch-options.ts`. The defaults (headless, GPU flags, sandbox args) are applied automatically via `playwright.config.ts` — you never need to call this in tests.

To persist an override for a browser across all tests in a run:

```typescript
BrowserLaunchOptionsManager.setBrowserOverride('chrome', { args: ['--proxy-server=http://...'] });
BrowserLaunchOptionsManager.setGlobalProxy({ server: 'http://proxy.internal:8080' });
```

### `BrowserContextOptionsBuilder` — per-test context customisation

Override context options for a specific test scenario using the fluent builder:

```typescript
import { BrowserContextOptionsBuilder } from '../../src/fixtures/browser-fixture';

const ctxOptions = new BrowserContextOptionsBuilder()
  .setViewport(1280, 720)
  .setLocale('en-GB')
  .setTimezone('Europe/London')
  .setColorScheme('dark')
  .ignoreHTTPSErrors()
  .grantPermissions(['geolocation'])
  .build();
```

### Viewport presets

Use `VIEWPORT_PRESETS` from `src/browser/browser-types.ts` instead of raw pixel values:

| Preset | Dimensions | Use for |
|---|---|---|
| `FULL_HD` | 1920 × 1080 | Default desktop (applied automatically) |
| `HD` | 1280 × 720 | Smaller desktop screens |
| `WQHD` | 2560 × 1440 | Wide-screen / 4K testing |
| `TABLET` | 768 × 1024 | Tablet layout |
| `MOBILE_L` | 414 × 896 | Large mobile |
| `MOBILE_S` | 375 × 667 | Small mobile |

```typescript
new BrowserContextOptionsBuilder().useViewportPreset('TABLET').build();
```

---

## 9. BrowserStack Integration

Run tests on BrowserStack by setting `USE_BROWSERSTACK=true`. The `pooledBrowser` fixture and `playwright.config.ts` handle the connection automatically.

### Available presets

| Project name | Browser | OS |
|---|---|---|
| `BS-Chrome-Windows11` | Chrome latest | Windows 11 |
| `BS-Chrome-MacSequoia` | Chrome latest | macOS Sequoia |
| `BS-Firefox-Windows11` | Firefox latest | Windows 11 |
| `BS-Edge-Windows11` | Edge latest | Windows 11 |

### Running on BrowserStack

```bash
USE_BROWSERSTACK=true \
BROWSERSTACK_USERNAME=your_user \
BROWSERSTACK_ACCESS_KEY=your_key \
BS_BUILD_NAME=my-build \
npx playwright test --project=BS-Chrome-Windows11
```

### Adding a new BrowserStack preset

1. Add an entry to `BS_CAPABILITY_PRESETS` in `src/browser/browserstack-config.ts`:

```typescript
'safari-mac-sequoia': {
  browser: 'playwright-webkit',
  browser_version: 'latest',
  os: 'OS X',
  os_version: 'Sequoia',
  'browserstack.debug': true,
  'browserstack.video': true,
},
```

2. Add the corresponding project in `playwright.config.ts`.
3. Add the project-to-preset mapping in the `PROJECT_TO_PRESET` map inside `browser-fixture.ts`.

### `BrowserStackConfigBuilder` — fluent builder

For one-off capability customisation without modifying the presets:

```typescript
import { BrowserStackConfigBuilder } from '../../src/browser/browserstack-config';

const wsEndpoint = new BrowserStackConfigBuilder('chrome-windows-11')
  .setSessionName('My custom test run')
  .setBuild('release-1.2.3')
  .enableLocal()
  .buildWsEndpoint();
```

---

## 10. Allure Reporting

### Suite labelling via tags

Group tests into Allure suites using tags at the `describe` level:

```typescript
test.describe('FAQ Navigation', { tag: '@regression' }, () => {
  test('T105: Verify FAQ URL redirection', { tag: '@smoke' }, async ({ ... }) => {
    // appears in both Smoke and Regression suites in the Allure report
  });
});
```

| Tag | Allure suite |
|---|---|
| `@smoke` | Smoke Test Suite |
| `@regression` | Regression Test Suite |

### Write readable step names

Every `test.step()` call becomes a named entry in the Allure report. Write step names as human-readable actions — they are the first thing reviewers read when a test fails in CI:

```typescript
// ✅ Good — readable for non-technical reviewers
await test.step('Login to the application', ...);
await test.step('Select the product filter', ...);
await test.step('Verify navigation to the results page', ...);

// ❌ Bad — meaningless in a report
await test.step('step 1', ...);
await test.step('click', ...);
```

### Video is attached automatically

Failed tests automatically attach a `video/webm` recording via the `pooledPage` fixture. No extra code needed — just open the attachment in the Allure report.

### Generating the report locally

```bash
npx playwright test --project=Chrome
npx allure generate allure-results --clean -o allure-report
npx allure open allure-report
```

---

## 11. Environment & Configuration

### Required `.env` variables for UI tests

```
# Application under test
APP_BASE_URL=
APP_USERNAME=
APP_PASSWORD=

# Secondary app credentials (if the suite covers multiple apps)
SECONDARY_APP_USERNAME=
SECONDARY_APP_PASSWORD=

# BrowserStack (only when USE_BROWSERSTACK=true)
BROWSERSTACK_USERNAME=
BROWSERSTACK_ACCESS_KEY=
BS_BUILD_NAME=
BS_PROJECT_NAME=
```

### Headless / headed mode

```bash
# Headed — shows the browser window for local debugging
HEADLESS=false npx playwright test --project=Chrome

# Headless — default, always used in CI
npx playwright test --project=Chrome
```

### Worker count

```bash
WORKERS=2 npx playwright test --project=Chrome
```

CI always runs with `workers: 4` (set in `playwright.config.ts`).

---

## 12. CI/CD Guidelines

- UI tests run under `--project=Chrome` locally and on CI. BrowserStack projects are opt-in via `USE_BROWSERSTACK=true`.
- All secrets are injected as GitHub Actions secrets — never hardcode them in workflow files.
- `allure-results/` is uploaded as a CI artifact on every run.
- `forbidOnly: true` on CI — `test.only()` committed to a branch will fail the build.
- Retries: 2 on CI, 0 locally.

### Selective runs by tag

```bash
npx playwright test --project=Chrome --grep @smoke
npx playwright test --project=Chrome --grep @regression
```

### Marking tests intentionally

| Decorator | When to use |
|---|---|
| `test.skip()` | Known environment limitation — add a comment explaining why and what needs to change |
| `test.fail()` | Documents a known bug — expected to fail until the bug is fixed |
| `test.fixme()` | Test is incomplete or needs rework — do not merge unfinished tests |

```typescript
test.skip('T999: feature not yet available in QA', async () => {
  // Skipped: endpoint not deployed to QA environment yet
});
```

---

## 13. PR Code Review Checklist

### Test Structure
- [ ] Test imports `test` and `expect` from `src/fixtures/browser-fixture` — not from `@playwright/test`
- [ ] Each `test()` is wrapped in a `test.describe()` block with a `@smoke` or `@regression` tag
- [ ] Every logical action is inside a `test.step()` with a human-readable name
- [ ] Test ID from the test management tool is in the test name (e.g. `T167: ...`)

### Page Objects
- [ ] New page class extends `BasePage`
- [ ] All locators are `private readonly` properties — none defined inline in tests
- [ ] New page class is registered in `src/fixtures/browser-fixture.ts`
- [ ] Page methods use `this.log` for info-level logging — no `console.log`

### Locators & Waits
- [ ] No `page.waitForTimeout()` — smart waits used instead
- [ ] Locators use `getByRole` / `getByLabel` / `getByTestId` where possible
- [ ] No XPath locators unless absolutely unavoidable (with a comment explaining why)

### Test Data
- [ ] No hardcoded credentials, usernames, or passwords
- [ ] Unique identifiers use helpers from `src/data/unique.ts`
- [ ] Date fields use helpers from `src/data/date-formatter.ts`

### CI & Skips
- [ ] No `test.only()` committed
- [ ] `test.skip()` has a comment explaining what needs to change before the test can run
- [ ] `test.fail()` references the bug ticket it is tracking

---

*Last updated: October 2026*
