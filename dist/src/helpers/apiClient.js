"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiClient = apiClient;
const allure_playwright_1 = require("allure-playwright");
const step = allure_playwright_1.allure.step;
async function attach(name, data) {
    try {
        const body = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
        await allure_playwright_1.allure.attachment(name, body, 'application/json');
    }
    catch {
        // allure not available — skip
    }
}
async function captureResponse(response, stepLabel) {
    let responseBody;
    try {
        responseBody = await response.json();
    }
    catch {
        responseBody = await response.text();
    }
    if (response.status() >= 400) {
        console.log(`[API] ${stepLabel} [${response.status()}]:`, JSON.stringify(responseBody));
    }
    await attach(`${stepLabel} — Response (${response.status()})`, responseBody);
    return response;
}
function apiClient(request) {
    return {
        async post(url, options) {
            const label = `POST ${new URL(url).pathname}`;
            return step(label, async () => {
                if (options?.data)
                    await attach(`${label} — Request Body`, options.data);
                const response = await request.post(url, options);
                return captureResponse(response, label);
            });
        },
        async get(url, options) {
            const label = `GET ${new URL(url).pathname}`;
            return step(label, async () => {
                const response = await request.get(url, options);
                return captureResponse(response, label);
            });
        },
        async put(url, options) {
            const label = `PUT ${new URL(url).pathname}`;
            return step(label, async () => {
                if (options?.data)
                    await attach(`${label} — Request Body`, options.data);
                const response = await request.put(url, options);
                return captureResponse(response, label);
            });
        },
        async delete(url, options) {
            const label = `DELETE ${new URL(url).pathname}`;
            return step(label, async () => {
                const response = await request.delete(url, options);
                return captureResponse(response, label);
            });
        },
        async patch(url, options) {
            const label = `PATCH ${new URL(url).pathname}`;
            return step(label, async () => {
                if (options?.data)
                    await attach(`${label} — Request Body`, options.data);
                const response = await request.patch(url, options);
                return captureResponse(response, label);
            });
        },
    };
}
