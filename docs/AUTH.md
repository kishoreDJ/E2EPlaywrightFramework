# Authentication Helper

## Overview

`src/helpers/authHelper.ts` handles OAuth2 Client Credentials token acquisition, caching, and refresh. Any team can use it by setting environment variables in their `.env` file.

## Required .env Variables

```
OAUTH_TOKEN_URL=https://<your-auth-server>/oauth2/token
OAUTH_CLIENT_ID=<your-client-id>
OAUTH_CLIENT_SECRET=<your-client-secret>
OAUTH_SCOPE=<optional-scope>
```

## Usage in Tests

```typescript
import { getBearerHeader } from '../../src/helpers/authHelper';

test('my api test', async ({ restClient }) => {
  const token = await getBearerHeader();
  const response = await restClient.get('/api/endpoint', {
    headers: { Authorization: token }
  });
  expect(response.statusCode).toBe(200);
});
```

## How It Works

1. First call fetches the token from the token URL
2. Token is cached in memory until it expires (with 30s buffer)
3. On expiry, a new token is fetched automatically
4. Credentials are always read from `.env` — never hardcoded

## Notes

- `.env` is gitignored — credentials are never committed to git
- Each team sets their own `.env` values — the helper code stays the same
- If no scope is required, leave `OAUTH_SCOPE=` blank
