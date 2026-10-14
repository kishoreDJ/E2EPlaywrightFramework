"use strict";
/**
 * Identity Headers - Builds the 4 request-identity headers required by
 * every referral-services endpoint (validated by ValidateHeaders server-side).
 * Origin/Source-Application-Request-Identifier must be a fresh RFC 4122 UUID per request.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildIdentityHeaders = buildIdentityHeaders;
const crypto_1 = require("crypto");
function buildIdentityHeaders(options = {}) {
    const appName = options.originAppName ?? 'SelfService';
    return {
        'Origin-Application-Name': appName,
        'Origin-Application-Request-Identifier': options.originRequestId ?? (0, crypto_1.randomUUID)(),
        'Source-Application-Name': options.sourceAppName ?? appName,
        'Source-Application-Request-Identifier': options.sourceRequestId ?? (0, crypto_1.randomUUID)(),
    };
}
