/**
 * REST Connection - Core abstraction for Playwright APIRequestContext
 * Handles endpoint configuration, SSL/TLS, authentication, and HTTP version
 */
import { APIRequestContext } from '@playwright/test';
export interface SSLConfig {
    verifySSL: boolean;
    certificatePath?: string;
    privateKeyPath?: string;
    rejectUnauthorized?: boolean;
}
export interface RestConnectionConfig {
    baseUrl: string;
    headers?: Record<string, string>;
    timeout?: number;
    ssl?: SSLConfig;
    httpVersion?: '1.0' | '1.1' | '2.0';
}
export interface AuthConfig {
    type: 'BASIC' | 'BEARER' | 'API_KEY' | 'CUSTOM';
    credentials?: {
        username?: string;
        password?: string;
        token?: string;
        apiKey?: string;
        customHeader?: string;
        customValue?: string;
    };
}
export declare class RestConnection {
    private context;
    private config;
    private authConfig;
    private customHeaders;
    constructor(context: APIRequestContext, config: RestConnectionConfig);
    /**
     * Set the base URL for all requests
     */
    setBaseUrl(url: string): RestConnection;
    /**
     * Get the current base URL
     */
    getBaseUrl(): string;
    /**
     * Validate base URL is reachable
     */
    validateConnection(): Promise<boolean>;
    /**
     * Set or replace all headers
     */
    setHeaders(headers: Record<string, string>): RestConnection;
    /**
     * Add a single header (merge with existing)
     */
    addHeader(key: string, value: string): RestConnection;
    /**
     * Add multiple headers (merge with existing)
     */
    addHeaders(headers: Record<string, string>): RestConnection;
    /**
     * Remove a header
     */
    removeHeader(key: string): RestConnection;
    /**
     * Get all headers including auth headers
     */
    getHeaders(): Record<string, string>;
    /**
     * Configure Basic Authentication
     */
    setBasicAuth(username: string, password: string): RestConnection;
    /**
     * Configure Bearer Token Authentication
     */
    setBearerToken(token: string): RestConnection;
    /**
     * Configure API Key Authentication
     */
    setApiKey(apiKey: string, headerName?: string): RestConnection;
    /**
     * Configure Custom Header Authentication
     */
    setCustomAuth(headerName: string, headerValue: string): RestConnection;
    /**
     * Clear authentication
     */
    clearAuth(): RestConnection;
    /**
     * Build authentication header based on config
     */
    private buildAuthHeader;
    /**
     * Enable or disable SSL certificate verification
     */
    setSSLVerification(enabled: boolean): RestConnection;
    /**
     * Get SSL verification status
     */
    isSSLVerified(): boolean;
    /**
     * Add certificate to connection
     */
    addCertificate(certPath: string, keyPath?: string): RestConnection;
    /**
     * Validate certificate
     */
    validateCertificate(): Promise<{
        valid: boolean;
        message: string;
    }>;
    /**
     * Get SSL configuration
     */
    getSSLConfig(): SSLConfig;
    /**
     * Set HTTP version
     */
    setHTTPVersion(version: '1.0' | '1.1' | '2.0'): RestConnection;
    /**
     * Get HTTP version
     */
    getHTTPVersion(): string;
    /**
     * Set request timeout
     */
    setTimeout(timeoutMs: number): RestConnection;
    /**
     * Get timeout
     */
    getTimeout(): number;
    /**
     * Get the underlying Playwright APIRequestContext
     * Used by REST Client to make actual requests
     */
    getContext(): APIRequestContext;
    /**
     * Get complete configuration
     */
    getConfig(): RestConnectionConfig;
    /**
     * Get connection summary
     */
    getConnectionInfo(): {
        baseUrl: string;
        httpVersion: string;
        sslVerified: boolean;
        authType: string | null;
        headerCount: number;
        timeout: number;
    };
    /**
     * Print connection details (useful for debugging)
     */
    printConnectionInfo(): void;
}
//# sourceMappingURL=rest-connection.d.ts.map