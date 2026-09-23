/**
 * REST Client - Fluent API for executing all HTTP operations
 * Supports: GET, POST, PUT, DELETE, PATCH, Form Data, File Uploads
 */

import { APIRequestContext } from '@playwright/test';
import { RestConnection } from '../connection/rest-connection';
import fs from 'fs';
import path from 'path';

// Allure attachment helper — no-ops gracefully if allure-playwright is not available
async function allureAttach(name: string, data: unknown): Promise<void> {
  try {
    const { allure } = await import('allure-playwright');
    await allure.attachment(name, JSON.stringify(data, null, 2), 'application/json');
  } catch {
    // allure not available in this context — skip silently
  }
}

// ==========================================
// Types & Interfaces
// ==========================================

export interface RequestOptions {
  timeout?: number;
  queryParams?: Record<string, string | number | boolean>;
  retryCount?: number;
  retryDelay?: number;
  headers?: Record<string, string>;
}

export interface FormField {
  name: string;
  value: string | number | boolean;
}

export interface FileUpload {
  fieldName: string;
  filePath: string;
  mimeType?: string;
}

// ==========================================
// REST Response Wrapper
// ==========================================

export class RestResponse {
  constructor(
    private response: any, // Playwright APIResponse
    private responseBody: string | Buffer,
    private executionTime: number
  ) {}

  get statusCode(): number {
    return this.response.status();
  }

  get statusText(): string {
    return this.response.statusText();
  }

  get headers(): Record<string, string> {
    return this.response.headers();
  }

  get body(): string | Buffer {
    return this.responseBody;
  }

  get time(): number {
    return this.executionTime;
  }

  /**
   * Get response body as JSON
   */
  public async json<T = any>(): Promise<T> {
    try {
      if (typeof this.responseBody === 'string') {
        return JSON.parse(this.responseBody);
      }
      return JSON.parse(this.responseBody.toString('utf8'));
    } catch (error) {
      throw new Error(`Failed to parse response as JSON: ${error}`);
    }
  }

  /**
   * Get response body as text
   */
  public async text(): Promise<string> {
    if (typeof this.responseBody === 'string') {
      return this.responseBody;
    }
    return this.responseBody.toString('utf8');
  }

  /**
   * Get response body as buffer
   */
  public buffer(): Buffer {
    if (typeof this.responseBody === 'string') {
      return Buffer.from(this.responseBody, 'utf8');
    }
    return this.responseBody;
  }

  /**
   * Get specific header
   */
  public getHeader(name: string): string | undefined {
    const headers = this.headers;
    return headers[name.toLowerCase()];
  }

  /**
   * Check if header exists
   */
  public hasHeader(name: string): boolean {
    return this.getHeader(name) !== undefined;
  }

  /**
   * Get all headers
   */
  public getAllHeaders(): Record<string, string> {
    return { ...this.headers };
  }

  /**
   * Check if response is JSON
   */
  public isJSON(): boolean {
    const contentType = this.getHeader('content-type') || '';
    return contentType.includes('application/json');
  }

  /**
   * Check if response is success (2xx)
   */
  public isSuccess(): boolean {
    return this.statusCode >= 200 && this.statusCode < 300;
  }

  /**
   * Check if response is redirect (3xx)
   */
  public isRedirect(): boolean {
    return this.statusCode >= 300 && this.statusCode < 400;
  }

  /**
   * Check if response is client error (4xx)
   */
  public isClientError(): boolean {
    return this.statusCode >= 400 && this.statusCode < 500;
  }

  /**
   * Check if response is server error (5xx)
   */
  public isServerError(): boolean {
    return this.statusCode >= 500 && this.statusCode < 600;
  }

  /**
   * Save response to file
   */
  public async saveToFile(filePath: string): Promise<void> {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    if (typeof this.responseBody === 'string') {
      fs.writeFileSync(filePath, this.responseBody, 'utf8');
    } else {
      fs.writeFileSync(filePath, this.responseBody);
    }
  }

  /**
   * Get response summary
   */
  public getSummary(): {
    status: number;
    statusText: string;
    contentType: string;
    size: number;
    time: number;
    headers: Record<string, string>;
  } {
    return {
      status: this.statusCode,
      statusText: this.statusText,
      contentType: this.getHeader('content-type') || 'unknown',
      size: this.buffer().length,
      time: this.time,
      headers: this.headers,
    };
  }
}

