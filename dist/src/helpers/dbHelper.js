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
exports.query = query;
exports.closeDb = closeDb;
const dotenv = __importStar(require("dotenv"));
dotenv.config();
function getDriver() {
    const url = process.env.DATABASE_URL || '';
    if (url.startsWith('mysql://'))
        return 'mysql';
    return 'postgres';
}
// ==========================================
// PostgreSQL
// ==========================================
let pgPool;
async function pgQuery(sql, params) {
    if (!pgPool) {
        const { Pool } = await Promise.resolve().then(() => __importStar(require('pg')));
        pgPool = new Pool({
            connectionString: process.env.DATABASE_URL,
            max: 5,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 10000,
        });
        pgPool.on('error', (err) => console.error('[DB] Pool error:', err.message));
    }
    const client = await pgPool.connect();
    try {
        const result = await client.query(sql, params);
        return result.rows;
    }
    finally {
        client.release();
    }
}
async function closePg() {
    if (pgPool)
        await pgPool.end();
}
// ==========================================
// MySQL
// ==========================================
let mysqlPool;
function parseMysqlUrl(url) {
    // mysql://user:password@host:port/database
    const match = url.match(/^mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)$/);
    if (!match)
        throw new Error('Invalid MySQL DATABASE_URL format');
    return {
        user: decodeURIComponent(match[1]),
        password: decodeURIComponent(match[2]),
        host: match[3],
        port: parseInt(match[4]),
        database: match[5],
    };
}
async function mysqlQuery(sql, params) {
    if (!mysqlPool) {
        const mysql = await Promise.resolve().then(() => __importStar(require('mysql2/promise')));
        const config = parseMysqlUrl(process.env.DATABASE_URL || '');
        mysqlPool = await mysql.createPool({
            ...config,
            connectionLimit: 5,
            connectTimeout: 10000,
        });
    }
    const [rows] = await mysqlPool.execute(sql, params || []);
    return rows;
}
async function closeMysql() {
    if (mysqlPool)
        await mysqlPool.end();
}
// ==========================================
// Allure attachment helper
// ==========================================
async function allureAttachDb(sql, params, result) {
    try {
        const { allure } = await Promise.resolve().then(() => __importStar(require('allure-playwright')));
        await allure.attachment('DB Query', JSON.stringify({ sql: sql.trim(), params: params || [] }, null, 2), 'application/json');
        await allure.attachment('DB Result', JSON.stringify(result, null, 2), 'application/json');
    }
    catch {
        // allure not available — skip silently
    }
}
// ==========================================
// Public API — works for both PostgreSQL and MySQL
// ==========================================
async function query(sql, params) {
    const driver = getDriver();
    const result = driver === 'mysql' ? await mysqlQuery(sql, params) : await pgQuery(sql, params);
    await allureAttachDb(sql, params, result);
    return result;
}
async function closeDb() {
    const driver = getDriver();
    return driver === 'mysql' ? closeMysql() : closePg();
}
