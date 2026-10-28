"use strict";
// ⚠️ SCOPE: if this repo moves to a new org, update the package name in package.json
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateResponse = exports.listExcelSheets = exports.readExcelSheet = exports.dateTimeOffset = exports.dateOffset = exports.formatDateTime = exports.formatDate = exports.uniqueCodePrefix = exports.uniqueOrderNumber = exports.uniqueEmail = exports.uniqueSuffix = exports.closeDb = exports.query = exports.getBatchesToken = exports.getToken = exports.clearTokenCache = exports.getBearerHeader = exports.getOAuthToken = exports.BasePage = exports.apiTest = exports.browserStackTest = exports.expect = exports.test = void 0;
// Framework test objects
var browser_fixture_1 = require("./fixtures/browser-fixture");
Object.defineProperty(exports, "test", { enumerable: true, get: function () { return browser_fixture_1.test; } });
Object.defineProperty(exports, "expect", { enumerable: true, get: function () { return browser_fixture_1.expect; } });
var browserstack_fixture_1 = require("./fixtures/browserstack-fixture");
Object.defineProperty(exports, "browserStackTest", { enumerable: true, get: function () { return browserstack_fixture_1.test; } });
var rest_client_fixture_1 = require("./fixtures/rest-client.fixture");
Object.defineProperty(exports, "apiTest", { enumerable: true, get: function () { return rest_client_fixture_1.test; } });
// Base class for page objects
var BasePage_1 = require("./pages/BasePage");
Object.defineProperty(exports, "BasePage", { enumerable: true, get: function () { return BasePage_1.BasePage; } });
// Auth helpers
var authHelper_1 = require("./helpers/authHelper");
Object.defineProperty(exports, "getOAuthToken", { enumerable: true, get: function () { return authHelper_1.getOAuthToken; } });
Object.defineProperty(exports, "getBearerHeader", { enumerable: true, get: function () { return authHelper_1.getBearerHeader; } });
Object.defineProperty(exports, "clearTokenCache", { enumerable: true, get: function () { return authHelper_1.clearTokenCache; } });
Object.defineProperty(exports, "getToken", { enumerable: true, get: function () { return authHelper_1.getToken; } });
Object.defineProperty(exports, "getBatchesToken", { enumerable: true, get: function () { return authHelper_1.getBatchesToken; } });
// DB helpers
var dbHelper_1 = require("./helpers/dbHelper");
Object.defineProperty(exports, "query", { enumerable: true, get: function () { return dbHelper_1.query; } });
Object.defineProperty(exports, "closeDb", { enumerable: true, get: function () { return dbHelper_1.closeDb; } });
// Data utilities
var unique_1 = require("./data/unique");
Object.defineProperty(exports, "uniqueSuffix", { enumerable: true, get: function () { return unique_1.uniqueSuffix; } });
Object.defineProperty(exports, "uniqueEmail", { enumerable: true, get: function () { return unique_1.uniqueEmail; } });
Object.defineProperty(exports, "uniqueOrderNumber", { enumerable: true, get: function () { return unique_1.uniqueOrderNumber; } });
Object.defineProperty(exports, "uniqueCodePrefix", { enumerable: true, get: function () { return unique_1.uniqueCodePrefix; } });
// Utils
var dateUtils_1 = require("./utils/dateUtils");
Object.defineProperty(exports, "formatDate", { enumerable: true, get: function () { return dateUtils_1.formatDate; } });
Object.defineProperty(exports, "formatDateTime", { enumerable: true, get: function () { return dateUtils_1.formatDateTime; } });
Object.defineProperty(exports, "dateOffset", { enumerable: true, get: function () { return dateUtils_1.dateOffset; } });
Object.defineProperty(exports, "dateTimeOffset", { enumerable: true, get: function () { return dateUtils_1.dateTimeOffset; } });
var excelUtils_1 = require("./utils/excelUtils");
Object.defineProperty(exports, "readExcelSheet", { enumerable: true, get: function () { return excelUtils_1.readExcelSheet; } });
Object.defineProperty(exports, "listExcelSheets", { enumerable: true, get: function () { return excelUtils_1.listExcelSheets; } });
// Schema validation
var validator_1 = require("./schema-validation/validator");
Object.defineProperty(exports, "validateResponse", { enumerable: true, get: function () { return validator_1.validateResponse; } });
