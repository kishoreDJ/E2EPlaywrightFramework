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
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
function getDriver() {
    const url = process.env.DATABASE_URL || '';
    if (url.startsWith('mysql://'))
        return 'mysql';
    return 'postgres';
}
function parseMysqlUrl(url) {
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
async function readSchema() {
    const outPath = path.join(process.cwd(), 'db-schema.txt');
    if (fs.existsSync(outPath)) {
        console.log('Schema already exists at db-schema.txt — skipping. Delete the file to regenerate.');
        return;
    }
    const driver = getDriver();
    console.log(`[DB] Reading schema using ${driver} driver...`);
    const tables = {};
    if (driver === 'mysql') {
        const mysql = await Promise.resolve().then(() => __importStar(require('mysql2/promise')));
        const config = parseMysqlUrl(process.env.DATABASE_URL || '');
        const pool = await mysql.createPool({ ...config, connectionLimit: 5 });
        try {
            const [rows] = await pool.execute(`
        SELECT TABLE_SCHEMA as table_schema, TABLE_NAME as table_name,
               COLUMN_NAME as column_name, DATA_TYPE as data_type,
               IS_NULLABLE as is_nullable
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA NOT IN ('information_schema', 'mysql', 'performance_schema', 'sys')
        ORDER BY TABLE_SCHEMA, TABLE_NAME, ORDINAL_POSITION
      `);
            for (const row of rows) {
                const key = `${row.table_schema}.${row.table_name}`;
                if (!tables[key])
                    tables[key] = [];
                tables[key].push(`  ${row.column_name} (${row.data_type}${row.is_nullable === 'YES' ? ', nullable' : ''})`);
            }
        }
        finally {
            await pool.end();
        }
    }
    else {
        const { Pool } = await Promise.resolve().then(() => __importStar(require('pg')));
        const pool = new Pool({ connectionString: process.env.DATABASE_URL });
        try {
            const result = await pool.query(`
        SELECT table_schema, table_name, column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_schema NOT IN ('information_schema', 'pg_catalog')
        ORDER BY table_schema, table_name, ordinal_position
      `);
            for (const row of result.rows) {
                const key = `${row.table_schema}.${row.table_name}`;
                if (!tables[key])
                    tables[key] = [];
                tables[key].push(`  ${row.column_name} (${row.data_type}${row.is_nullable === 'YES' ? ', nullable' : ''})`);
            }
        }
        finally {
            await pool.end();
        }
    }
    let output = '';
    for (const [table, cols] of Object.entries(tables)) {
        output += `\nTable: ${table}\n${cols.join('\n')}\n`;
    }
    output += `\nTotal tables: ${Object.keys(tables).length}\n`;
    fs.writeFileSync(outPath, output);
    console.log(`Schema saved to db-schema.txt (${Object.keys(tables).length} tables)`);
}
readSchema().catch(console.error);