// ==========================================
// Request Builder (Fluent API)
// ==========================================

export class RequestBuilder {
  private endpoint: string = '';
  private method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' = 'GET';
  private body: any = null;
  private headers: Record<string, string> = {};
  private queryParams: Record<string, string | number | boolean> = {};
  private timeout: number = 30000;
  private retryCount: number = 0;
  private retryDelay: number = 1000;
  private formFields: FormField[] = [];
  private fileUploads: FileUpload[] = [];

  constructor(private connection: RestConnection) {}

  /**
   * Set endpoint
   */
  public setEndpoint(url: string): RequestBuilder {
    this.endpoint = url;
    return this;
  }

  /**
   * Set HTTP method
   */
  public setMethod(method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'): RequestBuilder {
    this.method = method;
    return this;
  }

  /**
   * Set request body (JSON)
   */
  public setBody(data: any): RequestBuilder {
    this.body = typeof data === 'string' ? data : JSON.stringify(data);
    if (typeof this.body !== 'string') {
      this.addHeader('Content-Type', 'application/json');
    }
    return this;
  }

  /**
   * Add or replace header
   */
  public addHeader(key: string, value: string): RequestBuilder {
    this.headers[key] = value;
    return this;
  }

  /**
   * Add query parameter
   */
  public addQueryParam(
    key: string,
    value: string | number | boolean
  ): RequestBuilder {
    this.queryParams[key] = value;
    return this;
  }

  /**
   * Add multiple query parameters
   */
  public addQueryParams(
    params: Record<string, string | number | boolean>
  ): RequestBuilder {
    this.queryParams = { ...this.queryParams, ...params };
    return this;
  }

  /**
   * Set request timeout
   */
  public setTimeout(ms: number): RequestBuilder {
    this.timeout = ms;
    return this;
  }

  /**
   * Set retry configuration
   */
  public retry(count: number, delayMs?: number): RequestBuilder {
    this.retryCount = count;
    if (delayMs !== undefined) {
      this.retryDelay = delayMs;
    }
    return this;
  }

  /**
   * Add form field (for multipart/form-data)
   */
  public addFormField(name: string, value: string | number | boolean): RequestBuilder {
    this.formFields.push({ name, value: String(value) });
    return this;
  }

  /**
   * Add multiple form fields
   */
  public addFormFields(fields: Record<string, string | number | boolean>): RequestBuilder {
    Object.entries(fields).forEach(([name, value]) => {
      this.addFormField(name, value);
    });
    return this;
  }

