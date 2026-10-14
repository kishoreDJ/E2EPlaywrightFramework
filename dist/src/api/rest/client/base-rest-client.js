"use strict";
/**
 * REST Client - Fluent API for executing all HTTP operations
 * Supports: GET, POST, PUT, DELETE, PATCH, Form Data, File Uploads
 */
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseRestClient = exports.RequestBuilder = exports.RestResponse = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
// Allure attachment helper — no-ops gracefully if allure-playwright is not available
async function allureAttach(name, data) {
    try {
        const { allure } = await Promise.resolve().then(() => __importStar(require('allure-playwright')));
        await allure.attachment(name, JSON.stringify(data, null, 2), 'application/json');
    }
    catch {
        // allure not available in this context — skip silently
    }
}
// ==========================================
// REST Response Wrapper
// ==========================================
class RestResponse {
    constructor(response, // Playwright APIResponse
    responseBody, executionTime) {
        this.response = response;
        this.responseBody = responseBody;
        this.executionTime = executionTime;
    }
    get statusCode() {
        return this.response.status();
    }
    get statusText() {
        return this.response.statusText();
    }
    get headers() {
        return this.response.headers();
    }
    get body() {
        return this.responseBody;
    }
    get time() {
        return this.executionTime;
    }
    /**
     * Get response body as JSON
     */
    async json() {
        try {
            if (typeof this.responseBody === 'string') {
                return JSON.parse(this.responseBody);
            }
            return JSON.parse(this.responseBody.toString('utf8'));
        }
        catch (error) {
            throw new Error(`Failed to parse response as JSON: ${error}`);
        }
    }
    /**
     * Get response body as text
     */
    async text() {
        if (typeof this.responseBody === 'string') {
            return this.responseBody;
        }
        return this.responseBody.toString('utf8');
    }
    /**
     * Get response body as buffer
     */
    buffer() {
        if (typeof this.responseBody === 'string') {
            return Buffer.from(this.responseBody, 'utf8');
        }
        return this.responseBody;
    }
    /**
     * Get specific header
     */
    getHeader(name) {
        const headers = this.headers;
        return headers[name.toLowerCase()];
    }
    /**
     * Check if header exists
     */
    hasHeader(name) {
        return this.getHeader(name) !== undefined;
    }
    /**
     * Get all headers
     */
    getAllHeaders() {
        return { ...this.headers };
    }
    /**
     * Check if response is JSON
     */
    isJSON() {
        const contentType = this.getHeader('content-type') || '';
        return contentType.includes('application/json');
    }
    /**
     * Check if response is success (2xx)
     */
    isSuccess() {
        return this.statusCode >= 200 && this.statusCode < 300;
    }
    /**
     * Check if response is redirect (3xx)
     */
    isRedirect() {
        return this.statusCode >= 300 && this.statusCode < 400;
    }
    /**
     * Check if response is client error (4xx)
     */
    isClientError() {
        return this.statusCode >= 400 && this.statusCode < 500;
    }
    /**
     * Check if response is server error (5xx)
     */
    isServerError() {
        return this.statusCode >= 500 && this.statusCode < 600;
    }
    /**
     * Save response to file
     */
    async saveToFile(filePath) {
        const dir = path_1.default.dirname(filePath);
        if (!fs_1.default.existsSync(dir)) {
            fs_1.default.mkdirSync(dir, { recursive: true });
        }
        if (typeof this.responseBody === 'string') {
            fs_1.default.writeFileSync(filePath, this.responseBody, 'utf8');
        }
        else {
            fs_1.default.writeFileSync(filePath, this.responseBody);
        }
    }
    /**
     * Get response summary
     */
    getSummary() {
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
exports.RestResponse = RestResponse;
// ==========================================
// Request Builder (Fluent API)
// ==========================================
class RequestBuilder {
    constructor(connection) {
        this.connection = connection;
        this.endpoint = '';
        this.method = 'GET';
        this.body = null;
        this.headers = {};
        this.queryParams = {};
        this.timeout = 30000;
        this.retryCount = 0;
        this.retryDelay = 1000;
        this.formFields = [];
        this.fileUploads = [];
    }
    /**
     * Set endpoint
     */
    setEndpoint(url) {
        this.endpoint = url;
        return this;
    }
    /**
     * Set HTTP method
     */
    setMethod(method) {
        this.method = method;
        return this;
    }
    /**
     * Set request body (JSON)
     */
    setBody(data) {
        this.body = typeof data === 'string' ? data : JSON.stringify(data);
        if (typeof this.body !== 'string') {
            this.addHeader('Content-Type', 'application/json');
        }
        return this;
    }
    /**
     * Add or replace header
     */
    addHeader(key, value) {
        this.headers[key] = value;
        return this;
    }
    /**
     * Add query parameter
     */
    addQueryParam(key, value) {
        this.queryParams[key] = value;
        return this;
    }
    /**
     * Add multiple query parameters
     */
    addQueryParams(params) {
        this.queryParams = { ...this.queryParams, ...params };
        return this;
    }
    /**
     * Set request timeout
     */
    setTimeout(ms) {
        this.timeout = ms;
        return this;
    }
    /**
     * Set retry configuration
     */
    retry(count, delayMs) {
        this.retryCount = count;
        if (delayMs !== undefined) {
            this.retryDelay = delayMs;
        }
        return this;
    }
    /**
     * Add form field (for multipart/form-data)
     */
    addFormField(name, value) {
        this.formFields.push({ name, value: String(value) });
        return this;
    }
    /**
     * Add multiple form fields
     */
    addFormFields(fields) {
        Object.entries(fields).forEach(([name, value]) => {
            this.addFormField(name, value);
        });
        return this;
    }
    /**
     * Add file upload
     */
    addFile(fieldName, filePath, mimeType) {
        if (!fs_1.default.existsSync(filePath)) {
            throw new Error(`File not found: ${filePath}`);
        }
        this.fileUploads.push({ fieldName, filePath, mimeType });
        return this;
    }
    /**
     * Build query string
     */
    buildQueryString() {
        const params = Object.entries(this.queryParams)
            .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
            .join('&');
        return params ? `?${params}` : '';
    }
    /**
     * Build full URL
     */
    buildUrl() {
        const baseUrl = this.connection.getBaseUrl();
        const queryString = this.buildQueryString();
        return `${baseUrl}${this.endpoint}${queryString}`;
    }
    /**
     * Build multipart form data
     */
    buildFormData() {
        const formData = new FormData();
        // Add form fields
        this.formFields.forEach(({ name, value }) => {
            formData.append(name, String(value));
        });
        // Add file uploads
        this.fileUploads.forEach(({ fieldName, filePath }) => {
            const buffer = fs_1.default.readFileSync(filePath);
            const blob = new Blob([buffer]);
            formData.append(fieldName, blob, path_1.default.basename(filePath));
        });
        return formData;
    }
    /**
     * Execute request with retry logic
     */
    async execute() {
        const url = this.buildUrl();
        const allHeaders = {
            ...this.connection.getHeaders(),
            ...this.headers,
        };
        const context = this.connection.getContext();
        let lastError = null;
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
                        }
                        else {
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
                        }
                        else {
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
                console.log(`${this.method} ${url} => ${response.status()} (${executionTime}ms)`);
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
                    body: (() => { try {
                        return JSON.parse(responseBody);
                    }
                    catch {
                        return responseBody;
                    } })(),
                });
                return new RestResponse(response, responseBody, executionTime);
            }
            catch (error) {
                lastError = error;
                console.error(`Request failed (attempt ${attempt + 1}/${this.retryCount + 1}): ${error}`);
            }
        }
        throw new Error(`Request failed after ${this.retryCount + 1} attempts: ${lastError?.message}`);
    }
}
exports.RequestBuilder = RequestBuilder;
// ==========================================
// Base REST Client
// ==========================================
class BaseRestClient {
    constructor(connection) {
        this.connection = connection;
    }
    /**
     * Execute GET request
     */
    async get(endpoint, options) {
        return this.executeRequest('GET', endpoint, null, options);
    }
    /**
     * Execute POST request with JSON body
     */
    async post(endpoint, payload, options) {
        return this.executeRequest('POST', endpoint, payload, options);
    }
    /**
     * Execute POST request with form data
     */
    async postFormData(endpoint, fields, files, options) {
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
    async put(endpoint, payload, options) {
        return this.executeRequest('PUT', endpoint, payload, options);
    }
    /**
     * Execute PUT request with form data
     */
    async putFormData(endpoint, fields, files, options) {
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
    async delete(endpoint, options) {
        return this.executeRequest('DELETE', endpoint, null, options);
    }
    /**
     * Execute PATCH request with JSON body
     */
    async patch(endpoint, payload, options) {
        return this.executeRequest('PATCH', endpoint, payload, options);
    }
    /**
     * Internal method to execute request
     */
    executeRequest(method, endpoint, payload, options) {
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
exports.BaseRestClient = BaseRestClient;
// ==========================================
// Usage Examples
// ==========================================
/**
 * Example 1: Simple GET Request
 */
async function example1_GetRequest(connection) {
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
async function example2_PostJson(connection) {
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
async function example3_PostFormData(connection) {
    const client = new BaseRestClient(connection);
    const response = await client.postFormData('/api/upload-profile', {
        username: 'john_doe',
        email: 'john@example.com',
    }, {
        profileImage: '/path/to/image.jpg',
        document: '/path/to/document.pdf',
    });
    console.log('Upload status:', response.statusCode);
}
/**
 * Example 4: Fluent Builder with Retry
 */
async function example4_FluentBuilder(connection) {
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
async function example5_SaveResponse(connection) {
    const client = new BaseRestClient(connection);
    const response = await client.get('/api/users');
    // Save to file
    await response.saveToFile('./responses/users.json');
    console.log('Response saved to ./responses/users.json');
}
//export { BaseRestClient, RequestBuilder, RestResponse };
