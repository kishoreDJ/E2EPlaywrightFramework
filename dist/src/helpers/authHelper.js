"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOAuthToken = getOAuthToken;
exports.getBearerHeader = getBearerHeader;
exports.clearTokenCache = clearTokenCache;
exports.getToken = getToken;
exports.getBatchesToken = getBatchesToken;
const dotenv = __importStar(require("dotenv"));
const path = __importStar(require("path"));
dotenv.config();
// Load pre-fetched tokens written by globalSetup (no-op if file doesn't exist)
dotenv.config({ path: path.resolve(process.cwd(), '.env.tokens'), override: false });
const tokenCache = new Map();
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
async function getOAuthToken(tokenUrl, clientId, clientSecret, scope) {
    const url = tokenUrl || process.env.OAUTH_TOKEN_URL || '';
    const id = clientId || process.env.OAUTH_CLIENT_ID || '';
    const secret = clientSecret || process.env.OAUTH_CLIENT_SECRET || '';
    const oauthScope = scope || process.env.OAUTH_SCOPE || '';
    if (!url || !id || !secret) {
        throw new Error('Missing OAuth2 config. Set OAUTH_TOKEN_URL, OAUTH_CLIENT_ID, OAUTH_CLIENT_SECRET in .env');
    }
    // Check if globalSetup pre-fetched this token — use it directly if available
    const prefix = tokenUrl ? '' : 'OAUTH_';
    const preFetchedKey = tokenUrl
        ? null
        : clientId === process.env.BATCHES_OAUTH_CLIENT_ID ? 'BATCHES_OAUTH_TOKEN'
            : clientId === process.env.UAP_OAUTH_CLIENT_ID ? 'UAP_OAUTH_TOKEN'
                : 'OAUTH_TOKEN';
    if (preFetchedKey && process.env[preFetchedKey]) {
        return process.env[preFetchedKey];
    }
    const cacheKey = `${url}::${id}`;
    const cached = tokenCache.get(cacheKey);
    // Return cached token if still valid (with 30s buffer)
    if (cached && Date.now() < cached.expiresAt - 30000) {
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
    const data = (await response.json());
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
async function getBearerHeader(tokenUrl, clientId, clientSecret, scope) {
    const token = await getOAuthToken(tokenUrl, clientId, clientSecret, scope);
    return `Bearer ${token}`;
}
/**
 * Clears the token cache (useful between test suites)
 */
function clearTokenCache() {
    tokenCache.clear();
}
/**
 * Shorthand for CDPR Service API token (uses OAUTH_* env vars)
 * Returns "Bearer <token>"
 */
async function getToken() {
    return getBearerHeader();
}
/**
 * Token for the Batches service (uses BATCHES_OAUTH_* env vars — separate Cognito pool)
 * Returns "Bearer <token>"
 */
async function getBatchesToken() {
    return getBearerHeader(process.env.BATCHES_OAUTH_TOKEN_URL, process.env.BATCHES_OAUTH_CLIENT_ID, process.env.BATCHES_OAUTH_CLIENT_SECRET);
}
