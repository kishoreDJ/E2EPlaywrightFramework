"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUapToken = getUapToken;
exports.getUsersByUuids = getUsersByUuids;
exports.getUserByUuid = getUserByUuid;
const dotenv = __importStar(require("dotenv"));
const authHelper_1 = require("./authHelper");
dotenv.config();
async function getUapToken() {
    return (0, authHelper_1.getBearerHeader)(process.env.UAP_OAUTH_TOKEN_URL, process.env.UAP_OAUTH_CLIENT_ID, process.env.UAP_OAUTH_CLIENT_SECRET);
}
const UAP_BATCH_SIZE = 1;
async function fetchUapBatch(uuids, token, baseUrl) {
    const filter = uuids.join(',');
    const url = `${baseUrl}/api/v1/users?filter[identityUUIDs]=${encodeURIComponent(filter)}`;
    const response = await fetch(url, {
        headers: {
            Authorization: token,
            'Content-Type': 'application/json',
            'origin-application-name': 'csm-listener',
            'source-application-name': 'csm-workflow',
            'origin-application-request-identifier': crypto.randomUUID(),
            'source-application-request-identifier': crypto.randomUUID(),
        },
    });
    const text = await response.text();
    if (!response.ok) {
        throw new Error(`UAP API request failed [${response.status}]: ${text.substring(0, 500)}`);
    }
    if (!text || text.trim() === '')
        return [];
    let json;
    try {
        json = JSON.parse(text);
    }
    catch {
        throw new Error(`UAP API returned non-JSON body [${response.status}]: ${text.substring(0, 500)}`);
    }
    const nameRegex = /^[A-Za-z\s]+$/;
    const users = json.data?.attributes?.payload?.users ?? [];
    return users
        .filter((u) => u.realm === 'primary' && u.identityUUID && u.emailAddress)
        .map((u) => ({
        uuid: u.identityUUID ?? '',
        firstName: u.firstName && nameRegex.test(u.firstName) ? u.firstName : '',
        lastName: u.lastName && nameRegex.test(u.lastName) ? u.lastName : '',
        email: u.emailAddress ?? '',
    }));
}
/**
 * Fetches user details from UAP for all given UUIDs in parallel.
 * Skips UUIDs that fail (not in UAP, offline users, 5xx errors).
 * Only returns primary-realm users with a real emailAddress.
 */
async function getUsersByUuids(uuids) {
    if (uuids.length === 0)
        return [];
    const token = await getUapToken();
    const baseUrl = process.env.UAP_BASE_URL || 'https://api-int.uap-user.customerappsstag.dowjones.io';
    const settled = await Promise.allSettled(uuids.map((uuid) => fetchUapBatch([uuid], token, baseUrl)));
    return settled
        .filter((r) => r.status === 'fulfilled')
        .flatMap((r) => r.value);
}
/**
 * Convenience: fetch a single user by UUID.
 */
async function getUserByUuid(uuid) {
    const users = await getUsersByUuids([uuid]);
    return users[0] ?? null;
}
