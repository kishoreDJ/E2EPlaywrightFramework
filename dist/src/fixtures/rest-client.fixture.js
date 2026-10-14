"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.expect = exports.test = void 0;
const test_1 = require("@playwright/test");
const rest_connection_1 = require("../api/rest/connection/rest-connection");
const base_rest_client_1 = require("../api/rest/client/base-rest-client");
const apiClient_1 = require("../helpers/apiClient");
exports.test = test_1.test.extend({
    restClient: async ({ request }, use) => {
        const baseUrl = process.env.API_BASE_URL;
        if (!baseUrl)
            throw new Error('API_BASE_URL is not set — check your .env or CI secrets');
        const connection = new rest_connection_1.RestConnection(request, {
            baseUrl,
            headers: {
                'Content-Type': 'application/json',
            },
        });
        const client = new base_rest_client_1.BaseRestClient(connection);
        await use(client);
    },
    // Allure-instrumented API client — use { api } in tests instead of { request }
    api: async ({ request }, use) => {
        await use((0, apiClient_1.apiClient)(request));
    },
});
var test_2 = require("@playwright/test");
Object.defineProperty(exports, "expect", { enumerable: true, get: function () { return test_2.expect; } });
