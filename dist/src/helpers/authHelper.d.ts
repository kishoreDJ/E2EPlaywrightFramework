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
export declare function getOAuthToken(tokenUrl?: string, clientId?: string, clientSecret?: string, scope?: string): Promise<string>;
/**
 * Returns Authorization header value: "Bearer <token>"
 * Use this directly in restClient or RequestBuilder
 */
export declare function getBearerHeader(tokenUrl?: string, clientId?: string, clientSecret?: string, scope?: string): Promise<string>;
/**
 * Clears the token cache (useful between test suites)
 */
export declare function clearTokenCache(): void;
/**
 * Shorthand for CDPR Service API token (uses OAUTH_* env vars)
 * Returns "Bearer <token>"
 */
export declare function getToken(): Promise<string>;
/**
 * Token for the Batches service (uses BATCHES_OAUTH_* env vars — separate Cognito pool)
 * Returns "Bearer <token>"
 */
export declare function getBatchesToken(): Promise<string>;
//# sourceMappingURL=authHelper.d.ts.map