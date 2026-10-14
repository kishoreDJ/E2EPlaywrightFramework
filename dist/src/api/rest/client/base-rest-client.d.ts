/**
 * REST Client - Fluent API for executing all HTTP operations
 * Supports: GET, POST, PUT, DELETE, PATCH, Form Data, File Uploads
 */
import { RestConnection } from '../connection/rest-connection';
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
export declare class RestResponse {
    private response;
    private responseBody;
    private executionTime;
    constructor(response: any, // Playwright APIResponse
    responseBody: string | Buffer, executionTime: number);
    get statusCode(): number;
    get statusText(): string;
    get headers(): Record<string, string>;
    get body(): string | Buffer;
    get time(): number;
    /**
     * Get response body as JSON
     */
    json<T = any>(): Promise<T>;
    /**
     * Get response body as text
     */
    text(): Promise<string>;
    /**
     * Get response body as buffer
     */
    buffer(): Buffer;
    /**
     * Get specific header
     */
    getHeader(name: string): string | undefined;
    /**
     * Check if header exists
     */
    hasHeader(name: string): boolean;
    /**
     * Get all headers
     */
    getAllHeaders(): Record<string, string>;
    /**
     * Check if response is JSON
     */
    isJSON(): boolean;
    /**
     * Check if response is success (2xx)
     */
    isSuccess(): boolean;
    /**
     * Check if response is redirect (3xx)
     */
    isRedirect(): boolean;
    /**
     * Check if response is client error (4xx)
     */
    isClientError(): boolean;
    /**
     * Check if response is server error (5xx)
     */
    isServerError(): boolean;
    /**
     * Save response to file
     */
    saveToFile(filePath: string): Promise<void>;
    /**
     * Get response summary
     */
    getSummary(): {
        status: number;
        statusText: string;
        contentType: string;
        size: number;
        time: number;
        headers: Record<string, string>;
    };
}
export declare class RequestBuilder {
    private connection;
    private endpoint;
    private method;
    private body;
    private headers;
    private queryParams;
    private timeout;
    private retryCount;
    private retryDelay;
    private formFields;
    private fileUploads;
    constructor(connection: RestConnection);
    /**
     * Set endpoint
     */
    setEndpoint(url: string): RequestBuilder;
    /**
     * Set HTTP method
     */
    setMethod(method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'): RequestBuilder;
    /**
     * Set request body (JSON)
     */
    setBody(data: any): RequestBuilder;
    /**
     * Add or replace header
     */
    addHeader(key: string, value: string): RequestBuilder;
    /**
     * Add query parameter
     */
    addQueryParam(key: string, value: string | number | boolean): RequestBuilder;
    /**
     * Add multiple query parameters
     */
    addQueryParams(params: Record<string, string | number | boolean>): RequestBuilder;
    /**
     * Set request timeout
     */
    setTimeout(ms: number): RequestBuilder;
    /**
     * Set retry configuration
     */
    retry(count: number, delayMs?: number): RequestBuilder;
    /**
     * Add form field (for multipart/form-data)
     */
    addFormField(name: string, value: string | number | boolean): RequestBuilder;
    /**
     * Add multiple form fields
     */
    addFormFields(fields: Record<string, string | number | boolean>): RequestBuilder;
    /**
     * Add file upload
     */
    addFile(fieldName: string, filePath: string, mimeType?: string): RequestBuilder;
    /**
     * Build query string
     */
    private buildQueryString;
    /**
     * Build full URL
     */
    private buildUrl;
    /**
     * Build multipart form data
     */
    private buildFormData;
    /**
     * Execute request with retry logic
     */
    execute(): Promise<RestResponse>;
}
export declare class BaseRestClient {
    protected connection: RestConnection;
    constructor(connection: RestConnection);
    /**
     * Execute GET request
     */
    get(endpoint: string, options?: RequestOptions): Promise<RestResponse>;
    /**
     * Execute POST request with JSON body
     */
    post(endpoint: string, payload: any, options?: RequestOptions): Promise<RestResponse>;
    /**
     * Execute POST request with form data
     */
    postFormData(endpoint: string, fields: Record<string, string | number | boolean>, files?: Record<string, string>, options?: RequestOptions): Promise<RestResponse>;
    /**
     * Execute PUT request with JSON body
     */
    put(endpoint: string, payload: any, options?: RequestOptions): Promise<RestResponse>;
    /**
     * Execute PUT request with form data
     */
    putFormData(endpoint: string, fields: Record<string, string | number | boolean>, files?: Record<string, string>, options?: RequestOptions): Promise<RestResponse>;
    /**
     * Execute DELETE request
     */
    delete(endpoint: string, options?: RequestOptions): Promise<RestResponse>;
    /**
     * Execute PATCH request with JSON body
     */
    patch(endpoint: string, payload: any, options?: RequestOptions): Promise<RestResponse>;
    /**
     * Internal method to execute request
     */
    protected executeRequest(method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH', endpoint: string, payload: any, options?: RequestOptions): Promise<RestResponse>;
}
//# sourceMappingURL=base-rest-client.d.ts.map