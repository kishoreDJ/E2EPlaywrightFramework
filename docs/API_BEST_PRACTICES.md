# API Automation Best Practices & Debugging Standards

This document is written specifically for the **Playwright API automation framework** in this repository. It covers how to use the framework correctly, how to write clean API tests, and how to debug failures quickly.

---

## Table of Contents

1. [How to Use Fixtures & Helpers](#1-how-to-use-fixtures--helpers)
2. [Authentication & Token Management](#2-authentication--token-management)
3. [Schema & Contract Validation](#3-schema--contract-validation)
4. [Database Setup & Cleanup](#4-database-setup--cleanup)
5. [Test Data & Secret Handling](#5-test-data--secret-handling)
6. [Allure Reporting](#6-allure-reporting)
7. [Failure Analysis & Debugging](#7-failure-analysis--debugging)
8. [PR Code Review Checklist](#8-pr-code-review-checklist)

---

## 1. How to Use Fixtures & Helpers

### Always use the `api` fixture in tests

Import `test` from the fixture file, not from `@playwright/test` directly. This gives you the Allure-instrumented `api` client which automatically attaches request bodies, response bodies, and status codes to every Allure report step.

```typescript
// ✅ Correct — use the framework fixture
import { test, expect } from '../../src/fixtures/rest-client.fixture';

test('POST API-001: valid request returns 201', async ({ api }) => {
  const response = await api.post('https://your-api.com/endpoint', {
    headers: getStandardHeaders(token),
    data: requestBody,
  });
  expect(response.status()).toBe(201);
});
```

```typescript
// ❌ Wrong — bypasses Allure instrumentation
import { test } from '@playwright/test';

test('my test', async ({ request }) => {
  const response = await request.post(...); // no Allure steps, no attachments
});
```

### `api` fixture vs `restClient` fixture

| | `api` | `restClient` |
|---|---|---|
| What it is | Thin Allure-instrumented wrapper over Playwright `request` | Full `BaseRestClient` with fluent builder, retries, SSL config |
| When to use | All standard API tests | Complex scenarios: retries, file uploads, form data, custom SSL |
| Allure steps | Automatic | Automatic |
| Import from | `src/fixtures/rest-client.fixture` | `src/fixtures/rest-client.fixture` |

Use `api` by default. Only switch to `restClient` when you need retry logic, file upload (`postFormData`), or advanced connection configuration.

### Never call `apiClient.ts` directly in tests

`apiClient.ts` is an internal helper used by the fixture. Test files should never import it directly — always go through the fixture.

```typescript
// ❌ Wrong
import { apiClient } from '../../src/helpers/apiClient';
const client = apiClient(request);

// ✅ Correct
import { test } from '../../src/fixtures/rest-client.fixture';
// use { api } from the fixture
```

---

## 2. Authentication & Token Management

### How token pre-fetching works

Tokens are fetched **once** before any test runs via `globalSetup`, written to `.env.tokens`, and loaded by all workers automatically. You never need to fetch tokens manually in `beforeAll` for standard OAuth flows.

```
Run starts
  → globalSetup scans env vars for *_OAUTH_* groups
  → fetches one token per group (OAUTH, BATCHES_OAUTH, PAYMENTS_OAUTH, etc.)
  → writes to .env.tokens
All workers start
  → read tokens from .env.tokens as env vars
  → no Cognito calls during test execution
Run ends
  → globalTeardown deletes .env.tokens
```

### OAuth env var naming — MANDATORY pattern

Every OAuth credential set **must** follow this naming convention for `globalSetup` to detect it:

```
<PREFIX>_OAUTH_TOKEN_URL
<PREFIX>_OAUTH_CLIENT_ID
<PREFIX>_OAUTH_CLIENT_SECRET
<PREFIX>_OAUTH_SCOPE        ← optional
```

**Examples:**
```
# Primary API (no prefix)
OAUTH_TOKEN_URL=https://cognito.../oauth2/token
OAUTH_CLIENT_ID=abc123
OAUTH_CLIENT_SECRET=secret

# Batches service
BATCHES_OAUTH_TOKEN_URL=https://cognito.../oauth2/token
BATCHES_OAUTH_CLIENT_ID=def456
BATCHES_OAUTH_CLIENT_SECRET=secret

# Any new service — just add the vars, globalSetup picks them up automatically
PAYMENTS_OAUTH_TOKEN_URL=...
PAYMENTS_OAUTH_CLIENT_ID=...
PAYMENTS_OAUTH_CLIENT_SECRET=...
```

**Rules:**
- All 3 vars must be present together — a partial set throws a clear error at startup
- Never put only 1 or 2 vars — either all 3 or none
- New services need no code change — just add the env vars

### Using tokens in tests

Fetch tokens once in `beforeAll`, share via a module-level variable:

```typescript
import { getToken, getBatchesToken } from '../../src/helpers/authHelper';
import { getStandardHeaders } from '../../src/helpers/requestHeaders';

let token: string;
let batchesToken: string;

test.beforeAll(async () => {
  [token, batchesToken] = await Promise.all([getToken(), getBatchesToken()]);
});

test('my test', async ({ api }) => {
  const response = await api.post(url, {
    headers: getStandardHeaders(token),
    data: body,
  });
});
```

### Testing auth failures (401 tests)

Remove the `Authorization` header using destructuring:

```typescript
const { Authorization: _, ...noAuthHeaders } = getStandardHeaders(token);
const response = await api.post(url, { headers: noAuthHeaders, data: body });
expect(response.status()).toBe(401);
```

---

## 3. Schema & Contract Validation

### Always validate response shape before accessing fields

Use `validateResponse()` from `src/schema-validation/validator.ts` after every successful response. This gives you:
- Type-safe access to response fields
- Automatic Allure attachment showing which fields failed
- Clear error messages listing every schema violation

```typescript
import { validateResponse } from '../../src/schema-validation/validator';
import { MyApiPostResponseSchema } from './schemas/my-endpoint.schema';

test('POST API-001: valid request returns 201', async ({ api }) => {
  const response = await api.post(url, { headers: getStandardHeaders(token), data: body });
  
  // 1. Assert status first
  expect(response.status()).toBe(201);
  
  // 2. Validate schema — throws with detailed errors if shape is wrong
  const validated = await validateResponse(MyApiPostResponseSchema, await response.json());
  
  // 3. Now safely access fields — TypeScript knows the shape
  expect(validated.data.attributes.payload.requestId).toBeTruthy();
  expect(validated.data.attributes.payload.requestStatus).toBe('Initial');
});
```

### Where schemas live

Schemas are co-located with the tests that use them:

```
tests/
└── <feature>/
    ├── schemas/
    │   └── my-endpoint.schema.ts   ← Zod schemas for this suite
    └── my-endpoint.spec.ts
```

Never put test-specific schemas in `src/` — they belong next to the tests.

### Writing schemas

```typescript
import { z } from 'zod';

export const MyApiPostResponseSchema = z.object({
  data: z.object({
    attributes: z.object({
      payload: z.object({
        requestId: z.string(),
        requestStatus: z.string(),
        requestType: z.string(),
        email: z.string().email(),
      }),
    }),
  }),
});
```

**Rules:**
- Use `.optional()` for fields the API may or may not return
- Use `.nullable()` for fields that can be `null`
- Always assert status code **before** calling `validateResponse` — don't validate error response bodies against success schemas

---

## 4. Database Setup & Cleanup

### Read-only rule — never mutate test data

Test helpers are **read-only**. Never run `INSERT`, `UPDATE`, `DELETE`, or `TRUNCATE` from tests. Mutating data from tests makes them non-deterministic — a test that cleans up after itself can still leave the DB in an inconsistent state if it fails midway, causing unrelated tests to break on the next run.

```typescript
// ✅ Correct — read only
const row = await query('SELECT * FROM data_privacy_request WHERE orchestrator_request_id = $1', [id]);

// ❌ Wrong — never do this
await query('DELETE FROM data_privacy_request WHERE orchestrator_request_id = $1', [id]);
```

### Which helper to use

Create one DB helper per database your suite touches. A common pattern:

| Helper | Database | Use for |
|---|---|---|
| Primary DB helper (e.g. `query()`) | Primary service DB (`DATABASE_URL`) | Asserting request state, verifying records created by the API |
| Secondary DB helper (e.g. `seedQuery()`) | Supporting service DB (`SECONDARY_DATABASE_URL`) | Fetching seed data (e.g. user records, subscription state) for test setup |

### Polling for DB state changes

The DB write may lag behind the API response. Always poll with a deadline:

```typescript
const deadline = Date.now() + 30_000;
let row = null;

while (Date.now() < deadline) {
  [row] = await query('SELECT * FROM data_privacy_request WHERE orchestrator_request_id = $1', [id]);
  if (row?.status === 'INITIAL') break;
  await new Promise(r => setTimeout(r, 1000));
}

expect(row, `DB row never appeared for ${id}`).not.toBeNull();
expect(row!.status).toBe('INITIAL');
```

### Always close DB connections in `afterAll`

Close every connection pool your suite opened — one call per helper:

```typescript
import { closeDb } from '../../src/helpers/dbHelper';

test.afterAll(async () => {
  await closeDb(); // add closeXyzDb() for each additional DB pool opened
});
```

### Fallback users for CI

Supporting databases (subscriber DBs, seed DBs) are often on private networks unreachable from GitHub Actions. Every suite that fetches users from such a DB must provide a committed fallback file:

```
tests/<feature>/data/users.ts
```

Pattern in `beforeAll`:
```typescript
let users: MyUser[];
try {
  users = await fetchUsersFromDb(); // your DB helper to get test users
} catch {
  const { fallbackUsers } = await import('./data/users');
  users = fallbackUsers;
}
```

Refresh the fallback file when data goes stale:
```bash
npx tsx scripts/generate-fallback-users.ts
```

---

## 5. Test Data & Secret Handling

### Never hardcode credentials or URLs

```typescript
// ❌ Wrong — hardcoded values
const response = await api.post('https://api-stg.example.com/endpoint', {
  headers: { Authorization: 'Bearer eyJhbGci...' },
});

// ✅ Correct — always from env vars
const BASE_URL = process.env.API_BASE_URL!;
const response = await api.post(`${BASE_URL}/endpoint`, {
  headers: getStandardHeaders(token),
});
```

### Use builder functions for request bodies

Never duplicate payload structure across tests. Use a builder function:

```typescript
// ✅ Correct — shared builder with overrides
function buildRequestBody(user: TestUser, overrides = {}, testId = '') {
  return {
    data: {
      type: 'your-resource-type',
      attributes: {
        payload: {
          ...(user.firstName && { firstName: user.firstName }),
          ...(user.lastName  && { lastName:  user.lastName  }),
          email: user.email,
          requestId: `${testId}-${Date.now()}`,
          requestType: 'YOUR_REQUEST_TYPE',
          ...overrides,
        },
      },
    },
  };
}

// In tests — pass the test ID so DB lookups are easy
const body = buildRequestBody(user, {}, 'API-001');
```

### Conditional spread for optional fields

Some APIs reject empty strings for optional fields with 400. Always use conditional spread for fields that may be absent:

```typescript
// ✅ Correct
{
  ...(user.firstName && { firstName: user.firstName }),
  ...(user.lastName  && { lastName:  user.lastName  }),
  email: user.email,
}

// ❌ Wrong — sends empty string, gets 400
{
  firstName: user.firstName,
  lastName: user.lastName,
  email: user.email,
}
```

### Required `.env` variables

All secrets live in `.env` (never committed). Copy `.env.example` to `.env` and fill in values:

```
OAUTH_TOKEN_URL=
OAUTH_CLIENT_ID=
OAUTH_CLIENT_SECRET=

BATCHES_OAUTH_TOKEN_URL=
BATCHES_OAUTH_CLIENT_ID=
BATCHES_OAUTH_CLIENT_SECRET=

SECONDARY_OAUTH_TOKEN_URL=
SECONDARY_OAUTH_CLIENT_ID=
SECONDARY_OAUTH_CLIENT_SECRET=

API_BASE_URL=
DATABASE_URL=
SECONDARY_DATABASE_URL=
```

---

## 6. Allure Reporting

### What is attached automatically

Every `api.post / api.get / api.put / api.delete / api.patch` call via the `api` fixture automatically attaches to the Allure report:
- **Request Body** — the payload sent
- **Response (`<status>`)** — the full response body with status code

Every `expect()` call is automatically wrapped in an Allure step showing the assertion label (e.g. `Assert "201" equals "201"`). You do **not** need to call `allure.step()` manually around `expect()` — doing so in parallel workers causes async step bleed across tests.

### Suite labelling via tags

Group tests into Allure suites using tags at the `describe` level:

```typescript
test.describe('Do Not Sell', { tag: '@regression' }, () => {
  test('API-001: valid request returns 201', { tag: '@smoke' }, async ({ api }) => {
    // appears in both Smoke and Regression suites in the Allure report
  });
});
```

| Tag | Allure suite |
|---|---|
| `@smoke` | Smoke Test Suite |
| `@regression` | Regression Test Suite |

### Use `test.step()` for logical grouping

Wrap multi-call sequences in `test.step()` so the Allure report shows a readable story:

```typescript
test('API-001: valid request returns 201', async ({ api }) => {
  await test.step('Send POST request with valid payload', async () => {
    response = await api.post(url, { headers: getStandardHeaders(token), data: body });
  });

  await test.step('Assert status and validate response schema', async () => {
    expect(response.status()).toBe(201);
    const validated = await validateResponse(MyApiResponseSchema, await response.json());
    expect(validated.data.attributes.requestId).toBeTruthy();
  });
});
```

Write step names as human-readable actions — they are the first thing reviewers read when a test fails in CI.

### Attaching extra context manually

Use `allure.attachment()` to attach additional debug context (e.g. a DB query result, a raw payload):

```typescript
import { allure } from 'allure-playwright';

await allure.attachment('DB row', JSON.stringify(row, null, 2), 'application/json');
```

The DB helpers in this framework already do this automatically for every query result.

### Generating the report locally

```bash
npx playwright test --project=API
npx allure generate allure-results --clean -o allure-report
npx allure open allure-report
```

---

## 7. Failure Analysis & Debugging

### Step 1: HTTP Status Code mismatch

**Symptom:** `Expected: 201 / Received: 400` or `Expected: 200 / Received: 401`

**How to debug:**
1. Open the Allure report — find the failed test
2. Click the `POST /endpoint — Response (400)` attachment — it shows the full error body
3. Read `errorMessage` — it tells you exactly what the API rejected

**Common causes:**

| Status | Likely cause |
|---|---|
| 400 | Empty `firstName`/`lastName` sent — use conditional spread |
| 401 | Token expired or wrong token pool — check `getToken()` vs `getBatchesToken()` |
| 401 | Missing `Authorization` header — check `getStandardHeaders(token)` is called |
| 500 | Missing required query param — e.g. `skipCache` not passed |

---

### Step 2: Schema validation errors

**Symptom:** `Schema Validation Failed (2 issues): • [data.attributes.payload.totalRequests]: Expected number, received object`

**How to debug:**
1. Open Allure report → find `Schema Validation Errors` attachment
2. It lists every field that failed with the rule that was violated
3. Check if the field is nested deeper than expected — e.g. `payload.YOUR_TYPE.totalRequests` not `payload.totalRequests`
4. Update the schema or the field access path accordingly

---

### Step 3: Allure report attachments

Every `api.post/get/put/delete/patch` call automatically attaches:
- **Request Body** — what was sent
- **Response (status)** — what came back

Every `expect()` call automatically becomes an Allure step showing the assertion label.

**To generate and open the report locally:**
```bash
npx playwright test --project=API
npx allure generate allure-results --clean -o allure-report
npx allure open allure-report
```

**Terminal logs** — for 4xx/5xx responses, `apiClient.ts` prints to terminal:
```
[API] POST /api/v1/your-endpoint/ [400]: {"errorMessage":"Email is mandatory."}
```

Check terminal output first before opening the report — it's faster for quick diagnosis.

---

### Step 4: Database connection timeouts

**Symptom:** `Error: connect ETIMEDOUT 10.x.x.x:5432` in `beforeAll`

**Causes and fixes:**

| Cause | Fix |
|---|---|
| Running in CI — supporting DB is on a private network | Ensure `tests/<feature>/data/users.ts` fallback file is populated and committed |
| `DATABASE_URL` not set in `.env` | Add the connection string to `.env` |
| VPN not connected locally | Connect to VPN before running tests |
| Pool not closed after tests | Add the appropriate `closeDb()` helper(s) in `afterAll` |

---

## 8. PR Code Review Checklist

Use this checklist when reviewing any API automation pull request:

### Test Structure
- [ ] Test file imports `test` from `src/fixtures/rest-client.fixture` not from `@playwright/test`
- [ ] Tokens fetched once in `beforeAll` — not inside individual tests
- [ ] DB connection pool closed in `afterAll` using the appropriate `closeDb()` helper for each DB used

### API Calls
- [ ] All requests use `{ api }` fixture — no raw `request` or `fetch` calls
- [ ] All requests use `getStandardHeaders(token)` — no manually constructed auth headers
- [ ] No hardcoded URLs — all from `process.env`
- [ ] Conditional spread used for optional name fields — no empty strings sent

### Assertions
- [ ] HTTP status asserted **before** reading response body
- [ ] `validateResponse(Schema, json)` used before accessing response fields
- [ ] No assertions against shared mutable state (counts, totals) without accounting for concurrent test runs
- [ ] DB assertions use a polling loop with a deadline — not a fixed `setTimeout`

### Schema
- [ ] Schema file lives in `tests/<feature>/schemas/` — not in `src/`
- [ ] Optional fields use `.optional()` — required fields have no modifier
- [ ] Schema is imported and used in at least the happy-path test

### Test Data
- [ ] No hardcoded credentials, tokens, or passwords anywhere in the file
- [ ] Request bodies built via a shared builder function — no duplicated payload structures
- [ ] Fallback users file (`tests/<feature>/data/users.ts`) populated if suite fetches users from a private/external DB

### CI & Skips
- [ ] `test.skip()` used only for known environment limitations — with a comment explaining why
- [ ] `test.fail()` used for known bugs — not as a way to ignore real failures
- [ ] No `test.only()` committed — blocked by `forbidOnly: true` on CI

---

*Last updated: October 2026*
