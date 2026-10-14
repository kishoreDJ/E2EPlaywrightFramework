"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStandardHeaders = getStandardHeaders;
exports.getDeleteHeaders = getDeleteHeaders;
const uuid_1 = require("uuid");
/**
 * Generates standard request headers required by all APIs.
 * Values are read from .env — override per request if needed.
 *
 * Required .env variables:
 *   ORIGIN_APP_NAME  - Name of the origin application
 *   SOURCE_APP_NAME  - Name of the source application
 */
function getStandardHeaders(token) {
    return {
        Authorization: token,
        'origin-application-request-identifier': (0, uuid_1.v4)(),
        'origin-application-name': process.env.ORIGIN_APP_NAME || 'TestFramework',
        'source-application-request-identifier': (0, uuid_1.v4)(),
        'source-application-name': process.env.SOURCE_APP_NAME || 'TestFramework',
        'Content-Type': 'application/json',
    };
}
// DELETE requests must not include Content-Type to avoid 400 responses
function getDeleteHeaders(token) {
    const { 'Content-Type': _, ...headers } = getStandardHeaders(token);
    return headers;
}
