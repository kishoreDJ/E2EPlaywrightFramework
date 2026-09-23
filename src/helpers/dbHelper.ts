import * as dotenv from 'dotenv';
dotenv.config();

// ==========================================
// Auto-detects PostgreSQL or MySQL from DATABASE_URL
// PostgreSQL: postgresql:// or postgres://
// MySQL:      mysql://
// ==========================================

type DbDriver = 'postgres' | 'mysql';

function getDriver(): DbDriver {
  const url = process.env.DATABASE_URL || '';
  if (url.startsWith('mysql://')) return 'mysql';
  return 'postgres';
}

// ==========================================
// PostgreSQL
// ==========================================

let pgPool: any;

async function pgQuery<T>(sql: string, params?: unknown[]): Promise<T[]> {
  if (!pgPool) {
    const { Pool } = await import('pg');
    pgPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 5,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
    });
    pgPool.on('error', (err: Error) => console.error('[DB] Pool error:', err.message));
  }
  const client = await pgPool.connect();
  try {
    const result = await client.query(sql, params);
    return result.rows as T[];
  } finally {
    client.release();
  }
}

async function closePg(): Promise<void> {
  if (pgPool) await pgPool.end();
}

// ==========================================
// MySQL
// ==========================================

let mysqlPool: any;

function parseMysqlUrl(url: string) {
  // mysql://user:password@host:port/database
  const match = url.match(/^mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)$/);
  if (!match) throw new Error('Invalid MySQL DATABASE_URL format');
  return {
    user: decodeURIComponent(match[1]),
    password: decodeURIComponent(match[2]),
    host: match[3],
    port: parseInt(match[4]),
    database: match[5],
  };
}

async function mysqlQuery<T>(sql: string, params?: unknown[]): Promise<T[]> {
  if (!mysqlPool) {
    const mysql = await import('mysql2/promise');
    const config = parseMysqlUrl(process.env.DATABASE_URL || '');
    mysqlPool = await mysql.createPool({
      ...config,
      connectionLimit: 5,
      connectTimeout: 10_000,
    });
  }
  const [rows] = await mysqlPool.execute(sql, params || []);
  return rows as T[];
}

async function closeMysql(): Promise<void> {
  if (mysqlPool) await mysqlPool.end();
}

// ==========================================
// Allure attachment helper
// ==========================================

async function allureAttachDb(sql: string, params: unknown[] | undefined, result: unknown[]): Promise<void> {
  try {
    const { allure } = await import('allure-playwright');
    await allure.attachment('DB Query', JSON.stringify({ sql: sql.trim(), params: params || [] }, null, 2), 'application/json');
    await allure.attachment('DB Result', JSON.stringify(result, null, 2), 'application/json');
  } catch {
    // allure not available — skip silently
  }
}

// ==========================================
// Public API — works for both PostgreSQL and MySQL
// ==========================================

export async function query<T = Record<string, unknown>>(
  sql: string,
  params?: unknown[]
): Promise<T[]> {
  const driver = getDriver();
  console.log(`[DB] Using ${driver} driver`);
  const result = driver === 'mysql' ? await mysqlQuery<T>(sql, params) : await pgQuery<T>(sql, params);
  await allureAttachDb(sql, params, result as unknown[]);
  return result;
}

export async function closeDb(): Promise<void> {
  const driver = getDriver();
  return driver === 'mysql' ? closeMysql() : closePg();
}
