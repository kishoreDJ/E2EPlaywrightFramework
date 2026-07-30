/**
 * REST Connection - Core abstraction for Playwright APIRequestContext
 * Handles endpoint configuration, SSL/TLS, authentication, and HTTP version
 */

import { APIRequestContext } from '@playwright/test';
import fs from 'fs';
import path from 'path';

// ==========================================
// Types & Interfaces
// ==========================================

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

// ==========================================
// REST Connection Class
// ==========================================

export class RestConnection {
  private context: APIRequestContext;
  private config: RestConnectionConfig;
  private authConfig: AuthConfig | null = null;
  private customHeaders: Record<string, string> = {};

  constructor(context: APIRequestContext, config: RestConnectionConfig) {
    this.context = context;
    this.config = {
      timeout: 30000,
      ssl: { verifySSL: true },
      httpVersion: '1.1',
      ...config,
    };
    this.customHeaders = config.headers || {};
  }

  // ==========================================
  // Base URL Management
  // ==========================================

  /**
   * Set the base URL for all requests
   */
  public setBaseUrl(url: string): RestConnection {
    if (!url.match(/^https?:\/\//)) {
      throw new Error(
        `Invalid base URL format. Expected http:// or https://. Got: ${url}`
      );
    }
    this.config.baseUrl = url;
    return this;
  }

  /**
   * Get the current base URL
   */
  public getBaseUrl(): string {
    return this.config.baseUrl;
  }

  /**
   * Validate base URL is reachable
   */
  public async validateConnection(): Promise<boolean> {
    try {
      const response = await this.context.get(this.config.baseUrl, {
        timeout: this.config.timeout,
      });
      return response.ok() || response.status() === 404; // 404 is ok, server is reachable
    } catch (error) {
      console.error(`Connection validation failed: ${error}`);
      return false;
    }
  }

  // ==========================================
  // Header Management
  // ==========================================

  /**
   * Set or replace all headers
   */
  public setHeaders(headers: Record<string, string>): RestConnection {
    this.customHeaders = { ...headers };
    return this;
  }

  /**
   * Add a single header (merge with existing)
   */
  public addHeader(key: string, value: string): RestConnection {
    this.customHeaders[key] = value;
    return this;
  }

  /**
   * Add multiple headers (merge with existing)
   */
  public addHeaders(headers: Record<string, string>): RestConnection {
    this.customHeaders = { ...this.customHeaders, ...headers };
    return this;
  }

  /**
   * Remove a header
   */
  public removeHeader(key: string): RestConnection {
    delete this.customHeaders[key];
    return this;
  }

  /**
   * Get all headers including auth headers
   */
  public getHeaders(): Record<string, string> {
    const headers = { ...this.customHeaders };

    // Add auth header if configured
    if (this.authConfig) {
      const authHeader = this.buildAuthHeader();
      if (authHeader) {
        Object.assign(headers, authHeader);
      }
    }

    return headers;
  }

  // ==========================================
  // Authentication Management
  // ==========================================

  /**
   * Configure Basic Authentication
   */
  public setBasicAuth(username: string, password: string): RestConnection {
    this.authConfig = {
      type: 'BASIC',
      credentials: { username, password },
    };
    return this;
  }

  /**
   * Configure Bearer Token Authentication
   */
  public setBearerToken(token: string): RestConnection {
    this.authConfig = {
      type: 'BEARER',
      credentials: { token },
    };
    return this;
  }

  /**
   * Configure API Key Authentication
   */
  public setApiKey(apiKey: string, headerName: string = 'X-API-Key'): RestConnection {
    this.authConfig = {
      type: 'API_KEY',
      credentials: { apiKey, customHeader: headerName },
    };
    return this;
  }

  /**
   * Configure Custom Header Authentication
   */
  public setCustomAuth(headerName: string, headerValue: string): RestConnection {
    this.authConfig = {
      type: 'CUSTOM',
      credentials: { customHeader: headerName, customValue: headerValue },
    };
    return this;
  }

  /**
   * Clear authentication
   */
  public clearAuth(): RestConnection {
    this.authConfig = null;
    return this;
  }

  /**
   * Build authentication header based on config
   */
  private buildAuthHeader(): Record<string, string> | null {
    if (!this.authConfig || !this.authConfig.credentials) {
      return null;
    }

    const { type, credentials } = this.authConfig;

    switch (type) {
      case 'BASIC':
        const basicAuth = Buffer.from(
          `${credentials.username}:${credentials.password}`
        ).toString('base64');
        return { Authorization: `Basic ${basicAuth}` };

      case 'BEARER':
        return { Authorization: `Bearer ${credentials.token}` };

      case 'API_KEY':
        return {
          [credentials.customHeader || 'X-API-Key']: credentials.apiKey || '',
        };

      case 'CUSTOM':
        return {
          [credentials.customHeader || '']: credentials.customValue || '',
        };

      default:
        return null;
    }
  }

  // ==========================================
  // SSL/TLS Configuration
  // ==========================================

  /**
   * Enable or disable SSL certificate verification
   */
  public setSSLVerification(enabled: boolean): RestConnection {
    if (!this.config.ssl) {
      this.config.ssl = { verifySSL: enabled };
    }
    this.config.ssl.verifySSL = enabled;
    return this;
  }

  /**
   * Get SSL verification status
   */
  public isSSLVerified(): boolean {
    return this.config.ssl?.verifySSL ?? true;
  }

  /**
   * Add certificate to connection
   */
  public addCertificate(certPath: string, keyPath?: string): RestConnection {
    // Validate certificate file exists
    if (!fs.existsSync(certPath)) {
      throw new Error(`Certificate file not found: ${certPath}`);
    }

    if (keyPath && !fs.existsSync(keyPath)) {
      throw new Error(`Private key file not found: ${keyPath}`);
    }

    if (!this.config.ssl) {
      this.config.ssl = { verifySSL: true };
    }

    this.config.ssl.certificatePath = certPath;
    this.config.ssl.privateKeyPath = keyPath;

    return this;
  }

  /**
   * Validate certificate
   */
  public async validateCertificate(): Promise<{
    valid: boolean;
    message: string;
  }> {
    if (!this.config.ssl?.certificatePath) {
      return { valid: false, message: 'No certificate configured' };
    }

    try {
      const certContent = fs.readFileSync(this.config.ssl.certificatePath, 'utf8');

      // Basic validation: check if it looks like a certificate
      if (!certContent.includes('-----BEGIN CERTIFICATE-----')) {
        return { valid: false, message: 'Invalid certificate format' };
      }

      return {
        valid: true,
        message: `Certificate is valid: ${path.basename(
          this.config.ssl.certificatePath
        )}`,
      };
    } catch (error) {
      return {
        valid: false,
        message: `Certificate validation failed: ${error}`,
      };
    }
  }

  /**
   * Get SSL configuration
   */
  public getSSLConfig(): SSLConfig {
    return this.config.ssl || { verifySSL: true };
  }

  // ==========================================
  // HTTP Configuration
  // ==========================================

  /**
   * Set HTTP version
   */
  public setHTTPVersion(version: '1.0' | '1.1' | '2.0'): RestConnection {
    const validVersions = ['1.0', '1.1', '2.0'];
    if (!validVersions.includes(version)) {
      throw new Error(
        `Invalid HTTP version. Expected one of ${validVersions.join(', ')}`
      );
    }
    this.config.httpVersion = version;
    return this;
  }

  /**
   * Get HTTP version
   */
  public getHTTPVersion(): string {
    return this.config.httpVersion || '1.1';
  }

  /**
   * Set request timeout
   */
  public setTimeout(timeoutMs: number): RestConnection {
    if (timeoutMs < 0) {
      throw new Error('Timeout must be a positive number');
    }
    this.config.timeout = timeoutMs;
    return this;
  }

  /**
   * Get timeout
   */
  public getTimeout(): number {
    return this.config.timeout || 30000;
  }

  // ==========================================
  // Context Access
  // ==========================================

  /**
   * Get the underlying Playwright APIRequestContext
   * Used by REST Client to make actual requests
   */
  public getContext(): APIRequestContext {
    return this.context;
  }

  /**
   * Get complete configuration
   */
  public getConfig(): RestConnectionConfig {
    return { ...this.config };
  }

  // ==========================================
  // Connection Info & Debugging
  // ==========================================

  /**
   * Get connection summary
   */
  public getConnectionInfo(): {
    baseUrl: string;
    httpVersion: string;
    sslVerified: boolean;
    authType: string | null;
    headerCount: number;
    timeout: number;
  } {
    return {
      baseUrl: this.config.baseUrl,
      httpVersion: this.getHTTPVersion(),
      sslVerified: this.isSSLVerified(),
      authType: this.authConfig?.type || 'NONE',
      headerCount: Object.keys(this.getHeaders()).length,
      timeout: this.getTimeout(),
    };
  }

  /**
   * Print connection details (useful for debugging)
   */
  public printConnectionInfo(): void {
    const info = this.getConnectionInfo();
    console.log('==========================================');
    console.log('REST Connection Information');
    console.log('==========================================');
    console.log(`Base URL:        ${info.baseUrl}`);
    console.log(`HTTP Version:    ${info.httpVersion}`);
    console.log(`SSL Verified:    ${info.sslVerified}`);
    console.log(`Authentication:  ${info.authType}`);
    console.log(`Headers:         ${info.headerCount}`);
    console.log(`Timeout:         ${info.timeout}ms`);
    console.log('==========================================');
  }
}

// ==========================================
// Usage Examples
// ==========================================

/**
 * Example 1: Basic Connection
 */
async function example1_BasicConnection(context: APIRequestContext) {
  const connection = new RestConnection(context, {
    baseUrl: 'https://api.example.com',
  });

  connection.setHeaders({
    'Content-Type': 'application/json',
    'User-Agent': 'Test Framework',
  });

  await connection.validateConnection();
  console.log('Connection established');
}

/**
 * Example 2: Connection with Bearer Token
 */
async function example2_BearerTokenAuth(context: APIRequestContext) {
  const connection = new RestConnection(context, {
    baseUrl: 'https://api.example.com',
  });

  connection.setBearerToken('your-jwt-token-here');

  const headers = connection.getHeaders();
  console.log('Headers:', headers);
  // Will include: { Authorization: 'Bearer your-jwt-token-here' }
}

/**
 * Example 3: Connection with SSL Certificate
 */
async function example3_SSLCertificate(context: APIRequestContext) {
  const connection = new RestConnection(context, {
    baseUrl: 'https://secure-api.example.com',
  });

  connection.addCertificate(
    '/path/to/client-cert.pem',
    '/path/to/client-key.pem'
  );

  const validation = await connection.validateCertificate();
  console.log('Certificate validation:', validation);
}

/**
 * Example 4: HTTP Version Configuration
 */
async function example4_HTTPVersion(context: APIRequestContext) {
  const connection = new RestConnection(context, {
    baseUrl: 'https://api.example.com',
  });

  connection
    .setHTTPVersion('2.0')
    .setTimeout(60000)
    .addHeader('X-Request-ID', 'unique-id-123');

  connection.printConnectionInfo();
}

/**
 * Example 5: Complete Setup with All Options
 */
async function example5_CompleteSetup(context: APIRequestContext) {
  const connection = new RestConnection(context, {
    baseUrl: 'https://api.example.com',
    timeout: 45000,
    httpVersion: '2.0',
  });

  connection
    .setHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    })
    .setBearerToken('my-token')
    .setSSLVerification(true)
    .setTimeout(45000);

  // Validate everything is set up correctly
  const isConnected = await connection.validateConnection();
  console.log('Connection valid:', isConnected);

  connection.printConnectionInfo();
}

//export { RestConnection, RestConnectionConfig, SSLConfig, AuthConfig };
