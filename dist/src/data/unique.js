"use strict";
/**
 * Collision-safe value generators for parallel test runs.
 * Avoids hardcoded literals (codePrefix, orderNumber, emails) colliding
 * across the 50+ concurrent tests the browser/REST fixtures are built for.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.uniqueSuffix = uniqueSuffix;
exports.uniqueEmail = uniqueEmail;
exports.uniqueOrderNumber = uniqueOrderNumber;
exports.uniqueCodePrefix = uniqueCodePrefix;
const crypto_1 = require("crypto");
/**
 * Short unique suffix safe for fields with length limits (e.g. codePrefix <= 10 chars).
 */
function uniqueSuffix(length = 6) {
    return (0, crypto_1.randomUUID)().replace(/-/g, '').slice(0, length);
}
function uniqueEmail(domain = 'example.com') {
    return `qa.${uniqueSuffix(10)}@${domain}`;
}
function uniqueOrderNumber(prefix = 'o') {
    return `${prefix}${uniqueSuffix(9)}`;
}
function uniqueCodePrefix(prefix = 'PRF') {
    // codePrefix cannot exceed 10 characters
    return `${prefix}${uniqueSuffix(10 - prefix.length)}`.slice(0, 10);
}
