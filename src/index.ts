// ⚠️ SCOPE: if this repo moves to a new org, update the package name in package.json

// Framework test objects
export { test, expect } from './fixtures/browser-fixture';
export { test as browserStackTest } from './fixtures/browserstack-fixture';
export { test as apiTest } from './fixtures/rest-client.fixture';

// Base class for page objects
export { BasePage } from './pages/BasePage';

// Auth helpers
export { getOAuthToken, getBearerHeader, clearTokenCache, getToken, getBatchesToken } from './helpers/authHelper';

// DB helpers
export { query, closeDb } from './helpers/dbHelper';

// Data utilities
export { formatDate, formatDateTime, dateOffset, dateTimeOffset } from './data/date-formatter';
export { readExcelSheet, listExcelSheets } from './data/excel-reader';
export { uniqueSuffix, uniqueEmail, uniqueOrderNumber, uniqueCodePrefix } from './data/unique';

// Schema validation
export { validateResponse } from './schema-validation/validator';

// Types
export type { ExcelRow, ReadExcelOptions } from './data/excel-reader';
export type { BrowserName, PoolConfig, BrowserLaunchConfig, BrowserContextConfig, PoolStats, BrowserStackCredentials, BrowserStackCapabilities, BrowserStackConfig, ProxyConfig, ViewportSize } from './browser/browser-types';