  /**
   * Add file upload
   */
  public addFile(fieldName: string, filePath: string, mimeType?: string): RequestBuilder {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }
    this.fileUploads.push({ fieldName, filePath, mimeType });
    return this;
  }

  /**
   * Build query string
   */
  private buildQueryString(): string {
    const params = Object.entries(this.queryParams)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&');
    return params ? `?${params}` : '';
  }

  /**
   * Build full URL
   */
  private buildUrl(): string {
    const baseUrl = this.connection.getBaseUrl();
    const queryString = this.buildQueryString();
    return `${baseUrl}${this.endpoint}${queryString}`;
  }

  /**
   * Build multipart form data
   */
  private buildFormData(): FormData {
    const formData = new FormData();

    // Add form fields
    this.formFields.forEach(({ name, value }) => {
      formData.append(name, String(value));
    });

    // Add file uploads
    this.fileUploads.forEach(({ fieldName, filePath }) => {
      const buffer = fs.readFileSync(filePath);
      const blob = new Blob([buffer]);
      formData.append(fieldName, blob, path.basename(filePath));
    });

    return formData;
  }

  /**
   * Execute request with retry logic
   */
  public async execute(): Promise<RestResponse> {
    const url = this.buildUrl();
    const allHeaders = {
      ...this.connection.getHeaders(),
      ...this.headers,
    };

    const context = this.connection.getContext();
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.retryCount; attempt++) {
      try {
        if (attempt > 0) {
          const delay = this.retryDelay * attempt; // Exponential backoff
          console.log(`Retry attempt ${attempt} after ${delay}ms`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }

        const startTime = Date.now();
        let response;

        switch (this.method) {
          case 'GET':
            response = await context.get(url, {
              headers: allHeaders,
              timeout: this.timeout,
            });
            break;

          case 'POST':
            if (this.formFields.length > 0 || this.fileUploads.length > 0) {
              // Multipart form data
              const formData = this.buildFormData();
              response = await context.post(url, {
                multipart: formData,
                headers: allHeaders,
                timeout: this.timeout,
              });
            } else {
              // JSON body
              response = await context.post(url, {
                data: this.body ? JSON.parse(this.body) : undefined,
                headers: allHeaders,
                timeout: this.timeout,
              });
            }
            break;

          case 'PUT':
            if (this.formFields.length > 0 || this.fileUploads.length > 0) {
              const formData = this.buildFormData();
              response = await context.put(url, {
                multipart: formData,
                headers: allHeaders,
                timeout: this.timeout,
              });
            } else {
              response = await context.put(url, {
                data: this.body ? JSON.parse(this.body) : undefined,
                headers: allHeaders,
                timeout: this.timeout,
              });
            }
            break;

          case 'DELETE':
            response = await context.delete(url, {
              data: this.body ? JSON.parse(this.body) : undefined,
              headers: allHeaders,
              timeout: this.timeout,
            });
            break;

          case 'PATCH':
            response = await context.patch(url, {
              data: this.body ? JSON.parse(this.body) : undefined,
              headers: allHeaders,
              timeout: this.timeout,
            });
            break;

          default:
            throw new Error(`Unsupported HTTP method: ${this.method}`);
        }

        const responseBody = await response.text();
        const executionTime = Date.now() - startTime;

        console.log(
          `${this.method} ${url} => ${response.status()} (${executionTime}ms)`
        );

        // Auto-attach request and response details to Allure
        await allureAttach('API Request', {
          method: this.method,
          url,
          headers: allHeaders,
          body: this.body ? JSON.parse(this.body) : null,
        });
        await allureAttach('API Response', {
          status: response.status(),
          statusText: response.statusText(),
          responseTimeMs: executionTime,
          body: (() => { try { return JSON.parse(responseBody); } catch { return responseBody; } })(),
        });

        return new RestResponse(response, responseBody, executionTime);
      } catch (error) {
        lastError = error as Error;
        console.error(
          `Request failed (attempt ${attempt + 1}/${this.retryCount + 1}): ${error}`
        );
      }
    }

    throw new Error(
      `Request failed after ${this.retryCount + 1} attempts: ${lastError?.message}`
    );
  }
}

// ==========================================
// Base REST Client
// ==========================================

export class BaseRestClient {
  constructor(protected connection: RestConnection) {}

  /**
   * Execute GET request
   */
  public async get(
    endpoint: string,
    options?: RequestOptions
  ): Promise<RestResponse> {
    return this.executeRequest('GET', endpoint, null, options);
  }

  /**
   * Execute POST request with JSON body
   */
  public async post(
    endpoint: string,
    payload: any,
    options?: RequestOptions
  ): Promise<RestResponse> {
    return this.executeRequest('POST', endpoint, payload, options);
  }

  /**
   * Execute POST request with form data
   */
  public async postFormData(
    endpoint: string,
    fields: Record<string, string | number | boolean>,
    files?: Record<string, string>,
    options?: RequestOptions
  ): Promise<RestResponse> {
    const builder = new RequestBuilder(this.connection)
      .setMethod('POST')
      .setEndpoint(endpoint);

    if (options?.queryParams) {
      builder.addQueryParams(options.queryParams);
    }

    if (options?.timeout) {
      builder.setTimeout(options.timeout);
    }

    // Add form fields
    Object.entries(fields).forEach(([name, value]) => {
      builder.addFormField(name, value);
    });

    // Add files
    if (files) {
      Object.entries(files).forEach(([fieldName, filePath]) => {
        builder.addFile(fieldName, filePath);
      });
    }

    return builder.execute();
  }

  /**
   * Execute PUT request with JSON body
   */
  public async put(
    endpoint: string,
    payload: any,
    options?: RequestOptions
  ): Promise<RestResponse> {
    return this.executeRequest('PUT', endpoint, payload, options);
  }

