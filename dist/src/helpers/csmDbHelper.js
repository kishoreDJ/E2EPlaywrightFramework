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
exports.csmQuery = csmQuery;
exports.closeCsmDb = closeCsmDb;
exports.getRandomUuidsBySubscriptionState = getRandomUuidsBySubscriptionState;
const dotenv = __importStar(require("dotenv"));
const pg_1 = require("pg");
dotenv.config();
let pool = null;
function getPool() {
    if (!pool) {
        const connectionString = process.env.CSM_DATABASE_URL;
        if (!connectionString) {
            throw new Error('CSM_DATABASE_URL is not set in .env');
        }
        pool = new pg_1.Pool({ connectionString, ssl: { rejectUnauthorized: false } });
    }
    return pool;
}
async function csmQuery(sql, params = []) {
    const client = await getPool().connect();
    try {
        const result = await client.query(sql, params);
        return result.rows;
    }
    finally {
        client.release();
    }
}
async function closeCsmDb() {
    if (pool) {
        await pool.end();
        pool = null;
    }
}
/**
 * Returns N random distinct UUIDs for subscribers in the given subscription state.
 * Uses ORDER BY RANDOM() so results differ on every call.
 * @param stateId - subscription state (e.g. 5 = active)
 * @param count   - number of UUIDs to return (default 20)
 */
async function getRandomUuidsBySubscriptionState(stateId, count = 20) {
    const rows = await csmQuery(`SELECT uuid FROM (
       SELECT DISTINCT i."uuid"
       FROM subscription s
         JOIN delivery_address_info dai ON s.subscription_id = dai.subscription_id
         JOIN subscription_term st     ON s.subscription_id = st.subscription_id
         JOIN contact c                ON c.contact_id = dai.contact_id
         JOIN identity i               ON s.subscriber_identity_id = i.identity_id
         JOIN orders o                 ON s.subscriber_identity_id = o.subscriber_identity_id
         JOIN payer_account pa         ON s.subscriber_identity_id = pa.subscriber_identity_id
       WHERE s.state_id = $1
     ) distinct_uuids
     ORDER BY RANDOM()
     LIMIT $2`, [stateId, count]);
    if (rows.length === 0)
        throw new Error(`No UUIDs found in CSM for state_id=${stateId}`);
    return rows.map((r) => r.uuid);
}
