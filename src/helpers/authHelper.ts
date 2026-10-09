import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config();
// Load pre-fetched tokens written by globalSetup (no-op if file doesn't exist)
dotenv.config({ path: path.resolve(process.cwd(), '.env.tokens'), override: false });

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface CachedToken {
  token: string;
  expiresAt: number;
}

const tokenCache: Map<string, CachedToken> = new Map();

/**
 * Fetch OAuth2 token using Client Credentials flow.
 * Caches the token until it expires.
 *
 * Usage: const token = await getOAuthToken();
 *
 * Required .env variables:
 *   OAUTH_TOKEN_URL     - Token endpoint URL
 *   OAUTH_CLIENT_ID     - Client ID
 *   OAUTH_CLIENT_SECRET - Client secret
 *   OAUTH_SCOPE         - (optional) Space-separated scopes
 */
export async function getOAuthToken(
  tokenUrl?: string,
  clientId?: string,
  clientSecret?: string,
  scope?: string
): Promise<string> {
  const url = tokenUrl || process.env.OAUTH_TOKEN_URL || '';
  const id = clientId || process.env.OAUTH_CLIENT_ID || '';
  const secret = clientSecret || process.env.OAUTH_CLIENT_SECRET || '';
  const oauthScope = scope || process.env.OAUTH_SCOPE || '';

  if (!url || !id || !secret) {
    throw new Error(
      'Missing OAuth2 config. Set OAUTH_TOKEN_URL, OAUTH_CLIENT_ID, OAUTH_CLIENT_SECRET in .env'
    );
  }

  // Check if globalSetup pre-fetched this token — use it directly if available
  const prefix = tokenUrl ? '' : 'OAUTH_';
  const preFetchedKey = tokenUrl
    ? null
    : clientId === process.env.BATCHES_OAUTH_CLIENT_ID ? 'BATCHES_OAUTH_TOKEN'
    : clientId === process.env.UAP_OAUTH_CLIENT_ID    ? 'UAP_OAUTH_TOKEN'
    : 'OAUTH_TOKEN';
  if (preFetchedKey && process.env[preFetchedKey]) {
    return process.env[preFetchedKey]!;
  }

  const cacheKey = `${url}::${id}`;
  const cached = tokenCache.get(cacheKey);

  // Return cached token if still valid (with 30s buffer)
  if (cached && Date.now() < cached.expiresAt - 30_000) {
    return cached.token;
  }

  // Build form body — Cognito requires credentials in Basic Auth header
  const params = new URLSearchParams({ grant_type: 'client_credentials' });

  if (oauthScope) {
    params.append('scope', oauthScope);
  }

  const credentials = Buffer.from(`${id}:${secret}`).toString('base64');

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${credentials}`,
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OAuth2 token request failed [${response.status}]: ${error}`);
  }

  const data = (await response.json()) as TokenResponse;

  // Cache the token
  tokenCache.set(cacheKey, {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  });

  return data.access_token;
}

/**
 * Returns Authorization header value: "Bearer <token>"
 * Use this directly in restClient or RequestBuilder
 */
export async function getBearerHeader(
  tokenUrl?: string,
  clientId?: string,
  clientSecret?: string,
  scope?: string
): Promise<string> {
  const token = await getOAuthToken(tokenUrl, clientId, clientSecret, scope);
  return `Bearer ${token}`;
}

/**
 * Clears the token cache (useful between test suites)
 */
export function clearTokenCache(): void {
  tokenCache.clear();
}

/**
 * Shorthand for CDPR Service API token (uses OAUTH_* env vars)
 * Returns "Bearer <token>"
 */
export async function getToken(): Promise<string> {
  return getBearerHeader();
}

/**
 * Token for the Batches service (uses BATCHES_OAUTH_* env vars — separate Cognito pool)
 * Returns "Bearer <token>"
 */
export async function getBatchesToken(): Promise<string> {
  return getBearerHeader(
    process.env.BATCHES_OAUTH_TOKEN_URL,
    process.env.BATCHES_OAUTH_CLIENT_ID,
    process.env.BATCHES_OAUTH_CLIENT_SECRET,
  );
}