  /**
   * Execute PUT request with form data
   */
  public async putFormData(
    endpoint: string,
    fields: Record<string, string | number | boolean>,
    files?: Record<string, string>,
    options?: RequestOptions
  ): Promise<RestResponse> {
    const builder = new RequestBuilder(this.connection)
      .setMethod('PUT')
      .setEndpoint(endpoint);

    if (options?.queryParams) {
      builder.addQueryParams(options.queryParams);
    }

    if (options?.timeout) {
      builder.setTimeout(options.timeout);
    }

    Object.entries(fields).forEach(([name, value]) => {
      builder.addFormField(name, value);
    });

    if (files) {
      Object.entries(files).forEach(([fieldName, filePath]) => {
        builder.addFile(fieldName, filePath);
      });
    }

    return builder.execute();
  }

  /**
   * Execute DELETE request
   */
  public async delete(
    endpoint: string,
    options?: RequestOptions
  ): Promise<RestResponse> {
    return this.executeRequest('DELETE', endpoint, null, options);
  }

  /**
   * Execute PATCH request with JSON body
   */
  public async patch(
    endpoint: string,
    payload: any,
    options?: RequestOptions
  ): Promise<RestResponse> {
    return this.executeRequest('PATCH', endpoint, payload, options);
  }

  /**
   * Internal method to execute request
   */
  protected executeRequest(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
    endpoint: string,
    payload: any,
    options?: RequestOptions
  ): Promise<RestResponse> {
    const builder = new RequestBuilder(this.connection)
      .setMethod(method)
      .setEndpoint(endpoint);

    if (payload) {
      builder.setBody(payload);
    }

    if (options?.queryParams) {
      builder.addQueryParams(options.queryParams);
    }

    if (options?.timeout) {
      builder.setTimeout(options.timeout);
    }

    if (options?.retryCount !== undefined) {
      builder.retry(options.retryCount, options?.retryDelay);
    }

    if (options?.headers) {
      Object.entries(options.headers).forEach(([key, value]) => {
        builder.addHeader(key, value);
      });
    }

    return builder.execute();
  }
}

// ==========================================
// Usage Examples
// ==========================================

/**
 * Example 1: Simple GET Request
 */
async function example1_GetRequest(connection: RestConnection) {
  const client = new BaseRestClient(connection);
  const response = await client.get('/api/users/123');

  console.log('Status:', response.statusCode);
  console.log('Body:', await response.text());

  if (response.isJSON()) {
    const json = await response.json();
    console.log('JSON:', json);
  }
}

/**
 * Example 2: POST with JSON Body
 */
async function example2_PostJson(connection: RestConnection) {
  const client = new BaseRestClient(connection);

  const userData = {
    name: 'John Doe',
    email: 'john@example.com',
    age: 30,
  };

  const response = await client.post('/api/users', userData);

  console.log('Status:', response.statusCode);
  if (response.statusCode === 201) {
    const createdUser = await response.json();
    console.log('Created user ID:', createdUser.id);
  }
}

/**
 * Example 3: POST with Form Data & File Upload
 */
async function example3_PostFormData(connection: RestConnection) {
  const client = new BaseRestClient(connection);

  const response = await client.postFormData(
    '/api/upload-profile',
    {
      username: 'john_doe',
      email: 'john@example.com',
    },
    {
      profileImage: '/path/to/image.jpg',
      document: '/path/to/document.pdf',
    }
  );

  console.log('Upload status:', response.statusCode);
}

/**
 * Example 4: Fluent Builder with Retry
 */
async function example4_FluentBuilder(connection: RestConnection) {
  const response = await new RequestBuilder(connection)
    .setMethod('POST')
    .setEndpoint('/api/data')
    .addHeader('X-Request-ID', 'unique-id-123')
    .addQueryParam('version', '2')
    .setBody({ data: 'test' })
    .retry(3, 1000) // Retry 3 times with 1s delay
    .execute();

  console.log('Response:', response.getSummary());
}

/**
 * Example 5: Save Response to File
 */
async function example5_SaveResponse(connection: RestConnection) {
  const client = new BaseRestClient(connection);
  const response = await client.get('/api/users');

  // Save to file
  await response.saveToFile('./responses/users.json');
  console.log('Response saved to ./responses/users.json');
}

//export { BaseRestClient, RequestBuilder, RestResponse };
