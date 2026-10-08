# E2E Playwright Framework — Best Practices

This guide covers best practices for writing and maintaining tests in this framework for both **UI (browser)** and **API** test suites.

---

## Table of Contents

1. [General Principles](#1-general-principles)
2. [Project Structure](#2-project-structure)
3. [UI Test Best Practices](#3-ui-test-best-practices)
4. [API Test Best Practices](#4-api-test-best-practices)
5. [Database Assertions](#5-database-assertions)
6. [Authentication & Tokens](#6-authentication--tokens)
7. [Schema Validation](#7-schema-validation)
8. [Allure Reporting](#8-allure-reporting)
9. [Environment & Configuration](#9-environment--configuration)
10. [CI/CD Guidelines](#10-cicd-guidelines)

---

## 1. General Principles

- **One assertion per concern** — each test should verify one specific behaviour. Prefer many focused tests over one large test that checks everything.
- **Test names are documentation** — use the format `[TestID]: description of behaviour`. Example: `POST DNS-001: valid request returns 201 with orchestratorRequestId`.
- **Never hardcode credentials** — all secrets (tokens, DB passwords, API keys) must live in `.env` and never be committed to git.
- **Tests must be independent** — a test should not depend on the state left behind by another test. Each test sets up its own data.
- **Fail fast and clearly** — use descriptive assertion messages so failures are immediately understandable without reading the code.

---

## 2. Project Structure

```
E2EPlaywrightFramework/
├── src/
│   ├── fixtures/          # Playwright fixtures (browser, API client)
│   ├── helpers/           # Shared utilities (auth, DB, UAP, Allure)
│   ├── pages/             # Page Object Model classes (UI tests)
│   ├── browser/           # Browser launch options and BrowserStack config
│   ├── data/              # Test data utilities (dates, identifiers)
│   └── schema-validation/ # Zod response schema validators
├── tests/
│   ├── data-privacy/      # API tests — DSAR/CDPR endpoints
│   │   └── schemas/       # Zod schemas for data-privacy API responses
│   └── <feature>/         # UI tests organised by feature
├── docs/                  # Framework documentation
├── playwright.config.ts   # Project configuration
└── .env                   # Local secrets — never commit
```

**Rules:**
- Page Object classes go in `src/pages/` — never put locators or navigation logic inside test files.
- Shared API helpers go in `src/helpers/` — never duplicate fetch logic across test files.
- Schemas go in `tests/<feature>/schemas/` — co-located with the tests that use them.

---

## 3. UI Test Best Practices

### Page Object Model (POM)

Every page under test must have a corresponding class in `src/pages/` extending `BasePage`.

```typescript
// Good — locators and actions encapsulated in the page class
export class LoginPage extends BasePage {
  private readonly usernameInput = this.page.locator('#username');
  private readonly passwordInput = this.page.locator('#password');
  private readonly submitButton  = this.page.locator('button[type="submit"]');

  async login(username: string, password: string) {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }
}

// Bad — locators inside the test file
test('login', async ({ page }) => {
  await page.locator('#username').fill('user');
  await page.locator('#password').fill('pass');
});
```

### Locator Strategy

Prefer locators in this order:
1. `getByRole` / `getByLabel` / `getByText` — semantic, resilient to HTML changes
2. `data-testid` attributes — stable, explicit test hooks
3. CSS class or ID — only when semantic locators are unavailable
4. XPath — last resort only

```typescript
// Preferred
page.getByRole('button', { name: 'Submit' });
page.getByLabel('Email address');

// Acceptable
page.locator('[data-testid="submit-btn"]');

// Avoid
page.locator('.btn.btn-primary.mt-3');
```

### Waits and Assertions

- **Never use `page.waitForTimeout()`** — use `expect(locator).toBeVisible()` or `waitForURL()` instead. Hard-coded sleeps make tests slow and fragile.
- Use `expect(locator).toBeVisible()` before interacting with an element that may not be immediately present.
- Use `page.waitForURL()` after navigation actions.

```typescript
// Good
await page.getByRole('button', { name: 'Save' }).click();
await expect(page.getByText('Saved successfully')).toBeVisible();

// Bad
await page.click('button');
await page.waitForTimeout(3000);
```

### Test Data

- Use utilities in `src/data/` (e.g., `unique.ts`) to generate unique identifiers per test run.
- Never reuse fixed test account data that multiple tests write to — concurrent runs will collide.
- Clean up data created during a test in `afterEach` or `afterAll` where possible.

---

## 4. API Test Best Practices

### Use the `api` Fixture

All API tests must use the `api` fixture from `src/fixtures/rest-client.fixture.ts` — never instantiate a raw `fetch` or `axios` client directly in test files.

```typescript
test('POST DNS-001: valid request returns 201', async ({ api }) => {
  const response = await api.post('/api/v1/customer-data-privacy/', {
    headers: getStandardHeaders(token),
    data: buildDoNotSellBody(user),
  });
  expect(response.status()).toBe(201);
});
```

### Token Acquisition

- Fetch tokens once in `beforeAll` — never inside individual tests.
- Use the dedicated helpers: `getToken()`, `getBatchesToken()`, `getUapToken()` from `src/helpers/authHelper.ts`.
- Tokens are short-lived — if a test suite runs longer than the token TTL, re-acquire in `beforeAll` per worker.

```typescript
let token: string;

test.beforeAll(async () => {
  token = await getToken();
});
```

### Test User Data

- Fetch real test users from the CSM database via `getRandomUuidsBySubscriptionState()` and enrich with UAP via `getUsersByUuids()`.
- Do this **once in `beforeAll`**, cache results, and share across tests using `nextUser()`.
- Filter out users with empty `firstName`/`lastName` before sending to the API — the CDPR API rejects empty strings.

```typescript
// Good — only include name fields if they have valid values
const body = {
  ...(user.firstName && { firstName: user.firstName }),
  ...(user.lastName  && { lastName:  user.lastName  }),
  email: user.email,
};

// Bad — sends empty string which causes 400
const body = { firstName: user.firstName, email: user.email };
```

### Fallback Test Data for CI

The CSM database is on a private network. GitHub Actions runners cannot reach it. Every test suite that fetches users from CSM in `beforeAll` must provide a committed fallback file:

```
tests/<feature>/data/users.ts    ← committed fallback, co-located with the tests
```

**Pattern in `beforeAll`:**
```typescript
let fetched: UapUser[];
try {
  const uuids = await getRandomUuidsBySubscriptionState(5, 50);
  fetched = await getUsersByUuids(uuids);
} catch {
  const { fallbackUsers } = await import('./data/users');
  fetched = fallbackUsers;
}
```

**To populate the fallback file** (run once locally, then commit):
```bash
npx ts-node scripts/generate-fallback-users.ts
```

**Rules:**
- The fallback file lives in `tests/<feature>/data/` — co-located with the tests, same pattern as `schemas/`.
- Only UUIDs, names, and emails go in the file — no credentials, no DB passwords.
- Refresh it when data goes stale (users deactivated, emails changed) by re-running the script and committing.
- **Local runs** always hit the live DB for fresh random users. **CI** uses the committed fallback automatically.

### Request Body Helpers

- Use `buildDoNotSellBody(user, overrides, testId)` to construct request bodies — do not duplicate the payload structure in each test.
- Pass the test ID as the third argument so `dsarRequestId` includes the test case number (e.g. `DNS-001-1727789423456`) — makes DB lookups trivial.

### Assertions

- Always assert the HTTP status code before reading the response body.
- Use `validateResponse(Schema, json)` to validate response shape via Zod before accessing fields.
- For DB assertions, use `getDbRequest(orchestratorRequestId)` with a polling loop — the DB write may be slightly behind the API response.

```typescript
expect(response.status()).toBe(201);
const json = await response.json();
const validated = await validateResponse(DoNotSellPostResponseSchema, json);
const id = validated.data.attributes.payload.orchestratorRequestId;
```

### What NOT to Assert in API Tests

| Scenario | Reason |
|---|---|
| `data_privacy_customer` at INITIAL state | This table is only written when the request moves to IN_PROGRESS |
| Exact count changes on shared endpoints | Server-side caching makes before/after deltas unreliable |
| Pre-existing DB records from other runs | Staging DB is shared — don't assume a clean state |

---

## 5. Database Assertions

- Use `query()` from `src/helpers/dbHelper.ts` for the data-privacy (MySQL) database.
- Use `csmQuery()` from `src/helpers/csmDbHelper.ts` for the CSM (PostgreSQL) subscriber database.
- Never run destructive queries (`DELETE`, `UPDATE`, `TRUNCATE`) from tests — read-only assertions only.
- When polling for a DB state change, always set a deadline and fail with a meaningful message if the state never arrives:

```typescript
const deadline = Date.now() + 30_000;
let row: DpRequest | null = null;

while (Date.now() < deadline) {
  row = await getDbRequest(orchestratorRequestId);
  if (row?.status === 'INITIAL') break;
  await new Promise(r => setTimeout(r, 1000));
}

expect(row, `DB row never appeared for ${orchestratorRequestId}`).not.toBeNull();
expect(row!.status).toBe('INITIAL');
```

---

## 6. Authentication & Tokens

This framework uses **OAuth2 Client Credentials** via AWS Cognito. There are three token pools:

| Token | Helper | Used For |
|---|---|---|
| CDPR Service API | `getToken()` | All `/api/v1/customer-data-privacy/` calls |
| Batches API | `getBatchesToken()` | Workflow trigger (`/api/v1/batches/`) |
| UAP | `getUapToken()` | User attribute lookup (internal, called by `getUsersByUuids()`) |

- Always use `getStandardHeaders(token)` to build request headers — it sets `Authorization`, `Content-Type`, and any required correlation headers.
- For auth failure tests (401), destructure the headers and remove `Authorization`:
  ```typescript
  const { Authorization: _, ...noAuthHeaders } = getStandardHeaders(token);
  ```

---

## 7. Schema Validation

All API responses must be validated against a Zod schema before field access. Schemas live in `tests/<feature>/schemas/`.

```typescript
import { DoNotSellPostResponseSchema } from '../schemas/do-not-sell.schema';

const validated = await validateResponse(DoNotSellPostResponseSchema, await response.json());
// Now access fields safely — TypeScript knows the shape
const id = validated.data.attributes.payload.orchestratorRequestId;
```

**Schema authoring rules:**
- Use `.optional()` for fields the API may or may not return.
- Use `.nullable()` for fields the API returns as `null`.
- Use `.strict()` on top-level schemas in development to catch unexpected fields early.
- Keep schemas co-located with the test file that uses them.

---

## 8. Allure Reporting

This framework uses `allure-playwright` for test reporting.

- All `expect()` calls are automatically wrapped in Allure steps via `src/helpers/allureExpect.ts`.
- Do **not** call `allure.step()` manually around `expect()` — it causes async step bleed across tests in parallel workers.
- Use `allure.attachment()` for attaching request/response bodies to failing tests — the DB helper does this automatically for every query.
- Test IDs in names (`DNS-001`, `WFT-025`) map to Allure test case labels.

**Generating the report locally:**
```bash
npx playwright test --project=API
npx allure generate allure-results --clean -o allure-report
npx allure open allure-report
```

---

## 9. Environment & Configuration

### `.env` file

All environment-specific values live in `.env`. It is in `.gitignore` and must **never** be committed.

Required variables:

```
# Data Privacy API
CDPR_BASE_URL=
CDPR_OAUTH_TOKEN_URL=
CDPR_OAUTH_CLIENT_ID=
CDPR_OAUTH_CLIENT_SECRET=

# Batches API
BATCHES_BASE_URL=
BATCHES_OAUTH_TOKEN_URL=
BATCHES_OAUTH_CLIENT_ID=
BATCHES_OAUTH_CLIENT_SECRET=

# UAP API
UAP_BASE_URL=
UAP_OAUTH_TOKEN_URL=
UAP_OAUTH_CLIENT_ID=
UAP_OAUTH_CLIENT_SECRET=

# Databases
DATABASE_URL=           # mysql:// or postgresql://  (data-privacy DB)
CSM_DATABASE_URL=       # postgresql://              (CSM subscriber DB)
```

### `playwright.config.ts`

- Set `timeout` at the **project level** for API tests — do not set `test.setTimeout()` inside test files except for `beforeAll` or genuinely long-running individual tests.
- Set `workers` via the `WORKERS` environment variable for local tuning — default is Playwright's auto-detected value.
- The `API` project uses `testMatch: '**/tests/data-privacy/**/*.spec.ts'` and requires no browser.

---

## 10. CI/CD Guidelines

- The `regression.yml` workflow runs the full suite on every PR targeting `main`.
- API tests run under `--project=API` — no browser required, faster and cheaper to run in CI.
- UI tests run under `--project=Chrome` (or BrowserStack presets when `USE_BROWSERSTACK=true`).
- All secrets are injected as GitHub Actions secrets — never hardcode them in workflow files.
- `allure-results/` is uploaded as a CI artifact for every run.
- A test marked `test.skip()` is a known environment limitation — it will not block CI. Document the reason in a comment above the skip.

### Marking Tests Intentionally

| Decorator | When to use |
|---|---|
| `test.skip()` | Known environment limitation or pre-existing DB data state we don't control |
| `test.fail()` | Test documents a known bug — expected to fail until the bug is fixed |
| `test.fixme()` | Test is incomplete or needs rework — do not merge unfinished tests |

---

*Last updated: October 2026*
